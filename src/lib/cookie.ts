const SECURE = import.meta.env.PROD;

/**
 * Build a Set-Cookie header for the session cookie.
 * In production (HTTPS via reverse proxy), adds the Secure flag.
 */
export function sessionCookie(value: string, maxAge = 86400): string {
  const parts = [
    `session=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (SECURE) parts.push("Secure");
  return parts.join("; ");
}