#!/usr/bin/env python3
"""
Comprehensive Sikkim Districts Dashboard
Fetches data from MongoDB Atlas and displays district-wise statistics
"""

import os
from dotenv import load_dotenv
from pymongo import MongoClient
from datetime import datetime
import json

def get_collection():
    """Connect to MongoDB Atlas and return collection"""
    load_dotenv()
    uri = os.getenv("MONGO_URI")
    client = MongoClient(uri)
    db = client["sih2"]
    return db["sikkim"]

def get_district_summary():
    """Get comprehensive district-wise summary"""
    collection = get_collection()
    
    # Get all districts
    districts = collection.distinct("district_name")
    districts = sorted([d for d in districts if d])
    
    district_data = {}
    total_records = 0
    total_population = 0
    
    for district in districts:
        query = {"district_name": district}
        
        # Basic counts
        record_count = collection.count_documents(query)
        total_records += record_count
        
        # Get documents for this district
        docs = list(collection.find(query))
        
        # Calculate statistics
        total_pop = sum(int(doc.get('TOT_P', 0)) for doc in docs if doc.get('TOT_P'))
        male_pop = sum(int(doc.get('TOT_M', 0)) for doc in docs if doc.get('TOT_M'))
        female_pop = sum(int(doc.get('TOT_F', 0)) for doc in docs if doc.get('TOT_F'))
        households = sum(int(doc.get('No_HH_Head', 0)) for doc in docs if doc.get('No_HH_Head'))
        literate = sum(int(doc.get('P_LIT', 0)) for doc in docs if doc.get('P_LIT'))
        workers = sum(int(doc.get('TOT_WORK_P', 0)) for doc in docs if doc.get('TOT_WORK_P'))
        
        total_population += total_pop
        
        # Village/area names
        areas = [doc.get('Name', 'Unknown') for doc in docs if doc.get('Name')]
        
        district_data[district] = {
            'record_count': record_count,
            'total_population': total_pop,
            'male_population': male_pop,
            'female_population': female_pop,
            'households': households,
            'literate_population': literate,
            'working_population': workers,
            'literacy_rate': round((literate / total_pop * 100) if total_pop > 0 else 0, 2),
            'work_participation': round((workers / total_pop * 100) if total_pop > 0 else 0, 2),
            'areas': areas[:10],  # First 10 areas
            'total_areas': len(areas)
        }
    
    return {
        'districts': district_data,
        'summary': {
            'total_districts': len(districts),
            'total_records': total_records,
            'total_population': total_population,
            'timestamp': datetime.now().isoformat()
        }
    }

