import { requireRole } from "@/lib/dal";
import prisma from "@/lib/prisma";
import {
  Package,
  Cpu,
  MapPin,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  await requireRole(["ADMIN"]);

  const [
    totalDeliveries,
    pendingDeliveries,
    deliveredCount,
    failedCount,
    activeDrones,
    totalDrones,
    totalStations,
    totalOperators,
    recentDeliveries,
  ] = await Promise.all([
    prisma.delivery.count(),
    prisma.delivery.count({ where: { status: "PENDING" } }),
    prisma.delivery.count({ where: { status: "DELIVERED" } }),
    prisma.delivery.count({ where: { status: "FAILED" } }),
    prisma.drone.count({ where: { status: "AVAILABLE" } }),
    prisma.drone.count(),
    prisma.station.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { role: "OPERATOR" } }),
    prisma.delivery.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { client: { select: { name: true } }, station: { select: { name: true } } },
    }),
  ]);

  const stats = [
    { label: "Total Deliveries", value: totalDeliveries, icon: Package, color: "text-primary", bg: "bg-primary/10" },
    { label: "Pending Orders", value: pendingDeliveries, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    { label: "Completed", value: deliveredCount, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
    { label: "Failed", value: failedCount, icon: AlertTriangle, color: "text-error", bg: "bg-error/10" },
    { label: "Active Drones", value: `${activeDrones}/${totalDrones}`, icon: Cpu, color: "text-primary", bg: "bg-primary/10" },
    { label: "Stations", value: totalStations, icon: MapPin, color: "text-accent", bg: "bg-accent/10" },
    { label: "Operators", value: totalOperators, icon: Users, color: "text-secondary", bg: "bg-secondary/10" },
    { label: "Success Rate", value: totalDeliveries > 0 ? `${Math.round((deliveredCount / totalDeliveries) * 100)}%` : "0%", icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
  ];

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-blue-100 text-blue-700",
    ASSIGNED: "bg-indigo-100 text-indigo-700",
    PICKED_UP: "bg-purple-100 text-purple-700",
    IN_TRANSIT: "bg-sky-100 text-sky-700",
    DELIVERED: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-700",
    CANCELLED: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted mt-1">Overview of your drone delivery operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 stagger-children">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-border-light p-4 hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Deliveries */}
      <div className="bg-white rounded-xl border border-border-light overflow-hidden">
        <div className="p-5 border-b border-border-light flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent Deliveries</h2>
          <Link
            href="/admin/deliveries"
            className="text-sm text-primary font-medium hover:text-primary-dark"
          >
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-hover">
                <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-5 py-3">Tracking ID</th>
                <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-5 py-3">Client</th>
                <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-5 py-3">Station</th>
                <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-5 py-3">Priority</th>
                <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {recentDeliveries.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-surface-hover/50">
                  <td className="px-5 py-3.5 text-sm font-mono font-medium text-foreground">{delivery.trackingId}</td>
                  <td className="px-5 py-3.5 text-sm text-muted">{delivery.client.name}</td>
                  <td className="px-5 py-3.5 text-sm text-muted">{delivery.station?.name || "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[delivery.status]}`}>
                      {delivery.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      delivery.priority === "URGENT" ? "bg-red-100 text-red-700" :
                      delivery.priority === "HIGH" ? "bg-orange-100 text-orange-700" :
                      delivery.priority === "MEDIUM" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {delivery.priority}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted">
                    {new Date(delivery.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
