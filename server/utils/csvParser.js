/**
 * Dynamic CSV Column Mapper
 * Automatically detects and maps CSV columns to college schema
 */

import { normalizeDistrict } from './districtNormalizer.js';

// Column mapping patterns - supports various column name formats
const columnMappings = {
  // College basic info
  name: [
    'institute', 'institute name', 'institute_name', // JEE Main uses "Institute" column - prioritize this
    'name', 'college name', 'college_name', 'college', 'institution name', 'institution',
    'university name', 'university'
  ],
  shortName: [
    'short name', 'short_name', 'abbreviation', 'abbr', 'short form', 'shortform'
  ],
  code: [
    'code', 'college code', 'college_code', 'institution code', 'institution_code',
    'college id', 'college_id', 'id', 'collegeid'
  ],
  
  // Location
  city: ['city', 'location', 'district city', 'district_city', 'region', 'area'],
  state: ['state', 'province'],
  district: ['district', 'area', 'region'],
  pincode: ['pincode', 'pin code', 'pin_code', 'postal code', 'postal_code', 'zip'],
  address: ['address', 'full address', 'full_address', 'location address'],
  nearestRailway: [
    'nearest railway', 'nearest_railway', 'railway station', 'railway_station',
    'nearest railway station', 'nearest_railway_station', 'railway', 'railway station name'
  ],
  nearestBusStand: [
    'nearest bus stand', 'nearest_bus_stand', 'bus stand', 'bus_stand',
    'nearest bus', 'nearest_bus', 'bus stop', 'bus_stop', 'bus station', 'bus_station'
  ],
  
  // College type
  collegeType: [
    'college type', 'college_type', 'type', 'institution type', 'institution_type',
    'category', 'college category', 'college_category'
  ],
  
  // Exam and cutoff data
  examType: [
    'exam type', 'exam_type', 'exam', 'entrance exam', 'entrance_exam',
    'cet exam', 'cet_exam', 'test type', 'test_type'
  ],
  branch: [
    'academic program name', 'academic program', 'academic_program_name', 'academic_program', // JEE Main uses "Academic Program Name" - prioritize this
    'branch', 'course', 'stream', 'discipline', 'specialization', 'specialisation',
    'department', 'program', 'programme', 'field'
  ],
  category: [
    'category', 'reservation category', 'reservation_category', 'quota',
    'reservation', 'caste category', 'caste_category', 'seat category', 'seat_category'
  ],
  year: ['year', 'academic year', 'academic_year', 'admission year', 'admission_year', 'cutoff year'],
  
  // Cutoff ranks - CRITICAL for predictions
  closingRank: [
    'closing rank', 'closing_rank', 'last rank', 'last_rank', 'final rank', 'final_rank',
    'cutoff rank', 'cutoff_rank', 'closing rank (gen)', 'closing rank (general)',
    'last rank (gen)', 'last rank (general)', 'rank', 'closing'
  ],
  openingRank: [
    'opening rank', 'opening_rank', 'first rank', 'first_rank', 'starting rank', 'starting_rank',
    'opening rank (gen)', 'opening rank (general)', 'first rank (gen)', 'first rank (general)'
  ],
  closingPercentile: [
    'closing percentile', 'closing_percentile', 'last percentile', 'last_percentile',
    'cutoff percentile', 'cutoff_percentile', 'percentile', 'closing %', 'closing%'
  ],
  openingPercentile: [
    'opening percentile', 'opening_percentile', 'first percentile', 'first_percentile',
    'opening %', 'opening%'
  ],
  
  // Fees
  annualTuitionFee: [
    'annual tuition fee', 'annual_tuition_fee', 'tuition fee', 'tuition_fee',
    'fee', 'annual fee', 'annual_fee', 'tuition', 'course fee', 'course_fee'
  ],
  annualHostelFee: [
    'annual hostel fee', 'annual_hostel_fee', 'hostel fee', 'hostel_fee',
    'hostel', 'accommodation fee', 'accommodation_fee'
  ],
  annualMessFee: [
    'annual mess fee', 'annual_mess_fee', 'mess fee', 'mess_fee',
    'mess', 'food fee', 'food_fee', 'dining fee', 'dining_fee'
  ],
  
  // Placements
  averagePackage: [
    'average package', 'average_package', 'avg package', 'avg_package',
    'average salary', 'average_salary', 'avg salary', 'avg_salary', 'package', 'ctc'
  ],
  highestPackage: [
    'highest package', 'highest_package', 'max package', 'max_package',
    'highest salary', 'highest_salary', 'max salary', 'max_salary', 'highest ctc'
  ],
  placementRate: [
    'placement rate', 'placement_rate', 'placement %', 'placement%',
    'placement percentage', 'placement_percentage', 'placement'
  ],
  
  // Rankings
  nirfRank: [
    'nirf rank', 'nirf_rank', 'nirf', 'nirf ranking', 'nirf_ranking',
    'nirf position', 'nirf_position'
  ],
  
  // Campus Information
  campusArea: [
    'campus area', 'campus_area', 'area', 'campus size', 'campus_size',
    'acres', 'campus area (acres)', 'campus_area_acres', 'campus area/acres',
    'campus area / acres', 'area (acres)', 'area_acres'
  ],
  
  // Other
  established: ['established', 'established year', 'established_year', 'founded', 'founded year'],
  website: ['website', 'url', 'web', 'web address', 'web_address'],
  phone: ['phone', 'contact', 'phone number', 'phone_number', 'mobile', 'telephone'],
  email: ['email', 'e-mail', 'contact email', 'contact_email', 'mail'],
};

