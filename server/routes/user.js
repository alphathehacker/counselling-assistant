import express from 'express';
import { body, param, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

/* ===================== Helper ===================== */
const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
};

/* ===================== GET BOOKMARKS ===================== */
router.get('/bookmarks', async (req, res) => {
  try {
    const Model = req.isAdmin ? Admin : User;
    const user = await Model.findById(req.user._id)
      .populate('bookmarkedColleges.collegeId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.json({
      success: true,
      bookmarks: user.bookmarkedColleges.map(b => ({
        bookmarkId: b._id,
        collegeId: b.collegeId ?
          (b.collegeId._id ? b.collegeId._id.toString() :
            (typeof b.collegeId === 'string' ? b.collegeId : b._id?.toString() || '')) :
          (b._id ? b._id.toString() : ''),
        collegeName: b.collegeName || (b.collegeId && b.collegeId.name) || '',
        name: b.collegeName || (b.collegeId && b.collegeId.name) || '',
        college: b.collegeId,
        type: b.type,
        listId: b.listId,
        priority: b.priority,
        notes: b.notes,
        tags: b.tags,
        predictionData: b.predictionData,
        dateAdded: b.dateAdded,
        addedAt: b.addedAt || b.dateAdded
      }))
    });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

/* ===================== ADD BOOKMARK ===================== */
router.post(
  '/bookmarks',
  [
    body('collegeId')
      .custom(value => mongoose.Types.ObjectId.isValid(value))
      .withMessage('Invalid collegeId'),
    body('priority').optional().isIn(['high', 'medium', 'low']),
    body('listId').optional().isString(),
    body('notes').optional().isString(),
    body('tags').optional().isArray(),
    body('collegeName').optional().isString(),
    body('type').optional().isString(),
    body('predictionData').optional().isObject(),
    body('dateAdded').optional().isISO8601(),
  ],
  async (req, res) => {
    const errorResponse = handleValidation(req, res);
    if (errorResponse) return errorResponse;

    try {
      const {
        collegeId,
        priority = 'medium',
        listId = 'all',
        notes = '',
        tags = [],
        collegeName = '',
        type = 'predicted',
        predictionData = {},
        dateAdded,
      } = req.body;

      const Model = req.isAdmin ? Admin : User;
      const user = await Model.findById(req.user._id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // 🔒 Prevent duplicate bookmark
      const alreadyExists = user.bookmarkedColleges.some(
        b => b.collegeId.toString() === collegeId
      );

      if (alreadyExists) {
        return res.status(200).json({
          success: true,
          message: 'Already bookmarked',
          bookmarks: user.bookmarkedColleges,
        });
      }

      // ✅ Add bookmark
      user.bookmarkedColleges.push({
        collegeId,
        collegeName,
        type,
        listId,
        priority,
        notes,
        tags,
        predictionData,
        dateAdded: dateAdded ? new Date(dateAdded) : new Date(),
      });

      user.statistics.bookmarkedColleges += 1;
      await user.save();

      console.log(`✅ Bookmark added for user ${user._id}`);

      return res.status(201).json({
        success: true,
        message: 'Bookmark added',
        bookmarks: user.bookmarkedColleges.map(b => ({
          bookmarkId: b._id,
          ...b.toObject(),
        })),
      });
    } catch (error) {
      console.error('❌ Error adding bookmark:', error);

      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid data type',
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  }
);

/* ===================== UPDATE BOOKMARK ===================== */
router.put(
  '/bookmarks/:bookmarkId',
  [
    param('bookmarkId')
      .custom(value => mongoose.Types.ObjectId.isValid(value))
      .withMessage('Invalid bookmarkId'),
  ],
  async (req, res) => {
    const errorResponse = handleValidation(req, res);
    if (errorResponse) return errorResponse;

    try {
      const { bookmarkId } = req.params;

      const Model = req.isAdmin ? Admin : User;
      const user = await Model.findById(req.user._id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User/Admin not found',
        });
      }

      const bookmark = user.bookmarkedColleges.id(bookmarkId);
      if (!bookmark) {
        return res.status(404).json({
          success: false,
          message: 'Bookmark not found',
        });
      }

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          bookmark[field] =
            field === 'dateAdded'
              ? new Date(req.body[field])
              : req.body[field];
        }
      });

      await user.save();

      return res.json({
        success: true,
        message: 'Bookmark updated',
        bookmarks: user.bookmarkedColleges,
      });
    } catch (error) {
      console.error('Error updating bookmark:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  }
);

/* ===================== DELETE BOOKMARK ===================== */
router.delete('/bookmarks/:collegeId', async (req, res) => {
  try {
    const { collegeId } = req.params;

    console.log('🔍 BACKEND DEBUG: DELETE request received');
    console.log('🔍 BACKEND DEBUG: collegeId param:', collegeId);
    console.log('🔍 BACKEND DEBUG: collegeId type:', typeof collegeId);
    console.log('🔍 BACKEND DEBUG: collegeId length:', collegeId?.length);

    // Remove ObjectId validation since collegeId can be a string
    // if (!mongoose.Types.ObjectId.isValid(collegeId)) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Invalid collegeId',
    //   });
    // }

    const Model = req.isAdmin ? Admin : User;
    const user = await Model.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User/Admin not found',
      });
    }

    // Initialize bookmarkedColleges if it doesn't exist
    if (!user.bookmarkedColleges) {
      user.bookmarkedColleges = [];
    }

    console.log('🔍 BACKEND DEBUG: Current bookmarks count:', user.bookmarkedColleges.length);
    console.log('🔍 BACKEND DEBUG: Sample bookmark structure:', user.bookmarkedColleges[0]);

    const beforeCount = user.bookmarkedColleges.length;

    user.bookmarkedColleges = user.bookmarkedColleges.filter(
      b => {
        const bookmarkCollegeId = b.collegeId ? b.collegeId.toString() : '';
        console.log('🔍 BACKEND DEBUG: Comparing bookmarkCollegeId:', bookmarkCollegeId, 'with collegeId:', collegeId);
        return bookmarkCollegeId !== collegeId;
      }
    );

    if (user.bookmarkedColleges.length === beforeCount) {
      return res.status(404).json({
        success: false,
        message: 'Bookmark not found',
      });
    }

    // Update statistics
    user.statistics = user.statistics || {};
    user.statistics.bookmarkedColleges = Math.max(0, (user.statistics.bookmarkedColleges || 0) - 1);

    await user.save();

    console.log('✅ Bookmark removed successfully:', collegeId);
    console.log('📊 Remaining bookmarks:', user.bookmarkedColleges.length);

    return res.status(200).json({
      success: true,
      message: 'Bookmark removed successfully',
      remainingBookmarks: user.bookmarkedColleges,
    });
  } catch (error) {
    console.error('❌ Error removing bookmark:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;
