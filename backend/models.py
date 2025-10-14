from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

# User models
class UserRole(str, Enum):
    ADMIN = "admin"
    STATE = "state"
    DISTRICT = "district"

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.DISTRICT
    district: Optional[str] = None  # Required for district officers

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    district: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Village models with database integration
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

# Enhanced Project models with approval workflow
class ProjectStatus(str, Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ProjectType(str, Enum):
    EDUCATION = "education"
    HEALTHCARE = "healthcare"
    WATER_SUPPLY = "water_supply"
    ELECTRICITY = "electricity"
    ROADS = "roads"
    INTERNET = "internet"
    SANITATION = "sanitation"
    AGRICULTURE = "agriculture"

class ProjectCreate(BaseModel):
    village_id: str
    name: str
    type: ProjectType
    description: str
    estimated_cost: float
    estimated_duration_months: int
    priority: str = "medium"  # low, medium, high, critical
    created_by_district: str  # District name

class ProjectUpdate(BaseModel):
    progress_pct: Optional[float] = None
    status: Optional[ProjectStatus] = None
    notes: Optional[str] = None

class ProjectApproval(BaseModel):
    status: ProjectStatus  # approved or rejected
    approved_by: str  # State officer name
    approval_notes: Optional[str] = None
    approved_budget: Optional[float] = None

class ProjectResponse(BaseModel):
    id: str
    village_id: str
    village_name: str
    district: str
    name: str
    type: str
    description: str
    estimated_cost: float
    estimated_duration_months: int
    priority: str
    status: str
    progress_pct: float
    created_by_district: str
    created_at: datetime
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    approval_notes: Optional[str] = None
    approved_budget: Optional[float] = None

# Enhanced Gap models
class GapSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class GapType(str, Enum):
    EDUCATION = "education"
    HEALTHCARE = "healthcare"
    WATER = "water"
    ELECTRICITY = "electricity"
    INTERNET = "internet"
    SANITATION = "sanitation"
    ROADS = "roads"

class GapResponse(BaseModel):
    id: str
    village_id: str
    village_name: str
    district: str
    gap_type: str
    severity: str
    severity_score: float
    description: str
    affected_population: int
    estimated_cost_to_fix: float
    priority_rank: int
    last_updated: datetime

# District Statistics from MongoDB
class DistrictStats(BaseModel):
    district_name: str
    total_villages: int
    total_population: int
    literacy_rate: float
    work_participation_rate: float
    households: int
    problems_count: int
    projects_count: int
    pending_approvals: int

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

# Dashboard models
class DashboardStats(BaseModel):
    total_districts: int
    total_villages: int
    total_population: int
    total_projects: int
    pending_approvals: int
    completed_projects: int
    total_gaps: int
    critical_gaps: int