import { createHmac, randomBytes, createHash } from "node:crypto";

const hmacKey = import.meta.env.POW_HMAC_KEY || "dev-pow-secret-key-change-me";
const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Generate a PoW challenge with expiration. The client must find `number` such that SHA-256(salt + number) === hash */
export function generateChallenge() {
  const expires = Date.now() + CHALLENGE_TTL_MS;
  const salt = randomBytes(16).toString("hex") + ":" + expires;
  const number = Math.floor(Math.random() * 100_000);
  const hash = createHash("sha256")
    .update(salt + number)
    .digest("hex");
  const signature = createHmac("sha256", hmacKey).update(hash).digest("hex");
  return { salt, hash, signature, maxNumber: 100_000 };
}

/** Verify a PoW solution: check expiration, recompute hash, and validate HMAC signature */
export function verifyChallenge(
  salt: string,
  number: number,
  signature: string,
): boolean {
  // Check expiration
  const parts = salt.split(":");
  const expires = Number(parts[parts.length - 1]);
  if (isNaN(expires) || Date.now() > expires) return false;

  const hash = createHash("sha256")
    .update(salt + number)
    .digest("hex");
  const expected = createHmac("sha256", hmacKey).update(hash).digest("hex");
  return signature === expected;
}