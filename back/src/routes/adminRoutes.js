// back/src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth, requireRole } = require('../middleware/auth');
const LogController = require('../controllers/master/logController');
const plansConfig = require('../config/plans');

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
      let workflowNodeCount = 0;
      let executionCount = 0;
      let subscriptionExpired = false;
      let actualStatus = tenant.status || 'inactive';
      let currentPeriodEnd = null;

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

          // Count Workflows and Nodes
          const Workflow = tenantConn.model('Workflow', new mongoose.Schema({
            nodes: [mongoose.Schema.Types.Mixed]
          }));
          const workflows = await Workflow.find({}, 'nodes');
          workflowNodeCount = workflows.reduce((acc, wf) => acc + (wf.nodes?.length || 0), 0);

          // Count Executions
          const WorkflowInstance = tenantConn.model('WorkflowInstance', new mongoose.Schema({}));
          executionCount = await WorkflowInstance.countDocuments();

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
            currentPeriodEnd = endDate;
            if (endDate && now > endDate) {
              subscriptionExpired = true;
              // If subscription is expired, we display as archived in the matrix unless it's already inactive
              if (actualStatus === 'active') {
                actualStatus = 'archived';
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
        workflowNodeCount,
        executionCount,
        status: actualStatus, // Overwrite status with virtual status if expired
        isExpired: subscriptionExpired,
        currentPeriodEnd,
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
    let currentPeriodEnd = null;

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
          currentPeriodEnd = endDate;
          if (endDate && now > endDate) {
            subscriptionExpired = true;
            if (actualStatus === 'active') {
              actualStatus = 'archived';
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
        currentPeriodEnd,
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
          console.log(`âœ… Automatically renewing subscription for ${tenant.name} -> ${newEndDate.toISOString()}`);
        } else if (req.body.status === 'suspended') {
          // Suspend: set end date to now (expired)
          newEndDate = now;
          console.log(`ðŸ›‘ Automatically suspending subscription for ${tenant.name}`);
        }

        if (newEndDate) {
          await Subscription.findByIdAndUpdate(latestSub._id, {
            status: newStatus,
            currentPeriodEnd: newEndDate,
            trialEndDate: newEndDate
          });

          // Sync master tenant record
          const Tenant = masterDb.model('Tenant');
          await Tenant.findByIdAndUpdate(tenant._id, {
            'subscription.status': newStatus,
            'subscription.currentPeriodEnd': newEndDate
          });
        }
      }
      await tenantConn.close();
    } catch (err) {
      console.error(`âŒ Subscription sync failed for ${tenant.name}:`, err.message);
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

    if (!['active', 'suspended', 'inactive', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const updateData = { status };
    if (status === 'archived') {
      updateData.archivedAt = new Date();
    } else {
      updateData.archivedAt = null; // Clear if un-archiving
    }

    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      updateData,
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
          const Tenant = masterDb.model('Tenant');
          await Tenant.findByIdAndUpdate(tenant._id, {
            'subscription.status': newStatus,
            'subscription.currentPeriodEnd': newEndDate
          });
        }
      }
      await tenantConn.close();
    } catch (err) {
      console.error(`âŒ Subscription sync failed for ${tenant.name}:`, err.message);
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

// DELETE /api/admin/tenants/:id - Delete (soft delete & status progression)
router.delete('/tenants/:id', async (req, res) => {
  try {
    const masterDb = req.app.locals.masterDb;
    const Tenant = masterDb.model('Tenant');

    const currentTenant = await Tenant.findById(req.params.id);

    if (!currentTenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Progression: Active -> Archived -> Suspended
    let nextStatus = 'archived';
    let archivedAt = new Date();

    console.log(`[Lifecycle] Processing ${currentTenant.name} (DB Status: ${currentTenant.status})`);

    // Check if it's virtually archived due to expiration
    let isVirtuallyArchived = false;
    if (currentTenant.status === 'active' && currentTenant.databaseUri) {
      try {
        const tenantConn = mongoose.createConnection(currentTenant.databaseUri);
        await new Promise((resolve) => {
           const timeout = setTimeout(resolve, 3000);
           tenantConn.once('connected', () => { clearTimeout(timeout); resolve(); });
        });
        if (tenantConn.readyState === 1) {
          const Subscription = require('../models/tenant/Subscription')(tenantConn);
          const sub = await Subscription.findOne().sort({ createdAt: -1 });
          if (sub) {
            const now = new Date();
            const endDate = sub.currentPeriodEnd || sub.trialEndDate;
            if (endDate && now > endDate) {
              isVirtuallyArchived = true;
              console.log(`[Lifecycle] ${currentTenant.name} is virtually ARCHIVED (expired)`);
            }
          }
          await tenantConn.close();
        }
      } catch (err) {
        console.warn(`[Lifecycle] Could not check expiration for ${currentTenant.name}:`, err.message);
      }
    }

    if (currentTenant.status === 'archived' || isVirtuallyArchived) {
      nextStatus = 'suspended';
      archivedAt = null; // No longer archived, now suspended
    }

    const updateData = { 
      status: nextStatus,
      archivedAt: archivedAt
    };

    // If suspending, also mark subscription as expired in master record
    if (nextStatus === 'suspended') {
      console.log(`[Lifecycle] Transitioning ${currentTenant.name} to SUSPENDED`);
      updateData['subscription.status'] = 'expired';
      updateData['subscription.currentPeriodEnd'] = new Date();
    } else {
      console.log(`[Lifecycle] Transitioning ${currentTenant.name} to ARCHIVED`);
    }

    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    // Sync with tenant database if possible
    if (nextStatus === 'suspended' && tenant.databaseUri) {
      try {
        console.log(`[Lifecycle] Syncing with tenant DB for ${tenant.name}...`);
        const tenantConn = mongoose.createConnection(tenant.databaseUri);
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
          tenantConn.once('connected', () => { clearTimeout(timeout); resolve(); });
          tenantConn.once('error', (err) => { clearTimeout(timeout); reject(err); });
        });

        const Subscription = require('../models/tenant/Subscription')(tenantConn);
        const subUpdate = await Subscription.updateMany(
          { status: { $in: ['trial', 'active'] } },
          { 
            status: 'expired',
            currentPeriodEnd: new Date()
          }
        );
        console.log(`✅ [Lifecycle] Tenant DB sync: ${subUpdate.modifiedCount} subscriptions expired for ${tenant.name}`);
        await tenantConn.close();
      } catch (err) {
        console.error(`❌ [Lifecycle] Tenant DB sync failed for ${tenant.name}:`, err.message);
      }
    }

    res.json({
      success: true,
      message: `Tenant ${nextStatus === 'suspended' ? 'permanently suspended' : 'archived'} successfully`,
      data: tenant,
      nextStatus
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

    const Plan = masterDb.model('Plan');
    const allAvailablePlans = await Plan.find({ isActive: true }).sort({ price: 1 });

    // Initialize counters
    let totalUsers = 0;
    let totalWorkflows = 0;
    let totalNodes = 0;
    let totalExecutions = 0;
    const sectorCounts = {};
    
    // Initialize distributions with ALL available plans
    const planCounts = {};
    const planRevenueMapping = {};
    allAvailablePlans.forEach(p => {
      planCounts[p.name] = 0;
      planRevenueMapping[p.name] = 0;
    });

    let totalMonthlyRevenue = 0;
    let lastMonthRevenue = 0;

    const now = new Date();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Real Monthly History (Last 6 Months)
    const monthlyRevenueMap = {};
    const monthLabels = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = monthNames[d.getMonth()];
      monthlyRevenueMap[label] = 0;
      monthLabels.push(label);
    }

    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Historical Stats (Last 7 Days)
    const dailyGrowth = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyGrowth[dateStr] = { companies: 0, workflows: 0 };
    }

    // Iterate through all tenants to collect stats

    for (const tenant of tenants) {
      // Base stats
      let sector = tenant.industry || 'Other';
      const industryMap = {
        'Construction & Engineering': 'Construction',
        'Information Technology & Software': 'Tech/IT',
        'Corporate & Business Services': 'Business',
        'Non spécifié': 'Other'
      };
      if (industryMap[sector]) sector = industryMap[sector];

      sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;

      const tenantPlanName = (tenant.selectedPlan?.name || tenant.planDetails?.name || '').toLowerCase();
      const tenantPlanCode = (tenant.selectedPlan?.code || tenant.planDetails?.code || '').toLowerCase();

      // Find matching plan from our master list
      const matchedPlan = allAvailablePlans.find(p => 
        p.name.toLowerCase() === tenantPlanName || 
        p.code.toLowerCase() === tenantPlanCode ||
        p.name.toLowerCase().includes(tenantPlanName) && tenantPlanName.length > 2
      );

      const planPrice = matchedPlan ? matchedPlan.price : (tenant.planDetails?.price || 0);

      if (matchedPlan) {
        planCounts[matchedPlan.name]++;
        planRevenueMapping[matchedPlan.name] += planPrice;
      }
      
      totalMonthlyRevenue += planPrice;

      // Calculate last month revenue (approximate based on creation date)
      const tenantCreatedAt = new Date(tenant.createdAt);
      if (tenantCreatedAt <= lastMonthDate) {
        lastMonthRevenue += planPrice;
      }

      // Track company growth
      const regDate = tenant.createdAt.toISOString().split('T')[0];
      if (dailyGrowth[regDate]) dailyGrowth[regDate].companies++;

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

          // Count Workflows and Nodes
          const Workflow = tenantConn.model('Workflow', new mongoose.Schema({
            nodes: [mongoose.Schema.Types.Mixed],
            createdAt: Date
          }));
          const workflows = await Workflow.find({});
          const nodeCount = workflows.reduce((acc, wf) => acc + (wf.nodes?.length || 0), 0);
          totalWorkflows += workflows.length;
          totalNodes += nodeCount;

          // Track workflow growth by day
          workflows.forEach(wf => {
            const wfDate = wf.createdAt?.toISOString().split('T')[0];
            if (dailyGrowth[wfDate]) dailyGrowth[wfDate].workflows++;
          });

          // Count Executions
          const WorkflowInstance = tenantConn.model('WorkflowInstance', new mongoose.Schema({}));
          totalExecutions += await WorkflowInstance.countDocuments();

          // Check expiration and count subscriptions for real history
          const Subscription = tenantConn.model('Subscription', new mongoose.Schema({
            price: Number,
            createdAt: Date,
            status: String,
            currentPeriodEnd: Date,
            trialEndDate: Date
          }));
          
          const subs = await Subscription.find({ status: { $ne: 'canceled' } });
          subs.forEach(sub => {
            const date = new Date(sub.createdAt);
            const label = monthNames[date.getMonth()];
            if (monthlyRevenueMap[label] !== undefined) {
              monthlyRevenueMap[label] += (sub.price || 0);
            }
          });

          const latestSub = await Subscription.findOne().sort({ createdAt: -1 });
          if (latestSub) {
            const endDate = latestSub.currentPeriodEnd || latestSub.trialEndDate;
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

    // Calculate Trends (Comparison between Today and 7 Days Ago - "Evolution of the Week")
    const sortedDates = Object.keys(dailyGrowth).sort().reverse(); // [Today, Day1, ..., Day6]
    
    // Most recent vs Oldest in the 7-day window
    const newestKey = sortedDates[0];
    const oldestKey = sortedDates[sortedDates.length - 1];

    const calcEvolution = (curr, prev) => {
      if (prev === 0) return curr > 0 ? "+100%" : "Stable";
      const diff = ((curr - prev) / prev) * 100;
      return (diff >= 0 ? "+" : "") + diff.toFixed(0) + "%";
    };

    const companiesTrend = calcEvolution(dailyGrowth[newestKey].companies, dailyGrowth[oldestKey].companies);
    const workflowsTrend = calcEvolution(dailyGrowth[newestKey].workflows, dailyGrowth[oldestKey].workflows);

    // Calculated statistics
    const stats = {
      totalCompanies: tenants.length,
      activeCompanies: tenants.filter(function (t) { return t.virtualStatus === 'active'; }).length,
      suspendedCompanies: tenants.filter(function (t) { return t.virtualStatus === 'suspended'; }).length,
      inactiveCompanies: tenants.filter(function (t) { return t.virtualStatus === 'inactive'; }).length,
      archivedCompanies: tenants.filter(function (t) { return t.status === 'archived'; }).length,

      totalUsers: totalUsers,
      totalWorkflows: totalWorkflows,
      totalExecutions: totalExecutions,

      trialCompanies: allAvailablePlans.filter(p => p.price === 0).reduce((acc, p) => acc + (planCounts[p.name] || 0), 0),
      paidCompanies: allAvailablePlans.filter(p => p.price > 0).reduce((acc, p) => acc + (planCounts[p.name] || 0), 0),

      // Trends (Evolution Today vs 7 Days Ago)
      companiesTrend: companiesTrend,
      workflowsTrend: workflowsTrend,

      // Calculate a "load" proxy based on active users and node complexity
      averageGpuUsage: Math.min(95, Math.max(15, Math.floor((totalUsers * 0.5) + (totalNodes * 0.1)))),

      // Data for charts
      sectorDistribution: sectorDistribution,
      planDistribution: planDistribution,

      revenue: {
        total: totalMonthlyRevenue,
        growthTrend: lastMonthRevenue > 0 ? `+${(((totalMonthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)}%` : '+0.0%',
        monthly: monthLabels.map(label => ({
          month: label,
          revenue: monthlyRevenueMap[label]
        })),
        perPlan: Object.keys(planRevenueMapping).map(name => ({
          name,
          revenue: planRevenueMapping[name],
          subscribers: planCounts[name]
        })),
        conversionRate: tenants.length > 0 ? (((tenants.filter(function (t) { return t.virtualStatus === 'active'; }).length) / tenants.length) * 100).toFixed(1) : 0,
        retentionRate: tenants.length > 0 ? (((tenants.filter(t => t.virtualStatus !== 'suspended').length) / tenants.length) * 100).toFixed(1) : 100
      },

      growth: Object.keys(dailyGrowth).sort().map(date => ({
        date,
        companies: dailyGrowth[date].companies,
        workflows: dailyGrowth[date].workflows
      }))
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

    const Plan = masterDb.model('Plan');
    let plans = await Plan.find().sort({ price: 1 });

    // Auto-sync with codebase configuration to ensure data integrity
    if (plansConfig.plans) {
      console.log('🔄 Synchronizing plans with codebase configuration...');
      for (const p of plansConfig.plans) {
        await Plan.findOneAndUpdate(
          { code: p.code }, // Sync by code is more reliable than by name
          { ...p, isActive: true },
          { upsert: true }
        );
      }
      // Re-fetch after sync
      plans = await Plan.find().sort({ price: 1 });
    }

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
// POST /api/admin/plans/sync - Sync with code configuration
router.post('/plans/sync', async (req, res) => {
  try {
    const masterDb = req.app.locals.masterDb;
    const Plan = masterDb.model('Plan');

    const results = [];
    for (const p of plansConfig.plans) {
      const plan = await Plan.findOneAndUpdate(
        { name: p.name },
        { ...p, isActive: true },
        { upsert: true, new: true }
      );
      results.push(plan);
    }

    res.json({
      success: true,
      message: 'Plans synchronized with codebase successfully',
      data: results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/plans/:id/subscribers - Get subscribers with consumption metrics
router.get('/plans/:id/subscribers', async (req, res) => {
  try {
    const { id } = req.params;
    const masterDb = req.app.locals.masterDb;
    const Tenant = masterDb.model('Tenant');
    const Plan = masterDb.model('Plan');

    const plan = await Plan.findById(id);
    if (!plan) {
      console.log(`❌ Plan not found for ID: ${id}`);
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    console.log(`🔍 Fetching subscribers for plan: ${plan.name} (${plan.code}) ID: ${id}`);

    // To ensure perfect consistency with the dashboard stats, 
    // we fetch all tenants and use the same fuzzy matching logic
    const allTenants = await Tenant.find().populate('selectedPlan');
    const allAvailablePlans = await Plan.find({ isActive: true });

    const filteredTenants = allTenants.filter(tenant => {
      const tenantPlanName = (tenant.selectedPlan?.name || tenant.planDetails?.name || '').toLowerCase();
      const tenantPlanCode = (tenant.selectedPlan?.code || tenant.planDetails?.code || '').toLowerCase();

      // Check if this tenant matches the requested plan
      const matchesById = tenant.selectedPlan?._id?.toString() === id || tenant.selectedPlan?.toString() === id;
      const matchesByCode = tenantPlanCode === plan.code.toLowerCase();
      const matchesByName = tenantPlanName === plan.name.toLowerCase() || 
                            (tenantPlanName.includes(plan.name.toLowerCase()) && plan.name.length > 2);

      return matchesById || matchesByCode || matchesByName;
    });

    console.log(`✅ Filtered ${filteredTenants.length} tenants using fuzzy matching (Dashboard Sync)`);

    const enrichedSubscribers = await Promise.all(filteredTenants.map(async (tenant) => {
      let userCount = 0;
      let workflowCount = 0;
      let nodeCount = 0;

      try {
        if (tenant.databaseName) {
          const tenantConn = mongoose.createConnection(tenant.databaseUri);
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
            tenantConn.once('connected', () => { clearTimeout(timeout); resolve(); });
            tenantConn.once('error', (err) => { clearTimeout(timeout); reject(err); });
          });

          // Count Users (Excluding Admins)
          const User = tenantConn.model('User', new mongoose.Schema({ role: String }));
          userCount = await User.countDocuments({ role: { $nin: ['admin', 'super_admin'] } });

          // Count Total Nodes & Workflows
          const Workflow = tenantConn.model('Workflow', new mongoose.Schema({ nodes: Array }));
          const workflows = await Workflow.find({}, 'nodes');
          nodeCount = workflows.reduce((acc, wf) => acc + (wf.nodes?.length || 0), 0);
          workflowCount = workflows.length;

          await tenantConn.close();
        }
      } catch (err) {
        console.error(`❌ Subscribers aggregation failed for ${tenant.name}:`, err.message);
      }

      return {
        id: tenant._id,
        name: tenant.name,
        domain: tenant.domain,
        status: tenant.status,
        consumption: {
          users: userCount,
          nodes: nodeCount,
          workflows: workflowCount
        }
      };
    }));

    res.json({
      success: true,
      plan: plan,
      subscribers: enrichedSubscribers
    });
  } catch (error) {
    console.error(' Error GET /plans/:id/subscribers:', error);
    res.status(500).json({ success: false, message: error.message });
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

    // Get previous plan state to detect deactivation
    const previousPlan = await Plan.findById(req.params.id);

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

    // CASCADE DEACTIVATION
    // Check if the plan was just disabled
    const previouslyActive = previousPlan ? (previousPlan.isActive !== false && previousPlan.active !== false) : true;
    const isNowDisabled = (req.body.isActive === false || req.body.active === false);

    if (previouslyActive && isNowDisabled) {
      console.log(`🚫 Plan ${plan.name} was disabled. Cascading suspension to all assigned tenants...`);
      const Tenant = masterDb.model('Tenant');
      const affectedTenants = await Tenant.find({ selectedPlan: plan._id, status: 'active' });

      for (const tenant of affectedTenants) {
        // 1. Suspend tenant in master DB
        await Tenant.findByIdAndUpdate(tenant._id, { status: 'suspended' });

        // 2. Suspend tenant in their own local Subscription DB
        try {
          if (tenant.databaseName) {
            const tenantConn = mongoose.createConnection(tenant.databaseUri);
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
              tenantConn.once('connected', () => { clearTimeout(timeout); resolve(); });
              tenantConn.once('error', (err) => { clearTimeout(timeout); reject(err); });
            });

            const Subscription = require('../models/tenant/Subscription')(tenantConn);
            const latestSub = await Subscription.findOne().sort({ createdAt: -1 });
            if (latestSub) {
              await Subscription.findByIdAndUpdate(latestSub._id, {
                status: 'expired',
                currentPeriodEnd: new Date(),
                trialEndDate: new Date()
              });
            }
            await tenantConn.close();
            console.log(`✅ Suspended tenant: ${tenant.name}`);
          }
        } catch (err) {
          console.error(`❌ Subscription cascade suspend failed for ${tenant.name}:`, err.message);
        }
      }
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
router.delete('/logs/purge', (req, res) => getLogController(req).deleteBulkLogs(req, res));
router.delete('/logs/:id', (req, res) => getLogController(req).deleteLog(req, res));

module.exports = router;