/**
 * Normalize column name for matching
 */
const normalizeColumnName = (colName) => {
  if (!colName) return '';
  return colName.toString().toLowerCase().trim().replace(/[_\s-]+/g, ' ');
};

/**
 * Find matching column name from CSV headers
 * Uses strict matching: exact match first, then contains check (but avoids false matches)
 */
const findMatchingColumn = (csvHeaders, possibleNames) => {
  const normalizedHeaders = csvHeaders.map(h => normalizeColumnName(h));
  
  for (const possibleName of possibleNames) {
    const normalized = normalizeColumnName(possibleName);
    
    // First try exact match (most reliable)
    let index = normalizedHeaders.findIndex(h => h === normalized);
    if (index !== -1) {
      return csvHeaders[index];
    }
    
    // Then try contains match, but be more strict to avoid false positives:
    // - For short names (like "institute"), require exact word match or start of header
    // - For longer names, allow substring match
    index = normalizedHeaders.findIndex(h => {
      if (h === normalized) return true; // Already checked, but keep for clarity
      
      // For short search terms (<= 8 chars), require word boundary or start match
      if (normalized.length <= 8) {
        // Match if header starts with the term (e.g., "institute" matches "institute name")
        if (h.startsWith(normalized + ' ') || h === normalized) {
          return true;
        }
        // Or if it's a complete word in the header (word boundary)
        const wordBoundaryRegex = new RegExp(`\\b${normalized}\\b`, 'i');
        if (wordBoundaryRegex.test(h)) {
          return true;
        }
      } else {
        // For longer terms, allow substring match
        if (h.includes(normalized) || normalized.includes(h)) {
          return true;
        }
      }
      return false;
    });
    
    if (index !== -1) {
      return csvHeaders[index];
    }
  }
  return null;
};

/**
 * Extract value from CSV row using dynamic column mapping
 */
const extractValue = (row, csvHeaders, possibleNames, defaultValue = null) => {
  const columnName = findMatchingColumn(csvHeaders, possibleNames);
  if (columnName && row[columnName] !== undefined && row[columnName] !== '') {
    return row[columnName];
  }
  return defaultValue;
};

/**
 * Find actual key in row that matches desiredColumnName (normalized). Handles csv-parser key differences.
 */
const findRowKeyForColumn = (row, desiredColumnName) => {
  const desiredNorm = normalizeColumnName(desiredColumnName);
  const key = Object.keys(row).find((k) => normalizeColumnName(k) === desiredNorm);
  return key || null;
};

/**
 * Parse CSV row dynamically based on detected columns
 * @param {Object} row - CSV row data
 * @param {Array} csvHeaders - CSV column headers
 * @param {String} defaultExamType - Default exam type if not found in CSV (optional)
 */
