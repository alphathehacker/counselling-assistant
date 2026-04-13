import csv
import re

source_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_colleges_full_details_FINAL_v2.csv'
output_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_colleges_full_details_FINAL_v3.csv'

with open(source_path, 'r', encoding='utf-8') as f:
    reader = list(csv.DictReader(f))
    headers = list(reader[0].keys())

for row in reader:
    # If district is still empty, and city is empty, but state exists
    # Use state as district (mostly for UTs like Delhi, Pondicherry)
    if not row.get('District'):
        state = row.get('State *', '').strip()
        if state in ["Delhi", "Pondicherry", "Chandigarh", "Goa"]:
            row['District'] = state
        else:
            # Check City column again
            city = row.get('City *', '').strip()
            if city and city.lower() not in ["virudhunagar", "nan", ""]:
                row['District'] = city

with open(output_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    writer.writerows(reader)

print(f"Final polished CSV saved to {output_path}")
