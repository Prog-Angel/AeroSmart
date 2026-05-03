import sqlite3
import datetime

def initialize_database(db_name="district_pulse.db"):
    conn = sqlite3.connect(db_name)
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS environment_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            district_name TEXT,
            aqi_level INTEGER,
            temperature REAL,
            weather_desc TEXT,
            status TEXT,
            timestamp DATETIME
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sustainability_bank (
            district_id TEXT PRIMARY KEY,
            pure_tokens_balance INTEGER,
            last_update DATETIME
        )
    """)
    
    # Initialize the district if it doesn't exist
    cursor.execute("""
        INSERT OR IGNORE INTO sustainability_bank (district_id, pure_tokens_balance, last_update)
        VALUES ('Sector-7G', 100, ?)
    """, (datetime.datetime.now(),))
    
    cursor.execute("""
        INSERT OR IGNORE INTO sustainability_bank (district_id, pure_tokens_balance, last_update)
        VALUES ('حي الصحابة', 100, ?)
    """, (datetime.datetime.now(),))

    
    conn.commit()
    return conn

def perform_scan(conn, district_name="Sector-7G"):
    cursor = conn.cursor()
    
    # Simulated environmental data
    aqi = 115 # Forcing a CRITICAL state to demonstrate notification
    temperature = 28.5
    weather_desc = "Smog and high humidity"
    timestamp = datetime.datetime.now()
    
    status = ""
    tokens_change = 0
    notification = None
    
    if aqi < 50:
        status = 'PRISTINE'
        tokens_change = 5
    elif aqi <= 100:
        status = 'MONITORING'
        tokens_change = 0
    else:
        status = 'CRITICAL'
        tokens_change = -10
        notification = f"[WARNING] CRITICAL STATE REACHED: AQI level at {aqi} in {district_name}! Triggering immediate communication to Aero-Navigator agent to reroute traffic."
        
    # SQL Queries
    insert_log_query = """
        INSERT INTO environment_logs (district_name, aqi_level, temperature, weather_desc, status, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    """
    update_bank_query = """
        UPDATE sustainability_bank
        SET pure_tokens_balance = pure_tokens_balance + ?, last_update = ?
        WHERE district_id = ?
    """
    
    cursor.execute(insert_log_query, (district_name, aqi, temperature, weather_desc, status, timestamp))
    cursor.execute(update_bank_query, (tokens_change, timestamp, district_name))
    
    cursor.execute("SELECT pure_tokens_balance FROM sustainability_bank WHERE district_id = ?", (district_name,))
    new_balance = cursor.fetchone()[0]
    
    conn.commit()
    
    print("--- DISTRICT PULSE SUMMARY ---")
    print(f"District: {district_name}")
    print(f"Timestamp: {timestamp}")
    print(f"AQI Level: {aqi}")
    print(f"Temperature: {temperature} C")
    print(f"Weather: {weather_desc}")
    print(f"Atmospheric Health Status: {status}")
    print(f"PureTokens Update: {tokens_change:+d} (Current Balance: {new_balance})")
    
    print("\n--- SQL QUERIES EXECUTED ---")
    print("CREATE TABLE IF NOT EXISTS environment_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, district_name TEXT, aqi_level INTEGER, temperature REAL, weather_desc TEXT, status TEXT, timestamp DATETIME);")
    print("CREATE TABLE IF NOT EXISTS sustainability_bank (district_id TEXT PRIMARY KEY, pure_tokens_balance INTEGER, last_update DATETIME);")
    print(f"INSERT INTO environment_logs (district_name, aqi_level, temperature, weather_desc, status, timestamp) VALUES ('{district_name}', {aqi}, {temperature}, '{weather_desc}', '{status}', '{timestamp}');")
    print(f"UPDATE sustainability_bank SET pure_tokens_balance = pure_tokens_balance + ({tokens_change}), last_update = '{timestamp}' WHERE district_id = '{district_name}';")
    
    if notification:
        print("\n--- NOTIFICATION ---")
        print(notification)

def process_aerosight_data(conn, data_json, district_name="حي الصحابة"):
    import json
    cursor = conn.cursor()
    
    try:
        if isinstance(data_json, str):
            data = json.loads(data_json)
        else:
            data = data_json
            
        points = data.get("points", 0)
        message = data.get("message", "No message provided")
        timestamp = datetime.datetime.now()
        
        # --- AeroPredictor Logic ---
        # Fetch last point addition for this district
        cursor.execute("""
            SELECT pure_tokens_balance FROM sustainability_bank WHERE district_id = ?
        """, (district_name,))
        row = cursor.fetchone()
        current_balance = row[0] if row else 0
        
        # Simplified prediction: if points > 0, we assume improvement.
        if points > 0:
            message += f" 🌟 (AeroPredictor: ملاك، أداؤك في منطقة {district_name} مستقر وممتاز!)"
        elif points < 0:
            message += f" ⚠️ (AeroPredictor: ملاك، يرجى الحذر، أداؤك في منطقة {district_name} تراجع مؤخراً.)"
            
        # Log the event
        insert_log_query = """
            INSERT INTO environment_logs (district_name, aqi_level, temperature, weather_desc, status, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        """
        cursor.execute(insert_log_query, (district_name, 0, 0.0, "AeroSight Vision", message, timestamp))
        
        # Ensure district exists in bank before updating
        cursor.execute("""
            INSERT OR IGNORE INTO sustainability_bank (district_id, pure_tokens_balance, last_update)
            VALUES (?, 100, ?)
        """, (district_name, timestamp))
        
        # Update points
        update_bank_query = """
            UPDATE sustainability_bank
            SET pure_tokens_balance = pure_tokens_balance + ?, last_update = ?
            WHERE district_id = ?
        """
        cursor.execute(update_bank_query, (points, timestamp, district_name))
        
        cursor.execute("SELECT pure_tokens_balance FROM sustainability_bank WHERE district_id = ?", (district_name,))
        new_balance = cursor.fetchone()[0]
        
        conn.commit()
        
        print("--- AEROSIGHT DATA PROCESSED BY AEROSENTINEL ---")
        print(f"District: {district_name}")
        print(f"Message from AeroSight: {message}")
        print(f"Points Awarded/Deducted: {points:+d}")
        print(f"New PureTokens Balance: {new_balance}")
        print("------------------------------------------------")
        
        return True
    except Exception as e:
        print(f"Failed to process AeroSight data: {e}")
        return False

if __name__ == "__main__":
    # Ensure we use the root database
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, "district_pulse.db")
    db_conn = initialize_database(db_name=db_path)
    perform_scan(db_conn)
    db_conn.close()
