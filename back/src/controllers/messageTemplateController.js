// back/src/controllers/messageTemplateController.js
exports.getTemplates = async (req, res) => {
    try {
        const MessageTemplate = req.tenantConn.model('MessageTemplate');
        const templates = await MessageTemplate.find().sort({ updatedAt: -1 });
        res.json({ success: true, data: templates });
    } catch (error) {
        console.error('❌ getTemplates Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createTemplate = async (req, res) => {
    try {
        const { title, content, variables, status } = req.body;
        const MessageTemplate = req.tenantConn.model('MessageTemplate');

        const template = new MessageTemplate({
            title,
            content,
            variables: variables || [],
            status: status || 'draft',
            createdBy: req.user.userId || req.user.id
        });
        await template.save();

        res.status(201).json({ success: true, data: template });
    } catch (error) {
        console.error('❌ createTemplate Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, variables, status } = req.body;
        const MessageTemplate = req.tenantConn.model('MessageTemplate');

        const template = await MessageTemplate.findByIdAndUpdate(
            id,
            { title, content, variables, status },
            { new: true }
        );

        if (!template) {
            return res.status(404).json({ success: false, message: 'Template not found' });
        }
        res.json({ success: true, data: template });
    } catch (error) {
        console.error('❌ updateTemplate Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const MessageTemplate = req.tenantConn.model('MessageTemplate');

        const template = await MessageTemplate.findByIdAndDelete(id);
        if (!template) {
            return res.status(404).json({ success: false, message: 'Template not found' });
        }
        res.json({ success: true, data: { id } });
    } catch (error) {
        console.error('❌ deleteTemplate Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
