const Attendance = require('../models/Attendance');
const Member = require('../models/Member');
const Membership = require('../models/Membership');
const GymSetting = require('../models/GymSetting');
const AuditLog = require('../models/AuditLog');
const { calculateDistanceMeters } = require('../utils/geoDistance');

// @desc    Member GPS Geofence Self Check-in
// @route   POST /api/attendance/geofence-checkin
// @access  Public (Member-facing with GPS coordinates)
const geofenceCheckIn = async (req, res, next) => {
  try {
    const { identifier, latitude, longitude, simulateOnSite = false } = req.body;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your Member ID (e.g. AF-1001), Email, or Phone number.',
      });
    }

    const trimmed = identifier.trim();

    // 1. Find Member in MongoDB
    const member = await Member.findOne({
      $or: [
        { _id: trimmed.match(/^[0-9a-fA-F]{24}$/) ? trimmed : null },
        { memberCode: { $regex: `^${trimmed}$`, $options: 'i' } },
        { email: trimmed.toLowerCase() },
        { phone: trimmed },
      ],
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'No member profile found matching the provided Member ID or Email.',
      });
    }

    // 2. Verify Membership Status
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const latestMembership = await Membership.findOne({ memberId: member._id })
      .sort({ endDate: -1 })
      .populate('planId');

    let isExpired = true;
    if (latestMembership && new Date(latestMembership.endDate) > now && latestMembership.status === 'active') {
      isExpired = false;
    } else {
      if (latestMembership) {
        latestMembership.status = 'expired';
        await latestMembership.save();
      }
      member.status = 'expired';
      await member.save();

      return res.status(400).json({
        success: false,
        isExpired: true,
        message: `Membership pass is EXPIRED (ended on ${
          latestMembership ? new Date(latestMembership.endDate).toLocaleDateString() : 'N/A'
        }). Please renew your membership pass before checking in.`,
        member: {
          id: member._id,
          name: member.name,
          memberCode: member.memberCode,
          status: 'expired',
        },
      });
    }

    // 3. Check for existing active check-in today
    const existingCheckIn = await Attendance.findOne({
      memberId: member._id,
      date: today,
      checkOut: null,
    });

    if (existingCheckIn) {
      return res.status(400).json({
        success: false,
        alreadyCheckedIn: true,
        message: `You are already checked in today at ${new Date(existingCheckIn.checkIn).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}. Have a great workout!`,
        attendance: existingCheckIn,
      });
    }

    // 4. Geofence Verification against Gym Setting
    let gymSetting = await GymSetting.findOne();
    if (!gymSetting) {
      gymSetting = await GymSetting.create({
        name: 'ApexFit Flagship Club',
        address: '100 Feet Road, Indiranagar, Bangalore',
        latitude: 12.9716,
        longitude: 77.5946,
        radiusMeters: 200,
        geofenceEnabled: true,
      });
    }

    let calculatedDistance = 0;
    let isWithinGym = true;

    if (gymSetting.geofenceEnabled) {
      if (simulateOnSite && gymSetting.allowSimulationForTesting) {
        // Developer / tester simulation: simulates being 20 meters from gym
        calculatedDistance = 20;
        isWithinGym = true;
      } else {
        if (latitude === undefined || longitude === undefined || isNaN(latitude) || isNaN(longitude)) {
          return res.status(400).json({
            success: false,
            message: 'Device GPS coordinates are required to verify gym location.',
          });
        }

        calculatedDistance = calculateDistanceMeters(
          gymSetting.latitude,
          gymSetting.longitude,
          Number(latitude),
          Number(longitude)
        );

        if (calculatedDistance > gymSetting.radiusMeters) {
          isWithinGym = false;
          return res.status(400).json({
            success: false,
            isOutOfRange: true,
            distanceMeters: calculatedDistance,
            allowedRadiusMeters: gymSetting.radiusMeters,
            gymName: gymSetting.name,
            message: `Check-in rejected: You are ${
              calculatedDistance >= 1000
                ? `${(calculatedDistance / 1000).toFixed(1)} km`
                : `${calculatedDistance} meters`
            } away from ${gymSetting.name}. Attendance is only accepted within ${gymSetting.radiusMeters}m of the gym.`,
          });
        }
      }
    }

    // 5. Create Verified Attendance Record in MongoDB
    const attendance = await Attendance.create({
      memberId: member._id,
      checkIn: now,
      date: today,
      method: 'geofence_gps',
      coordinates: {
        latitude: Number(latitude) || gymSetting.latitude,
        longitude: Number(longitude) || gymSetting.longitude,
      },
      distanceMeters: calculatedDistance,
      verifiedLocation: true,
      membershipStatusAtCheckIn: 'active',
      notes: `GPS Geofence Verified (${calculatedDistance}m from ${gymSetting.name})`,
    });

    await AuditLog.create({
      action: 'MEMBER_GPS_GEOFENCE_CHECKIN',
      targetType: 'Attendance',
      targetId: attendance._id.toString(),
      details: {
        memberName: member.name,
        memberCode: member.memberCode,
        distanceMeters: calculatedDistance,
        method: 'geofence_gps',
      },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: `✅ Attendance Verified & Accepted! Welcome ${member.name}. You are ${calculatedDistance}m from the gym floor.`,
      attendance,
      member: {
        id: member._id,
        name: member.name,
        memberCode: member.memberCode,
        status: member.status,
      },
      distanceMeters: calculatedDistance,
      gymName: gymSetting.name,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check-in a member (Desk Kiosk or Manual)
// @route   POST /api/attendance/check-in
// @access  Private (Admin)
const checkInMember = async (req, res, next) => {
  try {
    const { identifier, method = 'manual', notes = '' } = req.body;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Member ID, email, or phone is required for check-in.',
      });
    }

    const trimmed = identifier.trim();

    // Find member
    const member = await Member.findOne({
      $or: [
        { _id: trimmed.match(/^[0-9a-fA-F]{24}$/) ? trimmed : null },
        { memberCode: { $regex: `^${trimmed}$`, $options: 'i' } },
        { email: trimmed.toLowerCase() },
        { phone: trimmed },
      ],
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'No member found matching this ID.',
      });
    }

    // Check today's existing active check-in
    const today = new Date().toISOString().split('T')[0];
    const existingCheckIn = await Attendance.findOne({
      memberId: member._id,
      date: today,
      checkOut: null,
    });

    if (existingCheckIn) {
      return res.status(400).json({
        success: false,
        message: `${member.name} is already checked in today at ${new Date(existingCheckIn.checkIn).toLocaleTimeString()}.`,
        attendance: existingCheckIn,
      });
    }

    // Check active membership
    const now = new Date();
    const latestMembership = await Membership.findOne({ memberId: member._id })
      .sort({ endDate: -1 })
      .populate('planId');

    let membershipStatus = 'none';
    let isExpired = true;

    if (latestMembership) {
      if (new Date(latestMembership.endDate) > now && latestMembership.status === 'active') {
        membershipStatus = 'active';
        isExpired = false;
      } else {
        membershipStatus = 'expired';
        latestMembership.status = 'expired';
        await latestMembership.save();
        member.status = 'expired';
        await member.save();
      }
    }

    const attendance = await Attendance.create({
      memberId: member._id,
      checkIn: now,
      date: today,
      method,
      membershipStatusAtCheckIn: membershipStatus,
      notes: notes || (isExpired ? 'WARNING: Checked in with expired/no pass' : 'Normal desk entry'),
    });

    await AuditLog.create({
      adminId: req.admin?._id,
      action: 'MEMBER_CHECK_IN',
      targetType: 'Attendance',
      targetId: attendance._id.toString(),
      details: {
        memberName: member.name,
        memberCode: member.memberCode,
        membershipStatus,
      },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: isExpired
        ? `⚠️ Warning: ${member.name}'s membership is EXPIRED. Entry logged.`
        : `✅ Welcome ${member.name}! Check-in successful.`,
      attendance,
      member: {
        id: member._id,
        name: member.name,
        memberCode: member.memberCode,
        status: member.status,
      },
      membership: latestMembership,
      isExpired,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check-out a member
// @route   POST /api/attendance/check-out
// @access  Public / Private (Admin or Member)
const checkOutMember = async (req, res, next) => {
  try {
    const { attendanceId } = req.body;

    if (!attendanceId) {
      return res.status(400).json({
        success: false,
        message: 'attendanceId is required for check-out.',
      });
    }

    const attendance = await Attendance.findById(attendanceId).populate('memberId');
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found.',
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Member has already checked out.',
      });
    }

    attendance.checkOut = new Date();
    await attendance.save();

    res.json({
      success: true,
      message: `Checked out successfully at ${new Date(attendance.checkOut).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}.`,
      attendance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance history with filters
// @route   GET /api/attendance
// @access  Private (Admin)
const getAttendanceLogs = async (req, res, next) => {
  try {
    const { date, memberId, page = 1, limit = 50 } = req.query;
    const query = {};

    if (date) {
      query.date = date;
    }

    if (memberId) {
      query.memberId = memberId;
    }

    const total = await Attendance.countDocuments(query);
    const logs = await Attendance.find(query)
      .sort({ checkIn: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('memberId', 'name email phone memberCode avatar');

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      logs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  geofenceCheckIn,
  checkInMember,
  checkOutMember,
  getAttendanceLogs,
};
