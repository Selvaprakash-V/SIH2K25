from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {
            "message": "RuralIQ API is running!",
            "status": "healthy",
            "endpoints": [
                "/api/health",
                "/api/states", 
                "/api/villages",
                "/api/districts/{state}"
            ]
        }
        
        self.wfile.write(json.dumps(response).encode())
        return