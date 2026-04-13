import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';
import XLSX from 'xlsx';
import mongoose from 'mongoose';
import CSVData from '../models/CSVData.js';
import College from '../models/College.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { parseCSVRow, getDetectedColumns } from '../utils/csvParser.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const allowedExtensions = ['.csv', '.xls', '.xlsx'];
    
    if (
      allowedMimes.includes(file.mimetype) || 
      allowedExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext))
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files (.csv, .xls, .xlsx) are allowed'), false);
    }
  },
});

// Apply auth middleware to all routes
router.use(protect);
router.use(adminOnly);

// @route   POST /api/admin/colleges/upload
// @desc    Upload and import colleges from CSV
// @access  Private (Admin only)
router.post('/colleges/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Get exam type from query parameter - REQUIRED
    const examTypeFromQuery = req.query.examType;
    if (!examTypeFromQuery) {
      return res.status(400).json({
        success: false,
        message: 'Exam type is required as query parameter (?examType=AP EAPCET)',
      });
    }
    
    // Valid exam types
    const validExamTypes = ['AP EAPCET', 'AP ECET', 'NEET', 'JEE Main', 'JEE Advanced'];
    if (!validExamTypes.includes(examTypeFromQuery)) {
      return res.status(400).json({
        success: false,
        message: `Invalid exam type. Must be one of: ${validExamTypes.join(', ')}`,
      });
    }

    try {
      let csvContent, headers;
      const isExcel = req.file.originalname.toLowerCase().endsWith('.xlsx') || 
                      req.file.originalname.toLowerCase().endsWith('.xls');
      
      if (isExcel) {
        // Handle Excel file
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0]; // Use first sheet
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to CSV format for processing
        csvContent = XLSX.utils.sheet_to_csv(worksheet);
        
        // Extract headers from first line
        const firstLine = csvContent.split('\n')[0];
        headers = firstLine.split(',').map(h => h.trim().replace(/"/g, ''));
      } else {
        // Handle CSV file
        csvContent = req.file.buffer.toString('utf-8');
        
        // Extract headers from first line
        const firstLine = csvContent.split('\n')[0];
        headers = firstLine.split(',').map(h => h.trim().replace(/"/g, ''));
      }
      
      // Deactivate previous CSV data for this exam type
      await CSVData.updateMany(
        { examType: examTypeFromQuery, isActive: true },
        { isActive: false }
      );
      
      // Save file to MongoDB
      const csvData = await CSVData.create({
        examType: examTypeFromQuery,
        filename: req.file.originalname,
        csvContent: csvContent,
        headers: headers,
        uploadedBy: req.user._id,
        fileSize: req.file.size,
        isActive: true,
      });

      // Parse and create/update colleges
      const parseResults = await parseAndImportColleges(csvContent, headers, examTypeFromQuery, req.user._id);
      
      // Get detected columns for display
      const detectedColumns = getDetectedColumns(headers);

      res.json({
        success: true,
        message: `CSV file uploaded and processed successfully for ${examTypeFromQuery}`,
        data: {
          id: csvData._id,
          examType: csvData.examType,
          filename: csvData.filename,
          fileSize: csvData.fileSize,
          uploadedAt: csvData.uploadedAt,
          headers: csvData.headers,
        },
        results: parseResults.colleges,
        totalRows: parseResults.totalRows,
        created: parseResults.created,
        updated: parseResults.updated,
        errors: parseResults.errors,
        detectedColumns: detectedColumns,
      });
    } catch (error) {
      console.error('Error saving CSV file:', error);
      res.status(500).json({
        success: false,
        message: 'Error saving CSV file',
        error: error.message,
      });
    }
  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during CSV upload',
      error: error.message,
    });
  }
});

