import sqlite3

dbs = [
    'C:/Users/S4C/Desktop/AeroSmart/district_pulse.db',
    'C:/Users/S4C/Desktop/AeroSmart/AeroSentinel/district_pulse.db'
]

for path in dbs:
    print('===== ' + path + ' =====')
    con = sqlite3.connect(path)
    cur = con.cursor()
    tables = cur.execute("SELECT name, type FROM sqlite_master WHERE type='table'").fetchall()
    for (name, t) in tables:
        print('  TABLE: ' + name)
        cols = cur.execute('PRAGMA table_info(' + name + ')').fetchall()
        for c in cols:
            print('    - ' + c[1] + ' (' + c[2] + ')')
        count = cur.execute('SELECT COUNT(*) FROM ' + name).fetchone()
        print('    => ' + str(count[0]) + ' rows')
        # Show sample data
        sample = cur.execute('SELECT * FROM ' + name + ' LIMIT 2').fetchall()
        for row in sample:
            print('    ROW: ' + str(row))
    con.close()
    print()
