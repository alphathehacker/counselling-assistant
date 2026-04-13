import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Exam name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Exam code is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    csvFilePath: {
      type: String,
      required: [true, 'CSV file path is required'],
    },
    csvData: {
      type: String, // Store the CSV content as string for faster access
    },
    headers: [{
      type: String, // Store CSV headers for validation
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    lastUsed: {
      type: Date,
    },
    totalColleges: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
examSchema.index({ code: 1 });
examSchema.index({ isActive: 1 });

// Method to parse CSV and get predictions
examSchema.methods.getPredictions = function(rank, category, options = {}) {
  const { maxResults = 100, preferredBranches = [], preferredLocations = [] } = options;

  if (!this.csvData) {
    throw new Error('CSV data not available');
  }

  const lines = this.csvData.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const collegeData = lines.slice(1).map(line => {
    const values = line.split(',');
    const college = {};
    headers.forEach((header, index) => {
      college[header] = values[index]?.trim() || '';
    });
    return college;
  });

  // Map category to CSV column
  const categoryMap = {
    'OC': 'OC Rank',
    'BC-A': 'BC-A Rank',
    'BC-B': 'BC-B Rank',
    'BC-C': 'BC-C Rank',
    'BC-D': 'BC-D Rank',
    'BC-E': 'BC-E Rank',
    'SC': 'SC Rank',
    'ST': 'ST Rank',
    'EWS': 'EWS Rank',
  };

  const cutoffColumn = categoryMap[category];
  if (!cutoffColumn) {
    throw new Error(`Category ${category} not supported`);
  }

  // Filter colleges where student rank is less than or equal to cutoff
  const eligibleColleges = collegeData
    .filter(college => {
      const cutoffRank = parseInt(college[cutoffColumn]);
      return !isNaN(cutoffRank) && rank <= cutoffRank;
    })
    .map(college => {
      const cutoffRank = parseInt(college[cutoffColumn]);
      const collegeName = college['College Name'];

      // Calculate admission chance based on rank difference
      let chance, confidence;
      const rankDifference = cutoffRank - rank;

      if (rankDifference >= cutoffRank * 0.5) {
        chance = 'high';
        confidence = 90;
      } else if (rankDifference >= cutoffRank * 0.25) {
        chance = 'good';
        confidence = 70;
      } else if (rankDifference >= 0) {
        chance = 'moderate';
        confidence = 50;
      } else if (rank <= cutoffRank * 1.2) {
        chance = 'low';
        confidence = 30;
      } else {
        chance = 'very-low';
        confidence = 10;
      }

      return {
        name: collegeName,
        cutoffRank,
        admissionChance: chance,
        confidence,
        category,
      };
    })
    .sort((a, b) => {
      // Sort by confidence (highest first), then by cutoff rank (lowest first)
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      return a.cutoffRank - b.cutoffRank;
    })
    .slice(0, maxResults);

  return eligibleColleges;
};

const Exam = mongoose.model('Exam', examSchema);

export default Exam;
