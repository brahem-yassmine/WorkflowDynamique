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

  specificRole: {
    type: String,
    default: ''
  },

  specificRoleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  },



  domain: {
    type: String,
  },

  domainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain'
  },

  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  },

  firstName: String,
  lastName: String,

  isActive: {
    type: Boolean,
    default: true
  },

  tokenVersion: {
    type: Number,
    default: 1
  },

  lastLogin: Date,

  hasSelectedPlan: {
    type: Boolean,
    default: false
  },
  selectedPlan: String,

  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { timestamps: true });

// ✅ Email unique in this tenant
userSchema.index({ email: 1 }, { unique: true });

// ✅ Factory pattern - we export a function
module.exports = (connection) => connection.model('User', userSchema);