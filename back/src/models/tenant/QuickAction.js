// back/src/models/tenant/QuickAction.js
const mongoose = require('mongoose');

const quickActionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  icon: {
    type: String, // String representation of the icon (e.g., 'ShoppingCart', 'Calendar')
    default: 'Zap'
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow', // Reference to the workflow template
    required: true
  },
  formSchema: {
    type: [mongoose.Schema.Types.Mixed], // Array of field definitions
    default: []
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  },
  roleVisibility: [String], // Roles that can see this action
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Factory pattern
module.exports = (connection) => connection.model('QuickAction', quickActionSchema);
