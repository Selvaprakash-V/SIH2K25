#!/usr/bin/env python3
"""
Alternative connection test with different settings
"""

from pymongo import MongoClient
from pymongo.server_api import ServerApi
import os
from dotenv import load_dotenv
import ssl

def test_atlas_robust():
    load_dotenv()
    uri = os.getenv("MONGO_URI")
    
    print("🔄 Testing with robust connection settings...")
    
    try:
        # Try with ServerApi and SSL settings
        client = MongoClient(
            uri,
            server_api=ServerApi('1'),
            serverSelectionTimeoutMS=30000,  # 30 seconds
            connectTimeoutMS=30000,
            socketTimeoutMS=30000,
            ssl=True,
            ssl_cert_reqs=ssl.CERT_NONE,  # Skip SSL verification for testing
            retryWrites=True
        )
        
        # Test connection
        client.admin.command("ping")
        print("✅ Connection successful with robust settings!")
        
        # List databases
        dbs = client.list_database_names()
        print(f"📁 Databases: {dbs}")
        
        return True
        
    except Exception as e:
        print(f"❌ Robust connection also failed: {e}")
        return False

def test_simple_uri():
    """Test with minimal URI"""
    
    simple_uri = "mongodb+srv://yugenjr847:yugen842007@zeroday1.0mwqypn.mongodb.net/"
    
    print("🔄 Testing with minimal URI...")
    
    try:
        client = MongoClient(simple_uri, serverSelectionTimeoutMS=15000)
        client.admin.command("ping")
        print("✅ Minimal URI works!")
        return True
    except Exception as e:
        print(f"❌ Minimal URI failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing different connection methods...\n")
    
    success1 = test_simple_uri()
    print()
    success2 = test_atlas_robust()
    
    if not (success1 or success2):
        print("\n💡 Suggestions:")
        print("1. Try connecting via mobile hotspot (bypass corporate firewall)")
        print("2. Check Windows Firewall settings")
        print("3. Try from a different computer/network")
        print("4. Use Atlas web interface for now")