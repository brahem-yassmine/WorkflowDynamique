// back/src/controllers/tenantController.js

// Main Dashboard
exports.getDashboard = async (req, res) => {
  try {
    // Verify tenant exists
    if (!req.tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found"
      });
    }

    res.json({
      success: true,
      data: {
        message: "Tenant Dashboard",
        tenant: {
          id: req.tenant._id,
          name: req.tenant.name,
          email: req.tenant.email,
          status: req.tenant.status,
          plan: req.tenant.selectedPlan
        },
        user: req.user ? {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role
        } : null
      }
    });
  } catch (error) {
    console.error('getDashboard Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Tenant information
exports.getTenantInfo = async (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found"
      });
    }

    res.json({
      success: true,
      data: {
        _id: req.tenant._id,
        name: req.tenant.name,
        email: req.tenant.email,
        status: req.tenant.status,
        industry: req.tenant.industry,
        adminName: req.tenant.adminName,
        selectedPlan: req.tenant.selectedPlan,
        createdAt: req.tenant.createdAt
      }
    });
  } catch (error) {
    console.error('getTenantInfo Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateTenantInfo = async (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found"
      });
    }

    const { name, industry } = req.body;

    // Update the Tenant model in the master DB
    const Tenant = req.masterDb.model('Tenant');
    const updatedTenant = await Tenant.findByIdAndUpdate(
      req.tenant._id,
      { name, industry },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: {
        _id: updatedTenant._id,
        name: updatedTenant.name,
        email: updatedTenant.email,
        industry: updatedTenant.industry
      }
    });
  } catch (error) {
    console.error('updateTenantInfo Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Tenant settings
exports.getTenantSettings = async (req, res) => {
  try {
    // Verify tenant connection exists
    if (!req.tenantConn) {
      return res.status(500).json({
        success: false,
        message: "Tenant database connection not available"
      });
    }

    // Get or create Settings model
    let Settings;
    try {
      Settings = req.tenantConn.model('Settings');
    } catch (error) {
      // If model doesn't exist, create it
      const mongoose = require('mongoose');
      const settingsSchema = new mongoose.Schema({
        theme: { type: String, default: 'light' },
        notifications: { type: Boolean, default: true },
        language: { type: String, default: 'en' },
        timezone: { type: String, default: 'UTC' }
      }, { timestamps: true });

      Settings = req.tenantConn.model('Settings', settingsSchema);
    }

    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({
        theme: 'light',
        notifications: true,
        language: 'en',
        timezone: 'UTC'
      });
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('❌ getTenantSettings Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateTenantSettings = async (req, res) => {
  try {
    if (!req.tenantConn) {
      return res.status(500).json({
        success: false,
        message: "Tenant database connection not available"
      });
    }

    const Settings = req.tenantConn.model('Settings');

    let settings = await Settings.findOneAndUpdate(
      {},
      req.body,
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('❌ updateTenantSettings Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Team management
exports.getTeamMembers = async (req, res) => {
  try {
    if (!req.tenantConn) {
      return res.status(500).json({
        success: false,
        message: "Tenant database connection not available"
      });
    }

    const User = req.tenantConn.model('User');
    const users = await User.find({ role: { $ne: 'super_admin' } })
      .select('-password -__v')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('❌ getTeamMembers Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.inviteTeamMember = async (req, res) => {
  try {
    const { email, role, firstName, lastName } = req.body;

    if (!email || !role) {
      return res.status(400).json({
        success: false,
        message: "Email and role required"
      });
    }

    if (!req.tenantConn) {
      return res.status(500).json({
        success: false,
        message: "Tenant database connection not available"
      });
    }

    const User = req.tenantConn.model('User');

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This user already exists"
      });
    }

    // Create an invitation
    const Invitation = req.tenantConn.model('Invitation');

    // Generate unique token
    const generateToken = () => {
      return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
    };

    const invitation = await Invitation.create({
      email,
      role,
      firstName,
      lastName,
      token: generateToken(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // TODO: Send invitation email
    console.log(`📧 Invitation created for ${email} with token: ${invitation.token}`);

    res.json({
      success: true,
      message: "Invitation sent",
      data: {
        email,
        role,
        token: invitation.token,
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error) {
    console.error('❌ inviteTeamMember Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.removeTeamMember = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID required"
      });
    }

    if (!req.tenantConn) {
      return res.status(500).json({
        success: false,
        message: "Tenant database connection not available"
      });
    }

    const User = req.tenantConn.model('User');

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Impossible to delete the last administrator"
        });
      }
    }

    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: "Member removed successfully"
    });
  } catch (error) {
    console.error('❌ removeTeamMember Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Activity logs
exports.getActivityLogs = async (req, res) => {
  try {
    if (!req.tenantConn) {
      return res.status(500).json({
        success: false,
        message: "Tenant database connection not available"
      });
    }

    const ActivityLog = req.tenantConn.model('ActivityLog');

    // Default limit to 50 logs, sorted by most recent
    const logs = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('❌ getActivityLogs Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