export const parseCSVRow = (row, csvHeaders, defaultExamType = null) => {
  // Special handling for JEE Main CSV format (has Institute and Academic Program Name columns)
  // When upload is for JEE Main, always treat as JEE Main format so we never map rank columns to category/collegeType
  const isJEEMainFormat =
    defaultExamType === 'JEE Main' ||
    csvHeaders.some(h => {
      const normalized = normalizeColumnName(h);
      return normalized === 'institute' || normalized === 'institute_group' ||
             normalized === 'academic program name' || normalized.includes('open (crl) round');
    });
  
  // Extract basic college info
  const extractedCode = extractValue(row, csvHeaders, columnMappings.code);
  
  // For JEE Main format, prioritize Institute column explicitly
  let collegeName = null;
  if (isJEEMainFormat) {
    // Try to find Institute column directly first
    const instituteCol = csvHeaders.find(h => normalizeColumnName(h) === 'institute');
    if (instituteCol && row[instituteCol]) {
      collegeName = row[instituteCol].toString().trim();
    }
  }
  
  // Fallback to standard extraction if not found
  if (!collegeName) {
    collegeName = extractValue(row, csvHeaders, columnMappings.name);
  }
  
  const collegeData = {
    name: collegeName,
    shortName: extractValue(row, csvHeaders, columnMappings.shortName),
    code: extractedCode && extractedCode.toString().trim() ? extractedCode.toString().trim() : undefined, // Use undefined instead of null for sparse index
    location: {
      city: extractValue(row, csvHeaders, columnMappings.city) || extractValue(row, csvHeaders, ['region']) || extractValue(row, csvHeaders, ['district']),
      state: extractValue(row, csvHeaders, columnMappings.state),
      district: extractValue(row, csvHeaders, columnMappings.district),
      pincode: extractValue(row, csvHeaders, columnMappings.pincode),
      address: extractValue(row, csvHeaders, columnMappings.address),
      nearestRailway: extractValue(row, csvHeaders, columnMappings.nearestRailway),
      nearestBusStand: extractValue(row, csvHeaders, columnMappings.nearestBusStand),
    },
    campusArea: parseFloat(extractValue(row, csvHeaders, columnMappings.campusArea, '0')) || undefined,
    collegeType: null, // Set below: JEE Main uses Institute_Group; others use extraction
    examTypes: [],
    branches: [],
    fees: {
      annualTuitionFee: parseFloat(extractValue(row, csvHeaders, columnMappings.annualTuitionFee, '0')) || 0,
      annualHostelFee: parseFloat(extractValue(row, csvHeaders, columnMappings.annualHostelFee, '0')) || 0,
      annualMessFee: parseFloat(extractValue(row, csvHeaders, columnMappings.annualMessFee, '0')) || 0,
    },
    placements: {
      averagePackage: parseFloat(extractValue(row, csvHeaders, columnMappings.averagePackage, '0')) || 0,
      highestPackage: parseFloat(extractValue(row, csvHeaders, columnMappings.highestPackage, '0')) || 0,
      placementRate: parseFloat(extractValue(row, csvHeaders, columnMappings.placementRate, '0')) || 0,
    },
    rankings: {
      nirf: parseInt(extractValue(row, csvHeaders, columnMappings.nirfRank, '0')) || undefined,
    },
    established: parseInt(extractValue(row, csvHeaders, columnMappings.established, '0')) || undefined,
    website: extractValue(row, csvHeaders, columnMappings.website),
    contact: {
      phone: extractValue(row, csvHeaders, columnMappings.phone),
      email: extractValue(row, csvHeaders, columnMappings.email),
    },
  };

  // Extract exam type - REQUIRED for cutoff parsing
  let examType = extractValue(row, csvHeaders, columnMappings.examType);
  if (!examType && defaultExamType) {
    examType = defaultExamType;
  }
  if (examType) {
    collegeData.examTypes = examType.split(',').map(e => e.trim()).filter(e => e);
    examType = collegeData.examTypes[0]; // Use first exam type for cutoff matching
  } else {
    // If no exam type found, we can't create cutoff data
    examType = null;
    console.warn('No exam type found in CSV row or provided as default');
  }

  // Normalize district name (convert codes like "EG" to "East Godavari")
  if (collegeData.location.district) {
    collegeData.location.district = normalizeDistrict(collegeData.location.district);
  }

  // Extract state from Institute name for JEE Main format (e.g., "Assam University, Silchar" → "Assam")
  if (isJEEMainFormat && !collegeData.location.state && collegeName) {
    const extractStateFromInstitute = (nameStr) => {
      if (!nameStr) return null;
      const parts = nameStr.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        // Try to match known state names
        const stateNames = [
          'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
          'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
          'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
          'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
          'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
          'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry'
        ];
        // Check all parts for state name
        for (const part of parts) {
          const matchedState = stateNames.find(state => 
            part.toLowerCase().includes(state.toLowerCase()) || 
            state.toLowerCase().includes(part.toLowerCase())
          );
          if (matchedState) return matchedState;
        }
        // If no exact match, try to infer from common patterns
        // Some institutes have state in the name itself (e.g., "Assam University")
        for (const state of stateNames) {
          if (nameStr.toLowerCase().includes(state.toLowerCase())) {
            return state;
          }
        }
      }
      return null;
    };
    
    const extractedState = extractStateFromInstitute(collegeName);
    if (extractedState) {
      collegeData.location.state = extractedState;
    }
  }

  // Set defaults for required fields if missing
  // Default state to Andhra Pradesh (for AP exams, or as fallback for other exams)
  if (!collegeData.location.state) {
    collegeData.location.state = 'Andhra Pradesh';
  }
  
  // Default collegeType to Private if not found (most engineering colleges are private)
  if (!collegeData.collegeType) {
    collegeData.collegeType = 'Private';
  }
  
  // Extract city from Institute name for JEE Main format (e.g., "Assam University, Silchar" → "Silchar")
  if (isJEEMainFormat && !collegeData.location.city && collegeName) {
    const parts = collegeName.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      // The last part after comma is usually the city
      collegeData.location.city = parts[parts.length - 1];
    }
  }

  // Ensure city has a value (use Region if available, otherwise use district, or default)
  if (!collegeData.location.city) {
    // Try to extract Region again (it should have been mapped to city, but ensure it's used)
    const regionValue = extractValue(row, csvHeaders, ['region']);
    if (regionValue) {
      collegeData.location.city = regionValue;
    } else if (collegeData.location.district) {
      collegeData.location.city = collegeData.location.district;
    } else {
      // Final fallback - use college name or a default (shouldn't happen with proper CSV)
      collegeData.location.city = collegeData.name ? `City of ${collegeData.name}` : 'Unknown';
    }
  }

  // Extract branch - REQUIRED for cutoff parsing
  // For JEE Main format, prioritize Academic Program Name column explicitly
  let branch = null;
  if (isJEEMainFormat) {
    // Try to find Academic Program Name column directly first
    const academicProgramCol = csvHeaders.find(h => normalizeColumnName(h) === 'academic program name');
    if (academicProgramCol && row[academicProgramCol]) {
      branch = row[academicProgramCol].toString().trim();
    }
  }
  
  // Fallback to standard extraction if not found
  if (!branch) {
    branch = extractValue(row, csvHeaders, columnMappings.branch);
  }
  if (branch) {
    collegeData.branches = [{
      name: branch,
      code: extractValue(row, csvHeaders, ['branch code', 'branch_code', 'course code', 'course_code']),
    }];
  } else {
    console.warn('No branch found in CSV row');
  }
  
  // For JEE Main: set collegeType from Institute_Group (never from "category" - that matches rank columns)
  if (isJEEMainFormat) {
    const instituteGroupCol = csvHeaders.find(h => normalizeColumnName(h) === 'institute group' || normalizeColumnName(h) === 'institute_group');
    const groupVal = instituteGroupCol && row[instituteGroupCol] ? row[instituteGroupCol].toString().trim().toUpperCase() : '';
    // GFTI, NIT, IIIT, etc. are typically government; others default to Government for safety
    const govKeywords = ['GFTI', 'NIT', 'IIIT', 'IIT', 'GOVT', 'GOVERNMENT', 'CENTRAL'];
    collegeData.collegeType = govKeywords.some(k => groupVal.includes(k)) ? 'Government' : 'Government';
  } else {
    collegeData.collegeType = extractValue(row, csvHeaders, columnMappings.collegeType);
  }
  // Ensure collegeType is a valid enum before use (fallback applied later)
  const validCollegeTypes = ['Government', 'Private', 'Deemed University', 'Autonomous'];
  if (collegeData.collegeType && !validCollegeTypes.includes(collegeData.collegeType)) {
    collegeData.collegeType = 'Government';
  }

  // Validation: Check if college name equals branch name (indicates wrong column mapping)
  // This is common in JEE Main CSV where "Academic Program Name" might be used as college name
  if (collegeData.name && branch && collegeData.name.trim().toLowerCase() === branch.trim().toLowerCase()) {
    console.warn(`⚠ College name matches branch name - likely wrong column mapping. College="${collegeData.name}", Branch="${branch}"`);
    // Try to find Institute column directly
    const instituteColumn = csvHeaders.find(h => 
      normalizeColumnName(h) === 'institute' || 
      normalizeColumnName(h).startsWith('institute ')
    );
    if (instituteColumn && row[instituteColumn]) {
      console.log(`  → Found Institute column: "${instituteColumn}" = "${row[instituteColumn]}"`);
      collegeData.name = row[instituteColumn].toString().trim();
      console.log(`  → Corrected college name to: "${collegeData.name}"`);
    } else {
      console.warn(`  → Could not find Institute column in CSV headers. Available: ${csvHeaders.join(', ')}`);
    }
  }
  
  // Extract cutoff data - CRITICAL for predictions
  // Support two formats:
  // 1. Single "Category" column with "Closing Rank" column
  // 2. Category-specific columns (OC_BOYS, SC_BOYS, etc.) where each column is a rank for that category
  
  const year = extractValue(row, csvHeaders, columnMappings.year) || new Date().getFullYear() - 1;
  const cutoffYear = parseInt(year);

  // Initialize cutoffs array
  if (!collegeData.cutoffs) {
    collegeData.cutoffs = [];
  }

  // Format 1: Standard format with Category and Closing Rank columns
  // Skip for JEE Main - its "category" columns are rank columns (e.g. "EWS (Category Rank) Round 1"), not category names
  const category = isJEEMainFormat ? null : extractValue(row, csvHeaders, columnMappings.category);
  const closingRank = extractValue(row, csvHeaders, columnMappings.closingRank);
  const openingRank = extractValue(row, csvHeaders, columnMappings.openingRank);
  const closingPercentile = extractValue(row, csvHeaders, columnMappings.closingPercentile);
  const openingPercentile = extractValue(row, csvHeaders, columnMappings.openingPercentile);

  let format1Processed = false;
  if (examType && branch && category && (closingRank || closingPercentile)) {
    // Standard format - single category per row (only when category is a valid label, not a number)
    const validCategories = ['General', 'OBC', 'SC', 'ST', 'EWS', 'Other'];
    const categoryStr = category && category.toString ? category.toString().trim() : '';
    const isCategoryValid = validCategories.includes(categoryStr) || /^[a-z\s-]+$/i.test(categoryStr);
    if (isCategoryValid) {
      const cutoffData = {
        examType: examType,
        branch: branch,
        category: categoryStr,
        year: cutoffYear,
        openingRank: openingRank ? parseInt(openingRank) : undefined,
        closingRank: closingRank ? parseInt(closingRank) : undefined,
        openingPercentile: openingPercentile ? parseFloat(openingPercentile) : undefined,
        closingPercentile: closingPercentile ? parseFloat(closingPercentile) : undefined,
      };
      collegeData.cutoffs.push(cutoffData);
      format1Processed = true;
    }
  }

  // Format 2: Category-specific columns
  // Always check for this format if examType and branch are available
  if (examType && branch && !format1Processed) {
    // JEE Main: OPEN (CRL) Round 1–6, EWS/OBC-NCL/SC/ST (Category Rank) Round 1–6
    if (examType === 'JEE Main') {
      const jeeMainCategoryColumns = {
        General: ['OPEN (CRL) Round 1', 'OPEN (CRL) Round 2', 'OPEN (CRL) Round 3', 'OPEN (CRL) Round 4', 'OPEN (CRL) Round 5', 'OPEN (CRL) Round 6'],
        EWS: ['EWS (Category Rank) Round 1', 'EWS (Category Rank) Round 2', 'EWS (Category Rank) Round 3', 'EWS (Category Rank) Round 4', 'EWS (Category Rank) Round 5', 'EWS (Category Rank) Round 6'],
        OBC: ['OBC-NCL (Category Rank) Round 1', 'OBC-NCL (Category Rank) Round 2', 'OBC-NCL (Category Rank) Round 3', 'OBC-NCL (Category Rank) Round 4', 'OBC-NCL (Category Rank) Round 5', 'OBC-NCL (Category Rank) Round 6'],
        SC: ['SC (Category Rank) Round 1', 'SC (Category Rank) Round 2', 'SC (Category Rank) Round 3', 'SC (Category Rank) Round 4', 'SC (Category Rank) Round 5', 'SC (Category Rank) Round 6'],
        ST: ['ST (Category Rank) Round 1', 'ST (Category Rank) Round 2', 'ST (Category Rank) Round 3', 'ST (Category Rank) Round 4', 'ST (Category Rank) Round 5', 'ST (Category Rank) Round 6'],
      };

      let foundJeeMainColumns = false;
      Object.entries(jeeMainCategoryColumns).forEach(([categoryName, headersForCategory]) => {
        const ranks = [];
        headersForCategory.forEach((col) => {
          const key = findRowKeyForColumn(row, col) || (csvHeaders.includes(col) ? col : null);
          if (!key) return;
          const raw = row[key];
          if (raw === undefined || raw === null || raw === '') return;
          const cleaned = raw.toString().replace(/,/g, '').trim();
          if (!cleaned) return;
          const num = parseFloat(cleaned);
          if (!Number.isNaN(num) && num > 0) {
            ranks.push(num);
          }
        });

        if (ranks.length > 0) {
          foundJeeMainColumns = true;
          const closingRankJee = Math.max(...ranks);

          const existingCutoff = collegeData.cutoffs.find(
            (c) =>
              c.examType === examType &&
              c.branch === branch &&
              c.category === categoryName &&
              c.year === cutoffYear
          );

          if (existingCutoff) {
            if (!existingCutoff.closingRank || closingRankJee > existingCutoff.closingRank) {
              existingCutoff.closingRank = closingRankJee;
            }
          } else {
            collegeData.cutoffs.push({
              examType,
              branch,
              category: categoryName,
              year: cutoffYear,
              closingRank: closingRankJee,
              openingRank: undefined,
            });
          }
        }
      });

      if (foundJeeMainColumns) {
        format1Processed = true;
      }
    } else if (examType === 'NEET') {
      // NOTE: We intentionally ignore PwD columns here when building generic cutoffs,
      // and only use the non-PwD round columns. PwD-specific behavior is handled
      // later in the prediction service using the raw CSV content.
      const neetCategoryColumns = {
        General: ['Open_R1', 'Open_R2', 'Open_R3', 'Open_Stray Round'],
        OBC: ['OBC_R1', 'OBC_R2', 'OBC_R3', 'OBC_Stray Round'],
        SC: ['SC_R1', 'SC_R2', 'SC_R3', 'SC_Stray Round'],
        ST: ['ST_R1', 'ST_R2', 'ST_R3', 'ST_Stray Round'],
        EWS: ['EWS_R1', 'EWS_R2', 'EWS_R3', 'EWS_Stray Round'],
      };

      let foundNeetColumns = false;

      Object.entries(neetCategoryColumns).forEach(([categoryName, headersForCategory]) => {
        // Collect numeric ranks from all available round columns
        const ranks = [];
        headersForCategory.forEach((col) => {
          // Match against exact header in CSV (keys are original, not lowercased)
          if (!csvHeaders.includes(col)) return;
          const raw = row[col];
          if (raw === undefined || raw === null || raw === '') return;
          const cleaned = raw.toString().replace(/,/g, '').trim();
          if (!cleaned) return;
          const num = parseInt(cleaned, 10);
          if (!Number.isNaN(num) && num > 0) {
            ranks.push(num);
          }
        });

        if (ranks.length > 0) {
          foundNeetColumns = true;
          // Use the worst (largest) rank across rounds as closing rank
          const closingRankNeet = Math.max(...ranks);

          const existingCutoff = collegeData.cutoffs.find(
            (c) =>
              c.examType === examType &&
              c.branch === branch &&
              c.category === categoryName &&
              c.year === cutoffYear
          );

          if (existingCutoff) {
            // Keep the more generous (higher) closing rank
            if (
              !existingCutoff.closingRank ||
              closingRankNeet > existingCutoff.closingRank
            ) {
              existingCutoff.closingRank = closingRankNeet;
            }
          } else {
            collegeData.cutoffs.push({
              examType,
              branch,
              category: categoryName,
              year: cutoffYear,
              closingRank: closingRankNeet,
              openingRank: undefined,
            });
            console.log(
              `Added NEET cutoff: ${categoryName} - ${closingRankNeet} for ${collegeData.name} (${branch})`
            );
          }
        }
      });

      if (!foundNeetColumns) {
        console.warn(
          `⚠ No NEET category round columns found in CSV for ${collegeData.name}. Available headers: ${csvHeaders.join(
            ', '
          )}`
        );
      }
    } else if (examType === 'JEE Advanced' || examType === 'IIT JEE') {
      // NOTE: We intentionally ignore PwD columns here when building generic cutoffs,
      // and only use the non-PwD round columns. PwD-specific behavior is handled
      // later in the prediction service using the raw CSV content.
      const jeeAdvancedCategoryColumns = {
        General: ['OPEN Round 1', 'OPEN Round 2', 'OPEN Round 3', 'OPEN Round 4', 'OPEN Round 5', 'OPEN Round 6'],
        EWS: ['EWS Round 1', 'EWS Round 2', 'EWS Round 3', 'EWS Round 4', 'EWS Round 5', 'EWS Round 6'],
        'OBC-NCL': ['OBC-NCL Round 1', 'OBC-NCL Round 2', 'OBC-NCL Round 3', 'OBC-NCL Round 4', 'OBC-NCL Round 5', 'OBC-NCL Round 6'],
        SC: ['SC Round 1', 'SC Round 2', 'SC Round 3', 'SC Round 4', 'SC Round 5', 'SC Round 6'],
        ST: ['ST Round 1', 'ST Round 2', 'ST Round 3', 'ST Round 4', 'ST Round 5', 'ST Round 6'],
      };

      // Map JEE Advanced categories to database schema categories
      const categoryMapping = {
        'OBC-NCL': 'OBC',
        // Other categories map to themselves
      };

      let foundJeeColumns = false;

      Object.entries(jeeAdvancedCategoryColumns).forEach(([categoryName, headersForCategory]) => {
        // Collect numeric ranks from all available round columns
        const ranks = [];
        headersForCategory.forEach((col) => {
          // Match against exact header in CSV (keys are original, not lowercased)
          if (!csvHeaders.includes(col)) return;
          const raw = row[col];
          if (raw === undefined || raw === null || raw === '') return;
          const cleaned = raw.toString().replace(/,/g, '').trim();
          if (!cleaned) return;
          const num = parseInt(cleaned, 10);
          if (!Number.isNaN(num) && num > 0) {
            ranks.push(num);
          }
        });

        if (ranks.length > 0) {
          foundJeeColumns = true;
          // Use the worst (largest) rank across rounds as closing rank
          const closingRankJee = Math.max(...ranks);

          const mappedCategory = categoryMapping[categoryName] || categoryName;
          const existingCutoff = collegeData.cutoffs.find(
            (c) =>
              c.examType === examType &&
              c.branch === branch &&
              c.category === mappedCategory &&
              c.year === cutoffYear
          );

          if (existingCutoff) {
            // Keep the more generous (higher) closing rank
            if (
              !existingCutoff.closingRank ||
              closingRankJee > existingCutoff.closingRank
            ) {
              existingCutoff.closingRank = closingRankJee;
            }
          } else {
            collegeData.cutoffs.push({
              examType,
              branch,
              category: mappedCategory,
              year: cutoffYear,
              closingRank: closingRankJee,
              openingRank: undefined,
            });
            console.log(
              `Added JEE Advanced cutoff: ${categoryName}->${mappedCategory} - ${closingRankJee} for ${collegeData.name} (${branch})`
            );
          }
        }
      });

      if (!foundJeeColumns) {
        console.warn(
          `⚠ No JEE Advanced category round columns found in CSV for ${collegeData.name}. Available headers: ${csvHeaders.join(
            ', '
          )}`
        );
      }
    } else {
      // For AP exams (AP EAPCET, AP ECET), use actual column headers as categories
      const normalizedExam = (examType || '').toString().toUpperCase();
      const isAPExam = normalizedExam.includes('EAPCET') || normalizedExam.includes('ECET') || normalizedExam.includes('EAMCET');


      
      let foundCategoryColumns = false;

      csvHeaders.forEach((header) => {
        const normalizedHeader = normalizeColumnName(header);

        // Skip if this is not a category column
        const nonCategoryColumns = [
          'college name', 'branch', 'district', 'region', 'gender', 'city', 'state', 'code', 'name',
          'short name', 'pincode', 'address', 'nearest railway', 'nearest bus stand', 'college type',
          'exam type', 'year', 'closing rank', 'opening rank', 'annual tuition fee', 'annual hostel fee',
          'annual mess fee', 'average package', 'highest package', 'placement rate', 'nirf rank',
          'campus area', 'established', 'website', 'phone', 'email'
        ];

        if (
          nonCategoryColumns.some((nc) => {
            const normalizedNC = normalizeColumnName(nc);
            return normalizedHeader === normalizedNC || normalizedHeader === normalizedNC + 's';
          })
        ) {
          return;
        }

        // If it's an AP exam, we take the header as is (uppercase/normalized)
        // If not, we still check the patterns but allow them to pass through
        let categoryName = null;
        
        if (isAPExam) {
          // Keep specific AP categories like OC_BOYS, SC_GIRLS
          categoryName = header.toUpperCase().replace(/\s+/g, '_');
        } else {
          // Fallback to pattern matching for other exams
          const categoryColumnPatterns = {
            General: ['oc_boys', 'oc_girls', 'oc'],
            OBC: ['bca_boys', 'bca_girls', 'bcb_boys', 'bcb_girls', 'bcc_boys', 'bcc_girls', 'bcd_boys', 'bcd_girls', 'bce_boys', 'bce_girls'],
            SC: ['sc_boys', 'sc_girls'],
            ST: ['st_boys', 'st_girls'],
            EWS: ['oc_ews_boys', 'oc_ews_girls'],
          };

          Object.entries(categoryColumnPatterns).forEach(([name, patterns]) => {
            if (patterns.some(p => normalizedHeader.includes(normalizeColumnName(p)))) {
              categoryName = name;
            }
          });
          
          // If no pattern matches but it looks like a rank column, use it as is
          if (!categoryName && (normalizedHeader.includes('rank') || normalizedHeader.length <= 10)) {
            categoryName = header.toUpperCase().replace(/\s+/g, '_');
          }
        }

        if (categoryName) {
          const rankValue = row[header];
          if (rankValue !== undefined && rankValue !== null && rankValue !== '') {
            const stringValue = rankValue.toString().trim();
            if (stringValue === '' || stringValue === ',' || stringValue === ' ') return;

            const cleanedValue = stringValue.replace(/,/g, '').replace(/\s+/g, '');
            const rank = parseInt(cleanedValue, 10);

            if (!isNaN(rank) && rank > 0) {
              foundCategoryColumns = true;
              const existingCutoff = collegeData.cutoffs.find(
                (c) => c.examType === examType && c.branch === branch && c.category === categoryName && c.year === cutoffYear
              );

              if (existingCutoff) {
                if (!existingCutoff.closingRank || rank < existingCutoff.closingRank) {
                  existingCutoff.closingRank = rank;
                }
              } else {
                collegeData.cutoffs.push({
                  examType,
                  branch,
                  category: categoryName,
                  year: cutoffYear,
                  closingRank: rank,
                });
              }
            }
          }
        }
      });

      if (!foundCategoryColumns && examType && branch) {
        console.warn(`⚠ No category columns found in CSV for ${collegeData.name}`);
      }
    }
  }

  // Sanitize: remove restrictive filtering of categories
  const allowedCollegeTypes = ['Government', 'Private', 'Deemed University', 'Autonomous'];
  const ct = collegeData.collegeType;
  if (!ct || typeof ct !== 'string' || !allowedCollegeTypes.includes(ct)) {
    collegeData.collegeType = 'Government';
  }

  return collegeData;
};


/**
 * Get detected columns info for display
 */
export const getDetectedColumns = (csvHeaders) => {
  const detected = {};
  
  Object.keys(columnMappings).forEach(key => {
    const found = findMatchingColumn(csvHeaders, columnMappings[key]);
    if (found) {
      detected[key] = found;
    }
  });
  
  return detected;
};
