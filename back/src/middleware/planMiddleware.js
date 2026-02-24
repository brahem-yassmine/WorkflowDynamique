// back/src/middleware/planMiddleware.js
const Tenant = require('../models/master/Tenant');
const User = require('../models/tenant/User');
const Workflow = require('../models/tenant/Workflow');

// Check plan limits
exports.checkPlanLimits = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.user.tenantId).populate('selectedPlan');

    if (!tenant || !tenant.selectedPlan) {
      return res.status(403).json({
        success: false,
        message: 'No plan selected',
        requiresPlanSelection: true
      });
    }

    // Check trial period
    if (tenant.trialPeriod.isActive && tenant.trialPeriod.endDate < new Date()) {
      tenant.trialPeriod.isActive = false;
      tenant.subscription.status = 'expired';
      await tenant.save();

      return res.status(403).json({
        success: false,
        message: 'Trial period expired',
        trialExpired: true
      });
    }

    // Attach plan info to req
    req.tenantPlan = tenant.planDetails;
    req.planLimits = tenant.planDetails.features;

    next();

  } catch (error) {
    console.error('checkPlanLimits Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Check user limit
exports.checkUserLimit = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const limits = req.planLimits;

    const userCount = await User.countDocuments({ tenantId, isActive: true });

    if (userCount >= limits.maxUsers) {
      return res.status(403).json({
        success: false,
        message: `User limit reached (${limits.maxUsers})`,
        code: 'USER_LIMIT_EXCEEDED'
      });
    }

    next();

  } catch (error) {
    console.error('checkUserLimit Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Check workflow limit
exports.checkWorkflowLimit = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const limits = req.planLimits;

    const workflowCount = await Workflow.countDocuments({ tenantId });

    if (workflowCount >= limits.maxWorkflows) {
      return res.status(403).json({
        success: false,
        message: `Workflow limit reached (${limits.maxWorkflows})`,
        code: 'WORKFLOW_LIMIT_EXCEEDED'
      });
    }

    next();

  } catch (error) {
    console.error('checkWorkflowLimit Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};