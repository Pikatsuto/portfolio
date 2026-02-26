import { defineMiddleware } from "astro:middleware";
import { getSessionFromCookie, validateSession, isMaintenanceMode } from "./lib/auth";

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const cookie = context.request.headers.get("cookie");
  const sessionId = getSessionFromCookie(cookie);
  const authenticated = validateSession(sessionId);

  // Expose admin status to all pages via locals
  context.locals.isAdmin = authenticated;

  // --- Admin routes protection ---
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!authenticated) {
      return context.redirect("/admin/login");
    }
  }

  // --- API mutation protection ---
  // GET requests to public API routes are allowed without auth
  // All other API methods require auth (except login)
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/login")) {
    const method = context.request.method;
    if (method !== "GET" && !authenticated) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // --- Maintenance mode ---
  const maintenance = await isMaintenanceMode();
  context.locals.maintenance = maintenance;

  if (maintenance && !authenticated) {
    // Allow access to login, API auth, and maintenance page itself
    if (
      pathname !== "/maintenance" &&
      pathname !== "/admin/login" &&
      !pathname.startsWith("/api/auth/")
    ) {
      return context.redirect("/maintenance");
    }
  }

  return next();
});