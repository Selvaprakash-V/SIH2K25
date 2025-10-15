from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        # Mock villages data
        villages = [
            {"id": "1", "name": "Gangtok", "district": "East Sikkim", "state": "Sikkim"},
            {"id": "2", "name": "Namchi", "district": "South Sikkim", "state": "Sikkim"},
            {"id": "3", "name": "Pelling", "district": "West Sikkim", "state": "Sikkim"},
            {"id": "4", "name": "Mangan", "district": "North Sikkim", "state": "Sikkim"}
        ]
        
        response = {"villages": villages}
        self.wfile.write(json.dumps(response).encode())
        return