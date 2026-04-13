import csv
import re

source_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_master_cutoff_properly_mapped.csv'
output_path = r'c:\Users\balak\OneDrive\Desktop\admission predictor\neet_colleges_formatted.csv'

headers = [
    "College Name *", "Short Name", "College Code", "College Type *",
    "City *", "State *", "District", "Pincode", "Address",
    "Nearest Railway Station", "Nearest Bus Stand",
    "Campus Area (Acres)", "Established Year", "Affiliation", "Website",
    "Phone", "Email",
    "Annual Tuition Fee", "Annual Hostel Fee", "Annual Mess Fee", "Total First Year Fee",
    "Average Package (LPA)", "Highest Package (LPA)", "Placement Rate (%)",
    "Top Recruiters (comma-separated)", "NIRF Rank", "Facilities (comma-separated)"
]

# Common cities in Indian medical colleges to help heuristic
common_cities = [
    "Agartala", "Guwahati", "Dibrugarh", "Silchar", "Jorhat", "Patna", "Gaya", "Bettiah", "Bhagalpur", "Muzaffarpur",
    "Nalanda", "Raipur", "Bilaspur", "Durg", "Jagdalpur", "Raigarh", "Ambikapur", "Panaji", "Ahmedabad", "Surat", 
    "Jamnagar", "Baroda", "Bhavnagar", "Rajkot", "Rohtak", "Karnal", "Sonepat", "Shimla", "Tanda", "Hamirpur", 
    "Srinagar", "Jammu", "Anantnag", "Baramulla", "Kathua", "Ranchi", "Jamshedpur", "Dhanbad", "Hazaribag", "Bangalore",
    "Mysore", "Hubballi", "Belagavi", "Mangaluru", "Kottayam", "Kochi", "Thiruvananthapuram", "Thrissur", "Bhopal", "Indore",
    "Gwalior", "Jabalpur", "Mumbai", "Pune", "Nagpur", "Chennai", "Coimbatore", "Madurai", "Hyderabad", "Warangal", 
    "Lucknow", "Kanpur", "Varanasi", "Agra", "Kolkata", "Siliguri", "Burdwan"
]

def extract_details(full_name, row_state):
    name = full_name
    city = ""
    state = row_state
    
    # 1. Check for "Name, City" or "Name, City, State"
    if ',' in name:
        parts = [p.strip() for p in name.split(',')]
        if len(parts) >= 2:
            # Often last part or second part is city
            # Check if parts[1] is a known state, if so, parts[2] might be city?
            # Usually it's Name, City, State
            if len(parts) == 2:
                potential_city = parts[1]
                # If parts[1] is not a state, it's a city
                city = potential_city
            elif len(parts) >= 3:
                city = parts[1]
                if not state:
                    state = parts[2]
        name = parts[0] # Keep the main name
        
    # 2. Check for parentheses (City)
    if not city:
        match = re.search(r'\(\s*(.*?)\s*\)', full_name)
        if match:
            city = match.group(1)
            
    # 3. Check start of name for city
    if not city:
        for c in common_cities:
            if full_name.startswith(c):
                city = c
                break
                
    # 4. Default city if still empty
    if not city:
        city = "Virudhunagar" # Default value from prompt example
        
    return full_name, city, state

with open(source_path, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    source_header = next(reader)
    
    with open(output_path, 'w', encoding='utf-8', newline='') as fout:
        writer = csv.DictWriter(fout, fieldnames=headers)
        writer.writeheader()
        
        for row in reader:
            if not row: continue
            
            orig_name = row[0].strip()
            orig_state = row[1].strip() if len(row) > 1 else ""
            
            clean_name, city, state = extract_details(orig_name, orig_state)
            
            # Simple heuristic for College Type
            c_type = "Government"
            if any(x in orig_name.lower() for x in ["private", "society", "trust", "deemed"]):
                c_type = "Private"
            
            item = {
                "College Name *": orig_name, # Use full name as requested
                "Short Name": "",
                "College Code": "",
                "College Type *": c_type,
                "City *": city,
                "State *": state,
                "District": "",
                "Pincode": "",
                "Address": "",
                "Nearest Railway Station": "e.g., Guntur Junction",
                "Nearest Bus Stand": "e.g., Guntur Bus Stand",
                "Campus Area (Acres)": "e.g., 25.5",
                "Established Year": "e.g., 2000",
                "Affiliation": "e.g., JNTU Kakinada",
                "Website": "https://example.com",
                "Phone": "+91-XXXXXXXXXX",
                "Email": "info@college.edu",
                "Annual Tuition Fee": 0,
                "Annual Hostel Fee": 0,
                "Annual Mess Fee": 0,
                "Total First Year Fee": 0,
                "Average Package (LPA)": 0,
                "Highest Package (LPA)": 0,
                "Placement Rate (%)": 0,
                "Top Recruiters (comma-separated)": "TCS, Infosys, Wipro",
                "NIRF Rank": 0,
                "Facilities (comma-separated)": ""
            }
            writer.writerow(item)

print(f"Successfully generated {output_path}")
