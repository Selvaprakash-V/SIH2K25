#!/usr/bin/env python3
"""
Simple test to verify district record counts
"""

import os
from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment
load_dotenv()

def test_actual_counts():
    """Test actual MongoDB record counts vs API"""
    
    print("🔍 TESTING ACTUAL DISTRICT RECORD COUNTS")
    print("=" * 50)
    
    # Connect to MongoDB
    uri = os.getenv("MONGO_URI")
    client = MongoClient(uri)
    db = client["sih2"]
    collection = db["sikkim"]
    
    # Get actual counts from MongoDB
    districts = ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"]
    
    print("📊 DIRECT MONGODB COUNTS:")
    for district in districts:
        count = collection.count_documents({"district_name": district})
        
        # Also get sample documents to verify
        sample_docs = list(collection.find({"district_name": district}).limit(3))
        sample_names = [doc.get('Name', 'Unknown') for doc in sample_docs]
        
        print(f"  {district}: {count} records")
        print(f"    Sample areas: {', '.join(sample_names)}")
        print()
    
    # Test the function from enhanced_district_api.py
    print("🧪 TESTING API FUNCTION:")
    
    # Import the function
    import sys
    sys.path.append('.')
    
    try:
        from enhanced_district_api import get_district_specific_data
        
        for district in districts:
            data = get_district_specific_data(district)
            api_count = data['areas']['count']
            actual_villages = len(data['areas']['villages'])
            
            print(f"  {district}:")
            print(f"    API Count: {api_count}")
            print(f"    Villages Array Length: {actual_villages}")
            print(f"    Population: {data['population']['total']:,}")
            print()
            
    except Exception as e:
        print(f"Error testing API function: {e}")
    
    print("✅ Test Complete!")

if __name__ == "__main__":
    test_actual_counts()