// back/src/config/plans.js
/**
 * Centralized Subscription Plan Configuration
 * Used for both display and real-time backend enforcement.
 */
module.exports = {
    plans: [
      {
        name: 'Demo Plan',
        code: 'DEMO',
        price: 0,
        features: {
          maxUsers: 5,
          maxWorkflows: 25, // 5 users * 5 workflows each
          maxWorkflowsPerUser: 5,
          maxNodes: 9999999,
          reports: false,
          aiSupport: false
        },
        description: 'Ideal for initial lattice exploration and testing.',
        isActive: true
      },
      {
        name: 'Starter Plan',
        code: 'STARTER',
        price: 79,
        features: {
          maxUsers: 10,
          maxWorkflows: 200, // 10 users * 20 workflows each
          maxWorkflowsPerUser: 20,
          maxNodes: 999999,
          maxStaff: 10,
          reports: true,
          aiSupport: false
        },
        description: 'Standard professional cluster for small teams.',
        isActive: true
      },
      {
        name: 'Pro Plan',
        code: 'PRO',
        price: 299,
        features: {
          maxUsers: 999999,
          maxWorkflows: 999999,
          maxWorkflowsPerUser: 999999,
          maxNodes: 999999,
          maxStaff: 999999,
          reports: true,
          aiSupport: true
        },
        description: 'Full-lattice master control for enterprise scale.',
        isActive: true
      }
    ]
  };
