// back/src/models/tenant/WorkflowInstance.js
const mongoose = require('mongoose');

const workflowInstanceSchema = new mongoose.Schema({
  // ✅ On garde la référence au workflow (dans la même base)
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true
  },
  
  // ❌ À SUPPRIMER - tenantId (inutile dans la base du tenant)
  // tenantId: { ... },
  
  // ✅ On garde la référence à l'utilisateur (dans la même base)
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
  
  steps: [{
    name: String,
    description: String,
    responsibleDomain: String,
    actionType: {
      type: String,
      enum: ['approval', 'notification', 'task']
    },
    order: Number,
    
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'approved', 'rejected', 'skipped'],
      default: 'pending'
    },
    
    // ✅ Les références restent, mais pointent vers des users de la même base
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    comments: String,
    
    dueDate: Date,
    startedAt: Date,
    completedAt: Date,
    
    stepData: mongoose.Schema.Types.Mixed
  }],
  
  currentStepIndex: {
    type: Number,
    default: 0
  },
  
  history: [{
    action: String,
    stepName: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comments: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
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

// ✅ On garde les index mais on enlève tenantId
workflowInstanceSchema.index({ workflowId: 1 });
workflowInstanceSchema.index({ createdBy: 1 });
workflowInstanceSchema.index({ status: 1 });
workflowInstanceSchema.index({ 'steps.responsibleDomain': 1 });
workflowInstanceSchema.index({ dueDate: 1 });

workflowInstanceSchema.methods.nextStep = function() {
  if (this.currentStepIndex < this.steps.length - 1) {
    this.currentStepIndex += 1;
    this.steps[this.currentStepIndex].status = 'in_progress';
    this.steps[this.currentStepIndex].startedAt = new Date();
    return true;
  }
  return false;
};

workflowInstanceSchema.methods.getCurrentStep = function() {
  return this.steps[this.currentStepIndex];
};

workflowInstanceSchema.methods.isCompleted = function() {
  return this.status === 'completed' || this.status === 'approved' || this.status === 'rejected';
};

// ✅ Factory pattern
module.exports = (connection) => connection.model('WorkflowInstance', workflowInstanceSchema);