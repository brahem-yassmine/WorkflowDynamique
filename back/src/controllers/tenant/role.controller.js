// back/src/controllers/tenant/role.controller.js
const mongoose = require('mongoose');
const { resolveDependencies } = require('../../utils/permission.utils');

class RoleController {

  static getModel(req) {
    if (!req.tenantConn) {
      throw new Error('Tenant connection not available');
    }
    // Roles are specific to each tenant
    return req.tenantConn.model('Role');
  }

  // Create a role
  static async create(req, res) {
    try {
      console.log('🏗️ [RoleController] Hit CREATE route');
      console.log(`📝 [RoleController] Creating role for tenant: ${req.tenantId || 'Unknown'}`);
      console.log('📦 Payload:', JSON.stringify(req.body, null, 2));

      const Role = RoleController.getModel(req);
      const { name, description, permissions, isDefault } = req.body;
      
      if (!name) {
        return res.status(400).json({ success: false, message: 'Role name is required' });
      }

      // Validate dependencies
      if (permissions && Array.isArray(permissions)) {
        const uniquePerms = Array.from(new Set(permissions));
        const expectedResolved = resolveDependencies(uniquePerms);
        
        if (expectedResolved.length !== uniquePerms.length) {
          return res.status(400).json({
            success: false,
            message: "Missing required permission dependencies. Data might be corrupted or manually altered.",
            expectedCount: expectedResolved.length,
            providedCount: uniquePerms.length,
            expectedPayload: expectedResolved
          });
        }
      }

      // Clean and validate ObjectIds
      const domainId = RoleController.normalizeId(req.body.domainId);
      const moduleId = RoleController.normalizeId(req.body.moduleId);

      console.log('📦 Create Payload (Normalized):', { name, permissionsCount: permissions?.length, domainId, moduleId });

      // Case-insensitive check with escaped name
      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existingRole = await Role.findOne({ name: { $regex: new RegExp(`^${escapedName}$`, 'i') } });
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: `The role name "${name}" is already taken.`
        });
      }

      const role = new Role({
        name,
        description,
        permissions: permissions || [],
        isDefault: isDefault || false,
        isActive: true,
        domainId: domainId || undefined,
        moduleId: moduleId || undefined
      });

      await role.save();
      console.log('✅ [RoleController] Role created successfully:', role._id);
      res.status(201).json({ success: true, data: role });

    } catch (error) {
      console.error('❌ [RoleController] Role creation Error:', error);
      
      // Handle Mongoose duplicate key error (if findOne missed it)
      if (error.code === 11000) {
        return res.status(400).json({ success: false, message: 'A role with this name already exists (unique constraint)' });
      }

      res.status(500).json({ 
        success: false, 
        message: 'Internal Server Error during Role Creation',
        details: error.message,
        stack: error.stack
      });
    }
  }

  // Get all roles
  static async getAll(req, res) {
    try {
      const Role = RoleController.getModel(req);
      const roles = await Role.find().sort({ createdAt: -1 });
      res.json({ success: true, data: roles });

    } catch (error) {
      console.error('getRoles Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✅ ADD THIS METHOD
  // Get active roles
  static async getActiveRoles(req, res) {
    try {
      const Role = RoleController.getModel(req);
      const roles = await Role.find({ isActive: true }).select('name description');
      res.json({ success: true, data: roles });

    } catch (error) {
      console.error('getActiveRoles Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get role by ID
  static async getById(req, res) {
    try {
      const Role = RoleController.getModel(req);
      const { id } = req.params;

      const role = await Role.findById(id);
      if (!role) {
        return res.status(404).json({ success: false, message: 'Role not found' });
      }

      res.json({ success: true, data: role });

    } catch (error) {
      console.error('getById Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Update a role
  static async update(req, res) {
    try {
      const Role = RoleController.getModel(req);
      const { id } = req.params;
      const { name, description, permissions, isDefault, isActive } = req.body;
      
      // Clean and validate ObjectIds
      const domainId = req.body.hasOwnProperty('domainId') ? RoleController.normalizeId(req.body.domainId) : undefined;
      const moduleId = req.body.hasOwnProperty('moduleId') ? RoleController.normalizeId(req.body.moduleId) : undefined;

      // Validate dependencies
      if (permissions && Array.isArray(permissions)) {
        const uniquePerms = Array.from(new Set(permissions));
        const expectedResolved = resolveDependencies(uniquePerms);
        
        if (expectedResolved.length !== uniquePerms.length) {
          return res.status(400).json({
            success: false,
            message: "Missing required permission dependencies. Data might be corrupted or manually altered.",
            expectedCount: expectedResolved.length,
            providedCount: uniquePerms.length,
            expectedPayload: expectedResolved
          });
        }
      }

      console.log('📦 Update Payload (Normalized):', { name, permissionsCount: permissions?.length, domainId, moduleId });

      const role = await Role.findById(id);
      if (!role) {
        return res.status(404).json({ success: false, message: 'Role not found' });
      }

      if (name && name.toLowerCase() !== role.name.toLowerCase()) {
        const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const existingRole = await Role.findOne({ name: { $regex: new RegExp(`^${escapedName}$`, 'i') } });
        if (existingRole) {
          return res.status(400).json({
            success: false,
            message: `The role name "${name}" is already taken by another role.`
          });
        }
      }

      role.name = name || role.name;
      role.description = description !== undefined ? description : role.description;
      role.permissions = permissions || role.permissions;
      if (isDefault !== undefined) role.isDefault = isDefault;
      if (isActive !== undefined) role.isActive = isActive;
      
      // Explicitly allow clearing by setting to null
      if (domainId !== undefined) role.domainId = domainId;
      if (moduleId !== undefined) role.moduleId = moduleId;

      await role.save();
      console.log('✅ [RoleController] Role updated successfully:', role._id);
      res.json({ success: true, data: role });

    } catch (error) {
      console.error('❌ [RoleController] Role Update Error:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({ success: false, message: 'This role name is already in use.' });
      }

      res.status(500).json({ 
        success: false, 
        message: 'Internal Server Error during Role Update',
        details: error.message,
        stack: error.stack
      });
    }
  }

  // Helper to normalize IDs
  static normalizeId(id) {
    if (!id || id === '' || id === 'null' || id === 'undefined') return null;
    if (typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
      return id;
    }
    // If it's already an ObjectId
    if (id instanceof mongoose.Types.ObjectId) return id;
    return null;
  }

  // Delete a role
  static async delete(req, res) {
    try {
      const Role = RoleController.getModel(req);
      const { id } = req.params;

      const role = await Role.findById(id);
      if (!role) {
        return res.status(404).json({ success: false, message: 'Role not found' });
      }

      if (role.isDefault) {
        return res.status(400).json({
          success: false,
          message: 'Impossible to delete a default role'
        });
      }

      await Role.findByIdAndDelete(id);
      res.json({ success: true, message: 'Role deleted successfully' });

    } catch (error) {
      console.error('deleteRole Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✅ ADD THIS METHOD
  // Add permissions
  static async addPermissions(req, res) {
    try {
      const Role = RoleController.getModel(req);
      const { id } = req.params;
      const { permissions } = req.body;

      const role = await Role.findById(id);
      if (!role) {
        return res.status(404).json({ success: false, message: 'Role not found' });
      }

      const newPermissions = [...new Set([...role.permissions, ...permissions])];
      role.permissions = newPermissions;
      await role.save();

      res.json({ success: true, data: role });

    } catch (error) {
      console.error('addPermissions Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✅ ADD THIS METHOD
  // Remove permissions
  static async removePermissions(req, res) {
    try {
      const Role = RoleController.getModel(req);
      const { id } = req.params;
      const { permissions } = req.body;

      const role = await Role.findById(id);
      if (!role) {
        return res.status(404).json({ success: false, message: 'Role not found' });
      }

      role.permissions = role.permissions.filter(p => !permissions.includes(p));
      await role.save();

      res.json({ success: true, data: role });

    } catch (error) {
      console.error('removePermissions Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
  // ✅ ADD THIS METHOD
  // Get global list of available permissions
  static async getAvailablePermissions(req, res) {
    try {
      if (!req.masterDb) {
        return res.status(500).json({ success: false, message: 'Master DB not available' });
      }

      const Permission = req.masterDb.model('Permission');
      const permissions = await Permission.find().sort({ category: 1, name: 1 });

      res.json({ success: true, data: permissions });

    } catch (error) {
      console.error('getAvailablePermissions Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = RoleController;