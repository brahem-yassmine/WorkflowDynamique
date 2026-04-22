const BaseStepHandler = require('./BaseStepHandler');

class NotificationStepHandler extends BaseStepHandler {

    async execute() {
        const config = this.step.config || this.step.data || {};
        const { channel, recipientConfig, messageTemplate, titleTemplate } = config;

        if (!channel || !recipientConfig || !messageTemplate) {
            console.warn(`[NotificationStepHandler] Missing configuration for step ${this.step.id}. Skipping.`);
            return {
                status: 'COMPLETED',
                reason: 'Skipped - Missing configuration',
                data: { skipped: true },
                nextSteps: this._resolveNextSteps()
            };
        }

        try {
            // 1. Resolve Dynamic Variables in Context
            const parsedMessage = this._injectVariables(messageTemplate, this.instance.context);
            const parsedTitle = titleTemplate ? this._injectVariables(titleTemplate, this.instance.context) : 'Notification';

            // 2. Resolve Recipients
            const resolvedUserIds = await this._resolveRecipientIds(recipientConfig, this.instance.context);

            if (resolvedUserIds.length === 0) {
                console.warn(`[NotificationStepHandler] No recipients resolved for step ${this.step.id}`);
            }

            // 3. Dispatch to Channel
            await this._dispatchMessage(channel, resolvedUserIds, parsedTitle, parsedMessage);

            return {
                status: 'COMPLETED',
                reason: 'Notification Sent',
                data: {
                    recipientsCount: resolvedUserIds.length,
                    channel
                },
                nextSteps: this._resolveNextSteps()
            };

        } catch (error) {
            console.error(`[NotificationStepHandler] Failed to dispatch notification:`, error);
            
            // Notifications should generally fail silently to prevent workflow halts,
            // unless strict error handling is configured.
            const nextSteps = (this.step.config?.onError || this.step.data?.onError) ? [this.step.config?.onError || this.step.data?.onError] : this._resolveNextSteps();
            return {
                status: 'COMPLETED', // Still mark completed to not block flow
                reason: 'Notification Failed',
                data: { error: error.message },
                nextSteps
            };
        }
    }

    /**
     * Simple templating engine to replace {{variable}} with context values.
     */
    _injectVariables(templateString, context) {
        if (!templateString) return '';
        return templateString.replace(/\{\{(.+?)\}\}/g, (match, expression) => {
            const keys = expression.trim().split('.');
            let val = context;
            for (const key of keys) {
                if (val && typeof val === 'object' && key in val) {
                    val = val[key];
                } else {
                    return match; // Return unresolved variable pattern
                }
            }
            return typeof val !== 'object' ? String(val) : JSON.stringify(val);
        });
    }

    /**
     * Resolves the target IDs (Users).
     */
    async _resolveRecipientIds(recipientConfig, context) {
        const { targetType, values, logic } = recipientConfig;
        
        switch (targetType) {
            case 'USER':
                return values || [];
            case 'ROLE':
                console.log(`[NotificationStepHandler] Looking up users with roles:`, values);
                // e.g. await User.find({ roles: { $in: values } }).distinct('_id');
                return ['mock_user_from_role'];
            case 'ALL':
                // return await User.find({}).distinct('_id');
                return ['mock_all_users'];
            case 'DYNAMIC':
                if (logic) {
                    const dynamicId = this._resolvePath(context, logic);
                    // Could be an array of IDs or single string
                    return Array.isArray(dynamicId) ? dynamicId : (dynamicId ? [dynamicId] : []);
                }
                return [];
            default:
                return [];
        }
    }

    /**
     * Helper to read nested paths "a.b.c"
     */
    _resolvePath(obj, path) {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }

    /**
     * Simulates sending the actual message payload.
     */
    async _dispatchMessage(channel, userIds, title, message) {
        if (!userIds || userIds.length === 0) return;

        if (channel === 'EMAIL') {
            console.log(`[NotificationSystem] >> Sending EMAIL to ${userIds.length} users. Title: "${title}"`);
            console.log(`[NotificationSystem] Payload: ${message}`);
        } else if (channel === 'IN_APP') {
            console.log(`[NotificationSystem] >> Pushing IN_APP notification to ${userIds.length} users. Title: "${title}"`);
            console.log(`[NotificationSystem] Payload: ${message}`);
        }
    }
}

module.exports = NotificationStepHandler;
