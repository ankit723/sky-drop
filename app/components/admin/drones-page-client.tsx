"use client";

import { useState } from "react";
import { Cpu, Plus, Battery, Weight, MapPin, Trash2, Loader2 } from "lucide-react";
import Modal from "@/app/components/ui/modal";

type Drone = {
  id: string; droneCode: string; batteryPercent: number; payloadCapacity: number;
  status: string; currentLat: number | null; currentLng: number | null;
  stationId: string; station: { name: string }; _count: { deliveries: number };
};
type StationOption = { id: string; name: string };

export default function DronesPageClient({ initialDrones, stations }: { initialDrones: Drone[]; stations: StationOption[] }) {
  const [drones, setDrones] = useState(initialDrones);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const cfg: Record<string, { color: string; bg: string }> = { AVAILABLE: { color: "text-green-700", bg: "bg-green-100" }, CHARGING: { color: "text-blue-700", bg: "bg-blue-100" }, BUSY: { color: "text-orange-700", bg: "bg-orange-100" }, MAINTENANCE: { color: "text-red-700", bg: "bg-red-100" } };

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/drones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        droneCode: fd.get("droneCode"), batteryPercent: parseInt(fd.get("batteryPercent") as string),
        payloadCapacity: parseFloat(fd.get("payloadCapacity") as string),
        status: fd.get("status"), stationId: fd.get("stationId"),
      }) });
      if (!res.ok) { const d = await res.json(); throw new Error(typeof d.error === "string" ? d.error : "Failed"); }
      setModalOpen(false);
      const r = await fetch("/api/drones"); setDrones(await r.json());
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this drone?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/drones/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      setDrones(drones.filter(d => d.id !== id));
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Error"); }
    finally { setDeleting(null); }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold">Drones</h1><p className="text-muted mt-1">Monitor and manage your drone fleet</p></div>
        <button onClick={() => { setModalOpen(true); setError(""); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-primary/25"><Plus className="w-4 h-4" /> Add Drone</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children">
        {drones.map((drone) => { const c = cfg[drone.status] || cfg.AVAILABLE; return (
          <div key={drone.id} className="bg-white rounded-xl border border-border-light p-5 hover:shadow-md group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"><Cpu className="w-5 h-5 text-primary" /></div>
                <div><h3 className="font-semibold">{drone.droneCode}</h3><p className="text-xs text-muted mt-0.5">{drone.station.name}</p></div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.color}`}>{drone.status}</span>
                <button onClick={() => handleDelete(drone.id)} disabled={deleting === drone.id} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-error/10 rounded-lg">
                  {deleting === drone.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-error" /> : <Trash2 className="w-3.5 h-3.5 text-error/60" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-surface-hover rounded-lg p-2.5 text-center"><Battery className={`w-4 h-4 mx-auto mb-1 ${drone.batteryPercent>70?"text-green-500":drone.batteryPercent>30?"text-yellow-500":"text-red-500"}`} /><p className="text-sm font-bold">{drone.batteryPercent}%</p><p className="text-[10px] text-muted">Battery</p></div>
              <div className="bg-surface-hover rounded-lg p-2.5 text-center"><Weight className="w-4 h-4 mx-auto mb-1 text-muted-light" /><p className="text-sm font-bold">{drone.payloadCapacity}kg</p><p className="text-[10px] text-muted">Payload</p></div>
              <div className="bg-surface-hover rounded-lg p-2.5 text-center"><MapPin className="w-4 h-4 mx-auto mb-1 text-muted-light" /><p className="text-sm font-bold">{drone._count.deliveries}</p><p className="text-[10px] text-muted">Trips</p></div>
            </div>
          </div>
        ); })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add New Drone">
        {error && <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-xl text-error text-sm">{error}</div>}
        <form onSubmit={handleCreate} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Drone Code</label><input name="droneCode" required placeholder="e.g. SD-007" className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
          <div><label className="block text-sm font-medium mb-1">Station</label><select name="stationId" required className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"><option value="">Select station...</option>{stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-muted mb-1">Battery %</label><input name="batteryPercent" type="number" min="0" max="100" defaultValue="100" className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
            <div><label className="block text-xs text-muted mb-1">Payload (kg)</label><input name="payloadCapacity" type="number" step="0.1" min="0.1" defaultValue="5.0" className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Status</label><select name="status" defaultValue="AVAILABLE" className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"><option value="AVAILABLE">Available</option><option value="CHARGING">Charging</option><option value="MAINTENANCE">Maintenance</option></select></div>
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" />Create Drone</>}
          </button>
        </form>
      </Modal>
    </div>
  );
}
