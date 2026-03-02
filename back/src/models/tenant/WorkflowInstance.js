// back/src/models/tenant/WorkflowInstance.js
const mongoose = require('mongoose');

const workflowInstanceSchema = new mongoose.Schema({
  // We keep the reference to the workflow (in the same database)
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true
  },

  // REMOVE - tenantId (useless in the tenant database)
  // tenantId: { ... },

  // We keep the reference to the user (in the same database)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  title: {
    type: String,
    required: true
  },

  description: String,

  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  status: {
    type: String,
    enum: ['pending', 'in_progress', 'approved', 'rejected', 'cancelled', 'completed'],
    default: 'pending'
  },

  // GRAPH EXECUTION STATE

  // Currently active nodes (where the process is pending)
  currentNodes: [{
    nodeId: String, // Node ID in the graph (e.g., "node-2")
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'rejected'],
      default: 'in_progress'
    },
    startedAt: { type: Date, default: Date.now },

    // For dynamic assignment
    responsibleUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    responsibleDomain: {
      type: String // e.g., 'HR', 'IT', etc.
    },
    assignees: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],

  // Execution history (Full traceability)
  executionPath: [{
    nodeId: String,
    nodeType: String,
    action: String, // 'approved', 'rejected', 'auto_transition'
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comments: String,
    timestamp: { type: Date, default: Date.now },
    inputData: mongoose.Schema.Types.Mixed, // Incoming data
    outputData: mongoose.Schema.Types.Mixed // Step result
  }],

  // Workflow variables (for conditions)
  variables: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },

  history: [{
    // Kept for UI compatibility / general logs
    action: String,
    title: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comments: String,
    timestamp: { type: Date, default: Date.now }
  }],

  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },

  dueDate: Date,

  tags: [String],

  timeStarted: Date,
  timeCompleted: Date,

  attachments: [{
    filename: String,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

// Helper to know if the instance is active
workflowInstanceSchema.methods.isActive = function () {
  return !['completed', 'cancelled', 'rejected'].includes(this.status);
};

// Helper to find the current active node
workflowInstanceSchema.methods.getNodeStatus = function (nodeId) {
  return this.currentNodes.find(n => n.nodeId === nodeId);
};

// Indexing for performance
workflowInstanceSchema.index({ workflowId: 1 });
workflowInstanceSchema.index({ createdBy: 1 });
workflowInstanceSchema.index({ status: 1 });
workflowInstanceSchema.index({ 'currentNodes.responsibleUser': 1 });
workflowInstanceSchema.index({ 'currentNodes.responsibleDomain': 1 });
workflowInstanceSchema.index({ dueDate: 1 });

workflowInstanceSchema.methods.isCompleted = function () {
  return this.status === 'completed' || this.status === 'approved' || this.status === 'rejected';
};

// Factory pattern
module.exports = (connection) => connection.model('WorkflowInstance', workflowInstanceSchema);