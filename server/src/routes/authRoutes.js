const express = require('express');
const router = express.Router();
const { loginAdmin, getAdminProfile, setupInitialAdmin } = require('../controllers/authController');
const { protectAdmin } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Admin login
router.post('/admin/login', authLimiter, loginAdmin);

// Get current admin
router.get('/admin/me', protectAdmin, getAdminProfile);

// Initial setup (only allowed when 0 admins exist)
router.post('/admin/setup', setupInitialAdmin);

module.exports = router;
