import type { APIRoute } from "astro";
import { getSessionFromCookie, destroySession } from "../../../lib/auth";
import { sessionCookie } from "../../../lib/cookie";

export const POST: APIRoute = async ({ request }) => {
  const cookie = request.headers.get("cookie");
  const sessionId = getSessionFromCookie(cookie);

  if (sessionId) {
    destroySession(sessionId);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": sessionCookie("", 0),
    },
  });
};