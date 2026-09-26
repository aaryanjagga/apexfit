const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'test_jwt_secret_gymdesk_fallback_key';
  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc    Admin login
// @route   POST /api/auth/admin/login
// @access  Public (Admin only interface)
const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Create Audit Log
    await AuditLog.create({
      adminId: admin._id,
      action: 'ADMIN_LOGIN',
      targetType: 'Auth',
      targetId: admin._id.toString(),
      details: { email: admin.email, role: admin.role },
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
    });

    const token = generateToken(admin._id);

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        lastLogin: admin.lastLogin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in admin
// @route   GET /api/auth/admin/me
// @access  Private (Admin)
const getAdminProfile = async (req, res, next) => {
  try {
    res.json({
      success: true,
      admin: req.admin,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Setup initial admin if no admin exists
// @route   POST /api/auth/admin/setup
// @access  Public (only when 0 admins exist)
const setupInitialAdmin = async (req, res, next) => {
  try {
    const count = await Admin.countDocuments();
    if (count > 0) {
      return res.status(403).json({
        success: false,
        message: 'Admin account already initialized. Please login at /admin.',
      });
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    const admin = await Admin.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'superadmin',
    });

    const token = generateToken(admin._id);

    await AuditLog.create({
      adminId: admin._id,
      action: 'INITIAL_ADMIN_SETUP',
      targetType: 'Auth',
      targetId: admin._id.toString(),
      details: { email: admin.email },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Initial administrator successfully created.',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginAdmin,
  getAdminProfile,
  setupInitialAdmin,
};
