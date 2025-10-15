from http.server import BaseHTTPRequestHandler
import json
import urllib.request
import urllib.error

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        try:
            # First test - simple connectivity check
            response = {
                "status": "testing",
                "message": "Database test endpoint is working",
                "python_version": "Available",
                "imports": {
                    "json": "✅ Available",
                    "urllib": "✅ Available"
                }
            }
            
            # Try to import pymongo
            try:
                import pymongo
                response["imports"]["pymongo"] = "✅ Available"
                response["pymongo_version"] = pymongo.version
                
                # Try actual connection
                try:
                    from pymongo import MongoClient
                    MONGO_URI = "mongodb+srv://yugenjr847:yugen842007@zeroday1.0mwqypn.mongodb.net/sih2?retryWrites=true&w=majority&appName=Zeroday1"
                    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
                    
                    # Test ping
                    client.admin.command('ping')
                    response["database_connection"] = "✅ Connected"
                    
                    # Get database info
                    db = client.sih2
                    collections = db.list_collection_names()
                    response["collections"] = collections
                    response["database"] = "sih2"
                    
                    client.close()
                    
                except Exception as db_error:
                    response["database_connection"] = f"❌ Failed: {str(db_error)}"
                    
            except ImportError as import_error:
                response["imports"]["pymongo"] = f"❌ Import Failed: {str(import_error)}"
                response["database_connection"] = "❌ PyMongo not available"
            
        except Exception as e:
            response = {
                "status": "error",
                "message": f"Test failed: {str(e)}",
                "error_type": type(e).__name__
            }
        
        self.wfile.write(json.dumps(response, indent=2).encode())
        return
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        return