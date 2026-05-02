import sqlite3
import datetime
import os
import math

def connect_db():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, "AeroSentinel", "district_pulse.db")
    return sqlite3.connect(db_path)

def initialize_system_state(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS system_state (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    """)
    # Insert default if not exists
    cursor.execute("INSERT OR IGNORE INTO system_state (key, value) VALUES ('active_district', 'حي الصحابة')")

def calculate_distance(lat1, lon1, lat2, lon2):
    # Simple Euclidean distance for local approximation
    return math.sqrt((lat1 - lat2)**2 + (lon1 - lon2)**2)

def resolve_district(lat, lng):
    # Predefined Amman districts with approximate center coords
    districts = {
        "الجبيهة": (32.02, 35.87),
        "تلاع العلي": (31.99, 35.85),
        "خلدا": (31.98, 35.84),
        "سحاب": (31.87, 36.00),
        "القسطل": (31.74, 35.94),
        "وسط البلد": (31.95, 35.93),
        "حي الصحابة": (31.92, 35.88)
    }
    
    closest_district = "حي الصحابة"
    min_dist = float('inf')
    
    for name, coords in districts.items():
        dist = calculate_distance(lat, lng, coords[0], coords[1])
        if dist < min_dist:
            min_dist = dist
            closest_district = name
            
    conn = connect_db()
    cursor = conn.cursor()
    initialize_system_state(cursor)
    
    # Ensure district exists in sustainability_bank
    cursor.execute("""
        INSERT OR IGNORE INTO sustainability_bank (district_id, pure_tokens_balance, last_update)
        VALUES (?, 100, ?)
    """, (closest_district, datetime.datetime.now()))
    
    # Update active district
    cursor.execute("UPDATE system_state SET value = ? WHERE key = 'active_district'", (closest_district,))
    conn.commit()
    conn.close()
    
    print(f"AeroNavigator 📡: Geolocation resolved to '{closest_district}'")
    return closest_district

def get_active_district():
    conn = connect_db()
    cursor = conn.cursor()
    initialize_system_state(cursor)
    cursor.execute("SELECT value FROM system_state WHERE key = 'active_district'")
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else "حي الصحابة"

def setup_routes_table(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transport_routes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            district_name TEXT,
            active_path TEXT,
            safety_level TEXT,
            last_update DATETIME
        )
    """)

def aero_navigator_routine():
    # Retaining old routine code for compatibility
    pass

if __name__ == "__main__":
    # Test resolve
    resolve_district(32.01, 35.86) # Should be الجبيهة
