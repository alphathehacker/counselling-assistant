import express from 'express';
import { body, validationResult } from 'express-validator';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';
import csv from 'csv-parser';
import mongoose from 'mongoose';

import { protect } from '../middleware/auth.js';
import { getLocationOptions, isDistrictBasedExam } from '../utils/locationData.js';
import CSVData from '../models/CSVData.js';
import College from '../models/College.js';
import PredictionResult from '../models/PredictionResult.js';
import User from '../models/User.js';
import { normalizeDistrict, districtMatches } from '../utils/districtNormalizer.js';
import { sendPredictionEmail } from '../utils/emailService.js';

const router = express.Router();

// Helper: parse CSV string content into array of normalized row objects
const parseCsvContent = (csvContent) => {
  return new Promise((resolve, reject) => {
    const rows = [];
    const stream = Readable.from([csvContent]);

    stream
      .pipe(csv())
      .on('data', (data) => {
        // Normalize keys to lowercase trimmed (similar to Python/pandas)
        const normalizedRow = {};
        Object.keys(data).forEach((key) => {
          if (key == null) return;
          const normalizedKey = key.toString().trim().toLowerCase();
          normalizedRow[normalizedKey] = data[key];
        });

        // Rename "college name" → "college_name" like Python does
        if (
          normalizedRow['college name'] !== undefined &&
          normalizedRow['college_name'] === undefined
        ) {
          normalizedRow['college_name'] = normalizedRow['college name'];
        }

        // Normalize district if present
        if (normalizedRow['district']) {
          normalizedRow['district'] = normalizeDistrict(normalizedRow['district']);
        }

        rows.push(normalizedRow);
      })
      .on('end', () => resolve(rows))
      .on('error', (err) => reject(err));
  });
};

// Helper: load and parse CSV rows for an exam type
const loadExamRows = async (examType) => {
  const decodedExamType = decodeURIComponent(examType);

  const csvData = await CSVData.findOne({
    examType: decodedExamType,
    isActive: true,
  }).sort({ uploadedAt: -1 });

  if (!csvData) {
    const availableTypes = await CSVData.distinct('examType', { isActive: true });
    const error = new Error(
      `No CSV data found for exam type: ${decodedExamType}. Please upload CSV file first.`
    );
    error.statusCode = 404;
    error.availableTypes = availableTypes;
    throw error;
  }

  const rows = await parseCsvContent(csvData.csvContent || '');
  return { rows, examType: csvData.examType };
};

