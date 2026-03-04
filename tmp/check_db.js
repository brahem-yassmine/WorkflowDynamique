
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../back/.env') });

async function checkWorkflows() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to Database');

        // We need to find the tenant first or use the default one if there's only one
        const Tenant = mongoose.model('Tenant', new mongoose.Schema({
            name: String,
            slug: String
        }), 'tenants');

        const tenants = await Tenant.find();
        console.log(`Found ${tenants.length} tenants`);

        for (const tenant of tenants) {
            console.log(`\n--- Tenant: ${tenant.name} (${tenant.slug}) ---`);
            const dbName = `tenant_${tenant.slug}`;
            const tenantConn = mongoose.connection.useDb(dbName, { useCache: true });

            const WorkflowSchema = new mongoose.Schema({
                name: String,
                domain: String,
                status: String,
                projectId: mongoose.Schema.Types.ObjectId
            }, { strict: false });

            const Workflow = tenantConn.model('Workflow', WorkflowSchema);
            const workflows = await Workflow.find();

            console.log(`Found ${workflows.length} workflows:`);
            workflows.forEach(w => {
                console.log(`- ${w.name} (Domain: ${w.domain}, Status: ${w.status}, ProjectID: ${w.projectId})`);
            });

            const UserSchema = new mongoose.Schema({
                email: String,
                domain: String,
                role: String
            }, { strict: false });
            const User = tenantConn.model('User', UserSchema);
            const users = await User.find();
            console.log(`\nUsers:`);
            users.forEach(u => {
                console.log(`- ${u.email} (Domain: ${u.domain}, Role: ${u.role})`);
            });
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkWorkflows();
