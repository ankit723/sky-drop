"use client";

import { useState, useMemo } from "react";
import {
  Search, Filter, X, CheckCircle2, Truck, Plane, Package,
  XCircle, Ban, Loader2, ChevronDown, Eye, Cpu, MapPin,
} from "lucide-react";
import Modal from "@/app/components/ui/modal";

type Delivery = {
  id: string; trackingId: string; status: string; priority: string;
  pickupAddress: string; dropAddress: string; createdAt: string;
  weightKg: number; estimatedETA: string | null;
  client: { name: string }; station: { name: string } | null;
  drone: { droneCode: string } | null;
  stationId: string | null; droneId: string | null;
};

type StationOption = { id: string; name: string };
type DroneOption = { id: string; droneCode: string; batteryPercent: number; payloadCapacity: number; stationId: string };

const sc: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700", APPROVED: "bg-blue-100 text-blue-700",
  ASSIGNED: "bg-indigo-100 text-indigo-700", PICKED_UP: "bg-purple-100 text-purple-700",
  IN_TRANSIT: "bg-sky-100 text-sky-700", DELIVERED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700", CANCELLED: "bg-gray-100 text-gray-700",
};

// Next logical action per status
const nextActions: Record<string, { label: string; status: string; icon: React.ReactNode; color: string; message: string; needsAssign?: boolean }[]> = {
  PENDING: [
    { label: "Approve", status: "APPROVED", icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-blue-600 hover:bg-blue-50", message: "Delivery approved by admin" },
    { label: "Cancel", status: "CANCELLED", icon: <Ban className="w-3.5 h-3.5" />, color: "text-gray-500 hover:bg-gray-50", message: "Delivery cancelled" },
  ],
  APPROVED: [
    { label: "Assign Drone", status: "ASSIGNED", icon: <Cpu className="w-3.5 h-3.5" />, color: "text-indigo-600 hover:bg-indigo-50", message: "Drone assigned for pickup", needsAssign: true },
    { label: "Cancel", status: "CANCELLED", icon: <Ban className="w-3.5 h-3.5" />, color: "text-gray-500 hover:bg-gray-50", message: "Delivery cancelled" },
  ],
  ASSIGNED: [
    { label: "Mark Picked Up", status: "PICKED_UP", icon: <Package className="w-3.5 h-3.5" />, color: "text-purple-600 hover:bg-purple-50", message: "Package picked up by drone" },
    { label: "Mark Failed", status: "FAILED", icon: <XCircle className="w-3.5 h-3.5" />, color: "text-red-500 hover:bg-red-50", message: "Delivery failed" },
  ],
  PICKED_UP: [
    { label: "Mark In Transit", status: "IN_TRANSIT", icon: <Plane className="w-3.5 h-3.5" />, color: "text-sky-600 hover:bg-sky-50", message: "Package in transit" },
    { label: "Mark Failed", status: "FAILED", icon: <XCircle className="w-3.5 h-3.5" />, color: "text-red-500 hover:bg-red-50", message: "Delivery failed" },
  ],
  IN_TRANSIT: [
    { label: "Mark Delivered", status: "DELIVERED", icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-green-600 hover:bg-green-50", message: "Package delivered successfully" },
    { label: "Mark Failed", status: "FAILED", icon: <XCircle className="w-3.5 h-3.5" />, color: "text-red-500 hover:bg-red-50", message: "Delivery failed" },
  ],
};

const allStatuses = ["PENDING", "APPROVED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "FAILED", "CANCELLED"];
const allPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export default function DeliveriesPageClient({
  initialDeliveries, stations, availableDrones,
}: {
  initialDeliveries: Delivery[];
  stations: StationOption[];
  availableDrones: DroneOption[];
}) {
  const [deliveries, setDeliveries] = useState(initialDeliveries);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Action state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Assign modal state
  const [assignModal, setAssignModal] = useState<{ deliveryId: string; trackingId: string } | null>(null);
  const [selectedStation, setSelectedStation] = useState("");
  const [selectedDrone, setSelectedDrone] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");

  // Detail modal
  const [detailModal, setDetailModal] = useState<{ delivery: Delivery; logs: { status: string; message: string; createdAt: string }[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Drones filtered by station
  const filteredDrones = useMemo(() => {
    if (!selectedStation) return availableDrones;
    return availableDrones.filter(d => d.stationId === selectedStation);
  }, [selectedStation, availableDrones]);

  const filtered = useMemo(() => {
    return deliveries.filter(d => {
      const matchesQuery = !query ||
        d.trackingId.toLowerCase().includes(query.toLowerCase()) ||
        d.client.name.toLowerCase().includes(query.toLowerCase()) ||
        d.pickupAddress.toLowerCase().includes(query.toLowerCase()) ||
        d.dropAddress.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = !statusFilter || d.status === statusFilter;
      const matchesPriority = !priorityFilter || d.priority === priorityFilter;
      return matchesQuery && matchesStatus && matchesPriority;
    });
  }, [deliveries, query, statusFilter, priorityFilter]);

  const activeFilterCount = [statusFilter, priorityFilter].filter(Boolean).length;

  async function updateStatus(deliveryId: string, status: string, message: string, droneId?: string, stationId?: string) {
    setActionLoading(deliveryId);
    setOpenDropdown(null);
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, message, droneId, stationId }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      // Refresh list
      const r = await fetch("/api/deliveries");
      if (r.ok) setDeliveries(await r.json());
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error updating status");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAssign() {
    if (!assignModal || !selectedStation || !selectedDrone) return;
    setAssignLoading(true);
    setAssignError("");
    try {
      await updateStatus(assignModal.deliveryId, "ASSIGNED", "Drone assigned for pickup", selectedDrone, selectedStation);
      setAssignModal(null);
      setSelectedStation("");
      setSelectedDrone("");
    } catch (err: unknown) {
      setAssignError(err instanceof Error ? err.message : "Error");
    } finally {
      setAssignLoading(false);
    }
  }

  async function openDetail(delivery: Delivery) {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/deliveries/${delivery.id}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setDetailModal({ delivery: data, logs: data.logs });
    } catch { alert("Failed to load delivery details"); }
    finally { setDetailLoading(false); }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-foreground">Deliveries</h1><p className="text-muted mt-1">Manage all delivery orders</p></div>
        <span className="text-sm text-muted">{filtered.length} of {deliveries.length} deliveries</span>
      </div>
      <div className="bg-white rounded-xl border border-border-light overflow-hidden">
        {/* Search + Filters */}
        <div className="p-4 border-b border-border-light space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-light" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by tracking ID, client, or address..." className="w-full pl-9 pr-4 py-2 bg-surface-hover border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              {query && <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-muted" /></button>}
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm ${showFilters || activeFilterCount ? "border-primary text-primary bg-primary/5" : "border-border text-muted hover:bg-surface-hover"}`}>
              <Filter className="w-4 h-4" /> Filters {activeFilterCount > 0 && <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>}
            </button>
          </div>
          {showFilters && (
            <div className="flex flex-wrap gap-3 pt-2 animate-fade-in">
              <div><label className="block text-xs text-muted mb-1">Status</label><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-1.5 bg-surface-hover border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"><option value="">All Statuses</option>{allStatuses.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select></div>
              <div><label className="block text-xs text-muted mb-1">Priority</label><select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="px-3 py-1.5 bg-surface-hover border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"><option value="">All Priorities</option>{allPriorities.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
              {activeFilterCount > 0 && <button onClick={() => { setStatusFilter(""); setPriorityFilter(""); }} className="self-end text-xs text-error font-medium hover:underline mb-1">Clear filters</button>}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-surface-hover">
              <th className="text-left text-xs font-medium text-muted uppercase px-4 py-3">Tracking</th>
              <th className="text-left text-xs font-medium text-muted uppercase px-4 py-3">Client</th>
              <th className="text-left text-xs font-medium text-muted uppercase px-4 py-3">Route</th>
              <th className="text-left text-xs font-medium text-muted uppercase px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted uppercase px-4 py-3">Priority</th>
              <th className="text-left text-xs font-medium text-muted uppercase px-4 py-3">Drone</th>
              <th className="text-right text-xs font-medium text-muted uppercase px-4 py-3">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-border-light">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-muted">No deliveries match your search</td></tr>
              ) : filtered.map(d => {
                const actions = nextActions[d.status] || [];
                const isLoading = actionLoading === d.id;
                return (
                  <tr key={d.id} className="hover:bg-surface-hover/50 group">
                    <td className="px-4 py-3 text-sm font-mono font-medium">{d.trackingId}</td>
                    <td className="px-4 py-3 text-sm text-muted">{d.client.name}</td>
                    <td className="px-4 py-3 text-xs text-muted">
                      <div>{d.pickupAddress.split(",")[0]}</div>
                      <div className="text-muted-light">→ {d.dropAddress.split(",")[0]}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc[d.status]}`}>{d.status.replace("_", " ")}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.priority === "URGENT" ? "bg-red-100 text-red-700" : d.priority === "HIGH" ? "bg-orange-100 text-orange-700" : d.priority === "MEDIUM" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>{d.priority}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted font-mono">{d.drone?.droneCode || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Detail button */}
                        <button onClick={() => openDetail(d)} className="p-1.5 hover:bg-surface-hover rounded-lg" title="View details">
                          {detailLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted" /> : <Eye className="w-3.5 h-3.5 text-muted-light" />}
                        </button>

                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary mx-2" />
                        ) : actions.length > 0 ? (
                          <div className="relative">
                            <button
                              onClick={() => setOpenDropdown(openDropdown === d.id ? null : d.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-surface-hover"
                            >
                              {actions[0].icon}
                              <span className="hidden sm:inline">{actions[0].label}</span>
                              {actions.length > 1 && <ChevronDown className="w-3 h-3 ml-0.5" />}
                            </button>

                            {openDropdown === d.id && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setOpenDropdown(null)} />
                                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-border-light z-40 min-w-[160px] py-1 animate-fade-in">
                                  {actions.map((action) => (
                                    <button
                                      key={action.status}
                                      onClick={() => {
                                        if (action.needsAssign) {
                                          setAssignModal({ deliveryId: d.id, trackingId: d.trackingId });
                                          setOpenDropdown(null);
                                        } else {
                                          updateStatus(d.id, action.status, action.message);
                                        }
                                      }}
                                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium ${action.color}`}
                                    >
                                      {action.icon} {action.label}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-light italic px-2">Done</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Drone Modal */}
      <Modal open={!!assignModal} onClose={() => setAssignModal(null)} title={`Assign Drone — ${assignModal?.trackingId}`}>
        {assignError && <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-xl text-error text-sm">{assignError}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              <MapPin className="w-3.5 h-3.5 inline mr-1 text-accent" />Station
            </label>
            <select value={selectedStation} onChange={e => { setSelectedStation(e.target.value); setSelectedDrone(""); }} className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Select station...</option>
              {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              <Cpu className="w-3.5 h-3.5 inline mr-1 text-primary" />Available Drone
            </label>
            {filteredDrones.length === 0 ? (
              <p className="text-sm text-muted-light italic py-2">
                {selectedStation ? "No available drones at this station" : "Select a station first"}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredDrones.map(drone => (
                  <label
                    key={drone.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${selectedDrone === drone.id ? "border-primary bg-primary/5" : "border-border-light hover:bg-surface-hover"}`}
                  >
                    <input type="radio" name="drone" value={drone.id} checked={selectedDrone === drone.id} onChange={() => setSelectedDrone(drone.id)} className="accent-primary" />
                    <div className="flex-1">
                      <span className="text-sm font-mono font-medium">{drone.droneCode}</span>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted">
                        <span>🔋 {drone.batteryPercent}%</span>
                        <span>📦 {drone.payloadCapacity}kg</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleAssign}
            disabled={!selectedStation || !selectedDrone || assignLoading}
            className="w-full py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {assignLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Cpu className="w-4 h-4" />Assign & Dispatch</>}
          </button>
        </div>
      </Modal>

      {/* Delivery Detail Modal */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title={`Delivery — ${detailModal?.delivery.trackingId}`}>
        {detailModal && (
          <div className="space-y-5">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${sc[detailModal.delivery.status]}`}>{detailModal.delivery.status.replace("_", " ")}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${detailModal.delivery.priority === "URGENT" ? "bg-red-100 text-red-700" : detailModal.delivery.priority === "HIGH" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>{detailModal.delivery.priority}</span>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs text-muted">Client</p><p className="font-medium">{detailModal.delivery.client.name}</p></div>
              <div><p className="text-xs text-muted">Weight</p><p className="font-medium">{detailModal.delivery.weightKg}kg</p></div>
              <div><p className="text-xs text-muted flex items-center gap-1"><MapPin className="w-3 h-3 text-success" />Pickup</p><p className="font-medium">{detailModal.delivery.pickupAddress}</p></div>
              <div><p className="text-xs text-muted flex items-center gap-1"><MapPin className="w-3 h-3 text-error" />Drop-off</p><p className="font-medium">{detailModal.delivery.dropAddress}</p></div>
              <div><p className="text-xs text-muted">Station</p><p className="font-medium">{detailModal.delivery.station?.name || "—"}</p></div>
              <div><p className="text-xs text-muted">Drone</p><p className="font-medium font-mono">{detailModal.delivery.drone?.droneCode || "—"}</p></div>
            </div>

            {/* Timeline */}
            <div className="border-t border-border-light pt-4">
              <h4 className="text-sm font-semibold mb-3">Timeline</h4>
              <div className="space-y-3">
                {detailModal.logs.map((log, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${i === detailModal.logs.length - 1 ? "bg-primary text-white" : "bg-surface-hover text-muted"}`}>
                        {i + 1}
                      </div>
                      {i < detailModal.logs.length - 1 && <div className="w-0.5 h-full bg-border-light mt-0.5" />}
                    </div>
                    <div className="pb-2">
                      <p className="text-xs font-medium">{log.message}</p>
                      <p className="text-[10px] text-muted">{new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
