const mongoose = require('mongoose');

const MembershipSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Membership must belong to a member'],
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MembershipPlan',
      required: [true, 'Membership must be linked to a plan'],
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide start date'],
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: [true, 'Please provide end date / expiry date'],
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active',
      index: true,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    lastPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Method to verify if membership is currently expired based on date
MembershipSchema.methods.isExpired = function () {
  return new Date() > new Date(this.endDate);
};

module.exports = mongoose.model('Membership', MembershipSchema);
