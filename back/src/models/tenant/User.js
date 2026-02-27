// back/src/models/tenant/User.js - ✅ NEW (tenant version)
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // NO MORE tenantId (the database itself acts as the tenant)

  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    default: 'user'
  },

  domain: {
    type: String,
  },

  firstName: String,
  lastName: String,

  isActive: {
    type: Boolean,
    default: true
  },

  lastLogin: Date,

  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { timestamps: true });

// ✅ Email unique in this tenant
userSchema.index({ email: 1 }, { unique: true });

// ✅ Factory pattern - we export a function
module.exports = (connection) => connection.model('User', userSchema);