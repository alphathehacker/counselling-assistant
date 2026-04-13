import mongoose from 'mongoose';

const csvDataSchema = new mongoose.Schema(
  {
    // Exam type this CSV is for
    examType: {
      type: String,
      required: [true, 'Exam type is required'],
      enum: ['AP EAPCET', 'AP ECET', 'NEET', 'IIT JEE', 'JEE Main', 'JEE Advanced'],
      index: true,
    },
    
    // Original filename
    filename: {
      type: String,
      required: true,
    },
    
    // CSV file content (stored as string/buffer)
    csvContent: {
      type: String,
      required: true,
    },
    
    // CSV headers (for reference)
    headers: [{
      type: String,
    }],
    
    // Metadata
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    
    // File size in bytes
    fileSize: {
      type: Number,
    },
    
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
csvDataSchema.index({ examType: 1, isActive: 1 });
csvDataSchema.index({ uploadedAt: -1 });

const CSVData = mongoose.model('CSVData', csvDataSchema);

export default CSVData;

