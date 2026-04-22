const mongoose = require('mongoose');

async function fix() {
    console.log('🔄 Connecting to master...');
    await mongoose.connect('mongodb://localhost:27017/workflow_master');
    console.log('✅ Connected.');

    const tenantId = '69b55ff7fecc766498587db1';
    
    // 1. Force Tenant status to active
    const result = await mongoose.connection.db.collection('tenants').updateOne(
        { _id: new mongoose.Types.ObjectId(tenantId) },
        { $set: { status: 'active' } }
    );
    
    console.log(`✅ Tenant status update result:`, result);

    // 2. Check if it worked
    const tenant = await mongoose.connection.db.collection('tenants').findOne({ _id: new mongoose.Types.ObjectId(tenantId) });
    console.log(`📄 Tenant current status: "${tenant.status}"`);

    process.exit();
}

fix().catch(err => {
    console.error(err);
    process.exit(1);
});
