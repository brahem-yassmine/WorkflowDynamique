// back/scripts/cleanup_tenants.js
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' }); // Adjust path if needed

const MASTER_DB_URI = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/workflow_master';

async function cleanup() {
    console.log('🚀 Starting deep cleanup of all local admin accounts...');

    try {
        // 1. Connect to Master DB
        const masterConn = await mongoose.createConnection(MASTER_DB_URI).asPromise();
        console.log('✅ Connected to Master Database');

        // 2. Define Tenant Model (Collection: tenants)
        const tenantSchema = new mongoose.Schema({}, { strict: false, collection: 'tenants' });
        const Tenant = masterConn.model('Tenant', tenantSchema);

        // 3. Find all tenants
        const tenants = await Tenant.find({});
        console.log(`🔍 Found ${tenants.length} tenant accounts to delete.`);

        for (const tenant of tenants) {
            const dbName = tenant.databaseName;
            if (dbName) {
                console.log(`🗑️  Dropping database: ${dbName}...`);
                try {
                    // Connect briefly to the tenant DB and drop it
                    const tUri = `mongodb://localhost:27017/${dbName}`;
                    const tConn = await mongoose.createConnection(tUri).asPromise();
                    await tConn.dropDatabase();
                    await tConn.close();
                    console.log(`   ✅ Dropped ${dbName}`);
                } catch (dbErr) {
                    console.error(`   ❌ Failed to drop ${dbName}:`, dbErr.message);
                }
            }
        }

        // 4. Clear the tenants collection in Master
        if (tenants.length > 0) {
            const deleteResult = await Tenant.deleteMany({});
            console.log(`✅ Cleared 'tenants' collection in Master DB. Removed ${deleteResult.deletedCount} records.`);
        }

        await masterConn.close();
        console.log('✨ Cleanup complete. All local admin matrixes have been terminated.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Critical Error during cleanup:', error.message);
        process.exit(1);
    }
}

cleanup();
