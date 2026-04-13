// back/scratch/check_tenants.js
const mongoose = require('mongoose');
const MASTER_DB_URI = 'mongodb://localhost:27017/workflow_master';

async function check() {
  await mongoose.connect(MASTER_DB_URI);
  const Tenant = mongoose.model('Tenant', new mongoose.Schema({ name: String, planDetails: Object, selectedPlan: mongoose.Schema.Types.ObjectId }));
  const tenants = await Tenant.find({});
  
  const report = tenants.map(t => ({
    name: t.name,
    id: t._id,
    planCode: t.planDetails?.code,
    selectedPlan: t.selectedPlan,
    maxWorkflows: t.planDetails?.features?.maxWorkflows
  }));
  
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}
check();
