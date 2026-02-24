// back/src/models/tenant/Workflow.js
const mongoose = require('mongoose');

// stepSchema removed - replaced by nodes/edges structure inside workflowSchema

const workflowSchema = new mongoose.Schema({
  // REMOVE - no longer needed as we are in the tenant database
  // tenantId: { ... },

  name: {
    type: String,
    required: true,
    trim: true
  },

  description: String,

  domain: {
    type: String,
    enum: ['HR', 'Finance', 'IT', 'Sales', 'Management'],
    required: true
  },

  // GRAPH MODEL REPLACEMENT
  nodes: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },

  edges: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },

  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  },

  // ADD - reference to the project
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false // Optional for backward compatibility, but recommended
  },

  // ADD - reference to the user who created the template
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }

}, { timestamps: true });

// Factory pattern - we export a function
module.exports = (connection) => connection.model('Workflow', workflowSchema);