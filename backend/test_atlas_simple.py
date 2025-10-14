#!/usr/bin/env python3
"""
Test Atlas with longer timeout and more debugging
"""

from pymongo import MongoClient
import socket

def test_dns_resolution():
    """Test if we can resolve Atlas hostname"""
    try:
        hostname = "zeroday1.0mwqypn.mongodb.net"
        ip = socket.gethostbyname(hostname)
        print(f"✅ DNS resolution works: {hostname} -> {ip}")
        return True
    except Exception as e:
        print(f"❌ DNS resolution failed: {e}")
        return False

def test_atlas_simple():
    """Test with minimal connection string"""
    
    if not test_dns_resolution():
        return False
        
    # Try without database name first
    uri = "mongodb+srv://yugenjr847:yugenjr842007@zeroday1.0mwqypn.mongodb.net/?retryWrites=true&w=majority"
    
    print(f"🔄 Testing simple connection...")
    
    try:
        # Longer timeout
        client = MongoClient(uri, serverSelectionTimeoutMS=30000)
        
        # Test connection
        result = client.admin.command("ping")
        print("✅ Connection successful!")
        print(f"Ping result: {result}")
        
        # List databases
        dbs = client.list_database_names()
        print(f"📁 Databases: {dbs}")
        
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print(f"Error type: {type(e).__name__}")
        return False

if __name__ == "__main__":
    test_atlas_simple()