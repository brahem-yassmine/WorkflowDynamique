// back/test_subscription_logic.js
const mongoose = require('mongoose');
const { checkExpiringSubscriptions } = require('./src/services/subscriptionService');
require('dotenv').config();

async function test() {
    try {
        const MASTER_DB_URI = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/workflow_master';
        const masterConnection = await mongoose.createConnection(MASTER_DB_URI).asPromise();

        // Define models on master connection
        require('./src/models/master/Tenant')(masterConnection);
        require('./src/models/master/Plan')(masterConnection);

        console.log('🧪 Starting subscription logic verification...');

        // 1. Check existing tenants and their durations (manual inspection of DB recommended)
        // 2. Run the expiry check
        await checkExpiringSubscriptions(masterConnection);

        console.log('🧪 Verification run finished. Check console logs for warnings.');

        await masterConnection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Test failed:', err);
        process.exit(1);
    }
}

test();
