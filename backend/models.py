from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "district"  # admin, state, district

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Village models
class VillageCreate(BaseModel):
    name: str
    district: str
    state: str
    population: int
    sc_ratio: float
    geo_lat: Optional[float] = None
    geo_long: Optional[float] = None

class AmenitiesCreate(BaseModel):
    village_id: str
    water: int  # 0 or 1 (available/not available)
    electricity: float  # percentage coverage
    schools: int  # count
    health_centers: int  # count
    toilets: float  # percentage coverage
    internet: float  # percentage coverage

class AmenitiesResponse(BaseModel):
    village_id: str
    water: int
    electricity: float
    schools: int
    health_centers: int
    toilets: float
    internet: float

class VillageResponse(BaseModel):
    id: str
    name: str
    district: str
    state: str
    population: int
    sc_ratio: float
    geo_lat: Optional[float] = None
    geo_long: Optional[float] = None
    amenities: Optional[AmenitiesResponse] = None

# Project models
class ProjectCreate(BaseModel):
    village_id: str
    name: str
    type: str  # education, healthcare, water, electricity, etc.
    progress_pct: float = 0.0
    status: str = "planned"  # planned, in_progress, completed

class ProjectResponse(BaseModel):
    id: str
    village_id: str
    name: str
    type: str
    progress_pct: float
    status: str
    created_at: Optional[datetime] = None

# Gap models
class GapResponse(BaseModel):
    village_id: str
    gap_type: str
    severity_score: float
    details: dict
    last_updated: datetime

# Report models
class ReportCreate(BaseModel):
    village_id: str
    description: str
    gps_lat: float
    gps_long: float
    image_url: Optional[str] = None

class ReportResponse(BaseModel):
    id: str
    user_id: str
    village_id: str
    description: str
    gps: dict
    image_url: Optional[str] = None
    timestamp: datetime
    synced: bool = True