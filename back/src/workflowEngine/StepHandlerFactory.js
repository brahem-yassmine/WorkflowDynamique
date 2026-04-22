const ApprovalStepHandler = require('./handlers/ApprovalStepHandler');
const AutoStepHandler = require('./handlers/AutoStepHandler');
const NotificationStepHandler = require('./handlers/NotificationStepHandler');
const TaskStepHandler = require('./handlers/TaskStepHandler');
const ConditionStepHandler = require('./handlers/ConditionStepHandler');
const BaseStepHandler = require('./handlers/BaseStepHandler');

class StepHandlerFactory {
  static getHandler(step, instance) {
    const type = step.type.toUpperCase();

    switch (type) {
      case 'APPROVAL':
        return new ApprovalStepHandler(step, instance);
      case 'AUTO':
        return new AutoStepHandler(step, instance);
      case 'NOTIFICATION':
        return new NotificationStepHandler(step, instance);
      case 'TASK':
        return new TaskStepHandler(step, instance);
      case 'CONDITION':
        return new ConditionStepHandler(step, instance);
      case 'START':
      case 'END':
      case 'SUB_WORKFLOW':
      case 'EVENT':
      default:
        return new BaseStepHandler(step, instance);
    }
  }
}

module.exports = StepHandlerFactory;
