const StepHandlerFactory = require('./StepHandlerFactory');
const SecureEvaluator = require('./SecureEvaluator');

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
    const workflow = await this.Workflow.findById(workflowId);
    if (!workflow) throw new Error('Workflow definition not found');

    const startStep = workflow.nodes.find(n => n.type === 'START');
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
      instance.context = { ...instance.context, ...result.contextUpdate };
      instance.markModified('context');
    }

    // 3. Record history
    instance.history.push({
      stepId,
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
    const lockCheck = await this.WorkflowInstance.findOne({ _id: instance._id, version: currentVersion }).select('_id');
    if (!lockCheck) {
      throw new Error('Concurrency conflict: Workflow instance was updated simultaneously by another process. Please retry.');
    }

    // Force version increment in case pre-save misses it for some states
    instance.version = currentVersion + 1;
    await instance.save();
    return instance;
  }

  /**
   * Internal recursive helper to evaluate transitions and activate new steps.
   */
  async _activateNextSteps(instance, workflow, sourceStepId, lastAction) {
    const transitions = workflow.edges.filter(e => e.source === sourceStepId);
    const nodesToActivate = [];

    for (const edge of transitions) {
      const matches = SecureEvaluator.evaluateCondition(edge.condition, instance.context, lastAction);
      if (matches) {
        const targetNode = workflow.nodes.find(n => n.id === edge.target);
        if (targetNode) nodesToActivate.push(targetNode);
      }
    }

    for (const node of nodesToActivate) {
      // Handle END node
      if (node.type === 'END') {
        if (instance.state.filter(s => s.status === 'IN_PROGRESS').length === 0) {
          instance.status = 'completed';
          instance.timeCompleted = new Date();
        }
        continue;
      }

      // Check if already active (for join scenarios, might need more refind logic)
      if (instance.state.some(s => s.stepId === node.id && s.status === 'IN_PROGRESS')) continue;

      // Resolve assignment
      const assignees = await this._resolveAssignment(node.assignment, instance);

      const newState = {
        stepId: node.id,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        assignees: assignees
      };

      instance.state.push(newState);
      instance.markModified('state');

      // Auto-execution for active nodes
      const handler = StepHandlerFactory.getHandler(node, instance);
      const activationResult = await handler.onActivate();

      if (activationResult.autoProgress) {
        newState.status = 'COMPLETED';
        newState.completedAt = new Date();
        
        if (activationResult.contextUpdate) {
            instance.context = { ...instance.context, ...activationResult.contextUpdate };
            instance.markModified('context');
        }

        // Recursive call for next steps
        await this._activateNextSteps(instance, workflow, node.id, activationResult.nextAction);
      }
    }
  }

  async _resolveAssignment(assignment, instance) {
    if (!assignment || assignment.type === 'NONE') return [];
    
    const UserModel = this.tenantConn.model('User');
    
    if (assignment.type === 'USER') {
      return assignment.values; // Expected to be User IDs
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
