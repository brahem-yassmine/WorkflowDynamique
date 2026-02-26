const mongoose = require('mongoose');
const MASTER_DB_URI = 'mongodb://localhost:27017/workflow_master';
const TenantFactory = require('./src/models/master/Tenant');

async function testModel() {
    try {
        const conn = await mongoose.createConnection(MASTER_DB_URI).asPromise();
        console.log('Connected');

        const Tenant = TenantFactory(conn);
        console.log('Model name:', Tenant.modelName);
        console.log('Collection name:', Tenant.collection.name);

        const count = await Tenant.countDocuments();
        console.log('Total tenants:', count);

        const one = await Tenant.findOne();
        console.log('One tenant:', one ? one._id : 'null');

        await conn.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

testModel();
