import type { APIRoute } from "astro";
import { verifyChallenge } from "../../../lib/pow";
import { sendContactEmail } from "../../../lib/mail";
import { db } from "../../../db";
import { messages } from "../../../db/schema";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
    salt?: string;
    number?: number;
    signature?: string;
  };

  const { name, email, subject, message, salt, number, signature } = body;

  // Verify PoW
  if (!salt || number == null || !signature || !verifyChallenge(salt, number, signature)) {
    return new Response(JSON.stringify({ error: "Vérification anti-bot échouée" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate fields
  const errors: string[] = [];
  if (!name?.trim()) errors.push("Le nom est requis");
  if (!email?.trim() || !EMAIL_RE.test(email)) errors.push("Email invalide");
  if (!subject?.trim()) errors.push("L'objet est requis");
  if (!message?.trim()) errors.push("Le message est requis");

  if (errors.length > 0) {
    return new Response(JSON.stringify({ error: errors.join(", ") }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

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

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
