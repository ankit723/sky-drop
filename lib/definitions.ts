import { z } from "zod";

// ─── Auth Schemas ────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }).trim(),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." })
    .trim(),
});

export const SignupSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters." })
    .trim(),
  email: z.string().email({ message: "Please enter a valid email." }).trim(),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." })
    .trim(),
  phone: z.string().optional(),
});

// ─── Delivery Schemas ────────────────────────────────────────

export const CreateDeliverySchema = z.object({
  pickupAddress: z
    .string()
    .min(3, { message: "Pickup address is required." }),
  pickupLat: z.number(),
  pickupLng: z.number(),
  dropAddress: z.string().min(3, { message: "Drop address is required." }),
  dropLat: z.number(),
  dropLng: z.number(),
  weightKg: z.number().min(0.1).max(25),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
});

export const UpdateDeliveryStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "APPROVED",
    "ASSIGNED",
    "PICKED_UP",
    "IN_TRANSIT",
    "DELIVERED",
    "FAILED",
    "CANCELLED",
  ]),
  message: z.string().optional(),
  droneId: z.string().optional(),
  stationId: z.string().optional(),
});

// ─── Station Schemas ─────────────────────────────────────────

export const StationSchema = z.object({
  name: z.string().min(2, { message: "Station name is required." }),
  address: z.string().min(3, { message: "Address is required." }),
  latitude: z.number(),
  longitude: z.number(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  operatorId: z.string().nullable().optional(),
});

// ─── Drone Schemas ───────────────────────────────────────────

export const DroneSchema = z.object({
  droneCode: z.string().min(2, { message: "Drone code is required." }),
  batteryPercent: z.number().min(0).max(100).default(100),
  payloadCapacity: z.number().min(0.1).default(5.0),
  status: z
    .enum(["AVAILABLE", "CHARGING", "BUSY", "MAINTENANCE"])
    .default("AVAILABLE"),
  currentLat: z.number().nullable().optional(),
  currentLng: z.number().nullable().optional(),
  stationId: z.string({ message: "Station is required." }),
});

// ─── Operator Schema ─────────────────────────────────────────

export const CreateOperatorSchema = z.object({
  name: z.string().min(2, { message: "Name is required." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
  phone: z.string().optional(),
  stationId: z.string().nullable().optional(),
});

// ─── Types ───────────────────────────────────────────────────

export type LoginFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export type SignupFormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
        phone?: string[];
      };
      message?: string;
    }
  | undefined;

export type SessionPayload = {
  userId: string;
  role: "ADMIN" | "OPERATOR" | "CLIENT";
  expiresAt: Date;
};
