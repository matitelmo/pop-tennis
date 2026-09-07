import { readFileSync } from "fs";
import { resolve } from "path";
import { createServiceClient } from "../lib/supabase/admin";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  try {
    const contents = readFileSync(envPath, "utf8");
    for (const line of contents.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    console.warn("No .env.local found");
  }
}

/** Edit this list with beta user emails before running. */
const COMPED_EMAILS: string[] = [
  // "player1@example.com",
  // "player2@example.com",
];

async function main() {
  loadEnvLocal();
  const admin = createServiceClient();

  let updated = 0;
  for (const email of COMPED_EMAILS) {
    const { data: users } = await admin.auth.admin.listUsers();
    const user = users.users.find((u) => u.email === email);
    if (!user) {
      console.warn(`User not found: ${email}`);
      continue;
    }
    await admin
      .from("profiles")
      .update({ subscription_status: "comped" })
      .eq("id", user.id);
    console.log(`Comped: ${email}`);
    updated++;
  }

  console.log(`Done. ${updated} account(s) marked as comped.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
