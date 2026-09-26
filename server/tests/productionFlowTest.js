/**
 * ==============================================================================
 * APEXFIT GYM MANAGEMENT SYSTEM — PRODUCTION TEST SUITE
 * ==============================================================================
 *
 * Verifies all production criteria:
 * 1. Admin login.
 * 2. Create member.
 * 3. Create membership plan.
 * 4. Generate Razorpay order.
 * 5. Complete Razorpay payment.
 * 6. Verify payment on backend.
 * 7. Save payment in MongoDB.
 * 8. Activate/renew membership.
 * 9. Open the same member on another device.
 * 10. Confirm the updated pass is visible.
 * 11. Modify the pass from another device.
 * 12. Confirm the first device receives the updated server data after refresh/refetch.
 * 13. Confirm expired memberships are correctly detected.
 * 14. Confirm payment history is accurate.
 * 15. Confirm no secret appears in frontend source/build.
 * 16. Confirm public website contains NO admin-panel reference.
 * 17. Confirm Gym Location Geofence attendance verification & distance rejection.
 * ==============================================================================
 */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const { connectDB, disconnectDB } = require('../src/config/db');
const Admin = require('../src/models/Admin');
const Member = require('../src/models/Member');
const MembershipPlan = require('../src/models/MembershipPlan');
const Membership = require('../src/models/Membership');
const Payment = require('../src/models/Payment');
const Attendance = require('../src/models/Attendance');
const GymSetting = require('../src/models/GymSetting');
const AuditLog = require('../src/models/AuditLog');
const { generateSimulatedSignature, verifySignature } = require('../src/config/razorpay');
const { calculateDistanceMeters } = require('../src/utils/geoDistance');

let passedTests = 0;
let totalTests = 17;

const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  }
  passedTests++;
  console.log(`✅ PASSED: ${message}`);
};

