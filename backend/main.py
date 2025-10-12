from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
from typing import Optional, List
import os
from dotenv import load_dotenv
import uvicorn

# Load environment variables
load_dotenv()

from models import *
from auth import get_current_user, create_access_token, verify_password, get_password_hash
from database import get_database
from gap_detection import calculate_village_gaps
from utils import upload_image_to_cloudinary

app = FastAPI(title="RuralIQ API", description="Smart Village Gap Detection System", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

@app.get("/")
async def root():
    return {"message": "RuralIQ API is running", "version": "1.0.0"}

# Authentication endpoints
@app.post("/api/auth/login", response_model=TokenResponse)
async def login(user_credentials: UserLogin):
    db = await get_database()
    user = await db.users.find_one({"email": user_credentials.email})
    
    if not user or not verify_password(user_credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    access_token = create_access_token(data={"sub": user["email"], "role": user["role"]})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    }

@app.post("/api/auth/signup", response_model=UserResponse)
async def signup(user_data: UserCreate):
    db = await get_database()
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user_doc = {
        "name": user_data.name,
        "email": user_data.email,
        "role": user_data.role,
        "password_hash": hashed_password,
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    
    return UserResponse(
        id=str(user_doc["_id"]),
        name=user_doc["name"],
        email=user_doc["email"],
        role=user_doc["role"]
    )

# Village endpoints
@app.get("/api/villages", response_model=List[VillageResponse])
async def get_villages(
    state: Optional[str] = None,
    district: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    db = await get_database()
    
    # Build filter
    filter_dict = {}
    if state:
        filter_dict["state"] = state
    if district:
        filter_dict["district"] = district
    
    villages = await db.villages.find(filter_dict).skip(skip).limit(limit).to_list(length=limit)
    
    # Get amenities for each village
    result = []
    for village in villages:
        amenities = await db.amenities.find_one({"village_id": str(village["_id"])})
        
        village_response = VillageResponse(
            id=str(village["_id"]),
            name=village["name"],
            district=village["district"],
            state=village["state"],
            population=village["population"],
            sc_ratio=village["sc_ratio"],
            geo_lat=village.get("geo_lat"),
            geo_long=village.get("geo_long"),
            amenities=AmenitiesResponse(**amenities) if amenities else None
        )
        result.append(village_response)
    
    return result

@app.post("/api/villages", response_model=VillageResponse)
async def create_village(
    village_data: VillageCreate,
    current_user: dict = Depends(get_current_user)
):
    # Only admin and field officers can create villages
    if current_user["role"] not in ["admin", "field_officer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    db = await get_database()
    
    # Create village
    village_doc = village_data.model_dump()
    village_doc["created_at"] = datetime.utcnow()
    
    result = await db.villages.insert_one(village_doc)
    village_doc["_id"] = result.inserted_id
    
    return VillageResponse(
        id=str(village_doc["_id"]),
        **{k: v for k, v in village_doc.items() if k != "_id"}
    )

@app.get("/api/villages/{village_id}", response_model=VillageResponse)
async def get_village(village_id: str, current_user: dict = Depends(get_current_user)):
    db = await get_database()
    
    try:
        from bson import ObjectId
        village = await db.villages.find_one({"_id": ObjectId(village_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid village ID"
        )
    
    if not village:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Village not found"
        )
    
    # Get amenities
    amenities = await db.amenities.find_one({"village_id": village_id})
    
    return VillageResponse(
        id=str(village["_id"]),
        name=village["name"],
        district=village["district"],
        state=village["state"],
        population=village["population"],
        sc_ratio=village["sc_ratio"],
        geo_lat=village.get("geo_lat"),
        geo_long=village.get("geo_long"),
        amenities=AmenitiesResponse(**amenities) if amenities else None
    )

# Gap detection endpoint
@app.get("/api/gaps")
async def get_gaps(
    village_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    db = await get_database()
    
    if village_id:
        # Get gaps for specific village
        gaps = await db.gaps.find_one({"village_id": village_id})
        if not gaps:
            # Calculate gaps if not found
            village = await db.villages.find_one({"_id": ObjectId(village_id)})
            amenities = await db.amenities.find_one({"village_id": village_id})
            
            if village and amenities:
                gaps = await calculate_village_gaps(village, amenities, db)
        
        return gaps
    else:
        # Get all gaps
        gaps = await db.gaps.find().to_list(length=1000)
        return gaps

# Recommendations endpoint
@app.get("/api/recommendations")
async def get_recommendations(
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    db = await get_database()
    
    # Get villages with highest severity scores
    pipeline = [
        {
            "$lookup": {
                "from": "gaps",
                "localField": "_id",
                "foreignField": "village_id",
                "as": "gaps"
            }
        },
        {
            "$unwind": {
                "path": "$gaps",
                "preserveNullAndEmptyArrays": True
            }
        },
        {
            "$sort": {"gaps.severity_score": -1}
        },
        {
            "$limit": limit
        }
    ]
    
    recommendations = await db.villages.aggregate(pipeline).to_list(length=limit)
    return recommendations

# Projects endpoints
@app.get("/api/projects", response_model=List[ProjectResponse])
async def get_projects(
    village_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    db = await get_database()
    
    filter_dict = {}
    if village_id:
        filter_dict["village_id"] = village_id
    if status:
        filter_dict["status"] = status
    
    projects = await db.projects.find(filter_dict).to_list(length=1000)
    
    result = []
    for project in projects:
        result.append(ProjectResponse(
            id=str(project["_id"]),
            village_id=project["village_id"],
            name=project["name"],
            type=project["type"],
            progress_pct=project["progress_pct"],
            status=project["status"],
            created_at=project.get("created_at")
        ))
    
    return result

@app.post("/api/projects", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectCreate,
    current_user: dict = Depends(get_current_user)
):
    # Only admin and field officers can create projects
    if current_user["role"] not in ["admin", "field_officer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    db = await get_database()
    
    project_doc = project_data.model_dump()
    project_doc["created_at"] = datetime.utcnow()
    
    result = await db.projects.insert_one(project_doc)
    project_doc["_id"] = result.inserted_id
    
    return ProjectResponse(
        id=str(project_doc["_id"]),
        **{k: v for k, v in project_doc.items() if k != "_id"}
    )

# Reports endpoints
@app.post("/api/reports")
async def create_report(
    village_id: str,
    description: str,
    gps_lat: float,
    gps_long: float,
    image: UploadFile = File(None),
    current_user: dict = Depends(get_current_user)
):
    db = await get_database()
    
    # Upload image if provided
    image_url = None
    if image:
        image_url = await upload_image_to_cloudinary(image)
    
    report_doc = {
        "user_id": current_user["id"],
        "village_id": village_id,
        "description": description,
        "gps": {"lat": gps_lat, "long": gps_long},
        "image_url": image_url,
        "timestamp": datetime.utcnow(),
        "synced": True
    }
    
    result = await db.reports.insert_one(report_doc)
    
    return {"id": str(result.inserted_id), "message": "Report created successfully"}

@app.post("/api/sync/reports")
async def sync_reports(
    reports: List[dict],
    current_user: dict = Depends(get_current_user)
):
    """Accept batched offline reports"""
    db = await get_database()
    
    processed = []
    for report_data in reports:
        try:
            # Add metadata
            report_data["user_id"] = current_user["id"]
            report_data["synced"] = True
            report_data["sync_timestamp"] = datetime.utcnow()
            
            # Check for duplicates using client_id if provided
            if "client_id" in report_data:
                existing = await db.reports.find_one({"client_id": report_data["client_id"]})
                if existing:
                    processed.append({"client_id": report_data["client_id"], "status": "duplicate"})
                    continue
            
            result = await db.reports.insert_one(report_data)
            processed.append({"client_id": report_data.get("client_id"), "id": str(result.inserted_id), "status": "success"})
            
        except Exception as e:
            processed.append({"client_id": report_data.get("client_id"), "status": "error", "error": str(e)})
    
    return {"processed": processed}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)