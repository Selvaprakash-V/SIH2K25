#!/usr/bin/env python3
"""
Test Atlas connection with detailed error reporting
"""

from pymongo import MongoClient
import sys

def test_atlas_connection():
    from dotenv import load_dotenv
    import os
    load_dotenv()
    uri = os.getenv("MONGO_URI")
    
    print("🔄 Testing Atlas connection...")
    print(f"URI: {uri[:50]}...")
    
    try:
        # Create client with shorter timeout for faster feedback
        client = MongoClient(uri, serverSelectionTimeoutMS=10000)
        
        # Test connection
        client.admin.command("ping")
        print("✅ Connection successful!")
        
        # List databases
        dbs = client.list_database_names()
        print(f"📁 Available databases: {dbs}")
        
        # Check if 'sih2' database exists
        if "sih2" in dbs:
            db = client["sih2"]
            collections = db.list_collection_names()
            print(f"📋 Collections in 'sih': {collections}")
            
            if "sikkim" in collections:
                coll = db["sikkim"]
                count = coll.estimated_document_count()
                print(f"📊 Documents in 'sikkim': {count}")
            else:
                print("❌ Collection 'sikkim' not found")
        else:
            print("❌ Database 'sih2' not found - you need to create it first")
        
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("\n🔧 Troubleshooting steps:")
        print("1. Check Atlas Network Access - whitelist your IP or use 0.0.0.0/0")
        print("2. Verify username/password in Database Access")
        print("3. Make sure cluster is running (not paused)")
        print("4. Check internet connection")
        return False

if __name__ == "__main__":
    success = test_atlas_connection()
    sys.exit(0 if success else 1)