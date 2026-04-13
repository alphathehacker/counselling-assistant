import csv
import re

source_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_colleges_full_details.csv'
output_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_colleges_full_details_v2.csv'

def extract_pincode(address):
    # Match a 6-digit number that isn't part of a larger number
    # Often formatted like "Mangaluru - 575004" or "Dhule-424001"
    match = re.search(r'(?<!\d)(\d{6})(?!\d)', address)
    return match.group(1) if match else ""

def extract_district(row):
    address = row.get('Address', '')
    city = row.get('City *', '')
    
    # 1. Look for common District patterns in address
    # e.g., "Dakshina Kannada District", "Distt. Durg", "Idukki (Dist)"
    dist_patterns = [
        r'([^,]+?)\s+District',
        r'Dist[rt]\.?\s+([^,]+)',
        r'([^,]+?)\s+\(Dist\)',
        r'([^,]+?)\s+\(Dt\)',
    ]
    
    for pattern in dist_patterns:
        match = re.search(pattern, address, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    
    # 2. Try simple comma-delimited check (usually City, District, State)
    # But this is unreliable. city is safer.
    
    return city # Fallback to City as District

with open(source_path, 'r', encoding='utf-8') as f:
    reader = list(csv.DictReader(f))
    headers = list(reader[0].keys())

for row in reader:
    address = row.get('Address', '')
    
    # Update Pincode if empty
    if not row.get('Pincode'):
        row['Pincode'] = extract_pincode(address)
    
    # Update District if empty or generic
    if not row.get('District') or row['District'].lower() == "district":
        row['District'] = extract_district(row)
    
    # Clean up District (remove noise)
    if row['District']:
        row['District'] = re.sub(r'\(|\)|-|\s+Dist.*', '', row['District']).strip()

with open(output_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    writer.writerows(reader)

print(f"Updated CSV with Pincode and District saved to {output_path}")
