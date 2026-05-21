import { requireRole } from "@/lib/dal";
import prisma from "@/lib/prisma";
import StationsPageClient from "@/app/components/admin/stations-page-client";

export default async function StationsPage() {
  await requireRole(["ADMIN"]);

  const stations = await prisma.station.findMany({
    include: {
      operator: { select: { id: true, name: true, email: true } },
      _count: { select: { drones: true, deliveries: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return <StationsPageClient initialStations={JSON.parse(JSON.stringify(stations))} />;
}
