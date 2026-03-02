const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['planning', 'active', 'completed', 'on-hold'],
        default: 'planning'
    },
    allowedDomains: {
        type: [String], // Array of domain names/codes
        default: []
    },
    isAllDomains: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = (connection) => connection.model('Project', projectSchema);
