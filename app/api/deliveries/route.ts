import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { CreateDeliverySchema } from "@/lib/definitions";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let where = {};
  if (session.role === "CLIENT") where = { clientId: session.userId };
  else if (session.role === "OPERATOR") {
    const station = await prisma.station.findUnique({ where: { operatorId: session.userId } });
    if (station) where = { stationId: station.id };
  }

  const deliveries = await prisma.delivery.findMany({ where, include: { client: { select: { name: true } }, station: { select: { name: true } }, drone: { select: { droneCode: true } } }, orderBy: { createdAt: "desc" } });
  return Response.json(deliveries);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "CLIENT") return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateDeliverySchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const trackingId = `SKY-${Date.now().toString(36).toUpperCase()}`;
  const delivery = await prisma.delivery.create({
    data: { ...parsed.data, trackingId, clientId: session.userId, status: "PENDING" },
  });

  await prisma.deliveryLog.create({ data: { deliveryId: delivery.id, status: "PENDING", message: "Delivery request received" } });
  return Response.json(delivery, { status: 201 });
}
