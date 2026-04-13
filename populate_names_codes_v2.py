import csv
import re

source_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_colleges_full_details_FINAL_v4.csv'
output_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_colleges_full_details_FINAL_v5.csv'

def clean_text(text):
    if not text: return ""
    return re.sub(r'\s+', ' ', text).strip()

def generate_short_name_and_code(full_name, city, row_type):
    full_name = clean_text(full_name)
    city = clean_text(city)
    
    # Check for AIIMS
    if "all india institute of medical sciences" in full_name.lower() or "aiims" in full_name.lower():
        short = f"AIIMS {city}"
        code = f"AIIMS-{city[:3].upper()}"
        return short, code
    
    # Check for GMC/Govt
    is_govt = row_type.lower() == 'government' or "government medical college" in full_name.lower() or "govt medical college" in full_name.lower()
    
    if is_govt:
        # Try to find a specific name if it's "Dr. SC GMC" or similar
        potential_name = re.sub(r'(?i)\b(Government Medical College|Govt Medical College|and Hospital|Medical College|Govt)\b', '', full_name).strip()
        if not potential_name:
            short = f"GMC {city}"
            code = f"GMC-{city[:3].upper()}"
        else:
            short = f"{potential_name} {city}"
            initials = "".join([w[0].upper() for w in potential_name.split() if w[0].isalpha()])
            code = f"GMC-{initials[:3].upper()}-{city[:3].upper()}"
        return short, code

    # Others (Private/Deemed)
    clean_name = re.sub(r'(?i)\b(Institute of Medical Sciences|Medical College|Research Centre|Hospital|and Research|Institute|College of Medical Sciences|Medical Sciences|School of Medicine|Faculty of Medicine|Centre)\b', '', full_name).strip()
    clean_name = re.sub(r'[^\w\s]', '', clean_name) # Remove punctuation
    
    parts = clean_name.split()
    if len(parts) > 2:
        # Use first two main words + City
        short = f"{parts[0]} {parts[1]} {city}"
    elif len(parts) > 0:
        short = f"{clean_name} {city}"
    else:
        short = f"{full_name[:15]} {city}"

    # Generate code
    initials = "".join([w[0].upper() for w in parts if w[0].isalpha()])
    if len(initials) > 4:
        initials = initials[:4]
    
    code = f"{initials}-{city[:3].upper()}"
    
    # Final cleanup
    if len(short) > 40:
        short = short[:37] + "..."
        
    return short, code

with open(source_path, 'r', encoding='utf-8') as f:
    reader = list(csv.DictReader(f))
    headers = list(reader[0].keys())

for row in reader:
    full_name = row.get('College Name *', '')
    city = row.get('City *', '')
    row_type = row.get('College Type *', '')
    
    if city.lower() in ['virudhunagar', 'nan', '']:
        # Use District or State if city is generic
        city = row.get('District', city)
        if city.lower() in ['virudhunagar', 'nan', '']:
            city = row.get('State *', 'IND')

    short, code = generate_short_name_and_code(full_name, city, row_type)
    
    row['Short Name'] = short
    row['College Code'] = code

with open(output_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    writer.writerows(reader)

print(f"Generated clean short names and codes in {output_path}")
