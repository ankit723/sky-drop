import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { DroneSchema } from "@/lib/definitions";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let where = {};
  if (session.role === "OPERATOR") {
    const station = await prisma.station.findUnique({ where: { operatorId: session.userId } });
    if (station) where = { stationId: station.id };
    else return Response.json([]);
  }

  const drones = await prisma.drone.findMany({
    where,
    include: { station: { select: { name: true } }, _count: { select: { deliveries: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(drones);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = DroneSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  // Check for duplicate drone code
  const exists = await prisma.drone.findUnique({ where: { droneCode: parsed.data.droneCode } });
  if (exists) return Response.json({ error: "Drone code already exists" }, { status: 400 });

  const drone = await prisma.drone.create({ data: parsed.data });
  return Response.json(drone, { status: 201 });
}
