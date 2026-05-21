import { requireRole } from "@/lib/dal";
import prisma from "@/lib/prisma";
import { Cpu, Battery } from "lucide-react";

export default async function OperatorDronesPage() {
  const session = await requireRole(["OPERATOR"]);
  const station = await prisma.station.findUnique({ where: { operatorId: session.userId } });
  if (!station) return <div className="p-8"><h1 className="text-xl font-bold">No station assigned</h1></div>;

  const drones = await prisma.drone.findMany({ where: { stationId: station.id }, include: { _count: { select: { deliveries: true } } } });
  const cfg: Record<string, { color: string; bg: string }> = { AVAILABLE: { color: "text-green-700", bg: "bg-green-100" }, CHARGING: { color: "text-blue-700", bg: "bg-blue-100" }, BUSY: { color: "text-orange-700", bg: "bg-orange-100" }, MAINTENANCE: { color: "text-red-700", bg: "bg-red-100" } };

  return (
    <div className="animate-fade-in">
      <div className="mb-8"><h1 className="text-2xl font-bold">Drone Monitoring</h1><p className="text-muted mt-1">{station.name}</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {drones.map(d=>{const c=cfg[d.status];return(
          <div key={d.id} className="bg-white rounded-xl border border-border-light p-5 hover:shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"><Cpu className="w-5 h-5 text-primary" /></div>
                <div><h3 className="font-semibold">{d.droneCode}</h3><p className="text-xs text-muted">{d._count.deliveries} deliveries</p></div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.color}`}>{d.status}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5"><Battery className={`w-4 h-4 ${d.batteryPercent>70?"text-green-500":d.batteryPercent>30?"text-yellow-500":"text-red-500"}`} /><span className="text-sm font-medium">{d.batteryPercent}%</span></div>
              <div className="text-sm text-muted">{d.payloadCapacity}kg capacity</div>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}
