import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { generateToken, protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/auth/admin/login
// @desc    Admin login
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

      // Find admin and include password for comparison
      const admin = await Admin.findOne({ email }).select('+password');

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Check if admin is active
      if (!admin.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Admin account is inactive. Please contact support.',
        });
      }

      // Check password
      const isPasswordMatch = await admin.comparePassword(password);

      if (!isPasswordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Update last login
      admin.lastLogin = new Date();
      await admin.save();

      // Generate token
      const token = generateToken(admin._id);

      res.json({
        success: true,
        message: 'Admin login successful',
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
          userType: 'admin', // For frontend compatibility
        },
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during login',
        error: error.message,
      });
    }
  }
);

// @route   GET /api/auth/admin/me
// @desc    Get current admin
// @access  Private (Admin only)
router.get('/me', protect, async (req, res) => {
  try {
    // Check if user is admin from admins collection
    let admin;
    if (req.isAdmin) {
      admin = await Admin.findById(req.user.id || req.user._id);
    } else {
      // Try to find in admins collection by ID or email
      admin = await Admin.findById(req.user.id || req.user._id);
      if (!admin && req.user.email) {
        admin = await Admin.findOne({ email: req.user.email });
      }
    }

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    res.json({
      success: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        userType: 'admin',
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    console.error('Get admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

export default router;
