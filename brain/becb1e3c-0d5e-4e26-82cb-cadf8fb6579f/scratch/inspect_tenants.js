
const mongoose = require('mongoose');
const path = require('path');

async function inspectTenants() {
    try {
        // Assuming a local mongodb connection string or finding it from the environment/config
        // I'll try to find where the masterDb is initialized.
        // Usually it's in the app.js or server.js
        
        const MONGODB_URI = 'mongodb://localhost:27017/workflow_master'; 
        
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to Master DB');
        
        const tenantSchema = new mongoose.Schema({}, { strict: false, collection: 'tenants' });
        const Tenant = mongoose.model('Tenant', tenantSchema);
        
        const planSchema = new mongoose.Schema({}, { strict: false, collection: 'plans' });
        const Plan = mongoose.model('Plan', planSchema);

        const allPlans = await Plan.find({}, 'name code price');
        console.log('--- Plans List ---');
        allPlans.forEach(p => {
            console.log(`ID: ${p._id}, Name: ${p.name}, Code: ${p.code}`);
        });

        const tenants = await Tenant.find({}, 'name planDetails selectedPlan');
        console.log('--- Tenants List ---');
        tenants.forEach(t => {
            console.log(`Name: ${t.name}`);
            console.log(`PlanDetails: ${JSON.stringify(t.planDetails)}`);
            console.log(`SelectedPlan: ${t.selectedPlan}`);
            console.log('------------------');
        });
        
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

inspectTenants();
