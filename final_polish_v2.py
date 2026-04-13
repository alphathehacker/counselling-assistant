import csv
import re

source_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_colleges_full_details_FINAL.csv'
output_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_colleges_full_details_FINAL_v2.csv'

def extract_pincode(address):
    if not address: return ""
    match = re.search(r'(?<!\d)(\d{6})(?!\d)', address)
    return match.group(1) if match else ""

with open(source_path, 'r', encoding='utf-8') as f:
    reader = list(csv.DictReader(f))
    headers = list(reader[0].keys())

for row in reader:
    # 1. If Pincode is empty, try to extract from address
    if not row.get('Pincode') or row.get('Pincode').strip() == "":
        pin = extract_pincode(row.get('Address', ''))
        if pin:
            row['Pincode'] = pin
            
    # 2. If District is empty, use City as a fallback
    if not row.get('District') or row.get('District').strip() == "":
        city = row.get('City *', '').strip()
        # If city is not a placeholder
        if city and city.lower() not in ["virudhunagar", "nan", ""]:
            row['District'] = city
        else:
            # Try to grab the last part of address before state
            addr = row.get('Address', '')
            parts = [p.strip() for p in addr.split(',') if p.strip()]
            if parts:
                row['District'] = parts[-1]

    # Clean District again (remove state name if it's there)
    dist = row.get('District', '')
    states = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Pondicherry", "Tripura", "Chattisgarh", "Orissa", "Tamilnadu", "UP", "MP"]
    for s in states:
        dist = re.sub(re.escape(s), '', dist, flags=re.IGNORECASE)
    row['District'] = dist.strip(" ,.-()")

with open(output_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    writer.writerows(reader)

print(f"Final polished CSV saved to {output_path}")
