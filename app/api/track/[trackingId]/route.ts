import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ trackingId: string }> }) {
  const { trackingId } = await params;
  const delivery = await prisma.delivery.findUnique({
    where: { trackingId },
    select: {
      trackingId: true, status: true, estimatedETA: true,
      pickupAddress: true, pickupLat: true, pickupLng: true,
      dropAddress: true, dropLat: true, dropLng: true,
      priority: true, createdAt: true, updatedAt: true,
      drone: { select: { droneCode: true, currentLat: true, currentLng: true, batteryPercent: true } },
      logs: { orderBy: { createdAt: "asc" }, select: { status: true, message: true, createdAt: true, lat: true, lng: true } },
    },
  });
  if (!delivery) return Response.json({ error: "Delivery not found" }, { status: 404 });
  return Response.json(delivery);
}
