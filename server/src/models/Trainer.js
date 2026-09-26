const mongoose = require('mongoose');

const TrainerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide trainer name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide trainer email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Please provide trainer phone'],
      trim: true,
    },
    specialization: {
      type: String,
      required: [true, 'Please provide specialization (e.g. Strength, CrossFit, HIIT)'],
      trim: true,
    },
    assignedMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
      },
    ],
    experienceYears: {
      type: Number,
      default: 3,
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Trainer', TrainerSchema);
