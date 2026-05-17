const BaseStepHandler = require('./BaseStepHandler');

class NotificationStepHandler extends BaseStepHandler {

    async onActivate() {
        const result = await this.execute();
        return {
            autoProgress: true,
            nextAction: result.status === 'ERROR' ? 'ERROR' : 'COMPLETED',
            contextUpdate: result.data || {}
        };
    }

    async execute() {
        const stepData = this.step.data || {};
        const config = this.step.config || stepData.config || stepData;
        const channel = config.channel || 'IN_APP';
        const recipientConfig = config.recipientConfig || config.recipients;
        const messageTemplate = config.messageTemplate || config.message;
        const titleTemplate = config.titleTemplate || config.title;

        console.log(`[NotificationStepHandler] Executing for step: ${this.step.id} (${this.step.type})`);
        console.log(`[NotificationStepHandler] Resolved Config:`, JSON.stringify({ channel, recipientConfig, hasTemplate: !!messageTemplate }));

        if (!channel || !recipientConfig || !messageTemplate) {
            console.warn(`[NotificationStepHandler] Missing configuration for step ${this.step.id}. Skipping.`);
            return {
                status: 'COMPLETED',
                reason: 'Skipped - Missing configuration',
                data: { skipped: true }
            };
        }

        try {
            // 1. Resolve Dynamic Variables in Context
            const parsedMessage = this._injectVariables(messageTemplate, this.instance.context);
            const parsedTitle = titleTemplate ? this._injectVariables(titleTemplate, this.instance.context) : 'Notification';
            
            console.log(`[NotificationStepHandler] Parsed Message: "${parsedMessage.substring(0, 50)}..."`);

            // 2. Resolve Recipients
            const resolvedUserIds = await this._resolveRecipientIds(recipientConfig, this.instance.context);
            
            console.log(`[NotificationStepHandler] Resolved Recipients:`, resolvedUserIds);

            if (resolvedUserIds.length === 0) {
                console.warn(`[NotificationStepHandler] No recipients resolved for step ${this.step.id}`);
            } else {
                // 3. Dispatch to Channel
                await this._dispatchMessage(channel, resolvedUserIds, parsedTitle, parsedMessage);
            }

            return {
                status: 'COMPLETED',
                reason: 'Notification Processed',
                data: {
                    recipientsCount: resolvedUserIds.length,
                    channel
                }
            };

        } catch (error) {
            console.error(`[NotificationStepHandler] FATAL ERROR:`, error);
            
            return {
                status: 'COMPLETED', // Still mark completed to not block flow
                reason: 'Notification Failed',
                data: { error: error.message }
            };
        }
    }

    /**
     * Simple templating engine to replace {{variable}} with context values.
     * Supports {{variable}} for context and {{instance.field}} for instance data.
     */
    _injectVariables(templateString, context) {
        if (!templateString) return '';
        return templateString.replace(/\{\{(.+?)\}\}/g, (match, expression) => {
            const path = expression.trim();
            let val;
            
            if (path.startsWith('instance.')) {
                val = this._resolvePath(this.instance, path.substring(9));
            } else {
                val = this._resolvePath(context, path);
            }
            
            if (val === undefined || val === null) {
                console.log(`[NotificationStepHandler] Template variable unresolved: ${path}`);
                return match;
            }
            return typeof val !== 'object' ? String(val) : JSON.stringify(val);
        });
    }

    /**
     * Resolves the target IDs (Users).
     */
    async _resolveRecipientIds(recipientConfig, context) {
        const { targetType, values, logic } = recipientConfig;
        // Use instance.db to ensure we get the model from the correct tenant connection
        const User = this.instance.db.model('User');
        
        console.log(`[NotificationStepHandler] Resolving recipients for type: ${targetType} | Logic: ${logic}`);

        switch (targetType) {
            case 'USER':
                return values || [];
            case 'ROLE':
                if (!values || values.length === 0) return [];
                return await User.find({ 
                    $or: [
                        { role: { $in: values } },
                        { specificRole: { $in: values } },
                        { specificRoleId: { $in: values } }
                    ]
                }).distinct('_id');
            case 'ALL':
                return await User.find({ status: 'active' }).distinct('_id');
            case 'DYNAMIC':
                if (logic === 'createdBy' || logic === 'initiator') {
                    console.log(`[NotificationStepHandler] Dynamic logic matched 'createdBy': ${this.instance.createdBy}`);
                    return [this.instance.createdBy];
                }
                if (logic) {
                    const dynamicId = this._resolvePath(context, logic);
                    console.log(`[NotificationStepHandler] Dynamic logic path '${logic}' resolved to:`, dynamicId);
                    return Array.isArray(dynamicId) ? dynamicId : (dynamicId ? [dynamicId] : []);
                }
                return [];
            default:
                console.warn(`[NotificationStepHandler] Unknown targetType: ${targetType}`);
                return [];
        }
    }

    /**
     * Helper to read nested paths "a.b.c"
     */
    _resolvePath(obj, path) {
        if (!obj || !path) return undefined;
        try {
            return path.split('.').reduce((acc, part) => acc && acc[part], obj);
        } catch (e) {
            return undefined;
        }
    }

    /**
     * Dispatches the actual message and saves to database.
     */
    async _dispatchMessage(channel, userIds, title, message) {
        if (!userIds || userIds.length === 0) return;

        console.log(`[NotificationStepHandler] Dispatching to ${userIds.length} users via ${channel}`);

        const notifications = userIds.map(userId => ({
            recipient: String(userId), // Force string conversion for safety
            title,
            message,
            type: 'system',
            read: false,
            link: `/Workflows/instances/${this.instance._id}`
        }));

        try {
            const Notification = this.instance.db.model('Notification');
            const result = await Notification.insertMany(notifications);
            console.log(`[NotificationStepHandler] Successfully saved ${result.length} notifications to DB`);
        } catch (err) {
            console.error('[NotificationStepHandler] Error saving notifications:', err);
            throw err; // Re-throw to be caught by execute()
        }

        if (channel === 'EMAIL') {
            console.log(`[NotificationSystem] >> (SIMULATED) Sending EMAIL...`);
        }
    }
}

module.exports = NotificationStepHandler;
