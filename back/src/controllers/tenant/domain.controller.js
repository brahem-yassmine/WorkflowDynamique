// back/src/controllers/tenant/domain.controller.js

class DomainController {
    static getModel(req) {
        if (!req.tenantConn) {
            throw new Error('Tenant connection not available');
        }
        return req.tenantConn.model('Domain');
    }

    // Create a domain
    static async create(req, res) {
        console.log('📝 DomainController.create - Body:', req.body);
        try {
            const Domain = DomainController.getModel(req);
            const domain = new Domain(req.body);
            console.log('💾 Attempting to save domain...');
            await domain.save();
            console.log('✅ Domain saved successfully');
            res.status(201).json({ success: true, data: domain });
        } catch (error) {
            console.error('❌ DomainController.create Error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }

    // Get all
    static async getAll(req, res) {
        try {
            const Domain = DomainController.getModel(req);
            const domains = await Domain.find().sort({ name: 1 });
            console.log(`🔍 Found ${domains.length} domains for tenant:`, domains.map(d => d.name));
            res.json({ success: true, data: domains });
        } catch (error) {
            console.error('❌ DomainController.getAll Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Get active domains
    static async getActive(req, res) {
        try {
            const Domain = DomainController.getModel(req);
            const domains = await Domain.find({ isActive: true }).sort({ name: 1 });
            res.json({ success: true, data: domains });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Get domain by ID
    static async getById(req, res) {
        try {
            const Domain = DomainController.getModel(req);
            const domain = await Domain.findById(req.params.id);
            if (!domain) {
                return res.status(404).json({ success: false, message: 'Domain not found' });
            }
            res.json({ success: true, data: domain });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Update
    static async update(req, res) {
        try {
            const Domain = DomainController.getModel(req);
            const domain = await Domain.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!domain) {
                return res.status(404).json({ success: false, message: 'Domain not found' });
            }
            res.json({ success: true, data: domain });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    // Delete
    static async delete(req, res) {
        try {
            const Domain = DomainController.getModel(req);
            const domain = await Domain.findByIdAndDelete(req.params.id);
            if (!domain) {
                return res.status(404).json({ success: false, message: 'Domain not found' });
            }
            res.json({ success: true, message: 'Domain deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = DomainController;
