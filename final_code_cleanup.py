import csv
import re

source_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_colleges_full_details_FINAL_v5.csv'
output_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_colleges_full_details_FINAL_v6.csv'

with open(source_path, 'r', encoding='utf-8') as f:
    reader = list(csv.DictReader(f))
    headers = list(reader[0].keys())

for row in reader:
    # Fix double spaces in short name
    if row.get('Short Name'):
        row['Short Name'] = re.sub(r'\s+', ' ', row['Short Name']).strip()
    
    # Ensure college code is uppercase and no weird chars
    if row.get('College Code'):
        row['College Code'] = re.sub(r'[^A-Z0-9-]', '', row['College Code'].upper())

with open(output_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    writer.writerows(reader)

print("Final cleanup of names and codes complete.")
