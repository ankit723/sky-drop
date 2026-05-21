import { requireRole } from "@/lib/dal";
import prisma from "@/lib/prisma";
import DronesPageClient from "@/app/components/admin/drones-page-client";

export default async function DronesPage() {
  await requireRole(["ADMIN"]);

  const [drones, stations] = await Promise.all([
    prisma.drone.findMany({
      include: { station: { select: { name: true } }, _count: { select: { deliveries: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.station.findMany({ select: { id: true, name: true }, where: { status: "ACTIVE" } }),
  ]);

  return <DronesPageClient initialDrones={JSON.parse(JSON.stringify(drones))} stations={stations} />;
}
