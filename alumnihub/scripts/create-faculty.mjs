/**
 * One-time script: creates the AlumniHub faculty account via Supabase Admin API.
 * Run from the alumnihub/ directory:
 *   node scripts/create-faculty.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── Load .env manually ────────────────────────────────────────
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

// ── Credentials ───────────────────────────────────────────────
const FACULTY_EMAIL    = "faculty@alumnihub.com";
const FACULTY_PASSWORD = "Faculty@Hub2026!";

async function main() {
  console.log("Creating faculty account…");

  // 1. Create auth user (email pre-confirmed, no email sent)
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: FACULTY_EMAIL,
    password: FACULTY_PASSWORD,
    email_confirm: true,
    user_metadata: {
      role: "faculty",
      first_name: "Faculty",
      last_name: "AlumniHub",
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

  // 2. Fetch the user ID
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) { console.error("listUsers error:", listErr.message); process.exit(1); }

  const facultyUser = users.find((u) => u.email === FACULTY_EMAIL);
  if (!facultyUser) { console.error("Faculty user not found after creation."); process.exit(1); }

  // 3. Upsert the profiles row with role = 'faculty'
  const { error: profileErr } = await supabase
    .from("profiles")
    .upsert(
      {
        id: facultyUser.id,
        email: FACULTY_EMAIL,
        role: "faculty",
        first_name: "Faculty",
        last_name: "AlumniHub",
      },
      { onConflict: "id" }
    );

  if (profileErr) {
    console.error("Profile upsert error:", profileErr.message);
    process.exit(1);
  }

  console.log("\n✓ Faculty account ready.");
  console.log("─────────────────────────────");
  console.log("  Email   :", FACULTY_EMAIL);
  console.log("  Password:", FACULTY_PASSWORD);
  console.log("  Role    : faculty");
  console.log("─────────────────────────────");
  console.log("Log in at http://localhost:5173/login");
}

main();
