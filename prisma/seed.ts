import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...");

  // ─── Clear existing data ───────────────────────────────────
  await prisma.deliveryLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.drone.deleteMany();
  await prisma.station.deleteMany();
  await prisma.user.deleteMany();

  console.log("🗑️  Cleared existing data");

  // ─── Create Users ──────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@skydrop.com",
      password: hashedPassword,
      name: "Arun Kumar",
      role: "ADMIN",
      phone: "+91-9876543210",
    },
  });
  console.log("👤 Admin created:", admin.email);

  const operator1 = await prisma.user.create({
    data: {
      email: "operator1@skydrop.com",
      password: hashedPassword,
      name: "Rahul Sharma",
      role: "OPERATOR",
      phone: "+91-9876543211",
    },
  });

  const operator2 = await prisma.user.create({
    data: {
      email: "operator2@skydrop.com",
      password: hashedPassword,
      name: "Priya Patel",
      role: "OPERATOR",
      phone: "+91-9876543212",
    },
  });
  console.log("👤 2 Operators created");

  const client1 = await prisma.user.create({
    data: {
      email: "client1@gmail.com",
      password: hashedPassword,
      name: "Vikram Foods",
      role: "CLIENT",
      phone: "+91-9876543213",
    },
  });

  const client2 = await prisma.user.create({
    data: {
      email: "client2@gmail.com",
      password: hashedPassword,
      name: "Meera Pharma",
      role: "CLIENT",
      phone: "+91-9876543214",
    },
  });

  const client3 = await prisma.user.create({
    data: {
      email: "client3@gmail.com",
      password: hashedPassword,
      name: "QuickMart Express",
      role: "CLIENT",
      phone: "+91-9876543215",
    },
  });
  console.log("👤 3 Clients created");

  // ─── Create Stations (Kolkata) ─────────────────────────────
  const station1 = await prisma.station.create({
    data: {
      name: "SkyDrop Hub - Salt Lake",
      address: "Sector V, Salt Lake City, Kolkata 700091",
      latitude: 22.5726,
      longitude: 88.4345,
      status: "ACTIVE",
      operatorId: operator1.id,
    },
  });

  const station2 = await prisma.station.create({
    data: {
      name: "SkyDrop Hub - Park Street",
      address: "Park Street Area, Kolkata 700016",
      latitude: 22.5505,
      longitude: 88.3516,
      status: "ACTIVE",
      operatorId: operator2.id,
    },
  });

  const station3 = await prisma.station.create({
    data: {
      name: "SkyDrop Hub - Howrah",
      address: "Howrah Station Area, Howrah 711101",
      latitude: 22.5834,
      longitude: 88.3375,
      status: "ACTIVE",
      operatorId: null,
    },
  });
  console.log("🏢 3 Stations created");

  // ─── Create Drones ─────────────────────────────────────────
  const droneData = [
    { droneCode: "SD-001", batteryPercent: 95, payloadCapacity: 5.0, status: "AVAILABLE" as const, stationId: station1.id, currentLat: 22.5726, currentLng: 88.4345 },
    { droneCode: "SD-002", batteryPercent: 78, payloadCapacity: 3.5, status: "AVAILABLE" as const, stationId: station1.id, currentLat: 22.5726, currentLng: 88.4345 },
    { droneCode: "SD-003", batteryPercent: 45, payloadCapacity: 5.0, status: "CHARGING" as const, stationId: station2.id, currentLat: 22.5505, currentLng: 88.3516 },
    { droneCode: "SD-004", batteryPercent: 100, payloadCapacity: 8.0, status: "AVAILABLE" as const, stationId: station2.id, currentLat: 22.5505, currentLng: 88.3516 },
    { droneCode: "SD-005", batteryPercent: 20, payloadCapacity: 5.0, status: "MAINTENANCE" as const, stationId: station3.id, currentLat: 22.5834, currentLng: 88.3375 },
    { droneCode: "SD-006", batteryPercent: 88, payloadCapacity: 10.0, status: "AVAILABLE" as const, stationId: station3.id, currentLat: 22.5834, currentLng: 88.3375 },
  ];

  const drones = [];
  for (const d of droneData) {
    const drone = await prisma.drone.create({ data: d });
    drones.push(drone);
  }
  console.log("🚁 6 Drones created");

  // ─── Create Deliveries ─────────────────────────────────────
  const deliveries = [
    {
      trackingId: "SKY-2026-001",
      pickupAddress: "Sector V, Salt Lake, Kolkata",
      pickupLat: 22.5726, pickupLng: 88.4345,
      dropAddress: "New Town, Rajarhat, Kolkata",
      dropLat: 22.5958, dropLng: 88.4846,
      weightKg: 2.5,
      priority: "HIGH" as const,
      status: "DELIVERED" as const,
      estimatedETA: "25 mins",
      clientId: client1.id,
      stationId: station1.id,
      droneId: drones[0].id,
    },
    {
      trackingId: "SKY-2026-002",
      pickupAddress: "Park Street, Kolkata",
      pickupLat: 22.5505, pickupLng: 88.3516,
      dropAddress: "Esplanade, Kolkata",
      dropLat: 22.5626, dropLng: 88.3534,
      weightKg: 1.0,
      priority: "MEDIUM" as const,
      status: "IN_TRANSIT" as const,
      estimatedETA: "12 mins",
      clientId: client2.id,
      stationId: station2.id,
      droneId: drones[3].id,
    },
    {
      trackingId: "SKY-2026-003",
      pickupAddress: "Howrah Station, Howrah",
      pickupLat: 22.5834, pickupLng: 88.3375,
      dropAddress: "Shibpur, Howrah",
      dropLat: 22.5718, dropLng: 88.3140,
      weightKg: 4.0,
      priority: "URGENT" as const,
      status: "ASSIGNED" as const,
      estimatedETA: "18 mins",
      clientId: client1.id,
      stationId: station3.id,
      droneId: drones[5].id,
    },
    {
      trackingId: "SKY-2026-004",
      pickupAddress: "Gariahat, Kolkata",
      pickupLat: 22.5176, pickupLng: 88.3698,
      dropAddress: "Jadavpur, Kolkata",
      dropLat: 22.4987, dropLng: 88.3714,
      weightKg: 3.2,
      priority: "LOW" as const,
      status: "PENDING" as const,
      estimatedETA: null,
      clientId: client3.id,
      stationId: null,
      droneId: null,
    },
    {
      trackingId: "SKY-2026-005",
      pickupAddress: "Salt Lake Sector III, Kolkata",
      pickupLat: 22.5785, pickupLng: 88.4175,
      dropAddress: "Dum Dum, Kolkata",
      dropLat: 22.6233, dropLng: 88.4206,
      weightKg: 0.5,
      priority: "MEDIUM" as const,
      status: "APPROVED" as const,
      estimatedETA: "30 mins",
      clientId: client2.id,
      stationId: station1.id,
      droneId: null,
    },
    {
      trackingId: "SKY-2026-006",
      pickupAddress: "College Street, Kolkata",
      pickupLat: 22.5772, pickupLng: 88.3614,
      dropAddress: "Shyambazar, Kolkata",
      dropLat: 22.5950, dropLng: 88.3738,
      weightKg: 1.8,
      priority: "HIGH" as const,
      status: "PICKED_UP" as const,
      estimatedETA: "15 mins",
      clientId: client1.id,
      stationId: station2.id,
      droneId: drones[2].id,
    },
    {
      trackingId: "SKY-2026-007",
      pickupAddress: "Behala, Kolkata",
      pickupLat: 22.4885, pickupLng: 88.3255,
      dropAddress: "Tollygunge, Kolkata",
      dropLat: 22.4998, dropLng: 88.3476,
      weightKg: 6.0,
      priority: "MEDIUM" as const,
      status: "FAILED" as const,
      estimatedETA: null,
      clientId: client3.id,
      stationId: station2.id,
      droneId: drones[3].id,
    },
    {
      trackingId: "SKY-2026-008",
      pickupAddress: "Rajarhat, Kolkata",
      pickupLat: 22.5956, pickupLng: 88.4833,
      dropAddress: "Baguiati, Kolkata",
      dropLat: 22.6044, dropLng: 88.4238,
      weightKg: 2.0,
      priority: "LOW" as const,
      status: "DELIVERED" as const,
      estimatedETA: "20 mins",
      clientId: client2.id,
      stationId: station1.id,
      droneId: drones[1].id,
    },
    {
      trackingId: "SKY-2026-009",
      pickupAddress: "Belur Math, Howrah",
      pickupLat: 22.6320, pickupLng: 88.3508,
      dropAddress: "Dakshineswar, Kolkata",
      dropLat: 22.6553, dropLng: 88.3578,
      weightKg: 1.2,
      priority: "HIGH" as const,
      status: "CANCELLED" as const,
      estimatedETA: null,
      clientId: client1.id,
      stationId: station3.id,
      droneId: null,
    },
    {
      trackingId: "SKY-2026-010",
      pickupAddress: "Ultadanga, Kolkata",
      pickupLat: 22.5891, pickupLng: 88.3919,
      dropAddress: "Lake Town, Kolkata",
      dropLat: 22.5979, dropLng: 88.3993,
      weightKg: 0.8,
      priority: "MEDIUM" as const,
      status: "PENDING" as const,
      estimatedETA: null,
      clientId: client3.id,
      stationId: null,
      droneId: null,
    },
  ];

  for (const del of deliveries) {
    await prisma.delivery.create({ data: del });
  }
  console.log("📦 10 Deliveries created");

  // ─── Create Delivery Logs ─────────────────────────────────
  const logsData = [
    // Delivery 1 - Full lifecycle (DELIVERED)
    { deliveryId: "SKY-2026-001", statuses: ["PENDING", "APPROVED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"] as const },
    // Delivery 2 - In transit
    { deliveryId: "SKY-2026-002", statuses: ["PENDING", "APPROVED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT"] as const },
    // Delivery 3 - Assigned
    { deliveryId: "SKY-2026-003", statuses: ["PENDING", "APPROVED", "ASSIGNED"] as const },
    // Delivery 6 - Picked up
    { deliveryId: "SKY-2026-006", statuses: ["PENDING", "APPROVED", "ASSIGNED", "PICKED_UP"] as const },
    // Delivery 7 - Failed
    { deliveryId: "SKY-2026-007", statuses: ["PENDING", "APPROVED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "FAILED"] as const },
    // Delivery 8 - Delivered
    { deliveryId: "SKY-2026-008", statuses: ["PENDING", "APPROVED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"] as const },
    // Delivery 9 - Cancelled
    { deliveryId: "SKY-2026-009", statuses: ["PENDING", "CANCELLED"] as const },
  ];

  const statusMessages: Record<string, string> = {
    PENDING: "Delivery request received",
    APPROVED: "Delivery approved by admin",
    ASSIGNED: "Drone assigned for pickup",
    PICKED_UP: "Package picked up by drone",
    IN_TRANSIT: "Package in transit",
    DELIVERED: "Package delivered successfully",
    FAILED: "Delivery failed - drone returned to station",
    CANCELLED: "Delivery cancelled by client",
  };

  for (const logGroup of logsData) {
    const delivery = await prisma.delivery.findUnique({
      where: { trackingId: logGroup.deliveryId },
    });
    if (!delivery) continue;

    let minuteOffset = 0;
    for (const status of logGroup.statuses) {
      await prisma.deliveryLog.create({
        data: {
          deliveryId: delivery.id,
          status,
          message: statusMessages[status],
          lat: delivery.pickupLat + (Math.random() * 0.01 - 0.005),
          lng: delivery.pickupLng + (Math.random() * 0.01 - 0.005),
          createdAt: new Date(Date.now() - (60 - minuteOffset) * 60 * 1000),
        },
      });
      minuteOffset += 8;
    }
  }
  console.log("📋 Delivery logs created");

  // ─── Create Notifications ──────────────────────────────────
  const notifications = [
    { userId: client1.id, title: "Package Delivered", message: "Your delivery SKY-2026-001 has been delivered successfully!", type: "PACKAGE_DELIVERED" as const, read: true },
    { userId: client2.id, title: "Drone Assigned", message: "Drone SD-004 has been assigned to your delivery SKY-2026-002.", type: "DRONE_ASSIGNED" as const, read: false },
    { userId: client1.id, title: "Delivery Approved", message: "Your delivery SKY-2026-003 has been approved.", type: "DELIVERY_APPROVED" as const, read: false },
    { userId: client3.id, title: "Delivery Failed", message: "Your delivery SKY-2026-007 has failed. Please contact support.", type: "DELIVERY_FAILED" as const, read: false },
    { userId: operator1.id, title: "New Delivery", message: "A new delivery has been assigned to your station.", type: "GENERAL" as const, read: false },
    { userId: operator2.id, title: "Drone Alert", message: "Drone SD-003 battery is low. Please charge.", type: "GENERAL" as const, read: true },
  ];

  for (const n of notifications) {
    await prisma.notification.create({ data: n });
  }
  console.log("🔔 Notifications created");

  console.log("\n✅ Seed completed successfully!");
  console.log("\n📋 Login credentials:");
  console.log("  Admin:      admin@skydrop.com / password123");
  console.log("  Operator 1: operator1@skydrop.com / password123");
  console.log("  Operator 2: operator2@skydrop.com / password123");
  console.log("  Client 1:   client1@gmail.com / password123");
  console.log("  Client 2:   client2@gmail.com / password123");
  console.log("  Client 3:   client3@gmail.com / password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
