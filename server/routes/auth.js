import express from 'express';
import { body, validationResult } from 'express-validator';
import passport from '../config/passport.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
import College from '../models/College.js';
import PredictionResult from '../models/PredictionResult.js';
import { generateToken, protect } from '../middleware/auth.js';
import { sendPredictionEmail } from '../utils/emailService.js'; // This is misleading name now, but it's our only email utility

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
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

      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email',
        });
      }

      // Create user (only 'user' type allowed, admin must be created separately)
      const user = await User.create({
        name,
        email,
        password,
        userType: 'user',
        profile: {},
        statistics: {
          totalPredictions: 0,
          bookmarkedColleges: 0,
          reportsDownloaded: 0,
          profileViews: 0,
        },
      });

      // Calculate profile completion
      user.calculateProfileCompletion();
      await user.save();

      // Send Welcome Email (non-blocking)
      try {
        const { sendWelcomeEmail } = await import('../utils/emailService.js');
        sendWelcomeEmail(user.email, user.name);
      } catch (err) {
        console.error('Failed to send welcome email:', err);
      }

      // Generate token
      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          profile: user.profile,
          profileCompletion: user.profileCompletion,
        },
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during registration',
        error: error.message,
      });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
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

      const { email, password } = req.body;

      // Find user and include password for comparison
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is inactive. Please contact support.',
        });
      }

      // Check password
      const isPasswordMatch = await user.comparePassword(password);

      if (!isPasswordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      const token = generateToken(user._id);

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          profile: user.profile,
          profileCompletion: user.profileCompletion,
          statistics: user.statistics,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during login',
        error: error.message,
      });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    let user;
    if (req.isAdmin) {
      user = req.user; // Use the admin profile injected by protect middleware
      // Give admin some empty stats so frontend doesn't crash
      user.statistics = {
        totalPredictions: 0,
        bookmarkedColleges: 0,
        reportsDownloaded: 0,
        profileViews: 0
      };
      user.profile = {};
    } else {
      user = await User.findById(req.user._id);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Auto-sync statistics to ensure real-time accuracy and backward compatibility
    let needsUpdate = false;
    const PredictionResult = mongoose.model('PredictionResult');
    const totalPredictions = await PredictionResult.countDocuments({ user: user._id, isActive: true });
    const bookmarkedColleges = user.bookmarkedColleges?.length || 0;

    const currentStats = user.statistics ? user.statistics.toObject ? user.statistics.toObject() : user.statistics : {
      totalPredictions: 0,
      bookmarkedColleges: 0,
      reportsDownloaded: 0,
      profileViews: 0
    };

    if (
      currentStats.totalPredictions !== totalPredictions ||
      currentStats.bookmarkedColleges !== bookmarkedColleges
    ) {
      currentStats.totalPredictions = totalPredictions;
      currentStats.bookmarkedColleges = bookmarkedColleges;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            'statistics.totalPredictions': totalPredictions,
            'statistics.bookmarkedColleges': bookmarkedColleges
          }
        }
      );
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        profile: user.profile,
        profileCompletion: user.profileCompletion,
        statistics: currentStats,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const { name, phone, examType, rank, category, state } = req.body;

    // Update basic info
    if (name) user.name = name;

    // Update profile object
    if (!user.profile) user.profile = {};
    if (phone !== undefined) user.profile.phone = phone;
    if (examType !== undefined) user.profile.examType = examType;
    if (rank !== undefined) user.profile.rank = rank;
    if (category !== undefined) user.profile.category = category;
    if (state !== undefined) user.profile.state = state;

    // Recalculate profile completion
    user.calculateProfileCompletion();
    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        profile: user.profile,
        profileCompletion: user.profileCompletion,
        statistics: user.statistics,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update',
      error: error.message,
    });
  }
});
// @desc    Increment the user's reportsDownloaded statistic
// @access  Private
router.post('/stats/reports-downloaded', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { 'statistics.reportsDownloaded': 1 } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, statistics: user.statistics });
  } catch (error) {
    console.error('Increment reports error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/auth/google
// @desc    Google OAuth login
// @access  Public
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  // @route   GET /api/auth/google/callback
  // @desc    Google OAuth callback
  // @access  Public
  router.get(
    '/google/callback',
    passport.authenticate('google', { session: false }),
    (req, res) => {
      try {
        const token = generateToken(req.user._id);
        const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';

        // Update last login
        req.user.lastLogin = new Date();
        req.user.save();

        // Redirect to frontend with token
        res.redirect(`${frontendURL}/auth/callback?token=${token}`);
      } catch (error) {
        console.error('Google OAuth error:', error);
        const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendURL}/login?error=oauth_failed`);
      }
    }
  );
} else {
  // Return error if Google OAuth is not configured
  router.get('/google', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.',
    });
  });

  router.get('/google/callback', (req, res) => {
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendURL}/login?error=oauth_not_configured`);
  });
}

// @route   GET /api/auth/facebook
// @desc    Facebook OAuth login
// @access  Public
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  router.get(
    '/facebook',
    passport.authenticate('facebook', { scope: ['email'] })
  );

  // @route   GET /api/auth/facebook/callback
  // @desc    Facebook OAuth callback
  // @access  Public
  router.get(
    '/facebook/callback',
    passport.authenticate('facebook', { session: false }),
    (req, res) => {
      try {
        const token = generateToken(req.user._id);
        const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';

        // Update last login
        req.user.lastLogin = new Date();
        req.user.save();

        // Redirect to frontend with token
        res.redirect(`${frontendURL}/auth/callback?token=${token}`);
      } catch (error) {
        console.error('Facebook OAuth error:', error);
        const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendURL}/login?error=oauth_failed`);
      }
    }
  );
} else {
  // Return error if Facebook OAuth is not configured
  router.get('/facebook', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Facebook OAuth is not configured. Please add FACEBOOK_APP_ID and FACEBOOK_APP_SECRET to your .env file.',
    });
  });

  router.get('/facebook/callback', (req, res) => {
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendURL}/login?error=oauth_not_configured`);
  });
}

export default router;
