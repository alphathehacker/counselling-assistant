import mongoose from 'mongoose';

const collegeSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
    },
    shortName: {
      type: String,
      trim: true,
    },
    code: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple null values (only enforce uniqueness for non-null values)
      trim: true,
    },
    
    // Location
    location: {
      city: { type: String, required: true },
      state: { type: String, required: true },
      district: String,
      pincode: String,
      address: String,
      nearestRailway: String, // Nearest Railway Station
      nearestBusStand: String, // Nearest Bus Stand
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    
    // Campus Information
    campusArea: Number, // Campus area in acres
    
    // College Type
    collegeType: {
      type: String,
      enum: ['Government', 'Private', 'Private University', 'Deemed University', 'Autonomous'],
      required: true,
    },
    
    // Exam Types this college accepts
    examTypes: [{
      type: String,
      enum: ['AP EAPCET', 'AP ECET', 'NEET', 'JEE Main', 'JEE Advanced'],
      required: true,
    }],
    
    // Cutoff Information (rank-based)
    cutoffs: [{
      examType: {
        type: String,
        enum: ['AP EAPCET', 'AP ECET', 'NEET', 'JEE Main', 'JEE Advanced'],
        required: true,
      },
      branch: {
        type: String,
        required: true,
      },
      category: {
        type: String,
        required: true,
      },
      year: {
        type: Number,
        required: true,
      },
      openingRank: Number,
      closingRank: Number,
      // For percentile-based exams
      openingPercentile: Number,
      closingPercentile: Number,
    }],
    
    // Branches/Courses Offered
    branches: [{
      name: String,
      code: String,
      duration: Number, // in years
      intake: Number, // number of seats
    }],
    
    // Fee Structure
    fees: {
      annualTuitionFee: Number,
      annualHostelFee: Number,
      annualMessFee: Number,
      oneTimeFee: Number,
      totalFirstYearFee: Number,
      currency: { type: String, default: 'INR' },
    },
    
    // Placement Information
    placements: {
      averagePackage: Number, // in LPA
      highestPackage: Number, // in LPA
      placementRate: Number, // percentage
      topRecruiters: [String],
    },
    
    // Rankings
    rankings: {
      nirf: Number,
      qs: Number,
      times: Number,
    },
    
    // Facilities
    facilities: [String],
    
    // Additional Info
    established: Number,
    affiliation: String,
    website: String,
    contact: {
      phone: String,
      email: String,
    },
    
    // Image URL from SerpAPI (cached to avoid repeated API calls)
    imageUrl: {
      type: String,
      trim: true,
    },
    
    // Admin Management
    isActive: {
      type: Boolean,
      default: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
collegeSchema.index({ 'location.city': 1, 'location.state': 1 });
collegeSchema.index({ examTypes: 1 });
collegeSchema.index({ 'cutoffs.examType': 1, 'cutoffs.branch': 1, 'cutoffs.category': 1 });
collegeSchema.index({ collegeType: 1 });
collegeSchema.index({ 'fees.annualTuitionFee': 1 });
collegeSchema.index({ 'rankings.nirf': 1 });
collegeSchema.index({ 'placements.averagePackage': 1 });

// Method to check admission chance
collegeSchema.methods.checkAdmissionChance = function (rank, examType, branch, category) {
  const cutoff = this.cutoffs.find(
    c => c.examType === examType && 
         c.branch === branch && 
         c.category === category &&
         c.year === new Date().getFullYear() - 1 // Previous year
  );
  
  if (!cutoff) {
    return { chance: 'unknown', confidence: 0 };
  }
  
  const closingRank = cutoff.closingRank || cutoff.closingPercentile;
  const openingRank = cutoff.openingRank || cutoff.openingPercentile;
  
  if (rank <= closingRank * 0.5) {
    return { chance: 'high', confidence: 90, message: 'Very good chance' };
  } else if (rank <= closingRank * 0.75) {
    return { chance: 'good', confidence: 70, message: 'Good chance' };
  } else if (rank <= closingRank) {
    return { chance: 'moderate', confidence: 50, message: 'Moderate chance' };
  } else if (rank <= closingRank * 1.2) {
    return { chance: 'low', confidence: 30, message: 'Low chance' };
  } else {
    return { chance: 'very-low', confidence: 10, message: 'Very low chance' };
  }
};

const College = mongoose.model('College', collegeSchema);

export default College;
