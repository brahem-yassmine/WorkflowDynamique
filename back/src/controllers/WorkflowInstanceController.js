// back/src/controllers/workflowInstanceController.js


// back/src/controllers/workflowInstanceController.js
// ❌ SUPPRIMER ces imports
// const WorkflowInstance = require('../models/WorkflowInstance');
// const Workflow = require('../models/Workflow');
// const User = require('../models/User');

// ============================================
// 1. CRÉER UNE INSTANCE DE WORKFLOW
// ============================================
exports.createInstance = async (req, res) => {
  try {
    const { workflowId, title, description, data, priority, dueDate, tags } = req.body;
    
    // ✅ Récupérer les modèles depuis la connexion tenant
    const Workflow = req.tenantConn.model('Workflow');
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    
    if (!workflowId || !title) {
      return res.status(400).json({
        success: false,
        message: 'Workflow ID et titre sont requis'
      });
    }
    
    // ✅ Plus besoin de filtrer par tenantId
    const workflow = await Workflow.findOne({
      _id: workflowId,
      status: 'active'
    });
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow actif non trouvé'
      });
    }
    
    // Copier les étapes
    const instanceSteps = workflow.steps.map(step => ({
      ...step.toObject(),
      _id: undefined,
      status: 'pending',
      processedBy: null,
      comments: '',
      startedAt: null,
      completedAt: null,
      stepData: {}
    }));
    
    if (instanceSteps.length > 0) {
      instanceSteps[0].status = 'in_progress';
      instanceSteps[0].startedAt = new Date();
    }
    
    // ✅ Plus de tenantId, on utilise createdBy
    const instance = new WorkflowInstance({
      workflowId: workflow._id,
      createdBy: req.user.userId,
      title,
      description: description || workflow.description,
      data: data || {},
      steps: instanceSteps,
      currentStepIndex: 0,
      status: instanceSteps.length > 0 ? 'in_progress' : 'pending',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      tags: tags || [],
      timeStarted: new Date(),
      history: [{
        action: 'instance_created',
        stepName: 'Début',
        performedBy: req.user.userId,
        comments: 'Instance de workflow créée'
      }]
    });
    
    await instance.save();
    
    // Peupler les références
    await instance.populate([
      { path: 'workflowId', select: 'name description' },
      { path: 'createdBy', select: 'email firstName lastName' }
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Instance de workflow créée',
      data: instance
    });
    
  } catch (error) {
    console.error('❌ Erreur createInstance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// ============================================
// 2. LISTER LES INSTANCES
// ============================================
exports.getInstances = async (req, res) => {
  try {
    const { 
      status, 
      workflowId, 
      priority, 
      createdBy,
      responsibleDomain,
      page = 1,
      limit = 10
    } = req.query;
    
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    
    // ❌ SUPPRIMER tenantId du query
    const query = {};
    
    if (status) query.status = status;
    if (workflowId) query.workflowId = workflowId;
    if (priority) query.priority = priority;
    if (createdBy) query.createdBy = createdBy;
    
    if (responsibleDomain) {
      query['steps.responsibleDomain'] = responsibleDomain;
      query['steps.status'] = 'in_progress';
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [instances, total] = await Promise.all([
      WorkflowInstance.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('workflowId', 'name description')
        .populate('createdBy', 'email firstName lastName'),
      WorkflowInstance.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      count: instances.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: instances
    });
    
  } catch (error) {
    console.error('❌ Erreur getInstances:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ============================================
// 3. RÉCUPÉRER UNE INSTANCE
// ============================================
exports.getInstanceById = async (req, res) => {
  try {
    const { instanceId } = req.params;
    
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    
    // ❌ SUPPRIMER tenantId du filtre
    const instance = await WorkflowInstance.findById(instanceId)
      .populate('workflowId')
      .populate('createdBy', 'email firstName lastName')
      .populate('steps.processedBy', 'email firstName lastName')
      .populate('history.performedBy', 'email firstName lastName');
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        message: 'Instance non trouvée'
      });
    }
    
    res.json({
      success: true,
      data: instance
    });
    
  } catch (error) {
    console.error('❌ Erreur getInstanceById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ============================================
// 4. APPROUVER UNE ÉTAPE
// ============================================
exports.approveStep = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { comments, stepData } = req.body;
    
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    
    // ❌ SUPPRIMER tenantId
    const instance = await WorkflowInstance.findById(instanceId);
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        message: 'Instance non trouvée'
      });
    }
    
    if (instance.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Cette instance n\'est pas en cours'
      });
    }
    
    const currentStep = instance.getCurrentStep();
    
    if (currentStep.responsibleDomain !== req.user.domain && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à approuver cette étape'
      });
    }
    
    currentStep.status = 'approved';
    currentStep.processedBy = req.user.userId;
    currentStep.comments = comments || '';
    currentStep.stepData = stepData || currentStep.stepData;
    currentStep.completedAt = new Date();
    
    instance.history.push({
      action: 'step_approved',
      stepName: currentStep.name,
      performedBy: req.user.userId,
      comments: comments || 'Étape approuvée'
    });
    
    const hasNextStep = instance.nextStep();
    
    if (!hasNextStep) {
      instance.status = 'approved';
      instance.timeCompleted = new Date();
      
      instance.history.push({
        action: 'workflow_completed',
        stepName: 'Fin',
        performedBy: req.user.userId,
        comments: 'Workflow approuvé avec succès'
      });
    }
    
    await instance.save();
    
    res.json({
      success: true,
      message: 'Étape approuvée',
      data: instance
    });
    
  } catch (error) {
    console.error('❌ Erreur approveStep:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ============================================
// 5. REJETER UNE ÉTAPE
// ============================================
exports.rejectStep = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { comments } = req.body;
    
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    
    const instance = await WorkflowInstance.findById(instanceId);
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        message: 'Instance non trouvée'
      });
    }
    
    const currentStep = instance.getCurrentStep();
    
    currentStep.status = 'rejected';
    currentStep.processedBy = req.user.userId;
    currentStep.comments = comments || 'Rejeté';
    currentStep.completedAt = new Date();
    
    instance.status = 'rejected';
    instance.timeCompleted = new Date();
    
    instance.history.push({
      action: 'step_rejected',
      stepName: currentStep.name,
      performedBy: req.user.userId,
      comments: comments || 'Étape rejetée'
    });
    
    await instance.save();
    
    res.json({
      success: true,
      message: 'Étape rejetée',
      data: instance
    });
    
  } catch (error) {
    console.error('❌ Erreur rejectStep:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ============================================
// 6. ANNULER UNE INSTANCE
// ============================================
exports.cancelInstance = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { comments } = req.body;
    
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    
    const instance = await WorkflowInstance.findOne({
      _id: instanceId,
      createdBy: req.user.userId
    });
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        message: 'Instance non trouvée ou non autorisée'
      });
    }
    
    if (instance.status === 'completed' || instance.status === 'approved' || instance.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Impossible d\'annuler une instance terminée'
      });
    }
    
    instance.status = 'cancelled';
    instance.timeCompleted = new Date();
    
    const currentStep = instance.getCurrentStep();
    if (currentStep) {
      currentStep.status = 'skipped';
      currentStep.comments = 'Instance annulée';
      currentStep.completedAt = new Date();
    }
    
    instance.history.push({
      action: 'instance_cancelled',
      stepName: currentStep?.name || 'N/A',
      performedBy: req.user.userId,
      comments: comments || 'Instance annulée par l\'utilisateur'
    });
    
    await instance.save();
    
    res.json({
      success: true,
      message: 'Instance annulée',
      data: instance
    });
    
  } catch (error) {
    console.error('❌ Erreur cancelInstance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ============================================
// 7. AJOUTER UN FICHIER
// ============================================
exports.addAttachment = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { filename, url } = req.body;
    
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    
    if (!filename || !url) {
      return res.status(400).json({
        success: false,
        message: 'Nom du fichier et URL requis'
      });
    }
    
    const instance = await WorkflowInstance.findById(instanceId);
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        message: 'Instance non trouvée'
      });
    }
    
    instance.attachments.push({
      filename,
      url,
      uploadedBy: req.user.userId
    });
    
    instance.history.push({
      action: 'attachment_added',
      stepName: 'Fichier',
      performedBy: req.user.userId,
      comments: `Fichier ajouté: ${filename}`
    });
    
    await instance.save();
    
    res.json({
      success: true,
      message: 'Fichier ajouté',
      data: instance.attachments[instance.attachments.length - 1]
    });
    
  } catch (error) {
    console.error('❌ Erreur addAttachment:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ============================================
// 8. STATISTIQUES DES INSTANCES
// ============================================
exports.getInstanceStats = async (req, res) => {
  try {
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    
    // ❌ SUPPRIMER tenantId du match
    const stats = await WorkflowInstance.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgDuration: { 
            $avg: { 
              $cond: [
                { $ne: ['$timeCompleted', null] },
                { $subtract: ['$timeCompleted', '$timeStarted'] },
                null
              ]
            }
          }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          avgDurationSeconds: { $divide: ['$avgDuration', 1000] },
          _id: 0
        }
      }
    ]);
    
    const byWorkflow = await WorkflowInstance.aggregate([
      {
        $group: {
          _id: '$workflowId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'workflows',
          localField: '_id',
          foreignField: '_id',
          as: 'workflow'
        }
      },
      {
        $project: {
          workflowId: '$_id',
          workflowName: { $arrayElemAt: ['$workflow.name', 0] },
          count: 1,
          _id: 0
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        stats,
        topWorkflows: byWorkflow,
        total: stats.reduce((acc, curr) => acc + curr.count, 0)
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur getInstanceStats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};