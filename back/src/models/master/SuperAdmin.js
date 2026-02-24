// back/src/models/master/SuperAdmin.js
const mongoose = require('mongoose');

const superAdminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  firstName: { type: String, default: 'Super' },
  lastName: { type: String, default: 'Admin' },

  role: {
    type: String,
    default: 'super_admin',
    enum: ['super_admin']
  },

  lastLogin: Date,
  isActive: { type: Boolean, default: true }

}, {
  timestamps: true,
  collection: 'superadmins'
});

// EXPORT as a function that takes the connection
module.exports = (connection) => {
  return connection.model('SuperAdmin', superAdminSchema);
};