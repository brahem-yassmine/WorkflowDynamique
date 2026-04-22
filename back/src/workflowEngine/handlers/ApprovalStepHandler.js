const BaseStepHandler = require('./BaseStepHandler');

class ApprovalStepHandler extends BaseStepHandler {
  async onAction(performer, action, data) {
    const { config } = this.step;
    const { state } = this.instance;
    const stepState = state.find(s => s.stepId === this.step.id);

    if (!stepState) throw new Error('Step state not found');

    const actionUpper = (action || 'APPROVED').toUpperCase();

    // 1. Handle Rejection
    if (actionUpper === 'REJECTED') {
      if (!config.allowRejection) {
        throw new Error('Rejection is not allowed for this step');
      }
      return { completed: true, action: 'REJECTED' };
    }

    // 2. Register Approval
    if (!stepState.data) stepState.data = {};
    if (!stepState.data.approvals) stepState.data.approvals = [];
    
    const existingIdx = stepState.data.approvals.findIndex(a => a.userId.toString() === performer._id.toString());
    if (existingIdx === -1) {
      stepState.data.approvals.push({
        userId: performer._id,
        action: 'APPROVED',
        timestamp: new Date()
      });
    }

    // 3. Strategy Logic
    const strategy = config.strategy || 'ANY';
    const requiredCount = config.requiredCount || 1;
    const approvalCount = stepState.data.approvals.length;

    if (strategy === 'ANY') {
      if (approvalCount >= requiredCount) {
        return { completed: true, action: 'APPROVED' };
      }
    } else if (strategy === 'ALL') {
      // In a real environment, we'd compare against the resolved list of assignees
      const totalAssigneesNeeded = stepState.assignees.length;
      if (approvalCount >= totalAssigneesNeeded && approvalCount >= (config.minApprovals || 1)) {
        return { completed: true, action: 'APPROVED' };
      }
    }

    // Partial approval - step stays IN_PROGRESS
    return { completed: false, action: 'PARTIAL_APPROVAL' };
  }
}

module.exports = ApprovalStepHandler;
