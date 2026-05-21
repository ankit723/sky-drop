import { requireRole, getCurrentUser } from "@/lib/dal";
import prisma from "@/lib/prisma";
import { Package, CheckCircle2, Clock, Truck, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default async function ClientDashboard() {
  const session = await requireRole(["CLIENT"]);
  const user = await getCurrentUser();
  const [total, pending, inTransit, delivered, failed] = await Promise.all([
    prisma.delivery.count({ where: { clientId: session.userId } }),
    prisma.delivery.count({ where: { clientId: session.userId, status: "PENDING" } }),
    prisma.delivery.count({ where: { clientId: session.userId, status: { in: ["PICKED_UP", "IN_TRANSIT"] } } }),
    prisma.delivery.count({ where: { clientId: session.userId, status: "DELIVERED" } }),
    prisma.delivery.count({ where: { clientId: session.userId, status: "FAILED" } }),
  ]);
  const recent = await prisma.delivery.findMany({ where: { clientId: session.userId }, take: 5, orderBy: { createdAt: "desc" }, include: { drone: { select: { droneCode: true } } } });
  const sc: Record<string, string> = { PENDING: "bg-yellow-100 text-yellow-700", APPROVED: "bg-blue-100 text-blue-700", ASSIGNED: "bg-indigo-100 text-indigo-700", PICKED_UP: "bg-purple-100 text-purple-700", IN_TRANSIT: "bg-sky-100 text-sky-700", DELIVERED: "bg-green-100 text-green-700", FAILED: "bg-red-100 text-red-700", CANCELLED: "bg-gray-100 text-gray-700" };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
        <p className="text-muted mt-1">Your delivery overview</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-border-light p-4"><Package className="w-6 h-6 text-primary mb-2" /><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted">Total</p></div>
        <div className="bg-white rounded-xl border border-border-light p-4"><Clock className="w-6 h-6 text-warning mb-2" /><p className="text-2xl font-bold">{pending}</p><p className="text-xs text-muted">Pending</p></div>
        <div className="bg-white rounded-xl border border-border-light p-4"><Truck className="w-6 h-6 text-primary mb-2" /><p className="text-2xl font-bold">{inTransit}</p><p className="text-xs text-muted">In Transit</p></div>
        <div className="bg-white rounded-xl border border-border-light p-4"><CheckCircle2 className="w-6 h-6 text-success mb-2" /><p className="text-2xl font-bold">{delivered}</p><p className="text-xs text-muted">Delivered</p></div>
        <div className="bg-white rounded-xl border border-border-light p-4"><AlertTriangle className="w-6 h-6 text-error mb-2" /><p className="text-2xl font-bold">{failed}</p><p className="text-xs text-muted">Failed</p></div>
      </div>
      <div className="flex gap-4 mb-8">
        <Link href="/client/new-delivery" className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-medium rounded-xl hover:shadow-lg hover:shadow-primary/25"><Truck className="w-4 h-4" />New Delivery</Link>
        <Link href="/track" className="inline-flex items-center gap-2 px-5 py-3 border border-border text-foreground font-medium rounded-xl hover:bg-surface-hover">Track Package</Link>
      </div>
      <div className="bg-white rounded-xl border border-border-light">
        <div className="p-5 border-b border-border-light flex justify-between"><h2 className="font-semibold">Recent Deliveries</h2><Link href="/client/deliveries" className="text-sm text-primary font-medium">View all →</Link></div>
        <table className="w-full"><thead><tr className="bg-surface-hover"><th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Tracking</th><th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Route</th><th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Status</th><th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">ETA</th></tr></thead>
        <tbody className="divide-y divide-border-light">{recent.map(d=><tr key={d.id} className="hover:bg-surface-hover/50"><td className="px-5 py-3 text-sm font-mono font-medium">{d.trackingId}</td><td className="px-5 py-3 text-xs text-muted"><div>{d.pickupAddress.split(",")[0]}</div><div className="text-muted-light">→ {d.dropAddress.split(",")[0]}</div></td><td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc[d.status]}`}>{d.status.replace("_"," ")}</span></td><td className="px-5 py-3 text-sm text-muted">{d.estimatedETA||"—"}</td></tr>)}</tbody></table>
      </div>
    </div>
  );
}
