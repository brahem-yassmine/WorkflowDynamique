const StepHandlerFactory = require('./StepHandlerFactory');
const SecureEvaluator = require('./SecureEvaluator');
const checklistService = require('../services/checklistService');

class WorkflowEngine {
  constructor(tenantConn) {
    this.tenantConn = tenantConn;
    this.Workflow = tenantConn.model('Workflow');
    this.WorkflowInstance = tenantConn.model('WorkflowInstance');
  }

  /**
   * Starts a new workflow instance.
   */
  async start(workflowId, creatorId, title, initialContext = {}) {
    console.log(`🚀 [Engine] Starting workflow: ${workflowId} for creator: ${creatorId}`);
    const workflow = await this.Workflow.findById(workflowId);
    if (!workflow) throw new Error('Workflow definition not found');

    const startStep = workflow.nodes.find(n => (n.type || '').toUpperCase() === 'START');
    if (!startStep) throw new Error('Workflow has no START node');

    const instance = new this.WorkflowInstance({
      workflowId: workflow._id,
      workflowVersion: workflow.version || 1,
      createdBy: creatorId,
      title: title || workflow.name,
      context: initialContext,
      status: 'in_progress',
      state: [],
      history: []
    });

    await instance.save();
    
    // 🚀 AUTOMATIC CHECKLIST GENERATION
    try {
      const checklist = await checklistService.createInstanceChecklist(this.tenantConn, instance, workflow, creatorId);
      if (checklist) {
        instance.checklistId = checklist._id;
      }
    } catch (checklistErr) {
      console.error('❌ Failed to create auto-checklist for instance:', checklistErr.message);
    }

    // Activate transitions from START
    await this._activateNextSteps(instance, workflow, startStep.id, 'START');
    
    await instance.save();
    return instance;
  }

  /**
   * Completes a step and moves the workflow forward.
   */
  async completeStep(instanceId, stepId, userId, action, data = {}) {
    const instance = await this.WorkflowInstance.findById(instanceId);
    if (!instance) throw new Error('Instance not found');
    if (instance.isCompleted()) throw new Error('Workflow is already completed');

    const currentVersion = instance.version;
    const stepStateIdx = instance.state.findIndex(s => s.stepId === stepId && s.status === 'IN_PROGRESS');
    if (stepStateIdx === -1) throw new Error('Step is not currently active');

    const workflow = await this.Workflow.findById(instance.workflowId);
    const stepDef = workflow.nodes.find(n => n.id === stepId);
    const handler = StepHandlerFactory.getHandler(stepDef, instance);

    const user = await this.tenantConn.model('User').findById(userId);
    if (!handler.isAuthorized(user)) {
      throw new Error('Not authorized to perform this step');
    }

    // 1. Process action via handler
    const result = await handler.onAction(user, action, data);

    // Ensure nested data changes on state are marked modified
    instance.markModified('state');

    // 2. Update context if provided
    if (result.contextUpdate) {
      instance.context = this._deepMerge(instance.context || {}, result.contextUpdate);
      instance.markModified('context');
    }

    // 3. Record history
    instance.history.push({
      stepId,
      nodeId: stepId, // Sync for compatibility
      performedBy: userId,
      action: result.action || action,
      data: data,
      timestamp: new Date()
    });

    if (result.completed) {
      // 4. Mark step as COMPLETED
      instance.state[stepStateIdx].status = 'COMPLETED';
      instance.state[stepStateIdx].completedAt = new Date();

      // 5. Evaluate and Activate next steps
      await this._activateNextSteps(instance, workflow, stepId, result.action);
    }

    // 6. Optimistic concurrency check (Lock verification before saving)
    instance.version = currentVersion + 1;
    
    const updateResult = await this.WorkflowInstance.updateOne(
        { _id: instance._id, version: currentVersion },
        {
           $set: { 
               state: instance.state,
               history: instance.history,
               context: instance.context,
               status: instance.status,
               timeCompleted: instance.timeCompleted,
               version: instance.version
           }
        }
    );
    
    if (updateResult.modifiedCount === 0) {
      throw new Error('Concurrency conflict: Workflow instance was updated simultaneously by another process. Please retry.');
    }
    
    return await this.WorkflowInstance.findById(instance._id);
  }

