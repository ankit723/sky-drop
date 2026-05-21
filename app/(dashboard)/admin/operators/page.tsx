import { requireRole } from "@/lib/dal";
import prisma from "@/lib/prisma";
import OperatorsPageClient from "@/app/components/admin/operators-page-client";

export default async function OperatorsPage() {
  await requireRole(["ADMIN"]);

  const [operators, stations] = await Promise.all([
    prisma.user.findMany({
      where: { role: "OPERATOR" },
      select: { id: true, name: true, email: true, phone: true, createdAt: true, station: { select: { id: true, name: true, status: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.station.findMany({ select: { id: true, name: true }, where: { operatorId: null } }),
  ]);

  return <OperatorsPageClient initialOperators={JSON.parse(JSON.stringify(operators))} stations={stations} />;
}
