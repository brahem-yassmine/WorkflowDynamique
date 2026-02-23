// back/src/controllers/tenant/role.controller.js
const mongoose = require('mongoose');

class RoleController {

  static getModel(req) {
    if (!req.tenantConn) {
      throw new Error('Connexion tenant non disponible');
    }
    // Les rôles sont spécifiques à chaque tenant
    return req.tenantConn.model('Role');
  }

  // Créer un rôle
  static async create(req, res) {
    try {
      const Role = RoleController.getModel(req);
      const { name, description, permissions, isDefault } = req.body;

      const existingRole = await Role.findOne({ name });
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: 'Un rôle avec ce nom existe déjà'
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
      res.status(201).json({ success: true, data: role });

    } catch (error) {
      console.error('Erreur création rôle:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Récupérer tous les rôles
  static async getAll(req, res) {
    try {
      const Role = RoleController.getModel(req);
      const roles = await Role.find().sort({ createdAt: -1 });
      res.json({ success: true, data: roles });

    } catch (error) {
      console.error('Erreur récupération rôles:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✅ AJOUTER CETTE MÉTHODE
  // Récupérer les rôles actifs
  static async getActiveRoles(req, res) {
    try {
      const Role = RoleController.getModel(req);
      const roles = await Role.find({ isActive: true }).select('name description');
      res.json({ success: true, data: roles });

    } catch (error) {
      console.error('Erreur récupération rôles actifs:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Récupérer un rôle par ID
  static async getById(req, res) {
    try {
      const Role = RoleController.getModel(req);
      const { id } = req.params;

      const role = await Role.findById(id);
      if (!role) {
        return res.status(404).json({ success: false, message: 'Rôle non trouvé' });
      }

      res.json({ success: true, data: role });

    } catch (error) {
      console.error('Erreur récupération rôle:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Mettre à jour un rôle
  static async update(req, res) {
    try {
      const Role = RoleController.getModel(req);
      const { id } = req.params;
      const { name, description, permissions, isDefault, isActive } = req.body;

      const role = await Role.findById(id);
      if (!role) {
        return res.status(404).json({ success: false, message: 'Rôle non trouvé' });
      }

      if (name && name !== role.name) {
        const existingRole = await Role.findOne({ name });
        if (existingRole) {
          return res.status(400).json({
            success: false,
            message: 'Un rôle avec ce nom existe déjà'
          });
        }
      }

      role.name = name || role.name;
      role.description = description !== undefined ? description : role.description;
      role.permissions = permissions || role.permissions;
      if (isDefault !== undefined) role.isDefault = isDefault;
      if (isActive !== undefined) role.isActive = isActive;

      await role.save();
      res.json({ success: true, data: role });

    } catch (error) {
      console.error('Erreur mise à jour rôle:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Supprimer un rôle
  static async delete(req, res) {
    try {
      const Role = RoleController.getModel(req);
      const { id } = req.params;

      const role = await Role.findById(id);
      if (!role) {
        return res.status(404).json({ success: false, message: 'Rôle non trouvé' });
      }

      if (role.isDefault) {
        return res.status(400).json({
          success: false,
          message: 'Impossible de supprimer un rôle par défaut'
        });
      }

      await Role.findByIdAndDelete(id);
      res.json({ success: true, message: 'Rôle supprimé avec succès' });

    } catch (error) {
      console.error('Erreur suppression rôle:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✅ AJOUTER CETTE MÉTHODE
  // Ajouter des permissions
  static async addPermissions(req, res) {
    try {
      const Role = RoleController.getModel(req);
      const { id } = req.params;
      const { permissions } = req.body;

      const role = await Role.findById(id);
      if (!role) {
        return res.status(404).json({ success: false, message: 'Rôle non trouvé' });
      }

      const newPermissions = [...new Set([...role.permissions, ...permissions])];
      role.permissions = newPermissions;
      await role.save();

      res.json({ success: true, data: role });

    } catch (error) {
      console.error('Erreur ajout permissions:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✅ AJOUTER CETTE MÉTHODE
  // Retirer des permissions
  static async removePermissions(req, res) {
    try {
      const Role = RoleController.getModel(req);
      const { id } = req.params;
      const { permissions } = req.body;

      const role = await Role.findById(id);
      if (!role) {
        return res.status(404).json({ success: false, message: 'Rôle non trouvé' });
      }

      role.permissions = role.permissions.filter(p => !permissions.includes(p));
      await role.save();

      res.json({ success: true, data: role });

    } catch (error) {
      console.error('Erreur retrait permissions:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
  // ✅ AJOUTER CETTE MÉTHODE
  // Récupérer la liste globale des permissions disponibles
  static async getAvailablePermissions(req, res) {
    try {
      if (!req.masterDb) {
        return res.status(500).json({ success: false, message: 'Base Master non disponible' });
      }

      const Permission = req.masterDb.model('Permission');
      const permissions = await Permission.find().sort({ category: 1, name: 1 });

      res.json({ success: true, data: permissions });

    } catch (error) {
      console.error('Erreur récupération permissions:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = RoleController;