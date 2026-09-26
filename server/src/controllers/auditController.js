const AuditLog = require('../models/AuditLog');

// @desc    Get audit logs (Admin)
// @route   GET /api/audit
// @access  Private (Admin)
const getAuditLogs = async (req, res, next) => {
  try {
    const { action, targetType, page = 1, limit = 50 } = req.query;
    const query = {};

    if (action) query.action = action;
    if (targetType) query.targetType = targetType;

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('adminId', 'name email');

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
  getAuditLogs,
};