  /**
   * Internal recursive helper to evaluate transitions and activate new steps.
   */
  async _activateNextSteps(instance, workflow, sourceStepId, lastAction, depth = 0) {
    if (depth > 50) throw new Error("Infinite loop detected in workflow execution.");

    console.log(`[Engine] EVALUATING transitions from: ${sourceStepId} | Action: ${lastAction}`);

    const transitions = workflow.edges.filter(e => e.source === sourceStepId);
    const nodesToActivate = [];
    const nodesToSkip = [];
    let matchedAny = false;

    // 1. Sort transitions for deterministic evaluation (Prioritize edges with rules)
    const sortedTransitions = [...transitions].sort((a, b) => {
      if (a.condition && !b.condition) return -1;
      if (!a.condition && b.condition) return 1;
      return 0;
    });

    const sourceNode = workflow.nodes.find(n => n.id === sourceStepId);
    const nodeType = String(sourceNode?.type || '').toUpperCase();
    
    // Exclusive branching logic (Condition/Approval nodes)
    const exclusiveActions = ['APPROVED', 'REJECTED', 'STEP_APPROVED', 'STEP_REJECTED', 'VALIDATED', 'COMPLETED', 'SUBMITTED', 'SUBMIT', 'VALIDATE', 'APPROVE', 'REJECT'];
    const isExclusiveAction = exclusiveActions.includes(String(lastAction || '').toUpperCase());
    const isExclusiveNode = isExclusiveAction || ['CONDITION', 'APPROVAL', 'AUTO', 'NOTIFICATION', 'START', 'START_NODE'].includes(nodeType);

    for (const edge of sortedTransitions) {
      let matches = false;
      
      // Implicit matching for Approval outcomes if no DSL condition provided
      if (!edge.condition && (isExclusiveAction || nodeType === 'APPROVAL')) {
          const actionLower = String(lastAction || '').toLowerCase();
          const edgeRef = String(edge.label || edge.sourceHandle || '').toLowerCase();
          
          if (actionLower.includes('approve') || actionLower === 'validated' || actionLower === 'completed' || actionLower === 'submit') {
              matches = !edgeRef.includes('reject') && !edgeRef.includes('refus') && !edgeRef.includes('non');
          } else if (actionLower.includes('reject') || actionLower.includes('refus')) {
              matches = edgeRef.includes('reject') || edgeRef.includes('refus') || edgeRef.includes('non');
          } else {
              matches = true; 
          }
          console.log(`[Engine] Implicit match check: Action=${actionLower} | Edge=${edgeRef} | Matches=${matches}`);
      } else {
          matches = SecureEvaluator.evaluateCondition(edge.condition, instance.context, lastAction);
          console.log(`[Engine] DSL match check: Condition=${JSON.stringify(edge.condition)} | Matches=${matches}`);
      }

      if (matches) {
        const targetNode = workflow.nodes.find(n => n.id === edge.target);
        if (targetNode) {
          if (!nodesToActivate.some(n => n.id === targetNode.id)) {
             console.log(`[Engine] --> MATCHED path to: ${targetNode.id} (${targetNode.type})`);
             nodesToActivate.push(targetNode);
             matchedAny = true;
          }
          
          // For exclusive nodes, once we find a match, all other branches are SKIPPED
          if (isExclusiveNode) {
             console.log(`[Engine] Exclusive node detected (${nodeType}). Breaking after first match.`);
             const remaining = sortedTransitions.slice(sortedTransitions.indexOf(edge) + 1);
             for (const rEdge of remaining) {
                const skipNode = workflow.nodes.find(n => n.id === rEdge.target);
                if (skipNode && !nodesToSkip.some(n => n.id === skipNode.id)) nodesToSkip.push(skipNode);
             }
             break;
          }
        }
      } else if (isExclusiveNode) {
        const targetNode = workflow.nodes.find(n => n.id === edge.target);
        if (targetNode && !nodesToSkip.some(n => n.id === targetNode.id)) {
           nodesToSkip.push(targetNode);
        }
      }
    }

    // 2. Handle SKIPPED branches
    if (nodesToSkip.length > 0) {
      await this._processSkippedNodes(instance, workflow, nodesToSkip);
    }

    // 3. Logic for dead-ends
    if (!matchedAny && (lastAction === 'REJECTED' || lastAction === 'REJECT')) {
      console.log(`[Engine] Workflow REJECTED at step ${sourceStepId}`);
      instance.status = 'rejected';
      instance.timeCompleted = new Date();
      return;
    }

    // 4. Activate Matched Nodes
    for (const node of nodesToActivate) {
      // End node detection
      if ((node.type || '').toUpperCase() === 'END') {
        if (instance.state.filter(s => s.status === 'IN_PROGRESS' || s.status === 'ACTIVE').length === 0) {
          instance.status = 'completed';
          instance.timeCompleted = new Date();
          console.log(`[Engine] Workflow REACHED END node.`);
        }
        continue;
      }

      // Avoid re-activating if already active
      if (instance.state.some(s => s.stepId === node.id && (s.status === 'IN_PROGRESS' || s.status === 'ACTIVE'))) {
        continue;
      }

      const assignees = await this._resolveAssignment(node.assignment, instance);
      const isAutoType = ['NOTIFICATION', 'AUTO', 'AUTO_TASK', 'SEND_NOTIFICATION'].includes(node.type.toUpperCase());

      const newState = {
        stepId: node.id,
        status: isAutoType ? 'COMPLETED' : 'IN_PROGRESS',
        startedAt: new Date(),
        assignees: assignees,
        completedAt: isAutoType ? new Date() : null
      };

      instance.state.push(newState);
      instance.markModified('state');

      console.log(`[Engine] ACTIVATING: ${node.id} | Type: ${node.type} | Mode: ${isAutoType ? 'AUTO' : 'MANUAL'}`);

      const handler = StepHandlerFactory.getHandler(node, instance);
      console.log(`[Engine] Activating step: ${node.id} (${node.type}) via handler: ${handler.constructor.name}`);
      const activationResult = await handler.onActivate();
      console.log(`[Engine] Activation result for ${node.id}:`, JSON.stringify(activationResult));

      if (activationResult.autoProgress || isAutoType) {
        newState.status = 'COMPLETED';
        newState.completedAt = new Date();
        instance.markModified('state');
        
        if (activationResult.contextUpdate) {
            instance.context = this._deepMerge(instance.context || {}, activationResult.contextUpdate);
            instance.markModified('context');
        }

        // Deterministic recursion
        await this._activateNextSteps(instance, workflow, node.id, activationResult.nextAction || 'COMPLETED', depth + 1);
      }
    }
  }

