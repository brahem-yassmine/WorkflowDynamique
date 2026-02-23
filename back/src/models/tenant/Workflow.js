// back/src/models/tenant/Workflow.js
const mongoose = require('mongoose');

// stepSchema removed - replaced by nodes/edges structure inside workflowSchema

const workflowSchema = new mongoose.Schema({
  //  À SUPPRIMER - plus besoin car on est dans la base du tenant
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

  // GRAPH MODEL REPLACEMENT
  nodes: [{
    id: { type: String, required: true }, // React Flow ID (e.g., "1", "node-a")
    type: {
      type: String,
      required: true,
      enum: ['start', 'action', 'condition', 'end']
    },
    data: {
      label: String,
      description: String,
      responsibleDomain: String, // Pour 'action' nodes
      actionType: {
        type: String,
        enum: ['approval', 'review', 'notification', 'task']
      },
      // Pour 'condition' nodes
      conditionKey: String, // ex: "amount"
      conditionOperator: String, // ex: ">", "==", "contains"
      conditionValue: mongoose.Schema.Types.Mixed
    },
    position: {
      x: Number,
      y: Number
    }
  }],

  edges: [{
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    type: String, // 'default', 'smoothstep', etc.
    label: String, // Label visible sur le lien (ex: "Oui", "Non")
    animated: Boolean,
    data: {
      condition: Boolean, // Si vrai, c'est un chemin conditionnel
      conditionValue: mongoose.Schema.Types.Mixed // Valeur requise pour prendre ce chemin
    }
  }],

  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  },

  // AJOUT - référence à l'utilisateur qui a créé le template
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }

}, { timestamps: true });

// Factory pattern - on exporte une fonction
module.exports = (connection) => connection.model('Workflow', workflowSchema);