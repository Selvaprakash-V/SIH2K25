#!/usr/bin/env python3
"""
Test API response to verify correct district counts
"""

import requests
import json

def test_api_counts():
    """Test the API to verify correct district record counts"""
    
    print("🧪 TESTING API DISTRICT COUNTS")
    print("=" * 40)
    
    try:
        # Test /districts endpoint
        response = requests.get("http://localhost:8002/districts", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            print("✅ API Response Success!")
            print(f"📊 Total Districts: {data.get('total_districts', 'N/A')}")
            print("\n🏔️ District Details:")
            
            expected_counts = {
                "East Sikkim": 16,
                "North Sikkim": 10,
                "South Sikkim": 11,
                "West Sikkim": 11
            }
            
            for district in data.get('districts', []):
                name = district.get('name')
                villages_count = district.get('villages_count')
                population = district.get('population')
                expected = expected_counts.get(name, 'Unknown')
                
                status = "✅ CORRECT" if villages_count == expected else "❌ WRONG"
                
                print(f"  {name}:")
                print(f"    Villages/Records: {villages_count} (Expected: {expected}) {status}")
                print(f"    Population: {population:,}")
                print(f"    Literacy: {district.get('literacy_rate', 0)}%")
                print()
                
        else:
            print(f"❌ API Error: Status {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection Error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_api_counts()