const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'archived'],
        default: 'active'
    }
}, { timestamps: true });

module.exports = (connection) => connection.model('Board', boardSchema);
