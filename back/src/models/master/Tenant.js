// back/src/models/master/Tenant.js
const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  domain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

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

  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'archived'],
    default: 'active'
  },

  archivedAt: {
    type: Date,
    default: null
  },

  adminName: {
    type: String,
    default: function () {
      return this.email ? this.email.split('@')[0] : 'Admin';
    }
  },

  industry: {
    type: String,
    enum: [
      'Construction',
      'Tech/IT',
      'Business',
      'Healthcare',
      'Other'
    ],
    default: 'Other'
  },

  selectedPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    default: null
  },

  currentSubscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null
  },

  planDetails: {
    name: String,
    code: String,
    price: Number,
    currency: String,
    features: mongoose.Schema.Types.Mixed
  },

  subscription: {
    status: { type: String, default: 'inactive' },
    billingCycle: { type: String, default: 'monthly' },
    currentPeriodStart: Date,
    currentPeriodEnd: Date
  },

  databaseName: {
    type: String,
    required: true,
    unique: true
  },

  databaseUri: {
    type: String,
    required: true
  }

}, {
  timestamps: true,
  collection: 'tenants'
});

// EXPORT as a function that takes the connection
module.exports = (connection) => {
  return connection.model('Tenant', tenantSchema);
};