const Member = require('../models/Member');
const Membership = require('../models/Membership');
const MembershipPlan = require('../models/MembershipPlan');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const AuditLog = require('../models/AuditLog');

// Helper to check and sync expiry in MongoDB
const syncMembershipExpiry = async (membership) => {
  if (!membership) return null;
  const now = new Date();
  if (membership.endDate && new Date(membership.endDate) < now && membership.status === 'active') {
    membership.status = 'expired';
    await membership.save();

    await Member.findByIdAndUpdate(membership.memberId, { status: 'expired' });
  }
  return membership;
};

// @desc    Get all members (Admin)
// @route   GET /api/members
// @access  Private (Admin)
const getMembers = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { memberCode: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Member.countDocuments(query);
    const members = await Member.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Attach latest membership summary for each member
    const membersWithPass = await Promise.all(
      members.map(async (member) => {
        let membership = await Membership.findOne({ memberId: member._id })
          .sort({ endDate: -1 })
          .populate('planId', 'name durationDays price');

        if (membership) {
          membership = await syncMembershipExpiry(membership);
        }

        return {
          ...member.toObject(),
          currentMembership: membership,
        };
      })
    );

    // Disable caching on client to enforce multi-device consistency
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      members: membersWithPass,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single member details with full history (Admin)
// @route   GET /api/members/:id
// @access  Private (Admin)
const getMemberById = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found.',
      });
    }

    // Fetch active or latest membership
    let membership = await Membership.findOne({ memberId: member._id })
      .sort({ endDate: -1 })
      .populate('planId')
      .populate('lastPaymentId');

    if (membership) {
      membership = await syncMembershipExpiry(membership);
    }

    // Fetch payment history
    const payments = await Payment.find({ memberId: member._id })
      .sort({ createdAt: -1 })
      .populate('planId', 'name price durationDays');

    // Fetch recent attendance
    const attendance = await Attendance.find({ memberId: member._id })
      .sort({ checkIn: -1 })
      .limit(20);

    // Enforce multi-device consistency headers
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    res.json({
      success: true,
      member,
      membership,
      payments,
      attendance,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new member (Admin)
// @route   POST /api/members
// @access  Private (Admin)
const createMember = async (req, res, next) => {
  try {
    const { name, email, phone, gender, dateOfBirth, address, emergencyContact, notes } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and phone number are required.',
      });
    }

    const existingEmail = await Member.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'A member with this email already exists.',
      });
    }

    const member = await Member.create({
      name,
      email: email.toLowerCase(),
      phone,
      gender: gender || 'Prefer not to say',
      dateOfBirth: dateOfBirth || null,
      address: address || '',
      emergencyContact: emergencyContact || {},
      notes: notes || '',
      status: 'inactive', // inactive until a membership plan is purchased
    });

    await AuditLog.create({
      adminId: req.admin?._id,
      action: 'MEMBER_CREATED',
      targetType: 'Member',
      targetId: member._id.toString(),
      details: { name: member.name, email: member.email, memberCode: member.memberCode },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Member registered successfully.',
      member,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update member details (Admin)
// @route   PUT /api/members/:id
// @access  Private (Admin)
const updateMember = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found.',
      });
    }

    const { name, phone, gender, dateOfBirth, address, emergencyContact, notes, status } = req.body;

    if (name) member.name = name;
    if (phone) member.phone = phone;
    if (gender) member.gender = gender;
    if (dateOfBirth !== undefined) member.dateOfBirth = dateOfBirth;
    if (address !== undefined) member.address = address;
    if (emergencyContact) member.emergencyContact = emergencyContact;
    if (notes !== undefined) member.notes = notes;
    if (status) member.status = status;

    await member.save();

    await AuditLog.create({
      adminId: req.admin?._id,
      action: 'MEMBER_UPDATED',
      targetType: 'Member',
      targetId: member._id.toString(),
      details: { name: member.name, status: member.status },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Member updated successfully.',
      member,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete member (Admin)
// @route   DELETE /api/members/:id
// @access  Private (Admin)
const deleteMember = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found.',
      });
    }

    await Member.findByIdAndDelete(req.params.id);
    await Membership.deleteMany({ memberId: req.params.id });

    await AuditLog.create({
      adminId: req.admin?._id,
      action: 'MEMBER_DELETED',
      targetType: 'Member',
      targetId: req.params.id,
      details: { name: member.name, email: member.email },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Member and related memberships removed.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Public / Member-Facing Digital Pass Lookup
// @route   GET /api/members/lookup/pass
// @access  Public (NO ADMIN DATA EXPOSED)
const lookupMemberPass = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Member ID, Email, or Phone number.',
      });
    }

    const trimmed = query.trim();

    // Find member by memberCode, email, or phone
    const member = await Member.findOne({
      $or: [
        { memberCode: { $regex: `^${trimmed}$`, $options: 'i' } },
        { email: trimmed.toLowerCase() },
        { phone: trimmed },
      ],
    }).select('name memberCode email phone status avatar joinDate');

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'No member found matching the provided identifier.',
      });
    }

    // Get current / latest membership
    let membership = await Membership.findOne({ memberId: member._id })
      .sort({ endDate: -1 })
      .populate('planId', 'name durationDays price features category');

    if (membership) {
      membership = await syncMembershipExpiry(membership);
    }

    // Calculate real-time pass status
    const now = new Date();
    let isPassActive = false;
    let daysRemaining = 0;

    if (membership && membership.endDate) {
      const end = new Date(membership.endDate);
      if (end > now && membership.status === 'active') {
        isPassActive = true;
        daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
      }
    }

    // Strong cache-busting headers to guarantee multi-device accuracy
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.json({
      success: true,
      member: {
        id: member._id,
        name: member.name,
        memberCode: member.memberCode,
        status: isPassActive ? 'active' : (membership ? 'expired' : 'inactive'),
        joinDate: member.joinDate,
      },
      membership: membership
        ? {
            id: membership._id,
            planName: membership.planId?.name || 'Standard Pass',
            planCategory: membership.planId?.category || 'Gym Access',
            startDate: membership.startDate,
            endDate: membership.endDate,
            status: isPassActive ? 'active' : 'expired',
            daysRemaining,
            isExpired: !isPassActive,
          }
        : null,
      serverTimestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  lookupMemberPass,
};
