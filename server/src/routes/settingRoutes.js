const express = require('express');
const router = express.Router();
const { getGymLocation, updateGymLocation } = require('../controllers/settingController');
const { protectAdmin } = require('../middleware/auth');

// Public route to view gym location coordinates & geofence rules
router.get('/gym-location', getGymLocation);

// Admin route to update gym coordinates & accepted radius
router.put('/gym-location', protectAdmin, updateGymLocation);

module.exports = router;
