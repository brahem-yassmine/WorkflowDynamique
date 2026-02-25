// back/src/controllers/checklistController.js

// ============================================
// 1. CREATE NEW CHECKLIST
// ============================================
exports.createChecklist = async (req, res) => {
    try {
        const { name, tasks } = req.body;
        const Checklist = req.tenantConn.model('Checklist');

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Name is required'
            });
        }

        const userId = req.user?.userId || req.user?.id || req.user?._id;

        const checklist = new Checklist({
            name,
            tasks: tasks || [],
            createdBy: userId
        });

        await checklist.save();

        res.status(201).json({
            success: true,
            message: 'Checklist created successfully',
            data: checklist
        });

    } catch (error) {
        console.error('❌ createChecklist Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
};

// ============================================
// 2. GET ALL CHECKLISTS
// ============================================
exports.getChecklists = async (req, res) => {
    try {
        const Checklist = req.tenantConn.model('Checklist');
        const checklists = await Checklist.find().sort({ createdAt: -1 });

        res.json({
            success: true,
            count: checklists.length,
            data: checklists
        });

    } catch (error) {
        console.error('❌ getChecklists Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// ============================================
// 3. GET CHECKLIST BY ID
// ============================================
exports.getChecklistById = async (req, res) => {
    try {
        const { id } = req.params;
        const Checklist = req.tenantConn.model('Checklist');
        const checklist = await Checklist.findById(id);

        if (!checklist) {
            return res.status(404).json({
                success: false,
                message: 'Checklist not found'
            });
        }

        res.json({
            success: true,
            data: checklist
        });

    } catch (error) {
        console.error('❌ getChecklistById Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// ============================================
// 4. UPDATE CHECKLIST
// ============================================
exports.updateChecklist = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const Checklist = req.tenantConn.model('Checklist');

        const checklist = await Checklist.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

        if (!checklist) {
            return res.status(404).json({
                success: false,
                message: 'Checklist not found'
            });
        }

        res.json({
            success: true,
            message: 'Checklist updated successfully',
            data: checklist
        });

    } catch (error) {
        console.error('❌ updateChecklist Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// ============================================
// 5. DELETE CHECKLIST
// ============================================
exports.deleteChecklist = async (req, res) => {
    try {
        const { id } = req.params;
        const Checklist = req.tenantConn.model('Checklist');

        const checklist = await Checklist.findByIdAndDelete(id);

        if (!checklist) {
            return res.status(404).json({
                success: false,
                message: 'Checklist not found'
            });
        }

        res.json({
            success: true,
            message: 'Checklist deleted successfully'
        });

    } catch (error) {
        console.error('❌ deleteChecklist Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
