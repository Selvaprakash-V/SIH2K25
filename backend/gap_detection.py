from datetime import datetime
from database import get_database

async def calculate_village_gaps(village, amenities, db):
    """
    Calculate gaps for a village based on amenities data
    Returns gap analysis with severity score
    """
    gaps = {
        "village_id": str(village["_id"]),
        "gaps": {},
        "severity_score": 0.0,
        "last_updated": datetime.utcnow()
    }
    
    # Define thresholds and weights
    thresholds = {
        "electricity": 80,  # percentage
        "toilets": 70,      # percentage
        "internet": 50,     # percentage
        "schools": 1,       # minimum count per 1000 population
        "health_centers": 1, # minimum count per 5000 population
        "water": 1          # must have (binary)
    }
    
    weights = {
        "water": 25,
        "electricity": 20,
        "toilets": 15,
        "health_centers": 20,
        "schools": 15,
        "internet": 5
    }
    
    # Calculate gaps
    population = village.get("population", 1000)
    
    # Water gap
    if amenities.get("water", 0) == 0:
        gaps["gaps"]["water"] = {
            "status": "critical",
            "message": "No water access available",
            "priority": "high"
        }
        gaps["severity_score"] += weights["water"]
    
    # Electricity gap
    electricity_pct = amenities.get("electricity", 0)
    if electricity_pct < thresholds["electricity"]:
        gaps["gaps"]["electricity"] = {
            "status": "moderate" if electricity_pct > 50 else "critical",
            "message": f"Only {electricity_pct}% electricity coverage",
            "priority": "high" if electricity_pct < 50 else "medium"
        }
        gap_severity = (thresholds["electricity"] - electricity_pct) / thresholds["electricity"]
        gaps["severity_score"] += weights["electricity"] * gap_severity
    
    # Schools gap
    schools_count = amenities.get("schools", 0)
    required_schools = max(1, population // 1000)
    if schools_count < required_schools:
        gaps["gaps"]["education"] = {
            "status": "critical" if schools_count == 0 else "moderate",
            "message": f"Need {required_schools - schools_count} more schools",
            "priority": "high"
        }
        gap_severity = min(1.0, (required_schools - schools_count) / required_schools)
        gaps["severity_score"] += weights["schools"] * gap_severity
    
    # Health centers gap
    health_centers = amenities.get("health_centers", 0)
    required_health = max(1, population // 5000)
    if health_centers < required_health:
        gaps["gaps"]["healthcare"] = {
            "status": "critical" if health_centers == 0 else "moderate",
            "message": f"Need {required_health - health_centers} more health centers",
            "priority": "high"
        }
        gap_severity = min(1.0, (required_health - health_centers) / required_health)
        gaps["severity_score"] += weights["health_centers"] * gap_severity
    
    # Toilets gap
    toilets_pct = amenities.get("toilets", 0)
    if toilets_pct < thresholds["toilets"]:
        gaps["gaps"]["sanitation"] = {
            "status": "moderate" if toilets_pct > 40 else "critical",
            "message": f"Only {toilets_pct}% toilet coverage",
            "priority": "medium"
        }
        gap_severity = (thresholds["toilets"] - toilets_pct) / thresholds["toilets"]
        gaps["severity_score"] += weights["toilets"] * gap_severity
    
    # Internet gap
    internet_pct = amenities.get("internet", 0)
    if internet_pct < thresholds["internet"]:
        gaps["gaps"]["connectivity"] = {
            "status": "moderate",
            "message": f"Only {internet_pct}% internet coverage",
            "priority": "low"
        }
        gap_severity = (thresholds["internet"] - internet_pct) / thresholds["internet"]
        gaps["severity_score"] += weights["internet"] * gap_severity
    
    # Save gaps to database
    await db.gaps.update_one(
        {"village_id": str(village["_id"])},
        {"$set": gaps},
        upsert=True
    )
    
    return gaps

async def get_development_index(village_id: str):
    """Calculate development index (0-100) for a village"""
    db = await get_database()
    
    gaps = await db.gaps.find_one({"village_id": village_id})
    if not gaps:
        return 50  # Default middle score
    
    # Development index = 100 - severity_score
    # Max severity_score is 100, so this gives us 0-100 scale
    development_index = max(0, 100 - gaps["severity_score"])
    return round(development_index, 1)