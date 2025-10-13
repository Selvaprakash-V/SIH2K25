from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import json

app = FastAPI(title="RuralIQ API - Demo Mode", description="Smart Village Gap Detection System", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load mock data
try:
    with open("../data/mock_villages.json", "r") as f:
        mock_villages = json.load(f)
except:
    mock_villages = []

# Mock users for demo
demo_users = [
    {"id": "1", "email": "admin@example.com", "name": "Admin User", "role": "admin", "password": "password"},
    {"id": "2", "email": "state@example.com", "name": "State User", "role": "state", "password": "password"},
    {"id": "3", "email": "district@example.com", "name": "District User", "role": "district", "password": "password"}
]

@app.get("/")
async def root():
    return {"message": "RuralIQ API is running in demo mode", "version": "1.0.0"}

@app.post("/api/auth/login")
async def login(credentials: dict):
    email = credentials.get("email")
    password = credentials.get("password")
    
    user = next((u for u in demo_users if u["email"] == email and u["password"] == password), None)
    if not user:
        return {"detail": "Invalid credentials"}, 401
    
    return {
        "access_token": "demo_token_123",
        "token_type": "bearer", 
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    }

@app.get("/api/villages")
async def get_villages():
    # Convert mock data to API format
    villages = []
    for i, village in enumerate(mock_villages):
        villages.append({
            "id": str(i + 1),
            "name": village["village"],
            "district": village["district"],
            "state": village["state"],
            "population": village["population"],
            "sc_ratio": village["SC_ratio"],
            "geo_lat": village["geo_lat"],
            "geo_long": village["geo_long"],
            "amenities": {
                "village_id": str(i + 1),
                "water": village["water"],
                "electricity": village["electricity"],
                "schools": village["schools"],
                "health_centers": village["health_centers"],
                "toilets": village["toilets"],
                "internet": village["internet"]
            }
        })
    return villages

@app.get("/api/gaps")
async def get_gaps():
    # Mock gap detection results
    gaps = []
    for i, village in enumerate(mock_villages):
        gaps_found = {}
        severity_score = 0
        
        # Simple gap detection logic
        if village["water"] == 0:
            gaps_found["water"] = {"status": "critical", "message": "No water access"}
            severity_score += 25
        
        if village["electricity"] < 80:
            status = "critical" if village["electricity"] < 50 else "moderate"
            gaps_found["electricity"] = {
                "status": status, 
                "message": f"Only {village['electricity']}% electricity coverage"
            }
            severity_score += (80 - village["electricity"]) * 0.25
        
        if village["schools"] == 0:
            gaps_found["education"] = {"status": "critical", "message": "No schools available"}
            severity_score += 15
            
        if village["health_centers"] == 0:
            gaps_found["healthcare"] = {"status": "critical", "message": "No health centers"}
            severity_score += 20
        
        gaps.append({
            "village_id": str(i + 1),
            "gaps": gaps_found,
            "severity_score": int(severity_score),
            "last_updated": datetime.now().isoformat()
        })
    
    return gaps

@app.get("/api/projects")
async def get_projects():
    # Mock projects data
    projects = [
        {
            "id": "1",
            "village_id": "1",
            "name": "School Building - Rampur",
            "type": "education",
            "progress_pct": 45.0,
            "status": "in_progress",
            "created_at": datetime.now().isoformat()
        },
        {
            "id": "2", 
            "village_id": "1",
            "name": "Water Supply System - Rampur",
            "type": "water",
            "progress_pct": 100.0,
            "status": "completed",
            "created_at": datetime.now().isoformat()
        },
        {
            "id": "3",
            "village_id": "2", 
            "name": "Health Center - Khargone",
            "type": "healthcare",
            "progress_pct": 20.0,
            "status": "planned",
            "created_at": datetime.now().isoformat()
        }
    ]
    return projects

@app.post("/api/projects")
async def create_project(project: dict):
    return {"id": "new_project_id", "message": "Project created successfully"}

@app.post("/api/reports")
async def create_report():
    return {"id": "new_report_id", "message": "Report created successfully"}

@app.get("/api/recommendations")
async def get_recommendations():
    # Return villages sorted by severity
    return mock_villages[:5]  # Top 5 villages needing attention

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)