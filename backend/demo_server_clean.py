#!/usr/bin/env python3
"""
RuralIQ Demo Server with Comprehensive Sikkim SCA Data
Supports 80 villages across 4 districts with realistic SC population data
"""

from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import json
from datetime import datetime

# Create FastAPI app
app = FastAPI(title="RuralIQ API", description="Smart village gap detection and SCA scheme management")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load comprehensive Sikkim SC villages data
def load_sikkim_data():
    """Load comprehensive Sikkim village data with 80 villages across 4 districts"""
    try:
        with open("sikkim_villages_data.json", "r", encoding="utf-8") as f:
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
                                 60 if village.get("electricity", "12-18hrs") == "12-18hrs" else 30,
                    "schools": 1 if village.get("school_distance", 5) <= 5 else 0,
                    "health_centers": 1 if village.get("healthcare_distance", 10) <= 10 else 0,
                    "toilets": max(30, min(90, int(village["sc_percentage"] * 4))),
                    "internet": max(5, min(50, int(village["sc_percentage"] * 2)))
                },
                "priority_score": village.get("priority_score", 0),
                "literacy_rate": village.get("literacy_rate", 75.0),
                "roads_connectivity": village.get("roads_connectivity", "fair")
            }
            villages.append(transformed_village)
        
        print(f"✅ Loaded {len(villages)} villages from comprehensive Sikkim data")
        return villages
        
    except FileNotFoundError:
        print("⚠️  Sikkim data file not found, using minimal mock data")
        return [
            {
                "id": "sk001",
                "name": "Gangtok",
                "district": "East Sikkim", 
                "state": "Sikkim",
                "population": 2140,
                "sc_population": 245,
                "sc_ratio": 11.45,
                "amenities": {"village_id": "sk001", "water": 1, "electricity": 80, "schools": 1, "health_centers": 1, "toilets": 60, "internet": 40}
            }
        ]

# Load village data
sikkim_villages = load_sikkim_data()

# SCA scheme projects for demonstration
sikkim_projects = [
    {
        "id": "p001",
        "village_id": "sk_1104_001",  # East Sikkim village
        "name": "Water Supply Infrastructure - Gangtok",
        "type": "infrastructure",
        "description": "Establishment of water supply system for SC community",
        "budget": "₹15,00,000",
        "timeline": "12 months",
        "priority": "Critical",
        "contact_person": "Pemba Sherpa",
        "phone_number": "+91-9876543210",
        "progress_pct": 25.0,
        "status": "pending_state",
        "created_at": "2024-01-15T09:30:00Z",
        "submitted_by": "East Sikkim District Officer"
    },
    {
        "id": "p002", 
        "village_id": "sk_1103_001",  # South Sikkim village
        "name": "Educational Infrastructure - Namchi",
        "type": "education",
        "description": "Construction of primary school for SC children",
        "budget": "₹25,00,000",
        "timeline": "18 months",
        "priority": "High",
        "contact_person": "Karma Lepcha",
        "phone_number": "+91-9876543211",
        "progress_pct": 0.0,
        "status": "pending_admin",
        "created_at": "2024-01-20T10:15:00Z",
        "submitted_by": "South Sikkim District Officer"
    },
    {
        "id": "p003",
        "village_id": "sk_1102_001",  # West Sikkim village  
        "name": "Healthcare Center - Pelling",
        "type": "healthcare",
        "description": "Primary healthcare center for SC community",
        "budget": "₹20,00,000",
        "timeline": "15 months",
        "priority": "Critical",
        "contact_person": "Tshering Bhutia",
        "phone_number": "+91-9876543212",
        "progress_pct": 60.0,
        "status": "approved",
        "created_at": "2023-12-10T08:45:00Z",
        "approved_at": "2024-01-05T14:20:00Z",
        "approved_by": "Admin"
    }
]

# Mock users for SCA scheme (all districts + state + admin)
mock_users = [
    {"email": "admin@example.com", "password": "password", "name": "Admin User", "role": "admin", "state": None, "district": None},
    {"email": "sikkim.state@gov.in", "password": "password", "name": "Sikkim State Officer", "role": "state", "state": "Sikkim", "district": None},
    {"email": "east.sikkim@gov.in", "password": "password", "name": "East Sikkim District Officer", "role": "district", "state": "Sikkim", "district": "East Sikkim"},
    {"email": "west.sikkim@gov.in", "password": "password", "name": "West Sikkim District Officer", "role": "district", "state": "Sikkim", "district": "West Sikkim"},
    {"email": "north.sikkim@gov.in", "password": "password", "name": "North Sikkim District Officer", "role": "district", "state": "Sikkim", "district": "North Sikkim"},
    {"email": "south.sikkim@gov.in", "password": "password", "name": "South Sikkim District Officer", "role": "district", "state": "Sikkim", "district": "South Sikkim"}
]

