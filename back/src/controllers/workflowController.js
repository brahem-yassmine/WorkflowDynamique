// back/src/controllers/workflowController.js
const Workflow = require('../models/tenant/Workflow.js');

// ============================================
// 1. LISTER TOUS LES WORKFLOWS
// ============================================
exports.getWorkflows = async (req, res) => {
  try {
    const { domain, status } = req.query;

    // ✅ Récupérer le modèle Workflow depuis la connexion du tenant
    const Workflow = req.tenantConn.model('Workflow');

    // ❌ SUPPRIMER tenantId de la requête
    const query = {};

    // Filtrage par domaine pour les users normaux
    if (req.user.role === 'user') {
      query.domain = req.user.domain;
    } else if (domain) {
      query.domain = domain;
    }

    if (status) {
      query.status = status;
    }

    const workflows = await Workflow.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: workflows.length,
      data: workflows
    });

  } catch (error) {
    console.error('❌ Erreur getWorkflows:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ============================================
// 2. RÉCUPÉRER UN WORKFLOW PAR ID
// ============================================
exports.getWorkflowById = async (req, res) => {
  try {
    const { workflowId } = req.params;

    const Workflow = req.tenantConn.model('Workflow');

    // ❌ SUPPRIMER tenantId du filtre
    const workflow = await Workflow.findById(workflowId);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow non trouvé'
      });
    }

    res.json({
      success: true,
      data: workflow
    });

  } catch (error) {
    console.error('❌ Erreur getWorkflowById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ============================================
// 3. CRÉER UN NOUVEAU WORKFLOW
// ============================================
exports.createWorkflow = async (req, res) => {
  try {
    const { name, description, domain, nodes, edges } = req.body;

    const Workflow = req.tenantConn.model('Workflow');

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Le nom est requis'
      });
    }

    const workflowDomain = domain || req.user.domain;

    let workflowNodes = nodes || [];
    let workflowEdges = edges || [];

    // Default Graph if empty
    if (workflowNodes.length === 0) {
      const startId = 'node_start_' + Date.now();
      const endId = 'node_end_' + Date.now();

      workflowNodes = [
        {
          id: startId,
          type: 'start',
          position: { x: 100, y: 100 },
          data: { label: 'Début' }
        },
        {
          id: endId,
          type: 'end',
          position: { x: 100, y: 300 },
          data: { label: 'Fin' }
        }
      ];

      workflowEdges = [
        {
          id: 'edge_' + Date.now(),
          source: startId,
          target: endId,
          type: 'default'
        }
      ];
    }

    // ✅ AJOUTER createdBy (utilisateur qui crée le template)
    const workflow = new Workflow({
      name,
      description: description || '',
      domain: workflowDomain,
      nodes: workflowNodes,
      edges: workflowEdges,
      status: 'draft',
      createdBy: req.user.id
    });

    await workflow.save();

    res.status(201).json({
      success: true,
      message: 'Workflow créé avec succès',
      data: workflow
    });

  } catch (error) {
    console.error('❌ Erreur createWorkflow:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// ============================================
// 4. METTRE À JOUR UN WORKFLOW
// ============================================
exports.updateWorkflow = async (req, res) => {
  try {
    const { workflowId } = req.params;
    const updates = req.body;

    const Workflow = req.tenantConn.model('Workflow');

    const workflow = await Workflow.findById(workflowId);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow non trouvé'
      });
    }

    // Validation implicite par Mongoose pour nodes/edges si fournis
    if (updates.nodes) workflow.nodes = updates.nodes;
    if (updates.edges) workflow.edges = updates.edges;

    // ❌ SUPPRIMER la protection tenantId (plus nécessaire)
    Object.keys(updates).forEach(key => {
      if (key !== '_id') {
        workflow[key] = updates[key];
      }
    });

    await workflow.save();

    res.json({
      success: true,
      message: 'Workflow mis à jour',
      data: workflow
    });

  } catch (error) {
    console.error('❌ Erreur updateWorkflow:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ============================================
// 5. SUPPRIMER UN WORKFLOW
// ============================================
exports.deleteWorkflow = async (req, res) => {
  try {
    const { workflowId } = req.params;

    const Workflow = req.tenantConn.model('Workflow');
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');

    // Vérifier s'il y a des instances liées
    const instancesCount = await WorkflowInstance.countDocuments({ workflowId });

    if (instancesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer : ${instancesCount} instance(s) existent. Archivez d'abord.`
      });
    }

    const workflow = await Workflow.findByIdAndDelete(workflowId);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Workflow supprimé avec succès',
      data: { id: workflowId }
    });

  } catch (error) {
    console.error('❌ Erreur deleteWorkflow:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ============================================
// 6. EXÉCUTER UN WORKFLOW (CRÉER UNE INSTANCE)
// ============================================
exports.executeWorkflow = async (req, res) => {
  try {
    const { workflowId } = req.params;

    const Workflow = req.tenantConn.model('Workflow');
    const WorkflowInstance = req.tenantConn.model('WorkflowInstance');

    const workflow = await Workflow.findById(workflowId);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow non trouvé'
      });
    }

    if (workflow.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Le workflow doit être actif pour être exécuté'
      });
    }

    // ✅ INITIALISATION GRAPH
    // Trouver le noeud de départ (type: 'start')
    const startNode = workflow.nodes.find(n => n.type === 'start');

    if (!startNode) {
      return res.status(400).json({
        success: false,
        message: 'Le workflow n\'a pas de noeud de départ (type: start)'
      });
    }

    const instance = new WorkflowInstance({
      workflowId: workflow._id,
      createdBy: req.user.id,
      title: req.body.title || `Instance de ${workflow.name}`,
      description: req.body.description || workflow.description, // Ajout description

      // Initialisation du graph
      currentNodes: [{
        nodeId: startNode.id,
        status: 'in_progress',
        startedAt: new Date(),
        responsibleUser: null // Pourrait être défini dans startNode.data si nécessaire
      }],

      variables: req.body.data || {}, // Variables initiales

      executionPath: [{
        nodeId: startNode.id,
        nodeType: 'start',
        action: 'start',
        performedBy: req.user.id,
        comments: 'Workflow démarré',
        timestamp: new Date()
      }],

      status: 'in_progress',
      priority: req.body.priority || 'medium',
      dueDate: req.body.dueDate || null,
      timeStarted: new Date(),

      history: [{ // Legacy history
        action: 'instance_created',
        title: 'Démarrage',
        performedBy: req.user.id,
        comments: 'Instance créée'
      }]
    });

    await instance.save();

    res.status(201).json({
      success: true,
      message: 'Workflow exécuté avec succès',
      data: {
        workflowId: workflow._id,
        instanceId: instance._id,
        status: instance.status,
        startedAt: instance.timeStarted,
        currentNodes: instance.currentNodes
      }
    });

  } catch (error) {
    console.error('❌ Erreur executeWorkflow:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ============================================
// 7. CHANGER LE STATUT D'UN WORKFLOW
// ============================================
exports.changeWorkflowStatus = async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { status } = req.body;

    const Workflow = req.tenantConn.model('Workflow');

    if (!status || !['draft', 'active', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide. Valeurs acceptées: draft, active, archived'
      });
    }

    const workflow = await Workflow.findById(workflowId);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow non trouvé'
      });
    }

    workflow.status = status;
    await workflow.save();

    res.json({
      success: true,
      message: `Statut du workflow changé à "${status}"`,
      data: workflow
    });

  } catch (error) {
    console.error('❌ Erreur changeWorkflowStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ============================================
// 8. DUPLIQUER UN WORKFLOW
// ============================================
exports.duplicateWorkflow = async (req, res) => {
  try {
    const { workflowId } = req.params;

    const Workflow = req.tenantConn.model('Workflow');

    const original = await Workflow.findById(workflowId);

    if (!original) {
      return res.status(404).json({
        success: false,
        message: 'Workflow non trouvé'
      });
    }

    // Créer une copie
    const duplicate = new Workflow({
      name: `${original.name} (copie)`,
      description: original.description,
      domain: original.domain,
      nodes: original.nodes.map(node => ({ ...node })), // Deep copy basique
      edges: original.edges.map(edge => ({ ...edge })), // Deep copy basique
      status: 'draft',
      createdBy: req.user.id
    });

    await duplicate.save();

    res.status(201).json({
      success: true,
      message: 'Workflow dupliqué avec succès',
      data: duplicate
    });

  } catch (error) {
    console.error('❌ Erreur duplicateWorkflow:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};
