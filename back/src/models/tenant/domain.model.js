// back/src/models/tenant/domain.model.js
const mongoose = require('mongoose');

const domainSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    code: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    color: {
        type: String,
        default: '#6366f1' // Indigo
    }
}, { timestamps: true });

module.exports = domainSchema;
