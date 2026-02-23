// back/src/controllers/tenant/domain.controller.js

class DomainController {
    static getModel(req) {
        if (!req.tenantConn) {
            throw new Error('Connexion tenant non disponible');
        }
        return req.tenantConn.model('Domain');
    }

    // Créer un domaine
    static async create(req, res) {
        console.log('📝 DomainController.create - Body:', req.body);
        try {
            const Domain = DomainController.getModel(req);
            const domain = new Domain(req.body);
            console.log('💾 Tentative de sauvegarde du domaine...');
            await domain.save();
            console.log('✅ Domaine sauvegardé avec succès');
            res.status(201).json({ success: true, data: domain });
        } catch (error) {
            console.error('❌ Erreur DomainController.create:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }

    // Tout récupérer
    static async getAll(req, res) {
        try {
            const Domain = DomainController.getModel(req);
            const domains = await Domain.find().sort({ name: 1 });
            res.json({ success: true, data: domains });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Récupérer les domaines actifs
    static async getActive(req, res) {
        try {
            const Domain = DomainController.getModel(req);
            const domains = await Domain.find({ isActive: true }).sort({ name: 1 });
            res.json({ success: true, data: domains });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Récupérer un domaine par ID
    static async getById(req, res) {
        try {
            const Domain = DomainController.getModel(req);
            const domain = await Domain.findById(req.params.id);
            if (!domain) {
                return res.status(404).json({ success: false, message: 'Domaine non trouvé' });
            }
            res.json({ success: true, data: domain });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Mettre à jour
    static async update(req, res) {
        try {
            const Domain = DomainController.getModel(req);
            const domain = await Domain.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!domain) {
                return res.status(404).json({ success: false, message: 'Domaine non trouvé' });
            }
            res.json({ success: true, data: domain });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    // Supprimer
    static async delete(req, res) {
        try {
            const Domain = DomainController.getModel(req);
            const domain = await Domain.findByIdAndDelete(req.params.id);
            if (!domain) {
                return res.status(404).json({ success: false, message: 'Domaine non trouvé' });
            }
            res.json({ success: true, message: 'Domaine supprimé avec succès' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = DomainController;
