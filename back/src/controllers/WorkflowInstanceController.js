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

    // ✅ INITIALISATION GRAPH
    // Trouver le noeud de départ
    const startNode = workflow.nodes.find(n => n.type === 'start');

    if (!startNode) {
      return res.status(400).json({
        success: false,
        message: 'Le workflow n\'a pas de noeud de départ'
      });
    }

    // ✅ Plus de tenantId, on utilise createdBy
    const instance = new WorkflowInstance({
      workflowId: workflow._id,
      createdBy: req.user.userId,
      title,
      description: description || workflow.description,

      // Initialisation du graph
      currentNodes: [{
        nodeId: startNode.id,
        status: 'in_progress',
        startedAt: new Date(),
        responsibleUser: null
      }],

      variables: data || {}, // Variables initiales

      executionPath: [{
        nodeId: startNode.id,
        nodeType: 'start',
        action: 'start',
        performedBy: req.user.userId,
        comments: 'Workflow démarré',
        timestamp: new Date()
      }],

      status: 'in_progress',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      tags: tags || [],
      timeStarted: new Date(),

      history: [{
        action: 'instance_created',
        title: 'Démarrage',
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
      // TODO: Adapt for Graph (need to check active nodes responsibleDomain)
      // query['steps.responsibleDomain'] = responsibleDomain;
      // query['steps.status'] = 'in_progress';
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
      // .populate('steps.processedBy', 'email firstName lastName') // Removed
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
// 4. APPROUVER UNE ÉTAPE (TRANSITION NOEUD)
// ============================================
exports.approveNode = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { nodeId, comments, data } = req.body;

    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');
    const Workflow = req.tenantConn.model('Workflow');

    const instance = await WorkflowInstance.findById(instanceId);

    if (!instance) {
      return res.status(404).json({ success: false, message: 'Instance non trouvée' });
    }

    if (instance.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Instance non active' });
    }

    // Trouver le noeud actif correspondant
    const currentNodeIndex = instance.currentNodes.findIndex(n => n.nodeId === nodeId && n.status === 'in_progress');

    if (currentNodeIndex === -1) {
      return res.status(400).json({ success: false, message: 'Ce noeud n\'est pas actif ou n\'existe pas' });
    }

    const currentNode = instance.currentNodes[currentNodeIndex];

    // --- Validation Droits (TODO: Check responsibleDomain from Workflow definition) ---
    // Pour l'instant on suppose que c'est bon si l'admin ou le user est là

    // 1. Marquer le noeud comme complété
    instance.currentNodes.splice(currentNodeIndex, 1); // Retirer des noeuds actifs

    // Mise à jour des variables
    if (data) {
      for (const [key, value] of Object.entries(data)) {
        instance.variables.set(key, value);
      }
    }

    // Ajout à l'historique d'exécution
    instance.executionPath.push({
      nodeId: nodeId,
      nodeType: 'action', // À récupérer du workflow si possible
      action: 'approved',
      performedBy: req.user.userId,
      comments: comments || '',
      timestamp: new Date(),
      outputData: data
    });

    instance.history.push({
      action: 'step_approved',
      title: `Étape validée`,
      performedBy: req.user.userId,
      comments: comments || `Action validée sur le noeud ${nodeId}`
    });

    // 2. Calculer les prochains noeuds (Transition)
    const workflow = await Workflow.findById(instance.workflowId);
    if (!workflow) throw new Error('Workflow definition not found');

    const outgoingEdges = workflow.edges.filter(edge => edge.source === nodeId);
    const nextNodes = [];

    // Logique de transition simple (supporte conditions basiques)
    for (const edge of outgoingEdges) {
      let conditionMet = true;

      // Vérification conditionnelle sommaire
      if (edge.data && edge.data.condition) {
        // Ex: edge.data.conditionValue === instance.variables.get('foo')
        // Pour l'instant on prend tout par défaut
        conditionMet = true;
      }

      if (conditionMet) {
        const targetNode = workflow.nodes.find(n => n.id === edge.target);
        if (targetNode) nextNodes.push(targetNode);
      }
    }

    let isFlowFinished = false;

    if (nextNodes.length === 0) {
      // Fin de branche
      if (instance.currentNodes.length === 0) {
        isFlowFinished = true;
      }
    } else {
      // Ajouter les prochains noeuds
      for (const node of nextNodes) {
        if (node.type === 'end') {
          isFlowFinished = true;
          // On ne l'ajoute pas aux currentNodes, on termine juste
        } else {
          instance.currentNodes.push({
            nodeId: node.id,
            status: 'in_progress',
            startedAt: new Date(),
            responsibleUser: null
          });
        }
      }
    }

    if (isFlowFinished) {
      instance.status = 'completed';
      instance.timeCompleted = new Date();
      instance.history.push({
        action: 'workflow_completed',
        title: 'Terminé',
        performedBy: req.user.userId,
        comments: 'Workflow terminé avec succès'
      });
    }

    await instance.save();

    res.json({
      success: true,
      message: 'Étape validée',
      data: instance
    });

  } catch (error) {
    console.error('❌ Erreur approveNode:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ============================================
// 5. REJETER UNE ÉTAPE
// ============================================
exports.rejectNode = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { nodeId, comments } = req.body;

    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');

    const instance = await WorkflowInstance.findById(instanceId);

    if (!instance) {
      return res.status(404).json({ success: false, message: 'Instance non trouvée' });
    }

    const currentNodeIndex = instance.currentNodes.findIndex(n => n.nodeId === nodeId && n.status === 'in_progress');

    if (currentNodeIndex === -1) {
      return res.status(400).json({ success: false, message: 'Ce noeud n\'est pas actif' });
    }

    // Marquer le noeud comme rejeté
    instance.currentNodes[currentNodeIndex].status = 'rejected';

    // Logique standard: rejet = fin du workflow (statut rejected)
    instance.status = 'rejected';
    instance.timeCompleted = new Date();

    instance.executionPath.push({
      nodeId: nodeId,
      nodeType: 'action',
      action: 'rejected',
      performedBy: req.user.userId,
      comments: comments || 'Rejeté',
      timestamp: new Date()
    });

    instance.history.push({
      action: 'step_rejected',
      title: 'Action rejetée',
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
    console.error('❌ Erreur rejectNode:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
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

    // Annuler tous les noeuds en cours
    instance.currentNodes.forEach(node => {
      node.status = 'completed'; // Ou une autre valeur, mais on vide la liste active
    });
    instance.currentNodes = [];

    instance.history.push({
      action: 'instance_cancelled',
      title: 'Annulation',
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
      title: 'Fichier ajouté',
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