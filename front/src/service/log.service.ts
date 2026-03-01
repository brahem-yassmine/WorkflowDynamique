import axios from 'axios';
import { ILog, LogFilters, LogsResponse, LogStats } from '@/types/log.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

class LogService {
  private baseUrl = `${API_URL}/admin/logs`;

  async getLogs(
    filters: Partial<LogFilters> = {},
    page: number = 1,
    limit: number = 50
  ): Promise<LogsResponse> {
    try {
      const params = new URLSearchParams();

      params.append('page', page.toString());
      params.append('limit', limit.toString());

      // Ajouter les filtres non vides
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'startDate' || key === 'endDate') {
            if (value instanceof Date) {
              params.append(key, value.toISOString());
            }
          } else {
            params.append(key, String(value));
          }
        }
      });

      const response = await axios.get<LogsResponse>(`${this.baseUrl}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des logs:', error);
      throw error;
    }
  }

  async getLogById(id: string): Promise<ILog> {
    try {
      const response = await axios.get<{ success: boolean; data: ILog }>(`${this.baseUrl}/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du log ${id}:`, error);
      throw error;
    }
  }

  async getLogStats(startDate?: Date, endDate?: Date): Promise<LogStats> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await axios.get<{ success: boolean; data: LogStats }>(
        `${this.baseUrl}/stats?${params.toString()}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  async exportLogs(filters: Partial<LogFilters> = {}): Promise<Blob> {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'startDate' || key === 'endDate') {
            if (value instanceof Date) {
              params.append(key, value.toISOString());
            }
          } else {
            params.append(key, String(value));
          }
        }
      });

      const response = await axios.get(`${this.baseUrl}/export?${params.toString()}`, {
        responseType: 'blob'
      });

      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'export des logs:', error);
      throw error;
    }
  }

  async cleanOldLogs(days: number = 90): Promise<{ deletedCount: number }> {
    try {
      const response = await axios.delete<{ success: boolean; data: { deletedCount: number } }>(
        `${this.baseUrl}/clean`,
        { data: { days } }
      );
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors du nettoyage des logs:', error);
      throw error;
    }
  }
}

export const logService = new LogService();
