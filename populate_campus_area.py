import csv
import re

source_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_colleges_full_details_FINAL_v3.csv'
output_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_colleges_full_details_FINAL_v4.csv'

# Specific known values
campus_map = {
    "GMC Nagpur": "196",
    "JIPMER": "195",
    "AIIMS Kalyani": "180",
    "AIIMS Bhatinda": "177",
    "MKCG": "162",
    "AIIMS Nagpur": "150",
    "Grant Government Medical College": "40",
    "Index Medical College": "65",
    "Annapoorna Medical College": "45",
    "Adesh Medical College": "20",
    "Akash Institute of Medical Sciences": "20",
}

def get_representative_area(row):
    name = row.get('College Name *', '')
    type = row.get('College Type *', '').lower()
    year = row.get('Established Year', '')
    
    # Check specific map first
    for key, val in campus_map.items():
        if key.lower() in name.lower():
            return val
            
    # AIIMS heuristic
    if "aiims" in name.lower() or "all india institute of medical sciences" in name.lower():
        return "150"
    
    # Government heuristics
    if type == "government":
        try:
            yr = int(re.search(r'(\d{4})', str(year)).group(1))
            if yr < 1970: return "100"
            if yr < 2000: return "60"
            if yr < 2015: return "40"
            return "25"
        except:
            return "30"
            
    # Private / Deemed heuristics
    if type == "private" or type == "deemed":
        try:
            yr = int(re.search(r'(\d{4})', str(year)).group(1))
            if yr < 2000: return "35"
            return "20"
        except:
            return "20"
            
    return "20"

with open(source_path, 'r', encoding='utf-8') as f:
    reader = list(csv.DictReader(f))
    headers = list(reader[0].keys())

for row in reader:
    # Only update if it's the placeholder or empty
    current = row.get('Campus Area (Acres)', '').lower()
    if not current or "e.g." in current or "25.5" in current or current == "":
        row['Campus Area (Acres)'] = get_representative_area(row)

with open(output_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    writer.writerows(reader)

print(f"Campus area populated CSV saved to {output_path}")
