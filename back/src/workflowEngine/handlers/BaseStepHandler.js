/**
 * BaseStepHandler - Abstract class for all step types.
 */
class BaseStepHandler {
  constructor(step, instance) {
    this.step = step;
    this.instance = instance;
  }

  /**
   * Called when a step is activated.
   * @returns {Promise<{autoProgress: boolean, nextAction?: string}>}
   */
  async onActivate() {
    return { autoProgress: false };
  }

  /**
   * Called when an external action (user submit) occurs.
   * @param {Object} performer - The user performing the action.
   * @param {string} action - The action taken (e.g. 'SUBMIT', 'APPROVE').
   * @param {Object} data - Payload from the action.
   * @returns {Promise<{completed: boolean, action: string, contextUpdate?: Object}>}
   */
  async onAction(performer, action, data) {
    return { completed: true, action };
  }

  /**
   * Validates if the performer is authorized for this step.
   * @param {Object} user - The user trying to perform the action.
   */
  isAuthorized(user) {
    const { assignment } = this.step;
    if (!assignment || assignment.type === 'NONE') return true;

    const userId = user._id.toString();
    const userRole = user.role;
    const userDomain = user.domain;

    if (assignment.type === 'USER') {
      return assignment.values.includes(userId);
    }
    if (assignment.type === 'ROLE') {
      return assignment.values.includes(userRole) || (user.specificRoleId && assignment.values.includes(user.specificRoleId.toString()));
    }
    if (assignment.type === 'DOMAIN') {
      return assignment.values.includes(userDomain);
    }

    return false;
  }
}

module.exports = BaseStepHandler;
