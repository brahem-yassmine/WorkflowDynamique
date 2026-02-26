const mongoose = require('mongoose');
const MASTER_DB_URI = 'mongodb://localhost:27017/workflow_master';

async function findTenant() {
    try {
        const conn = await mongoose.createConnection(MASTER_DB_URI).asPromise();
        console.log('Connected to master');

        const tenantSchema = new mongoose.Schema({}, { strict: false, collection: 'tenants' });
        const Tenant = conn.model('Tenant', tenantSchema);

        const tenants = await Tenant.find().limit(5);
        if (tenants.length === 0) {
            console.log('No tenants found');
        } else {
            console.log('Found tenants:');
            tenants.forEach(t => {
                console.log(`ID: ${t._id}, Domain: ${t.domain}, DB: ${t.databaseName}`);
            });
        }
        await conn.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

findTenant();
