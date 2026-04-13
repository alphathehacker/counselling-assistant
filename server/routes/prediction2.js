import express from 'express';
import { body, validationResult } from 'express-validator';
import { protect } from '../middleware/auth.js';
import College from '../models/College.js';
import PredictionResult from '../models/PredictionResult.js';
import { normalizeDistrict, districtMatches } from '../utils/districtNormalizer.js';


const router = express.Router();

/**
 * @route   POST /api/prediction2/predict
 * @desc    Get college predictions based on database (admin colleges) instead of CSV
 * @access  Private
 */
router.post(
  '/predict',
  protect,
  [
    body('examType').notEmpty().withMessage('Exam type is required'),
    body('rank').isNumeric().withMessage('Rank must be a number'),
    body('category').notEmpty().withMessage('Category is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const {
        examType,
        rank,
        category,
        gender = 'Male',
        districts = [],
        preferredBranches = [],
      } = req.body;

      const numericRank = Number(rank);
      
      // Compute gender suffix for AP exams
      let genderSuffix = '_BOYS';
      if (gender === 'Female') {
        genderSuffix = '_GIRLS';
      }

      let baseCategory = category.toUpperCase().replace(/[\s-]/g, '_');
      
      // If category already has gender info (like OC_BOYS), don't append suffix
      const hasGenderInCat = baseCategory.includes('_BOYS') || baseCategory.includes('_GIRLS');
      
      // Map BC_A -> BCA, BC_B -> BCB, etc. for AP exams matching database format
      baseCategory = baseCategory.replace(/^BC_([A-E])$/, 'BC$1');
      // Map EWS -> OC_EWS specifically for AP exams
      if (baseCategory === 'EWS') {
        baseCategory = 'OC_EWS';
      }
      
      const categoryWithGender = hasGenderInCat ? baseCategory : (baseCategory + genderSuffix);
      const categoryAlt = baseCategory === 'OC' ? ('OPEN' + genderSuffix) : null;

      console.log(`[PREDICT2 DEBUG] Input - Exam: ${examType}, Rank: ${numericRank}, Category: ${category}, Gender: ${gender}`);
      console.log(`[PREDICT2 DEBUG] Derived - BaseCat: ${baseCategory}, CatWithGender: ${categoryWithGender}, CatAlt: ${categoryAlt}`);

      // Normalize districts input
      let districtsInput = Array.isArray(districts) ? districts : [districts];
      districtsInput = districtsInput.map(d => normalizeDistrict(d)).filter(Boolean);

      const preferredBranchesLower = (preferredBranches || []).map(b => b.toLowerCase().trim()).filter(Boolean);

      // Query database for colleges that accept this exam
      const query = { 
        examTypes: examType,
        isActive: true
      };

      const colleges = await College.find(query).lean();
      console.log(`[PREDICT2 DEBUG] Found ${colleges.length} colleges for exam ${examType}`);

      const filteredResults = [];

      for (const college of colleges) {
        // District filter
        if (districtsInput.length > 0) {
          const collegeDistrict = normalizeDistrict(college.location?.district || college.location?.city);
          const hasMatch = districtsInput.some(d => districtMatches(collegeDistrict, d));
          if (!hasMatch) continue;
        }

        // Branch filter and Rank check
        if (college.cutoffs && college.cutoffs.length > 0) {
          const matchingCutoffs = (college.cutoffs || []).filter(c => {
            if (c.examType !== examType) return false;
            const cat = c.category;
            const isMatch = cat === categoryWithGender || 
                   cat === baseCategory || 
                   (categoryAlt && cat === categoryAlt);
            return isMatch;
          });

          for (const cutoff of matchingCutoffs) {
            // Match branch if preferredBranches provided
            if (preferredBranchesLower.length > 0) {
              const branchName = (cutoff.branch || '').toString().toLowerCase();
              const branchMatch = preferredBranchesLower.some(
                pref => branchName.includes(pref) || pref.includes(branchName)
              );
              if (!branchMatch) continue;
            }

            // Check rank
            if (numericRank > (cutoff.closingRank || 0)) continue;

            // Calculate probability
            const rankDiff = (cutoff.closingRank || 0) - numericRank;
            const percentDiff = ((cutoff.closingRank || 1) > 0 ? (rankDiff / cutoff.closingRank) * 100 : 0);
            
            let admissionProbability = 50;
            let probability = 'medium';
            if (percentDiff > 30) {
              admissionProbability = 85;
              probability = 'high';
            } else if (percentDiff > 15) {
              admissionProbability = 70;
              probability = 'high';
            } else if (percentDiff > 0) {
              admissionProbability = 50;
              probability = 'medium';
            } else if (percentDiff > -10) {
              admissionProbability = 30;
              probability = 'low';
            } else {
              admissionProbability = 10;
              probability = 'low';
            }

            filteredResults.push({
              collegeId: college._id,
              name: college.name,
              branch: cutoff.branch,
              district: college.location?.district || college.location?.city,
              location: college.location,
              cutoffRank: cutoff.closingRank,
              cutoff_rank: cutoff.closingRank,
              predictedCutoff: Math.round((cutoff.closingRank || 0) * 0.95),
              admissionProbability,
              probability,
              admissionChance: probability, // ADDED for frontend summary compatibility
              collegeType: college.collegeType,
              rankings: college.rankings,
              fees: college.fees,
              placements: college.placements,
              imageUrl: college.imageUrl
            });
          }
        }
      }

      console.log(`[PREDICT2 DEBUG] Filtered Results: ${filteredResults.length}`);

      // Sort results by cutoff rank (best to worst for the rank)
      filteredResults.sort((a, b) => a.cutoffRank - b.cutoffRank);

      // Group by district + branch (to mirror original prediction structure and support frontend grouping)
      const grouped = {};
      for (const result of filteredResults) {
        const distStr = result.district || 'Unknown';
        const branchStr = (result.branch || '').toString().toUpperCase().trim();
        const key = `${distStr}_${branchStr}`;

        if (!grouped[key]) {
          grouped[key] = {
            district: distStr,
            branch: branchStr,
            colleges: [],
          };
        }
        grouped[key].colleges.push(result);
      }

      const resultsGrouped = Object.values(grouped).sort((a, b) => {
        if (a.district !== b.district) return a.district.localeCompare(b.district);
        return a.branch.localeCompare(b.branch);
      });

      // Calculate summary statistics
      const summary = {
        totalColleges: filteredResults.length,
        highProbability: filteredResults.filter(p => p.probability === 'high').length,
        moderateProbability: filteredResults.filter(p => p.probability === 'medium').length,
        lowProbability: filteredResults.filter(p => p.probability === 'low').length,
      };

      // Save to database if user is authenticated
      let predictionResultId = null;
      if (req.user && req.user._id) {
        try {
          const predictionResult = await PredictionResult.create({
            user: req.user._id,
            predictionParams: {
              examType,
              rank: numericRank,
              category,
              districts: districtsInput,
              preferredBranches
            },
            predictions: filteredResults.map(p => ({
              collegeId: p.collegeId || p._id,
              collegeName: p.name,
              branch: p.branch,
              district: p.district,
              location: p.location,
              cutoffRank: p.cutoffRank,
              predictedCutoff: p.predictedCutoff,
              admissionProbability: p.admissionProbability,
              probability: p.probability,
              collegeType: p.collegeType,
              rankings: p.rankings,
              fees: p.fees,
              placements: p.placements,
              imageUrl: p.imageUrl
            })),
            summary
          });
          predictionResultId = predictionResult._id;
        } catch (saveError) {
          console.error('Error saving prediction result:', saveError);
        }
      }

      res.json({
        success: true,
        count: filteredResults.length,
        predictionResultId,
        predictions: filteredResults,
        resultsGrouped,
        summary
      });

    } catch (error) {
      console.error('Prediction2 error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during prediction',
        error: error.message,
      });
    }
  }
);

export default router;
