"use client";

import { useState } from "react";
import {
  CheckCircle2, Plane, Package, XCircle, Loader2, ChevronDown, Cpu, Eye,
} from "lucide-react";
import Modal from "@/app/components/ui/modal";

type Delivery = {
  id: string; trackingId: string; status: string; priority: string;
  pickupAddress: string; dropAddress: string; weightKg: number;
  createdAt: string; client: { name: string };
  drone: { droneCode: string } | null;
};
type DroneOption = { id: string; droneCode: string; batteryPercent: number; payloadCapacity: number; stationId: string };

const sc: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700", APPROVED: "bg-blue-100 text-blue-700",
  ASSIGNED: "bg-indigo-100 text-indigo-700", PICKED_UP: "bg-purple-100 text-purple-700",
  IN_TRANSIT: "bg-sky-100 text-sky-700", DELIVERED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700", CANCELLED: "bg-gray-100 text-gray-700",
};

const nextActions: Record<string, { label: string; status: string; icon: React.ReactNode; color: string; message: string; needsAssign?: boolean }[]> = {
  PENDING: [
    { label: "Approve", status: "APPROVED", icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-blue-600 hover:bg-blue-50", message: "Delivery approved by operator" },
  ],
  APPROVED: [
    { label: "Assign Drone", status: "ASSIGNED", icon: <Cpu className="w-3.5 h-3.5" />, color: "text-indigo-600 hover:bg-indigo-50", message: "Drone assigned", needsAssign: true },
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

export default function OperatorDeliveriesClient({
  initialDeliveries, stationId, stationName, availableDrones,
}: {
  initialDeliveries: Delivery[];
  stationId: string;
  stationName: string;
  availableDrones: DroneOption[];
}) {
  const [deliveries, setDeliveries] = useState(initialDeliveries);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Assign modal
  const [assignModal, setAssignModal] = useState<{ deliveryId: string; trackingId: string } | null>(null);
  const [selectedDrone, setSelectedDrone] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  // Detail modal
  const [detailModal, setDetailModal] = useState<{ delivery: Delivery; logs: { status: string; message: string; createdAt: string }[] } | null>(null);

  async function updateStatus(deliveryId: string, status: string, message: string, droneId?: string) {
    setActionLoading(deliveryId);
    setOpenDropdown(null);
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, message, droneId, stationId }),
      });
      if (!res.ok) throw new Error("Failed");
      const r = await fetch("/api/deliveries");
      if (r.ok) setDeliveries(await r.json());
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error");
    } finally { setActionLoading(null); }
  }

  async function handleAssign() {
    if (!assignModal || !selectedDrone) return;
    setAssignLoading(true);
    try {
      await updateStatus(assignModal.deliveryId, "ASSIGNED", "Drone assigned by operator", selectedDrone);
      setAssignModal(null);
      setSelectedDrone("");
    } finally { setAssignLoading(false); }
  }

  async function openDetail(delivery: Delivery) {
    try {
      const res = await fetch(`/api/deliveries/${delivery.id}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setDetailModal({ delivery: data, logs: data.logs });
    } catch { alert("Failed to load details"); }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Assigned Deliveries</h1>
        <p className="text-muted mt-1">{stationName} • {deliveries.length} deliveries</p>
      </div>

      <div className="bg-white rounded-xl border border-border-light overflow-x-auto">
        <table className="w-full">
          <thead><tr className="bg-surface-hover">
            <th className="text-left text-xs font-medium text-muted uppercase px-4 py-3">Tracking</th>
            <th className="text-left text-xs font-medium text-muted uppercase px-4 py-3">Client</th>
            <th className="text-left text-xs font-medium text-muted uppercase px-4 py-3">Route</th>
            <th className="text-left text-xs font-medium text-muted uppercase px-4 py-3">Status</th>
            <th className="text-left text-xs font-medium text-muted uppercase px-4 py-3">Drone</th>
            <th className="text-left text-xs font-medium text-muted uppercase px-4 py-3">Weight</th>
            <th className="text-right text-xs font-medium text-muted uppercase px-4 py-3">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-border-light">
            {deliveries.map(d => {
              const actions = nextActions[d.status] || [];
              const isLoading = actionLoading === d.id;
              return (
                <tr key={d.id} className="hover:bg-surface-hover/50">
                  <td className="px-4 py-3 text-sm font-mono font-medium">{d.trackingId}</td>
                  <td className="px-4 py-3 text-sm text-muted">{d.client.name}</td>
                  <td className="px-4 py-3 text-xs text-muted">
                    <div>{d.pickupAddress.split(",")[0]}</div>
                    <div className="text-muted-light">→ {d.dropAddress.split(",")[0]}</div>
                  </td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc[d.status]}`}>{d.status.replace("_", " ")}</span></td>
                  <td className="px-4 py-3 text-sm font-mono text-muted">{d.drone?.droneCode || "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted">{d.weightKg}kg</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openDetail(d)} className="p-1.5 hover:bg-surface-hover rounded-lg" title="View details">
                        <Eye className="w-3.5 h-3.5 text-muted-light" />
                      </button>
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary mx-2" />
                      ) : actions.length > 0 ? (
                        <div className="relative">
                          <button onClick={() => setOpenDropdown(openDropdown === d.id ? null : d.id)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-surface-hover">
                            {actions[0].icon}
                            <span className="hidden sm:inline">{actions[0].label}</span>
                            {actions.length > 1 && <ChevronDown className="w-3 h-3" />}
                          </button>
                          {openDropdown === d.id && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setOpenDropdown(null)} />
                              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-border-light z-40 min-w-[160px] py-1 animate-fade-in">
                                {actions.map(action => (
                                  <button key={action.status} onClick={() => {
                                    if (action.needsAssign) { setAssignModal({ deliveryId: d.id, trackingId: d.trackingId }); setOpenDropdown(null); }
                                    else updateStatus(d.id, action.status, action.message);
                                  }} className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium ${action.color}`}>
                                    {action.icon} {action.label}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      ) : <span className="text-xs text-muted-light italic px-2">Done</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Assign Drone Modal (operator's station drones only) */}
      <Modal open={!!assignModal} onClose={() => setAssignModal(null)} title={`Assign Drone — ${assignModal?.trackingId}`}>
        <div className="space-y-4">
          <p className="text-sm text-muted">Select a drone from <strong>{stationName}</strong></p>
          {availableDrones.length === 0 ? (
            <p className="text-sm text-muted-light italic py-4 text-center">No available drones at this station</p>
          ) : (
            <div className="space-y-2">
              {availableDrones.map(drone => (
                <label key={drone.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${selectedDrone === drone.id ? "border-primary bg-primary/5" : "border-border-light hover:bg-surface-hover"}`}>
                  <input type="radio" name="drone" value={drone.id} checked={selectedDrone === drone.id} onChange={() => setSelectedDrone(drone.id)} className="accent-primary" />
                  <div className="flex-1">
                    <span className="text-sm font-mono font-medium">{drone.droneCode}</span>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted"><span>🔋 {drone.batteryPercent}%</span><span>📦 {drone.payloadCapacity}kg</span></div>
                  </div>
                </label>
              ))}
            </div>
          )}
          <button onClick={handleAssign} disabled={!selectedDrone || assignLoading} className="w-full py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
            {assignLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Cpu className="w-4 h-4" />Assign & Dispatch</>}
          </button>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title={`Delivery — ${detailModal?.delivery.trackingId}`}>
        {detailModal && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${sc[detailModal.delivery.status]}`}>{detailModal.delivery.status.replace("_", " ")}</span>
              <span className="text-sm text-muted">{detailModal.delivery.weightKg}kg</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-muted">Client</p><p className="font-medium">{detailModal.delivery.client.name}</p></div>
              <div><p className="text-xs text-muted">Drone</p><p className="font-medium font-mono">{detailModal.delivery.drone?.droneCode || "—"}</p></div>
            </div>
            <div className="border-t border-border-light pt-3">
              <h4 className="text-sm font-semibold mb-3">Timeline</h4>
              <div className="space-y-3">
                {detailModal.logs.map((log, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${i === detailModal.logs.length - 1 ? "bg-primary text-white" : "bg-surface-hover text-muted"}`}>{i + 1}</div>
                      {i < detailModal.logs.length - 1 && <div className="w-0.5 h-full bg-border-light mt-0.5" />}
                    </div>
                    <div className="pb-2"><p className="text-xs font-medium">{log.message}</p><p className="text-[10px] text-muted">{new Date(log.createdAt).toLocaleString()}</p></div>
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
