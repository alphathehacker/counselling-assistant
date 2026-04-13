import csv

file_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_colleges_full_details_FINAL_v2.csv'
with open(file_path, 'r', encoding='utf-8') as f:
    reader = list(csv.DictReader(f))

empty_dist = [r for r in reader if not r.get('District')]
empty_pin = [r for r in reader if not r.get('Pincode')]

print(f"Total Colleges: {len(reader)}")
print(f"Empty District: {len(empty_dist)}")
print(f"Empty Pincode: {len(empty_pin)}")

# Print some of the empty ones to see why
if empty_dist:
    print("\nSample Empty District Addresses:")
    for r in empty_dist[:5]:
        print(f"Name: {r['College Name *']} | Address: {r['Address']}")
