import { requireRole } from "@/lib/dal";
import prisma from "@/lib/prisma";
import DeliveriesPageClient from "@/app/components/admin/deliveries-page-client";

export default async function AdminDeliveriesPage() {
  await requireRole(["ADMIN"]);

  const [deliveries, stations, availableDrones] = await Promise.all([
    prisma.delivery.findMany({
      include: {
        client: { select: { name: true } },
        station: { select: { name: true } },
        drone: { select: { droneCode: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.station.findMany({ select: { id: true, name: true }, where: { status: "ACTIVE" } }),
    prisma.drone.findMany({
      where: { status: "AVAILABLE" },
      select: { id: true, droneCode: true, batteryPercent: true, payloadCapacity: true, stationId: true },
    }),
  ]);

  return (
    <DeliveriesPageClient
      initialDeliveries={JSON.parse(JSON.stringify(deliveries))}
      stations={stations}
      availableDrones={availableDrones}
    />
  );
}
