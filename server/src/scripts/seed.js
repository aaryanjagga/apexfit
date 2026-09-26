const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const Admin = require('../models/Admin');
const MembershipPlan = require('../models/MembershipPlan');
const Member = require('../models/Member');
const Membership = require('../models/Membership');
const Payment = require('../models/Payment');
const Trainer = require('../models/Trainer');
const Attendance = require('../models/Attendance');
const AuditLog = require('../models/AuditLog');

const seedData = async () => {
  try {
    console.log('🌱 Starting database seed...');
    await connectDB();

    // 1. Clear existing data
    await Admin.deleteMany({});
    await MembershipPlan.deleteMany({});
    await Member.deleteMany({});
    await Membership.deleteMany({});
    await Payment.deleteMany({});
    await Trainer.deleteMany({});
    await Attendance.deleteMany({});
    await AuditLog.deleteMany({});
    console.log('🧹 Cleared existing database records.');

    // 2. Seed Admin
    const admin = await Admin.create({
      name: 'Gym Administrator',
      email: 'admin@apexfit.com',
      password: 'Admin@123456',
      role: 'superadmin',
    });
    console.log(`👤 Created Admin: ${admin.email} (Password: Admin@123456)`);

    // 3. Seed Membership Plans
    const plans = await MembershipPlan.insertMany([
      {
        name: 'Monthly Fitness Starter',
        durationDays: 30,
        price: 1999,
        currency: 'INR',
        category: 'Gym Access',
        description: 'Ideal for getting started with your fitness transformation.',
        features: [
          'Full Gym Floor & Free Weights Access',
          'Cardio & Functional Training Zone',
          'Locker & Shower Facility',
          '1 Complimentary Fitness Assessment',
          'Mobile Pass Verification',
        ],
        isPopular: false,
        displayOrder: 1,
        isActive: true,
      },
      {
        name: 'Quarterly Power Pass',
        durationDays: 90,
        price: 4999,
        currency: 'INR',
        category: 'Gym Access',
        description: 'Our most popular plan for consistent muscle building and stamina.',
        features: [
          'All Monthly Starter Benefits',
          'Unlimited High-Intensity Functional Training',
          'Steam & Sauna Room Access',
          '2 Personal Training Consultation Sessions',
          'Diet & Nutrition Roadmap',
          'Priority Guest Pass (2 per quarter)',
        ],
        isPopular: true,
        displayOrder: 2,
        isActive: true,
      },
      {
        name: 'Annual Elite VIP Access',
        durationDays: 365,
        price: 14999,
        currency: 'INR',
        category: 'VIP Elite',
        description: 'Complete all-access VIP fitness membership with premier club perks.',
        features: [
          '365 Days 24/7 Access to All Zones',
          'Free Locker Reservation',
          '6 1-on-1 Certified Personal Trainer Sessions',
          'Monthly Body Composition Analysis (InBody)',
          'Unlimited Steam, Sauna & Recovery Lounge',
          'ApexFit Signature Merchandise Kit',
        ],
        isPopular: false,
        displayOrder: 3,
        isActive: true,
      },
      {
        name: 'Student Semester Pass',
        durationDays: 120,
        price: 3499,
        currency: 'INR',
        category: 'Student Pass',
        description: 'Budget-friendly pass tailored for college students and youth athletes.',
        features: [
          'Gym Floor & Cardio Zone Access',
          'Valid Student ID required at check-in',
          'Locker Access',
          'Open Hours 6:00 AM – 5:00 PM',
        ],
        isPopular: false,
        displayOrder: 4,
        isActive: true,
      },
    ]);
    console.log(`📋 Created ${plans.length} Membership Plans.`);

    // 4. Seed Trainers
    const trainers = await Trainer.insertMany([
      {
        name: 'Vikram Sengupta',
        email: 'vikram@apexfit.com',
        phone: '+91 98765 43210',
        specialization: 'Strength & Conditioning',
        experienceYears: 7,
        bio: 'Former national powerlifter specializing in compound strength, hypertrophy, and posture correction.',
        isActive: true,
      },
      {
        name: 'Ananya Sharma',
        email: 'ananya@apexfit.com',
        phone: '+91 98765 43211',
        specialization: 'CrossFit & Functional HIIT',
        experienceYears: 5,
        bio: 'Certified CrossFit L2 trainer with extensive background in metabolic conditioning and endurance.',
        isActive: true,
      },
      {
        name: 'Rohan Mehra',
        email: 'rohan@apexfit.com',
        phone: '+91 98765 43212',
        specialization: 'Body Composition & Fat Loss',
        experienceYears: 6,
        bio: 'Kinesiology graduate dedicated to scientific nutrition planning and transformative body recomposition.',
        isActive: true,
      },
    ]);
    console.log(`🏋️ Created ${trainers.length} Trainers.`);

    // 5. Seed Members
    // Member 1: Active Member
    const member1 = await Member.create({
      memberCode: 'AF-1001',
      name: 'Arjun Verma',
      email: 'arjun@example.com',
      phone: '+91 98111 22233',
      gender: 'Male',
      address: 'Indiranagar, Bangalore',
      status: 'active',
      notes: 'Focusing on strength training.',
    });

    // Active membership for Member 1
    const activeStartDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    const activeEndDate = new Date(Date.now() + 80 * 24 * 60 * 60 * 1000); // 80 days remaining
    const payment1 = await Payment.create({
      memberId: member1._id,
      planId: plans[1]._id,
      amount: plans[1].price,
      currency: 'INR',
      razorpayOrderId: 'order_seed_001',
      razorpayPaymentId: 'pay_seed_001',
      razorpaySignature: 'simulated_valid_sig_seed_001',
      paymentStatus: 'success',
      paymentMethod: 'razorpay',
      receiptNumber: 'REC-SEED-001',
    });

    const membership1 = await Membership.create({
      memberId: member1._id,
      planId: plans[1]._id,
      startDate: activeStartDate,
      endDate: activeEndDate,
      status: 'active',
      lastPaymentId: payment1._id,
    });
    payment1.membershipId = membership1._id;
    await payment1.save();

    // Member 2: Expired Member (demonstrating expired pass detection)
    const member2 = await Member.create({
      memberCode: 'AF-1002',
      name: 'Priya Nair',
      email: 'priya@example.com',
      phone: '+91 98222 33344',
      gender: 'Female',
      address: 'Koramangala, Bangalore',
      status: 'expired',
      notes: 'Pass expired recently. Renewal pending.',
    });

    const expiredStartDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000); // 40 days ago
    const expiredEndDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // expired 10 days ago
    const payment2 = await Payment.create({
      memberId: member2._id,
      planId: plans[0]._id,
      amount: plans[0].price,
      currency: 'INR',
      razorpayOrderId: 'order_seed_002',
      razorpayPaymentId: 'pay_seed_002',
      razorpaySignature: 'simulated_valid_sig_seed_002',
      paymentStatus: 'success',
      paymentMethod: 'razorpay',
      receiptNumber: 'REC-SEED-002',
    });

    const membership2 = await Membership.create({
      memberId: member2._id,
      planId: plans[0]._id,
      startDate: expiredStartDate,
      endDate: expiredEndDate,
      status: 'expired',
      lastPaymentId: payment2._id,
    });
    payment2.membershipId = membership2._id;
    await payment2.save();

    // Member 3: New Member (inactive, no pass yet)
    const member3 = await Member.create({
      memberCode: 'AF-1003',
      name: 'Kabir Das',
      email: 'kabir@example.com',
      phone: '+91 98333 44455',
      gender: 'Male',
      address: 'HSR Layout, Bangalore',
      status: 'inactive',
      notes: 'Interested in joining next week.',
    });

    // 6. Seed Attendance Logs
    await Attendance.create({
      memberId: member1._id,
      checkIn: new Date(Date.now() - 2 * 60 * 60 * 1000),
      checkOut: new Date(Date.now() - 30 * 60 * 1000),
      date: new Date().toISOString().split('T')[0],
      method: 'kiosk',
      membershipStatusAtCheckIn: 'active',
      notes: 'Regular workout session',
    });

    // 7. Seed Initial Audit Log
    await AuditLog.create({
      adminId: admin._id,
      action: 'SYSTEM_INITIALIZED',
      targetType: 'System',
      targetId: 'APEXFIT_INIT',
      details: {
        plansCount: plans.length,
        trainersCount: trainers.length,
        initialMembersCount: 3,
      },
    });

    console.log('✅ Database successfully seeded!');
    console.log('=======================================================');
    console.log('🔑 ADMIN LOGIN CREDENTIALS:');
    console.log('   Email:    admin@apexfit.com');
    console.log('   Password: Admin@123456');
    console.log('   URL:      http://localhost:5173/admin (or /admin/login)');
    console.log('-------------------------------------------------------');
    console.log('👥 SAMPLE MEMBERS:');
    console.log('   Active:   AF-1001 (arjun@example.com / +91 98111 22233)');
    console.log('   Expired:  AF-1002 (priya@example.com / +91 98222 33344)');
    console.log('   New:      AF-1003 (kabir@example.com / +91 98333 44455)');
    console.log('=======================================================');

    await disconnectDB();
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
