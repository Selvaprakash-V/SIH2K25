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
        
        # Mock villages data with more comprehensive information
        all_villages = [
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
            {"id": "11", "name": "Yuksom", "district": "West Sikkim", "state": "Sikkim"},
            {"id": "12", "name": "Lachen", "district": "North Sikkim", "state": "Sikkim"},
            {"id": "13", "name": "Pakyong", "district": "East Sikkim", "state": "Sikkim"},
            {"id": "14", "name": "Temi", "district": "South Sikkim", "state": "Sikkim"},
            {"id": "15", "name": "Dentam", "district": "West Sikkim", "state": "Sikkim"}
        ]
        
        # Filter by state and district if provided
        state = query_params.get('state', [None])[0]
        district = query_params.get('district', [None])[0]
        
        filtered_villages = all_villages
        if state:
            filtered_villages = [v for v in filtered_villages if v['state'].lower() == state.lower()]
        if district:
            filtered_villages = [v for v in filtered_villages if v['district'].lower() == district.lower()]
        
        response = {"villages": filtered_villages}
        self.wfile.write(json.dumps(response).encode())
        return
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        return