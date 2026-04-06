// back/src/controllers/tenant/role.controller.js
const mongoose = require('mongoose');

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
      const Role = RoleController.getModel(req);
      const { name, description, permissions, isDefault } = req.body;
      console.log('📦 Create Payload:', { name, permissionsCount: permissions?.length });

      const existingRole = await Role.findOne({ name });
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: 'A role with this name already exists'
        });
      }

      const role = new Role({
        name,
        description,
        permissions: permissions || [],
        isDefault: isDefault || false,
        isActive: true
      });

      await role.save();
      console.log('✅ Role created successfully:', role._id);
      res.status(201).json({ success: true, data: role });

    } catch (error) {
      console.error('Role creation Error:', error);
      res.status(500).json({ success: false, message: error.message });
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
      console.log('🔄 [RoleController] Hit UPDATE route for ID:', req.params.id);
      const Role = RoleController.getModel(req);
      const { id } = req.params;
      const { name, description, permissions, isDefault, isActive } = req.body;
      console.log('📦 Update Payload:', { name, permissionsCount: permissions?.length });

      const role = await Role.findById(id);
      if (!role) {
        return res.status(404).json({ success: false, message: 'Role not found' });
      }

      if (name && name !== role.name) {
        const existingRole = await Role.findOne({ name });
        if (existingRole) {
          return res.status(400).json({
            success: false,
            message: 'A role with this name already exists'
          });
        }
      }

      role.name = name || role.name;
      role.description = description !== undefined ? description : role.description;
      role.permissions = permissions || role.permissions;
      if (isDefault !== undefined) role.isDefault = isDefault;
      if (isActive !== undefined) role.isActive = isActive;

      await role.save();
      console.log('✅ Role updated successfully:', role._id);
      res.json({ success: true, data: role });

    } catch (error) {
      console.error('❌ [RoleController] Update Error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal Server Error during Role Update',
        details: error.message 
      });
    }
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