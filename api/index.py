from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import os

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data for testing
MOCK_VILLAGES = [
    {
        "id": "1",
        "name": "Gangtok",
        "district": "East Sikkim",
        "state": "Sikkim",
        "population": 100000,
        "sc_population": 15000,
        "sc_ratio": 15.0
    },
    {
        "id": "2", 
        "name": "Namchi",
        "district": "South Sikkim",
        "state": "Sikkim",
        "population": 50000,
        "sc_population": 7500,
        "sc_ratio": 15.0
    }
]

@app.get("/")
async def root():
    return {"message": "RuralIQ API is running!", "status": "healthy"}

@app.get("/health")
async def health():
    return {"status": "healthy", "villages": len(MOCK_VILLAGES)}

@app.get("/villages")
async def get_villages():
    return {"villages": MOCK_VILLAGES}

@app.get("/states")
async def get_states():
    return {"states": ["Sikkim"]}

@app.get("/districts/{state}")
async def get_districts(state: str):
    if state.lower() == "sikkim":
        return {"districts": ["East Sikkim", "South Sikkim", "West Sikkim", "North Sikkim"]}
    return {"districts": []}

# Vercel handler
def handler(request):
    return app