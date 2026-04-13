# Prediction Engine Setup Guide

## Overview

The prediction engine uses **cutoff rank data from CSV files** uploaded by admin to predict admission chances. The system works as follows:

1. **Admin uploads CSV files** for each exam type (AP EAPCET, AP ECET, NEET, IIT JEE, etc.) containing:
   - College information
   - **Previous year cutoff ranks** (Closing Rank, Opening Rank)
   - Branch, Category, Year data

2. **Students enter their details:**
   - Entrance exam type
   - Rank/percentile
   - Category
   - Preferred branches and locations
   - Advanced filters

3. **System predicts colleges** by comparing student's rank with **cutoff ranks from uploaded CSV data**

### Key Principle
- **Predictions are based on previous year cutoff ranks** from the CSV files
- Each exam type has separate CSV files uploaded by admin
- The system compares student's current rank with last year's closing rank to determine admission chances

## Backend Setup

### 1. Install Additional Dependencies

```bash
cd server
npm install multer csv-parser
```

### 2. Database Models

The system uses two main models:
- **User**: For authentication (already created)
- **College**: For storing college data and cutoff information

### 3. API Endpoints

#### Prediction Endpoints (Protected)
- `POST /api/prediction/predict` - Get college predictions
- `GET /api/prediction/branches/:examType` - Get available branches for an exam
- `GET /api/prediction/locations/:examType` - Get available locations for an exam

#### Admin Endpoints (Admin only)
- `POST /api/admin/colleges/upload` - Upload CSV file with college data
- `GET /api/admin/colleges` - Get all colleges (with pagination)
- `POST /api/admin/colleges` - Create a new college
- `PUT /api/admin/colleges/:id` - Update a college
- `DELETE /api/admin/colleges/:id` - Delete a college (soft delete)

## CSV Data Import

### Step 1: Prepare CSV File

Use the template provided in `server/CSV_IMPORT_TEMPLATE.md` or `server/sample_colleges.csv` as a reference.

### Step 2: Upload via Admin Portal

1. Login as admin
2. Navigate to admin portal (to be implemented)
3. Go to "Manage Colleges" → "Import CSV"
4. Select your CSV file
5. Click "Upload"

The system will:
- Create new colleges or update existing ones
- Add cutoff data for each row
- Handle duplicate entries intelligently

### Step 3: Verify Data

Check that colleges were imported correctly by viewing the colleges list.

## Prediction Algorithm

The prediction engine works as follows:

1. **Filter Colleges**: Based on exam type, category, and preferred locations
2. **Match Branches**: Filter by preferred branches if specified
3. **Calculate Admission Chances**: Based on previous year cutoff ranks:
   - **High chance** (90% confidence): Rank ≤ 0.5 × Closing Rank
   - **Good chance** (70% confidence): Rank ≤ 0.75 × Closing Rank
   - **Moderate chance** (50% confidence): Rank ≤ Closing Rank
   - **Low chance** (30% confidence): Rank ≤ 1.2 × Closing Rank
   - **Very low chance** (10% confidence): Rank > 1.2 × Closing Rank

4. **Apply Advanced Filters**:
   - College type (Government, Private, Deemed University, Autonomous)
   - Fee range (min/max)
   - Placement package (minimum)
   - NIRF ranking (maximum)

5. **Sort Results**: By confidence level (highest first), then by NIRF ranking

6. **Return Top Results**: Limited to top 100 predictions

## Frontend Integration

The prediction engine page (`/college-prediction-engine`) now:
- Uses real API endpoints instead of mock data
- Fetches predictions based on user inputs
- Displays admission chances with confidence levels
- Shows cutoff ranks and other college details

## Testing the Prediction Engine

1. **Import Sample Data**:
   ```bash
   # Use the sample CSV file provided
   # Upload it via admin portal or API
   ```

2. **Test Prediction**:
   - Go to `/college-prediction-engine`
   - Select exam type (e.g., "JEE Main")
   - Enter rank (e.g., 1000)
   - Select category (e.g., "General")
   - Select preferred locations and branches
   - Apply advanced filters if needed
   - Click "Generate Predictions"

3. **Verify Results**:
   - Check that predictions show appropriate confidence levels
   - Verify colleges match selected criteria
   - Confirm cutoff ranks are displayed

## Admin Portal (To Be Implemented)

An admin portal should be created to:
1. Upload CSV files for college data
2. View and manage colleges
3. Edit college information
4. Add/update cutoff data manually
5. Manage datasets for different exam types

## Notes

- Cutoff data is typically based on previous year (year - 1)
- The system supports multiple exam types per college
- Each college can have multiple branches with different cutoffs
- Cutoffs are category-specific
- The prediction algorithm can be adjusted based on trends
