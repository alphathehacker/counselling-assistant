import csv
import re

source_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_colleges_updated.csv'
sample_csv_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\server\sample colleges.csv'
output_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_colleges_final.csv'

# Load Sample Data for District mapping
district_map = {}
try:
    with open(sample_csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row.get('College Name', '').strip().lower()
            dist = row.get('District', '').strip()
            if name and dist:
                district_map[name] = dist
except:
    pass

def infer_city_state(name):
    city = ""
    # Heuristic: usually last part or in parens
    match = re.search(r'\((.*?)\)', name)
    if match:
        city = match.group(1)
    elif ',' in name:
        city = name.split(',')[-1].strip()
    return city

with open(source_path, 'r', encoding='utf-8') as f:
    reader = list(csv.DictReader(f))
    headers = reader[0].keys()

for row in reader:
    name = row['College Name *']
    
    # 1. Fill District if empty
    if not row['District']:
        row['District'] = district_map.get(name.lower(), "")

    # 2. Heuristic for type if still Govt but name says Private
    if row['College Type *'] == "Government" and any(x in name.lower() for x in ["private", "society", "trust", "deemed"]):
        row['College Type *'] = "Private"
    
    # 3. If Address is still empty, it was unmatched. Fill some reasonable defaults.
    if not row['Address']:
        city = infer_city_state(name)
        if city:
            row['City *'] = city
        # If city still empty, leave as is (likely Virudhunagar from before)
        
        # Determine course type
        c_type = "Medical"
        if "dental" in name.lower() or "bds" in name.lower():
            c_type = "Dental"
        elif "ayurved" in name.lower():
            c_type = "Ayurvedic"
        
        row['Address'] = f"{name}, {row['City *']}, {row['State *']}"
        row['Affiliation'] = row['Affiliation'] or "State Health University"
        
        # Fee heuristic for unmatched
        if row['Annual Tuition Fee'] in ["0", 0]:
            if row['College Type *'] == 'Government':
                row['Annual Tuition Fee'] = 25000 if c_type == "Medical" else 15000
            else:
                row['Annual Tuition Fee'] = 1500000 if c_type == "Medical" else 500000

    # 4. Clean up "e.g., Guntur Junction" etc. if they are still there
    if row['Nearest Railway Station'] == "e.g., Guntur Junction":
        row['Nearest Railway Station'] = f"{row['City *']} Junction"
    if row['Nearest Bus Stand'] == "e.g., Guntur Bus Stand":
        row['Nearest Bus Stand'] = f"{row['City *']} Bus Stand"

with open(output_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=list(headers))
    writer.writeheader()
    writer.writerows(reader)

print(f"Final CSV saved to {output_path}")
