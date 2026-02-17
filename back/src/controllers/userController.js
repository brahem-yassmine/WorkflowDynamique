// back/src/controllers/userController.js
const bcrypt = require('bcryptjs');


// ✅ Plus d'import de User (via req.tenantConn)


// Lister les utilisateurs de l'entreprise
exports.getUsers = async (req, res) => {
  try {
    const User = req.tenantConn.model('User');
    
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: users
    });
    
  } catch (error) {
    console.error('Erreur getUsers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
};

// Créer un nouvel utilisateur
exports.createUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Permission refusée' 
      });
    }
    
    const { email, password, firstName, lastName, role, domain } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email et mot de passe requis' 
      });
    }
    
    const User = req.tenantConn.model('User');
    
    // Vérifier si l'utilisateur existe déjà dans ce tenant
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cet utilisateur existe déjà' 
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      role: role || 'user',
      domain: domain || 'RH'
    });
    
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: userResponse
    });
    
  } catch (error) {
    console.error('Erreur createUser:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
};

// Mettre à jour un utilisateur
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    const User = req.tenantConn.model('User');
    
    // Vérifier les permissions
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    if (req.user.role !== 'admin' && req.user.userId.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Permission refusée' 
      });
    }
    
    // Ne pas permettre à un non-admin de changer le rôle
    if (req.user.role !== 'admin' && updates.role) {
      delete updates.role;
    }
    
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    
    Object.assign(targetUser, updates);
    await targetUser.save();
    
    const userResponse = targetUser.toObject();
    delete userResponse.password;
    
    res.json({
      success: true,
      message: 'Utilisateur mis à jour',
      data: userResponse
    });
    
  } catch (error) {
    console.error('Erreur updateUser:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
};

// ✅ Supprimer un utilisateur
exports.deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Permission refusée' 
      });
    }
    
    const { userId } = req.params;
    const User = req.tenantConn.model('User');
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    // Empêcher la suppression de soi-même
    if (user._id.toString() === req.user.userId.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vous ne pouvez pas supprimer votre propre compte' 
      });
    }
    
    await user.deleteOne();
    
    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
    
  } catch (error) {
    console.error('Erreur deleteUser:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
};