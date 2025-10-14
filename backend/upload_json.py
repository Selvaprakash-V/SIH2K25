#!/usr/bin/env python3
"""
Upload JSON data to MongoDB Atlas
Usage: python upload_json.py your_file.json
"""

import os
import sys
import json
from dotenv import load_dotenv
from pymongo import MongoClient

def upload_to_atlas(json_file):
    # Load Atlas connection
    load_dotenv()
    uri = os.getenv("MONGO_URI")
    
    print(f"🔄 Connecting to Atlas...")
    client = MongoClient(uri)
    client.admin.command("ping")
    print("✅ Connected!")
    
    # Get database and collection
    db = client["sih2"]
    collection = db["sikkim"]
    
    # Read JSON file
    print(f"📖 Reading {json_file}...")
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Convert single document to list
    if isinstance(data, dict):
        data = [data]
    
    print(f"📊 Found {len(data)} documents")
    
    # Clear existing data
    existing = collection.count_documents({})
    if existing > 0:
        print(f"🗑️  Clearing {existing} existing documents...")
        collection.delete_many({})
    
    # Upload data
    print("⬆️  Uploading to Atlas...")
    result = collection.insert_many(data)
    print(f"✅ Uploaded {len(result.inserted_ids)} documents!")
    
    # Show summary
    districts = collection.distinct("district_name")
    print(f"\n🏛️  Districts found: {len(districts)}")
    for district in districts:
        count = collection.count_documents({"district_name": district})
        print(f"   {district}: {count} records")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python upload_json.py your_file.json")
        sys.exit(1)
    
    json_file = sys.argv[1]
    if not os.path.exists(json_file):
        print(f"❌ File not found: {json_file}")
        sys.exit(1)
    
    upload_to_atlas(json_file)
    print("\n🎉 Done! Now run: python display_sikkim_data.py --summary")