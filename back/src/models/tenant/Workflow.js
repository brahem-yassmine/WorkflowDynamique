// back/src/models/tenant/Workflow.js
const mongoose = require('mongoose');

const workflowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  domainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain',
    required: function() {
      return this.isTemplate === true;
    }
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
  isTemplate: {
    type: Boolean,
    default: false
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: false
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: function() {
      return this.isTemplate === false;
    }
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: function() {
      return this.isTemplate === true;
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Factory pattern
module.exports = (connection) => connection.model('Workflow', workflowSchema);