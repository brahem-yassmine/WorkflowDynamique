// back/src/controllers/tenantController.js

// Dashboard principal
exports.getDashboard = async (req, res) => {
  try {
    // Vérification que tenant existe
    if (!req.tenant) {
      return res.status(404).json({ 
        success: false, 
        message: "Tenant non trouvé" 
      });
    }

    res.json({
      success: true,
      data: {
        message: "Dashboard tenant",
        tenant: {
          id: req.tenant._id,
          name: req.tenant.name,
          email: req.tenant.email,
          status: req.tenant.status,
          plan: req.tenant.selectedPlan
        },
        user: req.user ? {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role
        } : null
      }
    });
  } catch (error) {
    console.error(' Erreur getDashboard:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Informations du tenant
exports.getTenantInfo = async (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({ 
        success: false, 
        message: "Tenant non trouvé" 
      });
    }

    res.json({
      success: true,
      data: {
        _id: req.tenant._id,
        name: req.tenant.name,
        email: req.tenant.email,
        status: req.tenant.status,
        industry: req.tenant.industry,
        adminName: req.tenant.adminName,
        selectedPlan: req.tenant.selectedPlan,
        createdAt: req.tenant.createdAt
      }
    });
  } catch (error) {
    console.error(' Erreur getTenantInfo:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Paramètres du tenant
exports.getTenantSettings = async (req, res) => {
  try {
    // Vérifier que la connexion tenant existe
    if (!req.tenantConn) {
      return res.status(500).json({ 
        success: false, 
        message: "Connexion à la base tenant non disponible" 
      });
    }

    // Récupérer ou créer le modèle Settings
    let Settings;
    try {
      Settings = req.tenantConn.model('Settings');
    } catch (error) {
      // Si le modèle n'existe pas, on le crée
      const mongoose = require('mongoose');
      const settingsSchema = new mongoose.Schema({
        theme: { type: String, default: 'light' },
        notifications: { type: Boolean, default: true },
        language: { type: String, default: 'fr' },
        timezone: { type: String, default: 'Europe/Paris' }
      }, { timestamps: true });
      
      Settings = req.tenantConn.model('Settings', settingsSchema);
    }
    
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create({
        theme: 'light',
        notifications: true,
        language: 'fr',
        timezone: 'Europe/Paris'
      });
    }
    
    res.json({ 
      success: true, 
      data: settings 
    });
  } catch (error) {
    console.error('❌ Erreur getTenantSettings:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

exports.updateTenantSettings = async (req, res) => {
  try {
    if (!req.tenantConn) {
      return res.status(500).json({ 
        success: false, 
        message: "Connexion à la base tenant non disponible" 
      });
    }

    const Settings = req.tenantConn.model('Settings');
    
    let settings = await Settings.findOneAndUpdate(
      {},
      req.body,
      { new: true, upsert: true, runValidators: true }
    );
    
    res.json({ 
      success: true, 
      data: settings 
    });
  } catch (error) {
    console.error('❌ Erreur updateTenantSettings:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Gestion d'équipe
exports.getTeamMembers = async (req, res) => {
  try {
    if (!req.tenantConn) {
      return res.status(500).json({ 
        success: false, 
        message: "Connexion à la base tenant non disponible" 
      });
    }

    const User = req.tenantConn.model('User');
    const users = await User.find({ role: { $ne: 'super_admin' } })
      .select('-password -__v')
      .sort({ createdAt: -1 });
    
    res.json({ 
      success: true, 
      data: users 
    });
  } catch (error) {
    console.error('❌ Erreur getTeamMembers:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

exports.inviteTeamMember = async (req, res) => {
  try {
    const { email, role, firstName, lastName } = req.body;
    
    if (!email || !role) {
      return res.status(400).json({ 
        success: false, 
        message: "Email et rôle requis" 
      });
    }

    if (!req.tenantConn) {
      return res.status(500).json({ 
        success: false, 
        message: "Connexion à la base tenant non disponible" 
      });
    }

    const User = req.tenantConn.model('User');
    
    // Vérifier si l'utilisateur existe déjà
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: "Cet utilisateur existe déjà" 
      });
    }
    
    // Créer une invitation
    const Invitation = req.tenantConn.model('Invitation');
    
    // Générer un token unique
    const generateToken = () => {
      return Math.random().toString(36).substring(2, 15) + 
             Math.random().toString(36).substring(2, 15);
    };
    
    const invitation = await Invitation.create({
      email,
      role,
      firstName,
      lastName,
      token: generateToken(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
    });
    
    // TODO: Envoyer l'email d'invitation
    console.log(`📧 Invitation créée pour ${email} avec token: ${invitation.token}`);
    
    res.json({ 
      success: true, 
      message: "Invitation envoyée",
      data: { 
        email, 
        role, 
        token: invitation.token,
        expiresAt: invitation.expiresAt 
      }
    });
  } catch (error) {
    console.error('❌ Erreur inviteTeamMember:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

exports.removeTeamMember = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: "ID utilisateur requis" 
      });
    }

    if (!req.tenantConn) {
      return res.status(500).json({ 
        success: false, 
        message: "Connexion à la base tenant non disponible" 
      });
    }

    const User = req.tenantConn.model('User');
    
    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "Utilisateur non trouvé" 
      });
    }
    
    // Empêcher la suppression du dernier admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          success: false, 
          message: "Impossible de supprimer le dernier administrateur" 
        });
      }
    }
    
    await User.findByIdAndDelete(userId);
    
    res.json({ 
      success: true, 
      message: "Membre retiré avec succès" 
    });
  } catch (error) {
    console.error('❌ Erreur removeTeamMember:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};