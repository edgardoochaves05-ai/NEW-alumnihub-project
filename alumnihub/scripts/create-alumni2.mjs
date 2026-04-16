/**
 * One-time script: creates a dummy alumni account via Supabase Admin API.
 * Run from the alumnihub/ directory:
 *   node scripts/create-alumni2.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../.env");
const env = {};
try {
  readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const [key, ...rest] = line.split("=");
      if (key && rest.length) env[key.trim()] = rest.join("=").trim();
    });
} catch {
  console.error("Could not read .env file at", envPath);
  process.exit(1);
}

const SUPABASE_URL     = env["VITE_SUPABASE_URL"];
const SERVICE_ROLE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EMAIL    = "maria.santos@alumnihub.com";
const PASSWORD = "Alumni@Hub2026!";

async function main() {
  console.log("Creating dummy alumni account…");

  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: {
      role: "alumni",
      first_name: "Maria",
      last_name: "Santos",
    },
  });

  if (authErr) {
    if (authErr.message?.toLowerCase().includes("already been registered")) {
      console.log("Auth user already exists — skipping auth creation.");
    } else {
      console.error("Auth error:", authErr.message);
      process.exit(1);
    }
  } else {
    console.log("Auth user created:", authData.user.id);
  }

  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) { console.error("listUsers error:", listErr.message); process.exit(1); }

  const found = users.find((u) => u.email === EMAIL);
  if (!found) { console.error("User not found after creation."); process.exit(1); }

  const { error: profileErr } = await supabase
    .from("profiles")
    .upsert(
      {
        id: found.id,
        email: EMAIL,
        role: "alumni",
        first_name: "Maria",
        last_name: "Santos",
        program: "BS Information Systems",
        department: "College of Information Technology",
        graduation_year: 2023,
        batch_year: 2023,
        student_number: "2019-00123",
      },
      { onConflict: "id" }
    );

  if (profileErr) {
    console.error("Profile upsert error:", profileErr.message);
    process.exit(1);
  }

  console.log("\n✓ Alumni account ready.");
  console.log("─────────────────────────────");
  console.log("  Email   :", EMAIL);
  console.log("  Password:", PASSWORD);
  console.log("  Role    : alumni");
  console.log("─────────────────────────────");
}

main();
