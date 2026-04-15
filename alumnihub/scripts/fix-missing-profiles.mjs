/**
 * Finds all auth users who have no profiles row and creates one from their metadata.
 * Run: node scripts/fix-missing-profiles.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const env = {};
readFileSync(resolve(__dir, "../.env"), "utf8").split("\n").forEach((l) => {
  const [k, ...v] = l.split("=");
  if (k) env[k.trim()] = v.join("=").trim();
});

const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: { users } } = await sb.auth.admin.listUsers();
const { data: profiles } = await sb.from("profiles").select("id");
const existingIds = new Set((profiles || []).map((p) => p.id));

const missing = users.filter((u) => !existingIds.has(u.id));
if (missing.length === 0) { console.log("No missing profiles found."); process.exit(0); }

console.log(`Found ${missing.length} user(s) without a profile row. Creating...`);

for (const user of missing) {
  const meta = user.user_metadata || {};
  const { error } = await sb.from("profiles").upsert({
    id: user.id,
    email: user.email,
    role: meta.role || "alumni",
    first_name: meta.first_name || null,
    last_name: meta.last_name || null,
    is_active: true,
  }, { onConflict: "id" });

  if (error) {
    console.error(`  ✗ ${user.email}:`, error.message);
  } else {
    console.log(`  ✓ Created profile for ${user.email} (role: ${meta.role || "alumni"})`);
  }
}
console.log("Done.");
