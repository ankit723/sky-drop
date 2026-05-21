import { requireRole, getCurrentUser } from "@/lib/dal";
import prisma from "@/lib/prisma";
import { Package, Cpu, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";

export default async function OperatorDashboard() {
  const session = await requireRole(["OPERATOR"]);
  const user = await getCurrentUser();
  const station = await prisma.station.findUnique({ where: { operatorId: session.userId }, include: { _count: { select: { drones: true, deliveries: true } } } });

  if (!station) return <div className="animate-fade-in"><h1 className="text-2xl font-bold">No Station Assigned</h1><p className="text-muted mt-2">Contact admin to assign you a station.</p></div>;

  const [pending, inTransit, delivered] = await Promise.all([
    prisma.delivery.count({ where: { stationId: station.id, status: { in: ["PENDING", "APPROVED", "ASSIGNED"] } } }),
    prisma.delivery.count({ where: { stationId: station.id, status: { in: ["PICKED_UP", "IN_TRANSIT"] } } }),
    prisma.delivery.count({ where: { stationId: station.id, status: "DELIVERED" } }),
  ]);

  const recentDeliveries = await prisma.delivery.findMany({ where: { stationId: station.id }, take: 5, orderBy: { updatedAt: "desc" }, include: { client: { select: { name: true } }, drone: { select: { droneCode: true } } } });
  const sc: Record<string, string> = { PENDING: "bg-yellow-100 text-yellow-700", APPROVED: "bg-blue-100 text-blue-700", ASSIGNED: "bg-indigo-100 text-indigo-700", PICKED_UP: "bg-purple-100 text-purple-700", IN_TRANSIT: "bg-sky-100 text-sky-700", DELIVERED: "bg-green-100 text-green-700", FAILED: "bg-red-100 text-red-700", CANCELLED: "bg-gray-100 text-gray-700" };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
        <p className="text-muted mt-1">{station.name} • {station.address}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-border-light p-4"><Clock className="w-6 h-6 text-warning mb-2" /><p className="text-2xl font-bold">{pending}</p><p className="text-xs text-muted">Pending</p></div>
        <div className="bg-white rounded-xl border border-border-light p-4"><Package className="w-6 h-6 text-primary mb-2" /><p className="text-2xl font-bold">{inTransit}</p><p className="text-xs text-muted">In Transit</p></div>
        <div className="bg-white rounded-xl border border-border-light p-4"><CheckCircle2 className="w-6 h-6 text-success mb-2" /><p className="text-2xl font-bold">{delivered}</p><p className="text-xs text-muted">Delivered</p></div>
        <div className="bg-white rounded-xl border border-border-light p-4"><Cpu className="w-6 h-6 text-primary mb-2" /><p className="text-2xl font-bold">{station._count.drones}</p><p className="text-xs text-muted">Drones</p></div>
      </div>
      <div className="bg-white rounded-xl border border-border-light">
        <div className="p-5 border-b border-border-light flex justify-between"><h2 className="font-semibold">Recent Deliveries</h2><Link href="/operator/deliveries" className="text-sm text-primary font-medium">View all →</Link></div>
        <table className="w-full"><thead><tr className="bg-surface-hover"><th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Tracking</th><th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Client</th><th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Status</th><th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Drone</th></tr></thead>
        <tbody className="divide-y divide-border-light">{recentDeliveries.map(d=><tr key={d.id} className="hover:bg-surface-hover/50"><td className="px-5 py-3 text-sm font-mono">{d.trackingId}</td><td className="px-5 py-3 text-sm text-muted">{d.client.name}</td><td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc[d.status]}`}>{d.status.replace("_"," ")}</span></td><td className="px-5 py-3 text-sm text-muted font-mono">{d.drone?.droneCode||"—"}</td></tr>)}</tbody></table>
      </div>
    </div>
  );
}
