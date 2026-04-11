const http = require('http');
const mongoose = require('mongoose');

async function testApi() {
    try {
        console.log("Connecting to mongo");
        await mongoose.connect('mongodb://localhost:27017/workflow_dynamique?authSource=admin');
        const db = mongoose.connection;
        console.log("OK, fetching DB instances");
        const count = await db.collection('workflowinstances').countDocuments();
        console.log("Instances count:", count);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
testApi();
