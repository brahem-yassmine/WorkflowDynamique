const mongoose = require('mongoose');
require('dotenv').config();

async function simulateGetUserTasks() {
  const MASTER_DB_URI = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/workflow_master';
  const masterConn = await mongoose.createConnection(MASTER_DB_URI).asPromise();
  
  const Tenant = masterConn.model('Tenant', new mongoose.Schema({
    databaseUri: String,
    name: String,
    databaseName: String
  }));

  const tenant = await Tenant.findOne({ name: 'BuildTech' });
  const dbUri = tenant.databaseUri || `mongodb://localhost:27017/${tenant.databaseName}`;
  const conn = await mongoose.createConnection(dbUri).asPromise();
  
  // Models with minimal schema
  const User = conn.model('User', new mongoose.Schema({ email: String, role: String, domain: String }, { strict: false }));
  const WorkflowInstance = conn.model('WorkflowInstance', new mongoose.Schema({ 
      workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow' },
      status: String,
      state: Array,
      currentNodes: Array,
      createdBy: mongoose.Schema.Types.ObjectId
  }, { strict: false }));
  const Workflow = conn.model('Workflow', new mongoose.Schema({ nodes: Array }, { strict: false }));

  const user = await User.findOne({ email: 'test21@gmail.com' });
  const userId = user._id;
  const domain = user.domain;
  const userRoleStr = user.role;

  const domainsToMatch = [
      userId.toString(),
      domain,
      'GLOBAL', 'ALL', 'PUBLIC', 'TOUS', 'EVERYONE'
  ].filter(Boolean);

  const matchingIds = [userId.toString()];

  console.log(`Simulating for: ${user.email} (ID: ${userId})`);
  console.log(`Domains: ${domainsToMatch.join(', ')}`);

  const activeInstances = await WorkflowInstance.find({ status: { $in: ['in_progress', 'pending'] } }).populate('workflowId');

  console.log(`Active Instances found: ${activeInstances.length}`);

  const systemNodeTypes = ['start', 'end'];

  activeInstances.forEach(instance => {
      const allActiveSteps = [
        ...(instance.state || []).map(s => ({ ...s, isNewEngine: true })),
        ...(instance.currentNodes || []).map(s => ({ ...s, isNewEngine: false, stepId: s.nodeId }))
      ];

      console.log(`Checking instance: ${instance._id} (${instance.status}) | Steps: ${allActiveSteps.length}`);

      allActiveSteps.forEach(node => {
          const nodeStatus = (node.status || '').toUpperCase();
          console.log(`  - Step: ${node.stepId} | Status: ${nodeStatus}`);
          if (!['IN_PROGRESS', 'PENDING', 'ACTIVE'].includes(nodeStatus)) return;

          const nodeDef = instance.workflowId?.nodes?.find(n => n.id === node.stepId);
          if (!nodeDef) {
              console.log(`    ⚠️ Node definition not found for ${node.stepId}`);
              return;
          }

          const nodeType = (nodeDef.type || 'TASK').toUpperCase();
          if (systemNodeTypes.includes(nodeType.toLowerCase())) return;

          const instCreatorId = instance.createdBy?.toString();
          const currentUserIdStr = userId.toString();
          let isVisible = (userRoleStr === 'admin') || instCreatorId === currentUserIdStr;

          if (!isVisible) {
              const assignees = (node.assignees || []).map(a => a.toString());
              const isAssigneeMatch = assignees.some(aStr => matchingIds.includes(aStr));
              
              const nodeData = nodeDef.data || {};
              const defDomain = nodeData.responsibleDomain || nodeData.domain;
              const isDefDomainMatch = !!defDomain && domainsToMatch.some(d => 
                  d && d.toLowerCase() === defDomain.toLowerCase()
              );

              isVisible = isAssigneeMatch || isDefDomainMatch;
              console.log(`    Visibility: ${isVisible} (AssigneeMatch: ${isAssigneeMatch}, DomainMatch: ${isDefDomainMatch} [${defDomain}])`);
          } else {
              console.log(`    Visibility: ${isVisible} (Admin/Creator)`);
          }
      });
  });

  await conn.close();
  await masterConn.close();
}

simulateGetUserTasks().catch(console.error);
