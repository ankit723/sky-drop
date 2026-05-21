import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  // Unassign from station first
  await prisma.station.updateMany({ where: { operatorId: id }, data: { operatorId: null } });
  await prisma.notification.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });
  return Response.json({ success: true });
}
