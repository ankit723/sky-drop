import { requireRole } from "@/lib/dal";
import prisma from "@/lib/prisma";
import { BarChart3, Package, CheckCircle2, XCircle, TrendingUp } from "lucide-react";

export default async function ReportsPage() {
  await requireRole(["ADMIN"]);
  const [total, delivered, failed, byPriority, byStation] = await Promise.all([
    prisma.delivery.count(),
    prisma.delivery.count({ where: { status: "DELIVERED" } }),
    prisma.delivery.count({ where: { status: "FAILED" } }),
    prisma.delivery.groupBy({ by: ["priority"], _count: true }),
    prisma.delivery.groupBy({ by: ["stationId"], _count: true }),
  ]);
  const stations = await prisma.station.findMany({ select: { id: true, name: true } });
  const stationMap = Object.fromEntries(stations.map(s => [s.id, s.name]));
  const rate = total > 0 ? Math.round((delivered / total) * 100) : 0;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-muted mt-1">Analytics and delivery performance</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-border-light p-5">
          <Package className="w-8 h-8 text-primary mb-3" />
          <p className="text-3xl font-bold">{total}</p>
          <p className="text-sm text-muted">Total Deliveries</p>
        </div>
        <div className="bg-white rounded-xl border border-border-light p-5">
          <CheckCircle2 className="w-8 h-8 text-success mb-3" />
          <p className="text-3xl font-bold">{delivered}</p>
          <p className="text-sm text-muted">Completed</p>
        </div>
        <div className="bg-white rounded-xl border border-border-light p-5">
          <XCircle className="w-8 h-8 text-error mb-3" />
          <p className="text-3xl font-bold">{failed}</p>
          <p className="text-sm text-muted">Failed</p>
        </div>
        <div className="bg-white rounded-xl border border-border-light p-5">
          <TrendingUp className="w-8 h-8 text-success mb-3" />
          <p className="text-3xl font-bold">{rate}%</p>
          <p className="text-sm text-muted">Success Rate</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border-light p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" />By Priority</h3>
          <div className="space-y-3">
            {byPriority.map(p => (
              <div key={p.priority} className="flex items-center gap-3">
                <span className="text-sm font-medium w-16">{p.priority}</span>
                <div className="flex-1 bg-surface-hover rounded-full h-6 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full flex items-center justify-end pr-2" style={{ width: `${Math.max((p._count / total) * 100, 8)}%` }}>
                    <span className="text-[10px] font-bold text-white">{p._count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border-light p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-accent" />By Station</h3>
          <div className="space-y-3">
            {byStation.filter(s => s.stationId).map(s => (
              <div key={s.stationId} className="flex items-center gap-3">
                <span className="text-sm font-medium w-32 truncate">{stationMap[s.stationId!] || "Unknown"}</span>
                <div className="flex-1 bg-surface-hover rounded-full h-6 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full flex items-center justify-end pr-2" style={{ width: `${Math.max((s._count / total) * 100, 8)}%` }}>
                    <span className="text-[10px] font-bold text-white">{s._count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
