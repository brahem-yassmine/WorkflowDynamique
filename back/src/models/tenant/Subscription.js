// back/src/models/tenant/Subscription.js -  OPTIONNEL
// Si tu veux garder un historique des abonnements DANS le tenant
// Mais la source de vérité reste dans master/Tenant
const mongoose = require('mongoose');
const subscriptionSchema = new mongoose.Schema({
  // ❌ PLUS DE tenantId
  planId: String, // juste l'ID du plan (pas de référence MongoDB)
  planName: String,
  billingCycle: String,
  price: Number,
  status: String,
  startDate: Date,
  endDate: Date,
  
  // Référence à l'utilisateur qui a fait l'action
  selectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = (connection) => connection.model('Subscription', subscriptionSchema);