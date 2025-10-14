#!/usr/bin/env python3
"""
Fetch and display data from MongoDB Sikkim collection.
Usage examples:
  python query_sikkim_data.py --limit 5
  python query_sikkim_data.py --district "East Sikkim" --limit 10
  python query_sikkim_data.py --village "gangtok"
"""

import os
import argparse
from dotenv import load_dotenv
from pymongo import MongoClient
import json

def get_collection():
    """Connect to MongoDB and return the collection"""
    load_dotenv()
    uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    client = MongoClient(uri)
    db = client["ruraliq"]  # Replace with your database name
    return db["sikkim_villages_raw"]  # Replace with your collection name

def query_data(collection, district=None, village=None, limit=10):
    """Query data with optional filters"""
    query = {}
    
    if district:
        query["district_name"] = district
    
    if village:
        query["village_name"] = {"$regex": village, "$options": "i"}
    
    print(f"Query: {query}")
    print("-" * 50)
    
    cursor = collection.find(query).limit(limit)
    documents = list(cursor)
    
    if not documents:
        print("No documents found matching the query.")
        return
    
    print(f"Found {len(documents)} documents:")
    for i, doc in enumerate(documents, 1):
        print(f"\n{i}. Document ID: {doc.get('_id')}")
        if 'district_name' in doc:
            print(f"   District: {doc['district_name']}")
        if 'village_name' in doc:
            print(f"   Village: {doc['village_name']}")
        if '_source_file' in doc:
            print(f"   Source: {doc['_source_file']}")
        
        # Print first few fields (excluding MongoDB _id)
        other_fields = {k: v for k, v in doc.items() 
                       if k not in ['_id', 'district_name', 'village_name', '_source_file', 'state_name']}
        
        field_count = 0
        for key, value in other_fields.items():
            if field_count >= 5:  # Limit output
                print(f"   ... and {len(other_fields) - 5} more fields")
                break
            print(f"   {key}: {value}")
            field_count += 1

def show_stats(collection):
    """Show collection statistics"""
    print("Collection Statistics:")
    print("-" * 30)
    
    # Total documents
    total = collection.count_documents({})
    print(f"Total documents: {total}")
    
    # Documents by district
    districts = collection.distinct("district_name")
    print(f"Districts: {districts}")
    
    for district in districts:
        count = collection.count_documents({"district_name": district})
        print(f"  {district}: {count} documents")
    
    # Sample field names from first document
    sample = collection.find_one()
    if sample:
        print(f"\nSample fields: {list(sample.keys())[:10]}...")

def main():
    parser = argparse.ArgumentParser(description="Query Sikkim village data")
    parser.add_argument("--district", help="Filter by district name")
    parser.add_argument("--village", help="Search village names (case-insensitive)")
    parser.add_argument("--limit", type=int, default=10, help="Limit number of results")
    parser.add_argument("--stats", action="store_true", help="Show collection statistics")
    
    args = parser.parse_args()
    
    try:
        collection = get_collection()
        
        if args.stats:
            show_stats(collection)
        else:
            query_data(collection, args.district, args.village, args.limit)
            
    except Exception as e:
        print(f"Error: {e}")
        print("Make sure MongoDB is running and connection details are correct in .env file")

if __name__ == "__main__":
    main()