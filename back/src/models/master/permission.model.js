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
        "USER",
        "ROLE",
        "DEPARTMENT",
        "WORKFLOW",
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

// EXPORTE une fonction qui prend la connexion
module.exports = (connection) => {
  return connection.model("Permission", permissionSchema);
};