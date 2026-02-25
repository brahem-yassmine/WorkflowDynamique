// front/app/services/taskService.ts
import { api } from './api';

export interface Task {
    _id: string;
    title: string;
    description?: string;
    status: 'backlog' | 'up-next' | 'doing' | 'done';
    position: number;
    dueDate?: string;
    assignedTo?: string;
    createdAt: string;
    updatedAt: string;
}

export const taskService = {
    getTasks: async () => {
        const response = await api.get('/api/tasks');
        return response.data.data as Task[];
    },

    createTask: async (taskData: Partial<Task>) => {
        const response = await api.post('/api/tasks', taskData);
        return response.data.data as Task;
    },

    updateTask: async (id: string, taskData: Partial<Task>) => {
        const response = await api.put(`/api/tasks/${id}`, taskData);
        return response.data.data as Task;
    },

    deleteTask: async (id: string) => {
        const response = await api.delete(`/api/tasks/${id}`);
        return response.data;
    },

    updatePositions: async (tasks: { id: string; status: string; position: number }[]) => {
        const response = await api.post('/api/tasks/bulk-update', { tasks });
        return response.data;
    }
};
