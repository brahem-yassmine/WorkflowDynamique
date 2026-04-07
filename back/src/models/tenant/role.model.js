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
        type: String,
        trim: true,
        required: true
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
    },
    domainId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Domain"
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module"
    },
    modulePermissions: [
      {
        type: String,
        trim: true
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = (connection) => connection.model('Role', roleSchema);