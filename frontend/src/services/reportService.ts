import api from './api';
import { ShiftReport } from '../types';

export interface ReportFilters {
  date?: string;
  shift?: string;
  section?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export type ExtractedShiftReport = Omit<Partial<ShiftReport>, 'shift'> & {
  shift?: ShiftReport['shift'] | null;
  work_completed: NonNullable<ShiftReport['work_completed']>;
  equipment_breakdowns: Array<{
    equipment_name?: string;
    fault_description: string;
    location?: string | null;
  }>;
  production_delays: NonNullable<ShiftReport['production_delays']>;
  maintenance_items: Array<{
    equipment_name?: string;
    requirement: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    remarks?: string | null;
  }>;
  safety_observations: NonNullable<ShiftReport['safety_observations']>;
  issues: Array<{
    description: string;
    section?: string | null;
    assigned_to?: string | null;
  }>;
  handover?: ShiftReport['handover'] | null;
  attendance?: Omit<NonNullable<ShiftReport['attendance']>, 'id' | 'report_id' | 'report_date' | 'shift' | 'section'> | null;
};

export const reportService = {
  extractReport: async (file: File): Promise<ExtractedShiftReport> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<ExtractedShiftReport>('/reports/extract', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 180000,
    });
    return response.data;
  },

  getReports: async (filters?: ReportFilters): Promise<{ reports: ShiftReport[]; total?: number }> => {
    const response = await api.get('/reports', { params: filters });
    // Handle both array response or { reports: [...], total: ... } response format
    if (Array.isArray(response.data)) {
      return { reports: response.data, total: response.data.length };
    }
    return {
      reports: response.data.reports || response.data.items || [],
      total: response.data.total ?? (response.data.reports?.length || response.data.items?.length || 0),
    };
  },

  getReport: async (id: number): Promise<ShiftReport> => {
    const response = await api.get<ShiftReport>(`/reports/${id}`);
    return response.data;
  },

  createReport: async (data: Partial<ShiftReport>): Promise<ShiftReport> => {
    const response = await api.post<ShiftReport>('/reports', data);
    return response.data;
  },

  updateReport: async (id: number, data: Partial<ShiftReport>): Promise<ShiftReport> => {
    const response = await api.put<ShiftReport>(`/reports/${id}`, data);
    return response.data;
  },

  verifyReport: async (id: number): Promise<ShiftReport> => {
    const response = await api.put<ShiftReport>(`/reports/${id}/verify`);
    return response.data;
  },
};

export default reportService;
