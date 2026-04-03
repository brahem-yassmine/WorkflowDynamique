// back/src/services/subscriptionService.js
const mongoose = require('mongoose');
const { createInternalNotification } = require('../controllers/notificationController');

/**
 * Checks all active tenants for subscriptions expiring in exactly 3 days.
 * Sends a warning notification to the tenant admin.
 */
exports.checkExpiringSubscriptions = async (masterDb) => {
    try {
        console.log('⏰ Checking for expiring subscriptions (3-day warning)...');
        const Tenant = masterDb.model('Tenant');

        // Find tenants who are active and have a current subscription
        // We need to look into their own database for the active subscription record
        const activeTenants = await Tenant.find({ status: 'active' });

        for (const tenant of activeTenants) {
            try {
                const tenantConn = mongoose.createConnection(tenant.databaseUri);

                // Wait for connection
                await new Promise((resolve, reject) => {
                    tenantConn.once('connected', resolve);
                    tenantConn.once('error', reject);
                    setTimeout(() => reject(new Error('Timeout')), 5000);
                });

                const Subscription = require('../models/tenant/Subscription')(tenantConn);
                const User = require('../models/tenant/User')(tenantConn);
                const Notification = require('../models/tenant/Notification')(tenantConn);

                // Find active subscription
                const sub = await Subscription.findOne({ status: { $in: ['trial', 'active'] } }).sort({ createdAt: -1 });

                if (sub) {
                    const endDate = sub.trialEndDate || sub.currentPeriodEnd;
                    if (endDate) {
                        const daysLeft = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));

                        // Check if exactly 3 days left
                        if (daysLeft === 3) {
                            console.log(`⚠️ Warning: Subscription for ${tenant.name} expires in 3 days.`);

                            // Find admin to notify
                            const admin = await User.findOne({ role: 'admin' });
                            if (admin) {
                                await createInternalNotification(tenantConn, {
                                    recipient: admin._id,
                                    title: 'Abonnement bientôt expiré',
                                    message: `Votre abonnement ${sub.planName} expirera dans 3 jours. Pensez à le renouveler pour éviter toute interruption de service.`,
                                    type: 'warning',
                                    read: false
                                });
                            }
                        }
                    }
                }

                await tenantConn.close();
            } catch (err) {
                console.error(`❌ Error checking tenant ${tenant.name}:`, err.message);
            }
        }
        console.log('✅ Subscription check completed.');
    } catch (error) {
        console.error('❌ Global checkExpiringSubscriptions Error:', error);
    }
};

/**
 * Checks for tenants that have been archived for more than 30 days.
 * If found, automatically updates their status to 'suspended'.
 */
exports.checkArchivedTenants = async (masterDb) => {
    try {
        console.log('⏰ Checking for tenants archived > 60 days (Auto-Suspension)...');
        const Tenant = masterDb.model('Tenant');

        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        // Find tenants who are archived and were archived more than 60 days ago
        const tenantsToSuspend = await Tenant.find({
            status: 'archived',
            archivedAt: { $lte: sixtyDaysAgo }
        });

        if (tenantsToSuspend.length > 0) {
            console.log(`⚠️  Auto-suspending ${tenantsToSuspend.length} archived tenants...`);
            
            for (const tenant of tenantsToSuspend) {
                await Tenant.findByIdAndUpdate(tenant._id, {
                    status: 'suspended',
                    archivedAt: null // Clear archivedAt once suspended
                });
                console.log(`🔒 Tenant ${tenant.name} has been auto-suspended after 60 days in archive.`);
            }
        } else {
            console.log('✅ No tenants found for auto-suspension.');
        }

    } catch (error) {
        console.error('❌ Global checkArchivedTenants Error:', error);
    }
};
/**
 * Checks all active tenants for expired subscriptions.
 * If found, automatically updates their status to 'archived' and records the archival date.
 */
exports.handleExpiredSubscriptions = async (masterDb) => {
    try {
        console.log('⏰ Checking for expired subscriptions (Auto-Archive)...');
        const Tenant = masterDb.model('Tenant');

        const now = new Date();

        // Find tenants who are active but have an expired subscription
        const expiredTenants = await Tenant.find({
            status: 'active',
            'subscription.currentPeriodEnd': { $lt: now }
        });

        if (expiredTenants.length > 0) {
            console.log(`⚠️  Archiving ${expiredTenants.length} tenants with expired subscriptions...`);
            for (const tenant of expiredTenants) {
                await Tenant.findByIdAndUpdate(tenant._id, {
                    status: 'archived',
                    archivedAt: now
                });
                console.log(`📂 Tenant ${tenant.name} has been auto-archived due to subscription expiration.`);
            }
        } else {
            console.log('✅ No expired active subscriptions found.');
        }

    } catch (error) {
        console.error('❌ Global handleExpiredSubscriptions Error:', error);
    }
};