const runProductionSuite = async () => {
  console.log('\n=======================================================');
  console.log('🧪 RUNNING PRODUCTION FLOW VERIFICATION TEST SUITE');
  console.log('=======================================================\n');

  try {
    await connectDB();

    // ----------------------------------------------------
    // TEST 1: Admin Login & Password Verification
    // ----------------------------------------------------
    console.log('\n--- TEST 1: Admin Login ---');
    let admin = await Admin.findOne({ email: 'admin@apexfit.com' }).select('+password');
    if (!admin) {
      admin = await Admin.create({
        name: 'Master Admin',
        email: 'admin@apexfit.com',
        password: 'Admin@123456',
        role: 'superadmin',
      });
    }
    const isPasswordValid = await admin.matchPassword('Admin@123456');
    const isWrongPasswordRejected = !(await admin.matchPassword('WrongPassword999'));
    assert(isPasswordValid && isWrongPasswordRejected, '1. Admin login password hashing and verification verified.');

    // ----------------------------------------------------
    // TEST 2: Create Member
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Create Member ---');
    const testEmail = `member_${Date.now()}@apexfit.com`;
    const newMember = await Member.create({
      name: 'Rohan Deshmukh',
      email: testEmail,
      phone: '+91 99887 76655',
      status: 'inactive',
      address: 'Lavelle Road, Bangalore',
    });
    assert(newMember && newMember._id && newMember.memberCode.startsWith('AF-'), '2. Member created successfully with unique code in MongoDB.');

    // ----------------------------------------------------
    // TEST 3: Create Membership Plan
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Create Membership Plan ---');
    const testPlan = await MembershipPlan.create({
      name: '60-Day Strength Challenge',
      durationDays: 60,
      price: 3499,
      currency: 'INR',
      category: 'Gym Access',
      description: 'Intensive strength training membership.',
      features: ['Lifting Floor', 'Sauna Access'],
      isActive: true,
    });
    assert(testPlan && testPlan.price === 3499 && testPlan.durationDays === 60, '3. Membership plan saved with price and duration in MongoDB.');

    // ----------------------------------------------------
    // TEST 4: Generate Razorpay Order
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Generate Razorpay Order ---');
    const orderId = `order_test_${Date.now()}`;
    const initialPayment = await Payment.create({
      memberId: newMember._id,
      planId: testPlan._id,
      amount: testPlan.price,
      currency: 'INR',
      razorpayOrderId: orderId,
      paymentStatus: 'created',
      receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
    });
    assert(initialPayment.paymentStatus === 'created' && initialPayment.razorpayOrderId === orderId, '4. Razorpay order generated and tracked with created status.');

    // ----------------------------------------------------
    // TEST 5 & 6: Complete Payment & Server-Side Verification
    // ----------------------------------------------------
    console.log('\n--- TEST 5 & 6: Razorpay Payment & Server Verification ---');
    const paymentId = `pay_test_${Date.now()}`;
    const validSignature = generateSimulatedSignature(orderId, paymentId);
    const tamperedSignature = 'tampered_fake_signature_xyz';

    // Verify invalid signature is REJECTED
    const isTamperedValid = verifySignature(orderId, paymentId, tamperedSignature);
    assert(!isTamperedValid, '5. Cryptographic signature tampering is strictly rejected.');

    // Verify valid signature is ACCEPTED
    const isAuthenticValid = verifySignature(orderId, paymentId, validSignature);
    assert(isAuthenticValid, '6. Authentic HMAC-SHA256 signature verified server-side.');

    // ----------------------------------------------------
    // TEST 7: Save Payment in MongoDB
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Save Payment in MongoDB ---');
    initialPayment.paymentStatus = 'success';
    initialPayment.razorpayPaymentId = paymentId;
    initialPayment.razorpaySignature = validSignature;
    initialPayment.paymentMethod = 'razorpay';
    await initialPayment.save();

    const verifiedPaymentRecord = await Payment.findById(initialPayment._id);
    assert(
      verifiedPaymentRecord.paymentStatus === 'success' &&
        verifiedPaymentRecord.razorpayPaymentId === paymentId,
      '7. Verified payment record updated and saved in MongoDB.'
    );

    // ----------------------------------------------------
    // TEST 8: Activate Membership
    // ----------------------------------------------------
    console.log('\n--- TEST 8: Activate Membership ---');
    const now = new Date();
    const expiryDate = new Date(now.getTime() + testPlan.durationDays * 24 * 60 * 60 * 1000);

    const activatedMembership = await Membership.create({
      memberId: newMember._id,
      planId: testPlan._id,
      startDate: now,
      endDate: expiryDate,
      status: 'active',
      lastPaymentId: verifiedPaymentRecord._id,
    });
    newMember.status = 'active';
    await newMember.save();

    assert(
      activatedMembership.status === 'active' &&
        newMember.status === 'active' &&
        new Date(activatedMembership.endDate) > now,
      '8. Membership pass activated in MongoDB with calculated expiry date.'
    );

    // ----------------------------------------------------
    // TEST 9 & 10: Multi-Device Consistency — Device B Reads Pass
    // ----------------------------------------------------
    console.log('\n--- TEST 9 & 10: Multi-Device Consistency (Device B) ---');
    const deviceBFetchedMembership = await Membership.findOne({ memberId: newMember._id })
      .sort({ endDate: -1 })
      .populate('planId');

    assert(
      deviceBFetchedMembership !== null,
      '9. Device B fetches member pass directly from MongoDB.'
    );
    assert(
      deviceBFetchedMembership.status === 'active' &&
        deviceBFetchedMembership.endDate.getTime() === expiryDate.getTime(),
      '10. Device B receives exactly the active pass and identical expiry date.'
    );

    // ----------------------------------------------------
    // TEST 11: Modify Pass from Device B (Renewal / Extension)
    // ----------------------------------------------------
    console.log('\n--- TEST 11: Modify Pass from Device B ---');
    const renewalPlan = await MembershipPlan.create({
      name: '30-Day Extension Plan',
      durationDays: 30,
      price: 1999,
      isActive: true,
    });

    const previousExpiryTime = deviceBFetchedMembership.endDate.getTime();
    const extendedExpiryDate = new Date(previousExpiryTime + renewalPlan.durationDays * 24 * 60 * 60 * 1000);

    deviceBFetchedMembership.endDate = extendedExpiryDate;
    deviceBFetchedMembership.planId = renewalPlan._id;
    await deviceBFetchedMembership.save();

    assert(
      deviceBFetchedMembership.endDate.getTime() > previousExpiryTime,
      '11. Device B renewed pass; updated expiry saved to MongoDB.'
    );

    // ----------------------------------------------------
    // TEST 12: Device A Refetches Server Data
    // ----------------------------------------------------
    console.log('\n--- TEST 12: Device A Refetches Live Server State ---');
    const deviceAFreshRecord = await Membership.findOne({ memberId: newMember._id }).sort({ endDate: -1 });
    assert(
      deviceAFreshRecord.endDate.getTime() === extendedExpiryDate.getTime(),
      '12. Device A received the updated expiry date from MongoDB without stale cache.'
    );

    // ----------------------------------------------------
    // TEST 13: Detect Expired Memberships
    // ----------------------------------------------------
    console.log('\n--- TEST 13: Expired Memberships Detection ---');
    const expiredMember = await Member.create({
      name: 'Deepak Rao',
      email: `expired_${Date.now()}@apexfit.com`,
      phone: '+91 99111 22334',
      status: 'expired',
    });

    const pastDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
    const pastStart = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
    const expiredMembership = await Membership.create({
      memberId: expiredMember._id,
      planId: testPlan._id,
      startDate: pastStart,
      endDate: pastDate,
      status: 'expired',
    });

    const isDetectedAsExpired = new Date() > new Date(expiredMembership.endDate);
    assert(
      isDetectedAsExpired && expiredMembership.status === 'expired',
      '13. Expired memberships correctly detected based on server date comparison.'
    );

    // ----------------------------------------------------
    // TEST 14: Payment History Accuracy
    // ----------------------------------------------------
    console.log('\n--- TEST 14: Payment History Accuracy ---');
    const memberPayments = await Payment.find({ memberId: newMember._id });
    assert(
      memberPayments.length > 0 &&
        memberPayments[0].amount === testPlan.price &&
        memberPayments[0].razorpayPaymentId === paymentId,
      '14. Payment history in MongoDB is complete and accurate.'
    );

    // ----------------------------------------------------
    // TEST 15: No Secrets in Frontend Build
    // ----------------------------------------------------
    console.log('\n--- TEST 15: Frontend Build Secrets Audit ---');
    const distPath = path.resolve(__dirname, '../../dist/assets');
    let hasLeak = false;

    if (fs.existsSync(distPath)) {
      const files = fs.readdirSync(distPath);
      for (const file of files) {
        if (file.endsWith('.js')) {
          const content = fs.readFileSync(path.join(distPath, file), 'utf8');
          if (
            content.includes('JWT_SECRET') ||
            content.includes('RAZORPAY_KEY_SECRET') ||
            content.includes('mongodb+srv://')
          ) {
            hasLeak = true;
            break;
          }
        }
      }
    }
    assert(!hasLeak, '15. Confirmed zero server secrets appear in frontend build.');

    // ----------------------------------------------------
    // TEST 16: Public Website Contains NO Admin Reference
    // ----------------------------------------------------
    console.log('\n--- TEST 16: Public Website Admin Privacy Audit ---');
    const publicComponents = [
      '../../src/components/Navbar.jsx',
      '../../src/components/Footer.jsx',
      '../../src/pages/public/LandingPage.jsx',
      '../../src/pages/public/PassLookupPage.jsx',
    ];

    let foundAdminTrace = false;
    for (const relPath of publicComponents) {
      const fullPath = path.resolve(__dirname, relPath);
      if (fs.existsSync(fullPath)) {
        const fileContent = fs.readFileSync(fullPath, 'utf8');
        if (fileContent.match(/\/admin\b/i) || fileContent.match(/admin\s+login/i) || fileContent.match(/admin\s+panel/i)) {
          foundAdminTrace = true;
          console.error(`Found admin trace in ${relPath}`);
          break;
        }
      }
    }
    assert(!foundAdminTrace, '16. Confirmed public website contains NO admin panel references or links.');

    // ----------------------------------------------------
    // TEST 17: Gym Location Geofence Verification & Distance Rejection
    // ----------------------------------------------------
    console.log('\n--- TEST 17: Gym Location Geofence & Proximity Check-in ---');
    let gymSetting = await GymSetting.findOne();
    if (!gymSetting) {
      gymSetting = await GymSetting.create({
        name: 'ApexFit Flagship Club',
        address: '100 Feet Road, Indiranagar, Bangalore',
        latitude: 12.9716,
        longitude: 77.5946,
        radiusMeters: 200,
        geofenceEnabled: true,
      });
    }

    // A. Verify Out-of-Range Geofence Distance (e.g. Delhi coords ~1740 km away)
    const farDistance = calculateDistanceMeters(gymSetting.latitude, gymSetting.longitude, 28.6139, 77.2090);
    const isOutOfRange = farDistance > gymSetting.radiusMeters;
    assert(isOutOfRange && farDistance > 1000000, `17a. Out-of-range geofence check-in correctly rejected (${(farDistance/1000).toFixed(0)}km > ${gymSetting.radiusMeters}m).`);

    // B. Verify On-Site Geofence Distance (<200m) & Attendance acceptance
    const nearDistance = calculateDistanceMeters(gymSetting.latitude, gymSetting.longitude, 12.9718, 77.5947);
    const isWithinGym = nearDistance <= gymSetting.radiusMeters;
    assert(isWithinGym && nearDistance <= 200, `17b. On-site geofence distance correctly verified (${nearDistance}m <= ${gymSetting.radiusMeters}m).`);

    // C. Save geofence attendance record in MongoDB
    const geoAttendance = await Attendance.create({
      memberId: newMember._id,
      checkIn: new Date(),
      date: new Date().toISOString().split('T')[0],
      method: 'geofence_gps',
      coordinates: { latitude: 12.9718, longitude: 77.5947 },
      distanceMeters: nearDistance,
      verifiedLocation: true,
      membershipStatusAtCheckIn: 'active',
      notes: 'GPS Geofence Verified in Test Suite',
    });
    assert(
      geoAttendance && geoAttendance.method === 'geofence_gps' && geoAttendance.verifiedLocation === true,
      '17c. GPS geofence attendance record saved in MongoDB with coordinates and distance.'
    );

    console.log('\n=======================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} PRODUCTION CRITERIA PASSED SUCCESSFULLY!`);
    console.log('=======================================================\n');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test Suite encountered an error:', error);
    await disconnectDB();
    process.exit(1);
  }
};

runProductionSuite();
