const mongoose = require('mongoose');

const messageTemplateSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    variables: [{ type: String }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['draft', 'saved'], default: 'draft' }
}, { timestamps: true });

module.exports = (connection) => {
    return connection.model('MessageTemplate', messageTemplateSchema);
};
