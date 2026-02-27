import type { APIRoute } from "astro";
import { generateChallenge } from "../../../lib/pow";

export const GET: APIRoute = async () => {
  const challenge = generateChallenge();
  return new Response(JSON.stringify(challenge), {
    headers: { "Content-Type": "application/json" },
  });
};
