import { db } from "../db";
import { settings } from "../db/schema";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";

// Admin password from env (ADMIN_PASSWORD), fallback for dev
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin";

// In-memory session store (sufficient for single-admin, single-process)
const sessions = new Map<string, { createdAt: number }>();
const SESSION_TTL = 1000 * 60 * 60 * 24; // 24h

export function verifyPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function createSession(): string {
  const id = crypto.randomBytes(32).toString("hex");
  sessions.set(id, { createdAt: Date.now() });
  return id;
}

export function validateSession(sessionId: string | undefined): boolean {
  if (!sessionId) return false;
  const session = sessions.get(sessionId);
  if (!session) return false;
  if (Date.now() - session.createdAt > SESSION_TTL) {
    sessions.delete(sessionId);
    return false;
  }
  return true;
}

export function destroySession(sessionId: string): void {
  sessions.delete(sessionId);
}

export function getSessionFromCookie(cookieHeader: string | null): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
  return match?.[1];
}

export function isAdmin(request: Request): boolean {
  const cookie = request.headers.get("cookie");
  const sessionId = getSessionFromCookie(cookie);
  return validateSession(sessionId);
}

export async function isMaintenanceMode(): Promise<boolean> {
  const row = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "maintenance"))
    .get();
  return row?.value === "true";
}