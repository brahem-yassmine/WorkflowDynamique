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
    required: true
  },
  
  version: {
    type: Number,
    default: 1
  },

  // NEW ARCHITECTURE: Steps (Nodes)
  nodes: [{
    id: { type: String, required: true },
    type: { 
      type: String, 
      required: true,
      enum: ['START', 'TASK', 'APPROVAL', 'AUTO', 'NOTIFICATION', 'CONDITION', 'SUB_WORKFLOW', 'EVENT', 'END', 'task', 'action', 'condition', 'start', 'end', 'parallel_split', 'parallel_join', 'FORM', 'DOCUMENT'] // Kept legacy lowercase and added missing ones for AI/Migration support
    },
    config: {
      // TASK settings (Handling generic content, forms, pdf, images)
      taskType: { type: String, enum: ['FORM', 'IMAGE', 'PDF', 'REPORT', 'EXTERNAL'] },
      contentId: String, // Ref to the form/document template
      
      // APPROVAL settings
      strategy: { type: String, enum: ['ALL', 'ANY'], default: 'ANY' },
      requiredCount: { type: Number, default: 1 },
      minApprovals: { type: Number, default: 1 },
      allowRejection: { type: Boolean, default: true },

      // AUTO settings
      actionType: { type: String, enum: ['GENERATE_DOCUMENT', 'CALL_API', 'TRANSFORM_DATA', 'CREATE_RECORD', 'SEND_WEBHOOK', 'CLONE_DATA'] },
      actionParams: { type: mongoose.Schema.Types.Mixed },

      // CONDITION settings
      branches: [mongoose.Schema.Types.Mixed], // Array of { condition: DSL, targetStepId: String }

      // NOTIFICATION settings
      channel: { type: String, enum: ['IN_APP', 'EMAIL'] },
      recipientConfig: {
        targetType: { type: String, enum: ['USER', 'ROLE', 'ALL', 'DYNAMIC'] },
        values: [String],
        logic: String
      },
      messageTemplate: String,
      titleTemplate: String,

      // SUB_WORKFLOW settings
      subWorkflowId: String,
      waitForCompletion: { type: Boolean, default: true },

      // COMMON settings
      timeout: String, // e.g., "48h"
      onTimeout: String, // Next step ID
      onError: String    // Next step ID
    },
    assignment: {
      type: { type: String, enum: ['USER', 'ROLE', 'DOMAIN', 'DYNAMIC', 'NONE'], default: 'NONE' },
      values: [String],
      resolver: String,
      params: mongoose.Schema.Types.Mixed,
      logic: String // Legacy, keep for backward compat
    },
    data: mongoose.Schema.Types.Mixed, // Keep for backward compatibility during migration
    position: {
      x: Number,
      y: Number
    }
  }],

  // NEW ARCHITECTURE: Transitions (Edges)
  edges: [{
    id: String,
    source: { type: String, required: true },
    target: { type: String, required: true },
    sourceHandle: String,
    targetHandle: String,
    condition: mongoose.Schema.Types.Mixed, // JSON-DSL: { operator: '>', left: 'context.amount', right: 1000 }
    label: String
  }],

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
    required: function () {
      return this.isTemplate === false;
    }
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: function () {
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