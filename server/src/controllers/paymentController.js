const Payment = require('../models/Payment');
const Membership = require('../models/Membership');
const MembershipPlan = require('../models/MembershipPlan');
const Member = require('../models/Member');
const AuditLog = require('../models/AuditLog');
const {
  razorpayInstance,
  verifySignature,
  generateSimulatedSignature,
  isPlaceholderKey,
} = require('../config/razorpay');

// @desc    Create Razorpay Order
// @route   POST /api/payments/create-order
// @access  Public / Authenticated
const createOrder = async (req, res, next) => {
  try {
    const { planId, memberId } = req.body;

    if (!planId || !memberId) {
      return res.status(400).json({
        success: false,
        message: 'Both planId and memberId are required to initiate payment.',
      });
    }

    const plan = await MembershipPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Membership plan not found.',
      });
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member record not found.',
      });
    }

    const amountInPaise = Math.round(plan.price * 100);
    const receipt = `rcpt_${Date.now().toString().slice(-8)}_${Math.floor(100 + Math.random() * 900)}`;

    let order;

    // If real Razorpay keys are configured and instance is live:
    if (razorpayInstance) {
      try {
        order = await razorpayInstance.orders.create({
          amount: amountInPaise,
          currency: plan.currency || 'INR',
          receipt,
          notes: {
            memberId: member._id.toString(),
            memberName: member.name,
            planId: plan._id.toString(),
            planName: plan.name,
          },
        });
      } catch (rpErr) {
        console.error('Razorpay API create order error:', rpErr);
        return res.status(500).json({
          success: false,
          message: `Razorpay order creation failed: ${rpErr.error?.description || rpErr.message}`,
        });
      }
    } else {
      // Simulation / Test sandbox mode when keys are placeholders:
      const simulatedOrderId = `order_sim_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      order = {
        id: simulatedOrderId,
        entity: 'order',
        amount: amountInPaise,
        currency: plan.currency || 'INR',
        receipt,
        status: 'created',
        notes: {
          memberId: member._id.toString(),
          memberName: member.name,
          planId: plan._id.toString(),
          planName: plan.name,
        },
      };
    }

    // Save initial Payment record in MongoDB with 'created' status
    const payment = await Payment.create({
      memberId: member._id,
      planId: plan._id,
      amount: plan.price,
      currency: plan.currency || 'INR',
      razorpayOrderId: order.id,
      paymentStatus: 'created',
      receiptNumber: receipt,
      notes: {
        planName: plan.name,
        durationDays: plan.durationDays,
      },
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      isSimulation: isPlaceholderKey,
      plan: {
        id: plan._id,
        name: plan.name,
        price: plan.price,
        durationDays: plan.durationDays,
      },
      member: {
        id: member._id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        memberCode: member.memberCode,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay Signature & Activate/Renew Membership
// @route   POST /api/payments/verify
// @access  Public / Authenticated (Protected by cryptographic signature check)
const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      memberId,
      planId,
      paymentMethod = 'razorpay',
    } = req.body;

    // Validate mandatory payload
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Missing Razorpay verification tokens (order_id, payment_id, or signature).',
      });
    }

    // 1. Find the corresponding payment record in MongoDB
    const payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'No payment record found matching this Razorpay order ID in MongoDB.',
      });
    }

    // If payment was already verified and processed, return existing state safely
    if (payment.paymentStatus === 'success') {
      const existingMembership = await Membership.findById(payment.membershipId).populate('planId');
      return res.json({
        success: true,
        message: 'Payment has already been verified and processed.',
        payment,
        membership: existingMembership,
      });
    }

    // 2. SERVER-SIDE CRYPTOGRAPHIC SIGNATURE VERIFICATION
    const isValidSignature = verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isValidSignature) {
      // Mark payment as failed in MongoDB
      payment.paymentStatus = 'failed';
      payment.razorpayPaymentId = razorpayPaymentId;
      payment.razorpaySignature = razorpaySignature;
      payment.failureReason = 'Cryptographic signature mismatch. Unauthorized tampering suspected.';
      await payment.save();

      await AuditLog.create({
        action: 'PAYMENT_SIGNATURE_VERIFICATION_FAILED',
        targetType: 'Payment',
        targetId: payment._id.toString(),
        details: { razorpayOrderId, razorpayPaymentId },
        ipAddress: req.ip,
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid Razorpay signature. Server-side payment verification failed.',
      });
    }

    // 3. Signature is VERIFIED! Update Payment in MongoDB
    payment.paymentStatus = 'success';
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.paymentMethod = paymentMethod;

    // 4. Fetch plan & member to determine membership dates
    const effectivePlanId = planId || payment.planId;
    const effectiveMemberId = memberId || payment.memberId;

    const plan = await MembershipPlan.findById(effectivePlanId);
    if (!plan) {
      throw new Error('Membership plan not found for payment activation.');
    }

    const member = await Member.findById(effectiveMemberId);
    if (!member) {
      throw new Error('Member not found for payment activation.');
    }

    // 5. Update or Create Membership with accurate multi-device expiration calculation
    const now = new Date();
    let membership = await Membership.findOne({ memberId: member._id }).sort({ endDate: -1 });

    let startDate;
    let endDate;

    if (membership && new Date(membership.endDate) > now && membership.status === 'active') {
      // Member has an active membership: RENEWAL / EXTENSION
      // Extend from current expiration date
      startDate = membership.startDate;
      const currentExpiry = new Date(membership.endDate);
      endDate = new Date(currentExpiry.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
      membership.endDate = endDate;
      membership.planId = plan._id;
      membership.status = 'active';
      membership.lastPaymentId = payment._id;
      await membership.save();
    } else {
      // Member is new or existing membership was expired: NEW ACTIVATION
      startDate = now;
      endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

      if (membership) {
        membership.startDate = startDate;
        membership.endDate = endDate;
        membership.planId = plan._id;
        membership.status = 'active';
        membership.lastPaymentId = payment._id;
        await membership.save();
      } else {
        membership = await Membership.create({
          memberId: member._id,
          planId: plan._id,
          startDate,
          endDate,
          status: 'active',
          lastPaymentId: payment._id,
        });
      }
    }

    // 6. Link Membership to Payment and save
    payment.membershipId = membership._id;
    await payment.save();

    // 7. Update Member status to active in MongoDB
    member.status = 'active';
    await member.save();

    // 8. Create Audit Log
    await AuditLog.create({
      adminId: req.admin?._id,
      action: 'PAYMENT_VERIFIED_MEMBERSHIP_ACTIVATED',
      targetType: 'Membership',
      targetId: membership._id.toString(),
      details: {
        memberId: member._id,
        memberName: member.name,
        planName: plan.name,
        amount: payment.amount,
        razorpayPaymentId,
        newExpiryDate: endDate,
      },
      ipAddress: req.ip,
    });

    const populatedMembership = await Membership.findById(membership._id).populate('planId');

    // 9. Return fresh server state with no-cache headers to enforce multi-device consistency
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    res.json({
      success: true,
      message: 'Payment verified and membership pass successfully activated/renewed.',
      payment,
      membership: populatedMembership,
      member: {
        id: member._id,
        name: member.name,
        memberCode: member.memberCode,
        status: member.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payment records (Admin)
// @route   GET /api/payments
// @access  Private (Admin)
const getPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.paymentStatus = status;
    }

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('memberId', 'name email phone memberCode')
      .populate('planId', 'name price durationDays');

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      payments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single payment receipt (Admin)
// @route   GET /api/payments/:id
// @access  Private (Admin)
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('memberId')
      .populate('planId')
      .populate('membershipId');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found.',
      });
    }

    res.json({
      success: true,
      payment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Simulate payment helper for local testing when Razorpay keys are not yet configured
// @route   POST /api/payments/simulate-checkout-success
// @access  Public (Only available when keys are in test/simulation mode)
const simulateCheckoutSuccess = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const paymentId = `pay_sim_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const signature = generateSimulatedSignature(orderId, paymentId);

    res.json({
      success: true,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getPayments,
  getPaymentById,
  simulateCheckoutSuccess,
};
