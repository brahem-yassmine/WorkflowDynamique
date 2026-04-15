// front/src/service/quick-action.service.ts
import { api } from '../../app/services/api';

export const getQuickActions = async () => {
    const response = await api.get('/api/quick-actions');
    return response.data;
};

export const executeQuickAction = async (actionId: string, formData: any) => {
    const response = await api.post('/api/quick-actions', { actionId, formData });
    return response.data;
};
