const mongoose = require('mongoose');

const test = async () => {
    try {
        const conn = mongoose.createConnection('mongodb://localhost:27017/tenant_test_123', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const dynamicFormSchema = new mongoose.Schema({
            name: { type: String, required: true },
            description: { type: String },
            steps: [new mongoose.Schema({
                id: { type: String, required: true },
                title: { type: String, required: true },
                fields: [new mongoose.Schema({
                    id: { type: String, required: true },
                    type: { type: String, required: true },
                    label: { type: String, required: true },
                    placeholder: { type: String },
                    required: { type: Boolean, default: false },
                    options: [{ type: String }],
                    width: { type: String, enum: ['full', 'half'], default: 'half' }
                })],
                status: {
                    type: String,
                    enum: ['pending', 'approved', 'rejected'],
                    default: 'pending'
                }
            })],
            status: {
                type: String,
                enum: ['draft', 'published', 'archived', 'approved', 'rejected', 'completed'],
                default: 'draft'
            },
            createdBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            publishedAt: { type: Date },
            version: { type: Number, default: 1 },
            submissionCount: { type: Number, default: 0 },
            settings: {
                allowMultipleSubmissions: { type: Boolean, default: false },
                requireLogin: { type: Boolean, default: true },
                confirmationMessage: { type: String },
                redirectUrl: { type: String }
            }
        });

        const DynamicForm = conn.model('DynamicForm', dynamicFormSchema);

        const form = new DynamicForm({
            name: 'Test Form',
            description: 'Test',
            steps: [{
                id: 'step-1',
                title: 'Step 1',
                fields: [{
                    id: 'text-123',
                    type: 'text',
                    label: 'Text Field',
                    required: false,
                    width: 'half'
                }]
            }],
            createdBy: new mongoose.Types.ObjectId()
        });

        await form.save();
        console.log('Saved successfully');
        process.exit(0);
    } catch (e) {
        console.error('Validation error:', e);
        process.exit(1);
    }
};

test();
