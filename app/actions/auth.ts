"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import {
  LoginSchema,
  SignupSchema,
  LoginFormState,
  SignupFormState,
} from "@/lib/definitions";

export async function login(
  state: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  // 1. Validate form fields
  const validatedFields = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;

  // 2. Check if user exists
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return {
      message: "Invalid email or password.",
    };
  }

  // 3. Verify password
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return {
      message: "Invalid email or password.",
    };
  }

  // 4. Create session
  await createSession(user.id, user.role);

  // 5. Redirect to role-based dashboard
  const dashboardMap: Record<string, string> = {
    ADMIN: "/admin",
    OPERATOR: "/operator",
    CLIENT: "/client",
  };

  redirect(dashboardMap[user.role] || "/client");
}

export async function signup(
  state: SignupFormState,
  formData: FormData
): Promise<SignupFormState> {
  // 1. Validate form fields
  const validatedFields = SignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, password, phone } = validatedFields.data;

  // 2. Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return {
      message: "An account with this email already exists.",
    };
  }

  // 3. Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 4. Create user (always CLIENT role for self-signup)
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "CLIENT",
      phone: phone || null,
    },
  });

  if (!user) {
    return {
      message: "An error occurred while creating your account.",
    };
  }

  // 5. Create session and redirect
  await createSession(user.id, user.role);
  redirect("/client");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
