// back/src/controllers/subscriptionController.js
// Models will be retrieved from connections in methods

// ✅ Get subscription history
exports.getSubscriptionHistory = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const Subscription = req.tenantConn.model('Subscription');

    const subscriptions = await Subscription.find()
      .populate('selectedBy', 'email firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    console.error('getSubscriptionHistory Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ✅ Get current active subscription
exports.getCurrentSubscription = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const Tenant = req.masterDb.model('Tenant');
    const Subscription = req.tenantConn.model('Subscription');

    // Either from tenant directly
    const tenant = await Tenant.findById(tenantId);

    // Or find active subscription
    const subscription = await Subscription.findOne({
      status: { $in: ['trial', 'active'] }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        subscription,
        tenantSubscription: tenant.currentSubscription,
        plan: tenant.selectedPlan
      }
    });
  } catch (error) {
    console.error('getCurrentSubscription Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ✅ Change plan (upgrade/downgrade)
exports.changePlan = async (req, res) => {
  try {
    const { planId, billingCycle, paymentInfo } = req.body;
    const tenantId = req.user.tenantId;
    const userId = req.user.id || req.user.userId || req.user._id;

    if (!req.masterDb || !req.tenantConn) {
      console.error('❌ [ChangePlan] Missing DB connections:', { master: !!req.masterDb, tenant: !!req.tenantConn });
      return res.status(500).json({
        success: false,
        message: 'Database connection error'
      });
    }

    const Plan = req.masterDb.model('Plan');
    const Subscription = req.tenantConn.model('Subscription');
    const Tenant = req.masterDb.model('Tenant');
    const User = req.tenantConn.model('User');

    const plan = await Plan.findById(planId);
    if (!plan) {
      console.log('❌ [ChangePlan] Plan not found:', planId);
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Resolve User ID in Tenant DB for 'selectedBy' population
    let tenantUserId = userId;
    try {
      const tUser = await User.findOne({ email: req.user.email.toLowerCase() });
      if (tUser) {
        tenantUserId = tUser._id;
        console.log('✅ [ChangePlan] Resolved Tenant User ID for selectedBy:', tenantUserId);
      }
    } catch (e) {
      console.warn('⚠️ [ChangePlan] Could not resolve Tenant User ID, falling back to req.user.id');
    }

    console.log('🔄 [ChangePlan] Found plan:', plan.name, 'Price:', plan.price);

    // 0️⃣ PREVENT DEMO RE-USE
    if (plan.code.toLowerCase().includes('demo')) {
      const hasUsedDemo = await Subscription.findOne({
        planCode: { $regex: /demo/i },
        status: { $ne: 'trial' } // Only check if they actually transitioned or if they are switching BACK to it
      });

      // If they already have any subscription record for demo, block it (except if it's their current one, though frontend handles that)
      const anyDemoRecord = await Subscription.findOne({ planCode: { $regex: /demo/i } });
      if (anyDemoRecord) {
        return res.status(403).json({
          success: false,
          message: 'The Demo Protocol has already been utilized for this matrix. Uplink to a paid plan is required.'
        });
      }
    }

    // 1️⃣ CANCEL OLD SUBSCRIPTION
    console.log('🔄 [ChangePlan] Canceling old subscriptions for tenant:', tenantId);
    try {
      await Subscription.updateMany(
        { status: { $in: ['trial', 'active'] } },
        {
          status: 'canceled',
          canceledAt: new Date()
        }
      );
      console.log('✅ [ChangePlan] Old subscriptions canceled');
    } catch (e) {
      console.error('❌ [ChangePlan] Error canceling old subscriptions:', e.message);
      throw new Error('Error canceling old subscriptions: ' + e.message);
    }

    // 2️⃣ CREATE NEW SUBSCRIPTION
    const subscription = new Subscription({
      planId: plan._id,
      planName: plan.name,
      planCode: plan.code,
      billingCycle,
      price: plan.price,
      status: 'active', // No more trial if already a customer
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      selectedBy: userId,
      paymentInfo: paymentInfo // Save payment info
      billingCycle: billingCycle || 'monthly',
      price: plan.price,
      status: 'active', // No more trial if already a customer
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days per user rules
      selectedBy: tenantUserId
    });

    try {
      await subscription.save();
      console.log('✅ [ChangePlan] New subscription saved:', subscription._id);
    } catch (e) {
      console.error('❌ [ChangePlan] Error saving subscription:', e.message);
      throw new Error('Error saving subscription: ' + e.message);
    }

    // 3️⃣ UPDATE TENANT
    await Tenant.findByIdAndUpdate(tenantId, {
      selectedPlan: plan._id,
      currentSubscription: subscription._id,
      'planDetails': {
        name: plan.name,
        code: plan.code,
        price: plan.price,
        currency: plan.currency || 'D',
        features: plan.features
      },
      'subscription.status': 'active',
      'subscription.billingCycle': billingCycle,
      'subscription.currentPeriodStart': subscription.currentPeriodStart,
      'subscription.currentPeriodEnd': subscription.currentPeriodEnd
    });
    console.log('🔄 [ChangePlan] Updating tenant fields:', tenantId);
    try {
      const updateData = {
        selectedPlan: plan._id,
        currentSubscription: subscription._id,
        'planDetails': {
          name: plan.name,
          code: plan.code,
          price: plan.price,
          currency: plan.currency || 'D',
          features: plan.features
        },
        'subscription.status': 'active',
        'subscription.billingCycle': billingCycle || 'monthly',
        'subscription.currentPeriodStart': subscription.currentPeriodStart,
        'subscription.currentPeriodEnd': subscription.currentPeriodEnd
      };

      console.log('🔄 [ChangePlan] Update Data:', JSON.stringify(updateData, null, 2));

      const updatedTenant = await Tenant.findByIdAndUpdate(tenantId, updateData, {
        new: true,
        runValidators: false // Skip potentially problematic validations on updated schema
      });

      if (!updatedTenant) {
        console.error('❌ [ChangePlan] Tenant update failed: Tenant not found', tenantId);
        throw new Error('Tenant not found during update');
      }

      console.log('✅ [ChangePlan] Tenant updated successfully');
    } catch (e) {
      console.error('❌ [ChangePlan] Error updating tenant:', e.message);
      throw new Error('Error updating tenant: ' + e.message);
    }

    res.json({
      success: true,
      message: 'Plan changed successfully',
      data: { subscription, plan }
    });
  } catch (error) {
    console.error('❌ [ChangePlan] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};