import type { APIRoute } from "astro";
import { verifyPassword, createSession } from "../../../lib/auth";
import { sessionCookie } from "../../../lib/cookie";

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { password } = body as { password?: string };

  if (!password || !verifyPassword(password)) {
    return new Response(JSON.stringify({ error: "Mot de passe incorrect" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sessionId = createSession();

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": sessionCookie(sessionId),
    },
  });
};