// back/src/models/tenant/User.js - ✅ NOUVEAU (version tenant)
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // PLUS DE tenantId (c'est la base qui fait office de tenant)

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

  lastLogin: Date
}, { timestamps: true });

// ✅ Email unique dans ce tenant
userSchema.index({ email: 1 }, { unique: true });

// ✅ Factory pattern - on exporte une fonction
module.exports = (connection) => connection.model('User', userSchema);