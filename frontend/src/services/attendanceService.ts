import api from './api';
import { Attendance } from '../types';

export interface AttendanceFilters {
  start_date?: string;
  end_date?: string;
  date?: string;
  shift?: string;
  section?: string;
}

export const attendanceService = {
  getAttendance: async (filters?: AttendanceFilters): Promise<Attendance[]> => {
    const response = await api.get('/attendance', { params: filters });
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.attendance || response.data.records || [];
  },

  createAttendance: async (data: Partial<Attendance>): Promise<Attendance> => {
    const response = await api.post<Attendance>('/attendance', data);
    return response.data;
  },

  updateAttendance: async (id: number, data: Partial<Attendance>): Promise<Attendance> => {
    const response = await api.put<Attendance>(`/attendance/${id}`, data);
    return response.data;
  },
};

export default attendanceService;
