const Trainer = require('../models/Trainer');
const AuditLog = require('../models/AuditLog');

// @desc    Get all trainers (Public & Admin)
// @route   GET /api/trainers
// @access  Public
const getTrainers = async (req, res, next) => {
  try {
    const trainers = await Trainer.find({ isActive: true })
      .populate('assignedMembers', 'name email memberCode status')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: trainers.length,
      trainers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new trainer (Admin)
// @route   POST /api/trainers
// @access  Private (Admin)
const createTrainer = async (req, res, next) => {
  try {
    const { name, email, phone, specialization, experienceYears, bio, avatar } = req.body;

    if (!name || !email || !phone || !specialization) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, and specialization are required.',
      });
    }

    const trainer = await Trainer.create({
      name,
      email: email.toLowerCase(),
      phone,
      specialization,
      experienceYears: Number(experienceYears) || 1,
      bio: bio || '',
      avatar: avatar || '',
      isActive: true,
    });

    await AuditLog.create({
      adminId: req.admin?._id,
      action: 'TRAINER_CREATED',
      targetType: 'Trainer',
      targetId: trainer._id.toString(),
      details: { name: trainer.name, specialization: trainer.specialization },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Trainer created successfully.',
      trainer,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update trainer (Admin)
// @route   PUT /api/trainers/:id
// @access  Private (Admin)
const updateTrainer = async (req, res, next) => {
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found.',
      });
    }

    const { name, email, phone, specialization, experienceYears, bio, isActive } = req.body;

    if (name) trainer.name = name;
    if (email) trainer.email = email.toLowerCase();
    if (phone) trainer.phone = phone;
    if (specialization) trainer.specialization = specialization;
    if (experienceYears !== undefined) trainer.experienceYears = Number(experienceYears);
    if (bio !== undefined) trainer.bio = bio;
    if (isActive !== undefined) trainer.isActive = Boolean(isActive);

    await trainer.save();

    await AuditLog.create({
      adminId: req.admin?._id,
      action: 'TRAINER_UPDATED',
      targetType: 'Trainer',
      targetId: trainer._id.toString(),
      details: { name: trainer.name },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Trainer updated successfully.',
      trainer,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete trainer (Admin)
// @route   DELETE /api/trainers/:id
// @access  Private (Admin)
const deleteTrainer = async (req, res, next) => {
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found.',
      });
    }

    await Trainer.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      adminId: req.admin?._id,
      action: 'TRAINER_DELETED',
      targetType: 'Trainer',
      targetId: req.params.id,
      details: { name: trainer.name },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Trainer removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTrainers,
  createTrainer,
  updateTrainer,
  deleteTrainer,
};
