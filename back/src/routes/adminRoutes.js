// back/src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth, requireRole } = require('../middleware/auth');

// All routes require authentication and super_admin role
router.use(auth);
router.use(requireRole('super_admin'));

// ========================
// TENANT MANAGEMENT (COMPANIES)
// ========================

// GET /api/admin/tenants - List all tenants
router.get('/tenants', async (req, res) => {
  try {
    console.log(' Fetching all tenants...');

    // Use master connection from app.locals
    const masterDb = req.app.locals.masterDb;
    if (!masterDb) {
      return res.status(500).json({
        success: false,
        message: 'Master connection not available'
      });
    }

    // Get Tenant model from connection
    const Tenant = masterDb.model('Tenant');

    const tenants = await Tenant.find()
      .populate('selectedPlan')
      .sort({ createdAt: -1 });

    console.log(` ${tenants.length} tenants found`);

    // Add additional information
    const enrichedTenants = await Promise.all(tenants.map(async (tenant) => {
      // Count users if possible
      let userCount = 0;
      try {
        if (tenant.databaseName) {
          // Connection to tenant database to count users
          const tenantConn = mongoose.createConnection(tenant.databaseUri);
          await new Promise((resolve) => tenantConn.once('connected', resolve));

          const User = tenantConn.model('User', new mongoose.Schema({
            email: String,
            role: String
          }));

          userCount = await User.countDocuments();
          await tenantConn.close();
        }
      } catch (error) {
        console.log(` Impossible to count users for ${tenant.name}`);
      }

      return {
        ...tenant.toObject(),
        userCount,
        // Default values for frontend
        industry: tenant.industry || 'Not specified',
        adminName: tenant.adminName || (tenant.email ? tenant.email.split('@')[0] : 'Admin')
      };
    }));

    res.json({
      success: true,
      data: enrichedTenants
    });

  } catch (error) {
    console.error(' Error GET /tenants:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/admin/tenants/:id - Tenant details
router.get('/tenants/:id', async (req, res) => {
  try {
    const masterDb = req.app.locals.masterDb;
    const Tenant = masterDb.model('Tenant');

    const tenant = await Tenant.findById(req.params.id).populate('selectedPlan');

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Count users
    let userCount = 0;
    try {
      if (tenant.databaseName) {
        const tenantConn = mongoose.createConnection(tenant.databaseUri);
        await new Promise((resolve) => tenantConn.once('connected', resolve));

        const User = tenantConn.model('User', new mongoose.Schema({
          email: String,
          role: String
        }));

        userCount = await User.countDocuments();
        await tenantConn.close();
      }
    } catch (error) {
      console.log(` Impossible to count users`);
    }

    res.json({
      success: true,
      data: {
        ...tenant.toObject(),
        userCount,
        industry: tenant.industry || 'Not specified',
        adminName: tenant.adminName || (tenant.email ? tenant.email.split('@')[0] : 'Admin')
      }
    });

  } catch (error) {
    console.error(' Error GET /tenants/:id:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// PUT /api/admin/tenants/:id - Update a tenant
router.get('/tenants/:id', async (req, res) => {
  try {
    const masterDb = req.app.locals.masterDb;
    const Tenant = masterDb.model('Tenant');

    const updates = {
      name: req.body.name,
      email: req.body.email,
      industry: req.body.industry,
      adminName: req.body.adminName,
      status: req.body.status
    };

    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('selectedPlan');

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      data: tenant
    });

  } catch (error) {
    console.error(' Error PUT /tenants/:id:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// PATCH /api/admin/tenants/:id/status - Change status
router.patch('/tenants/:id/status', async (req, res) => {
  try {
    const masterDb = req.app.locals.masterDb;
    const Tenant = masterDb.model('Tenant');

    const { status } = req.body;

    if (!['active', 'suspended', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      data: tenant
    });

  } catch (error) {
    console.error(' Error PATCH /tenants/:id/status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// DELETE /api/admin/tenants/:id - Delete (soft delete)
router.delete('/tenants/:id', async (req, res) => {
  try {
    const masterDb = req.app.locals.masterDb;
    const Tenant = masterDb.model('Tenant');

    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      message: 'Tenant deactivated successfully'
    });

  } catch (error) {
    console.error(' Error DELETE /tenants/:id:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/admin/tenants/:id/users/count - Count users
router.get('/tenants/:id/users/count', async (req, res) => {
  try {
    const masterDb = req.app.locals.masterDb;
    const Tenant = masterDb.model('Tenant');

    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    let count = 0;
    if (tenant.databaseName) {
      const tenantConn = mongoose.createConnection(tenant.databaseUri);
      await new Promise((resolve) => tenantConn.once('connected', resolve));

      const User = tenantConn.model('User', new mongoose.Schema({
        email: String,
        role: String
      }));

      count = await User.countDocuments();
      await tenantConn.close();
    }

    res.json({
      success: true,
      count
    });

  } catch (error) {
    console.error(' Error GET /users/count:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ========================
// GLOBAL STATISTICS FOR DASHBOARD
// ========================

// ✅ STATISTICS ROUTE - Pure JavaScript version (no TypeScript)
router.get('/stats', async (req, res) => {
  try {
    console.log(' Fetching global statistics...');

    const masterDb = req.app.locals.masterDb;
    if (!masterDb) {
      return res.status(500).json({
        success: false,
        message: 'Master connection not available'
      });
    }

    const Tenant = masterDb.model('Tenant');

    // Fetch all tenants
    const tenants = await Tenant.find().populate('selectedPlan');

    // Initialize counters (simple objects, no TypeScript)
    let totalUsers = 0;
    let totalWorkflows = 0;
    let totalExecutions = 0;
    const sectorCounts = {}; // Simple object
    const planCounts = {}; // Simple object

    // Iterate through all tenants to collect stats
    for (const tenant of tenants) {
      // Base stats
      const sector = tenant.industry || 'Not specified';
      sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;

      const planName = tenant.selectedPlan?.name || tenant.planDetails?.name || 'No plan';
      planCounts[planName] = (planCounts[planName] || 0) + 1;

      // Try to count actual users
      try {
        if (tenant.databaseName) {
          const tenantConn = mongoose.createConnection(tenant.databaseUri);
          await new Promise((resolve) => tenantConn.once('connected', resolve));

          const User = tenantConn.model('User', new mongoose.Schema({
            email: String,
            role: String
          }));

          const userCount = await User.countDocuments();
          totalUsers += userCount;

          await tenantConn.close();
        }
      } catch (err) {
        console.log(` Impossible to count for ${tenant.name}:`, err.message);
      }
    }

    // Convert objects to arrays for charts
    const sectorDistribution = Object.keys(sectorCounts).map(function (sector) {
      return {
        sector: sector,
        value: sectorCounts[sector]
      };
    });

    const planDistribution = Object.keys(planCounts).map(function (name) {
      return {
        name: name,
        value: planCounts[name]
      };
    });

    // Calculated statistics
    const stats = {
      totalCompanies: tenants.length,
      activeCompanies: tenants.filter(function (t) { return t.status === 'active'; }).length,
      suspendedCompanies: tenants.filter(function (t) { return t.status === 'suspended'; }).length,
      inactiveCompanies: tenants.filter(function (t) { return t.status === 'inactive'; }).length,

      totalUsers: totalUsers,
      totalWorkflows: 876, // Replace with real data later
      totalExecutions: 12450, // Replace with real data later

      trialCompanies: planCounts['Demo Plan'] || planCounts['DEMO'] || 0,
      paidCompanies: (planCounts['Starter Plan'] || 0) + (planCounts['Pro Plan'] || 0),

      averageGpuUsage: 68,

      // Data for charts
      sectorDistribution: sectorDistribution,
      planDistribution: planDistribution,

      revenue: {
        total: 84250,
        monthly: [
          { month: "Jan", revenue: 12000 },
          { month: "Feb", revenue: 15000 },
          { month: "Mar", revenue: 18000 },
          { month: "Apr", revenue: 22000 },
          { month: "May", revenue: 17000 },
          { month: "Jun", revenue: 24000 }
        ]
      }
    };

    console.log(' Statistics calculated successfully');

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error(' Error GET /stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ========================
// PLAN MANAGEMENT
// ========================

// GET /api/admin/plans - List all plans
router.get('/plans', async (req, res) => {
  try {
    const masterDb = req.app.locals.masterDb;
    if (!masterDb) {
      return res.status(500).json({
        success: false,
        message: 'Master connection not available'
      });
    }

    // Get Plan model from connection
    const Plan = masterDb.model('Plan');

    const plans = await Plan.find().sort({ price: 1 });
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error(' Error GET /plans:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/admin/plans - Create a new plan
router.post('/plans', async (req, res) => {
  try {
    const masterDb = req.app.locals.masterDb;
    const Plan = masterDb.model('Plan');

    const plan = new Plan(req.body);
    await plan.save();

    res.status(201).json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error(' Error POST /plans:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// PUT /api/admin/plans/:id - Update a plan
router.put('/plans/:id', async (req, res) => {
  try {
    const masterDb = req.app.locals.masterDb;
    const Plan = masterDb.model('Plan');

    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error(' Error PUT /plans/:id:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// DELETE /api/admin/plans/:id - Delete a plan
router.delete('/plans/:id', async (req, res) => {
  try {
    const masterDb = req.app.locals.masterDb;
    const Plan = masterDb.model('Plan');

    const plan = await Plan.findByIdAndDelete(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    console.error(' Error DELETE /plans/:id:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;