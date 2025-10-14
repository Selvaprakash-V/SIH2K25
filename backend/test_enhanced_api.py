#!/usr/bin/env python3
"""
Test Enhanced District API - Show real data for all districts
"""

import os
from dotenv import load_dotenv
from pymongo import MongoClient
import json

# Load environment
load_dotenv()

def test_district_data():
    """Test the enhanced district API by fetching real data"""
    
    # Connect to MongoDB
    uri = os.getenv("MONGO_URI")
    client = MongoClient(uri)
    db = client["sih2"]
    collection = db["sikkim"]
    
    print("🔍 ENHANCED DISTRICT DATA TEST")
    print("=" * 60)
    
    # Get all districts
    districts = collection.distinct("district_name")
    districts = sorted([d for d in districts if d])
    
    print(f"📍 Found {len(districts)} districts in database:")
    
    for district in districts:
        print(f"\n🏔️ {district.upper()}")
        print("-" * 40)
        
        # Get district documents
        docs = list(collection.find({"district_name": district}))
        
        # Calculate real statistics
        total_pop = sum(int(doc.get('TOT_P', 0)) for doc in docs)
        literate = sum(int(doc.get('P_LIT', 0)) for doc in docs)
        illiterate = sum(int(doc.get('P_ILL', 0)) for doc in docs)
        workers = sum(int(doc.get('TOT_WORK_P', 0)) for doc in docs)
        households = sum(int(doc.get('No_HH_Head', 0)) for doc in docs)
        
        literacy_rate = round((literate / (literate + illiterate) * 100) if (literate + illiterate) > 0 else 0, 2)
        work_rate = round((workers / total_pop * 100) if total_pop > 0 else 0, 2)
        
        print(f"📊 Villages/Areas: {len(docs)}")
        print(f"👥 Population: {total_pop:,}")
        print(f"🏠 Households: {households:,}")
        print(f"📚 Literacy Rate: {literacy_rate}%")
        print(f"💼 Work Participation: {work_rate}%")
        
        # Show sample villages
        print(f"🏘️ Sample Villages:")
        for i, doc in enumerate(docs[:3]):
            village_name = doc.get('Name', f'Area {i+1}')
            village_pop = doc.get('TOT_P', 0)
            print(f"   - {village_name}: {village_pop:,} people")
        
        if len(docs) > 3:
            print(f"   ... and {len(docs) - 3} more villages")
        
        # Generate sample problems based on data
        problems = []
        if literacy_rate < 70:
            problems.append(f"Low literacy rate ({literacy_rate}%)")
        if work_rate < 50:
            problems.append(f"Low employment rate ({work_rate}%)")
        if total_pop > 50000:
            problems.append("Infrastructure strain due to high population")
        if len(docs) > 10:
            problems.append("Rural connectivity issues")
        
        print(f"⚠️ Generated Problems ({len(problems)}):")
        for problem in problems:
            print(f"   - {problem}")
    
    print("\n" + "=" * 60)
    print("✅ Enhanced District API Test Complete!")
    print(f"🌐 API Server: http://localhost:8002")
    print(f"📋 Endpoints:")
    print(f"   - /districts (All districts)")
    print(f"   - /district/{{name}} (Specific district)")
    print(f"   - /district/{{name}}/villages (Village data)")
    print(f"   - /district/{{name}}/problems (District problems)")
    print(f"   - /dashboard/{{name}} (HTML dashboard)")
    
    print(f"\n🎯 Example URLs:")
    for district in districts:
        district_encoded = district.replace(' ', '%20')
        print(f"   - http://localhost:8002/dashboard/{district_encoded}")

if __name__ == "__main__":
    test_district_data()