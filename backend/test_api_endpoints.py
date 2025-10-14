#!/usr/bin/env python3
"""
Test script to verify all API endpoints are working
"""

import requests
import json
from datetime import datetime

def test_endpoints():
    base_url = "http://localhost:8001"
    
    endpoints = [
        "/",
        "/state-dashboard", 
        "/districts",
        "/district/East Sikkim"
    ]
    
    print(f"🔍 Testing API endpoints at {base_url}")
    print("=" * 60)
    
    for endpoint in endpoints:
        try:
            print(f"\n📍 Testing: {endpoint}")
            response = requests.get(f"{base_url}{endpoint}", timeout=10)
            
            if response.status_code == 200:
                print(f"✅ SUCCESS: {endpoint}")
                data = response.json()
                
                if endpoint == "/state-dashboard":
                    print(f"   📊 Total Districts: {data.get('total_districts', 'N/A')}")
                    print(f"   👥 Total Population: {data.get('state_summary', {}).get('total_population', 'N/A'):,}")
                    print(f"   📄 Total Records: {data.get('state_summary', {}).get('total_records', 'N/A')}")
                
                elif endpoint == "/districts":
                    districts = data.get('districts', [])
                    print(f"   📍 Found {len(districts)} districts:")
                    for district in districts:
                        print(f"      - {district.get('name')}: {district.get('records')} records, {district.get('population', 0):,} people")
                
                elif endpoint == "/district/East Sikkim":
                    print(f"   📊 District: {data.get('district_name')}")
                    print(f"   👥 Population: {data.get('population', {}).get('total', 'N/A'):,}")
                    print(f"   📄 Records: {data.get('record_count', 'N/A')}")
                
            else:
                print(f"❌ ERROR: {endpoint} - Status {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ CONNECTION ERROR: {endpoint} - {str(e)}")
        except Exception as e:
            print(f"❌ UNEXPECTED ERROR: {endpoint} - {str(e)}")
    
    print("\n" + "=" * 60)
    print("🎯 API Test Complete!")
    print(f"⏰ Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    test_endpoints()