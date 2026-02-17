// back/src/models/tenant/Workflow.js
const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  description: String,
  
  responsibleDomain: {
    type: String,
    enum: ['RH', 'Finance', 'IT', 'Vente', 'Direction', 'Tous'],
    default: 'RH'
  },
  
  actionType: {
    type: String,
    enum: ['approval', 'review', 'notification', 'task'],
    default: 'approval'
  },
  
  order: {
    type: Number,
    required: true
  }
});

const workflowSchema = new mongoose.Schema({
  // ❌ À SUPPRIMER - plus besoin car on est dans la base du tenant
  // tenantId: { ... },
  
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  description: String,
  
  domain: {
    type: String,
    enum: ['RH', 'Finance', 'IT', 'Vente', 'Direction'],
    required: true
  },
  
  steps: [stepSchema],
  
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  },
  
  // ✅ AJOUT - référence à l'utilisateur qui a créé le template
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
  
}, { timestamps: true });

// ✅ Factory pattern - on exporte une fonction
module.exports = (connection) => connection.model('Workflow', workflowSchema);