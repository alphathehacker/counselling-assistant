import json
import csv
import re
from difflib import SequenceMatcher

nmc_json_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\nmc_raw_data.json'
csv_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_colleges_formatted.csv'
output_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_colleges_updated.csv'

def normalize(s):
    if not s: return ""
    s = s.lower()
    # Handle common aliases
    s = s.replace('all india institute of medical sciences', 'aiims')
    s = s.replace('rajiv gandhi institute of medical sciences', 'rims')
    s = s.replace('gmers medical college', 'gmers')
    s = s.replace('gems medical college', 'gems')
    s = re.sub(r'[^a-z0-9]', ' ', s)
    # Remove common words
    s = re.sub(r'\b(medical college|institute|of|sciences|research|and|centre|hospital|govt|government|private|society|trust|deemed|university|dr|sri|smt|the|and|collage)\b', '', s)
    return " ".join(s.split())

def similar(a, b):
    return SequenceMatcher(None, normalize(a), normalize(b)).ratio()

# Load NMC Data
with open(nmc_json_path, 'r', encoding='utf-8', errors='replace') as f:
    nmc_data = json.load(f)

nmc_list = nmc_data.get('ugCollege', [])
print(f"Loaded {len(nmc_list)} colleges from NMC data.")

# Index NMC data by normalized name
nmc_map = {}
for item in nmc_list:
    n_name = normalize(item.get('collegeName', ''))
    if n_name:
        nmc_map[n_name] = item

# Read Formatted CSV
with open(csv_path, 'r', encoding='utf-8') as f:
    reader = list(csv.DictReader(f))
    headers = reader[0].keys()

updated_rows = []
matched_count = 0

for row in reader:
    college_name = row['College Name *']
    n_name = normalize(college_name)
    
    # Try exact normalized match
    nmc_item = nmc_map.get(n_name)
    
    # If not found, try smarter matching
    if not nmc_item:
        best_score = 0
        best_match = None
        for n_nmc, item in nmc_map.items():
            # word set match (e.g. "BRD Medical College" and "BRD Medical College, Gorakhpur")
            words_src = set(n_name.split())
            words_nmc = set(n_nmc.split())
            
            if not words_src or not words_nmc: continue
            
            # Check if one set is a subset of another
            if words_src.issubset(words_nmc) or words_nmc.issubset(words_src):
                score = 0.95
            else:
                score = similar(n_name, n_nmc)
            
            if score > 0.8: 
                if score > best_score:
                    best_score = score
                    best_match = item
        
        if best_score > 0.8:
            nmc_item = best_match

    if nmc_item:
        matched_count += 1
        # Update fields
        row['City *'] = nmc_item.get('city', row['City *']) or row['City *']
        row['State *'] = nmc_item.get('stateName', row['State *']) or row['State *']
        row['Address'] = nmc_item.get('address', '').replace('\n', ' ').strip()
        row['Established Year'] = nmc_item.get('yearOfInc', '')
        row['Affiliation'] = nmc_item.get('universityName', '')
        row['Website'] = nmc_item.get('website', '')
        row['Phone'] = nmc_item.get('telephone', '')
        row['Email'] = nmc_item.get('email', '')
        row['College Type *'] = nmc_item.get('managementupdate', row['College Type *'])
        
        # Mapping management type to simpler Govt/Private
        m_type = row['College Type *'].lower()
        if 'govt' in m_type:
            row['College Type *'] = 'Government'
        elif any(x in m_type for x in ['private', 'trust', 'society', 'deemed']):
            row['College Type *'] = 'Private'

        # Basic Fee heuristic if still 0
        if row['Annual Tuition Fee'] == "0" or row['Annual Tuition Fee'] == 0:
            if row['College Type *'] == 'Government':
                row['Annual Tuition Fee'] = 15000 # Typical govt fee
            else:
                row['Annual Tuition Fee'] = 1200000 # Typical private fee proxy

    updated_rows.append(row)

# Write output
with open(output_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=list(headers))
    writer.writeheader()
    writer.writerows(updated_rows)

print(f"Successfully matched and updated {matched_count} out of {len(reader)} colleges.")
print(f"Updated CSV saved to {output_path}")
