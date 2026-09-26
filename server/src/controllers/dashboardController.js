const Member = require('../models/Member');
const Membership = require('../models/Membership');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');

// @desc    Get Admin Dashboard Metrics
// @route   GET /api/dashboard/stats
// @access  Private (Admin)
const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Total members
    const totalMembers = await Member.countDocuments();

    // Active memberships vs Expired memberships
    const activeMembershipsCount = await Membership.countDocuments({
      status: 'active',
      endDate: { $gt: now },
    });

    const expiredMembershipsCount = await Membership.countDocuments({
      $or: [
        { status: 'expired' },
        { endDate: { $lte: now } },
      ],
    });

    // Today's check-ins
    const todayCheckIns = await Attendance.countDocuments({ date: today });

    // Total Revenue from successful payments
    const revenueAgg = await Payment.aggregate([
      { $match: { paymentStatus: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    // Recent 5 payments
    const recentPayments = await Payment.find({ paymentStatus: 'success' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('memberId', 'name email memberCode')
      .populate('planId', 'name price');

    // Recent 5 check-ins
    const recentCheckIns = await Attendance.find()
      .sort({ checkIn: -1 })
      .limit(5)
      .populate('memberId', 'name email memberCode avatar');

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    res.json({
      success: true,
      stats: {
        totalMembers,
        activePasses: activeMembershipsCount,
        expiredPasses: expiredMembershipsCount,
        todayCheckIns,
        totalRevenue,
      },
      recentPayments,
      recentCheckIns,
      serverTime: now.toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
