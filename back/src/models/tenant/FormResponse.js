// back/src/models/tenant/FormResponse.js
const mongoose = require('mongoose');

const formResponseSchema = new mongoose.Schema({
    formId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form',
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = (connection) => connection.model('FormResponse', formResponseSchema);