  async _processSkippedNodes(instance, workflow, nodesToSkip) {
    for (const node of nodesToSkip) {
      // Check if this node is reachable via other non-skipped paths (Join logic)
      const incomingEdges = workflow.edges.filter(e => e.target === node.id);
      const isStillReachable = incomingEdges.length > 1; // Simplified, in a full graph we would check all paths
      
      if (!isStillReachable && !instance.state.some(s => s.stepId === node.id)) {
        console.log(`[Engine] SKIPPING: ${node.id} (Unselected Branch)`);
        instance.state.push({
          stepId: node.id,
          status: 'SKIPPED',
          startedAt: new Date(),
          completedAt: new Date(),
          assignees: []
        });
      }
    }
    instance.markModified('state');
  }

  _deepMerge(target, source) {
    if (!source || typeof source !== 'object') return source;
    if (!target || typeof target !== 'object') return source;
    
    for (const key of Object.keys(source)) {
      if (source[key] instanceof Date) {
        target[key] = new Date(source[key]);
      } else if (Array.isArray(source[key])) {
        target[key] = [...source[key]];
      } else if (typeof source[key] === 'object' && source[key] !== null) {
        target[key] = this._deepMerge(target[key] || {}, source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  _canReach(workflow, fromNodeId, toNodeId, visited = new Set()) {
      if (fromNodeId === toNodeId) return true;
      if (visited.has(fromNodeId)) return false;
      visited.add(fromNodeId);
      const outgoing = workflow.edges.filter(e => e.source === fromNodeId);
      for (const edge of outgoing) {
          if (this._canReach(workflow, edge.target, toNodeId, visited)) return true;
      }
      return false;
  }

  async _resolveAssignment(assignment, instance) {
    if (!assignment || assignment.type === 'NONE') return [];
    
    const UserModel = this.tenantConn.model('User');
    
    if (assignment.type === 'USER') {
      return assignment.values; 
    }

    if (assignment.type === 'ROLE') {
      const users = await UserModel.find({ 
        $or: [
            { role: { $in: assignment.values } },
            { specificRole: { $in: assignment.values } },
            { specificRoleId: { $in: assignment.values } }
        ]
      });
      return users.map(u => u._id);
    }

    if (assignment.type === 'DOMAIN') {
      const users = await UserModel.find({ domain: { $in: assignment.values } });
      return users.map(u => u._id);
    }

    if (assignment.type === 'DYNAMIC') {
      try {
          const AssignmentResolver = require('./AssignmentResolver');
          return await AssignmentResolver.resolve(assignment.resolver, assignment.params, instance.context, this.tenantConn);
      } catch (err) {
          console.error('WorkflowEngine: Dynamic assignment failed:', err);
          return [];
      }
    }

    return [];
  }
}

module.exports = WorkflowEngine;
