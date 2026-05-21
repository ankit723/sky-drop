import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const delivery = await prisma.delivery.findUnique({
    where: { id },
    include: {
      client: { select: { name: true, email: true } },
      station: { select: { id: true, name: true } },
      drone: { select: { id: true, droneCode: true, batteryPercent: true } },
      logs: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!delivery) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(delivery);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role === "CLIENT")
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { status, droneId, stationId, message } = body;

  // Build the update data
  const updateData: Record<string, unknown> = {};
  if (status) updateData.status = status;
  if (droneId) updateData.droneId = droneId;
  if (stationId) updateData.stationId = stationId;

  // When assigning a drone, mark it as BUSY
  if (droneId && status === "ASSIGNED") {
    await prisma.drone.update({ where: { id: droneId }, data: { status: "BUSY" } });
  }

  // When delivered or failed, mark drone as AVAILABLE
  if (status === "DELIVERED" || status === "FAILED" || status === "CANCELLED") {
    const currentDelivery = await prisma.delivery.findUnique({ where: { id }, select: { droneId: true } });
    if (currentDelivery?.droneId) {
      await prisma.drone.update({ where: { id: currentDelivery.droneId }, data: { status: "AVAILABLE" } });
    }
  }

  const delivery = await prisma.delivery.update({
    where: { id },
    data: updateData,
    include: { client: { select: { id: true, name: true } } },
  });

  // Generate a meaningful log message
  const logMessages: Record<string, string> = {
    APPROVED: "Delivery approved by admin",
    ASSIGNED: "Drone assigned for pickup",
    PICKED_UP: "Package picked up by drone",
    IN_TRANSIT: "Package in transit",
    DELIVERED: "Package delivered successfully",
    FAILED: "Delivery failed",
    CANCELLED: "Delivery cancelled",
  };

  await prisma.deliveryLog.create({
    data: {
      deliveryId: id,
      status: status || delivery.status,
      message: message || logMessages[status] || `Status updated to ${status}`,
    },
  });

  // Send notification to the client
  const notifMessages: Record<string, { title: string; msg: string; type: string }> = {
    APPROVED: { title: "Order Approved", msg: `Your delivery ${delivery.trackingId} has been approved!`, type: "DELIVERY_APPROVED" },
    ASSIGNED: { title: "Drone Assigned", msg: `A drone has been assigned to your delivery ${delivery.trackingId}`, type: "DRONE_ASSIGNED" },
    PICKED_UP: { title: "Package Picked Up", msg: `Your package ${delivery.trackingId} has been picked up by the drone`, type: "DELIVERY_APPROVED" },
    IN_TRANSIT: { title: "Package In Transit", msg: `Your package ${delivery.trackingId} is on its way!`, type: "DELIVERY_APPROVED" },
    DELIVERED: { title: "Package Delivered!", msg: `Your delivery ${delivery.trackingId} has been delivered successfully 🎉`, type: "PACKAGE_DELIVERED" },
    FAILED: { title: "Delivery Failed", msg: `Your delivery ${delivery.trackingId} could not be completed`, type: "DELIVERY_FAILED" },
  };

  if (status && notifMessages[status]) {
    const n = notifMessages[status];
    await prisma.notification.create({
      data: {
        userId: delivery.clientId,
        title: n.title,
        message: n.msg,
        type: n.type,
      },
    });
  }

  return Response.json(delivery);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN")
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  // Free the drone if assigned
  const delivery = await prisma.delivery.findUnique({ where: { id }, select: { droneId: true } });
  if (delivery?.droneId) {
    await prisma.drone.update({ where: { id: delivery.droneId }, data: { status: "AVAILABLE" } });
  }
  await prisma.deliveryLog.deleteMany({ where: { deliveryId: id } });
  await prisma.delivery.delete({ where: { id } });
  return Response.json({ success: true });
}