def display_state_dashboard():
    """Display comprehensive state-level dashboard"""
    print("=" * 80)
    print("🏛️  SIKKIM STATE ADMINISTRATION DASHBOARD")
    print("=" * 80)
    print(f"📅 Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("📊 Data Source: MongoDB Atlas (sih2.sikkim collection)")
    
    try:
        data = get_district_summary()
        
        # State Summary
        summary = data['summary']
        print(f"\n🎯 STATE OVERVIEW")
        print("-" * 50)
        print(f"Total Districts: {summary['total_districts']}")
        print(f"Total Records: {summary['total_records']:,}")
        print(f"Total Population: {summary['total_population']:,}")
        
        # District-wise breakdown
        print(f"\n🏛️  DISTRICT-WISE BREAKDOWN")
        print("-" * 50)
        
        districts_data = data['districts']
        
        for district_name, stats in districts_data.items():
            print(f"\n📍 {district_name.upper()}")
            print(f"   Records: {stats['record_count']:,}")
            print(f"   Population: {stats['total_population']:,} (M: {stats['male_population']:,}, F: {stats['female_population']:,})")
            print(f"   Households: {stats['households']:,}")
            print(f"   Literacy Rate: {stats['literacy_rate']}%")
            print(f"   Work Participation: {stats['work_participation']}%")
            print(f"   Areas Covered: {stats['total_areas']} areas")
            
            if stats['areas']:
                print(f"   Sample Areas: {', '.join(stats['areas'][:5])}")
                if stats['total_areas'] > 5:
                    print(f"   ... and {stats['total_areas'] - 5} more")
        
        # Comparative Analysis
        print(f"\n📊 COMPARATIVE ANALYSIS")
        print("-" * 50)
        
        # Sort districts by population
        sorted_districts = sorted(districts_data.items(), key=lambda x: x[1]['total_population'], reverse=True)
        
        print("Population Ranking:")
        for i, (district, stats) in enumerate(sorted_districts, 1):
            print(f"   {i}. {district}: {stats['total_population']:,} people")
        
        # Literacy comparison
        print("\nLiteracy Rates:")
        literacy_sorted = sorted(districts_data.items(), key=lambda x: x[1]['literacy_rate'], reverse=True)
        for i, (district, stats) in enumerate(literacy_sorted, 1):
            print(f"   {i}. {district}: {stats['literacy_rate']}%")
        
        print(f"\n✅ Dashboard generated successfully!")
        
    except Exception as e:
        print(f"❌ Error generating dashboard: {e}")

def display_district_details(district_name):
    """Display detailed information for a specific district"""
    collection = get_collection()
    
    print(f"\n{'='*80}")
    print(f"🏛️  {district_name.upper()} DISTRICT DETAILED REPORT")
    print(f"{'='*80}")
    
    query = {"district_name": district_name}
    documents = list(collection.find(query))
    
    if not documents:
        print(f"❌ No data found for district: {district_name}")
        return
    
    print(f"📊 Total Records: {len(documents)}")
    print(f"📅 Report Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Aggregate statistics
    total_pop = sum(int(doc.get('TOT_P', 0)) for doc in documents)
    male_pop = sum(int(doc.get('TOT_M', 0)) for doc in documents)
    female_pop = sum(int(doc.get('TOT_F', 0)) for doc in documents)
    
    print(f"\n👥 POPULATION STATISTICS")
    print("-" * 40)
    print(f"Total Population: {total_pop:,}")
    print(f"Male: {male_pop:,} ({(male_pop/total_pop*100):.1f}%)")
    print(f"Female: {female_pop:,} ({(female_pop/total_pop*100):.1f}%)")
    
    # Show individual records
    print(f"\n📋 DETAILED RECORDS")
    print("-" * 40)
    
    for i, doc in enumerate(documents, 1):
        area_name = doc.get('Name', 'Unknown Area')
        level = doc.get('Level', 'Unknown')
        population = doc.get('TOT_P', 0)
        households = doc.get('No_HH_Head', 0)
        
        print(f"{i:2d}. {area_name}")
        print(f"    Level: {level} | Population: {population:,} | Households: {households:,}")
        
        if doc.get('TOT_M') and doc.get('TOT_F'):
            print(f"    Gender: M:{doc['TOT_M']} F:{doc['TOT_F']}")
        
        if doc.get('P_LIT') and doc.get('P_ILL'):
            lit_rate = (int(doc['P_LIT']) / (int(doc['P_LIT']) + int(doc['P_ILL'])) * 100) if (int(doc['P_LIT']) + int(doc['P_ILL'])) > 0 else 0
            print(f"    Literacy: {lit_rate:.1f}% (Lit: {doc['P_LIT']}, Illiterate: {doc['P_ILL']})")
        
        print()

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Sikkim Districts Administration Dashboard")
    parser.add_argument("--state", action="store_true", help="Show state-level dashboard")
    parser.add_argument("--district", help="Show detailed report for specific district")
    parser.add_argument("--json", action="store_true", help="Output data as JSON")
    
    args = parser.parse_args()
    
    try:
        if args.json:
            # Output JSON for API consumption
            data = get_district_summary()
            print(json.dumps(data, indent=2, ensure_ascii=False))
        elif args.district:
            # District-specific report
            display_district_details(args.district)
        else:
            # Default: State dashboard
            display_state_dashboard()
            
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nTroubleshooting:")
        print("1. Check MongoDB Atlas connection")
        print("2. Verify database 'sih2' and collection 'sikkim' exist")
        print("3. Ensure data is properly uploaded")

if __name__ == "__main__":
    main()