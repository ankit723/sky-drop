"use client";

import { useState } from "react";
import { Plus, MapPin, Mail, Phone, Trash2, Loader2 } from "lucide-react";
import Modal from "@/app/components/ui/modal";

type Operator = {
  id: string; name: string; email: string; phone: string | null; createdAt: string;
  station: { id: string; name: string; status: string } | null;
};
type StationOption = { id: string; name: string };

export default function OperatorsPageClient({ initialOperators, stations }: { initialOperators: Operator[]; stations: StationOption[] }) {
  const [operators, setOperators] = useState(initialOperators);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/operators", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        name: fd.get("name"), email: fd.get("email"), password: fd.get("password"),
        phone: fd.get("phone") || undefined,
        stationId: fd.get("stationId") || undefined,
      }) });
      if (!res.ok) { const d = await res.json(); throw new Error(typeof d.error === "string" ? d.error : "Failed"); }
      setModalOpen(false);
      const r = await fetch("/api/operators"); setOperators(await r.json());
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this operator?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/operators/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      setOperators(operators.filter(o => o.id !== id));
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Error"); }
    finally { setDeleting(null); }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold">Operators</h1><p className="text-muted mt-1">Manage station operators</p></div>
        <button onClick={() => { setModalOpen(true); setError(""); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-primary/25"><Plus className="w-4 h-4" /> Add Operator</button>
      </div>
      <div className="bg-white rounded-xl border border-border-light overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-surface-hover"><th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Operator</th><th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Contact</th><th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Station</th><th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Joined</th><th className="text-right text-xs font-medium text-muted uppercase px-5 py-3">Action</th></tr></thead>
          <tbody className="divide-y divide-border-light">
            {operators.map((op) => (
              <tr key={op.id} className="hover:bg-surface-hover/50 group">
                <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center"><span className="text-xs font-bold text-secondary">{op.name.charAt(0)}</span></div><span className="text-sm font-medium">{op.name}</span></div></td>
                <td className="px-5 py-4 text-sm text-muted"><div className="flex items-center gap-1"><Mail className="w-3 h-3" />{op.email}</div>{op.phone && <div className="flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{op.phone}</div>}</td>
                <td className="px-5 py-4">{op.station ? <span className="flex items-center gap-1 text-sm"><MapPin className="w-3 h-3 text-accent" />{op.station.name}</span> : <span className="text-sm text-muted-light italic">Unassigned</span>}</td>
                <td className="px-5 py-4 text-sm text-muted">{new Date(op.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-4 text-right">
                  <button onClick={() => handleDelete(op.id)} disabled={deleting === op.id} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-error/10 rounded-lg">
                    {deleting === op.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-error" /> : <Trash2 className="w-3.5 h-3.5 text-error/60" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add New Operator">
        {error && <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-xl text-error text-sm">{error}</div>}
        <form onSubmit={handleCreate} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Name</label><input name="name" required placeholder="Operator name" className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
          <div><label className="block text-sm font-medium mb-1">Email</label><input name="email" type="email" required placeholder="email@example.com" className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
          <div><label className="block text-sm font-medium mb-1">Password</label><input name="password" type="password" required placeholder="Min 6 characters" className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
          <div><label className="block text-sm font-medium mb-1">Phone <span className="text-muted-light">(optional)</span></label><input name="phone" placeholder="+91-XXXXXXXXXX" className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
          <div><label className="block text-sm font-medium mb-1">Assign Station <span className="text-muted-light">(optional)</span></label><select name="stationId" className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"><option value="">No station</option>{stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" />Create Operator</>}
          </button>
        </form>
      </Modal>
    </div>
  );
}
