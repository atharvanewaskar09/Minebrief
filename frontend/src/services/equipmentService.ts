import api from './api';
import { Equipment, EquipmentBreakdown, Maintenance } from '../types';

export interface EquipmentHistory {
  equipment: Equipment;
  breakdowns: EquipmentBreakdown[];
  maintenance: Maintenance[];
}

export const equipmentService = {
  getEquipment: async (filters?: { section?: string; status?: string }): Promise<Equipment[]> => {
    const response = await api.get('/equipment', { params: filters });
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.equipment || [];
  },

  createEquipment: async (data: Partial<Equipment>): Promise<Equipment> => {
    const response = await api.post<Equipment>('/equipment', data);
    return response.data;
  },

  updateEquipment: async (id: number, data: Partial<Equipment>): Promise<Equipment> => {
    const response = await api.put<Equipment>(`/equipment/${id}`, data);
    return response.data;
  },

  getEquipmentHistory: async (id: number): Promise<EquipmentHistory> => {
    const response = await api.get<EquipmentHistory>(`/equipment/${id}/history`);
    return response.data;
  },

  getMaintenance: async (filters?: { status?: string; priority?: string; equipment_id?: number }): Promise<Maintenance[]> => {
    const response = await api.get('/maintenance', { params: filters });
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.maintenance || [];
  },

  updateMaintenance: async (id: number, data: Partial<Maintenance>): Promise<Maintenance> => {
    const response = await api.put<Maintenance>(`/maintenance/${id}`, data);
    return response.data;
  },

  getBreakdowns: async (filters?: { status?: string; equipment_id?: number }): Promise<EquipmentBreakdown[]> => {
    const response = await api.get('/search', {
      params: { ...filters, category: 'breakdowns' },
    });
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.breakdowns || [];
  },
};

export default equipmentService;
