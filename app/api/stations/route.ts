import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { StationSchema } from "@/lib/definitions";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const stations = await prisma.station.findMany({
    include: {
      operator: { select: { id: true, name: true, email: true } },
      _count: { select: { drones: true, deliveries: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(stations);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = StationSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const station = await prisma.station.create({ data: parsed.data });
  return Response.json(station, { status: 201 });
}
