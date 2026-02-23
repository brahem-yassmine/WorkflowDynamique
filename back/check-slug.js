const mongoose = require('mongoose');
const MASTER_DB_URI = 'mongodb://localhost:27017/workflow_master';

async function check() {
    try {
        const conn = await mongoose.createConnection(MASTER_DB_URI).asPromise();
        const doc = await conn.collection('tenants').findOne({ _id: new mongoose.Types.ObjectId('699c1c23dda2a6af5a307d41') });
        console.log('ID:', doc._id);
        console.log('Slug:', doc.slug);
        console.log('Domain:', doc.domain);
        console.log('Full Doc:', JSON.stringify(doc, null, 2));
        await conn.close();
    } catch (e) {
        console.error(e);
    }
}
check();
