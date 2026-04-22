const BaseStepHandler = require('./BaseStepHandler');

class AutoStepHandler extends BaseStepHandler {
    constructor(step, instance) {
        super(step, instance);
        this.actionRegistry = {
            'GENERATE_DOCUMENT': this._handleGenerateDocument.bind(this),
            'CALL_API': this._handleCallApi.bind(this),
            'TRANSFORM_DATA': this._handleTransformData.bind(this),
            'CREATE_RECORD': this._handleCreateRecord.bind(this),
            'SEND_WEBHOOK': this._handleSendWebhook.bind(this),
            'CLONE_DATA': this._handleCloneData.bind(this),
        };
    }

    async execute() {
        const config = this.step.config || this.step.data || {};
        const { actionType, actionParams } = config;

        if (!actionType) {
            console.error(`[AutoStepHandler] Action type is missing for step ${this.step.id}`);
            return {
                status: 'ERROR',
                reason: 'Missing action type',
                data: {}
            };
        }

        const actionFn = this.actionRegistry[actionType];
        if (!actionFn) {
            console.error(`[AutoStepHandler] Unsupported action type: ${actionType}`);
            return {
                status: 'ERROR',
                reason: `Unsupported action type: ${actionType}`,
                data: {}
            };
        }

        try {
            console.log(`[AutoStepHandler] Executing ${actionType} for step ${this.step.id}`);
            
            // Execute the action, passing global instance context
            const resultContextDelta = await actionFn(actionParams, this.instance.context);

            return {
                status: 'COMPLETED',
                reason: 'Auto action completed',
                data: resultContextDelta || {},
                nextSteps: this._resolveNextSteps() // From BaseStepHandler
            };
        } catch (error) {
            console.error(`[AutoStepHandler] Error executing ${actionType}:`, error);
            
            // If there's an onError path mapped in config, use it
            const errorNextStep = this.step.config?.onError ? [this.step.config.onError] : [];
            
            return {
                status: 'ERROR',
                reason: error.message,
                data: { error: error.message },
                nextSteps: errorNextStep
            };
        }
    }

    // --- Action Implementations ---
    
    async _handleGenerateDocument(params, context) {
        console.log(`Generating document with template...`);
        // e.g. await pdfService.generate(params.templateId, context);
        return { documentGenerated: true };
    }

    async _handleCallApi(params, context) {
        console.log(`Calling external API: ${params?.endpoint}...`);
        // Note: Make sure to sanitize and whitelist URLs for secure environments
        return { apiCalled: true };
    }

    async _handleTransformData(params, context) {
        console.log(`Transforming workflow data...`);
        return { dataTransformed: true };
    }

    async _handleCreateRecord(params, context) {
        console.log(`Creating database record for model ${params?.model}...`);
        return { recordId: 'auto_gen_id' };
    }

    async _handleSendWebhook(params, context) {
        console.log(`Triggering webhook ${params?.url}...`);
        return { webhookSent: true };
    }

    async _handleCloneData(params, context) {
        console.log(`Cloning database data...`);
        return { cloned: true };
    }
}

module.exports = AutoStepHandler;
