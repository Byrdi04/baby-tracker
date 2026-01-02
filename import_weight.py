import pandas as pd
import sqlite3
from datetime import datetime
import json
import os

# 1. Find the database file
db_path = 'data/baby-tracker.db'  # Adjust this path if your database is elsewhere

# Check if database exists
if not os.path.exists(db_path):
    print(f"❌ Database not found at: {db_path}")
    print("Looking for .db files...")
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file.endswith('.db'):
                print(f"  Found: {os.path.join(root, file)}")
    exit(1)

# 2. Read the Excel file
excel_file = 'Ask historisk data.xlsx'

if not os.path.exists(excel_file):
    print(f"❌ Excel file not found: {excel_file}")
    exit(1)

print(f"📖 Reading {excel_file}...")
df = pd.read_excel(excel_file)

# Show what we found
print(f"   Found {len(df)} rows")
print(f"   Columns: {list(df.columns)}")
print(f"   First few rows:")
print(df.head())

# 3. Connect to database
print(f"\n💾 Connecting to database: {db_path}")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 4. Import each row
imported_count = 0

for index, row in df.iterrows():
    try:
        # Get date (first column)
        date_value = row.iloc[0]
        
        # Convert to datetime
        if isinstance(date_value, str):
            # Parse DD/MM/YYYY format
            date_obj = datetime.strptime(date_value, '%d/%m/%Y')
        else:
            # Already a datetime object from pandas
            date_obj = pd.to_datetime(date_value)
        
        # Set time to noon
        date_obj = date_obj.replace(hour=12, minute=0, second=0)
        iso_date = date_obj.isoformat() + '.000Z'
        
        # Get weight (second column) - convert grams to kg
        weight_grams = float(row.iloc[1])
        weight_kg = round(weight_grams / 1000, 2)
        
        # Create data JSON
        data = json.dumps({"amount": str(weight_kg), "unit": "kg"})
        
        # Insert into database
        cursor.execute(
            "INSERT INTO events (type, startTime, data) VALUES (?, ?, ?)",
            ('WEIGHT', iso_date, data)
        )
        
        imported_count += 1
        print(f"   ✓ {date_value} → {weight_kg} kg")
        
    except Exception as e:
        print(f"   ✗ Row {index + 1} failed: {e}")

# 5. Save and close
conn.commit()
conn.close()

print(f"\n✅ Done! Imported {imported_count} weight entries.")