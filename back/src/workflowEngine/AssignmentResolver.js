const SecureEvaluator = require('./SecureEvaluator');

/**
 * Handles Dynamic Assignment resolutions.
 * Replaces raw scripts with a standardized dictionary of "resolvers".
 */
class AssignmentResolver {
  
  static get resolvers() {
    return {
      /**
       * Expected params: { userField: "context.requestor" }
       * Finds the manager of the specified user.
       */
      GET_MANAGER: async (params, context, tenantConn) => {
        if (!params || !params.userField) return [];
        
        // 1. Resolve target user ID from context
        const userId = SecureEvaluator._resolveValue(params.userField, context);
        if (!userId) return [];

        // 2. Query DB to get the user's manager
        const UserModel = tenantConn.model('User');
        const user = await UserModel.findById(userId).populate('manager'); // Assuming manager field exists
        
        if (user && user.manager) {
            return [user.manager._id || user.manager];
        }
        return [];
      },

      /**
       * Expected params: { departmentField: "context.department" }
       * Returns all users heading the specified department.
       */
      GET_DEPARTMENT_HEAD: async (params, context, tenantConn) => {
        if (!params || !params.departmentField) return [];
        
        const deptId = SecureEvaluator._resolveValue(params.departmentField, context);
        if (!deptId) return [];

        const UserModel = tenantConn.model('User');
        const users = await UserModel.find({ 
            department: deptId,
            $or: [{ specificRole: 'HEAD' }, { isDepartmentHead: true }] // Logic based on schema
        });
        
        return users.map(u => u._id);
      },

      /**
       * Basic resolver returning exactly the user ID from the context field
       * Expected params: { userField: "context.form.validatedBy" }
       */
      FROM_CONTEXT: async (params, context) => {
        if (!params || !params.userField) return [];
        const userId = SecureEvaluator._resolveValue(params.userField, context);
        if (Array.isArray(userId)) return userId;
        return userId ? [userId] : [];
      }
    };
  }

  static async resolve(resolverName, params, context, tenantConn) {
    const resolverFn = this.resolvers[resolverName];
    if (!resolverFn) {
        console.warn(`AssignmentResolver: Unknown resolver '${resolverName}'`);
        return [];
    }
    
    try {
        const result = await resolverFn(params, context, tenantConn);
        return Array.isArray(result) ? result : [result];
    } catch (error) {
        console.error(`AssignmentResolver: Error executing '${resolverName}':`, error.message);
        return [];
    }
  }
}

module.exports = AssignmentResolver;
