// back/src/models/master/Plan.js
const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'D' },
  interval: { type: String, default: 'month' },
  trialDays: { type: Number, default: 0 },
  features: {
    maxUsers: { type: Number, default: 5 },
    maxWorkflows: { type: Number, default: 5 },
    maxNodes: { type: Number, default: 999999 }, // Flow Nodes limit
    maxStaff: { type: Number, default: 5 },
    maxLocations: { type: Number, default: 5 },
    analysis: { type: String, default: 'Fixed' },
    reports: { type: Boolean, default: false },
    aiSupport: { type: Boolean, default: false },
    customSupport: { type: Boolean, default: false }
  },
  description: { type: String },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  collection: 'plans'
});

// EXPORT as a function that takes the connection
module.exports = (connection) => {
  return connection.model('Plan', planSchema);
};