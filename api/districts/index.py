from http.server import BaseHTTPRequestHandler
import json
import urllib.parse

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        # Parse query parameters
        url_parts = urllib.parse.urlparse(self.path)
        query_params = urllib.parse.parse_qs(url_parts.query)
        state = query_params.get('state', [''])[0]
        
        try:
            # Try to import and use MongoDB
            try:
                from pymongo import MongoClient
                
                # MongoDB connection
                MONGO_URI = "mongodb+srv://yugenjr847:yugen842007@zeroday1.0mwqypn.mongodb.net/sih2?retryWrites=true&w=majority&appName=Zeroday1"
                client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
                db = client.sih2
                
                # Try to get districts from villages collection
                villages_collection = db.villages
                if state:
                    districts = villages_collection.distinct("district", {"state": state})
                else:
                    districts = villages_collection.distinct("district")
                
                if districts:
                    response = {
                        "districts": sorted(districts),
                        "state": state,
                        "source": "database",
                        "count": len(districts)
                    }
                else:
                    # No data in database, use fallback
                    fallback_districts = {
                        "Sikkim": ["East Sikkim", "West Sikkim", "North Sikkim", "South Sikkim"],
                        "West Bengal": ["Kolkata", "Darjeeling", "Jalpaiguri", "Howrah", "Hooghly"],
                        "Assam": ["Kamrup", "Guwahati", "Dibrugarh", "Jorhat", "Silchar"]
                    }
                    response = {
                        "districts": fallback_districts.get(state, ["Central District", "Eastern District", "Western District"]),
                        "state": state,
                        "source": "fallback_no_data",
                        "count": len(fallback_districts.get(state, ["Central District", "Eastern District", "Western District"]))
                    }
                
                client.close()
                
            except ImportError:
                # PyMongo not available, use fallback
                fallback_districts = {
                    "Sikkim": ["East Sikkim", "West Sikkim", "North Sikkim", "South Sikkim"],
                    "West Bengal": ["Kolkata", "Darjeeling", "Jalpaiguri", "Howrah", "Hooghly"],
                    "Assam": ["Kamrup", "Guwahati", "Dibrugarh", "Jorhat", "Silchar"]
                }
                response = {
                    "districts": fallback_districts.get(state, ["Central District", "Eastern District", "Western District"]),
                    "state": state,
                    "source": "fallback_no_pymongo",
                    "count": len(fallback_districts.get(state, ["Central District", "Eastern District", "Western District"]))
                }
            except Exception as db_error:
                # Database connection failed, use fallback
                fallback_districts = {
                    "Sikkim": ["East Sikkim", "West Sikkim", "North Sikkim", "South Sikkim"],
                    "West Bengal": ["Kolkata", "Darjeeling", "Jalpaiguri", "Howrah", "Hooghly"],
                    "Assam": ["Kamrup", "Guwahati", "Dibrugarh", "Jorhat", "Silchar"]
                }
                response = {
                    "districts": fallback_districts.get(state, ["Central District", "Eastern District", "Western District"]),
                    "state": state,
                    "source": f"fallback_db_error: {str(db_error)}",
                    "count": len(fallback_districts.get(state, ["Central District", "Eastern District", "Western District"]))
                }
                
        except Exception as e:
            # Complete fallback
            response = {
                "districts": ["Central District"],
                "state": state,
                "source": f"complete_fallback: {str(e)}",
                "count": 1
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