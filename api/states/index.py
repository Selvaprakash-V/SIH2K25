from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        try:
            # Try to import and use MongoDB
            try:
                from pymongo import MongoClient
                
                # MongoDB connection
                MONGO_URI = "mongodb+srv://yugenjr847:yugen842007@zeroday1.0mwqypn.mongodb.net/sih2?retryWrites=true&w=majority&appName=Zeroday1"
                client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
                db = client.sih2
                
                # Try to get states from villages collection
                villages_collection = db.villages
                states = villages_collection.distinct("state")
                
                if states:
                    response = {
                        "states": sorted(states),
                        "source": "database",
                        "count": len(states)
                    }
                else:
                    # No data in database, use fallback
                    response = {
                        "states": ["Sikkim", "West Bengal", "Assam", "Arunachal Pradesh", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Tripura"],
                        "source": "fallback_no_data",
                        "count": 9
                    }
                
                client.close()
                
            except ImportError:
                # PyMongo not available, use fallback
                response = {
                    "states": ["Sikkim", "West Bengal", "Assam", "Arunachal Pradesh", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Tripura"],
                    "source": "fallback_no_pymongo",
                    "count": 9
                }
            except Exception as db_error:
                # Database connection failed, use fallback
                response = {
                    "states": ["Sikkim", "West Bengal", "Assam", "Arunachal Pradesh", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Tripura"],
                    "source": f"fallback_db_error: {str(db_error)}",
                    "count": 9
                }
                
        except Exception as e:
            # Complete fallback
            response = {
                "states": ["Sikkim"],
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
