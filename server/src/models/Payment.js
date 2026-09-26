const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Payment must belong to a member'],
      index: true,
    },
    membershipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Membership',
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MembershipPlan',
      required: [true, 'Payment must specify a membership plan'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please provide payment amount'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    razorpayOrderId: {
      type: String,
      required: [true, 'Razorpay order ID is required'],
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      index: true,
    },
    razorpaySignature: {
      type: String,
    },
    paymentStatus: {
      type: String,
      enum: ['created', 'success', 'failed'],
      default: 'created',
      index: true,
    },
    paymentMethod: {
      type: String,
      default: 'razorpay',
    },
    receiptNumber: {
      type: String,
      index: true,
    },
    failureReason: {
      type: String,
    },
    notes: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate a readable receipt number
PaymentSchema.pre('save', function () {
  if (!this.receiptNumber) {
    this.receiptNumber = `REC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  }
});

module.exports = mongoose.model('Payment', PaymentSchema);
