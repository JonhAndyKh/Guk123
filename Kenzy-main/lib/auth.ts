import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const SESSION_COOKIE = "rithtopup_admin";
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export interface AdminSession {
  adminId: string;
  email: string;
  role: string;
}

export async function createSession(payload: AdminSession): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL}s`)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      adminId: payload.adminId as string,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL,
    path: "/",
  });
}

export async function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE);
}

export async function getCurrentAdmin(): Promise<AdminSession | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return await verifySession(token);
}

export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("UNAUTHORIZED");
  return admin;
}

export async function verifyAdminCredentials(email: string, password: string) {
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin || !admin.active) return null;
  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) return null;
  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });
  return { adminId: admin.id, email: admin.email, role: admin.role };
}

export { SESSION_COOKIE };
