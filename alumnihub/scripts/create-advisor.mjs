/**
 * One-time script: creates the AlumniHub career advisor account via Supabase Admin API.
 * Run from the alumnihub/ directory:
 *   node scripts/create-advisor.mjs
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
const ADVISOR_EMAIL    = "carla.reyes.advisor@tip.edu.ph";
const ADVISOR_PASSWORD = "Advisor@Hub2026!";

async function main() {
  console.log("Creating Career Advisor account…");

  // 1. Create auth user (email pre-confirmed, no email sent)
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: ADVISOR_EMAIL,
    password: ADVISOR_PASSWORD,
    email_confirm: true,
    user_metadata: {
      role: "career_advisor", // Advisors function as career_advisor level accounts
      first_name: "Carla",
      last_name: "Reyes (Advisor)",
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

  const advisorUser = users.find((u) => u.email === ADVISOR_EMAIL);
  if (!advisorUser) { console.error("Advisor user not found after creation."); process.exit(1); }

  // 3. Upsert the profiles row with role = 'career_advisor'
  const { error: profileErr } = await supabase
    .from("profiles")
    .upsert(
      {
        id: advisorUser.id,
        email: ADVISOR_EMAIL,
        role: "career_advisor",
        first_name: "Carla",
        last_name: "Reyes (Advisor)",
      },
      { onConflict: "id" }
    );

  if (profileErr) {
    console.error("Profile upsert error:", profileErr.message);
    process.exit(1);
  }

  console.log("\n✓ Career Advisor account ready.");
  console.log("─────────────────────────────");
  console.log("  Email   :", ADVISOR_EMAIL);
  console.log("  Password:", ADVISOR_PASSWORD);
  console.log("  Role    : career_advisor");
  console.log("─────────────────────────────");
  console.log("Log in at http://localhost:5173/login");
}

main();
