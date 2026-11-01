export interface User {
  id: number;
  supabase_user_id?: string;
  workspace_id?: number;
  name: string;
  email: string;
  role: 'operator' | 'supervisor' | 'manager' | 'admin';
}

export interface Workspace {
  id: number;
  name: string;
  location: string;
  is_demo: boolean;
}

export interface ShiftReport {
  id: number;
  workspace_id?: number;
  report_date: string;
  shift: 'Morning' | 'Afternoon' | 'Night';
  section: string;
  submitted_by: string;
  status: 'draft' | 'submitted' | 'verified';
  verified_by?: string;
  verified_at?: string;
  notes?: string;
  created_at?: string;
  // Nested when fetching detail
  attendance?: Attendance;
  work_completed?: WorkCompleted[];
  equipment_breakdowns?: EquipmentBreakdown[];
  production_delays?: ProductionDelay[];
  safety_observations?: SafetyObservation[];
  maintenance_items?: Maintenance[];
  handover?: Handover;
  issues?: Issue[];
  attachments?: Attachment[];
}

export interface Attendance {
  id?: number;
  report_id?: number;
  report_date: string;
  shift: string;
  section: string;
  total_scheduled: number;
  present: number;
  absent: number;
  remarks?: string;
  confirmed_by?: string;
}

export interface Equipment {
  id: number;
  name: string;
  equipment_id_tag?: string;
  section: string;
  description?: string;
  status: 'operational' | 'under_maintenance' | 'out_of_service';
}

export interface EquipmentBreakdown {
  id?: number;
  equipment_id: number;
  equipment_name?: string;
  report_id?: number;
  fault_description: string;
  location: string;
  reported_time?: string;
  shift?: string;
  status: 'open' | 'under_review' | 'in_progress' | 'resolved';
  created_at?: string;
}

export interface Maintenance {
  id?: number;
  breakdown_id?: number;
  equipment_id: number;
  equipment_name?: string;
  requirement: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'under_review' | 'in_progress' | 'resolved';
  remarks?: string;
}

export interface Attachment {
  id: number;
  report_id: number;
  original_name: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  file_path?: string;
}

export interface Handover {
  id?: number;
  report_id?: number;
  pending_work: string;
  equipment_condition: string;
  unresolved_issues: string;
  instructions: string;
}

export interface Issue {
  id?: number;
  report_id?: number;
  description: string;
  section: string;
  status: 'open' | 'under_review' | 'in_progress' | 'resolved';
  date_reported: string;
  assigned_to?: string;
}

export interface WorkCompleted {
  id?: number;
  description: string;
  remarks?: string;
}

export interface ProductionDelay {
  id?: number;
  affected_activity: string;
  duration_minutes?: number;
  reason: string;
  remarks?: string;
}

export interface SafetyObservation {
  id?: number;
  hazard_type: string;
  location: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface DashboardSummary {
  total_reports: number;
  reports_today: number;
  pending_verification: number;
  workers_present: number;
  workers_absent: number;
  equipment_breakdowns: number;
  pending_maintenance: number;
  unresolved_issues: number;
  recent_reports: ShiftReport[];
  recent_activities: Activity[];
  pending_actions: PendingAction[];
  attendance_trend: TrendPoint[];
  report_trend: TrendPoint[];
  breakdown_frequency: { name: string; count: number }[];
  maintenance_status: { status: string; count: number }[];
}

export interface Activity {
  id: number;
  type: string;
  description: string;
  section: string;
  date: string;
  shift: string;
}

export interface PendingAction {
  id: number;
  type: 'issue' | 'maintenance';
  description: string;
  section: string;
  priority?: string;
  status: string;
  date: string;
}

export interface TrendPoint {
  date: string;
  value: number;
}
