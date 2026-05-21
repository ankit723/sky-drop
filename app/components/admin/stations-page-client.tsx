"use client";

import { useState, useEffect } from "react";
import { MapPin, Plus, Users, Cpu, Trash2, Loader2 } from "lucide-react";
import Modal from "@/app/components/ui/modal";

type Station = {
  id: string; name: string; address: string; latitude: number; longitude: number;
  status: string; operatorId: string | null;
  operator: { id: string; name: string; email: string } | null;
  _count: { drones: number; deliveries: number };
};

export default function StationsPageClient({ initialStations }: { initialStations: Station[] }) {
  const [stations, setStations] = useState(initialStations);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/stations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"), address: fd.get("address"),
          latitude: parseFloat(fd.get("latitude") as string),
          longitude: parseFloat(fd.get("longitude") as string),
          status: fd.get("status"),
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(typeof d.error === "string" ? d.error : "Failed"); }
      setModalOpen(false);
      // Refresh
      const r = await fetch("/api/stations"); setStations(await r.json());
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this station?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/stations/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      setStations(stations.filter(s => s.id !== id));
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Error"); }
    finally { setDeleting(null); }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stations</h1>
          <p className="text-muted mt-1">Manage drone hubs across the city</p>
        </div>
        <button onClick={() => { setModalOpen(true); setError(""); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-primary/25">
          <Plus className="w-4 h-4" /> Add Station
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children">
        {stations.map((station) => (
          <div key={station.id} className="bg-white rounded-xl border border-border-light p-5 hover:shadow-md group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{station.name}</h3>
                  <p className="text-xs text-muted mt-0.5">{station.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${station.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{station.status}</span>
                <button onClick={() => handleDelete(station.id)} disabled={deleting === station.id} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-error/10 rounded-lg" title="Delete">
                  {deleting === station.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-error" /> : <Trash2 className="w-3.5 h-3.5 text-error/60" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-surface-hover rounded-lg p-2.5 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1"><Cpu className="w-3.5 h-3.5 text-primary" /><span className="text-lg font-bold">{station._count.drones}</span></div>
                <p className="text-[10px] text-muted uppercase tracking-wider">Drones</p>
              </div>
              <div className="bg-surface-hover rounded-lg p-2.5 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1"><MapPin className="w-3.5 h-3.5 text-accent" /><span className="text-lg font-bold">{station._count.deliveries}</span></div>
                <p className="text-[10px] text-muted uppercase tracking-wider">Deliveries</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-border-light">
              <Users className="w-3.5 h-3.5 text-muted-light" />
              <span className="text-xs text-muted">{station.operator ? `${station.operator.name} (${station.operator.email})` : "No operator assigned"}</span>
            </div>
            <div className="mt-3 text-[10px] text-muted-light">📍 {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}</div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add New Station">
        {error && <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-xl text-error text-sm">{error}</div>}
        <form onSubmit={handleCreate} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Station Name</label><input name="name" required placeholder="e.g. SkyDrop Hub - Salt Lake" className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
          <div><label className="block text-sm font-medium mb-1">Address</label><input name="address" required placeholder="Full address" className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-muted mb-1">Latitude</label><input name="latitude" type="number" step="any" required defaultValue="22.5726" className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
            <div><label className="block text-xs text-muted mb-1">Longitude</label><input name="longitude" type="number" step="any" required defaultValue="88.4345" className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Status</label><select name="status" defaultValue="ACTIVE" className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></div>
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" />Create Station</>}
          </button>
        </form>
      </Modal>
    </div>
  );
}
