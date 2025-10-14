#!/usr/bin/env python3
"""
Test MongoDB connection from backend
"""

import os
from dotenv import load_dotenv
from pymongo import MongoClient

def test_connection():
    load_dotenv()
    uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    
    try:
        print(f"Connecting to: {uri}")
        client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        
        # Test connection
        client.admin.command('ping')
        print("✅ Successfully connected to MongoDB!")
        
        # List databases
        dbs = client.list_database_names()
        print(f"Available databases: {dbs}")
        
        # Check your specific database
        db = client["ruraliq"]
        collections = db.list_collection_names()
        print(f"Collections in 'ruraliq': {collections}")
        
        # Check your collection
        if "sikkim_villages_raw" in collections:
            coll = db["sikkim_villages_raw"]
            count = coll.count_documents({})
            print(f"✅ Found {count} documents in sikkim_villages_raw collection")
            
            # Show sample document
            sample = coll.find_one()
            if sample:
                print(f"Sample fields: {list(sample.keys())}")
        else:
            print("❌ Collection 'sikkim_villages_raw' not found")
            
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure MongoDB service is running")
        print("2. Check if Compass is connected to the same URI")
        print("3. Verify database and collection names match")

if __name__ == "__main__":
    test_connection()