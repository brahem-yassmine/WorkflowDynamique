// /models/tenant/role.model.js
const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    description: {
      type: String,
      trim: true
    },
    permissions: [
      {
        module: { type: String, required: true },
        domain: { type: String, required: true },
        actions: [{ type: String, enum: ['create', 'read', 'update', 'delete', 'approve', 'reject', '*'] }]
      }
    ],
    isDefault: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isSystemRole: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

module.exports = (connection) => connection.model('Role', roleSchema);