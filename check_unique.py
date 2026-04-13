import csv

source_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_master_cutoff_properly_mapped.csv'

names = set()
all_rows = []

with open(source_path, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)
    for row in reader:
        if row:
            name = row[0].strip()
            if name:
                names.add(name)
                all_rows.append(row)

print(f"Total rows: {len(all_rows)}")
print(f"Unique names: {len(names)}")
