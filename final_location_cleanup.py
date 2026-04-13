import csv
import re

source_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_colleges_full_details_v3.csv'
output_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_colleges_full_details_FINAL.csv'

def clean_district_final(text):
    if not text: return ""
    # Remove 6-digit pincodes
    text = re.sub(r'\d{6}', '', text)
    # Remove common state names that might have leaked
    states = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Pondicherry", "Tripura", "Chattisgarh", "Orissa", "Tamilnadu", "UP", "MP"]
    for s in states:
        text = re.sub(re.escape(s), '', text, flags=re.IGNORECASE)
    
    # Remove trailing/leading punctuation and whitespace
    text = text.strip(" ,.-()")
    # If it's a known generic like "District", "Dist", clear it
    if text.lower() in ["district", "dist", "distt", "tq", "taluka"]:
        return ""
    return text.strip()

with open(source_path, 'r', encoding='utf-8') as f:
    reader = list(csv.DictReader(f))
    headers = list(reader[0].keys())

for row in reader:
    row['District'] = clean_district_final(row.get('District', ''))
    
    # Also clean Pincode (ensure only 6 digits)
    pin = row.get('Pincode', '')
    pin_match = re.search(r'(\d{6})', str(pin))
    row['Pincode'] = pin_match.group(1) if pin_match else ""

with open(output_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    writer.writerows(reader)

print(f"Final polished CSV saved to {output_path}")
