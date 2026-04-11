// /models/master/permission.model.js
const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    description: {
      type: String,
      trim: true
    },

    category: {
      type: String,
      enum: [
        "DOMAIN",
        "MODULE",
        "WORKFLOW",
        "PROJECT",
        "KANBAN",
        "FORM",
        "CHECKLIST",
        "TASK",
        "SYSTEM"
      ],
      required: true
    }
  },
  {
    timestamps: true
  }
);

// EXPORT a function that takes the connection
module.exports = (connection) => {
  return connection.model("Permission", permissionSchema);
};