const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Models for auto-seed verification
const Admin = require('./models/Admin');
const MembershipPlan = require('./models/MembershipPlan');
const Trainer = require('./models/Trainer');
const Member = require('./models/Member');
const Membership = require('./models/Membership');
const Payment = require('./models/Payment');

// Route imports
const authRoutes = require('./routes/authRoutes');
const memberRoutes = require('./routes/memberRoutes');
const planRoutes = require('./routes/planRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const auditRoutes = require('./routes/auditRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-friendly permissive CORS
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'ApexFit Gym Management Express API',
    database: 'MongoDB',
    paymentProvider: 'Razorpay',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', require('./routes/settingRoutes'));

// 404 Handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Auto-seed helper if database is fresh
const autoSeedIfEmpty = async () => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      console.log('🌱 [Auto-Seed] Initializing default administrator and initial plans...');
      
      const admin = await Admin.create({
        name: 'Gym Administrator',
        email: 'admin@apexfit.com',
        password: 'Admin@123456',
        role: 'superadmin',
      });
      console.log(`👤 [Auto-Seed] Admin ready: ${admin.email} (Password: Admin@123456)`);

      const planCount = await MembershipPlan.countDocuments();
      if (planCount === 0) {
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
              '2 Personal Training Sessions',
              'Diet Roadmap',
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
              'Unlimited Steam, Sauna & Recovery Lounge',
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
            description: 'Budget-friendly pass tailored for college students.',
            features: ['Gym Floor & Cardio Zone Access', 'Valid Student ID required at check-in'],
            isPopular: false,
            displayOrder: 4,
            isActive: true,
          },
        ]);
        console.log(`📋 [Auto-Seed] ${plans.length} Membership Plans created.`);

        // Trainers
        await Trainer.insertMany([
          {
            name: 'Vikram Sengupta',
            email: 'vikram@apexfit.com',
            phone: '+91 98765 43210',
            specialization: 'Strength & Conditioning',
            experienceYears: 7,
            bio: 'Former national powerlifter specializing in compound strength.',
            isActive: true,
          },
          {
            name: 'Ananya Sharma',
            email: 'ananya@apexfit.com',
            phone: '+91 98765 43211',
            specialization: 'CrossFit & Functional HIIT',
            experienceYears: 5,
            bio: 'Certified CrossFit L2 trainer with extensive background in conditioning.',
            isActive: true,
          },
        ]);

        // Sample Active Member
        const m1 = await Member.create({
          memberCode: 'AF-1001',
          name: 'Arjun Verma',
          email: 'arjun@example.com',
          phone: '+91 98111 22233',
          gender: 'Male',
          status: 'active',
        });
        const p1 = await Payment.create({
          memberId: m1._id,
          planId: plans[1]._id,
          amount: plans[1].price,
          currency: 'INR',
          razorpayOrderId: 'order_init_001',
          razorpayPaymentId: 'pay_init_001',
          paymentStatus: 'success',
          receiptNumber: 'REC-INIT-001',
        });
        await Membership.create({
          memberId: m1._id,
          planId: plans[1]._id,
          startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000),
          status: 'active',
          lastPaymentId: p1._id,
        });

        // Sample Expired Member
        const m2 = await Member.create({
          memberCode: 'AF-1002',
          name: 'Priya Nair',
          email: 'priya@example.com',
          phone: '+91 98222 33344',
          gender: 'Female',
          status: 'expired',
        });
        await Membership.create({
          memberId: m2._id,
          planId: plans[0]._id,
          startDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          status: 'expired',
        });
        console.log('👥 [Auto-Seed] Sample members (AF-1001 Active, AF-1002 Expired) ready.');
      }
    }
  } catch (seedErr) {
    console.warn('⚠️ [Auto-Seed] Non-fatal auto-seed note:', seedErr.message);
  }
};

let serverInstance = null;

const startServer = async () => {
  await connectDB();
  await autoSeedIfEmpty();
  serverInstance = app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🏋️  ApexFit Gym Management Server is running!`);
    console.log(`📡  Port: ${PORT}`);
    console.log(`🌐  API URL: http://127.0.0.1:${PORT}/api`);
    console.log(`🔐  JWT Authentication: Active`);
    console.log(`💳  Razorpay Integration: Active`);
    console.log(`=======================================================`);
  });
  return serverInstance;
};

// Start if executed directly
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
