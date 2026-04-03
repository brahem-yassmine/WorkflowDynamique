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
          maxWorkflows: 10,
          maxNodes: 9999999, // Total organizational nodes across all workflows
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
          maxWorkflows: 20,
          maxNodes: 999999, // Increased capacity for standard use
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
          maxUsers: 30,
          maxWorkflows: 50,
          maxNodes: 999999, // Unlimited capacity for complex operations
          reports: true,
          aiSupport: true
        },
        description: 'Full-lattice master control for enterprise scale.',
        isActive: true
      }
    ]
  };
