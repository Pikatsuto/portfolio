import { mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

// Ensure data directory
mkdirSync("data", { recursive: true });

// Apply pending migrations (idempotent)
console.log("Applying migrations...");
const sqlite = new Database("data/portfolio.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
migrate(drizzle(sqlite), { migrationsFolder: "src/db/migrations" });

// Seed if database is empty
let needsSeed = false;
try {
  const row = sqlite.prepare("SELECT COUNT(*) as c FROM posts").get();
  needsSeed = row.c === 0;
} catch {
  needsSeed = true;
}
sqlite.close();

if (needsSeed) {
  console.log("Seeding database...");
  execSync("npx tsx src/db/seed.ts", { stdio: "inherit" });
}

console.log("Ready.");