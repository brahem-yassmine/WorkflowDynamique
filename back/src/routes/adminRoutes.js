// back/src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth, requireRole } = require('../middleware/auth');

// Toutes les routes nécessitent authentification et rôle super_admin
router.use(auth);
router.use(requireRole('super_admin'));

// ========================
// GESTION DES TENANTS (ENTREPRISES)
// ========================

// GET /api/admin/tenants - Liste tous les tenants
router.get('/tenants', async (req, res) => {
  try {
    console.log(' Récupération de tous les tenants...');
    
    //  Utiliser la connexion master depuis app.locals
    const masterDb = req.app.locals.masterDb;
    if (!masterDb) {
      return res.status(500).json({ 
        success: false, 
        message: 'Connexion master non disponible' 
      });
    }
    
    //  Récupérer le modèle Tenant depuis la connexion
    const Tenant = masterDb.model('Tenant');
    
    const tenants = await Tenant.find()
      .populate('selectedPlan')
      .sort({ createdAt: -1 });
    
    console.log(` ${tenants.length} tenants trouvés`);
    
    // Ajouter des informations supplémentaires
    const enrichedTenants = await Promise.all(tenants.map(async (tenant) => {
      // Compter les utilisateurs si possible
      let userCount = 0;
      try {
        if (tenant.databaseName) {
          // Connexion à la base du tenant pour compter les users
          const tenantConn = mongoose.createConnection(tenant.databaseUri);
          await new Promise((resolve) => tenantConn.once('connected', resolve));
          
          const User = tenantConn.model('User', new mongoose.Schema({
            email: String,
            role: String
          }));
          
          userCount = await User.countDocuments();
          await tenantConn.close();
        }
      } catch (error) {
        console.log(` Impossible de compter users pour ${tenant.name}`);
      }
      
      return {
        ...tenant.toObject(),
        userCount,
        // Valeurs par défaut pour le frontend
        industry: tenant.industry || 'Non spécifié',
        adminName: tenant.adminName || (tenant.email ? tenant.email.split('@')[0] : 'Admin')
      };
    }));
    
    res.json({
      success: true,
      data: enrichedTenants
    });
    
  } catch (error) {
    console.error(' Erreur GET /tenants:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/admin/tenants/:id - Détails d'un tenant
router.get('/tenants/:id', async (req, res) => {
  try {
    const masterDb = req.app.locals.masterDb;
    const Tenant = masterDb.model('Tenant');
    
    const tenant = await Tenant.findById(req.params.id).populate('selectedPlan');
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant non trouvé'
      });
    }
    
    // Compter les utilisateurs
    let userCount = 0;
    try {
      if (tenant.databaseName) {
        const tenantConn = mongoose.createConnection(tenant.databaseUri);
        await new Promise((resolve) => tenantConn.once('connected', resolve));
        
        const User = tenantConn.model('User', new mongoose.Schema({
          email: String,
          role: String
        }));
        
        userCount = await User.countDocuments();
        await tenantConn.close();
      }
    } catch (error) {
      console.log(` Impossible de compter users`);
    }
    
    res.json({
      success: true,
      data: {
        ...tenant.toObject(),
        userCount,
        industry: tenant.industry || 'Non spécifié',
        adminName: tenant.adminName || (tenant.email ? tenant.email.split('@')[0] : 'Admin')
      }
    });
    
  } catch (error) {
    console.error(' Erreur GET /tenants/:id:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// PUT /api/admin/tenants/:id - Mettre à jour un tenant
router.put('/tenants/:id', async (req, res) => {
  try {
    const masterDb = req.app.locals.masterDb;
    const Tenant = masterDb.model('Tenant');
    
    const updates = {
      name: req.body.name,
      email: req.body.email,
      industry: req.body.industry,
      adminName: req.body.adminName,
      status: req.body.status
    };
    
    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('selectedPlan');
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: tenant
    });
    
  } catch (error) {
    console.error(' Erreur PUT /tenants/:id:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// PATCH /api/admin/tenants/:id/status - Changer le statut
router.patch('/tenants/:id/status', async (req, res) => {
  try {
    const masterDb = req.app.locals.masterDb;
    const Tenant = masterDb.model('Tenant');
    
    const { status } = req.body;
    
    if (!['active', 'suspended', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }
    
    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: tenant
    });
    
  } catch (error) {
    console.error(' Erreur PATCH /tenants/:id/status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// DELETE /api/admin/tenants/:id - Supprimer (soft delete)
router.delete('/tenants/:id', async (req, res) => {
  try {
    const masterDb = req.app.locals.masterDb;
    const Tenant = masterDb.model('Tenant');
    
    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant non trouvé'
      });
    }
    
    res.json({
      success: true,
      message: 'Tenant désactivé avec succès'
    });
    
  } catch (error) {
    console.error(' Erreur DELETE /tenants/:id:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/admin/tenants/:id/users/count - Compter les utilisateurs
router.get('/tenants/:id/users/count', async (req, res) => {
  try {
    const masterDb = req.app.locals.masterDb;
    const Tenant = masterDb.model('Tenant');
    
    const tenant = await Tenant.findById(req.params.id);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant non trouvé'
      });
    }
    
    let count = 0;
    if (tenant.databaseName) {
      const tenantConn = mongoose.createConnection(tenant.databaseUri);
      await new Promise((resolve) => tenantConn.once('connected', resolve));
      
      const User = tenantConn.model('User', new mongoose.Schema({
        email: String,
        role: String
      }));
      
      count = await User.countDocuments();
      await tenantConn.close();
    }
    
    res.json({
      success: true,
      count
    });
    
  } catch (error) {
    console.error(' Erreur GET /users/count:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ========================
// STATISTIQUES GLOBALES POUR LE DASHBOARD
// ========================

// ✅ ROUTE STATISTIQUES - Version JavaScript pur (sans TypeScript)
router.get('/stats', async (req, res) => {
  try {
    console.log(' Récupération des statistiques globales...');
    
    const masterDb = req.app.locals.masterDb;
    if (!masterDb) {
      return res.status(500).json({ 
        success: false, 
        message: 'Connexion master non disponible' 
      });
    }
    
    const Tenant = masterDb.model('Tenant');
    
    // Récupérer tous les tenants
    const tenants = await Tenant.find().populate('selectedPlan');
    
    // Initialiser les compteurs (objets simples, pas de TypeScript)
    let totalUsers = 0;
    let totalWorkflows = 0;
    let totalExecutions = 0;
    const sectorCounts = {}; // Objet simple
    const planCounts = {}; // Objet simple
    
    // Parcourir tous les tenants pour collecter les stats
    for (const tenant of tenants) {
      // Stats de base
      const sector = tenant.industry || 'Non spécifié';
      sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
      
      const planName = tenant.selectedPlan?.name || tenant.planDetails?.name || 'Sans plan';
      planCounts[planName] = (planCounts[planName] || 0) + 1;
      
      // Essayer de compter les utilisateurs réels
      try {
        if (tenant.databaseName) {
          const tenantConn = mongoose.createConnection(tenant.databaseUri);
          await new Promise((resolve) => tenantConn.once('connected', resolve));
          
          const User = tenantConn.model('User', new mongoose.Schema({
            email: String,
            role: String
          }));
          
          const userCount = await User.countDocuments();
          totalUsers += userCount;
          
          await tenantConn.close();
        }
      } catch (err) {
        console.log(` Impossible de compter pour ${tenant.name}:`, err.message);
      }
    }
    
    // Convertir les objets en tableaux pour les graphiques
    const sectorDistribution = Object.keys(sectorCounts).map(function(sector) {
      return {
        sector: sector,
        value: sectorCounts[sector]
      };
    });
    
    const planDistribution = Object.keys(planCounts).map(function(name) {
      return {
        name: name,
        value: planCounts[name]
      };
    });
    
    // Statistiques calculées
    const stats = {
      totalCompanies: tenants.length,
      activeCompanies: tenants.filter(function(t) { return t.status === 'active'; }).length,
      suspendedCompanies: tenants.filter(function(t) { return t.status === 'suspended'; }).length,
      inactiveCompanies: tenants.filter(function(t) { return t.status === 'inactive'; }).length,
      
      totalUsers: totalUsers,
      totalWorkflows: 876, // À remplacer par des données réelles
      totalExecutions: 12450, // À remplacer par des données réelles
      
      trialCompanies: planCounts['Demo Plan'] || planCounts['DEMO'] || 0,
      paidCompanies: (planCounts['Starter Plan'] || 0) + (planCounts['Pro Plan'] || 0),
      
      averageGpuUsage: 68,
      
      // Données pour les graphiques
      sectorDistribution: sectorDistribution,
      planDistribution: planDistribution,
      
      revenue: {
        total: 84250,
        monthly: [
          { month: "Jan", revenue: 12000 },
          { month: "Feb", revenue: 15000 },
          { month: "Mar", revenue: 18000 },
          { month: "Apr", revenue: 22000 },
          { month: "May", revenue: 17000 },
          { month: "Jun", revenue: 24000 }
        ]
      }
    };
    
    console.log(' Statistiques calculées avec succès');
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error(' Erreur GET /stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ========================
// GESTION DES PLANS
// ========================

// GET /api/admin/plans - Liste tous les plans
router.get('/plans', async (req, res) => {
  try {
    const masterDb = req.app.locals.masterDb;
    if (!masterDb) {
      return res.status(500).json({ 
        success: false, 
        message: 'Connexion master non disponible' 
      });
    }
    
    // Récupérer le modèle Plan depuis la connexion
    const Plan = masterDb.model('Plan');
    
    const plans = await Plan.find().sort({ price: 1 });
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error(' Erreur GET /plans:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/admin/plans - Créer un nouveau plan
router.post('/plans', async (req, res) => {
  try {
    const masterDb = req.app.locals.masterDb;
    const Plan = masterDb.model('Plan');
    
    const plan = new Plan(req.body);
    await plan.save();
    
    res.status(201).json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error(' Erreur POST /plans:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// PUT /api/admin/plans/:id - Mettre à jour un plan
router.put('/plans/:id', async (req, res) => {
  try {
    const masterDb = req.app.locals.masterDb;
    const Plan = masterDb.model('Plan');
    
    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error(' Erreur PUT /plans/:id:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// DELETE /api/admin/plans/:id - Supprimer un plan
router.delete('/plans/:id', async (req, res) => {
  try {
    const masterDb = req.app.locals.masterDb;
    const Plan = masterDb.model('Plan');
    
    const plan = await Plan.findByIdAndDelete(req.params.id);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan non trouvé'
      });
    }
    
    res.json({
      success: true,
      message: 'Plan supprimé avec succès'
    });
  } catch (error) {
    console.error(' Erreur DELETE /plans/:id:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;