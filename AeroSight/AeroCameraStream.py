"""
AeroSight Camera Stream Server
Runs as a separate MJPEG stream server on port 5001.
This lets the browser receive a true live video feed without polling.
"""
import cv2
import threading
import sys
import os
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

# Shared frame buffer
latest_frame_lock = threading.Lock()
latest_frame_bytes = None
camera_active = False

def capture_loop():
    global latest_frame_bytes, camera_active
    print("AeroSight: [DEBUG] Attempting VideoCapture(0, CAP_DSHOW)...")
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    
    if not cap.isOpened():
        print("AeroSight: [DEBUG] DSHOW failed, trying default...")
        cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("AeroSight: [FAIL] Camera 0 could not be opened with any backend.")
        return
    
    print("AeroSight: [SUCCESS] Camera opened. Warming up...")
    # Warm up to ensure frames are flowing
    for i in range(10):
        cap.grab()
    
    camera_active = True
    # Save frame directly to dashboard folder for easy browser polling
    frame_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'AeroSmart_Dashboard', 'latest_frame.jpg')
    
    while camera_active:
        ret, frame = cap.read()
        if ret:
            # Save for AI analysis and browser feed
            try:
                # Resize slightly for faster disk I/O
                small_frame = cv2.resize(frame, (640, 480))
                cv2.imwrite(frame_path, small_frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                
                # Also keep in memory for MJPEG server if needed
                _, buf = cv2.imencode('.jpg', small_frame)
                with latest_frame_lock:
                    latest_frame_bytes = buf.tobytes()
            except Exception as e:
                print(f"Error saving frame: {e}")
        else:
            # Fallback frame
            import numpy as np
            fallback = np.zeros((480, 640, 3), dtype=np.uint8)
            fallback[:] = (15, 40, 15)
            cv2.putText(fallback, "AeroSight: Restarting Camera...", (100, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
            cv2.imwrite(frame_path, fallback)
            cap.release()
            time.sleep(2)
            cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
        
        time.sleep(0.1) # 10 FPS is enough and stable for disk writing
    
    cap.release()


class MJPEGHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/stream':
            self.send_response(200)
            self.send_header('Content-Type', 'multipart/x-mixed-replace; boundary=frame')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self.send_header('Connection', 'close')
            self.end_headers()
            
            try:
                # Wait for first frame to be ready
                timeout = 50 # 5 seconds
                while latest_frame_bytes is None and timeout > 0:
                    time.sleep(0.1)
                    timeout -= 1
                    
                while True:
                    with latest_frame_lock:
                        frame_data = latest_frame_bytes
                    
                    if frame_data:
                        self.wfile.write(b'--frame\r\n')
                        self.wfile.write(b'Content-Type: image/jpeg\r\n')
                        self.wfile.write(f'Content-Length: {len(frame_data)}\r\n\r\n'.encode())
                        self.wfile.write(frame_data)
                        self.wfile.write(b'\r\n')
                        self.wfile.flush()
                    
                    time.sleep(0.04)  # ~25 FPS
            except Exception as e:
                pass  # Client disconnected or error
        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        pass  # Silence HTTP logs


def start_stream_server():
    server = HTTPServer(('127.0.0.1', 5099), MJPEGHandler)
    print("AeroSight MJPEG Server: Running on http://127.0.0.1:5099/stream")
    server.serve_forever()


if __name__ == '__main__':
    # Start capture in background thread
    cam_thread = threading.Thread(target=capture_loop, daemon=True)
    cam_thread.start()
    
    # Start MJPEG server (blocks)
    start_stream_server()
