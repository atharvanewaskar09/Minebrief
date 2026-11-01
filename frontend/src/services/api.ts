import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined' && window.localStorage.getItem('minebrief_demo') === 'true') {
    config.headers.set('X-Minebrief-Demo', 'true');
    config.headers.delete('Authorization');
    return config;
  }

  if (supabase) {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session?.access_token) {
      config.headers.set('Authorization', `Bearer ${data.session.access_token}`);
    } else {
      config.headers.delete('Authorization');
    }
  }
  return config;
});

// Response interceptor for unwrapping standard { success: true, data: ... } envelope and error handling
api.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === 'object' &&
      'success' in response.data &&
      'data' in response.data &&
      response.data.success === true
    ) {
      return {
        ...response,
        data: response.data.data,
      };
    }
    return response;
  },
  async (error) => {
    const customError = {
      message: error.response?.data?.error || error.response?.data?.message || error.message || 'An unexpected error occurred',
      status: error.response?.status,
      data: error.response?.data,
    };
    return Promise.reject(customError);
  }
);

export default api;
