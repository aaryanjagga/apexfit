const mongoose = require('mongoose');

const GymSettingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: 'ApexFit Flagship Club',
      trim: true,
    },
    address: {
      type: String,
      default: '100 Feet Road, Indiranagar, Bangalore, Karnataka 560038',
      trim: true,
    },
    latitude: {
      type: Number,
      required: true,
      default: 12.9716, // Default Bangalore coordinates
    },
    longitude: {
      type: Number,
      required: true,
      default: 77.5946,
    },
    radiusMeters: {
      type: Number,
      required: true,
      default: 200, // 200 meters default check-in radius
      min: [10, 'Radius must be at least 10 meters'],
      max: [50000, 'Radius cannot exceed 50 kilometers'],
    },
    geofenceEnabled: {
      type: Boolean,
      default: true,
    },
    allowSimulationForTesting: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('GymSetting', GymSettingSchema);
