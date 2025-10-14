#!/usr/bin/env python3
"""
Display Sikkim district data from MongoDB
Database: sih
Collection: sikkim
"""

import os
from dotenv import load_dotenv
from pymongo import MongoClient
import json

def get_collection():
    """Connect to MongoDB and return the sikkim collection"""
    load_dotenv()
    uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/sih")
    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    
    # Test connection
    client.admin.command("ping")
    
    db = client["sih2"]
    return db["sikkim"]

def display_district_summary():
    """Display summary statistics for each district"""
    collection = get_collection()
    
    print("=" * 60)
    print("SIKKIM DISTRICTS DATA SUMMARY")
    print("=" * 60)
    
    # Total documents
    total = collection.count_documents({})
    print(f"Total Records: {total:,}")
    
    # Get all districts
    districts = collection.distinct("district_name")
    districts = [d for d in districts if d]  # Remove empty values
    
    print(f"Districts Found: {len(districts)}")
    print("-" * 60)
    
    for district in sorted(districts):
        print(f"\n🏛️  {district.upper()}")
        print("-" * 40)
        
        # Count documents in this district
        district_count = collection.count_documents({"district_name": district})
        print(f"Records: {district_count:,}")
        
        # Sample villages (if village_name field exists)
        villages = collection.distinct("village_name", {"district_name": district})
        villages = [v for v in villages if v and v.strip()]  # Remove empty values
        
        if villages:
            print(f"Villages: {len(villages)}")
            # Show first few villages
            sample_villages = sorted(villages)[:5]
            print(f"Sample Villages: {', '.join(sample_villages)}")
            if len(villages) > 5:
                print(f"... and {len(villages) - 5} more")
        
        # Show sample data fields from one document
        sample_doc = collection.find_one({"district_name": district})
        if sample_doc:
            # Get interesting fields (exclude metadata)
            exclude_fields = {"_id", "district_name", "district_code", "state_name", "_source_file", "village_name"}
            data_fields = [k for k in sample_doc.keys() if k not in exclude_fields and sample_doc[k]]
            
            if data_fields:
                print(f"Data Fields Available: {len(data_fields)}")
                print(f"Sample Fields: {', '.join(data_fields[:8])}")
                if len(data_fields) > 8:
                    print(f"... and {len(data_fields) - 8} more fields")

def display_district_data(district_name, limit=10):
    """Display actual data for a specific district"""
    collection = get_collection()
    
    print(f"\n{'='*60}")
    print(f"DATA FOR {district_name.upper()}")
    print(f"{'='*60}")
    
    query = {"district_name": district_name}
    documents = list(collection.find(query).limit(limit))
    
    if not documents:
        print(f"No data found for district: {district_name}")
        return
    
    print(f"Showing first {min(len(documents), limit)} records:")
    print("-" * 60)
    
    for i, doc in enumerate(documents, 1):
        print(f"\n{i}. Record ID: {doc.get('_id')}")
        
        # Show key fields
        if doc.get('village_name'):
            print(f"   Village: {doc['village_name']}")
        if doc.get('district_code'):
            print(f"   District Code: {doc['district_code']}")
        if doc.get('_source_file'):
            print(f"   Source File: {doc['_source_file']}")
        
        # Show other data fields
        exclude_fields = {"_id", "district_name", "district_code", "state_name", "_source_file", "village_name"}
        other_data = {k: v for k, v in doc.items() 
                     if k not in exclude_fields and v and str(v).strip()}
        
        if other_data:
            print("   Data:")
            for key, value in list(other_data.items())[:5]:  # Show first 5 fields
                print(f"     {key}: {value}")
            
            if len(other_data) > 5:
                print(f"     ... and {len(other_data) - 5} more fields")

def search_villages(search_term, limit=10):
    """Search for villages containing the search term"""
    collection = get_collection()
    
    print(f"\n{'='*60}")
    print(f"VILLAGES MATCHING: '{search_term}'")
    print(f"{'='*60}")
    
    query = {"village_name": {"$regex": search_term, "$options": "i"}}
    documents = list(collection.find(query).limit(limit))
    
    if not documents:
        print(f"No villages found matching: {search_term}")
        return
    
    for i, doc in enumerate(documents, 1):
        print(f"{i}. {doc.get('village_name', 'N/A')} ({doc.get('district_name', 'N/A')})")
        if doc.get('_source_file'):
            print(f"   Source: {doc['_source_file']}")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Display Sikkim district data")
    parser.add_argument("--summary", action="store_true", help="Show district summary")
    parser.add_argument("--district", help="Show data for specific district")
    parser.add_argument("--search-village", help="Search for villages")
    parser.add_argument("--limit", type=int, default=10, help="Limit number of results")
    
    args = parser.parse_args()
    
    try:
        if args.summary:
            display_district_summary()
        elif args.district:
            display_district_data(args.district, args.limit)
        elif args.search_village:
            search_villages(args.search_village, args.limit)
        else:
            # Default: show summary
            display_district_summary()
            
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure MongoDB is running")
        print("2. Check if you can connect via MongoDB Compass")
        print("3. Verify database 'sih' and collection 'sikkim' exist")

if __name__ == "__main__":
    main()