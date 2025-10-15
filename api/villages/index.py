from http.server import BaseHTTPRequestHandler
import json
from urllib.parse import urlparse, parse_qs
from pymongo import MongoClient

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        # Parse query parameters
        url_parts = urlparse(self.path)
        query_params = parse_qs(url_parts.query)
        
        try:
            # MongoDB connection
            MONGO_URI = "mongodb+srv://yugenjr847:yugen842007@zeroday1.0mwqypn.mongodb.net/sih2?retryWrites=true&w=majority&appName=Zeroday1"
            client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
            db = client.sih2
            
            # Get villages from database
            villages_collection = db.villages
            
            # Build query based on parameters
            query = {}
            state = query_params.get('state', [None])[0]
            district = query_params.get('district', [None])[0]
            
            if state:
                query['state'] = state
            if district:
                query['district'] = district
            
            # Fetch villages from database
            villages_cursor = villages_collection.find(query)
            villages = []
            
            for village in villages_cursor:
                village_data = {
                    "id": str(village.get('_id', village.get('id', ''))),
                    "name": village.get('name', ''),
                    "district": village.get('district', ''),
                    "state": village.get('state', ''),
                    "population": village.get('population', 0),
                    "sc_population": village.get('sc_population', 0)
                }
                villages.append(village_data)
            
            # If no villages found in database, use fallback data
            if not villages:
                villages = [
                    {"id": "1", "name": "Gangtok", "district": "East Sikkim", "state": "Sikkim"},
                    {"id": "2", "name": "Namchi", "district": "South Sikkim", "state": "Sikkim"},
                    {"id": "3", "name": "Pelling", "district": "West Sikkim", "state": "Sikkim"},
                    {"id": "4", "name": "Mangan", "district": "North Sikkim", "state": "Sikkim"},
                    {"id": "5", "name": "Rangpo", "district": "East Sikkim", "state": "Sikkim"},
                    {"id": "6", "name": "Jorethang", "district": "South Sikkim", "state": "Sikkim"},
                    {"id": "7", "name": "Gyalshing", "district": "West Sikkim", "state": "Sikkim"},
                    {"id": "8", "name": "Chungthang", "district": "North Sikkim", "state": "Sikkim"},
                    {"id": "9", "name": "Singtam", "district": "East Sikkim", "state": "Sikkim"},
                    {"id": "10", "name": "Ravangla", "district": "South Sikkim", "state": "Sikkim"},
                ]
                
                # Filter fallback data by query parameters
                if state:
                    villages = [v for v in villages if v['state'].lower() == state.lower()]
                if district:
                    villages = [v for v in villages if v['district'].lower() == district.lower()]
            
            response = {"villages": villages}
            client.close()
            
        except Exception as e:
            # Fallback to mock data if database connection fails
            villages = [
                {"id": "1", "name": "Gangtok", "district": "East Sikkim", "state": "Sikkim"},
                {"id": "2", "name": "Namchi", "district": "South Sikkim", "state": "Sikkim"},
                {"id": "3", "name": "Pelling", "district": "West Sikkim", "state": "Sikkim"},
                {"id": "4", "name": "Mangan", "district": "North Sikkim", "state": "Sikkim"},
            ]
            response = {"villages": villages}
        
        self.wfile.write(json.dumps(response).encode())
        return
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        return