const mongoose = require('mongoose');

async function migrate() {
  try {
    const dbName = 'tenant_israbrahem_1773843513119';
    const conn = await mongoose.createConnection(`mongodb://localhost:27017/${dbName}`).asPromise();
    
    const Workflow = conn.model('Workflow', new mongoose.Schema({ nodes: Array, edges: Array }, { strict: false }));
    const Instance = conn.model('WorkflowInstance', new mongoose.Schema({ currentNodes: Array, executionPath: Array }, { strict: false }));
    
    const instances = await Instance.find({ status: 'in_progress' });
    
    for (const inst of instances) {
      const activeNodes = inst.currentNodes.filter(n => n.status === 'in_progress');
      const hasSystemNode = activeNodes.some(n => n.nodeId.includes('parallel_split') || n.nodeId.includes('sync_split'));
      
      if (hasSystemNode) {
        console.log(`\nMigrating Instance: ${inst._id}`);
        const workflow = await Workflow.findById(inst.workflowId);
        if (!workflow) continue;

        const newCurrentNodes = [];
        const newExecutionPath = [...(inst.executionPath || [])];

        for (const activeNode of activeNodes) {
          if (activeNode.nodeId.includes('split')) {
            // Auto-complete the split node
            newExecutionPath.push({
              nodeId: activeNode.nodeId,
              nodeType: 'parallel_split',
              action: 'auto_approved',
              timestamp: new Date()
            });

            // Find children
            const childEdges = workflow.edges.filter(e => e.source === activeNode.nodeId);
            for (const edge of childEdges) {
              const targetNode = workflow.nodes.find(n => n.id === edge.target);
              if (targetNode && targetNode.type === 'action') {
                const data = targetNode.data || {};
                const assignedId = data.assignedTo || data.assignedUser;
                
                newCurrentNodes.push({
                  nodeId: targetNode.id,
                  status: 'in_progress',
                  startedAt: new Date(),
                  responsibleUser: null, // We let the resolver handle it via assignees
                  responsibleDomain: data.responsibleDomain || null,
                  assignees: assignedId ? [assignedId] : [],
                  _id: new mongoose.Types.ObjectId()
                });
              }
            }
          } else {
            newCurrentNodes.push(activeNode);
          }
        }

        if (newCurrentNodes.length > 0) {
          inst.currentNodes = newCurrentNodes;
          inst.executionPath = newExecutionPath;
          await inst.save();
          console.log(`✅ Migrated ${inst._id}. Now has ${newCurrentNodes.length} active human tasks.`);
        }
      }
    }
    
    await conn.close();
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

migrate();
