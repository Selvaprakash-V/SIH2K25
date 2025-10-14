#!/usr/bin/env python3
"""
Fixed District API - Shows correct record counts
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from datetime import datetime

# Load environment
load_dotenv()

# Create minimal FastAPI app
app = FastAPI()

def get_collection():
    """Connect to MongoDB Atlas and return collection"""
    uri = os.getenv("MONGO_URI")
    client = MongoClient(uri)
    db = client["sih2"]
    return db["sikkim"]

@app.get("/")
def root():
    return {"message": "Fixed Sikkim District API - Correct Counts"}

@app.get("/districts")
def get_all_districts():
    """Get all districts with CORRECT record counts from database"""
    try:
        collection = get_collection()
        
        # Get distinct districts
        districts = collection.distinct("district_name")
        districts = sorted([d for d in districts if d])
        
        district_data = []
        
        for district in districts:
            # Get actual count from database
            docs = list(collection.find({"district_name": district}))
            actual_count = len(docs)
            
            # Calculate statistics
            total_pop = sum(int(doc.get('TOT_P', 0)) for doc in docs)
            literate = sum(int(doc.get('P_LIT', 0)) for doc in docs)
            illiterate = sum(int(doc.get('P_ILL', 0)) for doc in docs)
            workers = sum(int(doc.get('TOT_WORK_P', 0)) for doc in docs)
            
            literacy_rate = round((literate / (literate + illiterate) * 100) if (literate + illiterate) > 0 else 0, 2)
            work_participation = round((workers / total_pop * 100) if total_pop > 0 else 0, 2)
            
            district_info = {
                'name': district,
                'villages_count': actual_count,  # This is the REAL count
                'population': total_pop,
                'literacy_rate': literacy_rate,
                'work_participation': work_participation
            }
            
            district_data.append(district_info)
        
        return {
            "state": "Sikkim",
            "total_districts": len(districts),
            "districts": district_data,
            "timestamp": datetime.now().isoformat(),
            "note": "Villages_count shows ACTUAL records from MongoDB"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/district/{district_name}")
def get_district_details(district_name: str):
    """Get detailed district information with correct village count"""
    try:
        collection = get_collection()
        
        # Get all documents for this district
        docs = list(collection.find({"district_name": district_name}))
        
        if not docs:
            raise HTTPException(status_code=404, detail=f"District '{district_name}' not found")
        
        # Calculate statistics
        record_count = len(docs)  # ACTUAL count
        total_pop = sum(int(doc.get('TOT_P', 0)) for doc in docs)
        male_pop = sum(int(doc.get('TOT_M', 0)) for doc in docs)
        female_pop = sum(int(doc.get('TOT_F', 0)) for doc in docs)
        households = sum(int(doc.get('No_HH_Head', 0)) for doc in docs)
        literate = sum(int(doc.get('P_LIT', 0)) for doc in docs)
        illiterate = sum(int(doc.get('P_ILL', 0)) for doc in docs)
        workers = sum(int(doc.get('TOT_WORK_P', 0)) for doc in docs)
        
        # Calculate rates
        literacy_rate = round((literate / (literate + illiterate) * 100) if (literate + illiterate) > 0 else 0, 2)
        work_participation = round((workers / total_pop * 100) if total_pop > 0 else 0, 2)
        
        # Get village details
        villages = []
        for doc in docs:
            village = {
                'name': doc.get('Name', 'Unknown'),
                'level': doc.get('Level', 'Unknown'),
                'population': int(doc.get('TOT_P', 0)),
                'households': int(doc.get('No_HH_Head', 0)),
                'literacy_rate': round((int(doc.get('P_LIT', 0)) / (int(doc.get('P_LIT', 0)) + int(doc.get('P_ILL', 1))) * 100), 2)
            }
            villages.append(village)
        
        # Sort by population
        villages.sort(key=lambda x: x['population'], reverse=True)
        
        return {
            'district_name': district_name,
            'record_count': record_count,  # REAL count from database
            'population': {
                'total': total_pop,
                'male': male_pop,
                'female': female_pop
            },
            'households': households,
            'education': {
                'literacy_rate': literacy_rate
            },
            'employment': {
                'work_participation_rate': work_participation
            },
            'villages': villages,
            'note': f"This district has exactly {record_count} records in the database"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/verify-counts")
def verify_database_counts():
    """Verify the exact counts in the database"""
    try:
        collection = get_collection()
        
        districts = ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"]
        counts = {}
        
        for district in districts:
            count = collection.count_documents({"district_name": district})
            counts[district] = count
        
        return {
            "database_counts": counts,
            "total_records": sum(counts.values()),
            "timestamp": datetime.now().isoformat(),
            "message": "These are the EXACT counts from MongoDB"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)