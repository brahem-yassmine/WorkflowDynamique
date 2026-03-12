// back/src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth, requireRole } = require('../middleware/auth');
const LogController = require('../controllers/master/logController');

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
      // Count users and check subscription if possible
      let userCount = 0;
      let subscriptionExpired = false;
      let actualStatus = tenant.status || 'inactive';

      try {
        if (tenant.databaseName) {
          // Connection to tenant database
          const tenantConn = mongoose.createConnection(tenant.databaseUri);
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
            tenantConn.once('connected', () => {
              clearTimeout(timeout);
              resolve();
            });
            tenantConn.once('error', (err) => {
              clearTimeout(timeout);
              reject(err);
            });
          });

          // Model for User
          const User = tenantConn.model('User', new mongoose.Schema({
            email: String,
            role: String
          }));
          userCount = await User.countDocuments();

          // Model for Subscription
          const Subscription = tenantConn.model('Subscription', new mongoose.Schema({
            status: String,
            currentPeriodEnd: Date,
            trialEndDate: Date
          }));

          // Get latest subscription
          const sub = await Subscription.findOne().sort({ createdAt: -1 });
          if (sub) {
            const now = new Date();
            const endDate = sub.currentPeriodEnd || sub.trialEndDate;
            if (endDate && now > endDate) {
              subscriptionExpired = true;
              // If subscription is expired, we display as suspended in the matrix unless it's already inactive
              if (actualStatus === 'active') {
                actualStatus = 'suspended';
              }
            }
          }

          await tenantConn.close();
        }
      } catch (error) {
        console.log(` Impossible to fetch detailed info for ${tenant.name}:`, error.message);
      }

      return {
        ...tenant.toObject(),
        userCount,
        status: actualStatus, // Overwrite status with virtual status if expired
        isExpired: subscriptionExpired,
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

    // Count users and check subscription
    let userCount = 0;
    let subscriptionExpired = false;
    let actualStatus = tenant.status || 'inactive';

    try {
      if (tenant.databaseName) {
        const tenantConn = mongoose.createConnection(tenant.databaseUri);
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
          tenantConn.once('connected', () => {
            clearTimeout(timeout);
            resolve();
          });
          tenantConn.once('error', (err) => {
            clearTimeout(timeout);
            reject(err);
          });
        });

        const User = tenantConn.model('User', new mongoose.Schema({
          email: String,
          role: String
        }));
        userCount = await User.countDocuments();

        const Subscription = tenantConn.model('Subscription', new mongoose.Schema({
          status: String,
          currentPeriodEnd: Date,
          trialEndDate: Date
        }));

        const sub = await Subscription.findOne().sort({ createdAt: -1 });
        if (sub) {
          const now = new Date();
          const endDate = sub.currentPeriodEnd || sub.trialEndDate;
          if (endDate && now > endDate) {
            subscriptionExpired = true;
            if (actualStatus === 'active') {
              actualStatus = 'suspended';
            }
          }
        }

        await tenantConn.close();
      }
    } catch (error) {
      console.log(` Impossible to fetch detailed info:`, error.message);
    }

    res.json({
      success: true,
      data: {
        ...tenant.toObject(),
        userCount,
        status: actualStatus,
        isExpired: subscriptionExpired,
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
router.put('/tenants/:id', async (req, res) => {
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

    // AUTOMATIC STATUS HANDLING
    try {
      const tenantConn = mongoose.createConnection(tenant.databaseUri);
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
        tenantConn.once('connected', () => { clearTimeout(timeout); resolve(); });
        tenantConn.once('error', (err) => { clearTimeout(timeout); reject(err); });
      });

      const Subscription = require('../models/tenant/Subscription')(tenantConn);
      const latestSub = await Subscription.findOne().sort({ createdAt: -1 });

      if (latestSub) {
        const now = new Date();
        let newEndDate;
        let newStatus = req.body.status === 'active' ? 'active' : 'expired';

        if (req.body.status === 'active') {
          // Renew for 15 days from now
          newEndDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
          console.log(`✅ Automatically renewing subscription for ${tenant.name} -> ${newEndDate.toISOString()}`);
        } else if (req.body.status === 'suspended') {
          // Suspend: set end date to now (expired)
          newEndDate = now;
          console.log(`🛑 Automatically suspending subscription for ${tenant.name}`);
        }

        if (newEndDate) {
          await Subscription.findByIdAndUpdate(latestSub._id, {
            status: newStatus,
            currentPeriodEnd: newEndDate,
            trialEndDate: newEndDate
          });

          // Sync master tenant record
          const Tenant = req.masterDb.model('Tenant');
          await Tenant.findByIdAndUpdate(tenant._id, {
            'subscription.status': newStatus,
            'subscription.currentPeriodEnd': newEndDate
          });
        }
      }
      await tenantConn.close();
    } catch (err) {
      console.error(`❌ Subscription sync failed for ${tenant.name}:`, err.message);
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

    // AUTOMATIC STATUS HANDLING
    try {
      const tenantConn = mongoose.createConnection(tenant.databaseUri);
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
        tenantConn.once('connected', () => { clearTimeout(timeout); resolve(); });
        tenantConn.once('error', (err) => { clearTimeout(timeout); reject(err); });
      });

      const Subscription = require('../models/tenant/Subscription')(tenantConn);
      const latestSub = await Subscription.findOne().sort({ createdAt: -1 });

      if (latestSub) {
        const now = new Date();
        let newEndDate;
        let newStatus = status === 'active' ? 'active' : 'expired';

        if (status === 'active') {
          newEndDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
        } else if (status === 'suspended') {
          newEndDate = now;
        }

        if (newEndDate) {
          await Subscription.findByIdAndUpdate(latestSub._id, {
            status: newStatus,
            currentPeriodEnd: newEndDate,
            trialEndDate: newEndDate
          });

          // Sync master tenant record
          const Tenant = req.masterDb.model('Tenant');
          await Tenant.findByIdAndUpdate(tenant._id, {
            'subscription.status': newStatus,
            'subscription.currentPeriodEnd': newEndDate
          });
        }
      }
      await tenantConn.close();
    } catch (err) {
      console.error(`❌ Subscription sync failed for ${tenant.name}:`, err.message);
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

      // Try to count actual users and check expiration
      let isExpired = false;
      try {
        if (tenant.databaseName) {
          const tenantConn = mongoose.createConnection(tenant.databaseUri);
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timeout')), 3000);
            tenantConn.once('connected', () => {
              clearTimeout(timeout);
              resolve();
            });
            tenantConn.once('error', (err) => {
              clearTimeout(timeout);
              reject(err);
            });
          });

          // Count users
          const User = tenantConn.model('User', new mongoose.Schema({ email: String }));
          const userCount = await User.countDocuments();
          totalUsers += userCount;

          // Check expiration
          const Subscription = tenantConn.model('Subscription', new mongoose.Schema({
            currentPeriodEnd: Date,
            trialEndDate: Date
          }));
          const sub = await Subscription.findOne().sort({ createdAt: -1 });
          if (sub) {
            const now = new Date();
            const endDate = sub.currentPeriodEnd || sub.trialEndDate;
            if (endDate && now > endDate) {
              isExpired = true;
            }
          }

          await tenantConn.close();
        }
      } catch (err) {
        console.log(` Impossible to fetch detailed info for stats from ${tenant.name}:`, err.message);
      }

      // Calculate virtual status for stats
      let finalStatus = tenant.status || 'inactive';
      if (isExpired && finalStatus === 'active') {
        finalStatus = 'suspended';
      }

      tenant.virtualStatus = finalStatus; // Temporary property
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
      activeCompanies: tenants.filter(function (t) { return t.virtualStatus === 'active'; }).length,
      suspendedCompanies: tenants.filter(function (t) { return t.virtualStatus === 'suspended'; }).length,
      inactiveCompanies: tenants.filter(function (t) { return t.virtualStatus === 'inactive'; }).length,

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

// ========================
// LOGS MANAGEMENT
// ========================
const getLogController = (req) => new LogController(req.app.locals.masterDb);

router.get('/logs', (req, res) => getLogController(req).getLogs(req, res));
router.get('/logs/stats', (req, res) => getLogController(req).getLogStats(req, res));
router.get('/logs/export', (req, res) => getLogController(req).exportLogs(req, res));
router.get('/logs/:id', (req, res) => getLogController(req).getLogById(req, res));
router.post('/logs/clean', (req, res) => getLogController(req).cleanOldLogs(req, res));

module.exports = router;