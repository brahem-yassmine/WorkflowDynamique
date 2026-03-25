const mongoose = require('mongoose');

module.exports = function(masterConn) {
  const platformSettingsSchema = new mongoose.Schema({
    platformName: {
      type: String,
      default: 'Axia Solutions'
    },
    supportEmail: {
      type: String,
      default: 'nexus@axia.global'
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    }
  }, { timestamps: true });

  return masterConn.model('PlatformSettings', platformSettingsSchema);
};
