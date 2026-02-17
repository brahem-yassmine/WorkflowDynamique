// back/src/controllers/tenantController.js
// ✅ Plus besoin d'importer Tenant et User (ils sont dans req)

// back/src/controllers/tenantController.js

// Dashboard principal
exports.getDashboard = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        message: "Dashboard tenant",
        tenant: req.tenant,
        user: req.user
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Informations du tenant
exports.getTenantInfo = async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.tenant
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Paramètres du tenant
exports.getTenantSettings = async (req, res) => {
  try {
    // Récupérer les settings depuis la base tenant
    const Settings = req.tenantConn?.model('Settings');
    let settings = await Settings?.findOne();
    
    if (!settings) {
      settings = { theme: 'light', notifications: true };
    }
    
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTenantSettings = async (req, res) => {
  try {
    const Settings = req.tenantConn?.model('Settings');
    let settings = await Settings?.findOneAndUpdate(
      {},
      req.body,
      { new: true, upsert: true }
    );
    
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Gestion d'équipe
exports.getTeamMembers = async (req, res) => {
  try {
    const User = req.tenantConn?.model('User');
    const users = await User.find({ role: { $ne: 'super_admin' } })
      .select('-password');
    
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.inviteTeamMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const User = req.tenantConn?.model('User');
    
    // Vérifier si l'utilisateur existe déjà
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: "Cet utilisateur existe déjà" 
      });
    }
    
    // Créer une invitation (à implémenter avec un service d'email)
    const invitation = {
      email,
      role,
      token: Math.random().toString(36).substring(7),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
    
    // Sauvegarder l'invitation
    const Invitation = req.tenantConn?.model('Invitation');
    await Invitation?.create(invitation);
    
    // TODO: Envoyer l'email d'invitation
    
    res.json({ 
      success: true, 
      message: "Invitation envoyée",
      data: { email, role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeTeamMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const User = req.tenantConn?.model('User');
    
    await User.findByIdAndDelete(userId);
    
    res.json({ 
      success: true, 
      message: "Membre retiré avec succès" 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};