// @route   POST /api/prediction/predict
// @desc    Get college predictions based on user inputs
// @access  Private
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
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const {
        examType,
        rank,
        category,
        round, // For JEE Advanced: round 1-6
        gender = 'COED',
        districts = [],
        district: singleDistrict,
        preferredBranches = [],
      } = req.body;

      const numericRank = Number(rank);

      // Build districts array (support both "districts" and single "district")
      let districtsInput = [];
      if (Array.isArray(districts)) {
        districtsInput = districts.filter(Boolean);
      } else if (typeof districts === 'string' && districts.trim()) {
        districtsInput = [districts.trim()];
      } else if (singleDistrict && typeof singleDistrict === 'string' && singleDistrict.trim()) {
        districtsInput = [singleDistrict.trim()];
      }
      
      districtsInput = districtsInput.map(d => d.toString().trim()).filter(Boolean);

      // Load CSV rows for this exam type
      const { rows } = await loadExamRows(examType);

      const filteredResults = [];
      const preferredBranchesLower = (preferredBranches || []).map((b) =>
        b.toString().trim().toLowerCase()
      );

      // --- NEET-specific logic (uses State + Course + NEET category columns) ---
      if (examType === 'NEET') {
        // Map request categories to human-readable labels and underlying CSV columns
        const neetCategoryConfig = {
          EWS: {
            label: 'EWS',
            columns: ['ews_stray round', 'ews_r3', 'ews_r2', 'ews_r1'],
          },
          EWS_PwD: {
            label: 'EWS PwD',
            columns: ['ews pwd_r3', 'ews pwd_r2', 'ews pwd_r1'],
          },
          OBC: {
            label: 'OBC',
            columns: ['obc_stray round', 'obc_r3', 'obc_r2', 'obc_r1'],
          },
          OBC_PwD: {
            label: 'OBC PwD',
            columns: ['obc pwd_r3', 'obc pwd_r2', 'obc pwd_r1'],
          },
          Open: {
            label: 'Open',
            columns: ['open_stray round', 'open_r3', 'open_r2', 'open_r1'],
          },
          Open_PwD: {
            label: 'Open PwD',
            columns: ['open pwd_r3', 'open pwd_r2', 'open pwd_r1'],
          },
          SC: {
            label: 'SC',
            columns: ['sc_stray round', 'sc_r3', 'sc_r2', 'sc_r1'],
          },
          SC_PwD: {
            label: 'SC PwD',
            columns: ['sc pwd_r3', 'sc pwd_r2', 'sc pwd_r1'],
          },
          ST: {
            label: 'ST',
            columns: ['st_stray round', 'st_r3', 'st_r2', 'st_r1'],
          },
          ST_PwD: {
            label: 'ST PwD',
            columns: ['st pwd_r3', 'st pwd_r2', 'st pwd_r1'],
          },
        };

        const neetCategory = neetCategoryConfig[category];
        if (!neetCategory) {
          return res.status(400).json({
            success: false,
            message: `Unsupported NEET category: ${category}`,
          });
        }

        // Quick sanity check that at least one of the NEET columns exists
        const rowExample = rows[0] || {};
        const hasAnyNeetColumn = neetCategory.columns.some((col) =>
          Object.prototype.hasOwnProperty.call(rowExample, col)
        );

        if (!hasAnyNeetColumn) {
          return res.status(400).json({
            success: false,
            message: `NEET CSV does not contain any columns for category ${neetCategory.label}. Expected one of: ${neetCategory.columns.join(
              ', '
            )}`,
          });
        }

        for (const row of rows) {
          // Location filtering – for NEET we filter by State
          if (districtsInput.length > 0) {
            const collegeState = (row['state'] || '').toString().trim();
            const matchesAnyLocation = districtsInput.some((loc) =>
              districtMatches(collegeState, loc)
            );
            if (!matchesAnyLocation) continue;
          }

          // Branch / course filtering (use "course" column from NEET CSV)
          if (preferredBranchesLower.length > 0) {
            const collegeCourse = (row['course'] || '').toString().trim().toLowerCase();
            const branchMatch = preferredBranchesLower.some(
              (branch) =>
                collegeCourse.includes(branch) || branch.includes(collegeCourse)
            );
            if (!branchMatch) continue;
          }

          // Rank cutoff – take the **largest** available rank across rounds for the chosen category
          const cutoffValues = [];
          for (const col of neetCategory.columns) {
            const raw = row[col];
            if (raw === '' || raw == null) continue;
            const num = Number(raw);
            if (Number.isFinite(num)) {
              cutoffValues.push(num);
            }
          }

          if (cutoffValues.length === 0) {
            continue;
          }

          const cutoffRank = Math.max(...cutoffValues);
          if (cutoffRank < numericRank) {
            continue;
          }

          const collegeState = (row['state'] || '').toString().trim();

          filteredResults.push({
            college_name: row['institute'] || '',
            branch: row['course'] || '',
            district: collegeState, // For NEET we treat state as location label
            gender: 'COED',
            cutoff_rank: cutoffRank,
            region: row['quota'] || '',
            category: neetCategory.label,
          });
        }
      } else if (examType === 'JEE Advanced') {
        // --- JEE Advanced specific logic (round-based columns) ---

        // Map request categories to JEE Advanced CSV columns (lowercase for normalized CSV)
        const jeeAdvancedCategoryConfig = {
          General: {
            label: 'General',
            columns: ['open round 1', 'open round 2', 'open round 3', 'open round 4', 'open round 5', 'open round 6'],
          },
          General_PwD: {
            label: 'General (PwD)',
            columns: ['open (pwd) round 1', 'open (pwd) round 2', 'open (pwd) round 3', 'open (pwd) round 4', 'open (pwd) round 5', 'open (pwd) round 6'],
          },
          EWS: {
            label: 'EWS',
            columns: ['ews round 1', 'ews round 2', 'ews round 3', 'ews round 4', 'ews round 5', 'ews round 6'],
          },
          EWS_PwD: {
            label: 'EWS (PwD)',
            columns: ['ews (pwd) round 1', 'ews (pwd) round 2', 'ews (pwd) round 3', 'ews (pwd) round 4', 'ews (pwd) round 5', 'ews (pwd) round 6'],
          },
          OBC: {
            label: 'OBC-NCL',
            columns: ['obc-ncl round 1', 'obc-ncl round 2', 'obc-ncl round 3', 'obc-ncl round 4', 'obc-ncl round 5', 'obc-ncl round 6'],
          },
          OBC_PwD: {
            label: 'OBC-NCL (PwD)',
            columns: ['obc-ncl (pwd) round 1', 'obc-ncl (pwd) round 2', 'obc-ncl (pwd) round 3', 'obc-ncl (pwd) round 4', 'obc-ncl (pwd) round 5', 'obc-ncl (pwd) round 6'],
          },
          SC: {
            label: 'SC',
            columns: ['sc round 1', 'sc round 2', 'sc round 3', 'sc round 4', 'sc round 5', 'sc round 6'],
          },
          SC_PwD: {
            label: 'SC (PwD)',
            columns: ['sc (pwd) round 1', 'sc (pwd) round 2', 'sc (pwd) round 3', 'sc (pwd) round 4', 'sc (pwd) round 5', 'sc (pwd) round 6'],
          },
          ST: {
            label: 'ST',
            columns: ['st round 1', 'st round 2', 'st round 3', 'st round 4', 'st round 5', 'st round 6'],
          },
          ST_PwD: {
            label: 'ST (PwD)',
            columns: ['st (pwd) round 1', 'st (pwd) round 2', 'st (pwd) round 3', 'st (pwd) round 4', 'st (pwd) round 5', 'st (pwd) round 6'],
          },
        };

        const jeeAdvancedCategory = jeeAdvancedCategoryConfig[category];
        if (!jeeAdvancedCategory) {
          return res.status(400).json({
            success: false,
            message: `Unsupported JEE Advanced category: ${category}. Supported categories: ${Object.keys(jeeAdvancedCategoryConfig).join(', ')}`,
          });
        }

        // Validate round selection (1-6)
        const selectedRound = round ? parseInt(round, 10) : null;
        if (selectedRound === null || selectedRound < 1 || selectedRound > 6) {
          return res.status(400).json({
            success: false,
            message: 'Round is required for JEE Advanced. Please select a round between 1 and 6.',
          });
        }

        // Get the specific round column for the selected category
        const roundColumn = jeeAdvancedCategory.columns[selectedRound - 1]; // Round 1 = index 0, Round 6 = index 5
        if (!roundColumn) {
          return res.status(400).json({
            success: false,
            message: `Invalid round ${selectedRound}. Round must be between 1 and 6.`,
          });
        }

        // Quick sanity check that the selected round column exists
        const rowExample = rows[0] || {};
        if (!Object.prototype.hasOwnProperty.call(rowExample, roundColumn)) {
          return res.status(400).json({
            success: false,
            message: `JEE Advanced CSV does not contain column "${roundColumn}" for category ${jeeAdvancedCategory.label}, round ${selectedRound}.`,
          });
        }

        // Map IIT names to their states for location filtering
        const iitToStateMap = {
          'Indian Institute of Technology (BHU) Varanasi': 'Uttar Pradesh',
          'Indian Institute of Technology Bhilai': 'Chhattisgarh',
          'Indian Institute of Technology Bhubaneswar': 'Odisha',
          'Indian Institute of Technology Bombay': 'Maharashtra',
          'Indian Institute of Technology Delhi': 'Delhi',
          'Indian Institute of Technology Dhanbad': 'Jharkhand',
          'Indian Institute of Technology Dharwad': 'Karnataka',
          'Indian Institute of Technology Gandhinagar': 'Gujarat',
          'Indian Institute of Technology Goa': 'Goa',
          'Indian Institute of Technology Guwahati': 'Assam',
          'Indian Institute of Technology Hyderabad': 'Telangana',
          'Indian Institute of Technology Indore': 'Madhya Pradesh',
          'Indian Institute of Technology Jammu': 'Jammu and Kashmir',
          'Indian Institute of Technology Jodhpur': 'Rajasthan',
          'Indian Institute of Technology Kanpur': 'Uttar Pradesh',
          'Indian Institute of Technology Kharagpur': 'West Bengal',
          'Indian Institute of Technology Madras': 'Tamil Nadu',
          'Indian Institute of Technology Mandi': 'Himachal Pradesh',
          'Indian Institute of Technology Palakkad': 'Kerala',
          'Indian Institute of Technology Patna': 'Bihar',
          'Indian Institute of Technology Roorkee': 'Uttarakhand',
          'Indian Institute of Technology Ropar': 'Punjab',
          'Indian Institute of Technology Tirupati': 'Andhra Pradesh',
          'Indian Institute of Technology (ISM) Dhanbad': 'Jharkhand',
        };

        // Helper function to get state from IIT name
        const getIITState = (instituteName) => {
          if (!instituteName) return null;
          const normalizedName = instituteName.toString().trim();
          return iitToStateMap[normalizedName] || null;
        };

        for (const row of rows) {
          // Location filtering - Extract state from IIT name and filter by selected states
          if (districtsInput.length > 0) {
            const instituteName = (row['institute name'] || '').toString().trim();
            const iitState = getIITState(instituteName);

            if (!iitState) {
              // If we can't determine state, skip this row
              continue;
            }

            // Check if IIT's state matches any of the selected states
            const stateMatches = districtsInput.some((selectedState) => {
              return districtMatches(iitState, selectedState);
            });

            if (!stateMatches) {
              continue; // Skip IITs not in selected states
            }
          }

          // Branch filtering
          if (preferredBranchesLower.length > 0) {
            const collegeBranch = (row['branch'] || '').toString().trim().toLowerCase();
            const branchMatch = preferredBranchesLower.some(
              (branch) =>
                collegeBranch.includes(branch) || branch.includes(collegeBranch)
            );
            if (!branchMatch) continue;
          }

          // Gender filtering – CSV values: "Gender-Neutral" or "Female-only (including Supernumerary)"
          const collegeGender = (row['gender'] || 'Gender-Neutral').toString().trim();
          const requestedGender = gender.toString().trim();
          if (requestedGender === 'Female-only') {
            // Only include Female-only rows
            if (!collegeGender.toLowerCase().includes('female')) continue;
          } else if (requestedGender === 'Gender-Neutral' || requestedGender === 'COED') {
            // Only include Gender-Neutral rows (excludes female-only supernumerary seats)
            if (collegeGender.toLowerCase().includes('female')) continue;
          }
          // If requestedGender is 'All', include both

          // Rank cutoff – use the closing rank from the selected round
          const raw = row[roundColumn];
          if (raw === '' || raw == null) {
            continue; // Skip if no data for this round
          }

          // Clean and parse the rank value
          let cleaned = raw.toString().replace(/,/g, '').trim();
          // Handle "P" suffix (PwD) - remove it for comparison
          cleaned = cleaned.replace(/P$/i, '').trim();

          const cutoffRank = Number(cleaned);

          // Skip if not a valid number
          if (!Number.isFinite(cutoffRank) || cutoffRank <= 0) {
            continue;
          }

          // Compare user's rank with the closing rank from selected round
          // Lower rank number = better rank, so user rank should be <= cutoff rank
          if (cutoffRank < numericRank) {
            continue; // User's rank is worse (higher number) than cutoff
          }

          const instituteName = (row['institute name'] || '').toString().trim();
          const iitState = getIITState(instituteName);

          filteredResults.push({
            college_name: instituteName,
            branch: row['branch'] || '',
            district: iitState || row['quota'] || '', // Use IIT state, fallback to quota
            state: iitState || '', // Explicit state field
            gender: collegeGender, // Use the actual CSV gender value
            cutoff_rank: cutoffRank,
            round: selectedRound, // Include which round was used
            region: row['quota'] || '',
            category: jeeAdvancedCategory.label,
          });
        }
      } else if (examType === 'JEE Main') {
        // --- JEE Main specific logic (round-based columns with Quota) ---

        // Complete institute → state mapping derived from actual CSV data
        const jeeMainInstituteStateMap = {
          // NITs
          'Dr. B R Ambedkar National Institute of Technology, Jalandhar': 'Punjab',
          'Indian Institute of Engineering Science and Technology, Shibpur': 'West Bengal',
          'Malaviya National Institute of Technology Jaipur': 'Rajasthan',
          'Maulana Azad National Institute of Technology Bhopal': 'Madhya Pradesh',
          'Motilal Nehru National Institute of Technology Allahabad': 'Uttar Pradesh',
          'National Institute of Technology Agartala': 'Tripura',
          'National Institute of Technology Arunachal Pradesh': 'Arunachal Pradesh',
          'National Institute of Technology Calicut': 'Kerala',
          'National Institute of Technology Delhi': 'Delhi',
          'National Institute of Technology Durgapur': 'West Bengal',
          'National Institute of Technology Goa': 'Goa',
          'National Institute of Technology Hamirpur': 'Himachal Pradesh',
          'National Institute of Technology Karnataka, Surathkal': 'Karnataka',
          'National Institute of Technology Meghalaya': 'Meghalaya',
          'National Institute of Technology Nagaland': 'Nagaland',
          'National Institute of Technology Patna': 'Bihar',
          'National Institute of Technology Puducherry': 'Puducherry',
          'National Institute of Technology Raipur': 'Chhattisgarh',
          'National Institute of Technology Sikkim': 'Sikkim',
          'National Institute of Technology, Andhra Pradesh': 'Andhra Pradesh',
          'National Institute of Technology, Jamshedpur': 'Jharkhand',
          'National Institute of Technology, Kurukshetra': 'Haryana',
          'National Institute of Technology, Manipur': 'Manipur',
          'National Institute of Technology, Mizoram': 'Mizoram',
          'National Institute of Technology, Rourkela': 'Odisha',
          'National Institute of Technology, Silchar': 'Assam',
          'National Institute of Technology, Srinagar': 'Jammu and Kashmir',
          'National Institute of Technology, Tiruchirappalli': 'Tamil Nadu',
          'National Institute of Technology, Uttarakhand': 'Uttarakhand',
          'National Institute of Technology, Warangal': 'Telangana',
          'Sardar Vallabhbhai National Institute of Technology, Surat': 'Gujarat',
          'Visvesvaraya National Institute of Technology, Nagpur': 'Maharashtra',
          // IIITs
          'Atal Bihari Vajpayee Indian Institute of Information Technology & Management Gwalior': 'Madhya Pradesh',
          'Indian Institute of Information Technology (IIIT) Nagpur': 'Maharashtra',
          'Indian Institute of Information Technology (IIIT) Pune': 'Maharashtra',
          'Indian Institute of Information Technology (IIIT) Ranchi': 'Jharkhand',
          'Indian Institute of Information Technology (IIIT), Sri City, Chittoor': 'Andhra Pradesh',
          'Indian Institute of Information Technology (IIIT)Kota, Rajasthan': 'Rajasthan',
          'Indian Institute of Information Technology Bhagalpur': 'Bihar',
          'Indian Institute of Information Technology Bhopal': 'Madhya Pradesh',
          'Indian Institute of Information Technology Design & Manufacturing Kurnool, Andhra Pradesh': 'Andhra Pradesh',
          'Indian Institute of Information Technology Guwahati': 'Assam',
          'Indian Institute of Information Technology Lucknow': 'Uttar Pradesh',
          'INDIAN INSTITUTE OF INFORMATION TECHNOLOGY SENAPATI MANIPUR': 'Manipur',
          'Indian Institute of Information Technology Surat': 'Gujarat',
          'Indian Institute of Information Technology Tiruchirappalli': 'Tamil Nadu',
          'Indian Institute of Information Technology(IIIT) Dharwad': 'Karnataka',
          'Indian Institute of Information Technology(IIIT) Kalyani, West Bengal': 'West Bengal',
          'Indian Institute of Information Technology(IIIT) Kilohrad, Sonepat, Haryana': 'Haryana',
          'Indian Institute of Information Technology(IIIT) Kottayam': 'Kerala',
          'Indian Institute of Information Technology(IIIT) Una, Himachal Pradesh': 'Himachal Pradesh',
          'Indian Institute of Information Technology(IIIT), Vadodara, Gujrat': 'Gujarat',
          'Indian Institute of Information Technology, Agartala': 'Tripura',
          'Indian Institute of Information Technology, Allahabad': 'Uttar Pradesh',
          'Indian Institute of Information Technology, Design & Manufacturing, Kancheepuram': 'Tamil Nadu',
          'Indian institute of information technology, Raichur, Karnataka': 'Karnataka',
          'Indian Institute of Information Technology, Vadodara International Campus Diu (IIITVICD)': 'Gujarat',
          'Pt. Dwarka Prasad Mishra Indian Institute of Information Technology, Design & Manufacture Jabalpur': 'Madhya Pradesh',
          // GFTIs
          'Assam University, Silchar': 'Assam',
          'Birla Institute of Technology, Deoghar Off-Campus': 'Jharkhand',
          'Birla Institute of Technology, Mesra, Ranchi': 'Jharkhand',
          'Birla Institute of Technology, Patna Off-Campus': 'Bihar',
          'Central institute of Technology Kokrajar, Assam': 'Assam',
          'Central University of Haryana': 'Haryana',
          'Central University of Jammu': 'Jammu and Kashmir',
          'Central University of Rajasthan, Rajasthan': 'Rajasthan',
          'Chhattisgarh Swami Vivekanada Technical University, Bhilai (CSVTU Bhilai)': 'Chhattisgarh',
          'CU Jharkhand': 'Jharkhand',
          'Gati Shakti Vishwavidyalaya, Vadodara': 'Gujarat',
          'Ghani Khan Choudhary Institute of Engineering and Technology, Malda, West Bengal': 'West Bengal',
          'Gurukula Kangri Vishwavidyalaya, Haridwar': 'Uttarakhand',
          'Indian Institute of Carpet Technology, Bhadohi': 'Uttar Pradesh',
          'Indian Institute of Handloom Technology(IIHT), Varanasi': 'Uttar Pradesh',
          'Indian Institute of Handloom Technology, Salem': 'Tamil Nadu',
          'Institute of Chemical Technology, Mumbai: Indian Oil Odisha Campus, Bhubaneswar': 'Odisha',
          'Institute of Engineering and Technology, Dr. H. S. Gour University. Sagar (A Central University)': 'Madhya Pradesh',
          'Institute of Infrastructure, Technology, Research and Management-Ahmedabad': 'Gujarat',
          'International Institute of Information Technology, Bhubaneswar': 'Odisha',
          'International Institute of Information Technology, Naya Raipur': 'Chhattisgarh',
          'Islamic University of Science and Technology Kashmir': 'Jammu and Kashmir',
          'J.K. Institute of Applied Physics & Technology, Department of Electronics & Communication, University of Allahabad- Allahabad': 'Uttar Pradesh',
          'Jawaharlal Nehru University, Delhi': 'Delhi',
          'Mizoram University, Aizawl': 'Mizoram',
          'National Institute of Advanced Manufacturing Technology, Ranchi': 'Jharkhand',
          'National Institute of Electronics and Information Technology, Ajmer (Rajasthan)': 'Rajasthan',
          'National Institute of Electronics and Information Technology, Aurangabad (Maharashtra)': 'Maharashtra',
          'National Institute of Electronics and Information Technology, Gorakhpur (UP)': 'Uttar Pradesh',
          'National Institute of Electronics and Information Technology, Patna (Bihar)': 'Bihar',
          'National Institute of Electronics and Information Technology, Ropar (Punjab)': 'Punjab',
          'National Institute of Food Technology Entrepreneurship and Management, Kundli': 'Haryana',
          'National Institute of Food Technology Entrepreneurship and Management, Thanjavur': 'Tamil Nadu',
          'North Eastern Regional Institute of Science and Technology, Nirjuli-791109 (Itanagar),Arunachal Pradesh': 'Arunachal Pradesh',
          'North-Eastern Hill University, Shillong': 'Meghalaya',
          'Puducherry Technological University, Puducherry': 'Puducherry',
          'Punjab Engineering College, Chandigarh': 'Chandigarh',
          'Rajiv Gandhi National Aviation University, Fursatganj, Amethi (UP)': 'Uttar Pradesh',
          'Sant Longowal Institute of Engineering and Technology': 'Punjab',
          'School of Engineering, Tezpur University, Napaam, Tezpur': 'Assam',
          'School of Planning & Architecture, Bhopal': 'Madhya Pradesh',
          'School of Planning & Architecture, New Delhi': 'Delhi',
          'School of Planning & Architecture: Vijayawada': 'Andhra Pradesh',
          'School of Studies of Engineering and Technology, Guru Ghasidas Vishwavidyalaya, Bilaspur': 'Chhattisgarh',
          'Shri G. S. Institute of Technology and Science Indore': 'Madhya Pradesh',
          'Shri Mata Vaishno Devi University, Katra, Jammu & Kashmir': 'Jammu and Kashmir',
          'University of Hyderabad': 'Telangana',
        };

        const getJEEMainInstituteState = (instituteName) => {
          if (!instituteName) return null;
          const name = instituteName.toString().trim();
          if (jeeMainInstituteStateMap[name]) return jeeMainInstituteStateMap[name];
          // Case-insensitive fallback
          const lower = name.toLowerCase();
          const found = Object.keys(jeeMainInstituteStateMap).find(k => k.toLowerCase() === lower);
          return found ? jeeMainInstituteStateMap[found] : null;
        };

        // Map request categories to JEE Main CSV columns (lowercase for normalized CSV)
        const jeeMainCategoryConfig = {
          General: {
            label: 'General',
            columns: ['open (crl) round 1', 'open (crl) round 2', 'open (crl) round 3', 'open (crl) round 4', 'open (crl) round 5', 'open (crl) round 6'],
          },
          General_PwD: {
            label: 'General (PwD)',
            columns: ['open (pwd) (crl) round 1', 'open (pwd) (crl) round 2', 'open (pwd) (crl) round 3', 'open (pwd) (crl) round 4', 'open (pwd) (crl) round 5', 'open (pwd) (crl) round 6'],
          },
          EWS: {
            label: 'EWS',
            columns: ['ews (category rank) round 1', 'ews (category rank) round 2', 'ews (category rank) round 3', 'ews (category rank) round 4', 'ews (category rank) round 5', 'ews (category rank) round 6'],
          },
          EWS_PwD: {
            label: 'EWS (PwD)',
            columns: ['ews (pwd) (category rank) round 1', 'ews (pwd) (category rank) round 2', 'ews (pwd) (category rank) round 3', 'ews (pwd) (category rank) round 4', 'ews (pwd) (category rank) round 5', 'ews (pwd) (category rank) round 6'],
          },
          OBC: {
            label: 'OBC-NCL',
            columns: ['obc-ncl (category rank) round 1', 'obc-ncl (category rank) round 2', 'obc-ncl (category rank) round 3', 'obc-ncl (category rank) round 4', 'obc-ncl (category rank) round 5', 'obc-ncl (category rank) round 6'],
          },
          OBC_PwD: {
            label: 'OBC-NCL (PwD)',
            columns: ['obc-ncl (pwd) (category rank) round 1', 'obc-ncl (pwd) (category rank) round 2', 'obc-ncl (pwd) (category rank) round 3', 'obc-ncl (pwd) (category rank) round 4', 'obc-ncl (pwd) (category rank) round 5', 'obc-ncl (pwd) (category rank) round 6'],
          },
          SC: {
            label: 'SC',
            columns: ['sc (category rank) round 1', 'sc (category rank) round 2', 'sc (category rank) round 3', 'sc (category rank) round 4', 'sc (category rank) round 5', 'sc (category rank) round 6'],
          },
          SC_PwD: {
            label: 'SC (PwD)',
            columns: ['sc (pwd) (category rank) round 1', 'sc (pwd) (category rank) round 2', 'sc (pwd) (category rank) round 3', 'sc (pwd) (category rank) round 4', 'sc (pwd) (category rank) round 5', 'sc (pwd) (category rank) round 6'],
          },
          ST: {
            label: 'ST',
            columns: ['st (category rank) round 1', 'st (category rank) round 2', 'st (category rank) round 3', 'st (category rank) round 4', 'st (category rank) round 5', 'st (category rank) round 6'],
          },
          ST_PwD: {
            label: 'ST (PwD)',
            columns: ['st (pwd) (category rank) round 1', 'st (pwd) (category rank) round 2', 'st (pwd) (category rank) round 3', 'st (pwd) (category rank) round 4', 'st (pwd) (category rank) round 5', 'st (pwd) (category rank) round 6'],
          },
        };

        const jeeMainCategory = jeeMainCategoryConfig[category];
        if (!jeeMainCategory) {
          return res.status(400).json({
            success: false,
            message: `Unsupported JEE Main category: ${category}. Supported categories: ${Object.keys(jeeMainCategoryConfig).join(', ')}`,
          });
        }

        // Validate round selection (1-6) - optional for JEE Main, default to Round 6 if not provided
        const selectedRound = round ? parseInt(round, 10) : 6;
        if (selectedRound < 1 || selectedRound > 6) {
          return res.status(400).json({
            success: false,
            message: 'Round must be between 1 and 6 for JEE Main.',
          });
        }

        // Get the specific round column for the selected category
        const roundColumn = jeeMainCategory.columns[selectedRound - 1]; // Round 1 = index 0, Round 6 = index 5
        if (!roundColumn) {
          return res.status(400).json({
            success: false,
            message: `Invalid round ${selectedRound}. Round must be between 1 and 6.`,
          });
        }

        // Resolve actual column key (CSV keys are normalized to lowercase; allow fuzzy match)
        const getRowKey = (row, desiredKey) => {
          if (Object.prototype.hasOwnProperty.call(row, desiredKey)) return desiredKey;
          const desired = desiredKey.toLowerCase().trim();
          return Object.keys(row).find((k) => k.toLowerCase().trim() === desired) || null;
        };
        const rowExample = rows[0] || {};
        const roundColumnKey = getRowKey(rowExample, roundColumn);
        if (!roundColumnKey) {
          return res.status(400).json({
            success: false,
            message: `JEE Main CSV does not contain column "${roundColumn}" for category ${jeeMainCategory.label}, round ${selectedRound}. Available: ${Object.keys(rowExample).slice(0, 10).join(', ')}...`,
          });
        }

        // Parse instituteGroups filter from request body (optional)
        const { instituteGroups = [] } = req.body;
        const instituteGroupsFilter = (Array.isArray(instituteGroups) ? instituteGroups : [])
          .map(g => g.toString().trim().toUpperCase())
          .filter(Boolean);

        for (const row of rows) {
          const instituteName = (row['institute'] || '').toString().trim();
          const instituteGroup = (row['institute_group'] || '').toString().trim().toUpperCase();

          // Institute group filter (NIT / IIIT / GFTI)
          if (instituteGroupsFilter.length > 0 && !instituteGroupsFilter.includes(instituteGroup)) {
            continue;
          }

          // Location filtering using the exact institute→state map
          if (districtsInput.length > 0) {
            const instituteState = getJEEMainInstituteState(instituteName);
            if (!instituteState) continue;
            const stateMatches = districtsInput.some((selectedState) =>
              districtMatches(instituteState, selectedState)
            );
            if (!stateMatches) continue;
          }

          // Branch filtering - use Academic Program Name
          if (preferredBranchesLower.length > 0) {
            const academicProgram = (row['academic program name'] || '').toString().trim().toLowerCase();
            const branchMatch = preferredBranchesLower.some(
              (branch) =>
                academicProgram.includes(branch) || branch.includes(academicProgram)
            );
            if (!branchMatch) continue;
          }

          // Gender filtering – CSV values: "Gender-Neutral" or "Female-only (including Supernumerary)"
          const collegeGender = (row['gender'] || 'Gender-Neutral').toString().trim();
          const requestedGender = gender.toString().trim();
          if (requestedGender === 'Female-only') {
            // Only include Female-only rows
            if (!collegeGender.toLowerCase().includes('female')) continue;
          } else if (requestedGender === 'Gender-Neutral' || requestedGender === 'COED') {
            // Only include Gender-Neutral rows (excludes female-only supernumerary seats)
            if (collegeGender.toLowerCase().includes('female')) continue;
          }
          // If requestedGender is 'All', include both

          // Rank cutoff – use the closing rank from the selected round
          const raw = row[roundColumnKey];
          if (raw === '' || raw == null || raw === undefined) {
            continue; // Skip if no data for this round
          }

          // Clean and parse the rank value
          let cleaned = raw.toString().replace(/,/g, '').trim();
          if (cleaned === '' || cleaned === 'null' || cleaned === 'undefined') {
            continue;
          }

          const cutoffRank = Number(cleaned);

          // Skip if not a valid number
          if (!Number.isFinite(cutoffRank) || cutoffRank <= 0) {
            continue;
          }

          // Compare user's rank with the closing rank from selected round
          // Lower rank number = better rank, so user rank should be <= cutoff rank
          if (cutoffRank < numericRank) {
            continue; // User's rank is worse (higher number) than cutoff
          }

          const instituteState = getJEEMainInstituteState(instituteName);
          const quota = (row['quota'] || '').toString().trim();

          filteredResults.push({
            college_name: instituteName,
            branch: row['academic program name'] || '',
            district: instituteState || quota || '',
            state: instituteState || '',
            gender: collegeGender,
            cutoff_rank: cutoffRank,
            round: selectedRound,
            region: quota || '',
            category: jeeMainCategory.label,
            institute_group: instituteGroup,
          });
        }
      } else {
        // --- Default AP / CSV category-column style logic ---

        // Map category column names to normalized categories (for UI / future use)
        const categoryColumnToNormalized = {
          OC_BOYS: 'General',
          OC_GIRLS: 'General',
          OC: 'General',
          SC_BOYS: 'SC',
          SC_GIRLS: 'SC',
          SC: 'SC',
          ST_BOYS: 'ST',
          ST_GIRLS: 'ST',
          ST: 'ST',
          BCA_BOYS: 'OBC',
          BCA_GIRLS: 'OBC',
          BCB_BOYS: 'OBC',
          BCB_GIRLS: 'OBC',
          BCC_BOYS: 'OBC',
          BCC_GIRLS: 'OBC',
          BCD_BOYS: 'OBC',
          BCD_GIRLS: 'OBC',
          BCE_BOYS: 'OBC',
          BCE_GIRLS: 'OBC',
          OC_EWS_BOYS: 'EWS',
          OC_EWS_GIRLS: 'EWS',
          EWS: 'EWS',
        };

        const normalizedCategory = categoryColumnToNormalized[category] || category;
        const categoryKey = category.toLowerCase();

        // Ensure the category column exists
        const hasCategoryColumn =
          rows.length > 0 && Object.prototype.hasOwnProperty.call(rows[0], categoryKey);
        if (!hasCategoryColumn) {
          return res.status(400).json({
            success: false,
            error: `Category column ${category} not found in data`,
          });
        }

        for (const row of rows) {
          // Location filtering
          if (districtsInput.length > 0) {
            // Enhanced check: any AP exam should use district filtering
            const isAPExam = examType.includes('AP EAPCET') || examType.includes('AP ECET');
            const locationField = isAPExam ? 'district' : 'state';
            const collegeLocation = (row[locationField] || '').toString().trim();
            
            if (!collegeLocation && isAPExam) {
                // If CSV doesn't have district but it's an AP exam, we might want to let it pass
                // OR check if it's in the districtsInput? 
                // For now, let's keep it strict if possible, but AP CSVs usually have District.
            }
            
            const matchesAnyLocation = districtsInput.some((loc) =>
              districtMatches(collegeLocation, loc)
            );
            if (!matchesAnyLocation) continue;
          }

          // Gender filtering
          const collegeGender = (row['gender'] || 'COED').toString().trim().toUpperCase();
          const requestedGender = gender.toString().trim().toUpperCase();
          if (
            requestedGender !== 'COED' &&
            !['COED', requestedGender].includes(collegeGender)
          ) {
            continue;
          }

          // Branch filtering
          if (preferredBranchesLower.length > 0) {
            const collegeBranch = (row['branch'] || '').toString().trim().toLowerCase();
            const branchMatch = preferredBranchesLower.some(
              (branch) =>
                collegeBranch.includes(branch) || branch.includes(collegeBranch)
            );
            if (!branchMatch) continue;
          }

          // Rank cutoff
          const rawCutoff = row[categoryKey];
          const cutoffRank = rawCutoff === '' || rawCutoff == null ? NaN : Number(rawCutoff);
          if (!Number.isFinite(cutoffRank) || cutoffRank < numericRank) {
            continue;
          }

          const collegeDistrict = (row['district'] || '').toString().trim();

          filteredResults.push({
            college_name: row['college_name'] || '',
            branch: row['branch'] || '',
            district: collegeDistrict,
            gender: collegeGender,
            cutoff_rank: cutoffRank,
            region: row['region'] || '',
            category: normalizedCategory,
          });
        }
      }

      // Sort by cutoff rank ascending
      filteredResults.sort((a, b) => a.cutoff_rank - b.cutoff_rank);

      // Group by district + branch (to mirror Python response)
      const grouped = {};
      for (const result of filteredResults) {
        const district = result.district;
        const branch = (result.branch || '').toString().toUpperCase().trim();
        const key = `${district}_${branch}`;

        if (!grouped[key]) {
          grouped[key] = {
            district,
            branch,
            colleges: [],
          };
        }

        grouped[key].colleges.push(result);
      }

      const resultsGrouped = Object.values(grouped).sort((a, b) => {
        if (a.district !== b.district) {
          return a.district.localeCompare(b.district);
        }
        return a.branch.localeCompare(b.branch);
      });

      // Flat predictions array (same structure as Python)
      const predictions = [];
      for (const group of resultsGrouped) {
        for (const college of group.colleges) {
          predictions.push({
            name: college.college_name,
            branch: college.branch,
            district: college.district,
            cutoffRank: college.cutoff_rank,
            gender: college.gender,
            category: college.category,
          });
        }
      }

      // Load college mapping
      let mapping = {};
      try {
        const mappingPath = path.join(process.cwd(), 'college_mapping.json');
        if (fs.existsSync(mappingPath)) {
          mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
          console.log(`Loaded mapping with ${Object.keys(mapping).length} entries`);
        }
      } catch (err) {
        console.error('Error loading dynamic college mapping:', err);
      }

      // Enhance predictions with college details from database
      const enhancedPredictions = [];
      for (const pred of predictions) {
        const csvNameLower = pred.name.toLowerCase().trim();
        const mappedAdminName = mapping[csvNameLower];
        
        let college = null;
        
        // 1. Try finding by exactly matching the Admin name (bypass District check for safety)
        if (mappedAdminName) {
           college = await College.findOne({ name: mappedAdminName }).lean();
           
           if (!college) {
             college = await College.findOne({ 
               name: { $regex: new RegExp('^' + mappedAdminName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } 
             }).lean();
           }
        }
        
        // 2. Fallback: try finding by raw CSV name and district (original logic)
        if (!college) {
          college = await College.findOne({
            name: { $regex: new RegExp(pred.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
            'location.district': { $regex: new RegExp(pred.district.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
          }).lean();
        }
        
        // 3. Absolute fallback: Just try finding by raw CSV name without district
        if (!college) {
          college = await College.findOne({
            name: { $regex: new RegExp(pred.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
          }).lean();
        }

        // Calculate admission probability
        const rankDiff = pred.cutoffRank - numericRank;
        const percentDiff = (rankDiff / pred.cutoffRank) * 100;
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

        enhancedPredictions.push({
          ...pred,
          name: mappedAdminName || college?.name || pred.name,
          _id: college?._id,
          collegeId: college?._id,
          location: college?.location || { city: '', state: '', district: pred.district },

          imageUrl: college?.imageUrl,
          collegeType: college?.collegeType,
          rankings: college?.rankings,
          fees: college?.fees,
          placements: college?.placements,
          admissionProbability,
          probability,
          predictedCutoff: Math.round(pred.cutoffRank * 0.95),
        });
      }

      // Calculate summary statistics
      const summary = {
        totalColleges: enhancedPredictions.length,
        highProbability: enhancedPredictions.filter(p => p.probability === 'high').length,
        moderateProbability: enhancedPredictions.filter(p => p.probability === 'medium').length,
        lowProbability: enhancedPredictions.filter(p => p.probability === 'low').length,
      };

      // Save prediction results to database (user-specific)
      const predictionResult = await PredictionResult.create({
        user: req.user._id,
        predictionParams: {
          examType,
          rank: numericRank,
          category,
          gender,
          districts: districtsInput,
          preferredBranches,
        },
        predictions: enhancedPredictions.map(p => ({
          collegeId: p.collegeId,
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
          imageUrl: p.imageUrl,
        })),
        summary,
      });

      // Update the user's totalPredictions statistic
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 'statistics.totalPredictions': 1 }
      });

      return res.json({
        success: true,
        count: enhancedPredictions.length,
        predictions: enhancedPredictions,
        resultsGrouped,
        predictionResultId: predictionResult._id,
      });
    } catch (error) {
      console.error('Prediction service error (Node CSV):', error);
      const status = error.statusCode || 500;
      return res.status(status).json({
        success: false,
        message: error.message || 'Server error during prediction',
        availableTypes: error.availableTypes,
      });
    }
  }
);

// @route   GET /api/prediction/branches/:examType
// @desc    Get available branches for an exam type (optionally filtered by location)
// @access  Private
router.get('/branches/:examType', protect, async (req, res) => {
  try {
    const { examType } = req.params;
    // Optional query parameters for location filtering
    const locations = req.query.locations ?
      (Array.isArray(req.query.locations) ? req.query.locations : [req.query.locations]) :
      [];

    const { rows } = await loadExamRows(examType);
    if (!rows || rows.length === 0) {
      return res.json({
        success: true,
        branches: [],
      });
    }

    // Check for branch column - JEE Main uses 'academic program name', others use 'branch' or 'course'
    // Note: parseCsvContent normalizes all keys to lowercase, so check lowercase versions
    const isJEEMain = examType === 'JEE Main';
    const sampleRow = rows[0];
    const rowKeys = Object.keys(sampleRow);

    // Debug: log available columns for JEE Main
    if (isJEEMain) {
      console.log(`[Branches API] JEE Main - Available columns: ${rowKeys.slice(0, 15).join(', ')}`);
    }

    // Check for normalized column names (lowercase)
    // JEE Main CSV has "Academic Program Name" which normalizes to "academic program name"
    // Try multiple variations in case normalization differs
    const hasBranchColumn = rowKeys.includes('branch');
    const hasCourseColumn = rowKeys.includes('course');
    const hasAcademicProgramName = rowKeys.includes('academic program name');
    // Also check for variations (in case of extra spaces or different normalization)
    const hasAcademicProgramNameAlt = rowKeys.some(k =>
      k.includes('academic') && k.includes('program') && k.includes('name')
    );

    let columnName = null;
    if (isJEEMain) {
      if (hasAcademicProgramName) {
        columnName = 'academic program name';
      } else if (hasAcademicProgramNameAlt) {
        // Find the actual key that matches
        columnName = rowKeys.find(k => k.includes('academic') && k.includes('program') && k.includes('name'));
      }
    }

    if (!columnName) {
      if (hasBranchColumn) {
        columnName = 'branch';
      } else if (hasCourseColumn) {
        columnName = 'course';
      }
    }

    if (!columnName) {
      console.error(`[Branches API] ${examType} - Branch column not found. Available columns:`, rowKeys);
      return res.status(400).json({
        success: false,
        error: `Branch column not found in CSV data. For JEE Main, expected 'academic program name'. For others, expected 'branch' or 'course'. Available columns: ${rowKeys.slice(0, 15).join(', ')}...`,
      });
    }

    console.log(`[Branches API] ${examType} - Using column: "${columnName}"`);

    // For JEE Advanced, filter by IIT state if locations are provided
    const isJEEAdvanced = examType === 'JEE Advanced';
    let iitToStateMap = {};
    let getIITState = null;

    if (isJEEAdvanced && locations.length > 0) {
      // Use the same IIT-to-state mapping as in prediction logic
      iitToStateMap = {
        'Indian Institute of Technology (BHU) Varanasi': 'Uttar Pradesh',
        'Indian Institute of Technology Bhilai': 'Chhattisgarh',
        'Indian Institute of Technology Bhubaneswar': 'Odisha',
        'Indian Institute of Technology Bombay': 'Maharashtra',
        'Indian Institute of Technology Delhi': 'Delhi',
        'Indian Institute of Technology Dhanbad': 'Jharkhand',
        'Indian Institute of Technology Dharwad': 'Karnataka',
        'Indian Institute of Technology Gandhinagar': 'Gujarat',
        'Indian Institute of Technology Goa': 'Goa',
        'Indian Institute of Technology Guwahati': 'Assam',
        'Indian Institute of Technology Hyderabad': 'Telangana',
        'Indian Institute of Technology Indore': 'Madhya Pradesh',
        'Indian Institute of Technology Jammu': 'Jammu and Kashmir',
        'Indian Institute of Technology Jodhpur': 'Rajasthan',
        'Indian Institute of Technology Kanpur': 'Uttar Pradesh',
        'Indian Institute of Technology Kharagpur': 'West Bengal',
        'Indian Institute of Technology Madras': 'Tamil Nadu',
        'Indian Institute of Technology Mandi': 'Himachal Pradesh',
        'Indian Institute of Technology Palakkad': 'Kerala',
        'Indian Institute of Technology Patna': 'Bihar',
        'Indian Institute of Technology Roorkee': 'Uttarakhand',
        'Indian Institute of Technology Ropar': 'Punjab',
        'Indian Institute of Technology Tirupati': 'Andhra Pradesh',
        'Indian Institute of Technology (ISM) Dhanbad': 'Jharkhand',
      };

      getIITState = (instituteName) => {
        if (!instituteName) return null;
        const normalizedName = instituteName.toString().trim();
        return iitToStateMap[normalizedName] || null;
      };
    }

    const branchesSet = new Set();
    for (const row of rows) {
      // Location filtering for JEE Advanced
      if (isJEEAdvanced && locations.length > 0 && getIITState) {
        const instituteName = (row['institute name'] || '').toString().trim();
        const iitState = getIITState(instituteName);

        if (!iitState) {
          continue; // Skip if we can't determine state
        }

        // Check if IIT's state matches any of the selected locations
        const stateMatches = locations.some((selectedLocation) => {
          return districtMatches(iitState, selectedLocation);
        });

        if (!stateMatches) {
          continue; // Skip IITs not in selected states
        }
      }

      const branch = (row[columnName] || '').toString().trim();
      if (branch) {
        branchesSet.add(branch);
      }
    }

    const branches = Array.from(branchesSet).sort();

    return res.json({
      success: true,
      branches,
    });
  } catch (error) {
    console.error('Error fetching branches (Node CSV):', error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Server error',
      availableTypes: error.availableTypes,
    });
  }
});

