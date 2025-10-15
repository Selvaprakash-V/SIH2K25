from http.server import BaseHTTPRequestHandler
import json
from urllib.parse import urlparse, parse_qs

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
        
        state = query_params.get('state', [None])[0]
        district = query_params.get('district', [None])[0]
        
        # Fallback villages data
        villages = [
            {"id": "1", "name": "Gangtok", "district": "East Sikkim", "state": "Sikkim", "population": 100286, "sc_population": 1654},
            {"id": "2", "name": "Namchi", "district": "South Sikkim", "state": "Sikkim", "population": 12949, "sc_population": 1045},
            {"id": "3", "name": "Pelling", "district": "West Sikkim", "state": "Sikkim", "population": 6700, "sc_population": 540},
            {"id": "4", "name": "Mangan", "district": "North Sikkim", "state": "Sikkim", "population": 4955, "sc_population": 398},
            {"id": "5", "name": "Rangpo", "district": "East Sikkim", "state": "Sikkim", "population": 8946, "sc_population": 715},
            {"id": "6", "name": "Jorethang", "district": "South Sikkim", "state": "Sikkim", "population": 10135, "sc_population": 811},
            {"id": "7", "name": "Gyalshing", "district": "West Sikkim", "state": "Sikkim", "population": 9894, "sc_population": 791},
            {"id": "8", "name": "Chungthang", "district": "North Sikkim", "state": "Sikkim", "population": 1200, "sc_population": 96},
            {"id": "9", "name": "Singtam", "district": "East Sikkim", "state": "Sikkim", "population": 8500, "sc_population": 680},
            {"id": "10", "name": "Ravangla", "district": "South Sikkim", "state": "Sikkim", "population": 2500, "sc_population": 200},
            {"id": "11", "name": "Kolkata Village", "district": "Kolkata", "state": "West Bengal", "population": 150000, "sc_population": 22500},
            {"id": "12", "name": "Darjeeling Village", "district": "Darjeeling", "state": "West Bengal", "population": 18000, "sc_population": 2700},
            {"id": "13", "name": "Guwahati Village", "district": "Kamrup", "state": "Assam", "population": 45000, "sc_population": 6750},
            {"id": "14", "name": "Mumbai Village", "district": "Mumbai", "state": "Maharashtra", "population": 200000, "sc_population": 30000},
            {"id": "15", "name": "Bangalore Village", "district": "Bangalore", "state": "Karnataka", "population": 180000, "sc_population": 27000}
        ]
        
        # Filter by state if provided
        if state:
            villages = [v for v in villages if v['state'].lower() == state.lower()]
        
        # Filter by district if provided
        if district:
            villages = [v for v in villages if v['district'].lower() == district.lower()]
        
        response = {
            "villages": villages,
            "state": state,
            "district": district,
            "source": "fallback",
            "count": len(villages)
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