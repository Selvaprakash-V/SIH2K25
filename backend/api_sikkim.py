#!/usr/bin/env python3
"""
API endpoints to fetch Sikkim data from MongoDB Atlas
All data comes from database - no hardcoded data!
"""

from fastapi import FastAPI, HTTPException, Query
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId
import json

# Load environment
load_dotenv()

app = FastAPI(title="Sikkim Districts API", description="Fetch data from MongoDB Atlas")

# MongoDB connection
def get_collection():
    uri = os.getenv("MONGO_URI")
    client = MongoClient(uri)
    db = client["sih2"]
    return db["sikkim"]

def serialize_doc(doc):
    """Convert MongoDB document to JSON serializable format"""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

@app.get("/")
def root():
    return {"message": "Sikkim Districts API - All data from MongoDB Atlas"}

@app.get("/districts")
def get_districts():
    """Get list of all districts"""
    collection = get_collection()
    districts = collection.distinct("district_name")
    districts = [d for d in districts if d]  # Remove empty values
    return {"districts": sorted(districts)}

@app.get("/districts/{district_name}")
def get_district_data(
    district_name: str,
    limit: int = Query(100, description="Limit number of records"),
    skip: int = Query(0, description="Skip number of records")
):
    """Get all data for a specific district"""
    collection = get_collection()
    
    query = {"district_name": district_name}
    cursor = collection.find(query).skip(skip).limit(limit)
    documents = [serialize_doc(doc) for doc in cursor]
    
    if not documents:
        raise HTTPException(status_code=404, detail=f"District '{district_name}' not found")
    
    total = collection.count_documents(query)
    
    return {
        "district": district_name,
        "total_records": total,
        "returned_records": len(documents),
        "skip": skip,
        "limit": limit,
        "data": documents
    }

@app.get("/districts/{district_name}/summary")
def get_district_summary(district_name: str):
    """Get summary statistics for a district"""
    collection = get_collection()
    
    query = {"district_name": district_name}
    total = collection.count_documents(query)
    
    if total == 0:
        raise HTTPException(status_code=404, detail=f"District '{district_name}' not found")
    
    # Get villages count
    villages = collection.distinct("village_name", query)
    villages = [v for v in villages if v and v.strip()]
    
    # Get sample fields from one document
    sample_doc = collection.find_one(query)
    exclude_fields = {"_id", "district_name", "district_code", "state_name", "_source_file"}
    data_fields = [k for k in sample_doc.keys() if k not in exclude_fields] if sample_doc else []
    
    return {
        "district": district_name,
        "total_records": total,
        "villages_count": len(villages),
        "sample_villages": sorted(villages)[:10],
        "available_fields": data_fields[:20],
        "source_files": collection.distinct("_source_file", query)
    }

@app.get("/villages/search")
def search_villages(
    q: str = Query(..., description="Search term for village name"),
    district: Optional[str] = Query(None, description="Filter by district"),
    limit: int = Query(50, description="Limit results")
):
    """Search for villages by name"""
    collection = get_collection()
    
    query = {"village_name": {"$regex": q, "$options": "i"}}
    if district:
        query["district_name"] = district
    
    cursor = collection.find(query).limit(limit)
    documents = [serialize_doc(doc) for doc in cursor]
    
    return {
        "search_term": q,
        "district_filter": district,
        "results_count": len(documents),
        "villages": documents
    }

@app.get("/stats")
def get_overall_stats():
    """Get overall statistics from database"""
    collection = get_collection()
    
    total_records = collection.estimated_document_count()
    districts = collection.distinct("district_name")
    districts = [d for d in districts if d]
    
    district_stats = []
    for district in sorted(districts):
        count = collection.count_documents({"district_name": district})
        villages = collection.distinct("village_name", {"district_name": district})
        villages = [v for v in villages if v and v.strip()]
        
        district_stats.append({
            "district": district,
            "records": count,
            "villages": len(villages)
        })
    
    # Get all available fields from a sample document
    sample_doc = collection.find_one()
    all_fields = list(sample_doc.keys()) if sample_doc else []
    
    return {
        "total_records": total_records,
        "total_districts": len(districts),
        "districts": district_stats,
        "sample_fields": all_fields,
        "source_files": collection.distinct("_source_file")
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)