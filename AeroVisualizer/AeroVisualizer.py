import sqlite3
import os
import json
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

# Add parent dir to path to import AeroNavigator
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import AeroNavigator.AeroNavigator as AeroNavigator

def get_latest_data():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, "AeroSentinel", "district_pulse.db")
    
    active_district = AeroNavigator.get_active_district()
    
    data = {
        "pt": 0,
        "msg": "",
        "status": "",
        "active_district": active_district
    }
    
    if not os.path.exists(db_path):
        return data
        
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get Points
        cursor.execute("SELECT pure_tokens_balance FROM sustainability_bank WHERE district_id = ?", (active_district,))
        row = cursor.fetchone()
        if row:
            data["pt"] = row[0]
            
        # Get Latest Message
        cursor.execute("SELECT status, weather_desc FROM environment_logs WHERE district_name = ? ORDER BY timestamp DESC LIMIT 1", (active_district,))
        log_row = cursor.fetchone()
        if log_row:
            data["status"] = log_row[0]
            data["msg"] = log_row[1]
            
        conn.close()
    except Exception as e:
        print(f"DB Error: {e}")
        
    return data

class RequestHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type")
        self.end_headers()
        

            
    def do_POST(self):
        if self.path == '/api/location':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            lat = data.get('lat')
            lng = data.get('lng')
            
            district = AeroNavigator.resolve_district(lat, lng)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"district": district}).encode('utf-8'))
        elif self.path == '/api/start-camera':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            is_green_route = data.get('isGreenRoute', False)
            
            # Stop any existing camera processes first (using a safer method)
            import os, subprocess, sys
            current_pid = os.getpid()
            try:
                # Kill other python processes but not myself
                if os.name == 'nt':
                    # On Windows, we can use taskkill with a filter or just ignore errors
                    # We'll try to find processes running the camera script specifically if possible
                    # For now, let's just ensure we don't kill the main server if we can help it
                    # But taskkill /im python.exe is blunt. Let's use a more specific check.
                    pass 
            except: pass

            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            stream_script = os.path.join(base_dir, "AeroSight", "AeroCameraStream.py")
            aerosight_script = os.path.join(base_dir, "AeroSight", "AeroSight.py")
            
            # Windows specific flag to hide console windows
            CREATE_NO_WINDOW = 0x08000000
            
            # Launch MJPEG stream server (Master Camera Process)
            subprocess.Popen([sys.executable, stream_script], env=dict(os.environ, PYTHONIOENCODING="utf-8"), creationflags=CREATE_NO_WINDOW)
            # Launch AeroSight AI analysis (Consumer Process)
            subprocess.Popen([sys.executable, aerosight_script], env=dict(os.environ, PYTHONIOENCODING="utf-8"), creationflags=CREATE_NO_WINDOW)
            
            # Award 20 PT if green route
            if is_green_route:
                sys.path.append(base_dir)
                import AeroSentinel.AeroSentinel as AeroSentinel
                active_district = AeroNavigator.get_active_district()
                db_path = os.path.join(base_dir, "AeroSentinel", "district_pulse.db")
                conn = AeroSentinel.initialize_database(db_name=db_path)
                AeroSentinel.process_aerosight_data(conn, {"points": 20, "message": "مكافأة المسار الأخضر الآمن المباشرة 🌿"}, district_name=active_district)
                conn.close()
                
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "camera_started"}).encode('utf-8'))
        elif self.path == '/api/analyze-event':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            desc = data.get('description', 'Unknown Violation')
            
            # Logic: Log violation via AeroSentinel
            import os, sys
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            sys.path.append(base_dir)
            import AeroSentinel.AeroSentinel as AeroSentinel
            
            active_district = AeroNavigator.get_active_district()
            db_path = os.path.join(base_dir, "AeroSentinel", "district_pulse.db")
            conn = AeroSentinel.initialize_database(db_name=db_path)
            
            # Penalize (Negative points)
            points = -25 # Standard penalty for simulation violations
            AeroSentinel.process_aerosight_data(conn, {"points": points, "message": f"تم رصد {desc} - جاري الخصم..."}, district_name=active_district)
            conn.close()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"msg": f"AeroSentinel [🧠]: تم توثيق المخالفة ({desc}) في السجل الحضري."}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        if self.path == '/api/status':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            data = get_latest_data()
            self.wfile.write(json.dumps(data).encode('utf-8'))
        elif self.path.startswith('/api/camera-feed'):
            import os
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            frame_path = os.path.join(base_dir, "AeroSight", "latest_frame.jpg")
            
            if os.path.exists(frame_path):
                self.send_response(200)
                self.send_header('Content-type', 'image/jpeg')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Cache-Control', 'no-store, max-age=0')
                self.end_headers()
                with open(frame_path, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.send_response(404)
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        # Suppress logging to keep terminal clean
        pass

def run(server_class=HTTPServer, handler_class=RequestHandler, port=5000):
    server_address = ('127.0.0.1', port)
    httpd = server_class(server_address, handler_class)
    print(f"AeroVisualizer 📊: API Server running on http://127.0.0.1:{port}/")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()

if __name__ == '__main__':
    run()
