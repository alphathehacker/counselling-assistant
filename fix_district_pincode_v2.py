import csv
import re

source_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_colleges_full_details_v2.csv'
output_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_colleges_full_details_v3.csv'

def clean_text(text):
    if not text: return ""
    # Remove common placeholder words
    if text.strip().lower() in ["virudhunagar", "district", "e.g.", "nan", ""]: 
        return ""
    return text.strip()

def extract_pincode(address):
    if not address: return ""
    # Look for 6-digit pin
    match = re.search(r'(?<!\d)(\d{6})(?!\d)', address)
    return match.group(1) if match else ""

def extract_district_refined(row):
    address = row.get('Address', '')
    city = row.get('City *', '')
    state = row.get('State *', '')
    
    # 1. Search in Address for "District" or "Dist"
    dist_patterns = [
        r'DISTRICT\s*[:-]\s*([^,]+)',
        r'DIST\.?\s*[:-]\s*([^,]+)',
        r'([^,]+?)\s+District',
        r'([^,]+?)\s+\(Dist\)',
        r'([^,]+?)\s+\(Dt\)',
        r'([^,]+?)\s+Distt\.?',
    ]
    
    for pattern in dist_patterns:
        match = re.search(pattern, address, re.IGNORECASE)
        if match:
            cand = match.group(1).strip()
            # Basic validation: not just numbers, not too long
            if cand and not cand.isdigit() and len(cand) < 30:
                return cand.strip()

    # 2. If city isn't a placeholder, use it
    if clean_text(city):
        return city
        
    return ""

with open(source_path, 'r', encoding='utf-8') as f:
    reader = list(csv.DictReader(f))
    headers = list(reader[0].keys())

for row in reader:
    addr = row.get('Address', '')
    
    # Extract Pin if missing or wrong
    if not clean_text(row.get('Pincode')):
        row['Pincode'] = extract_pincode(addr)
    
    # Extract District
    current_dist = clean_text(row.get('District'))
    if not current_dist or current_dist.lower() == "virudhunagar":
        new_dist = extract_district_refined(row)
        if new_dist:
            row['District'] = new_dist
            
    # Final cleaning of District
    dist = row.get('District', '')
    dist = re.sub(r'\(|\)|-|\s+Dist.*', '', dist, flags=re.IGNORECASE).strip()
    # Remove some common noise
    dist = re.sub(r'\d+$', '', dist).strip() # Remove trailing numbers like "Pincode 517584"
    row['District'] = dist

with open(output_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    writer.writerows(reader)

print(f"Refined CSV saved to {output_path}")
