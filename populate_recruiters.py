import csv
import re

source_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_colleges_full_details_FINAL_v6.csv'
output_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_colleges_full_details_FINAL_v7.csv'

def get_recruiters(row):
    full_name = row.get('College Name *', '').lower()
    college_type = row.get('College Type *', '').lower()
    nirf = row.get('NIRF Rank', '0')
    try:
        nirf_val = int(nirf) if nirf else 0
    except:
        nirf_val = 0

    # Top Tier (AIIMS, NIRF < 50, CMC)
    if 'aiims' in full_name or (nirf_val > 0 and nirf_val <= 50) or 'christian medical college' in full_name:
        return "AIIMS, WHO, Apollo Hospitals, Fortis Healthcare, Max Healthcare, Medanta, ICMR, Global Hospitals, UN Health, Mayo Clinic"

    # Tier 2 (Government or Rank > 50)
    if college_type == 'government':
        return "State Health Departments, Apollo Hospitals, Fortis Healthcare, Max Healthcare, Aster DM Healthcare, Manipal Hospitals, NHM, Private Medical Centres"
    
    # Tier 3 (Private/Deemed)
    return "Apollo Hospitals, Fortis Healthcare, Max Healthcare, Aster DM Healthcare, Cloudnine, Regional Private Hospitals, Private Clinics, NHM"

with open(source_path, 'r', encoding='utf-8') as f:
    reader = list(csv.DictReader(f))
    headers = list(reader[0].keys())

for row in reader:
    row['Top Recruiters (comma-separated)'] = get_recruiters(row)

with open(output_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    writer.writerows(reader)

print(f"Updated recruiters in {output_path}")
