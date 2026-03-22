const mongoose = require('mongoose');
const { recordActivity } = require('../services/auditLogger');

const getBoardModel = (req) => req.tenantConn.model('Board');
const getTaskModel = (req) => req.tenantConn.model('Task');

exports.getBoards = async (req, res) => {
    try {
        const Board = getBoardModel(req);
        const Workflow = req.tenantConn.model('Workflow');
        const { workflowId, projectId } = req.query;

        const query = {};

        if (workflowId) {
            query.workflowId = workflowId;
        } else if (projectId) {
            // Find all workflows for this project
            const workflows = await Workflow.find({ projectId }).select('_id');
            const workflowIds = workflows.map(w => w._id);
            query.workflowId = { $in: workflowIds };
        }

        const boards = await Board.find(query)
            .populate({
                path: 'workflowId',
                populate: { path: 'projectId' }
            })
            .sort({ createdAt: -1 });

        res.json({ success: true, data: boards });
    } catch (error) {
        console.error('getBoards Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getBoardById = async (req, res) => {
    try {
        const Board = getBoardModel(req);
        const { id } = req.params;
        const board = await Board.findById(id);
        if (!board) return res.status(404).json({ success: false, message: 'Board not found' });
        res.json({ success: true, data: board });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createBoard = async (req, res) => {
    try {
        const Board = getBoardModel(req);
        const { name, description, workflowId } = req.body;
        const userId = req.user?.userId || req.user?.id || req.user?._id;

        const board = new Board({
            name,
            description,
            workflowId,
            createdBy: userId
        });

        await board.save();

        await recordActivity(req, 'CREATE_BOARD', {
            type: 'Board',
            id: board._id,
            name: board.name
        });

        res.status(201).json({ success: true, data: board });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.cloneBoard = async (req, res) => {
    try {
        const Board = getBoardModel(req);
        const Task = getTaskModel(req);
        const { id } = req.params;

        const originalBoard = await Board.findById(id);
        if (!originalBoard) return res.status(404).json({ success: false, message: 'Board not found' });

        const userId = req.user?.userId || req.user?.id || req.user?._id;

        const clonedBoard = new Board({
            name: `${originalBoard.name} (Copy)`,
            description: originalBoard.description,
            workflowId: originalBoard.workflowId,
            createdBy: userId
        });

        await clonedBoard.save();

        // Clone tasks
        const originalTasks = await Task.find({ boardId: id });
        const clonedTasks = originalTasks.map(task => ({
            title: task.title,
            description: task.description,
            status: task.status,
            position: task.position,
            createdBy: userId,
            boardId: clonedBoard._id
        }));

        if (clonedTasks.length > 0) {
            await Task.insertMany(clonedTasks);
        }

        await recordActivity(req, 'CLONE_BOARD', {
            type: 'Board',
            id: clonedBoard._id,
            name: clonedBoard.name
        });

        res.status(201).json({ success: true, data: clonedBoard });
    } catch (error) {
        console.error('Clone Board Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteBoard = async (req, res) => {
    try {
        const Board = getBoardModel(req);
        const { id } = req.params;

        const board = await Board.findByIdAndDelete(id);
        if (!board) return res.status(404).json({ success: false, message: 'Board not found' });

        await recordActivity(req, 'DELETE_BOARD', {
            type: 'Board',
            id: board._id,
            name: board.name
        });

        res.json({ success: true, message: 'Board deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateBoard = async (req, res) => {
    try {
        const Board = getBoardModel(req);
        const { id } = req.params;
        const { name, description, workflowId } = req.body;

        const board = await Board.findByIdAndUpdate(
            id,
            { name, description, workflowId },
            { new: true }
        );

        if (!board) return res.status(404).json({ success: false, message: 'Board not found' });

        await recordActivity(req, 'UPDATE_BOARD', {
            type: 'Board',
            id: board._id,
            name: board.name
        });

        res.json({ success: true, data: board });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
