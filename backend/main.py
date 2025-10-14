from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
from typing import Optional, List
from bson import ObjectId
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
    # Only admin and state users can create villages
    if current_user["role"] not in ["admin", "state"]:
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
            village_id=project.get("village_id", ""),
            name=project.get("name", ""),
            type=project.get("type", ""),
            description=project.get("description", ""),
            estimated_cost=project.get("estimated_cost", 0),
            estimated_duration_months=project.get("estimated_duration_months", 6),
            priority=project.get("priority", "medium"),
            progress_pct=project.get("progress_pct", 0),
            status=project.get("status", "pending_state"),
            created_by=project.get("created_by", ""),
            created_by_district=project.get("created_by_district", ""),
            created_at=project.get("created_at"),
            approved_by=project.get("approved_by"),
            approved_at=project.get("approved_at"),
            approval_notes=project.get("approval_notes"),
            approved_budget=project.get("approved_budget")
        ))
    
    return result

@app.post("/api/projects", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectCreate,
    current_user: dict = Depends(get_current_user)
):
    # Only district users can create projects
    if current_user["role"] not in ["district", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    db = await get_database()
    
    project_doc = project_data.model_dump()
    project_doc["created_at"] = datetime.utcnow()
    project_doc["status"] = "pending_state"  # Start with state approval
    project_doc["created_by"] = current_user.get("name", "")
    project_doc["created_by_district"] = current_user.get("district", "")
    project_doc["progress_pct"] = 0  # Start at 0% progress
    
    result = await db.projects.insert_one(project_doc)
    project_doc["_id"] = result.inserted_id
    
    return ProjectResponse(
        id=str(project_doc["_id"]),
        **{k: v for k, v in project_doc.items() if k != "_id"}
    )

@app.put("/api/projects/{project_id}")
async def update_project(
    project_id: str,
    update_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update project status and details - implements district → state → central approval workflow"""
    db = await get_database()
    
    try:
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID"
        )
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_fields = {}
    
    # Handle status updates for approval workflow
    if "status" in update_data:
        new_status = update_data["status"]
        user_role = current_user.get("role")
        
        # State officer actions
        if user_role == "state" and project["status"] == "pending_state":
            if new_status == "pending_admin":
                update_fields["status"] = "pending_admin"
                update_fields["submitted_to_admin"] = datetime.utcnow()
                update_fields["state_approved_by"] = current_user.get("name", user_role)
            elif new_status == "rejected":
                update_fields["status"] = "rejected"
                update_fields["rejected_by"] = current_user.get("name", user_role)
                update_fields["rejected_at"] = datetime.utcnow()
                if "rejection_reason" in update_data:
                    update_fields["rejection_reason"] = update_data["rejection_reason"]
        
        # Central/Admin officer actions  
        elif user_role in ["admin", "central"] and project["status"] == "pending_admin":
            if new_status == "approved":
                update_fields["status"] = "approved"
                update_fields["approved_by"] = current_user.get("name", user_role)
                update_fields["approved_at"] = datetime.utcnow()
                if "approved_budget" in update_data:
                    update_fields["approved_budget"] = update_data["approved_budget"]
            elif new_status == "rejected":
                update_fields["status"] = "rejected"
                update_fields["rejected_by"] = current_user.get("name", user_role)
                update_fields["rejected_at"] = datetime.utcnow()
                if "rejection_reason" in update_data:
                    update_fields["rejection_reason"] = update_data["rejection_reason"]
        
        # Progress updates for approved projects
        elif project["status"] == "approved":
            if new_status == "in_progress":
                update_fields["status"] = "in_progress"
                update_fields["started_at"] = datetime.utcnow()
            elif new_status == "completed":
                update_fields["status"] = "completed"
                update_fields["completed_at"] = datetime.utcnow()
        
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to perform this action"
            )
    
    # Handle other field updates
    allowed_fields = ["progress_pct", "description", "notes", "estimated_cost", "priority"]
    for field in allowed_fields:
        if field in update_data:
            update_fields[field] = update_data[field]
    
    # Update last modified
    update_fields["updated_at"] = datetime.utcnow()
    
    # Perform the update
    result = await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {"$set": update_fields}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="No changes made to project")
    
    # Return updated project
    updated_project = await db.projects.find_one({"_id": ObjectId(project_id)})
    return {"message": "Project updated successfully", "project": updated_project}

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

# Village data upload endpoint
@app.post("/api/upload_village_data")
async def upload_village_data(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload village data via Excel/CSV file"""
    import pandas as pd
    import io
    
    # Check if user has permission (village functionaries can upload for their village)
    if current_user.get("role") not in ["village", "admin", "district", "state"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to upload village data"
        )
    
    # Check file format
    if not file.filename.lower().endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Excel (.xlsx, .xls) and CSV files are supported"
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Parse based on file type
        if file.filename.lower().endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
        
        # Basic validation - check if required columns exist
        required_columns = ['name', 'population']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
        
        db = await get_database()
        updated_count = 0
        created_count = 0
        
        # Process each row
        for _, row in df.iterrows():
            village_data = {
                "name": row.get('name'),
                "population": int(row.get('population', 0)),
                "state": row.get('state', current_user.get('state')),
                "district": row.get('district', current_user.get('district')),
                "sc_ratio": float(row.get('sc_ratio', 0)),
                "amenities": {
                    "water": int(row.get('water', 0)),
                    "electricity": float(row.get('electricity', 0)),
                    "schools": int(row.get('schools', 0)),
                    "health_centers": int(row.get('health_centers', 0)),
                    "toilets": float(row.get('toilets', 0)),
                    "internet": float(row.get('internet', 0))
                },
                "updated_at": datetime.utcnow()
            }
            
            # Check if village exists (by name and district)
            existing_village = await db.villages.find_one({
                "name": village_data["name"],
                "district": village_data["district"],
                "state": village_data["state"]
            })
            
            if existing_village:
                # Update existing village
                await db.villages.update_one(
                    {"_id": existing_village["_id"]},
                    {"$set": village_data}
                )
                updated_count += 1
            else:
                # Create new village
                village_data["created_at"] = datetime.utcnow()
                await db.villages.insert_one(village_data)
                created_count += 1
        
        return {
            "message": "Village data uploaded successfully",
            "created": created_count,
            "updated": updated_count,
            "total_rows": len(df)
        }
        
    except pd.errors.EmptyDataError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file: {str(e)}"
        )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)