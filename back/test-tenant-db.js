const mongoose = require('mongoose');
const URI = 'mongodb://localhost:27017/tenant_axia_1771838499359';

async function test() {
    try {
        console.log('Connecting to tenant DB...');
        const conn = await mongoose.createConnection(URI).asPromise();
        console.log('Connected!');
        const collections = await conn.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));
        await conn.close();
    } catch (e) {
        console.error('Connection failed:', e);
    }
}
test();
// hggcx
