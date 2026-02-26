import { db } from "../db";
import { settings } from "../db/schema";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";

// Admin password from env (ADMIN_PASSWORD), fallback for dev
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin";

const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24h

// Sessions stored in SQLite for reliability (survives Vite HMR + process restarts)
// Using settings table with key prefix "session:"

export function verifyPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function createSession(): string {
  const id = crypto.randomBytes(32).toString("hex");
  const expiresAt = (Date.now() + SESSION_TTL_SECONDS * 1000).toString();

  // Store session in settings table
  db.insert(settings)
    .values({ key: `session:${id}`, value: expiresAt })
    .onConflictDoUpdate({ target: settings.key, set: { value: expiresAt } })
    .run();

  return id;
}

export function validateSession(sessionId: string | undefined): boolean {
  if (!sessionId) return false;

  const row = db
    .select()
    .from(settings)
    .where(eq(settings.key, `session:${sessionId}`))
    .get();

  if (!row) return false;

  const expiresAt = parseInt(row.value, 10);
  if (Date.now() > expiresAt) {
    db.delete(settings).where(eq(settings.key, `session:${sessionId}`)).run();
    return false;
  }

  return true;
}

export function destroySession(sessionId: string): void {
  db.delete(settings).where(eq(settings.key, `session:${sessionId}`)).run();
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

export function isMaintenanceMode(): boolean {
  const row = db
    .select()
    .from(settings)
    .where(eq(settings.key, "maintenance"))
    .get();
  return row?.value === "true";
}