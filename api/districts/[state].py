from http.server import BaseHTTPRequestHandler
import json
from urllib.parse import urlparse
from pymongo import MongoClient

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        # Parse the URL to get the state parameter
        url_parts = urlparse(self.path)
        path_parts = url_parts.path.split('/')
        
        # Extract state from URL path like /api/districts/Sikkim
        if len(path_parts) >= 4:
            state = path_parts[3]
        else:
            state = "Sikkim"  # default
        
        try:
            # MongoDB connection
            MONGO_URI = "mongodb+srv://yugenjr847:yugen842007@zeroday1.0mwqypn.mongodb.net/sih2?retryWrites=true&w=majority&appName=Zeroday1"
            client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
            db = client.sih2
            
            # Get districts from villages collection for the specified state
            villages_collection = db.villages
            districts = villages_collection.distinct("district", {"state": state})
            
            # If no districts found, use fallback data
            if not districts:
                districts_map = {
                    "Sikkim": ["East Sikkim", "South Sikkim", "West Sikkim", "North Sikkim"],
                    "sikkim": ["East Sikkim", "South Sikkim", "West Sikkim", "North Sikkim"],
                    "West Bengal": ["Kolkata", "Darjeeling", "North 24 Parganas", "South 24 Parganas"],
                    "west bengal": ["Kolkata", "Darjeeling", "North 24 Parganas", "South 24 Parganas"],
                    "Assam": ["Kamrup", "Dibrugarh", "Jorhat", "Nagaon"],
                    "assam": ["Kamrup", "Dibrugarh", "Jorhat", "Nagaon"],
                }
                districts = districts_map.get(state, districts_map.get(state.lower(), []))
            
            response = {"districts": sorted(districts)}
            client.close()
            
        except Exception as e:
            # Fallback to mock data if database connection fails
            districts_map = {
                "Sikkim": ["East Sikkim", "South Sikkim", "West Sikkim", "North Sikkim"],
                "sikkim": ["East Sikkim", "South Sikkim", "West Sikkim", "North Sikkim"],
                "West Bengal": ["Kolkata", "Darjeeling", "North 24 Parganas", "South 24 Parganas"],
                "west bengal": ["Kolkata", "Darjeeling", "North 24 Parganas", "South 24 Parganas"],
            }
            districts = districts_map.get(state, districts_map.get(state.lower(), []))
            response = {"districts": districts}
        
        self.wfile.write(json.dumps(response).encode())
        return
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        return