# States and districts structure
states_districts = {
    "Sikkim": ["East Sikkim", "West Sikkim", "North Sikkim", "South Sikkim"],
    "West Bengal": ["Kolkata", "Darjeeling", "Jalpaiguri", "Cooch Behar"],
    "Assam": ["Kamrup", "Dibrugarh", "Guwahati", "Silchar"],
}

# Pydantic models
class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

# API Routes
@app.get("/")
async def root():
    return {"message": "RuralIQ API - SCA Scheme Management", "version": "2.0", "villages": len(sikkim_villages)}

@app.post("/api/auth/login")
async def login(credentials: UserLogin):
    user = next((u for u in mock_users if u["email"] == credentials.email and u["password"] == credentials.password), None)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    return {
        "access_token": "demo_token_123",
        "token_type": "bearer",
        "user": {
            "id": "1",
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "state": user.get("state"),
            "district": user.get("district")
        }
    }

@app.get("/api/states")
async def get_states():
    return {"states": list(states_districts.keys())}

@app.get("/api/states/{state}/districts")
async def get_districts_by_state(state: str):
    if state not in states_districts:
        raise HTTPException(status_code=404, detail="State not found")
    return {"districts": states_districts[state]}

@app.get("/api/districts/{state}")
async def get_districts(state: str):
    if state not in states_districts:
        raise HTTPException(status_code=404, detail="State not found")
    return {"districts": states_districts[state]}

@app.get("/api/villages")
async def get_villages(state: Optional[str] = None, district: Optional[str] = None):
    """Get villages with optional state/district filtering for SCA scheme"""
    filtered_villages = sikkim_villages
    
    if state:
        filtered_villages = [v for v in filtered_villages if v["state"] == state]
    if district:
        filtered_villages = [v for v in filtered_villages if v["district"] == district]
    
    return {"villages": filtered_villages, "count": len(filtered_villages)}

@app.get("/api/villages/{village_id}")
async def get_village(village_id: str):
    village = next((v for v in sikkim_villages if v["id"] == village_id), None)
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")
    return village

@app.get("/api/gaps")
async def get_gaps(village_id: Optional[str] = None, district: Optional[str] = None):
    """Detect infrastructure gaps for SCA scheme prioritization"""
    gaps = []
    target_villages = sikkim_villages
    
    if village_id:
        target_villages = [v for v in sikkim_villages if v["id"] == village_id]
    elif district:
        target_villages = [v for v in sikkim_villages if v["district"] == district]
    
    for village in target_villages:
        village_gaps = []
        amenities = village["amenities"]
        
        # Critical gaps affecting SC community
        if amenities["water"] == 0:
            village_gaps.append({"type": "water", "severity": "critical", "description": "No clean water access"})
        if amenities["health_centers"] == 0:
            village_gaps.append({"type": "healthcare", "severity": "critical", "description": "No healthcare facility"})
        if amenities["schools"] == 0:
            village_gaps.append({"type": "education", "severity": "high", "description": "No educational facility"})
        if amenities["electricity"] < 50:
            village_gaps.append({"type": "electricity", "severity": "medium", "description": "Inadequate power supply"})
        if amenities["toilets"] < 40:
            village_gaps.append({"type": "sanitation", "severity": "high", "description": "Poor sanitation facilities"})
        
        if village_gaps:
            gaps.append({
                "village_id": village["id"],
                "village_name": village["name"],
                "district": village["district"],
                "sc_population": village["sc_population"],
                "priority_score": village.get("priority_score", 0),
                "gaps": village_gaps
            })
    
    return {"gaps": gaps, "count": len(gaps)}

@app.get("/api/projects")
async def get_projects(district: Optional[str] = None, status: Optional[str] = None):
    """Get SCA scheme projects with filtering"""
    filtered_projects = sikkim_projects
    
    if district:
        # Filter by district through village lookup
        district_village_ids = [v["id"] for v in sikkim_villages if v["district"] == district]
        filtered_projects = [p for p in filtered_projects if p["village_id"] in district_village_ids]
    
    if status:
        filtered_projects = [p for p in filtered_projects if p["status"] == status]
    
    return {"projects": filtered_projects, "count": len(filtered_projects)}

@app.post("/api/projects")
async def create_project(project_data: dict = Body(...)):
    """Create new SCA scheme project"""
    new_project = {
        "id": f"p{len(sikkim_projects) + 1:03d}",
        "village_id": project_data["village_id"],
        "name": project_data["name"],
        "type": project_data["type"],
        "description": project_data.get("description", ""),
        "budget": project_data.get("budget", "₹10,00,000"),
        "timeline": project_data.get("timeline", "12 months"),
        "priority": project_data.get("priority", "Medium"),
        "contact_person": project_data.get("contact_person", "District Officer"),
        "phone_number": project_data.get("phone_number", "+91-9876543210"),
        "progress_pct": 0.0,
        "status": "pending_state",  # SCA workflow starts with state approval
        "created_at": datetime.now().isoformat() + "Z",
        "submitted_by": project_data.get("submitted_by", "District Officer")
    }
    
    sikkim_projects.append(new_project)
    return {"message": "Project created successfully", "project": new_project}

