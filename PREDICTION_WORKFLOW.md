# Prediction System Workflow

## How the Prediction System Works

### Overview
The prediction system uses **cutoff rank data from CSV files** uploaded by admin to predict admission chances. CSV files are examples/templates - admin uploads actual data for each exam type.

### Workflow

#### 1. Admin Uploads CSV Files (Admin Panel)

**For each exam type, admin uploads separate CSV files:**

- **AP EAPCET** → Upload `ap_eapcet_colleges.csv`
- **AP ECET** → Upload `ap_ecet_colleges.csv`
- **NEET** → Upload `neet_colleges.csv`
- **IIT JEE / JEE Main** → Upload `jee_main_colleges.csv`
- **JEE Advanced** → Upload `jee_advanced_colleges.csv`

**Each CSV file contains:**
- College information (name, code, location, type)
- **Previous year cutoff ranks** (Closing Rank, Opening Rank)
- Branch, Category, Year data
- Fees, Placements, Rankings (optional)

**Example CSV row:**
```csv
College Name,College Code,City,State,College Type,Exam Type,Branch,Category,Year,Closing Rank,Opening Rank
IIT Delhi,IITD001,New Delhi,Delhi,Government,JEE Main,Computer Science Engineering,General,2023,164,120
```

#### 2. System Stores Cutoff Data

When admin uploads CSV:
- System parses each row
- Stores college information
- **Stores cutoff ranks** (Closing Rank, Opening Rank) for each:
  - Exam Type
  - Branch
  - Category
  - Year

**Multiple rows per college are supported:**
- Same college, different branches → Multiple cutoff entries
- Same college, different categories → Multiple cutoff entries
- Same college, different years → Multiple cutoff entries

#### 3. Student Enters Details (Prediction Engine Page)

Student logs in and goes to `/college-prediction-engine`:

**Required Information:**
- **Entrance Exam Type** (e.g., AP EAPCET, JEE Main)
- **Rank/Percentile** (e.g., 2450)
- **Category** (General, OBC, SC, ST, EWS)
- **Preferred Branches** (e.g., Computer Science, Electronics)
- **Preferred Locations** (e.g., Hyderabad, Bangalore)

**Advanced Filters (Optional):**
- College Type (Government, Private, etc.)
- Fee Range
- Distance
- Placement Package
- NIRF Ranking

#### 4. System Generates Predictions

**Prediction Algorithm:**

1. **Filter Colleges:**
   - Match exam type from student input
   - Match category
   - Match preferred locations (if specified)

2. **Match Cutoff Data:**
   - Find colleges with cutoff data for:
     - Selected exam type
     - Selected category
     - Preferred branches (if specified)
   - Use **most recent year's cutoff data**

3. **Compare Ranks:**
   - Compare student's rank with **Closing Rank from CSV data**
   - Calculate admission chance:
     - **High (90%)**: Rank ≤ 0.5 × Closing Rank
     - **Good (70%)**: Rank ≤ 0.75 × Closing Rank
     - **Moderate (50%)**: Rank ≤ Closing Rank
     - **Low (30%)**: Rank ≤ 1.2 × Closing Rank
     - **Very Low (10%)**: Rank > 1.2 × Closing Rank

4. **Apply Filters:**
   - College type
   - Fee range
   - Placement package
   - NIRF ranking

5. **Sort & Return:**
   - Sort by confidence (highest first)
   - Then by NIRF ranking
   - Return top 100 results

#### 5. Student Views Results

Student sees:
- College name, location, type
- Branch with best admission chance
- Admission chance percentage
- **Previous year cutoff rank** (from CSV)
- Fees, placements, rankings
- Confidence message

## Key Points

✅ **CSV files are data sources** - Admin uploads actual cutoff data
✅ **Each exam has separate CSV files** - Different datasets per exam
✅ **Predictions use cutoff ranks** - Based on previous year closing ranks
✅ **Multiple cutoffs per college** - Different branches/categories/years
✅ **Most recent year preferred** - System uses latest cutoff data available

## Example Scenario

1. **Admin uploads JEE Main CSV** with 2023 cutoff data:
   - IIT Delhi, CS, General, Closing Rank: 164
   - NIT Warangal, CS, General, Closing Rank: 1250

2. **Student enters:**
   - Exam: JEE Main
   - Rank: 1000
   - Category: General
   - Branch: Computer Science

3. **System predicts:**
   - **NIT Warangal**: Good chance (70%) - Rank 1000 vs Closing Rank 1250
   - **IIT Delhi**: Very low chance (10%) - Rank 1000 vs Closing Rank 164

4. **Student sees predictions** sorted by confidence with cutoff ranks displayed.
