from http.server import BaseHTTPRequestHandler
import json
from urllib.parse import urlparse

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
        
        # Mock districts data for different states
        districts_map = {
            "Sikkim": ["East Sikkim", "South Sikkim", "West Sikkim", "North Sikkim"],
            "sikkim": ["East Sikkim", "South Sikkim", "West Sikkim", "North Sikkim"],
            "West Bengal": ["Kolkata", "Darjeeling", "North 24 Parganas", "South 24 Parganas"],
            "west bengal": ["Kolkata", "Darjeeling", "North 24 Parganas", "South 24 Parganas"],
            "Assam": ["Kamrup", "Dibrugarh", "Jorhat", "Nagaon"],
            "assam": ["Kamrup", "Dibrugarh", "Jorhat", "Nagaon"],
            "Arunachal Pradesh": ["Papum Pare", "Changlang", "East Siang", "West Siang"],
            "arunachal pradesh": ["Papum Pare", "Changlang", "East Siang", "West Siang"]
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