// @route   GET /api/prediction/locations/:examType
// @desc    Get available locations (districts for AP exams, states for others) for an exam type
// @access  Private
router.get('/locations/:examType', protect, async (req, res) => {
  try {
    const { examType } = req.params;

    // Use static lists based on exam type
    const locationOptions = getLocationOptions(examType);
    const locations = locationOptions.map(opt => opt.value);

    res.json({
      success: true,
      locations: locations,
      locationType: isDistrictBasedExam(examType) ? 'district' : 'state',
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   GET /api/prediction/categories/:examType
// @desc    Get available categories for an exam type
// @access  Private
router.get('/categories/:examType', protect, async (req, res) => {
  try {
    const { examType } = req.params;

    let categories;

    if (examType === 'NEET') {
      // NEET uses Open/OBC/SC/ST/EWS with optional PwD variants,
      // which map to the NEET_* columns in the 2025 master CSV.
      categories = [
        { value: 'Open', label: 'Open (UR)', description: 'Unreserved category' },
        { value: 'Open_PwD', label: 'Open (UR) – PwD', description: 'Unreserved Persons with Disability' },
        { value: 'OBC', label: 'OBC', description: 'Other Backward Classes (Non-Creamy Layer)' },
        { value: 'OBC_PwD', label: 'OBC – PwD', description: 'OBC Persons with Disability' },
        { value: 'SC', label: 'SC', description: 'Scheduled Castes' },
        { value: 'SC_PwD', label: 'SC – PwD', description: 'SC Persons with Disability' },
        { value: 'ST', label: 'ST', description: 'Scheduled Tribes' },
        { value: 'ST_PwD', label: 'ST – PwD', description: 'ST Persons with Disability' },
        { value: 'EWS', label: 'EWS', description: 'Economically Weaker Section' },
        { value: 'EWS_PwD', label: 'EWS – PwD', description: 'EWS Persons with Disability' },
      ];
    } else if (examType === 'JEE Advanced') {
      // JEE Advanced uses General/EWS/OBC/SC/ST categories with PwD variants
      categories = [
        { value: 'General', label: 'General (OPEN)', description: 'Open / Unreserved category' },
        { value: 'General_PwD', label: 'General – PwD', description: 'Open category – Persons with Disability' },
        { value: 'EWS', label: 'EWS', description: 'Economically Weaker Section' },
        { value: 'EWS_PwD', label: 'EWS – PwD', description: 'EWS – Persons with Disability' },
        { value: 'OBC', label: 'OBC-NCL', description: 'Other Backward Classes – Non-Creamy Layer' },
        { value: 'OBC_PwD', label: 'OBC-NCL – PwD', description: 'OBC-NCL – Persons with Disability' },
        { value: 'SC', label: 'SC', description: 'Scheduled Castes' },
        { value: 'SC_PwD', label: 'SC – PwD', description: 'SC – Persons with Disability' },
        { value: 'ST', label: 'ST', description: 'Scheduled Tribes' },
        { value: 'ST_PwD', label: 'ST – PwD', description: 'ST – Persons with Disability' },
      ];
    } else if (examType === 'JEE Main') {
      categories = [
        { value: 'General', label: 'General (OPEN)', description: 'Open / Unreserved category (CRL rank)' },
        { value: 'General_PwD', label: 'General – PwD', description: 'Open category – Persons with Disability' },
        { value: 'EWS', label: 'EWS', description: 'Economically Weaker Section (category rank)' },
        { value: 'EWS_PwD', label: 'EWS – PwD', description: 'EWS – Persons with Disability' },
        { value: 'OBC', label: 'OBC-NCL', description: 'Other Backward Classes – Non-Creamy Layer (category rank)' },
        { value: 'OBC_PwD', label: 'OBC-NCL – PwD', description: 'OBC-NCL – Persons with Disability' },
        { value: 'SC', label: 'SC', description: 'Scheduled Castes (category rank)' },
        { value: 'SC_PwD', label: 'SC – PwD', description: 'SC – Persons with Disability' },
        { value: 'ST', label: 'ST', description: 'Scheduled Tribes (category rank)' },
        { value: 'ST_PwD', label: 'ST – PwD', description: 'ST – Persons with Disability' },
      ];
    } else {
      // Default AP EAPCET-style category columns
      categories = [
        { value: 'OC_BOYS', label: 'OC Boys' },
        { value: 'OC_GIRLS', label: 'OC Girls' },
        { value: 'SC_BOYS', label: 'SC Boys' },
        { value: 'SC_GIRLS', label: 'SC Girls' },
        { value: 'ST_BOYS', label: 'ST Boys' },
        { value: 'ST_GIRLS', label: 'ST Girls' },
        { value: 'BCA_BOYS', label: 'BCA Boys' },
        { value: 'BCA_GIRLS', label: 'BCA Girls' },
        { value: 'BCB_BOYS', label: 'BCB Boys' },
        { value: 'BCB_GIRLS', label: 'BCB Girls' },
        { value: 'BCC_BOYS', label: 'BCC Boys' },
        { value: 'BCC_GIRLS', label: 'BCC Girls' },
        { value: 'BCD_BOYS', label: 'BCD Boys' },
        { value: 'BCD_GIRLS', label: 'BCD Girls' },
        { value: 'BCE_BOYS', label: 'BCE Boys' },
        { value: 'BCE_GIRLS', label: 'BCE Girls' },
        { value: 'OC_EWS_BOYS', label: 'OC EWS Boys' },
        { value: 'OC_EWS_GIRLS', label: 'OC EWS Girls' },
      ];
    }

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error('Error fetching categories (Node):', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   GET /api/prediction/csv/:examType
// @desc    Get CSV data for an exam type (used by Python service)
// @access  Public (for Python service internal use)
router.get('/csv/:examType', async (req, res) => {
  try {
    const { examType } = req.params;

    // URL decode the exam type (handles spaces like "AP EAPCET")
    const decodedExamType = decodeURIComponent(examType);
    console.log(`Fetching CSV for exam type: "${decodedExamType}"`);

    // Find active CSV data for this exam type
    const csvData = await CSVData.findOne({
      examType: decodedExamType,
      isActive: true,
    }).sort({ uploadedAt: -1 }); // Get most recent

    if (!csvData) {
      console.log(`No CSV data found for exam type: "${decodedExamType}"`);
      // Also check what exam types exist in DB for debugging
      const availableTypes = await CSVData.distinct('examType', { isActive: true });
      console.log(`Available exam types in DB: ${availableTypes.join(', ')}`);

      return res.status(404).json({
        success: false,
        message: `No CSV data found for exam type: ${decodedExamType}. Please upload CSV file first.`,
        availableTypes: availableTypes,
      });
    }

    console.log(`Found CSV data: ${csvData.filename}, ${csvData.csvContent.length} chars, uploaded at ${csvData.uploadedAt}`);

    res.json({
      success: true,
      examType: csvData.examType,
      filename: csvData.filename,
      csvContent: csvData.csvContent,
      headers: csvData.headers,
      uploadedAt: csvData.uploadedAt,
    });
  } catch (error) {
    console.error('Error fetching CSV data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   GET /api/prediction/colleges
// @desc    Get all colleges (public endpoint for students)
// @access  Private
router.get('/colleges', protect, async (req, res) => {
  try {
    console.log("Frontend requested colleges with params:", req.query);
    const page = parseInt(req.query.page) || 1;
    // If the frontend requests 1000 colleges (like for bookmarks page), give them all (up to 5000) so no colleges are missing
    const limit = (req.query.limit == '1000' || req.query.limit == 1000) ? 5000 : (parseInt(req.query.limit) || 100);
    const skip = (page - 1) * (req.query.limit == '1000' ? 1000 : limit); // keep skip math consistent if they somehow page it

    const query = { isActive: true };

    // Filter by exam type
    if (req.query.examType && req.query.examType.trim()) {
      const decodedExam = decodeURIComponent(req.query.examType.trim());
      query.examTypes = { $in: [decodedExam] };
    }

    // Search filter
    if (req.query.search && req.query.search.trim()) {
      const searchTerm = req.query.search.trim();
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { code: { $regex: searchTerm, $options: 'i' } },
        { 'location.city': { $regex: searchTerm, $options: 'i' } },
        { 'location.state': { $regex: searchTerm, $options: 'i' } },
        { 'location.district': { $regex: searchTerm, $options: 'i' } },
      ];
    }

    // Filter by college type
    if (req.query.collegeType && req.query.collegeType.trim()) {
      query.collegeType = req.query.collegeType.trim();
    }

    // Filter by location - search in BOTH state and city (handles "Mumbai" as city or "Maharashtra" as state)
    if (req.query.state && req.query.state.trim()) {
      const locTerm = req.query.state.trim();
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { 'location.state': { $regex: locTerm, $options: 'i' } },
          { 'location.city': { $regex: locTerm, $options: 'i' } },
          { 'location.district': { $regex: locTerm, $options: 'i' } },
        ],
      });
    }

    // Filter by city (explicit city param takes precedence for city-only search)
    if (req.query.city && req.query.city.trim() && !req.query.state) {
      query['location.city'] = { $regex: req.query.city.trim(), $options: 'i' };
    }

    const colleges = await College.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 })
      .lean();

    const total = await College.countDocuments(query);
    console.log(`Backend returning ${colleges.length} colleges for query`, JSON.stringify(query));

    res.json({
      success: true,
      colleges,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching colleges:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   GET /api/prediction/colleges/:id
// @desc    Get full college details by ID
// @access  Public (college details can be viewed without authentication)
router.get('/colleges/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'College ID is required',
      });
    }

    let college = null;

    // Check if ID is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      college = await College.findById(id).lean();
    } else {
      // If not a valid ObjectId, return error with helpful message
      return res.status(400).json({
        success: false,
        message: 'Invalid college ID format. Expected MongoDB ObjectId.',
      });
    }

    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found',
      });
    }

    res.json({
      success: true,
      college,
    });
  } catch (error) {
    console.error('Error fetching college details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   GET /api/prediction/results
// @desc    Get all prediction results for the current user
// @access  Private
router.get('/results', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const predictionResults = await PredictionResult.find({
      user: req.user._id,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await PredictionResult.countDocuments({
      user: req.user._id,
      isActive: true,
    });

    res.json({
      success: true,
      predictionResults,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching prediction results:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   GET /api/prediction/results/:id
// @desc    Get a specific prediction result by ID (user-specific)
// @access  Private
router.get('/results/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid prediction result ID',
      });
    }

    const query = {
      _id: id,
      isActive: true,
    };

    // If user is not admin, only allow access to their own results
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    const predictionResult = await PredictionResult.findOne(query).lean();

    if (!predictionResult) {
      return res.status(404).json({
        success: false,
        message: 'Prediction result not found',
      });
    }

    res.json({
      success: true,
      predictionResult,
    });
  } catch (error) {
    console.error('Error fetching prediction result:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   DELETE /api/prediction/results/:id
// @desc    Delete a prediction result (soft delete)
// @access  Private
router.delete('/results/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid prediction result ID',
      });
    }

    const predictionResult = await PredictionResult.findOneAndUpdate(
      {
        _id: id,
        user: req.user._id, // Ensure user can only delete their own results
      },
      { isActive: false },
      { new: true }
    );

    if (!predictionResult) {
      return res.status(404).json({
        success: false,
        message: 'Prediction result not found',
      });
    }

    res.json({
      success: true,
      message: 'Prediction result deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting prediction result:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   POST /api/prediction/results/send-email
// @desc    Send prediction results to email
// @access  Private
router.post('/results/send-email', protect, async (req, res) => {
  try {
    const { email, predictionId } = req.body;

    if (!email || !predictionId) {
      return res.status(400).json({
        success: false,
        message: 'Email and prediction ID are required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(predictionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid prediction result ID',
      });
    }

    const predictionResult = await PredictionResult.findOne({
      _id: predictionId,
      user: req.user._id,
      isActive: true,
    }).lean();

    if (!predictionResult) {
      return res.status(404).json({
        success: false,
        message: 'Prediction result not found',
      });
    }

    const emailResult = await sendPredictionEmail(email, predictionResult);

    res.json({
      success: true,
      message: 'Email sent successfully',
      previewUrl: emailResult.previewUrl,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message,
    });
  }
});

// @route   POST /api/prediction/colleges/details
// @desc    Get full college details by names (for explore page/bookmarks)
// @access  Public
router.post('/colleges/details', async (req, res) => {
  try {
    const { collegeNames } = req.body;

    if (!collegeNames || !Array.isArray(collegeNames) || collegeNames.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'College names array is required',
      });
    }

    // Load mapping for better matching
    let mapping = {};
    try {
      const mappingPath = path.join(process.cwd(), 'college_mapping.json');
      if (fs.existsSync(mappingPath)) {
        mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
      }
    } catch (err) {}

    // Find colleges by name (using mapping first, then regex)
    const searchTerms = [...new Set(collegeNames.flatMap(name => {
      const variants = [name];
      const nameLower = name.toLowerCase().trim();
      if (mapping[nameLower]) {
        variants.push(mapping[nameLower]);
      }
      if (name.includes(',')) {
        variants.push(name.split(',')[0].trim());
      }
      return variants;
    }))];

    const colleges = await College.find({
      $or: searchTerms.map(name => ({
        name: { $regex: name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
      })),
      isActive: true,
    }).lean();

    // Create a map for quick lookup with normalization for better matching
    const normalize = (str) => {
      if (!str) return '';
      return str.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
    };

    const collegeMap = {};
    colleges.forEach(college => {
      const normalizedCollegeName = normalize(college.name);
      const normalizedShortName = normalize(college.shortName);

      // Try to find the best matched name from collegeNames
      const matchedName = collegeNames.find(name => {
        const normalizedInput = normalize(name);
        // Match if one includes the other in normalized form
        return normalizedInput.includes(normalizedCollegeName) ||
          normalizedCollegeName.includes(normalizedInput) ||
          (normalizedShortName && normalizedInput.includes(normalizedShortName));
      });

      if (matchedName) {
        // If we already have a match, prefer the one with more details or exact match
        if (!collegeMap[matchedName] || college.isActive) {
          collegeMap[matchedName] = college;
        }
      }
    });

    res.json({
      success: true,
      colleges: collegeMap,
      found: colleges.length,
    });
  } catch (error) {
    console.error('Error fetching college details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

export default router;
