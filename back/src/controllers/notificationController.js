// back/src/controllers/notificationController.js

exports.getNotifications = async (req, res) => {
    try {
        const Notification = req.tenantConn.model('Notification');
        const notifications = await Notification.find({ recipient: req.user.userId })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            success: true,
            data: notifications
        });
    } catch (error) {
        console.error('❌ getNotifications Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const Notification = req.tenantConn.model('Notification');

        const notification = await Notification.findOneAndUpdate(
            { _id: id, recipient: req.user.userId },
            { read: true },
            { new: true }
        );

        res.json({ success: true, data: notification });
    } catch (error) {
        console.error('❌ markAsRead Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        const Notification = req.tenantConn.model('Notification');
        await Notification.updateMany(
            { recipient: req.user.userId, read: false },
            { read: true }
        );

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('❌ markAllAsRead Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Internal utility to create notifications
exports.createInternalNotification = async (tenantConn, data) => {
    try {
        const Notification = tenantConn.model('Notification');
        const notification = new Notification(data);
        await notification.save();
        return notification;
    } catch (error) {
        console.error('❌ createInternalNotification Error:', error);
    }
};
