import type { APIRoute } from "astro";
import { verifyChallenge } from "../../../lib/pow";
import { sendContactEmail } from "../../../lib/mail";
import { db } from "../../../db";
import { messages } from "../../../db/schema";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /https?:\/\//gi;
const MIN_SUBMIT_MS = 3_000; // 3 seconds minimum between page load and submit
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5; // max submissions per IP per hour

// In-memory rate limit store (IP -> timestamps[])
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  rateLimitMap.set(ip, recent);
  return recent.length < RATE_LIMIT_MAX;
}

function recordSubmission(ip: string): void {
  const timestamps = rateLimitMap.get(ip) || [];
  timestamps.push(Date.now());
  rateLimitMap.set(ip, timestamps);
}

function json(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || clientAddress;

  // Rate limit
  if (!checkRateLimit(ip)) {
    return json({ error: "Trop de messages envoyés. Réessayez plus tard." }, 429);
  }

  const body = (await request.json()) as {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
    website?: string;
    ts?: string;
    salt?: string;
    number?: number;
    signature?: string;
  };

  const { name, email, subject, message, website, ts, salt, number, signature } = body;

  // Honeypot — if filled, it's a bot (return fake success)
  if (website) {
    return json({ ok: true });
  }

  // Timing check — reject if submitted too fast
  const formTs = Number(ts);
  if (!formTs || Date.now() - formTs < MIN_SUBMIT_MS) {
    return json({ error: "Formulaire soumis trop rapidement. Réessayez." }, 403);
  }

  // Verify PoW
  if (!salt || number == null || !signature || !verifyChallenge(salt, number, signature)) {
    return json({ error: "Vérification anti-bot échouée" }, 403);
  }

  // Validate fields
  const errors: string[] = [];
  if (!name?.trim()) errors.push("Le nom est requis");
  if (!email?.trim() || !EMAIL_RE.test(email)) errors.push("Email invalide");
  if (!subject?.trim()) errors.push("L'objet est requis");
  if (!message?.trim()) errors.push("Le message est requis");

  if (errors.length > 0) {
    return json({ error: errors.join(", ") }, 400);
  }

  // URL spam detection — reject messages with 3+ URLs
  const urlCount = (message!.match(URL_RE) || []).length;
  if (urlCount >= 3) {
    return json({ error: "Le message contient trop de liens." }, 400);
  }

  // All checks passed — record submission for rate limit
  recordSubmission(ip);

  // Insert into DB
  await db.insert(messages).values({
    name: name!.trim(),
    email: email!.trim(),
    subject: subject!.trim(),
    message: message!.trim(),
    createdAt: new Date().toISOString(),
  });

  // Send email (non-blocking — don't fail if SMTP is down)
  try {
    await sendContactEmail(name!.trim(), email!.trim(), subject!.trim(), message!.trim());
  } catch (err) {
    console.error("[contact] Email send failed:", err);
  }

  return json({ ok: true });
};
