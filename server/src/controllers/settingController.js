const GymSetting = require('../models/GymSetting');
const AuditLog = require('../models/AuditLog');

// Default initial gym location (Bangalore Flagship)
const DEFAULT_SETTING = {
  name: 'ApexFit Flagship Club',
  address: '100 Feet Road, HAL 2nd Stage, Indiranagar, Bangalore, Karnataka 560038',
  latitude: 12.9716,
  longitude: 77.5946,
  radiusMeters: 200,
  geofenceEnabled: true,
  allowSimulationForTesting: true,
};

// @desc    Get Gym Location & Geofence Settings
// @route   GET /api/settings/gym-location
// @access  Public (Members & Admins need to know gym coordinates to compute proximity)
const getGymLocation = async (req, res, next) => {
  try {
    let setting = await GymSetting.findOne();
    if (!setting) {
      setting = await GymSetting.create(DEFAULT_SETTING);
    }

    res.json({
      success: true,
      setting: {
        id: setting._id,
        name: setting.name,
        address: setting.address,
        latitude: setting.latitude,
        longitude: setting.longitude,
        radiusMeters: setting.radiusMeters,
        geofenceEnabled: setting.geofenceEnabled,
        allowSimulationForTesting: setting.allowSimulationForTesting,
        updatedAt: setting.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Gym Location & Geofence Settings
// @route   PUT /api/settings/gym-location
// @access  Private (Admin)
const updateGymLocation = async (req, res, next) => {
  try {
    const { name, address, latitude, longitude, radiusMeters, geofenceEnabled, allowSimulationForTesting } =
      req.body;

    let setting = await GymSetting.findOne();
    if (!setting) {
      setting = new GymSetting(DEFAULT_SETTING);
    }

    if (name !== undefined) setting.name = name;
    if (address !== undefined) setting.address = address;
    if (latitude !== undefined) setting.latitude = Number(latitude);
    if (longitude !== undefined) setting.longitude = Number(longitude);
    if (radiusMeters !== undefined) setting.radiusMeters = Number(radiusMeters);
    if (geofenceEnabled !== undefined) setting.geofenceEnabled = Boolean(geofenceEnabled);
    if (allowSimulationForTesting !== undefined)
      setting.allowSimulationForTesting = Boolean(allowSimulationForTesting);

    setting.updatedBy = req.admin?._id;
    setting.updatedAt = new Date();
    await setting.save();

    await AuditLog.create({
      adminId: req.admin?._id,
      action: 'GYM_LOCATION_GEOFENCE_UPDATED',
      targetType: 'System',
      targetId: setting._id.toString(),
      details: {
        latitude: setting.latitude,
        longitude: setting.longitude,
        radiusMeters: setting.radiusMeters,
        geofenceEnabled: setting.geofenceEnabled,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Gym location and geofence parameters updated successfully in MongoDB.',
      setting,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGymLocation,
  updateGymLocation,
};
