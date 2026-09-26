const express = require('express');
const router = express.Router();
const {
  geofenceCheckIn,
  checkInMember,
  checkOutMember,
  getAttendanceLogs,
} = require('../controllers/attendanceController');
const { protectAdmin } = require('../middleware/auth');

// Public Member Attendance via GPS Location Geofence
router.post('/geofence-checkin', geofenceCheckIn);

// Member self check-out
router.post('/check-out', checkOutMember);

// Protected Admin desk scanner & history
router.post('/check-in', protectAdmin, checkInMember);
router.get('/', protectAdmin, getAttendanceLogs);

module.exports = router;
