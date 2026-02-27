import type { APIRoute } from "astro";
import { db } from "../../../../db";
import { messages } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";

const host = import.meta.env.SMTP_HOST;
const port = Number(import.meta.env.SMTP_PORT) || 587;
const user = import.meta.env.SMTP_USER;
const pass = import.meta.env.SMTP_PASS;

const smtpConfigured = !!(host && user && pass);

const transporter = smtpConfigured
  ? nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
  : null;

export const POST: APIRoute = async ({ params, request }) => {
  const id = Number(params.id);
  const msg = await db.select().from(messages).where(eq(messages.id, id)).get();
  if (!msg) {
    return new Response(JSON.stringify({ error: "Message introuvable" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = (await request.json()) as { text?: string };
  if (!body.text?.trim()) {
    return new Response(JSON.stringify({ error: "Le contenu de la réponse est vide" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!transporter) {
    return new Response(JSON.stringify({ error: "SMTP non configuré" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await transporter.sendMail({
      from: `"Gabriel Guillou" <${user}>`,
      to: msg.email,
      subject: `Re: ${msg.subject}`,
      text: body.text!.trim(),
    });
  } catch (err) {
    console.error("[reply] Email send failed:", err);
    return new Response(JSON.stringify({ error: "Erreur lors de l'envoi de l'email" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};