import pandas as pd
import re

def normalize_name(name):
    if not isinstance(name, str):
        return ""
    # Remove special characters and extra spaces, convert to lowercase
    name = re.sub(r'[^a-zA-Z0-9]', ' ', name)
    name = ' '.join(name.split()).lower()
    return name

def find_duplicates(file_path):
    df = pd.read_csv(file_path)
    
    # 1. Exact Duplicate Names
    exact_duplicates = df[df.duplicated(subset=['College Name *'], keep=False)]
    
    # 2. Normalized Duplicate Names
    df['Normalized Name'] = df['College Name *'].apply(normalize_name)
    normalized_duplicates = df[df.duplicated(subset=['Normalized Name'], keep=False)]
    
    # 3. Same Location and Type (Potential duplicates with different names)
    # Using City, State, and College Type
    location_duplicates = df[df.duplicated(subset=['City *', 'State *', 'College Type *', 'Address'], keep=False)]
    
    # Unique Colleges (based on normalized name)
    unique_colleges = df['College Name *'].unique()
    
    print(f"Total records: {len(df)}")
    print(f"Unique college names: {len(unique_colleges)}")
    print("-" * 50)
    
    if not exact_duplicates.empty:
        print(f"Exact Duplicate Names Found ({len(exact_duplicates)} rows):")
        print(exact_duplicates[['College Name *', 'City *', 'State *']].sort_values(by='College Name *'))
        print("-" * 50)
    else:
        print("No exact duplicate names found.")

    # Filter out exact duplicates from normalized results to show "hidden" duplicates
    hidden_duplicates = normalized_duplicates[~normalized_duplicates.index.isin(exact_duplicates.index)]
    if not hidden_duplicates.empty:
        print(f"Hidden Duplicates (Similar Names) Found ({len(hidden_duplicates)} rows):")
        print(hidden_duplicates[['College Name *', 'Normalized Name', 'City *', 'State *']].sort_values(by='Normalized Name'))
        print("-" * 50)
    else:
        print("No hidden duplicates found via name normalization.")

    # Location based potential duplicates (where names are different)
    potential_duplicates = location_duplicates[~location_duplicates.index.isin(normalized_duplicates.index)]
    if not potential_duplicates.empty:
        print(f"Potential Duplicates (Same Address/Location but different names) Found ({len(potential_duplicates)} rows):")
        print(potential_duplicates[['College Name *', 'City *', 'State *', 'Address']].sort_values(by='City *'))
        print("-" * 50)
    else:
        print("No further potential duplicates found by location/address.")

if __name__ == "__main__":
    file_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_colleges_full_details_FINAL_v7.csv'
    find_duplicates(file_path)
