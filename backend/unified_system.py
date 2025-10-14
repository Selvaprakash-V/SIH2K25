#!/usr/bin/env python3
"""
Unified District & State Management System
- Each district fetches own data from MongoDB
- Uniform gap analysis and data consistency  
- Project approval workflow between district and state officers
- Real district counts from database
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from datetime import datetime, timedelta
import uuid
from typing import List, Optional
from models import *
from auth import get_current_user, create_access_token, verify_password, get_password_hash

# Load environment
load_dotenv()

app = FastAPI(title="Unified District-State Management System")

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_mongodb_collection(collection_name: str):
    """Get MongoDB collection"""
    uri = os.getenv("MONGO_URI")
    client = MongoClient(uri)
    db = client["sih2"]
    return db[collection_name]

def get_district_data_from_mongodb(district_name: str):
    """Fetch real district data from MongoDB Sikkim collection"""
    collection = get_mongodb_collection("sikkim")
    
    # Get all documents for this district
    docs = list(collection.find({"district_name": district_name}))
    
    if not docs:
        return None
    
    # Calculate real statistics
    total_villages = len(docs)
    total_population = sum(int(doc.get('TOT_P', 0)) for doc in docs)
    male_pop = sum(int(doc.get('TOT_M', 0)) for doc in docs)
    female_pop = sum(int(doc.get('TOT_F', 0)) for doc in docs)
    households = sum(int(doc.get('No_HH_Head', 0)) for doc in docs)
    literate = sum(int(doc.get('P_LIT', 0)) for doc in docs)
    illiterate = sum(int(doc.get('P_ILL', 0)) for doc in docs)
    workers = sum(int(doc.get('TOT_WORK_P', 0)) for doc in docs)
    
    # Calculate rates
    literacy_rate = round((literate / (literate + illiterate) * 100) if (literate + illiterate) > 0 else 0, 2)
    work_participation_rate = round((workers / total_population * 100) if total_population > 0 else 0, 2)
    
    # Get village details
    villages = []
    for doc in docs:
        village = {
            'name': doc.get('Name', 'Unknown'),
            'population': int(doc.get('TOT_P', 0)),
            'households': int(doc.get('No_HH_Head', 0)),
            'literacy_rate': round((int(doc.get('P_LIT', 0)) / max(1, int(doc.get('P_LIT', 0)) + int(doc.get('P_ILL', 0)))) * 100, 2)
        }
        villages.append(village)
    
    return {
        'district_name': district_name,
        'total_villages': total_villages,
        'total_population': total_population,
        'literacy_rate': literacy_rate,
        'work_participation_rate': work_participation_rate,
        'households': households,
        'villages': sorted(villages, key=lambda x: x['population'], reverse=True)
    }

def generate_unified_gaps(district_name: str, district_data: dict) -> List[dict]:
    """Generate unified gaps based on real district data"""
    gaps = []
    
    # Education gaps
    if district_data['literacy_rate'] < 70:
        gaps.append({
            'id': str(uuid.uuid4()),
            'district': district_name,
            'gap_type': 'education',
            'severity': 'high' if district_data['literacy_rate'] < 60 else 'medium',
            'severity_score': round(100 - district_data['literacy_rate'], 1),
            'description': f"Low literacy rate ({district_data['literacy_rate']}%) requires educational infrastructure",
            'affected_population': int(district_data['total_population'] * (1 - district_data['literacy_rate']/100)),
            'estimated_cost_to_fix': district_data['total_villages'] * 2000000,  # 20 lakhs per village
            'priority_rank': 1
        })
    
    # Employment gaps  
    if district_data['work_participation_rate'] < 50:
        gaps.append({
            'id': str(uuid.uuid4()),
            'district': district_name,
            'gap_type': 'healthcare',
            'severity': 'high',
            'severity_score': round(50 - district_data['work_participation_rate'], 1),
            'description': f"Low employment rate ({district_data['work_participation_rate']}%) needs skill development",
            'affected_population': int(district_data['total_population'] * 0.3),
            'estimated_cost_to_fix': district_data['total_villages'] * 1500000,  # 15 lakhs per village
            'priority_rank': 2
        })
    
    # Infrastructure gaps for large districts
    if district_data['total_villages'] > 12:
        gaps.append({
            'id': str(uuid.uuid4()),
            'district': district_name,
            'gap_type': 'roads',
            'severity': 'medium',
            'severity_score': min(district_data['total_villages'] * 2, 100),
            'description': f"Rural connectivity issues in {district_data['total_villages']} villages",
            'affected_population': int(district_data['total_population'] * 0.4),
            'estimated_cost_to_fix': district_data['total_villages'] * 3000000,  # 30 lakhs per village
            'priority_rank': 3
        })
    
    # Water supply gaps
    gaps.append({
        'id': str(uuid.uuid4()),
        'district': district_name,
        'gap_type': 'water',
        'severity': 'medium',
        'severity_score': 45.0,
        'description': f"Water supply infrastructure needs in {district_name}",
        'affected_population': int(district_data['total_population'] * 0.25),
        'estimated_cost_to_fix': district_data['total_villages'] * 1000000,  # 10 lakhs per village
        'priority_rank': 4
    })
    
    return gaps

# ===================== AUTHENTICATION ENDPOINTS =====================

@app.post("/api/auth/register", response_model=UserResponse)
async def register_user(user: UserCreate):
    """Register new user"""
    try:
        users_collection = get_mongodb_collection("users")
        
        # Check if user exists
        existing_user = users_collection.find_one({"email": user.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="User already exists")
        
        # Hash password and create user
        hashed_password = get_password_hash(user.password)
        user_doc = {
            "_id": str(uuid.uuid4()),
            "name": user.name,
            "email": user.email,
            "password": hashed_password,
            "role": user.role,
            "district": user.district,
            "created_at": datetime.utcnow()
        }
        
        users_collection.insert_one(user_doc)
        
        return UserResponse(
            id=user_doc["_id"],
            name=user_doc["name"],
            email=user_doc["email"],
            role=user_doc["role"],
            district=user_doc.get("district")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/login", response_model=TokenResponse)
async def login_user(user: UserLogin):
    """Login user"""
    try:
        users_collection = get_mongodb_collection("users")
        
        # Find user
        user_doc = users_collection.find_one({"email": user.email})
        if not user_doc or not verify_password(user.password, user_doc["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Create token
        access_token = create_access_token(data={"sub": user_doc["email"]})
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=user_doc["_id"],
                name=user_doc["name"],
                email=user_doc["email"],
                role=user_doc["role"],
                district=user_doc.get("district")
            )
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===================== DISTRICT DATA ENDPOINTS =====================

@app.get("/api/districts", response_model=List[DistrictStats])
async def get_all_districts():
    """Get all districts with real data from MongoDB"""
    try:
        districts = ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"]
        district_stats = []
        
        for district in districts:
            # Get real data from MongoDB
            district_data = get_district_data_from_mongodb(district)
            if not district_data:
                continue
                
            # Get projects count
            projects_collection = get_mongodb_collection("projects")
            projects_count = projects_collection.count_documents({"district": district})
            pending_approvals = projects_collection.count_documents({
                "district": district, 
                "status": "pending_approval"
            })
            
            # Generate gaps
            gaps = generate_unified_gaps(district, district_data)
            
            district_stats.append(DistrictStats(
                district_name=district,
                total_villages=district_data['total_villages'],
                total_population=district_data['total_population'],
                literacy_rate=district_data['literacy_rate'],
                work_participation_rate=district_data['work_participation_rate'],
                households=district_data['households'],
                problems_count=len(gaps),
                projects_count=projects_count,
                pending_approvals=pending_approvals
            ))
        
        return district_stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/districts/{district_name}")
async def get_district_details(district_name: str):
    """Get detailed district information with unified data"""
    try:
        # Get real data from MongoDB
        district_data = get_district_data_from_mongodb(district_name)
        if not district_data:
            raise HTTPException(status_code=404, detail=f"District {district_name} not found")
        
        # Get projects
        projects_collection = get_mongodb_collection("projects")
        projects = list(projects_collection.find({"district": district_name}))
        
        # Get gaps (unified)
        gaps = generate_unified_gaps(district_name, district_data)
        
        return {
            "district_data": district_data,
            "gaps": gaps,
            "projects": projects,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/districts/{district_name}/gaps")
async def get_district_gaps(district_name: str):
    """Get unified gap analysis for district"""
    try:
        district_data = get_district_data_from_mongodb(district_name)
        if not district_data:
            raise HTTPException(status_code=404, detail=f"District {district_name} not found")
        
        gaps = generate_unified_gaps(district_name, district_data)
        
        return {
            "district": district_name,
            "gaps": gaps,
            "total_gaps": len(gaps),
            "critical_gaps": len([g for g in gaps if g['severity'] == 'critical']),
            "high_priority_gaps": len([g for g in gaps if g['severity'] == 'high']),
            "estimated_total_cost": sum(g['estimated_cost_to_fix'] for g in gaps),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===================== PROJECT MANAGEMENT ENDPOINTS =====================

@app.post("/api/projects", response_model=ProjectResponse)
async def create_project(project: ProjectCreate, current_user: dict = Depends(get_current_user)):
    """District officer creates a project"""
    try:
        if current_user["role"] not in ["district", "admin"]:
            raise HTTPException(status_code=403, detail="Only district officers can create projects")
        
        projects_collection = get_mongodb_collection("projects")
        
        # Check if project already exists for this village
        existing_project = projects_collection.find_one({
            "village_id": project.village_id,
            "name": project.name,
            "status": {"$nin": ["completed", "cancelled"]}
        })
        
        if existing_project:
            raise HTTPException(status_code=400, detail="Similar project already exists for this village")
        
        project_doc = {
            "_id": str(uuid.uuid4()),
            "village_id": project.village_id,
            "village_name": "Sample Village",  # You'd get this from village data
            "district": project.created_by_district,
            "name": project.name,
            "type": project.type,
            "description": project.description,
            "estimated_cost": project.estimated_cost,
            "estimated_duration_months": project.estimated_duration_months,
            "priority": project.priority,
            "status": ProjectStatus.PENDING_APPROVAL,
            "progress_pct": 0.0,
            "created_by_district": project.created_by_district,
            "created_by_user": current_user["id"],
            "created_at": datetime.utcnow()
        }
        
        projects_collection.insert_one(project_doc)
        
        return ProjectResponse(**project_doc, id=project_doc["_id"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/projects/pending-approval", response_model=List[ProjectResponse])
async def get_pending_approvals(current_user: dict = Depends(get_current_user)):
    """State officer gets projects pending approval"""
    try:
        if current_user["role"] != "state":
            raise HTTPException(status_code=403, detail="Only state officers can view pending approvals")
        
        projects_collection = get_mongodb_collection("projects")
        projects = list(projects_collection.find({"status": "pending_approval"}))
        
        return [ProjectResponse(**project, id=project["_id"]) for project in projects]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/projects/{project_id}/approve")
async def approve_project(project_id: str, approval: ProjectApproval, current_user: dict = Depends(get_current_user)):
    """State officer approves/rejects a project"""
    try:
        if current_user["role"] != "state":
            raise HTTPException(status_code=403, detail="Only state officers can approve projects")
        
        projects_collection = get_mongodb_collection("projects")
        
        update_data = {
            "status": approval.status,
            "approved_by": approval.approved_by,
            "approved_at": datetime.utcnow(),
            "approval_notes": approval.approval_notes,
            "approved_budget": approval.approved_budget
        }
        
        result = projects_collection.update_one(
            {"_id": project_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return {"message": f"Project {approval.status}", "project_id": project_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/projects/district/{district_name}")
async def get_district_projects(district_name: str, current_user: dict = Depends(get_current_user)):
    """Get all projects for a district"""
    try:
        projects_collection = get_mongodb_collection("projects")
        projects = list(projects_collection.find({"district": district_name}))
        
        return [ProjectResponse(**project, id=project["_id"]) for project in projects]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===================== DASHBOARD ENDPOINTS =====================

@app.get("/api/dashboard/state")
async def get_state_dashboard(current_user: dict = Depends(get_current_user)):
    """State officer dashboard with all districts"""
    try:
        if current_user["role"] != "state":
            raise HTTPException(status_code=403, detail="Only state officers can access state dashboard")
        
        districts_data = await get_all_districts()
        
        # Calculate totals
        total_population = sum(d.total_population for d in districts_data)
        total_villages = sum(d.total_villages for d in districts_data)
        total_projects = sum(d.projects_count for d in districts_data)
        pending_approvals = sum(d.pending_approvals for d in districts_data)
        
        return {
            "summary": DashboardStats(
                total_districts=len(districts_data),
                total_villages=total_villages,
                total_population=total_population,
                total_projects=total_projects,
                pending_approvals=pending_approvals,
                completed_projects=0,  # Calculate from projects
                total_gaps=sum(d.problems_count for d in districts_data),
                critical_gaps=0  # Calculate from gaps
            ),
            "districts": districts_data,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/district/{district_name}")
async def get_district_dashboard(district_name: str, current_user: dict = Depends(get_current_user)):
    """District officer dashboard"""
    try:
        if current_user["role"] == "district" and current_user.get("district") != district_name:
            raise HTTPException(status_code=403, detail="Access denied to this district")
        
        return await get_district_details(district_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {
        "message": "Unified District-State Management System",
        "version": "2.0",
        "features": [
            "Real district data from MongoDB",
            "Unified gap analysis",
            "Project approval workflow",
            "Role-based access control"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)