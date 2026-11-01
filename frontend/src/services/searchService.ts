import api from './api';

export interface SearchParams {
  q?: string;
  query?: string;
  date_from?: string;
  date_to?: string;
  shift?: string;
  section?: string;
  category?: string;
  status?: string;
}

export interface SearchResultItem {
  id: number;
  report_id?: number;
  category:
    | 'work'
    | 'breakdown'
    | 'delay'
    | 'maintenance'
    | 'safety'
    | 'issue'
    | 'report'
    | 'attendance'
    | 'handover';
  title: string;
  description: string;
  section: string;
  date: string;
  shift?: string;
  status?: string;
  severity?: string;
  priority?: string;
}

type ApiRecord = Record<string, unknown>;

const getString = (record: ApiRecord, key: string): string =>
  typeof record[key] === 'string' ? record[key] as string : '';

const getOptionalString = (record: ApiRecord, key: string): string | undefined => {
  const value = getString(record, key);
  return value || undefined;
};

const mapSearchRecord = (category: SearchResultItem['category'], record: ApiRecord): SearchResultItem => {
  const id = typeof record.id === 'number' ? record.id : Number(record.id);
  const reportId = typeof record.report_id === 'number'
    ? record.report_id
    : category === 'report' ? id : undefined;
  const section = getString(record, 'section');
  const date = (
    getString(record, 'report_date') ||
    getString(record, 'date_reported') ||
    getString(record, 'reported_time') ||
    getString(record, 'created_at')
  ).slice(0, 10);
  const shift = getOptionalString(record, 'shift');
  const status = getOptionalString(record, 'status');
  const priority = getOptionalString(record, 'priority');
  const severity = getOptionalString(record, 'severity');
  let title = '';
  let description = '';

  switch (category) {
    case 'report':
      title = `Shift report #${id}`;
      description = getString(record, 'notes') || 'Shift report submitted.';
      break;
    case 'work':
      title = getString(record, 'description') || 'Work completed';
      description = getString(record, 'remarks') || title;
      break;
    case 'breakdown':
      title = `${getString(record, 'equipment_tag') || getString(record, 'equipment_name') || 'Equipment'} breakdown`;
      description = getString(record, 'fault_description');
      break;
    case 'delay':
      title = getString(record, 'affected_activity') || 'Production delay';
      description = [
        getString(record, 'reason'),
        record.duration_minutes ? `${record.duration_minutes} minutes` : '',
        getString(record, 'remarks'),
      ].filter(Boolean).join(' — ');
      break;
    case 'maintenance':
      title = getString(record, 'requirement') || 'Maintenance task';
      description = getString(record, 'remarks') || getString(record, 'equipment_name');
      break;
    case 'safety':
      title = getString(record, 'hazard_type') || 'Safety observation';
      description = getString(record, 'description');
      break;
    case 'issue':
      title = getString(record, 'description') || 'Operational issue';
      description = getString(record, 'assigned_to');
      break;
    case 'attendance':
      title = `Attendance — ${getString(record, 'section')}`;
      description = `${String(record.present ?? 0)} present of ${String(record.total_scheduled ?? 0)} scheduled; ${String(record.absent ?? 0)} absent.`;
      break;
    case 'handover':
      title = `Shift handover — ${getString(record, 'section')}`;
      description = [
        getString(record, 'pending_work'),
        getString(record, 'equipment_condition'),
        getString(record, 'unresolved_issues'),
        getString(record, 'instructions'),
      ].filter(Boolean).join(' — ');
      break;
  }

  return {
    id: Number.isFinite(id) ? id : 0,
    report_id: reportId,
    category,
    title,
    description,
    section,
    date,
    shift,
    status,
    priority,
    severity,
  };
};

export const searchService = {
  searchRecords: async (params: SearchParams): Promise<SearchResultItem[]> => {
    const response = await api.get('/search', { params });
    if (Array.isArray(response.data)) {
      return response.data;
    }
    const data = response.data as Record<string, unknown>;
    if (Array.isArray(data.results)) {
      return data.results as SearchResultItem[];
    }

    const groups: { key: string; category: SearchResultItem['category'] }[] = [
      { key: 'reports', category: 'report' },
      { key: 'breakdowns', category: 'breakdown' },
      { key: 'issues', category: 'issue' },
      { key: 'safety', category: 'safety' },
      { key: 'work_completed', category: 'work' },
      { key: 'production_delays', category: 'delay' },
      { key: 'maintenance', category: 'maintenance' },
      { key: 'handovers', category: 'handover' },
      { key: 'attendance', category: 'attendance' },
    ];

    return groups.flatMap(({ key, category }) => {
      const records = data[key];
      return Array.isArray(records)
        ? records.map((record) => mapSearchRecord(category, record as ApiRecord))
        : [];
    });
  },
};

export default searchService;
