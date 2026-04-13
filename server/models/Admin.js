import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    // Additional admin details
    role: {
      type: String,
      default: 'admin',
      enum: ['admin', 'super-admin'],
    },
    permissions: {
      manageColleges: { type: Boolean, default: true },
      manageUsers: { type: Boolean, default: true },
      manageDatasets: { type: Boolean, default: true },
      viewAnalytics: { type: Boolean, default: true },
    },
    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    // Bookmarks support for admins (for testing/personal use)
    bookmarkedColleges: [
      {
        collegeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'College',
          required: true,
        },
        collegeName: String,
        type: { type: String, default: 'predicted' },
        listId: { type: String, default: 'all' },
        priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
        notes: { type: String, default: '' },
        tags: [String],
        predictionData: mongoose.Schema.Types.Mixed,
        dateAdded: { type: Date, default: Date.now },
      }
    ],
    statistics: {
      totalPredictions: { type: Number, default: 0 },
      bookmarkedColleges: { type: Number, default: 0 },
      reportsDownloaded: { type: Number, default: 0 },
      profileViews: { type: Number, default: 0 },
    },
    lastLogin: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public admin data
adminSchema.methods.toJSON = function () {
  const adminObject = this.toObject();
  delete adminObject.password;
  return adminObject;
};

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;
