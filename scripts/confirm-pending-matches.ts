import { readFileSync } from "fs";
import { resolve } from "path";
import { applyConfirmedMatch } from "../lib/match/apply-match";
import { createServiceClient } from "../lib/supabase/admin";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  const contents = readFileSync(envPath, "utf8");

  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvLocal();

  const admin = createServiceClient();
  const { data: pending } = await admin
    .from("matches")
    .select("id, status")
    .in("status", ["pending", "counter_proposed"]);

  let confirmed = 0;
  for (const match of pending ?? []) {
    const result = await applyConfirmedMatch(match.id);
    if (result.success) confirmed++;
    else console.error(`Failed to confirm ${match.id}:`, result.error);
  }

  console.log(`Confirmed ${confirmed} pending match(es).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
