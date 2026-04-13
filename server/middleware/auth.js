import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Try to find user first
      let user = await User.findById(decoded.id);
      
      // If not found in users, check admins collection
      if (!user) {
        const admin = await Admin.findById(decoded.id);
        if (admin && admin.isActive) {
          req.user = {
            _id: admin._id,
            id: admin._id,
            name: admin.name,
            email: admin.email,
            userType: 'admin',
            role: admin.role,
            permissions: admin.permissions,
          };
          req.isAdmin = true;
          return next();
        }
      }

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive',
        });
      }

      req.user = user;
      req.isAdmin = false;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

export const adminOnly = async (req, res, next) => {
  try {
    // Check if user is admin from admins collection
    if (req.isAdmin) {
      return next();
    }

    // Check if user has admin type (for backward compatibility)
    if (req.user && req.user.userType === 'admin') {
      return next();
    }

    // Verify admin exists in admins collection
    const admin = await Admin.findById(req.user?.id || req.user?._id);
    if (admin && admin.isActive) {
      req.isAdmin = true;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Generate JWT Token
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};
