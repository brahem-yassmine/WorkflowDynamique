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
    const tenant = await Tenant.findById(tenantId)
      .populate('currentSubscription')
      .populate('selectedPlan');

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
    const userId = req.user._id;

    const Plan = req.masterDb.model('Plan');
    const Subscription = req.tenantConn.model('Subscription');
    const Tenant = req.masterDb.model('Tenant');

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // 1️⃣ CANCEL OLD SUBSCRIPTION
    await Subscription.updateMany(
      { status: { $in: ['trial', 'active'] } },
      {
        status: 'canceled',
        canceledAt: new Date()
      }
    );

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
    });

    await subscription.save();

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

    res.json({
      success: true,
      message: 'Plan changed successfully',
      data: { subscription, plan }
    });
  } catch (error) {
    console.error('changePlan Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};