@app.put("/api/projects/{project_id}")
async def update_project(project_id: str, data: dict = Body(...)):
    """Update project status and details - implements SCA approval workflow"""
    for project in sikkim_projects:
        if project["id"] == project_id:
            # SCA scheme approval workflow
            if "status" in data:
                if data["status"] == "pending_state":
                    project["status"] = "pending_state"
                    project["submitted_to_state"] = datetime.now().isoformat()
                elif data["status"] == "pending_admin":
                    project["status"] = "pending_admin" 
                    project["submitted_to_admin"] = datetime.now().isoformat()
                elif data["status"] == "approved":
                    project["status"] = "approved"
                    project["approved_at"] = datetime.now().isoformat()
                    project["approved_by"] = data.get("approved_by", "admin")
                elif data["status"] == "rejected":
                    project["status"] = "rejected"
                    project["rejected_at"] = datetime.now().isoformat()
                    project["rejection_reason"] = data.get("rejection_reason", "Not specified")
                elif data["status"] == "in_progress":
                    project["status"] = "in_progress"
                    project["started_at"] = datetime.now().isoformat()
                elif data["status"] == "completed":
                    project["status"] = "completed"
                    project["completed_at"] = datetime.now().isoformat()
            
            # Update other allowed fields
            allowed_fields = ["budget", "description", "timeline", "priority", "contact_person", "phone_number", "progress_pct"]
            for key in allowed_fields:
                if key in data:
                    project[key] = data[key]
            
            return {"message": "Project updated successfully", "project": project}
    
    raise HTTPException(status_code=404, detail="Project not found")

@app.get("/api/dashboard")
async def get_dashboard_data(role: Optional[str] = None, state: Optional[str] = None, district: Optional[str] = None):
    """Dashboard data for SCA scheme with role-based filtering"""
    
    # Filter villages based on role
    filtered_villages = sikkim_villages
    if state:
        filtered_villages = [v for v in filtered_villages if v["state"] == state]
    if district:
        filtered_villages = [v for v in filtered_villages if v["district"] == district]
    
    # Calculate statistics
    total_villages = len(filtered_villages)
    total_sc_population = sum(v["sc_population"] for v in filtered_villages)
    total_population = sum(v["population"] for v in filtered_villages)
    
    # Project statistics
    filtered_projects = sikkim_projects
    if district:
        district_village_ids = [v["id"] for v in filtered_villages]
        filtered_projects = [p for p in filtered_projects if p["village_id"] in district_village_ids]
    
    project_stats = {
        "total": len(filtered_projects),
        "pending_state": len([p for p in filtered_projects if p["status"] == "pending_state"]),
        "pending_admin": len([p for p in filtered_projects if p["status"] == "pending_admin"]),
        "approved": len([p for p in filtered_projects if p["status"] == "approved"]),
        "in_progress": len([p for p in filtered_projects if p["status"] == "in_progress"]),
        "completed": len([p for p in filtered_projects if p["status"] == "completed"])
    }
    
    # District breakdown for state users
    district_data = {}
    if not district:  # Show all districts for state/admin users
        for dist in ["East Sikkim", "West Sikkim", "North Sikkim", "South Sikkim"]:
            dist_villages = [v for v in filtered_villages if v["district"] == dist]
            district_data[dist] = {
                "villages": len(dist_villages),
                "sc_population": sum(v["sc_population"] for v in dist_villages),
                "total_population": sum(v["population"] for v in dist_villages)
            }
    
    return {
        "summary": {
            "total_villages": total_villages,
            "total_sc_population": total_sc_population,
            "total_population": total_population,
            "sc_percentage": round((total_sc_population / total_population * 100) if total_population > 0 else 0, 2)
        },
        "projects": project_stats,
        "districts": district_data,
        "role_context": {
            "role": role,
            "state": state,
            "district": district
        }
    }

if __name__ == "__main__":
    print("🚀 Starting RuralIQ SCA Scheme Server...")
    print("📊 SCA Features:")
    print("  - Comprehensive Sikkim Data (80 villages, 4 districts)")
    print("  - Role-based Authentication (Admin, State, District Officers)")
    print("  - SCA Approval Workflow (District → State → Admin)")
    print("  - Real SC Population Data")
    print("  - API Documentation at http://localhost:8001/docs")
    print("")
    print("🌐 Access Points:")
    print("  - API Server: http://localhost:8001")
    print("  - API Docs: http://localhost:8001/docs")
    print("  - Frontend: http://localhost:3001")
    print("")
    uvicorn.run(app, host="0.0.0.0", port=8001)