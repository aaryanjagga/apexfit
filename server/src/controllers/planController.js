const MembershipPlan = require('../models/MembershipPlan');
const AuditLog = require('../models/AuditLog');

// @desc    Get all active membership plans (Public & Member lookup)
// @route   GET /api/plans
// @access  Public
const getPublicPlans = async (req, res, next) => {
  try {
    const plans = await MembershipPlan.find({ isActive: true }).sort({
      displayOrder: 1,
      price: 1,
    });
    res.json({
      success: true,
      count: plans.length,
      plans,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all plans (Admin)
// @route   GET /api/plans/admin
// @access  Private (Admin)
const getAllPlansAdmin = async (req, res, next) => {
  try {
    const plans = await MembershipPlan.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: plans.length,
      plans,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create membership plan
// @route   POST /api/plans
// @access  Private (Admin)
const createPlan = async (req, res, next) => {
  try {
    const { name, durationDays, price, description, features, category, isPopular, displayOrder } = req.body;

    if (!name || !durationDays || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Plan name, duration in days, and price are required.',
      });
    }

    const plan = await MembershipPlan.create({
      name,
      durationDays: Number(durationDays),
      price: Number(price),
      description: description || '',
      features: Array.isArray(features) ? features : (features ? features.split(',').map((f) => f.trim()) : []),
      category: category || 'Gym Access',
      isPopular: Boolean(isPopular),
      displayOrder: Number(displayOrder) || 0,
      isActive: true,
    });

    await AuditLog.create({
      adminId: req.admin?._id,
      action: 'PLAN_CREATED',
      targetType: 'MembershipPlan',
      targetId: plan._id.toString(),
      details: { name: plan.name, price: plan.price, durationDays: plan.durationDays },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Plan created successfully.',
      plan,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update membership plan
// @route   PUT /api/plans/:id
// @access  Private (Admin)
const updatePlan = async (req, res, next) => {
  try {
    const plan = await MembershipPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found.',
      });
    }

    const { name, durationDays, price, description, features, category, isPopular, isActive, displayOrder } = req.body;

    if (name !== undefined) plan.name = name;
    if (durationDays !== undefined) plan.durationDays = Number(durationDays);
    if (price !== undefined) plan.price = Number(price);
    if (description !== undefined) plan.description = description;
    if (category !== undefined) plan.category = category;
    if (isPopular !== undefined) plan.isPopular = Boolean(isPopular);
    if (isActive !== undefined) plan.isActive = Boolean(isActive);
    if (displayOrder !== undefined) plan.displayOrder = Number(displayOrder);
    if (features !== undefined) {
      plan.features = Array.isArray(features) ? features : features.split(',').map((f) => f.trim());
    }

    await plan.save();

    await AuditLog.create({
      adminId: req.admin?._id,
      action: 'PLAN_UPDATED',
      targetType: 'MembershipPlan',
      targetId: plan._id.toString(),
      details: { name: plan.name, price: plan.price, isActive: plan.isActive },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Plan updated successfully.',
      plan,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete or toggle plan
// @route   DELETE /api/plans/:id
// @access  Private (Admin)
const deletePlan = async (req, res, next) => {
  try {
    const plan = await MembershipPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found.',
      });
    }

    await MembershipPlan.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      adminId: req.admin?._id,
      action: 'PLAN_DELETED',
      targetType: 'MembershipPlan',
      targetId: req.params.id,
      details: { name: plan.name },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Plan deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicPlans,
  getAllPlansAdmin,
  createPlan,
  updatePlan,
  deletePlan,
};
