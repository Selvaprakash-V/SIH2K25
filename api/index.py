from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import json
from datetime import datetime
import os

# Create FastAPI app
app = FastAPI(title="RuralIQ API", description="Smart village gap detection and SCA scheme management")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://localhost:3002", 
        "http://localhost:3003", 
        "http://localhost:3005", 
        "http://localhost:5173",
        "https://ruraliq-6wqpar9xk-yugenjrs-projects.vercel.app",
        "https://*.vercel.app",
        "*"  # For production - you might want to restrict this
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load comprehensive Sikkim SC villages data
def load_sikkim_data():
    """Load comprehensive Sikkim village data with 80 villages across 4 districts"""
    try:
        # Try to load from current directory or backend directory
        data_path = "sikkim_villages_data.json"
        if not os.path.exists(data_path):
            data_path = "../backend/sikkim_villages_data.json"
        if not os.path.exists(data_path):
            data_path = "./backend/sikkim_villages_data.json"
            
        with open(data_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        # Transform data to match API expectations
        villages = []
        for village in data["villages"]:
            transformed_village = {
                "id": village["id"],
                "name": village["name"],
                "district": village["district"],
                "state": village["state"],
                "population": village["total_population"],
                "sc_population": village["sc_population"], 
                "sc_ratio": village["sc_percentage"],
                "geo_lat": 27.0 + hash(village["id"]) % 100 / 100,
                "geo_long": 88.0 + hash(village["name"]) % 100 / 100,
                "amenities": {
                    "village_id": village["id"],
                    "water": 1 if village.get("water_supply", "adequate") == "adequate" else 0,
                    "electricity": 80 if village.get("electricity", "24hrs") == "24hrs" else 
                                 50 if village.get("electricity", "16hrs") == "16hrs" else 20,
                    "education": 1 if village.get("school", "primary") in ["primary", "secondary"] else 0,
                    "healthcare": 1 if village.get("healthcare", "phc") in ["phc", "chc"] else 0,
                    "internet": 70 if village.get("internet", "good") == "good" else 
                              40 if village.get("internet", "fair") == "fair" else 10,
                    "roads": 1 if village.get("roads", "paved") == "paved" else 0
                },
                "gaps": {
                    "water_shortage": 1 if village.get("water_supply", "adequate") != "adequate" else 0,
                    "power_cuts": 1 if village.get("electricity", "24hrs") != "24hrs" else 0,
                    "no_school": 1 if village.get("school") == "none" else 0,
                    "no_healthcare": 1 if village.get("healthcare") == "none" else 0,
                    "poor_internet": 1 if village.get("internet", "good") == "poor" else 0,
                    "unpaved_roads": 1 if village.get("roads", "paved") != "paved" else 0
                },
                "schemes": {
                    "jal_jeevan_mission": village.get("schemes", {}).get("jal_jeevan_mission", 0),
                    "pm_awas_yojana": village.get("schemes", {}).get("pm_awas_yojana", 0),
                    "mgnrega": village.get("schemes", {}).get("mgnrega", 1),
                    "swachh_bharat": village.get("schemes", {}).get("swachh_bharat", 0),
                    "digital_india": village.get("schemes", {}).get("digital_india", 0),
                    "pmgsy": village.get("schemes", {}).get("pmgsy", 0)
                }
            }
            villages.append(transformed_village)
        
        return villages
    except Exception as e:
        print(f"Error loading Sikkim data: {e}")
        # Return empty list if file not found
        return []

# Load data at startup
SIKKIM_VILLAGES = load_sikkim_data()

@app.get("/")
async def root():
    return {"message": "RuralIQ API Server is running!", "total_villages": len(SIKKIM_VILLAGES)}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "villages_loaded": len(SIKKIM_VILLAGES)}

@app.get("/villages")
async def get_villages():
    """Get all villages with basic info"""
    return {"villages": [{"id": v["id"], "name": v["name"], "district": v["district"], "state": v["state"]} for v in SIKKIM_VILLAGES]}

@app.get("/states")
async def get_states():
    """Get all states"""
    states = list(set(v["state"] for v in SIKKIM_VILLAGES))
    return {"states": states}

@app.get("/districts/{state}")
async def get_districts(state: str):
    """Get districts for a state"""
    districts = list(set(v["district"] for v in SIKKIM_VILLAGES if v["state"] == state))
    return {"districts": districts}

@app.get("/villages/{state}")
async def get_villages_by_state(state: str):
    """Get villages for a state"""
    villages = [v for v in SIKKIM_VILLAGES if v["state"] == state]
    return {"villages": villages}

@app.get("/village/{village_id}")
async def get_village_details(village_id: str):
    """Get detailed information for a specific village"""
    village = next((v for v in SIKKIM_VILLAGES if str(v["id"]) == village_id), None)
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")
    return village

# For Vercel serverless deployment
def handler(request):
    return app(request)

# For local development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)