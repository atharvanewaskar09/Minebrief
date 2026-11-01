import api from './api';

export const demoService = {
  resetDemo: async (): Promise<{ message: string; success: boolean }> => {
    const response = await api.post('/demo/reset');
    return response.data;
  },
};

export default demoService;