// @route   GET /api/admin/stats/jee-main
// @desc    Get statistics for JEE Main colleges
// @access  Private (Admin only)
router.get('/stats/jee-main', async (req, res) => {
  try {
    // Find all colleges that have JEE Main in examTypes or cutoffs
    const collegesWithJEEMain = await College.find({
      $or: [
        { examTypes: 'JEE Main' },
        { 'cutoffs.examType': 'JEE Main' }
      ],
      isActive: true
    }).select('name examTypes cutoffs location code').lean();

    // Get unique college names
    const uniqueNames = [...new Set(collegesWithJEEMain.map(c => c.name))];

    // Check for duplicates
    const nameCounts = {};
    collegesWithJEEMain.forEach(college => {
      nameCounts[college.name] = (nameCounts[college.name] || 0) + 1;
    });

    const duplicates = Object.entries(nameCounts)
      .filter(([name, count]) => count > 1)
      .map(([name, count]) => ({ name, count }));

    // Group by state
    const byState = {};
    collegesWithJEEMain.forEach(college => {
      const state = college.location?.state || 'Unknown';
      if (!byState[state]) byState[state] = [];
      byState[state].push(college.name);
    });

    const stateStats = Object.entries(byState).map(([state, names]) => ({
      state,
      total: names.length,
      unique: [...new Set(names)].length
    }));

    // Check for suspicious names (might be branch names)
    const suspicious = uniqueNames.filter(name => {
      const lower = name.toLowerCase();
      return lower.includes('engineering') && 
             (lower.includes('bachelor') || lower.includes('master') || lower.includes('technology'));
    });

    res.json({
      success: true,
      stats: {
        totalColleges: collegesWithJEEMain.length,
        uniqueCollegeNames: uniqueNames.length,
        duplicates: duplicates.length,
        duplicateDetails: duplicates.slice(0, 20), // First 20 duplicates
        suspiciousNames: suspicious.slice(0, 20), // First 20 suspicious
        byState: stateStats,
        sampleColleges: uniqueNames.slice(0, 30)
      }
    });
  } catch (error) {
    console.error('Error fetching JEE Main stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   POST /api/admin/colleges/clear-exam-data
// @desc    Remove all exam data from database (examTypes + cutoffs). Deletes colleges that end up with no exam types.
// @access  Private (Admin only)
router.post('/colleges/clear-exam-data', async (req, res) => {
  try {
    const { examType } = req.body;
    
    if (!examType) {
      return res.status(400).json({
        success: false,
        message: 'Exam type is required'
      });
    }

    // Validate exam type
    const validExamTypes = ['AP EAPCET', 'AP ECET', 'NEET', 'JEE Main', 'JEE Advanced'];
    if (!validExamTypes.includes(examType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid exam type. Must be one of: ${validExamTypes.join(', ')}`
      });
    }

    const colleges = await College.find({
      $or: [
        { examTypes: examType },
        { 'cutoffs.examType': examType }
      ],
      isActive: true
    });

    let updated = 0;
    let deleted = 0;

    for (const college of colleges) {
      const newExamTypes = (college.examTypes || []).filter(et => et !== examType);
      const newCutoffs = (college.cutoffs || []).filter(c => c.examType !== examType);

      if (newExamTypes.length === 0) {
        await College.findByIdAndUpdate(college._id, { isActive: false, lastUpdatedBy: req.user._id });
        deleted++;
      } else {
        college.examTypes = newExamTypes;
        college.cutoffs = newCutoffs;
        college.lastUpdatedBy = req.user._id;
        await college.save();
        updated++;
      }
    }

    // Deactivate exam type CSVData so next upload is treated as fresh
    await CSVData.updateMany(
      { examType: examType, isActive: true },
      { isActive: false }
    );

    res.json({
      success: true,
      message: `${examType} data cleared successfully`,
      updated,
      deleted,
      totalProcessed: colleges.length,
    });
  } catch (error) {
    console.error(`Error clearing ${req.body?.examType} data:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   POST /api/admin/colleges/clear-jee-main
// @desc    Remove all JEE Main data from database (examTypes + cutoffs). Deletes colleges that end up with no exam types.
// @access  Private (Admin only)
router.post('/colleges/clear-jee-main', async (req, res) => {
  try {
    const colleges = await College.find({
      $or: [
        { examTypes: 'JEE Main' },
        { 'cutoffs.examType': 'JEE Main' }
      ],
      isActive: true
    });

    let updated = 0;
    let deleted = 0;

    for (const college of colleges) {
      const newExamTypes = (college.examTypes || []).filter(et => et !== 'JEE Main');
      const newCutoffs = (college.cutoffs || []).filter(c => c.examType !== 'JEE Main');

      if (newExamTypes.length === 0) {
        await College.findByIdAndUpdate(college._id, { isActive: false, lastUpdatedBy: req.user._id });
        deleted++;
      } else {
        college.examTypes = newExamTypes;
        college.cutoffs = newCutoffs;
        college.lastUpdatedBy = req.user._id;
        await college.save();
        updated++;
      }
    }

    // Deactivate JEE Main CSVData so next upload is treated as fresh
    await CSVData.updateMany(
      { examType: 'JEE Main', isActive: true },
      { isActive: false }
    );

    res.json({
      success: true,
      message: 'JEE Main data cleared successfully',
      updated,
      deleted,
      totalProcessed: colleges.length,
    });
  } catch (error) {
    console.error('Error clearing JEE Main data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   GET /api/admin/colleges/stats
// @desc    Get college counts (active, inactive, total) for database check
// @access  Private (Admin only)
router.get('/colleges/stats', async (req, res) => {
  try {
    const [activeCount, inactiveCount, total] = await Promise.all([
      College.countDocuments({ isActive: true }),
      College.countDocuments({ isActive: false }),
      College.countDocuments({}),
    ]);
    const byExamType = await College.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$examTypes' },
      { $group: { _id: '$examTypes', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json({
      success: true,
      stats: {
        active: activeCount,
        inactive: inactiveCount,
        total,
        byExamType: Object.fromEntries(byExamType.map((x) => [x._id, x.count])),
      },
    });
  } catch (error) {
    console.error('Error fetching college stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   GET /api/admin/colleges
// @desc    Get all colleges (with pagination)
// @access  Private (Admin only)
router.get('/colleges', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const includeInactive = req.query.includeInactive === 'true' || req.query.includeInactive === '1';

    const query = includeInactive ? {} : { isActive: true };
    
    // Filter by exam type - check if examTypes array contains the exam type
    if (req.query.examType && req.query.examType.trim()) {
      query.examTypes = { $in: [req.query.examType.trim()] };
    }
    
    // Search filter - only apply if search term is not empty
    if (req.query.search && req.query.search.trim()) {
      const searchTerm = req.query.search.trim();
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { code: { $regex: searchTerm, $options: 'i' } },
        { 'location.city': { $regex: searchTerm, $options: 'i' } },
        { 'location.district': { $regex: searchTerm, $options: 'i' } },
      ];
    }

    const colleges = await College.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 })
      .lean();

    const total = await College.countDocuments(query);

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
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// @route   POST /api/admin/colleges
// @desc    Create a new college
// @access  Private (Admin only)
router.post('/colleges', async (req, res) => {
  try {
    const collegeData = {
      ...req.body,
      addedBy: req.user._id,
      lastUpdatedBy: req.user._id,
    };

    const college = await College.create(collegeData);

    res.status(201).json({
      success: true,
      message: 'College created successfully',
      college,
    });
  } catch (error) {
    console.error('Error creating college:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   PUT /api/admin/colleges/:id
// @desc    Update a college
// @access  Private (Admin only)
router.put('/colleges/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid college ID format. Expected MongoDB ObjectId.',
      });
    }

    const college = await College.findByIdAndUpdate(
      id,
      {
        ...req.body,
        lastUpdatedBy: req.user._id,
      },
      { new: true, runValidators: true }
    );

    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found',
      });
    }

    res.json({
      success: true,
      message: 'College updated successfully',
      college,
    });
  } catch (error) {
    console.error('Error updating college:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   PUT /api/admin/colleges/:id/reactivate
// @desc    Reactivate a soft-deleted college
// @access  Private (Admin only)
router.put('/colleges/:id/reactivate', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid college ID format. Expected MongoDB ObjectId.',
      });
    }
    const college = await College.findByIdAndUpdate(
      id,
      { isActive: true, lastUpdatedBy: req.user._id },
      { new: true }
    );
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found',
      });
    }
    res.json({
      success: true,
      message: 'College reactivated successfully',
      college,
    });
  } catch (error) {
    console.error('Error reactivating college:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   POST /api/admin/colleges/reactivate-all
// @desc    Reactivate all inactive (soft-deleted) colleges
// @access  Private (Admin only)
router.post('/colleges/reactivate-all', async (req, res) => {
  try {
    const result = await College.updateMany(
      { isActive: false },
      { isActive: true, lastUpdatedBy: req.user._id }
    );
    res.json({
      success: true,
      message: `${result.modifiedCount} college(s) reactivated`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error reactivating colleges:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   DELETE /api/admin/colleges/:id
// @desc    Delete a college (soft delete)
// @access  Private (Admin only)
router.delete('/colleges/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid college ID format. Expected MongoDB ObjectId.',
      });
    }

    const college = await College.findByIdAndUpdate(
      id,
      { isActive: false, lastUpdatedBy: req.user._id },
      { new: true }
    );

    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found',
      });
    }

    res.json({
      success: true,
      message: 'College deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting college:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

/**
 * Parse CSV content and import colleges with deduplication
 * @param {string} csvContent - CSV file content as string
 * @param {Array} headers - CSV column headers
 * @param {string} examType - Exam type for this CSV
 * @param {ObjectId} uploadedBy - User ID who uploaded the file
 * @returns {Object} Results object with created, updated, errors arrays
 */
async function parseAndImportColleges(csvContent, headers, examType, uploadedBy) {
  const results = {
    colleges: [],
    totalRows: 0,
    created: 0,
    updated: 0,
    errors: [],
  };

  return new Promise((resolve, reject) => {
    const rows = [];
    const stream = Readable.from([csvContent]);

    stream
      .pipe(csv())
      .on('data', (row) => {
        rows.push(row);
      })
      .on('end', async () => {
        try {
          results.totalRows = rows.length;
          
          // STEP 1: Parse all rows and group by college (deduplicate at CSV level)
          // Key: "name|city|state" or "code" if available
          const collegeGroups = new Map();
          
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
              // Parse CSV row
              const collegeData = parseCSVRow(row, headers, examType);
              
              // Skip if no college name
              if (!collegeData.name) {
                results.errors.push({
                  row: i + 2,
                  error: 'Missing college name',
                });
                continue;
              }

              // Create unique key for grouping
              // Priority: code > name+city+state
              const collegeCode = collegeData.code && collegeData.code.toString().trim() 
                ? collegeData.code.toString().trim() 
                : null;
              
              const city = collegeData.location?.city || '';
              const state = collegeData.location?.state || '';
              const normalizedName = collegeData.name.trim().toLowerCase();
              
              // Use code as key if available, otherwise use name+location
              const groupKey = collegeCode 
                ? `code:${collegeCode}` 
                : `name:${normalizedName}|city:${city}|state:${state}`;
              
              // Group rows by college
              if (!collegeGroups.has(groupKey)) {
                collegeGroups.set(groupKey, {
                  code: collegeCode,
                  name: collegeData.name.trim(),
                  city: city,
                  state: state,
                  rows: [],
                });
              }
              
              // Add this row's data to the group
              collegeGroups.get(groupKey).rows.push({
                rowIndex: i + 2,
                data: collegeData,
              });
            } catch (rowError) {
              results.errors.push({
                row: i + 2,
                error: rowError.message || 'Unknown error',
                college: row['College Name'] || row['college name'] || row['college_name'] || 'Unknown',
              });
              console.error(`Error parsing row ${i + 2}:`, rowError);
            }
          }
          
          // STEP 2: Process each unique college group
          for (const [groupKey, group] of collegeGroups) {
            try {
              // Merge all rows for this college
              const mergedCollegeData = {
                name: group.name,
                examTypes: new Set(),
                branches: new Map(),
                cutoffs: new Map(),
                location: {
                  city: group.city,
                  state: group.state,
                },
                collegeType: null,
                shortName: null,
                district: null,
              };
              
              // Process all rows for this college
              for (const { rowIndex, data } of group.rows) {
                // Merge exam types
                (data.examTypes || []).forEach(et => mergedCollegeData.examTypes.add(et));
                
                // Merge branches
                (data.branches || []).forEach(b => {
                  if (b.name) {
                    const branchKey = b.name.toLowerCase();
                    if (!mergedCollegeData.branches.has(branchKey)) {
                      mergedCollegeData.branches.set(branchKey, b);
                    }
                  }
                });
                
                // Merge cutoffs
                (data.cutoffs || []).forEach(c => {
                  const cutoffKey = `${c.examType}_${c.branch}_${c.category}_${c.year}`;
                  if (!mergedCollegeData.cutoffs.has(cutoffKey)) {
                    mergedCollegeData.cutoffs.set(cutoffKey, c);
                  }
                });
                
                // Use first non-null values for other fields
                if (!mergedCollegeData.collegeType && data.collegeType) {
                  mergedCollegeData.collegeType = data.collegeType;
                }
                if (!mergedCollegeData.shortName && data.shortName) {
                  mergedCollegeData.shortName = data.shortName;
                }
                if (!mergedCollegeData.district && data.location?.district) {
                  mergedCollegeData.district = data.location.district;
                }
                if (!mergedCollegeData.location.district && data.location?.district) {
                  mergedCollegeData.location.district = data.location.district;
                }
              }
              
              // Find existing college
              let existingCollege = null;
              
              // Try by code first (if code exists)
              if (group.code) {
                existingCollege = await College.findOne({
                  code: group.code,
                  isActive: true,
                });
              }
              
              // Always check by name + location (handles cases where code is missing or null)
              // This is critical for deduplication when multiple colleges have code: null
              if (!existingCollege && group.city && group.state) {
                const escapedName = group.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                
                // Try exact match first
                existingCollege = await College.findOne({
                  name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
                  'location.city': group.city,
                  'location.state': group.state,
                  isActive: true,
                });
                
                // If not found, try with code: null or code: { $exists: false }
                // This handles cases where existing colleges have code: null
                if (!existingCollege) {
                  existingCollege = await College.findOne({
                    name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
                    'location.city': group.city,
                    'location.state': group.state,
                    $or: [
                      { code: null },
                      { code: { $exists: false } }
                    ],
                    isActive: true,
                  });
                }
              }
              
              // Prepare college data for create/update
              const collegeDataToSave = {
                name: mergedCollegeData.name,
                examTypes: Array.from(mergedCollegeData.examTypes),
                branches: Array.from(mergedCollegeData.branches.values()),
                cutoffs: Array.from(mergedCollegeData.cutoffs.values()),
                location: {
                  city: mergedCollegeData.location.city,
                  state: mergedCollegeData.location.state,
                  district: mergedCollegeData.location.district,
                },
                collegeType: mergedCollegeData.collegeType || 'Private',
                isActive: true,
                addedBy: uploadedBy,
                lastUpdatedBy: uploadedBy,
              };
              
              // Only add code if it exists (never null/undefined)
              if (group.code) {
                collegeDataToSave.code = group.code;
              }
              
              // Add optional fields only if they exist
              if (mergedCollegeData.shortName) {
                collegeDataToSave.shortName = mergedCollegeData.shortName;
              }
              
              // Use findOneAndUpdate with upsert to avoid duplicate key errors
              // Build query - prioritize by code, then name+location
              // Don't include isActive in query for upsert (would prevent matching non-existent docs)
              const query = {};
              
              if (group.code) {
                query.code = group.code;
              } else if (group.city && group.state) {
                const escapedName = group.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                query.name = { $regex: new RegExp(`^${escapedName}$`, 'i') };
                query['location.city'] = group.city;
                query['location.state'] = group.state;
              } else {
                const escapedName = group.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                query.name = { $regex: new RegExp(`^${escapedName}$`, 'i') };
              }
              
              // Find the college first (active ones)
              const findQuery = { ...query, isActive: true };
              let college = await College.findOne(findQuery);
              let wasCreated = !college;

              // If not found, check for inactive college (e.g. after "Clear JEE Main") so we reactivate it
              if (!college) {
                const inactiveCollege = await College.findOne(query);
                if (inactiveCollege) {
                  college = inactiveCollege;
                  wasCreated = false;
                }
              }
              
              if (college) {
                // Ensure college is active (reactivate if it was cleared earlier)
                college.isActive = true;
                
                // Sanitize existing college data: remove invalid cutoffs and fix collegeType
                const validCategories = ['General', 'OBC', 'SC', 'ST', 'EWS', 'Other'];
                const validCollegeTypes = ['Government', 'Private', 'Deemed University', 'Autonomous'];
                
                // Filter out invalid cutoffs from existing college (e.g. from previous bad uploads)
                if (college.cutoffs && college.cutoffs.length) {
                  college.cutoffs = college.cutoffs.filter(
                    (c) => typeof c.category === 'string' && validCategories.includes(c.category)
                  );
                }
                
                // Ensure collegeType is valid
                if (!college.collegeType || typeof college.collegeType !== 'string' || !validCollegeTypes.includes(college.collegeType)) {
                  college.collegeType = collegeDataToSave.collegeType || 'Government';
                }
                
                // Update existing college
                college.examTypes = Array.from(new Set([...college.examTypes, ...collegeDataToSave.examTypes]));
                
                // Merge branches
                const existingBranches = new Map();
                (college.branches || []).forEach(b => {
                  if (b.name) existingBranches.set(b.name.toLowerCase(), b);
                });
                collegeDataToSave.branches.forEach(b => {
                  if (b.name && !existingBranches.has(b.name.toLowerCase())) {
                    existingBranches.set(b.name.toLowerCase(), b);
                  }
                });
                college.branches = Array.from(existingBranches.values());
                
                // Merge cutoffs (only valid ones from new data - existing invalid ones already filtered above)
                const existingCutoffs = new Map();
                (college.cutoffs || []).forEach(c => {
                  const key = `${c.examType}_${c.branch}_${c.category}_${c.year}`;
                  existingCutoffs.set(key, c);
                });
                collegeDataToSave.cutoffs.forEach(c => {
                  // Only add if category is valid (should already be filtered by parseCSVRow, but double-check)
                  if (typeof c.category === 'string' && validCategories.includes(c.category)) {
                    const key = `${c.examType}_${c.branch}_${c.category}_${c.year}`;
                    if (!existingCutoffs.has(key)) {
                      existingCutoffs.set(key, c);
                    }
                  }
                });
                college.cutoffs = Array.from(existingCutoffs.values());
                
                // Update other fields
                if (!college.shortName && collegeDataToSave.shortName) {
                  college.shortName = collegeDataToSave.shortName;
                }
                if (!college.location.district && collegeDataToSave.location.district) {
                  college.location.district = collegeDataToSave.location.district;
                }
                
                college.lastUpdatedBy = uploadedBy;
                await college.save();
              } else {
                // Create new college - handle duplicate key errors gracefully
                try {
                  // Build the document without code if it doesn't exist
                  const insertData = {
                    ...collegeDataToSave,
                    addedBy: uploadedBy,
                    isActive: true,
                  };
                  
                  // Only include code if it exists - completely omit if missing
                  if (!group.code) {
                    delete insertData.code;
                  }

                  // Ensure we don't have lastUpdatedBy in insert data to avoid conflicts
                  delete insertData.lastUpdatedBy;

                  // Use findOneAndUpdate with ONLY $setOnInsert so no field is targeted by multiple operators
                  college = await College.findOneAndUpdate(
                    query,
                    {
                      $setOnInsert: insertData,
                    },
                    {
                      upsert: true,
                      new: true,
                      setDefaultsOnInsert: true,
                    }
                  );
                } catch (createError) {
                  // If duplicate key error, try to find existing college and update it instead
                  if (createError.code === 11000 && createError.keyPattern?.code === 1) {
                    // Duplicate key on code field - find existing college by name+location
                    const escapedName = group.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const findQuery = {
                      name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
                      'location.city': group.city,
                      'location.state': group.state,
                      $or: [
                        { code: null },
                        { code: { $exists: false } }
                      ],
                    };
                    
                    const existingCollege = await College.findOne(findQuery);
                    if (existingCollege) {
                      // Update existing college instead
                      existingCollege.examTypes = Array.from(new Set([...existingCollege.examTypes, ...collegeDataToSave.examTypes]));
                      
                      // Merge branches
                      const existingBranches = new Map();
                      (existingCollege.branches || []).forEach(b => {
                        if (b.name) existingBranches.set(b.name.toLowerCase(), b);
                      });
                      collegeDataToSave.branches.forEach(b => {
                        if (b.name && !existingBranches.has(b.name.toLowerCase())) {
                          existingBranches.set(b.name.toLowerCase(), b);
                        }
                      });
                      existingCollege.branches = Array.from(existingBranches.values());
                      
                      // Merge cutoffs
                      const existingCutoffs = new Map();
                      (existingCollege.cutoffs || []).forEach(c => {
                        const key = `${c.examType}_${c.branch}_${c.category}_${c.year}`;
                        existingCutoffs.set(key, c);
                      });
                      collegeDataToSave.cutoffs.forEach(c => {
                        const key = `${c.examType}_${c.branch}_${c.category}_${c.year}`;
                        if (!existingCutoffs.has(key)) {
                          existingCutoffs.set(key, c);
                        }
                      });
                      existingCollege.cutoffs = Array.from(existingCutoffs.values());
                      
                      existingCollege.lastUpdatedBy = uploadedBy;
                      await existingCollege.save();
                      college = existingCollege;
                      wasCreated = false; // It was an update, not a create
                    } else {
                      // Couldn't find existing college, rethrow error
                      throw createError;
                    }
                  } else {
                    // Different error, rethrow it
                    throw createError;
                  }
                }
              }
              
              if (wasCreated) {
                results.created++;
                results.colleges.push({
                  action: 'created',
                  college: {
                    id: college._id,
                    name: college.name,
                    code: college.code || null,
                  },
                });
              } else {
                results.updated++;
                results.colleges.push({
                  action: 'updated',
                  college: {
                    id: college._id,
                    name: college.name,
                    code: college.code || null,
                  },
                });
              }
            } catch (groupError) {
              results.errors.push({
                row: group.rows[0]?.rowIndex || 'unknown',
                error: groupError.message || 'Unknown error',
                college: group.name,
              });
              console.error(`Error processing college group "${group.name}":`, groupError);
            }
          }
          
          resolve(results);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

export default router;
