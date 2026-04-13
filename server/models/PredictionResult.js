import mongoose from 'mongoose';

const predictionResultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Prediction parameters
    predictionParams: {
      examType: {
        type: String,
        required: true,
      },
      rank: {
        type: Number,
        required: true,
      },
      category: {
        type: String,
        required: true,
      },
      gender: {
        type: String,
        default: 'COED',
      },
      districts: [String],
      preferredBranches: [String],
    },
    // Prediction results
    predictions: [
      {
        collegeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'College',
        },
        collegeName: String,
        branch: String,
        district: String,
        location: {
          city: String,
          state: String,
          district: String,
        },
        cutoffRank: Number,
        predictedCutoff: Number,
        admissionProbability: Number,
        probability: String, // 'high', 'medium', 'low'
        collegeType: String,
        rankings: {
          nirf: Number,
        },
        fees: {
          annualTuitionFee: Number,
        },
        placements: {
          averagePackage: Number,
        },
        imageUrl: String,
      },
    ],
    // Summary statistics
    summary: {
      totalColleges: Number,
      highProbability: Number,
      moderateProbability: Number,
      lowProbability: Number,
    },
    // Metadata
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
predictionResultSchema.index({ user: 1, createdAt: -1 });
predictionResultSchema.index({ 'predictionParams.examType': 1 });

const PredictionResult = mongoose.model('PredictionResult', predictionResultSchema);

export default PredictionResult;

