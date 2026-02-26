const mongoose = require('mongoose');
const MASTER_DB_URI = 'mongodb://localhost:27017/workflow_master';

async function dump() {
    try {
        const conn = await mongoose.createConnection(MASTER_DB_URI).asPromise();
        const docs = await conn.collection('tenants').find({}).toArray();
        console.log('--- START DUMP ---');
        console.log(JSON.stringify(docs, null, 2));
        console.log('--- END DUMP ---');
        await conn.close();
    } catch (e) {
        console.error(e);
    }
}
dump();
