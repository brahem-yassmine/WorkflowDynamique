const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');

// GET /api/platform-settings/public
// Returns current platform configuration for all users
router.get('/public', async (req, res) => {
    try {
        const masterDb = req.app.locals.masterDb;
        if (!masterDb) return res.status(503).json({ success: false, message: "DB connecting" });
        
        const PlatformSettings = masterDb.model('PlatformSettings');
        let settings = await PlatformSettings.findOne();
        
        if (!settings) {
            settings = await PlatformSettings.create({});
        }
        
        res.json({ success: true, data: settings });
    } catch (err) {
        console.error('Error GET /platform-settings/public:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/platform-settings/admin
// Updates platform configuration (Super Admin only)
router.put('/admin', auth, requireRole('super_admin'), async (req, res) => {
    try {
        const masterDb = req.app.locals.masterDb;
        const PlatformSettings = masterDb.model('PlatformSettings');
        
        let settings = await PlatformSettings.findOne();
        if (!settings) {
            settings = new PlatformSettings(req.body);
            await settings.save();
        } else {
            if (req.body.platformName !== undefined) settings.platformName = req.body.platformName;
            if (req.body.supportEmail !== undefined) settings.supportEmail = req.body.supportEmail;
            if (req.body.maintenanceMode !== undefined) settings.maintenanceMode = req.body.maintenanceMode;
            await settings.save();
        }
        
        res.json({ success: true, data: settings });
    } catch (err) {
        console.error('Error PUT /platform-settings/admin:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
