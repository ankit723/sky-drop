import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "OPERATOR"))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const drone = await prisma.drone.update({ where: { id }, data: body });
  return Response.json(drone);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const activeDeliveries = await prisma.delivery.count({
    where: { droneId: id, status: { in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"] } },
  });
  if (activeDeliveries > 0) return Response.json({ error: "Cannot delete drone with active deliveries" }, { status: 400 });

  await prisma.drone.delete({ where: { id } });
  return Response.json({ success: true });
}
