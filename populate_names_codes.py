import csv
import re

source_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_colleges_full_details_FINAL_v4.csv'
output_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_colleges_full_details_FINAL_v5.csv'

def generate_short_name_and_code(full_name, city):
    name = full_name.strip()
    city = city.strip()
    
    # 1. Handle AIIMS
    if "all india institute of medical sciences" in name.lower() or "aiims" in name.lower():
        short = f"AIIMS {city}"
        code = f"AIIMS-{city[:3].upper()}"
        return short, code
        
    # 2. Handle GMC
    if "government medical college" in name.lower() or "govt medical college" in name.lower():
        short = f"GMC {city}"
        code = f"GMC-{city[:3].upper()}"
        return short, code

    # 3. Handle Private/Others
    # Strip common suffixes
    clean_name = re.sub(r'(?i)\b(Institute of Medical Sciences|Medical College|Research Centre|Hospital|and Research|Institute|College of Medical Sciences|Medical Sciences)\b', '', name).strip()
    clean_name = re.sub(r'\s+', ' ', clean_name)
    
    # Get initials for code
    parts = clean_name.split()
    initials = "".join([p[0].upper() for p in parts if p]).strip()
    
    short = f"{clean_name} {city}" if city.lower() not in clean_name.lower() else clean_name
    code = f"{initials}-{city[:3].upper()}"
    
    # Trim if too long
    if len(short) > 30:
        short = short[:27] + "..."
        
    return short, code

with open(source_path, 'r', encoding='utf-8') as f:
    reader = list(csv.DictReader(f))
    headers = list(reader[0].keys())

for row in reader:
    full_name = row.get('College Name *', '')
    city = row.get('City *', '')
    if city.lower() in ['virudhunagar', 'nan', '']:
        # Try to use District as city fallback for naming
        city = row.get('District', city)

    short, code = generate_short_name_and_code(full_name, city)
    
    # Populate if empty or placeholder
    if not row.get('Short Name') or row.get('Short Name').strip() == "":
        row['Short Name'] = short
    if not row.get('College Code') or row.get('College Code').strip() == "":
        row['College Code'] = code

with open(output_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    writer.writerows(reader)

print(f"Short names and codes populated in {output_path}")
