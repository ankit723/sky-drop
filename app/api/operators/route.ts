import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { CreateOperatorSchema } from "@/lib/definitions";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return Response.json({ error: "Unauthorized" }, { status: 401 });

  const operators = await prisma.user.findMany({
    where: { role: "OPERATOR" },
    select: { id: true, name: true, email: true, phone: true, createdAt: true, station: { select: { id: true, name: true, status: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(operators);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateOperatorSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return Response.json({ error: "Email already exists" }, { status: 400 });

  const hashedPassword = await bcrypt.hash(parsed.data.password, 10);
  const operator = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashedPassword,
      phone: parsed.data.phone || null,
      role: "OPERATOR",
    },
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
  });

  // If stationId provided, assign operator to station
  if (parsed.data.stationId) {
    await prisma.station.update({ where: { id: parsed.data.stationId }, data: { operatorId: operator.id } });
  }

  return Response.json(operator, { status: 201 });
}
