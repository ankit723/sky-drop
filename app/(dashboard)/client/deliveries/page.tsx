import { requireRole } from "@/lib/dal";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export default async function ClientDeliveriesPage() {
  const session = await requireRole(["CLIENT"]);
  const deliveries = await prisma.delivery.findMany({
    where: { clientId: session.userId },
    include: {
      station: { select: { name: true } },
      drone: { select: { droneCode: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const sc: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-blue-100 text-blue-700",
    ASSIGNED: "bg-indigo-100 text-indigo-700",
    PICKED_UP: "bg-purple-100 text-purple-700",
    IN_TRANSIT: "bg-sky-100 text-sky-700",
    DELIVERED: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-700",
    CANCELLED: "bg-gray-100 text-gray-700",
  };

  const isActive = (status: string) =>
    ["PENDING", "APPROVED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(status);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Delivery History</h1>
          <p className="text-muted mt-1">All your past and current deliveries</p>
        </div>
        <Link
          href="/client/new-delivery"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-primary/25"
        >
          + New Delivery
        </Link>
      </div>

      {deliveries.length === 0 ? (
        <div className="bg-white rounded-xl border border-border-light p-12 text-center">
          <p className="text-muted mb-4">No deliveries yet</p>
          <Link href="/client/new-delivery" className="text-primary font-medium hover:underline">
            Create your first delivery →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border-light overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-hover">
                <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Tracking</th>
                <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Route</th>
                <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Priority</th>
                <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Drone</th>
                <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Weight</th>
                <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Date</th>
                <th className="text-right text-xs font-medium text-muted uppercase px-5 py-3">Track</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {deliveries.map((d) => (
                <tr key={d.id} className="hover:bg-surface-hover/50">
                  <td className="px-5 py-3 text-sm font-mono font-medium">{d.trackingId}</td>
                  <td className="px-5 py-3 text-xs text-muted">
                    <div>{d.pickupAddress.split(",")[0]}</div>
                    <div className="text-muted-light">→ {d.dropAddress.split(",")[0]}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc[d.status]}`}>
                      {d.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        d.priority === "URGENT"
                          ? "bg-red-100 text-red-700"
                          : d.priority === "HIGH"
                          ? "bg-orange-100 text-orange-700"
                          : d.priority === "MEDIUM"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {d.priority}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm font-mono text-muted">
                    {d.drone?.droneCode || "—"}
                  </td>
                  <td className="px-5 py-3 text-sm text-muted">{d.weightKg}kg</td>
                  <td className="px-5 py-3 text-sm text-muted">
                    {new Date(d.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/track?id=${d.trackingId}`}
                      target="_blank"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isActive(d.status)
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "bg-surface-hover text-muted hover:bg-gray-200"
                      }`}
                    >
                      <ExternalLink className="w-3 h-3" />
                      {isActive(d.status) ? "Track Live" : "View"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
