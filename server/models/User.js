import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/* =========================
   Bookmarked College Schema
========================= */
const bookmarkedCollegeSchema = new mongoose.Schema(
  {
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true,
    },
    collegeName: {
      type: String,
      trim: true,
    },
    type: {
      type: String, // predicted, favorites, saved
      default: 'predicted',
    },
    listId: {
      type: String,
      default: 'all',
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    notes: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    predictionData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    dateAdded: {
      type: Date,
      default: Date.now,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

/* =========================
   User Schema
========================= */
const userSchema = new mongoose.Schema(
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
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },

    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },

    userType: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },

    /* ===== OAuth ===== */
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    facebookId: {
      type: String,
      sparse: true,
      unique: true,
    },

    /* ===== Profile ===== */
    profile: {
      examType: String,
      rank: Number,
      category: String,
      state: String,
      preferredBranches: [String],
      phone: String,
      dateOfBirth: Date,
      profilePicture: String,
    },

    /* ===== Bookmarks (FIXED) ===== */
    bookmarkedColleges: {
      type: [bookmarkedCollegeSchema],
      default: [],
    },

    /* ===== Stats ===== */
    statistics: {
      totalPredictions: { type: Number, default: 0 },
      bookmarkedColleges: { type: Number, default: 0 },
      reportsDownloaded: { type: Number, default: 0 },
      profileViews: { type: Number, default: 0 },
    },

    profileCompletion: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: Date,
  },
  {
    timestamps: true,
  }
);

/* =========================
   Hooks & Methods
========================= */

// 🔐 Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔐 Compare password
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 📊 Calculate profile completion
userSchema.methods.calculateProfileCompletion = function () {
  let completion = 0;
  const fields = [
    'name',
    'email',
    'profile.examType',
    'profile.rank',
    'profile.category',
  ];

  fields.forEach((field) => {
    const keys = field.split('.');
    let value = this;
    for (const key of keys) value = value?.[key];
    if (value) completion += 20;
  });

  this.profileCompletion = Math.min(completion, 100);
  return this.profileCompletion;
};

// 🔒 Hide password in JSON responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// 👑 Ensure single admin
userSchema.statics.createAdmin = async function (adminData) {
  const existingAdmin = await this.findOne({ userType: 'admin' });
  if (existingAdmin) {
    throw new Error('Admin user already exists');
  }
  adminData.userType = 'admin';
  return this.create(adminData);
};

const User = mongoose.model('User', userSchema);
export default User;
