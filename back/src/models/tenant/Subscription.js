// back/src/models/tenant/Subscription.js - OPTIONAL
// If you want to keep a subscription history INSIDE the tenant
// But the source of truth remains in master/Tenant
const mongoose = require('mongoose');
const subscriptionSchema = new mongoose.Schema({
  // NO MORE tenantId
  planId: String, // just the plan ID (no MongoDB reference)
  planName: String,
  billingCycle: String,
  price: Number,
  status: String,
  startDate: Date,
  endDate: Date,

  // Reference to the user who performed the action
  selectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = (connection) => connection.model('Subscription', subscriptionSchema);