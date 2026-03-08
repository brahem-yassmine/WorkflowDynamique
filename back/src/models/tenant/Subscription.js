// back/src/models/tenant/Subscription.js - OPTIONAL
// If you want to keep a subscription history INSIDE the tenant
// But the source of truth remains in master/Tenant
const mongoose = require('mongoose');
const subscriptionSchema = new mongoose.Schema({
  // NO MORE tenantId
  planId: String,
  planName: String,
  planCode: String,
  billingCycle: String,
  price: Number,
  status: String,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  trialStartDate: Date,
  trialEndDate: Date,
  selectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = (connection) => connection.model('Subscription', subscriptionSchema);