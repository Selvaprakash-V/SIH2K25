from http.server import BaseHTTPRequestHandler
import json
import os
from pymongo import MongoClient
from urllib.parse import quote_plus

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        try:
            # MongoDB connection
            MONGO_URI = "mongodb+srv://yugenjr847:yugen842007@zeroday1.0mwqypn.mongodb.net/sih2?retryWrites=true&w=majority&appName=Zeroday1"
            
            # Test connection
            client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
            db = client.sih2
            
            # Test database connection
            client.admin.command('ping')
            
            # Get collection stats
            collections = db.list_collection_names()
            
            # Try to get some sample data
            villages_count = 0
            sample_villages = []
            if 'villages' in collections:
                villages_collection = db.villages
                villages_count = villages_collection.count_documents({})
                sample_villages = list(villages_collection.find().limit(3))
                
                # Convert ObjectId to string for JSON serialization
                for village in sample_villages:
                    village['_id'] = str(village['_id'])
            
            response = {
                "status": "connected",
                "message": "MongoDB Atlas connection successful!",
                "database": "sih2",
                "collections": collections,
                "villages_count": villages_count,
                "sample_villages": sample_villages
            }
            
            client.close()
            
        except Exception as e:
            response = {
                "status": "error",
                "message": f"Database connection failed: {str(e)}",
                "error_type": type(e).__name__
            }
        
        self.wfile.write(json.dumps(response).encode())
        return
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        return