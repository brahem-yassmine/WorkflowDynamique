const mongoose = require('mongoose');

async function dumpWorkflow() {
    try {
        await mongoose.connect('mongodb://localhost:27017/workflow_dynamique?authSource=admin');
        const db = mongoose.connection.useDb('tenant_buildtech_1776287355522');
        const Workflow = db.collection('workflows');
        const workflow = await Workflow.findOne({ name: /Demande/i });
        
        console.log(JSON.stringify(workflow, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
dumpWorkflow();
