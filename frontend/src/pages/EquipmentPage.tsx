import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  AlertTriangle,
  Layers,
  Clock,
  CheckCircle,
  X,
  History,
  FileText,
  ChevronRight,
  Filter,
  Plus,
} from 'lucide-react';
import DataTable, { Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import equipmentService, { EquipmentHistory } from '../services/equipmentService';
import { Equipment, EquipmentBreakdown, Maintenance } from '../types';

export const EquipmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'registry' | 'issues'>('registry');

  // Registry state
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Equipment | null>(null);
  const [assetHistory, setAssetHistory] = useState<EquipmentHistory | null>(null);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Active issues state
  const [breakdowns, setBreakdowns] = useState<EquipmentBreakdown[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddingEquipment, setIsAddingEquipment] = useState<boolean>(false);
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    equipment_id_tag: '',
    section: 'Open Cast Block A',
    description: '',
    status: 'operational' as Equipment['status'],
  });
  const [addError, setAddError] = useState<string | null>(null);
  const [isCreatingEquipment, setIsCreatingEquipment] = useState<boolean>(false);

  // Update status modal
  const [updatingItem, setUpdatingItem] = useState<{
    type: 'maintenance';
    id: number;
    currentStatus: string;
    title: string;
  } | null>(null);
  const [newStatus, setNewStatus] = useState<string>('in_progress');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [eqData, maintData, brkData] = await Promise.all([
        equipmentService.getEquipment(),
        equipmentService.getMaintenance(),
        equipmentService.getBreakdowns(),
      ]);
      setEquipmentList(eqData || []);
      setMaintenance(maintData || []);
      setBreakdowns(brkData || []);
    } catch (err: any) {
      setEquipmentList([]);
      setMaintenance([]);
      setBreakdowns([]);
      setError(err?.message || 'Unable to load equipment and maintenance records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectAsset = async (asset: Equipment) => {
    setSelectedAsset(asset);
    try {
      setLoadingHistory(true);
      setHistoryError(null);
      const history = await equipmentService.getEquipmentHistory(asset.id);
      setAssetHistory(history);
    } catch (err: any) {
      setAssetHistory(null);
      setHistoryError(err?.message || 'Unable to load equipment history.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingItem) return;
    try {
      setIsUpdating(true);
      await equipmentService.updateMaintenance(updatingItem.id, {
        status: newStatus as Maintenance['status'],
      });
      setUpdatingItem(null);
      await fetchData();
    } catch (err: any) {
      alert(err?.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreatingEquipment(true);
      setAddError(null);
      await equipmentService.createEquipment(newEquipment);
      setIsAddingEquipment(false);
      setNewEquipment({
        name: '',
        equipment_id_tag: '',
        section: 'Open Cast Block A',
        description: '',
        status: 'operational',
      });
      await fetchData();
    } catch (err: any) {
      setAddError(err?.message || 'Unable to register equipment.');
    } finally {
      setIsCreatingEquipment(false);
    }
  };

  const registryColumns: Column<Equipment>[] = [
    {
      key: 'equipment_id_tag',
      header: 'Asset Tag',
      sortable: true,
      render: (e) => (
        <span className="font-mono font-bold text-navy-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {e.equipment_id_tag || `ID-${e.id}`}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Machine / Asset Name',
      sortable: true,
      render: (e) => (
        <div>
          <span className="font-semibold text-slate-800 block">{e.name}</span>
          {e.description && <span className="text-[11px] text-slate-500">{e.description}</span>}
        </div>
      ),
    },
    {
      key: 'section',
      header: 'Section Deployed',
      sortable: true,
      render: (e) => <span className="text-slate-700">{e.section}</span>,
    },
    {
      key: 'status',
      header: 'Operating Status',
      sortable: true,
      render: (e) => <StatusBadge status={e.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (e) => (
        <button
          type="button"
          onClick={(ev) => {
            ev.stopPropagation();
            handleSelectAsset(e);
          }}
          className="text-forest-700 hover:text-forest-900 font-semibold text-xs inline-flex items-center gap-1"
        >
          View Telemetry & History <ChevronRight className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-navy-900 tracking-tight">
            Equipment & Maintenance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Heavy earthmoving machinery registry, active breakdowns, and workshop tickets
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'registry' && (
            <button
              type="button"
              onClick={() => {
                setAddError(null);
                setIsAddingEquipment(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-md bg-forest-800 px-3 py-2 text-xs font-semibold text-white hover:bg-forest-900"
            >
              <Plus className="h-4 w-4" />
              Register Equipment
            </button>
          )}
          <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('registry')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              activeTab === 'registry'
                ? 'bg-forest-800 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Equipment Registry ({equipmentList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('issues')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              activeTab === 'issues'
                ? 'bg-forest-800 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Issues & Workshop ({breakdowns.length + maintenance.length})
          </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800" role="alert">
          <span>{error}</span>
          <button type="button" onClick={fetchData} className="ml-3 font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading machinery assets and workshop records..." size="lg" />
      ) : activeTab === 'registry' ? (
        /* TAB 1: Equipment Registry */
        <div className="space-y-4">
          <DataTable
            columns={registryColumns}
            data={equipmentList}
            pageSize={10}
            onRowClick={(row) => handleSelectAsset(row)}
            emptyTitle="No Equipment Registered"
            emptyDescription="There are no machinery assets logged in this colliery section."
          />
        </div>
      ) : (
        /* TAB 2: Active Breakdowns & Maintenance Tickets */
        <div className="space-y-6">
          {/* Active Breakdowns */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 bg-red-50/50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                  Reported Machine Breakdowns ({breakdowns.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">Pit face outages</span>
            </div>

            <div className="divide-y divide-slate-100">
              {breakdowns.length > 0 ? (
                breakdowns.map((b) => (
                  <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-navy-900">{b.equipment_name || `Asset #${b.equipment_id}`}</span>
                        <StatusBadge status={b.status} />
                      </div>
                      <p className="text-slate-700">{b.fault_description}</p>
                      <div className="flex items-center gap-4 text-[11px] text-slate-500">
                        <span>Location: {b.location}</span>
                        {b.created_at && <span>Reported: {b.created_at}</span>}
                      </div>
                    </div>

                    {b.report_id ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/app/reports/${b.report_id}`)}
                        className="px-3 py-1 text-xs font-semibold text-forest-700 bg-white border border-slate-300 rounded hover:bg-slate-50 shrink-0 self-start sm:self-auto"
                      >
                        View Shift Report
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500">Status recorded in source log</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  No open machine breakdowns currently reported.
                </div>
              )}
            </div>
          </div>

          {/* Active Maintenance Workorders */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-forest-700" />
                <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                  Workshop Maintenance Requirements ({maintenance.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">Preventive & Corrective Tasks</span>
            </div>

            <div className="divide-y divide-slate-100">
              {maintenance.length > 0 ? (
                maintenance.map((m) => (
                  <div key={m.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-navy-900">{m.equipment_name || `Asset #${m.equipment_id}`}</span>
                        <PriorityBadge priority={m.priority} />
                        <StatusBadge status={m.status} />
                      </div>
                      <p className="text-slate-700">{m.requirement}</p>
                      {m.remarks && <p className="text-[11px] text-slate-500 italic">{m.remarks}</p>}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        m.id &&
                        setUpdatingItem({
                          type: 'maintenance',
                          id: m.id,
                          currentStatus: m.status,
                          title: m.equipment_name || 'Maintenance Task',
                        })
                      }
                      className="px-3 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 shrink-0 self-start sm:self-auto"
                    >
                      Update Status
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  No active maintenance tickets in workshop queue.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Equipment Detail & History Slide-over / Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="font-mono text-xs font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded border border-forest-200 mr-2">
                  {selectedAsset.equipment_id_tag}
                </span>
                <span className="font-bold text-sm text-navy-900">{selectedAsset.name}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedAsset(null);
                  setAssetHistory(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Asset Details */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Section</span>
                  <span className="font-semibold text-slate-800">{selectedAsset.section}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Status</span>
                  <StatusBadge status={selectedAsset.status} />
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Description</span>
                  <span className="text-slate-700">{selectedAsset.description || 'No description available'}</span>
                </div>
              </div>

              {loadingHistory ? (
                <LoadingSpinner message="Fetching equipment service records..." size="sm" />
              ) : historyError ? (
                <div className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-800" role="alert">
                  <p>{historyError}</p>
                  <button
                    type="button"
                    onClick={() => handleSelectAsset(selectedAsset)}
                    className="mt-2 font-semibold underline"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  {/* Breakdown Timeline */}
                  <div>
                    <h4 className="font-bold text-navy-900 uppercase text-[11px] tracking-wider mb-2 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-forest-700" />
                      Breakdown History Timeline
                    </h4>
                    {assetHistory?.breakdowns && assetHistory.breakdowns.length > 0 ? (
                      <div className="space-y-2">
                        {assetHistory.breakdowns.map((b) => (
                          <div key={b.id} className="p-2.5 bg-white border border-slate-200 rounded">
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="font-semibold text-slate-800">{b.created_at || 'Previous Shift'}</span>
                              <StatusBadge status={b.status} />
                            </div>
                            <p className="text-slate-700">{b.fault_description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">No breakdown logs recorded for this machine.</p>
                    )}
                  </div>

                  {/* Maintenance Records */}
                  <div>
                    <h4 className="font-bold text-navy-900 uppercase text-[11px] tracking-wider mb-2 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-forest-700" />
                      Maintenance Service Records
                    </h4>
                    {assetHistory?.maintenance && assetHistory.maintenance.length > 0 ? (
                      <div className="space-y-2">
                        {assetHistory.maintenance.map((m) => (
                          <div key={m.id} className="p-2.5 bg-white border border-slate-200 rounded">
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="font-semibold text-slate-800">{m.requirement}</span>
                              <StatusBadge status={m.status} />
                            </div>
                            {m.remarks && <p className="text-slate-500 text-[11px]">{m.remarks}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">No maintenance tickets recorded.</p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAsset(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100"
              >
                Close Asset Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Update Status */}
      {updatingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg max-w-sm w-full shadow-xl border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-navy-900 mb-1">Update Ticket Status</h3>
            <p className="text-xs text-slate-500 mb-4 truncate">{updatingItem.title}</p>

            <form onSubmit={handleUpdateStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                >
                  <option value="open">Open / Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="in_progress">In Progress (Workshop Work)</option>
                  <option value="resolved">Resolved / Returned to Service</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUpdatingItem(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-forest-800 hover:bg-forest-900 rounded disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddingEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
              <h3 className="text-sm font-bold text-navy-900">Register Equipment</h3>
              <button
                type="button"
                onClick={() => setIsAddingEquipment(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close equipment form"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateEquipment} className="space-y-4 p-5">
              {addError && <p className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-800" role="alert">{addError}</p>}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-700">
                  Asset name *
                  <input
                    required
                    value={newEquipment.name}
                    onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 font-normal"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Asset tag *
                  <input
                    required
                    value={newEquipment.equipment_id_tag}
                    onChange={(e) => setNewEquipment({ ...newEquipment, equipment_id_tag: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 font-normal"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Mine section *
                  <select
                    value={newEquipment.section}
                    onChange={(e) => setNewEquipment({ ...newEquipment, section: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 font-normal"
                  >
                    <option value="Open Cast Block A">Open Cast Block A</option>
                    <option value="Open Cast Block B">Open Cast Block B</option>
                    <option value="Underground Section 1">Underground Section 1</option>
                    <option value="Processing Plant">Processing Plant</option>
                  </select>
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Operating status
                  <select
                    value={newEquipment.status}
                    onChange={(e) => setNewEquipment({
                      ...newEquipment,
                      status: e.target.value as Equipment['status'],
                    })}
                    className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 font-normal"
                  >
                    <option value="operational">Operational</option>
                    <option value="under_maintenance">Under maintenance</option>
                    <option value="out_of_service">Out of service</option>
                  </select>
                </label>
              </div>
              <label className="block text-xs font-semibold text-slate-700">
                Description
                <textarea
                  rows={2}
                  value={newEquipment.description}
                  onChange={(e) => setNewEquipment({ ...newEquipment, description: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 font-normal"
                />
              </label>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button type="button" onClick={() => setIsAddingEquipment(false)} className="rounded border border-slate-300 px-3 py-1.5 text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={isCreatingEquipment} className="rounded bg-forest-800 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
                  {isCreatingEquipment ? 'Registering...' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentPage;
