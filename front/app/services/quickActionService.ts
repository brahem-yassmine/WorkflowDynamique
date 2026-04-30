// front/app/services/quickActionService.ts
import { api } from './api';

export const getQuickActions = async () => {
    const response = await api.get('/quick-actions');
    return response.data;
};

export const executeQuickAction = async (actionId: string, formData: any) => {
    const response = await api.post('/quick-actions', { actionId, formData });
    return response.data;
};
