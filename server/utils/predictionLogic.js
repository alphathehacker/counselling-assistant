import College from '../models/College.js';
import { normalizeDistrict, districtMatches } from './districtNormalizer.js';

/**
 * Get predictions for AP EAPCET/ECET exams
 * Logic based on the Flask example provided
 * CSV format: Each row has category columns (OC_BOYS, SC_BOYS, etc.) containing closing ranks
 * MongoDB format: Cutoffs array with category='General', 'OBC', etc., and closingRank field
 */
export async function predictAPEAPCET({
  examType,
  rank,
  category, // Category column name like 'OC_BOYS', 'SC_BOYS', etc.
  gender = 'COED',
  district, // Can be a string or array of districts
  preferredBranches = [],
}) {
  try {
    // Normalize inputs
    const normalizedGender = gender.toUpperCase().trim();
    // Handle district as string or array
    const districtsArray = Array.isArray(district) 
      ? district.map(d => d ? d.trim() : '').filter(Boolean)
      : (district ? [district.trim()] : []);
    const normalizedBranches = preferredBranches.map(b => b.trim().toLowerCase()).filter(Boolean);
    const categoryKey = category.toUpperCase().trim();

    // Map category column names to normalized categories (as stored in MongoDB)
    const categoryColumnToNormalized = {
      'OC_BOYS': 'General',
      'OC_GIRLS': 'General',
      'OC': 'General',
      'SC_BOYS': 'SC',
      'SC_GIRLS': 'SC',
      'SC': 'SC',
      'ST_BOYS': 'ST',
      'ST_GIRLS': 'ST',
      'ST': 'ST',
      'BCA_BOYS': 'OBC',
      'BCA_GIRLS': 'OBC',
      'BCB_BOYS': 'OBC',
      'BCB_GIRLS': 'OBC',
      'BCC_BOYS': 'OBC',
      'BCC_GIRLS': 'OBC',
      'BCD_BOYS': 'OBC',
      'BCD_GIRLS': 'OBC',
      'BCE_BOYS': 'OBC',
      'BCE_GIRLS': 'OBC',
      'OC_EWS_BOYS': 'EWS',
      'OC_EWS_GIRLS': 'EWS',
      'EWS': 'EWS',
    };

    const normalizedCategory = categoryColumnToNormalized[categoryKey] || categoryKey;

    // Query colleges that have cutoff data for this exam type and category
    // The Flask logic filters where df[category] >= rank, meaning closingRank >= userRank
    // Note: We need to query colleges and then filter cutoffs in application code
    // because MongoDB can't easily filter nested array elements with multiple conditions
    const baseQuery = {
      examTypes: examType,
      isActive: true,
      'cutoffs.examType': examType,
    };

    // Filter by districts if provided (at college level)
    // Note: We'll do initial filtering here, but final matching happens in post-processing
    // since we need to normalize district names for accurate matching

    const colleges = await College.find(baseQuery).lean();

    // Process each college to extract relevant cutoff data
    const filteredResults = [];

    for (const college of colleges) {
      // Additional district filtering (exact match after normalization)
      if (districtsArray.length > 0) {
        const collegeDistrict = college.location?.district || college.location?.city || '';
        const normalizedCollegeDistrict = normalizeDistrict(collegeDistrict);
        const matchesAnyDistrict = districtsArray.some(district => 
          districtMatches(normalizedCollegeDistrict, district)
        );
        if (!matchesAnyDistrict) {
          continue;
        }
      }

      // Get cutoffs for this exam type and category
      for (const cutoff of college.cutoffs || []) {
        // Filter by exam type and category
        if (cutoff.examType !== examType || cutoff.category !== normalizedCategory) {
          continue;
        }

        // Filter by closing rank: closingRank >= userRank (user is eligible if their rank is better/equal)
        const closingRank = cutoff.closingRank;
        if (!closingRank || closingRank < rank) {
          continue; // Closing rank must be >= user rank (user has better rank)
        }

        // Filter by branch
        if (normalizedBranches.length > 0) {
          const collegeBranch = (cutoff.branch || '').toLowerCase().trim();
          const branchMatch = normalizedBranches.some(branch => 
            collegeBranch.includes(branch) || branch.includes(collegeBranch)
          );
          if (!branchMatch) {
            continue;
          }
        }

        // Get gender from college data (if available in cutoffs, otherwise default to COED)
        const collegeGender = 'COED'; // Default, could be enhanced if gender is stored per cutoff

        // Add to results
        filteredResults.push({
          college_name: college.name,
          branch: cutoff.branch || '',
          district: college.location?.district || college.location?.city || '',
          gender: collegeGender,
          cutoff_rank: closingRank,
          region: college.location?.region || college.location?.city || '',
          category: normalizedCategory,
          college: college, // Include full college object for additional details
        });
      }
    }

    // Sort by cutoff rank (ascending - better colleges first)
    filteredResults.sort((a, b) => a.cutoff_rank - b.cutoff_rank);

    // Group results by district and branch (like Flask example)
    const groupedResults = {};
    for (const result of filteredResults) {
      const district = result.district || 'Unknown';
      const branch = (result.branch || 'Unknown').toUpperCase().trim();
      const key = `${district}_${branch}`;

      if (!groupedResults[key]) {
        groupedResults[key] = {
          district: district,
          branch: branch,
          colleges: [],
        };
      }

      groupedResults[key].colleges.push({
        name: result.college_name,
        branch: result.branch,
        district: result.district,
        gender: result.gender,
        cutoffRank: result.cutoff_rank,
        region: result.region,
        category: result.category,
        // Additional college details
        collegeType: result.college?.collegeType,
        fees: result.college?.fees,
        placements: result.college?.placements,
        rankings: result.college?.rankings,
        website: result.college?.website,
        facilities: result.college?.facilities,
      });
    }

    // Convert to list and sort groups
    const resultsGrouped = Object.values(groupedResults);
    resultsGrouped.sort((a, b) => {
      if (a.district !== b.district) {
        return a.district.localeCompare(b.district);
      }
      return a.branch.localeCompare(b.branch);
    });

    // Create flat predictions array
    const predictions = [];
    for (const group of resultsGrouped) {
      for (const college of group.colleges) {
        predictions.push({
          name: college.name,
          branch: college.branch,
          district: college.district,
          cutoffRank: college.cutoffRank,
          gender: college.gender,
          category: college.category,
          collegeType: college.collegeType,
          fees: college.fees,
          placements: college.placements,
          rankings: college.rankings,
          website: college.website,
          facilities: college.facilities,
        });
      }
    }

    return {
      success: true,
      count: predictions.length,
      predictions: predictions,
      resultsGrouped: resultsGrouped,
    };
  } catch (error) {
    console.error('Prediction error:', error);
    throw error;
  }
}

/**
 * Get branches for an exam type
 */
export async function getBranchesForExam(examType) {
  try {
    const colleges = await College.find({
      examTypes: examType,
      isActive: true,
      'cutoffs.examType': examType,
    }).select('cutoffs.branch').lean();

    const branchesSet = new Set();
    colleges.forEach(college => {
      college.cutoffs?.forEach(cutoff => {
        if (cutoff.examType === examType && cutoff.branch) {
          branchesSet.add(cutoff.branch);
        }
      });
    });

    return Array.from(branchesSet).sort();
  } catch (error) {
    console.error('Error fetching branches:', error);
    throw error;
  }
}
