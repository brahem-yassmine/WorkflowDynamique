const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { recordActivity } = require('../services/auditLogger');
const notificationController = require('./notificationController');

// Helper to get Task model for the current tenant
const getTaskModel = (req) => req.tenantConn.model('Task');

exports.getTasks = async (req, res) => {
    try {
        const Task = getTaskModel(req);
        const { boardId } = req.query;
        const filter = boardId ? { boardId } : {};
        const tasks = await Task.find(filter).sort({ position: 1 });
        res.json({ success: true, data: tasks });
    } catch (error) {
        console.error('❌ getTasks Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getTask = async (req, res) => {
    try {
        const Task = getTaskModel(req);
        const { id } = req.params;
        const task = await Task.findById(id).populate({
            path: 'boardId',
            populate: { path: 'workflowId' }
        });
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
        res.json({ success: true, data: task });
    } catch (error) {
        console.error('❌ getTask Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createTask = async (req, res) => {
    try {
        const Task = getTaskModel(req);
        let { title, description, status, position, boardId, assignedTo, assignedDomain, type, linkedFormId, attachments } = req.body;
        const userId = req.user?.userId || req.user?.id || req.user?._id;

        // Clean ObjectIds (convert empty strings to null)
        if (assignedTo === '') assignedTo = null;
        if (boardId === '') boardId = null;
        if (linkedFormId === '') linkedFormId = null;

        // process attachments
        if (attachments && Array.isArray(attachments)) {
            for (let i = 0; i < attachments.length; i++) {
                let { filename, url } = attachments[i];
                if (url && url.startsWith('data:')) {
                    const match = url.match(/^data:([^;]+);base64,(.+)$/);
                    if (match) {
                        const contentType = match[1];
                        const base64Data = match[2];
                        const buffer = Buffer.from(base64Data, 'base64');
                        const uniqueFilename = `${Date.now()}-${filename}`;
                        const filePath = path.join(__dirname, '../../uploads', uniqueFilename);
                        if (!fs.existsSync(path.join(__dirname, '../../uploads'))) {
                            fs.mkdirSync(path.join(__dirname, '../../uploads'), { recursive: true });
                        }
                        fs.writeFileSync(filePath, buffer);
                        attachments[i].url = `http://localhost:5000/uploads/${uniqueFilename}`;
                    }
                }
            }
        }

        const task = new Task({
            title,
            description,
            status: status || 'todo',
            position: position || 0,
            createdBy: userId,
            boardId,
            assignedTo,
            assignedDomain,
            type: type || 'normal',
            linkedFormId,
            attachments: attachments || []
        });

        await task.save();

        // 🟢 Notification for standalone tasks
        if (assignedTo) {
            await notificationController.createInternalNotification(req.tenantConn, {
                recipient: assignedTo,
                title: 'New Kanban Task',
                message: `Task "${title}" has been assigned to you.`,
                type: 'task_assigned',
                link: `/admin/tasks?boardId=${boardId}`
            });
        } else if (assignedDomain) {
            const domain = assignedDomain;
            const searchDomains = [domain];
            if (domain === 'HR' || domain === 'RH') searchDomains.push(domain === 'HR' ? 'RH' : 'HR');

            const UserModel = req.tenantConn.model('User');
            const domainUsers = await UserModel.find({ domain: { $in: searchDomains } });
            for (const user of domainUsers) {
                await notificationController.createInternalNotification(req.tenantConn, {
                    recipient: user._id,
                    title: 'New Department Task',
                    message: `A new task for the ${domain} department is available: "${title}".`,
                    type: 'task_assigned',
                    link: `/admin/tasks?boardId=${boardId}`
                });
            }
        }

        // Log the activity
        await recordActivity(req, 'CREATE_TASK', {
            type: 'Task',
            id: task._id,
            name: task.title
        });
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

        // Clean ObjectIds in updates
        if (updates.assignedTo === '') updates.assignedTo = null;
        if (updates.boardId === '') updates.boardId = null;
        if (updates.linkedFormId === '') updates.linkedFormId = null;

        // process attachments
        if (updates.attachments && Array.isArray(updates.attachments)) {
            for (let i = 0; i < updates.attachments.length; i++) {
                let { filename, url } = updates.attachments[i];
                if (url && url.startsWith('data:')) {
                    const match = url.match(/^data:([^;]+);base64,(.+)$/);
                    if (match) {
                        const contentType = match[1];
                        const base64Data = match[2];
                        const buffer = Buffer.from(base64Data, 'base64');
                        const uniqueFilename = `${Date.now()}-${filename}`;
                        const filePath = path.join(__dirname, '../../uploads', uniqueFilename);
                        if (!fs.existsSync(path.join(__dirname, '../../uploads'))) {
                            fs.mkdirSync(path.join(__dirname, '../../uploads'), { recursive: true });
                        }
                        fs.writeFileSync(filePath, buffer);
                        updates.attachments[i].url = `http://localhost:5000/uploads/${uniqueFilename}`;
                    }
                }
            }
        }

        const oldTask = await Task.findById(id);
        if (!oldTask) return res.status(404).json({ success: false, message: 'Task not found' });

        const task = await Task.findByIdAndUpdate(id, updates, { new: true });

        // 🟢 Notification on new assignment
        if (updates.assignedTo && updates.assignedTo.toString() !== oldTask.assignedTo?.toString()) {
            await notificationController.createInternalNotification(req.tenantConn, {
                recipient: updates.assignedTo,
                title: 'Kanban Task Assigned',
                message: `Task "${task.title}" has been assigned to you.`,
                type: 'task_assigned',
                link: `/admin/tasks?boardId=${task.boardId}`
            });
        } else if (updates.assignedDomain && updates.assignedDomain !== oldTask.assignedDomain) {
            const domain = updates.assignedDomain;
            const searchDomains = [domain];
            if (domain === 'HR' || domain === 'RH') searchDomains.push(domain === 'HR' ? 'RH' : 'HR');

            const UserModel = req.tenantConn.model('User');
            const domainUsers = await UserModel.find({ domain: { $in: searchDomains } });
            for (const user of domainUsers) {
                await notificationController.createInternalNotification(req.tenantConn, {
                    recipient: user._id,
                    title: 'New Department Task',
                    message: `Task "${task.title}" has been assigned to the ${domain} department.`,
                    type: 'task_assigned',
                    link: `/admin/tasks?boardId=${task.boardId}`
                });
            }
        }

        // Log the activity
        await recordActivity(req, 'UPDATE_TASK', {
            type: 'Task',
            id: task._id,
            name: task.title
        });

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

        // Log the activity
        await recordActivity(req, 'DELETE_TASK', {
            type: 'Task',
            id: task._id,
            name: task.title
        });

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

        // Log the activity
        await recordActivity(req, 'REORDER_TASKS', {
            type: 'Task',
            name: 'Multiple Tasks'
        }, { count: tasks.length });
        res.json({ success: true, message: 'Tasks reordered' });
    } catch (error) {
        console.error('❌ reorderTasks Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
