// back/src/models/tenant/Workflow.js
const mongoose = require('mongoose');

const workflowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  domain: {
    type: String,
    required: true
  },
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
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Factory pattern
module.exports = (connection) => connection.model('Workflow', workflowSchema);