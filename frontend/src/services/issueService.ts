import api from './api';
import { Issue } from '../types';

export const issueService = {
  getIssues: async (filters?: { status?: string; section?: string }): Promise<Issue[]> => {
    const response = await api.get('/issues', { params: filters });
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.issues || [];
  },

  updateIssue: async (id: number, data: Partial<Issue>): Promise<Issue> => {
    const response = await api.put<Issue>(`/issues/${id}`, data);
    return response.data;
  },

  createIssue: async (data: Partial<Issue>): Promise<Issue> => {
    const response = await api.post<Issue>('/issues', data);
    return response.data;
  },
};

export default issueService;
