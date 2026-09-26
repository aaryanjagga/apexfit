const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Attendance must belong to a member'],
      index: true,
    },
    checkIn: {
      type: Date,
      default: Date.now,
      required: true,
    },
    checkOut: {
      type: Date,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    method: {
      type: String,
      enum: ['manual', 'qr', 'kiosk', 'geofence_gps'],
      default: 'manual',
    },
    membershipStatusAtCheckIn: {
      type: String,
      enum: ['active', 'expired', 'none'],
      default: 'active',
    },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    distanceMeters: {
      type: Number,
    },
    verifiedLocation: {
      type: Boolean,
      default: false,
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

// Auto-fill date YYYY-MM-DD
AttendanceSchema.pre('validate', function () {
  if (!this.date && this.checkIn) {
    this.date = new Date(this.checkIn).toISOString().split('T')[0];
  }
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
