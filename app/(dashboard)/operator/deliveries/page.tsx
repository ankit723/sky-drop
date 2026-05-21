import { requireRole } from "@/lib/dal";
import prisma from "@/lib/prisma";
import OperatorDeliveriesClient from "@/app/components/operator/deliveries-page-client";

export default async function OperatorDeliveriesPage() {
  const session = await requireRole(["OPERATOR"]);
  const station = await prisma.station.findUnique({ where: { operatorId: session.userId } });
  if (!station)
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold">No station assigned</h1>
      </div>
    );

  const [deliveries, drones] = await Promise.all([
    prisma.delivery.findMany({
      where: { stationId: station.id },
      include: {
        client: { select: { name: true } },
        drone: { select: { droneCode: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.drone.findMany({
      where: { stationId: station.id, status: "AVAILABLE" },
      select: { id: true, droneCode: true, batteryPercent: true, payloadCapacity: true, stationId: true },
    }),
  ]);

  return (
    <OperatorDeliveriesClient
      initialDeliveries={JSON.parse(JSON.stringify(deliveries))}
      stationId={station.id}
      stationName={station.name}
      availableDrones={drones}
    />
  );
}
