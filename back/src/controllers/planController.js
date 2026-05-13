// back/src/controllers/planController.js
const jwt = require('jsonwebtoken');

// ✅ Get all available plans
exports.getPlans = async (req, res) => {
  try {
    console.log('📋 Fetching plans...');

    // ✅ Detailed verification
    if (!req.masterDb) {
      console.error('❌ masterDb unavailable');
      return res.status(500).json({
        success: false,
        message: 'Database connection not established'
      });
    }

    console.log('📊 Models in masterDb:', Object.keys(req.masterDb.models));

    // ✅ Check if model already exists
    let Plan;

    if (req.masterDb.models['Plan']) {
      // If model exists, use it
      Plan = req.masterDb.model('Plan');
      console.log('✅ Plan model found in masterDb.models');
    } else {
      console.log('⚠️ Plan model not found, attempting creation...');

      // If model doesn't exist, create it
      const mongoose = require('mongoose');
      const PlanSchema = new mongoose.Schema({
        name: String,
        code: String,
        price: Number,
        currency: String,
        interval: String,
        features: Object,
        description: String,
        isActive: Boolean
      }, { timestamps: true });

      Plan = req.masterDb.model('Plan', PlanSchema);
      console.log('✅ Plan model created dynamically');
    }

    // Perform query
    const now = new Date();
    const plans = await Plan.find({ 
      isActive: true,
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gt: now } }
      ]
    })
      .sort({ price: 1 })
      .lean();

    console.log(`✅ ${plans.length} plans found`);

    res.json({
      success: true,
      data: plans
    });

  } catch (error) {
    console.error('❌ Error getPlans:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// ✅ Check if plan selection is required
exports.checkPlanSelection = async (req, res) => {
  try {
    console.log('🔍 Checking plan selection for user:', req.user?._id);

    if (!req.tenantConn) {
      console.error('❌ tenantConn unavailable');
      return res.status(500).json({
        success: false,
        message: 'Tenant database connection not established'
      });
    }

    const User = req.tenantConn.model('User');

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const requiresPlanSelection = !user.hasSelectedPlan;

    console.log('✅ Verification completed:', { requiresPlanSelection, role: user.role });

    res.json({
      success: true,
      data: {
        requiresPlanSelection,
        hasSelectedPlan: user.hasSelectedPlan,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Error checkPlanSelection:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ✅ Select a plan
exports.selectPlan = async (req, res) => {
  try {
    const { planId, billingCycle } = req.body;
    const userId = req.user._id;
    const tenantId = req.user.tenantId;

    console.log('📝 Selecting plan:', { planId, billingCycle, userId, tenantId });

    if (!req.masterDb) {
      return res.status(500).json({
        success: false,
        message: 'Master connection not established'
      });
    }

    if (!req.tenantConn) {
      return res.status(500).json({
        success: false,
        message: 'Tenant connection not established'
      });
    }

    // Check if Plan model exists in masterDb
    if (!req.masterDb.models['Plan']) {
      console.log('⚠️ Plan model not found in masterDb, creating...');
      const mongoose = require('mongoose');
      const PlanSchema = new mongoose.Schema({
        name: String,
        code: String,
        price: Number,
        currency: String,
        interval: String,
        features: Object,
        description: String,
        isActive: Boolean
      }, { timestamps: true });

      req.masterDb.model('Plan', PlanSchema);
    }

    const Plan = req.masterDb.model('Plan');
    const User = req.tenantConn.model('User');
    const Subscription = req.tenantConn.model('Subscription');
    const Tenant = req.masterDb.model('Tenant');

    // Verify plan exists
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Update user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Handle Start Date and Duration
    const start = req.body.startDate ? new Date(req.body.startDate) : new Date();
    const planCode = plan.code ? plan.code.toLowerCase() : '';
    const trialDays = (planCode.includes('demo') || planCode.includes('lattice')) ? 7 : 15;

    const trialEndDate = new Date(start.getTime() + trialDays * 24 * 60 * 60 * 1000);

    user.hasSelectedPlan = true;
    user.planSelectedAt = new Date();
    user.selectedPlan = plan.name;
    await user.save();

    // Create subscription
    const subscription = new Subscription({
      tenantId,
      planId: plan._id,
      planName: plan.name,
      planCode: plan.code,
      billingCycle: billingCycle || 'monthly',
      price: plan.price,
      status: 'trial',
      selectedBy: userId,
      trialStartDate: start,
      trialEndDate: trialEndDate,
      currentPeriodStart: start,
      currentPeriodEnd: trialEndDate
    });

    await subscription.save();

    // Update tenant
    const tenant = await Tenant.findById(tenantId);
    if (tenant) {
      tenant.selectedPlan = plan._id;
      tenant.currentSubscription = subscription._id;
      tenant.planDetails = {
        name: plan.name,
        code: plan.code,
        price: plan.price,
        currency: plan.currency,
        features: plan.features
      };
      tenant.trialPeriod = {
        startDate: start,
        endDate: trialEndDate,
        isActive: true
      };
      await tenant.save();
    }

    // Generate new token
    const token = jwt.sign(
      {
        userId: user._id,
        tenantId: user.tenantId,
        role: user.role,
        email: user.email,
        hasSelectedPlan: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Plan selected successfully',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          hasSelectedPlan: user.hasSelectedPlan
        },
        plan,
        subscription,
        token
      }
    });

  } catch (error) {
    console.error('❌ Error selectPlan:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};