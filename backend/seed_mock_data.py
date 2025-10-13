import asyncio
import json
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from auth import get_password_hash
import os
from dotenv import load_dotenv

load_dotenv()

async def seed_database():
    """Seed the database with mock data"""
    client = AsyncIOMotorClient(os.getenv("MONGO_URI", "mongodb://localhost:27017"))
    db = client.ruraliq
    
    print("🌱 Starting database seeding...")
    
    # Clear existing data
    await db.users.delete_many({})
    await db.villages.delete_many({})
    await db.amenities.delete_many({})
    await db.projects.delete_many({})
    await db.gaps.delete_many({})
    await db.reports.delete_many({})
    
    # Create demo users
    users = [
        {
            "name": "Admin User",
            "email": "admin@example.com",
            "password_hash": get_password_hash("password"),
            "role": "admin",
            "created_at": datetime.utcnow()
        },
        {
            "name": "State User",
            "email": "state@example.com",
            "password_hash": get_password_hash("password"),
            "role": "state",
            "created_at": datetime.utcnow()
        },
        {
            "name": "District User",
            "email": "district@example.com",
            "password_hash": get_password_hash("password"),
            "role": "district",
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.users.insert_many(users)
    print("✅ Created demo users")
    
    # Load mock villages data
    with open("../data/mock_villages.json", "r") as f:
        mock_data = json.load(f)
    
    # Insert villages and create amenities
    for village_data in mock_data:
        # Create village
        village_doc = {
            "name": village_data["village"],
            "district": village_data["district"],
            "state": village_data["state"],
            "population": village_data["population"],
            "sc_ratio": village_data["SC_ratio"],
            "geo_lat": village_data["geo_lat"],
            "geo_long": village_data["geo_long"],
            "created_at": datetime.utcnow()
        }
        
        village_result = await db.villages.insert_one(village_doc)
        village_id = str(village_result.inserted_id)
        
        # Create amenities
        amenities_doc = {
            "village_id": village_id,
            "water": village_data["water"],
            "electricity": village_data["electricity"],
            "schools": village_data["schools"],
            "health_centers": village_data["health_centers"],
            "toilets": village_data["toilets"],
            "internet": village_data["internet"]
        }
        
        await db.amenities.insert_one(amenities_doc)
        
        # Create sample projects
        projects = [
            {
                "village_id": village_id,
                "name": f"School Building - {village_data['village']}",
                "type": "education",
                "progress_pct": 45.0,
                "status": "in_progress",
                "created_at": datetime.utcnow()
            },
            {
                "village_id": village_id,
                "name": f"Water Supply System - {village_data['village']}",
                "type": "water",
                "progress_pct": 100.0,
                "status": "completed",
                "created_at": datetime.utcnow()
            }
        ]
        
        await db.projects.insert_many(projects)
    
    print(f"✅ Created {len(mock_data)} villages with amenities and projects")
    
    # Calculate gaps for all villages
    from gap_detection import calculate_village_gaps
    
    villages = await db.villages.find().to_list(length=1000)
    for village in villages:
        amenities = await db.amenities.find_one({"village_id": str(village["_id"])})
        if amenities:
            await calculate_village_gaps(village, amenities, db)
    
    print("✅ Calculated gaps for all villages")
    
    # Create sample reports
    sample_reports = [
        {
            "user_id": "sample_user",
            "village_id": str(villages[0]["_id"]),
            "description": "Broken hand pump in village center",
            "gps": {"lat": 24.6, "long": 77.3},
            "image_url": None,
            "timestamp": datetime.utcnow(),
            "synced": True
        }
    ]
    
    await db.reports.insert_many(sample_reports)
    print("✅ Created sample reports")
    
    client.close()
    print("🎉 Database seeding completed!")

if __name__ == "__main__":
    asyncio.run(seed_database())