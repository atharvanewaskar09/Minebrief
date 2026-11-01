import api from './api';
import { Activity, DashboardSummary, PendingAction } from '../types';

interface DashboardApiActivity extends Partial<Activity> {
  title?: string;
  timestamp?: string;
}

interface DashboardApiAction extends Partial<PendingAction> {
  action_type?: PendingAction['type'];
  title?: string;
  created_at?: string;
}

interface DashboardApiResponse extends Omit<
  DashboardSummary,
  'recent_activities' | 'pending_actions' | 'attendance_trend' | 'report_trend'
> {
  recent_activities: DashboardApiActivity[];
  pending_actions: DashboardApiAction[];
  attendance_trend: (DashboardSummary['attendance_trend'][number] & {
    present?: number;
    total_scheduled?: number;
  })[];
  report_trend: (DashboardSummary['report_trend'][number] & { count?: number })[];
}

const formatStatus = (status: string): string =>
  status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export const dashboardService = {
  getDashboardSummary: async (period?: string, start?: string, end?: string): Promise<DashboardSummary> => {
    const params: Record<string, string> = {};
    if (period) params.period = period;
    if (start) params.start_date = start;
    if (end) params.end_date = end;

    const response = await api.get<DashboardApiResponse>('/dashboard/summary', { params });
    const data = response.data;

    return {
      ...data,
      recent_activities: data.recent_activities.map((activity, index): Activity => ({
        id: activity.id ?? index,
        type: activity.title || activity.type || 'Operational activity',
        description: activity.description || '',
        section: activity.section || '',
        date: activity.date || activity.timestamp?.slice(0, 10) || '',
        shift: activity.shift || '',
      })),
      pending_actions: data.pending_actions.map((action): PendingAction => ({
        id: action.id ?? 0,
        type: action.action_type || action.type || 'issue',
        description: action.description || action.title || '',
        section: action.section || action.title || '',
        priority: action.priority,
        status: action.status || 'open',
        date: action.date || action.created_at?.slice(0, 10) || '',
      })),
      attendance_trend: data.attendance_trend.map((point) => ({
        date: point.date,
        value: point.present ?? point.value,
      })),
      report_trend: data.report_trend.map((point) => ({
        date: point.date,
        value: point.count ?? point.value,
      })),
      maintenance_status: data.maintenance_status.map((item) => ({
        ...item,
        status: formatStatus(item.status),
      })),
    };
  },
};

export default dashboardService;
