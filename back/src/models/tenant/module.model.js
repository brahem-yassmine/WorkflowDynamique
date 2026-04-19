// back/src/models/tenant/module.model.js
const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    domainId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Domain',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    color: {
        type: String,
        default: '#6366f1'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = (connection) => connection.model('Module', moduleSchema);
