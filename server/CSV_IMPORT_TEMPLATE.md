# CSV Import Template for College Data

## Important Notes

- **Dynamic Column Detection** - System automatically detects your column names! No fixed format required.
- **CSV files are data sources** - Admin uploads actual cutoff data for each exam type
- **Each exam type has separate CSV files** (AP EAPCET, AP ECET, NEET, IIT JEE, etc.)
- **Predictions are based on previous year cutoff ranks** from the uploaded CSV data
- **Multiple rows per college** are allowed (different branches, categories, years)
- **The system uses the most recent year's cutoff data** for predictions
- **Column names are flexible** - System recognizes variations like "College Name", "Name", "Institution", etc.

## CSV Format - Two Supported Formats

The system supports **two CSV formats** and automatically detects which one you're using. You can upload CSV files with any column names - the system will detect them automatically!

### Format 1: Standard Format (Single Category Column)

One row per college+branch+category combination:

**Required Columns (any variation of these names):**
- **College Name** (detected as: "College Name", "Name", "Institution", "College", etc.)
- **Branch** (detected as: "Branch", "Course", "Stream", "Program", etc.)
- **Exam Type** (detected as: "Exam Type", "Exam", "CET Exam", etc.)
- **Category** (detected as: "Category", "Reservation Category", "Quota", etc.)
- **Closing Rank** (detected as: "Closing Rank", "Last Rank", "Cutoff Rank", "Rank", etc.)

**Optional Columns:**
- City, State, District, College Type, Year, Opening Rank, Fees, Placements, Rankings, Contact info

### Format 2: Category-Specific Columns (AP EAPCET style)

One row per college+branch, with separate columns for each category:

**Required Columns:**
- **College Name**
- **Branch**
- **Exam Type** (can be specified once or in filename)

**Category Rank Columns** (system automatically detects):
- `OC_BOYS`, `OC_GIRLS` → Maps to "General" category
- `SC_BOYS`, `SC_GIRLS` → Maps to "SC" category
- `ST_BOYS`, `ST_GIRLS` → Maps to "ST" category
- `BCA_BOYS`, `BCA_GIRLS`, `BCB_BOYS`, etc. → Maps to "OBC" category
- `OC_EWS_BOYS`, `OC_EWS_GIRLS` → Maps to "EWS" category

**Example:**
```csv
College Name,branch,District,Region,OC_BOYS,OC_GIRLS,SC_BOYS,SC_GIRLS,ST_BOYS,ST_GIRLS,BCA_BOYS,BCA_GIRLS
ADARSH COLLEGE OF ENGINEERING,CSE,EG,GOLLAPROLU,128861,128861,176504,177370,157250,157250,161249,172486
```

The system will automatically:
- Detect category columns (OC_BOYS, SC_BOYS, etc.)
- Create separate cutoff entries for each category
- Use the rank values from these columns for predictions

### Optional Columns

| Column Name | Description | Example |
|------------|-------------|---------|
| District | District name | New Delhi |
| Pincode | Postal code | 110016 |
| Address | Full address | Hauz Khas, New Delhi |
| Branch Code | Branch identifier | CS |
| Annual Tuition Fee | Annual tuition fee in INR | 200000 |
| Annual Hostel Fee | Annual hostel fee in INR | 25000 |
| Annual Mess Fee | Annual mess fee in INR | 36000 |
| Average Package | Average placement package in LPA | 18 |
| Highest Package | Highest placement package in LPA | 55 |
| Placement Rate | Placement percentage | 95 |
| NIRF Rank | NIRF ranking | 2 |
| Established | Year established | 1961 |
| Website | College website URL | https://www.iitd.ac.in |
| Phone | Contact phone number | +91-11-2659-7135 |
| Email | Contact email | contact@iitd.ac.in |

## Example CSV Content

**Note:** These are examples. Admin should upload actual cutoff data for each exam type.

### Example 1: Standard Format (JEE Main style)
```csv
College Name,College Code,City,State,Exam Type,Branch,Category,Year,Closing Rank,Opening Rank
IIT Delhi,IITD001,New Delhi,Delhi,JEE Main,Computer Science Engineering,General,2023,164,120
NIT Warangal,NITW001,Warangal,Telangana,JEE Main,Computer Science Engineering,General,2023,1250,800
```

### Example 2: Category-Specific Columns (AP EAPCET style)
```csv
College Name,branch,District,Region,OC_BOYS,OC_GIRLS,SC_BOYS,SC_GIRLS,ST_BOYS,ST_GIRLS,BCA_BOYS,BCA_GIRLS
ADARSH COLLEGE OF ENGINEERING,CSE,EG,GOLLAPROLU,128861,128861,176504,177370,157250,157250,161249,172486
ADARSH COLLEGE OF ENGINEERING,ECE,EG,GOLLAPROLU,161894,161894,174884,177676,161894,161894,161894,161894
```

**System automatically:**
- Detects `OC_BOYS`/`OC_GIRLS` → Creates "General" category cutoff
- Detects `SC_BOYS`/`SC_GIRLS` → Creates "SC" category cutoff
- Detects `ST_BOYS`/`ST_GIRLS` → Creates "ST" category cutoff
- Detects `BCA_BOYS`/`BCA_GIRLS` → Creates "OBC" category cutoff
- And so on for all category columns

## Multiple Cutoffs in One File

If a college has multiple branches or categories, you can add multiple rows with the same college information but different branch/category combinations:

```csv
College Name,Short Name,College Code,City,State,College Type,Exam Type,Branch,Category,Year,Closing Rank
IIT Delhi,IIT Delhi,IITD001,New Delhi,Delhi,Government,JEE Main,Computer Science Engineering,General,2023,164
IIT Delhi,IIT Delhi,IITD001,New Delhi,Delhi,Government,JEE Main,Computer Science Engineering,OBC,2023,118
IIT Delhi,IIT Delhi,IITD001,New Delhi,Delhi,Government,JEE Main,Electrical Engineering,General,2023,289
```

The system will automatically:
- Create the college if it doesn't exist
- Add cutoff data for each row
- Update existing colleges if the college code or name+city matches

## Dynamic Column Detection

The system automatically detects column names. You don't need exact column names! Examples:

**College Name** can be:
- "College Name", "Name", "Institution", "College", "Institute Name", etc.

**Branch** can be:
- "Branch", "Course", "Stream", "Program", "Department", etc.

**Closing Rank** can be:
- "Closing Rank", "Last Rank", "Cutoff Rank", "Rank", "Closing", etc.

**Category columns** (Format 2) are automatically detected:
- "OC_BOYS", "OC_GIRLS" → General category
- "SC_BOYS", "SC_GIRLS" → SC category
- "ST_BOYS", "ST_GIRLS" → ST category
- "BCA_BOYS", "BCA_GIRLS", "BCB_BOYS", etc. → OBC category
- "OC_EWS_BOYS", "OC_EWS_GIRLS" → EWS category

## Notes

1. **College Code** should be unique. If a college with the same code exists, it will be updated instead of created.
2. **Cutoffs** are matched by exam type, branch, category, and year. If a cutoff with the same combination exists, it will be updated.
3. All numeric fields should be numbers (commas are automatically removed).
4. Dates should be in YYYY format for year.
5. Multiple exam types can be specified by separating with commas: "AP EAPCET,AP ECET"
6. The file encoding should be UTF-8.
7. **Empty cells are ignored** - Only filled rank values are processed.
8. **System shows detected columns** after upload for verification.
