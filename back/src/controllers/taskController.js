const mongoose = require('mongoose');

// Helper to get Task model for the current tenant
const getTaskModel = (req) => req.tenantConn.model('Task');

exports.getTasks = async (req, res) => {
    try {
        const Task = getTaskModel(req);
        const tasks = await Task.find().sort({ position: 1 });
        res.json({ success: true, data: tasks });
    } catch (error) {
        console.error('❌ getTasks Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createTask = async (req, res) => {
    try {
        const Task = getTaskModel(req);
        const { title, description, status, position } = req.body;

        const userId = req.user?.userId || req.user?.id || req.user?._id;

        const task = new Task({
            title,
            description,
            status: status || 'todo',
            position: position || 0,
            createdBy: userId
        });

        await task.save();
        res.status(201).json({ success: true, data: task });
    } catch (error) {
        console.error('❌ createTask Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateTask = async (req, res) => {
    try {
        const Task = getTaskModel(req);
        const { id } = req.params;
        const updates = req.body;

        const task = await Task.findByIdAndUpdate(id, updates, { new: true });
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        res.json({ success: true, data: task });
    } catch (error) {
        console.error('❌ updateTask Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const Task = getTaskModel(req);
        const { id } = req.params;

        const task = await Task.findByIdAndDelete(id);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        res.json({ success: true, message: 'Task deleted' });
    } catch (error) {
        console.error('❌ deleteTask Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.reorderTasks = async (req, res) => {
    try {
        const Task = getTaskModel(req);
        const { tasks } = req.body; // Expects array of { id, position, status }

        const bulkOps = tasks.map(t => ({
            updateOne: {
                filter: { _id: t.id },
                update: { $set: { position: t.position, status: t.status } }
            }
        }));

        await Task.bulkWrite(bulkOps);
        res.json({ success: true, message: 'Tasks reordered' });
    } catch (error) {
        console.error('❌ reorderTasks Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
