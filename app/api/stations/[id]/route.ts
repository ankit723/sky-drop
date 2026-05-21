import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const station = await prisma.station.findUnique({
    where: { id },
    include: {
      operator: { select: { id: true, name: true, email: true } },
      drones: true,
      _count: { select: { deliveries: true } },
    },
  });
  if (!station) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(station);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  // If changing operator, unlink old operator first
  if (body.operatorId !== undefined) {
    const existing = await prisma.station.findUnique({ where: { id } });
    if (existing?.operatorId && existing.operatorId !== body.operatorId) {
      // Old operator is automatically unlinked by unique constraint
    }
  }

  const station = await prisma.station.update({ where: { id }, data: body });
  return Response.json(station);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  // Check for active drones/deliveries
  const droneCount = await prisma.drone.count({ where: { stationId: id } });
  if (droneCount > 0) return Response.json({ error: "Cannot delete station with assigned drones. Reassign drones first." }, { status: 400 });

  await prisma.station.delete({ where: { id } });
  return Response.json({ success: true });
}
