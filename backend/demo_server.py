from fastapi import Body
# In-memory mock projects for update
mock_projects = [
    {
        "id": "1",
        "village_id": "1",
        "name": "School Building - Rampur",
        "type": "education",
        "progress_pct": 45.0,
        "status": "in_progress",
        "created_at": "2024-01-10T09:00:00Z"
    },
    {
        "id": "2",
        "village_id": "2",
        "name": "Water Supply - Dholpur",
        "type": "water",
        "progress_pct": 20.0,
        "status": "planned",
        "created_at": "2024-01-15T10:00:00Z"
    }
]
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from datetime import datetime

app = FastAPI(title="RuralIQ Demo API", description="Smart Village Gap Detection System", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data
mock_villages = [
    {
        "id": "1",
        "name": "Rampur",
        "district": "Guna",
        "state": "MP",
        "population": 2345,
        "sc_ratio": 68,
        "geo_lat": 24.6,
        "geo_long": 77.3,
        "amenities": {
            "village_id": "1",
            "water": 1,
            "electricity": 75,
            "schools": 1,
            "health_centers": 0,
            "toilets": 62,
            "internet": 45
        }
    },
    {
        "id": "2",
        "name": "Dholpur Kalan",
        "district": "Dholpur",
        "state": "Rajasthan",
        "population": 3200,
        "sc_ratio": 72,
        "geo_lat": 26.7,
        "geo_long": 77.9,
        "amenities": {
            "village_id": "2",
            "water": 0,
            "electricity": 35,
            "schools": 0,
            "health_centers": 0,
            "toilets": 25,
            "internet": 15
        }
    },
    {
        "id": "3",
        "name": "Khargone",
        "district": "Khargone",
        "state": "MP",
        "population": 1890,
        "sc_ratio": 45,
        "geo_lat": 21.8,
        "geo_long": 75.6,
        "amenities": {
            "village_id": "3",
            "water": 1,
            "electricity": 95,
            "schools": 2,
            "health_centers": 1,
            "toilets": 85,
            "internet": 70
        }
    }
]

mock_users = [
    {"email": "admin@example.com", "password": "password", "name": "Admin User", "role": "admin"},
    {"email": "state@example.com", "password": "password", "name": "State User", "role": "state"},
    {"email": "district@example.com", "password": "password", "name": "District User", "role": "district"}
]

# Models
class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

@app.get("/")
async def root():
    return {"message": "RuralIQ Demo API is running", "version": "1.0.0", "demo": True}

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
            "role": user["role"]
        }
    }

@app.get("/api/villages")
async def get_villages():
    return mock_villages

@app.get("/api/villages/{village_id}")
async def get_village(village_id: str):
    village = next((v for v in mock_villages if v["id"] == village_id), None)
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")
    return village

@app.get("/api/gaps")
async def get_gaps(village_id: Optional[str] = None):
    def calculate_gap(village):
        gaps = {}
        amenities = village["amenities"]
        severity_score = 0
        
        if amenities["water"] == 0:
            gaps["water"] = {"status": "critical", "message": "No water access available", "priority": "high"}
            severity_score += 25
            
        if amenities["electricity"] < 80:
            gaps["electricity"] = {"status": "moderate" if amenities["electricity"] > 50 else "critical", 
                                 "message": f"Only {amenities['electricity']}% electricity coverage", "priority": "high"}
            severity_score += (80 - amenities["electricity"]) * 0.25
            
        if amenities["schools"] == 0:
            gaps["education"] = {"status": "critical", "message": "No schools available", "priority": "high"}
            severity_score += 15
            
        if amenities["health_centers"] == 0:
            gaps["healthcare"] = {"status": "critical", "message": "No health centers available", "priority": "high"}
            severity_score += 20
            
        return {
            "village_id": village["id"],
            "village_name": village["name"],
            "gaps": gaps,
            "severity_score": round(severity_score),
            "last_updated": datetime.now().isoformat()
        }
    
    if village_id:
        village = next((v for v in mock_villages if v["id"] == village_id), None)
        if not village:
            raise HTTPException(status_code=404, detail="Village not found")
        return calculate_gap(village)
    
    return [calculate_gap(v) for v in mock_villages if calculate_gap(v)["gaps"]]

@app.get("/api/projects")
async def get_projects():
    return mock_projects
@app.put("/api/projects/{project_id}")
async def update_project(project_id: str, data: dict = Body(...)):
    for project in mock_projects:
        if project["id"] == project_id:
            # Only allow certain fields to be updated
            allowed_fields = [
                "budget", "description", "timeline", "priority", "contact_person", "phone_number", "additional_notes",
                "progress_pct", "status"
            ]
            for key in allowed_fields:
                if key in data:
                    project[key] = data[key]
            # Status workflow: district → pending_state, state → pending_admin, admin → approved
            if "status" in data:
                if data["status"] == "pending_state":
                    project["status"] = "pending_state"
                elif data["status"] == "pending_admin":
                    project["status"] = "pending_admin"
                elif data["status"] == "approved":
                    project["status"] = "approved"
            return {"message": "Project updated", "project": project}
    raise HTTPException(status_code=404, detail="Project not found")

@app.post("/api/projects")
async def create_project(project: dict):
    # Generate a new ID
    existing_projects = await get_projects()
    new_id = str(len(existing_projects) + 1)
    
    # Create project with additional district input fields
    new_project = {
        "id": new_id,
        "village_id": project.get("village_id", "1"),
        "name": project.get("name", "New Project"),
        "type": project.get("type", "general"),
        "progress_pct": project.get("progress_pct", 0.0),
        "status": project.get("status", "planned"),
        "budget": project.get("budget"),
        "timeline": project.get("timeline"),
        "priority": project.get("priority", "Medium"),
        "contact_person": project.get("contact_person"),
        "phone_number": project.get("phone_number"),
        "description": project.get("description"),
        "additional_notes": project.get("additional_notes"),
    "submitted_by": project.get("submitted_by", "district"),
        "created_at": datetime.now().isoformat()
    }
    
    return {"id": new_id, "message": "Project submitted successfully", "project": new_project}

@app.post("/api/reports")
async def create_report():
    return {"id": "demo_report_1", "message": "Demo report created successfully"}

@app.get("/api/recommendations")
async def get_recommendations():
    gaps = await get_gaps()
    return sorted(gaps, key=lambda x: x["severity_score"], reverse=True)[:5]

if __name__ == "__main__":
    print("🚀 Starting RuralIQ Demo Server...")
    print("📊 Demo Features:")
    print("  - 3 Sample Villages (Rampur, Dholpur Kalan, Khargone)")
    print("  - Mock Authentication (admin@example.com / password)")
    print("  - Gap Detection Algorithm")
    print("  - Project Tracking")
    print("  - API Documentation at http://localhost:8000/docs")
    print("")
    print("🌐 Access Points:")
    print("  - API Server: http://localhost:8000")
    print("  - API Docs: http://localhost:8000/docs")
    print("  - Frontend: Start with 'cd ../frontend && npm run dev'")
    print("")
    uvicorn.run(app, host="0.0.0.0", port=8000)