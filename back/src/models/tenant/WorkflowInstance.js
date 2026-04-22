// back/src/models/tenant/WorkflowInstance.js
const mongoose = require('mongoose');

const workflowInstanceSchema = new mongoose.Schema({
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true
  },
  
  workflowVersion: {
    type: Number,
    default: 1
  },


  checklistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Checklist'
  },

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

  // SHARED WORKFLOW CONTEXT (The brain of the instance)
  context: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  status: {
    type: String,
    enum: ['pending', 'in_progress', 'approved', 'rejected', 'cancelled', 'completed'],
    default: 'pending'
  },

  version: {
    type: Number,
    default: 0
  }, // For optimistic locking (concurrency control)

  // GRAPH EXECUTION STATE
  state: [{
    stepId: String,
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'REJECTED'],
      default: 'IN_PROGRESS'
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    deadline: Date,

    // Dynamic state during execution
    assignees: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    activePerformer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }, // The user who locked/is working on this step
    
    // Internal state tracking for the step (e.g. approvals list, external job id, etc)
    data: { 
      type: mongoose.Schema.Types.Mixed, 
      default: {} 
    }
  }],

  // For backward compatibility during migration
  currentNodes: [mongoose.Schema.Types.Mixed],

  // Execution history (Full traceability)
  history: [{
    stepId: String,
    nodeId: String, // Keep nodeId for compat
    nodeType: String,
    action: String, 
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comments: String,
    timestamp: { type: Date, default: Date.now },
    data: mongoose.Schema.Types.Mixed,
    inputData: mongoose.Schema.Types.Mixed,
    outputData: mongoose.Schema.Types.Mixed
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

// Pre-save hook for versioning/optimistic locking
workflowInstanceSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.version = (this.version || 0) + 1;
  }
  next();
});

// Helper to know if the instance is active
workflowInstanceSchema.methods.isActive = function () {
  return !['completed', 'cancelled', 'rejected'].includes(this.status);
};

workflowInstanceSchema.methods.isCompleted = function () {
  return ['completed', 'approved', 'rejected', 'cancelled'].includes(this.status);
};

// Factory pattern
module.exports = (connection) => connection.model('WorkflowInstance', workflowInstanceSchema);