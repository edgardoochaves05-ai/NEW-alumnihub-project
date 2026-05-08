/**
 * Fills in complete personal info for all 55 dummy accounts.
 * Run from alumnihub/ directory:  node scripts/seed-profile-details.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const env = {};
readFileSync(resolve(__dir, "../.env"), "utf8").split("\n").forEach((line) => {
  const [k, ...v] = line.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim();
});
const supabase = createClient(env["VITE_SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"], {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Personal detail patches keyed by email ──────────────────────────────────
const PROFILE_PATCHES = {
  // ── ALUMNI ──
  "ana.reyes@alumnihub.com":         { phone: "+63 917 100 0001", date_of_birth: "1999-03-12", gender: "Female",  city: "Quezon City",   address: "123 Katipunan Ave, Loyola Heights", linkedin_url: "https://linkedin.com/in/ana-reyes-ph" },
  "carlo.mendoza@alumnihub.com":     { phone: "+63 918 100 0002", date_of_birth: "1998-07-25", gender: "Male",    city: "Makati",        address: "45 Ayala Ave, Bel-Air", linkedin_url: "https://linkedin.com/in/carlo-mendoza-ph" },
  "diana.cruz@alumnihub.com":        { phone: "+63 919 100 0003", date_of_birth: "2000-01-08", gender: "Female",  city: "Pasig",         address: "78 Ortigas Ave, Greenhills", linkedin_url: "https://linkedin.com/in/diana-cruz-ph" },
  "emilio.garcia@alumnihub.com":     { phone: "+63 920 100 0004", date_of_birth: "1997-11-14", gender: "Male",    city: "Mandaluyong",   address: "22 Shaw Blvd, Wack-Wack", linkedin_url: "https://linkedin.com/in/emilio-garcia-ph" },
  "felicia.torres@alumnihub.com":    { phone: "+63 921 100 0005", date_of_birth: "1999-05-30", gender: "Female",  city: "Taguig",        address: "11 BGC, High Street", linkedin_url: "https://linkedin.com/in/felicia-torres-ph" },
  "gian.bautista@alumnihub.com":     { phone: "+63 922 100 0006", date_of_birth: "2000-09-19", gender: "Male",    city: "Pasig",         address: "55 C5 Road, Libis", linkedin_url: "https://linkedin.com/in/gian-bautista-ph" },
  "hannah.villanueva@alumnihub.com": { phone: "+63 923 100 0007", date_of_birth: "1998-02-04", gender: "Female",  city: "Quezon City",   address: "300 Commonwealth Ave, Fairview", linkedin_url: "https://linkedin.com/in/hannah-villanueva-ph" },
  "ivan.lim@alumnihub.com":          { phone: "+63 924 100 0008", date_of_birth: "1999-08-22", gender: "Male",    city: "Makati",        address: "8 Salcedo St, Legaspi Village", linkedin_url: "https://linkedin.com/in/ivan-lim-ph" },
  "jasmine.ocampo@alumnihub.com":    { phone: "+63 925 100 0009", date_of_birth: "1997-06-17", gender: "Female",  city: "Taguig",        address: "7 Lane A, McKinley Hill", linkedin_url: "https://linkedin.com/in/jasmine-ocampo-ph" },
  "kevin.aquino@alumnihub.com":      { phone: "+63 926 100 0010", date_of_birth: "2000-12-01", gender: "Male",    city: "Pasig",         address: "101 ADB Ave, Ortigas Center", linkedin_url: "https://linkedin.com/in/kevin-aquino-ph" },
  "laura.santos@alumnihub.com":      { phone: "+63 927 100 0011", date_of_birth: "1998-04-11", gender: "Female",  city: "Mandaluyong",   address: "64 Pioneer St, Mandaluyong", linkedin_url: "https://linkedin.com/in/laura-santos-ph" },
  "miguel.delarosa@alumnihub.com":   { phone: "+63 928 100 0012", date_of_birth: "1999-10-28", gender: "Male",    city: "Quezon City",   address: "19 Elliptical Rd, Diliman", linkedin_url: "https://linkedin.com/in/miguel-delarosa-ph" },
  "nina.pascual@alumnihub.com":      { phone: "+63 929 100 0013", date_of_birth: "1997-03-05", gender: "Female",  city: "Makati",        address: "3 Gil Puyat Ave, Pio del Pilar", linkedin_url: "https://linkedin.com/in/nina-pascual-ph" },
  "oscar.fernandez@alumnihub.com":   { phone: "+63 930 100 0014", date_of_birth: "1998-08-16", gender: "Male",    city: "Taguig",        address: "20 26th St, BGC", linkedin_url: "https://linkedin.com/in/oscar-fernandez-ph" },
  "patricia.navarro@alumnihub.com":  { phone: "+63 931 100 0015", date_of_birth: "2000-02-23", gender: "Female",  city: "Pasig",         address: "88 E. Rodriguez Jr. Ave, Ugong", linkedin_url: "https://linkedin.com/in/patricia-navarro-ph" },
  "ramon.castillo@alumnihub.com":    { phone: "+63 932 100 0016", date_of_birth: "1999-07-09", gender: "Male",    city: "Quezon City",   address: "5 Timog Ave, South Triangle", linkedin_url: "https://linkedin.com/in/ramon-castillo-ph" },
  "sofia.ramos@alumnihub.com":       { phone: "+63 933 100 0017", date_of_birth: "1997-12-31", gender: "Female",  city: "Makati",        address: "12 Chino Roces Ave, Makati", linkedin_url: "https://linkedin.com/in/sofia-ramos-ph" },
  "tristan.morales@alumnihub.com":   { phone: "+63 934 100 0018", date_of_birth: "1998-05-20", gender: "Male",    city: "Pasig",         address: "33 Meralco Ave, Oranbo", linkedin_url: "https://linkedin.com/in/tristan-morales-ph" },
  "ursula.aguilar@alumnihub.com":    { phone: "+63 935 100 0019", date_of_birth: "2000-11-07", gender: "Female",  city: "Mandaluyong",   address: "17 Maysilo Circle, Mandaluyong", linkedin_url: "https://linkedin.com/in/ursula-aguilar-ph" },
  "victor.flores@alumnihub.com":     { phone: "+63 936 100 0020", date_of_birth: "1999-04-14", gender: "Male",    city: "Taguig",        address: "9 5th Ave, BGC", linkedin_url: "https://linkedin.com/in/victor-flores-ph" },
  "wendy.reyes@alumnihub.com":       { phone: "+63 937 100 0021", date_of_birth: "1997-09-03", gender: "Female",  city: "Quezon City",   address: "24 Visayas Ave, Project 6", linkedin_url: "https://linkedin.com/in/wendy-reyes-ph" },
  "xavier.deleon@alumnihub.com":     { phone: "+63 938 100 0022", date_of_birth: "1998-01-18", gender: "Male",    city: "Makati",        address: "6 Buendia Ave, Poblacion", linkedin_url: "https://linkedin.com/in/xavier-deleon-ph" },
  "yvonne.santiago@alumnihub.com":   { phone: "+63 939 100 0023", date_of_birth: "2000-06-27", gender: "Female",  city: "Pasig",         address: "44 San Miguel Ave, Ortigas", linkedin_url: "https://linkedin.com/in/yvonne-santiago-ph" },
  "zachary.hernandez@alumnihub.com": { phone: "+63 940 100 0024", date_of_birth: "1999-02-15", gender: "Male",    city: "Mandaluyong",   address: "2 Boni Ave, Hulo", linkedin_url: "https://linkedin.com/in/zachary-hernandez-ph" },
  "abigail.lopez@alumnihub.com":     { phone: "+63 941 100 0025", date_of_birth: "1997-10-10", gender: "Female",  city: "Taguig",        address: "15 7th Ave, BGC", linkedin_url: "https://linkedin.com/in/abigail-lopez-ph" },
  "benjamin.tan@alumnihub.com":      { phone: "+63 942 100 0026", date_of_birth: "1998-03-29", gender: "Male",    city: "Quezon City",   address: "67 Mindanao Ave, Tandang Sora", linkedin_url: "https://linkedin.com/in/benjamin-tan-ph" },
  "carla.guevara@alumnihub.com":     { phone: "+63 943 100 0027", date_of_birth: "2000-08-06", gender: "Female",  city: "Makati",        address: "30 Paseo de Roxas, Salcedo Village", linkedin_url: "https://linkedin.com/in/carla-guevara-ph" },
  "dante.peralta@alumnihub.com":     { phone: "+63 944 100 0028", date_of_birth: "1999-01-21", gender: "Male",    city: "Pasig",         address: "51 Sapphire Rd, Ortigas", linkedin_url: "https://linkedin.com/in/dante-peralta-ph" },
  "elena.valdez@alumnihub.com":      { phone: "+63 945 100 0029", date_of_birth: "1997-07-16", gender: "Female",  city: "Mandaluyong",   address: "10 Doña Julia Vargas Ave, Oranbo", linkedin_url: "https://linkedin.com/in/elena-valdez-ph" },
  "franco.magno@alumnihub.com":      { phone: "+63 946 100 0030", date_of_birth: "1998-11-03", gender: "Male",    city: "Taguig",        address: "4 Mckinley Pkwy, Taguig", linkedin_url: "https://linkedin.com/in/franco-magno-ph" },
  // ── STUDENTS ──
  "alyssa.bautista@alumnihub.com":   { phone: "+63 950 200 0001", date_of_birth: "2004-02-14", gender: "Female",  city: "Quezon City",   address: "88 Batangas St, Sta. Mesa Heights" },
  "bernard.corpus@alumnihub.com":    { phone: "+63 951 200 0002", date_of_birth: "2005-06-30", gender: "Male",    city: "Caloocan",      address: "12 EDSA, Monumento" },
  "christine.domingo@alumnihub.com": { phone: "+63 952 200 0003", date_of_birth: "2003-09-11", gender: "Female",  city: "Pasig",         address: "37 Valle Verde, Pasig" },
  "dennis.enriquez@alumnihub.com":   { phone: "+63 953 200 0004", date_of_birth: "2004-11-05", gender: "Male",    city: "Marikina",      address: "5 Sumulong Hwy, Marikina" },
  "erica.fajardo@alumnihub.com":     { phone: "+63 954 200 0005", date_of_birth: "2005-03-19", gender: "Female",  city: "Antipolo",      address: "20 Circumferential Rd, Antipolo" },
  "felix.guerrero@alumnihub.com":    { phone: "+63 955 200 0006", date_of_birth: "2003-07-22", gender: "Male",    city: "Quezon City",   address: "14 Maginhawa St, Teacher's Village" },
  "grace.hidalgo@alumnihub.com":     { phone: "+63 956 200 0007", date_of_birth: "2004-01-08", gender: "Female",  city: "Mandaluyong",   address: "9 Pasig Blvd, Mandaluyong" },
  "harold.ignacio@alumnihub.com":    { phone: "+63 957 200 0008", date_of_birth: "2005-10-17", gender: "Male",    city: "Las Piñas",     address: "3 Alabang-Zapote Rd, Las Piñas" },
  "irene.julian@alumnihub.com":      { phone: "+63 958 200 0009", date_of_birth: "2003-04-25", gender: "Female",  city: "Parañaque",     address: "77 Dr. A. Santos Ave, Sucat" },
  "jerome.kalaw@alumnihub.com":      { phone: "+63 959 200 0010", date_of_birth: "2004-08-13", gender: "Male",    city: "Muntinlupa",    address: "50 Alabang Hills, Muntinlupa" },
  "karen.luna@alumnihub.com":        { phone: "+63 960 200 0011", date_of_birth: "2005-12-02", gender: "Female",  city: "Taguig",        address: "22 Upper McKinley Rd, Taguig" },
  "lorenzo.manalo@alumnihub.com":    { phone: "+63 961 200 0012", date_of_birth: "2003-05-28", gender: "Male",    city: "Pasay",         address: "15 Roxas Blvd, Pasay" },
  "monica.natividad@alumnihub.com":  { phone: "+63 962 200 0013", date_of_birth: "2004-09-07", gender: "Female",  city: "Makati",        address: "6 Jupiter St, Bel-Air" },
  "nathaniel.ong@alumnihub.com":     { phone: "+63 963 200 0014", date_of_birth: "2005-02-20", gender: "Male",    city: "Quezon City",   address: "19 Anonas St, Project 3" },
  "olivia.padilla@alumnihub.com":    { phone: "+63 964 200 0015", date_of_birth: "2003-11-14", gender: "Female",  city: "San Juan",      address: "8 N. Domingo St, San Juan" },
  "paulo.quizon@alumnihub.com":      { phone: "+63 965 200 0016", date_of_birth: "2004-06-03", gender: "Male",    city: "Mandaluyong",   address: "33 Sheridan St, Mandaluyong" },
  "queenie.rivero@alumnihub.com":    { phone: "+63 966 200 0017", date_of_birth: "2005-08-24", gender: "Female",  city: "Pasig",         address: "11 Caruncho Ave, Pasig" },
  "renato.soriano@alumnihub.com":    { phone: "+63 967 200 0018", date_of_birth: "2003-03-16", gender: "Male",    city: "Caloocan",      address: "40 Gen. Luis St, Caloocan" },
  "sheila.tugade@alumnihub.com":     { phone: "+63 968 200 0019", date_of_birth: "2004-07-09", gender: "Female",  city: "Quezon City",   address: "7 Matatag St, Diliman" },
  "timothy.uy@alumnihub.com":        { phone: "+63 969 200 0020", date_of_birth: "2005-01-31", gender: "Male",    city: "Marikina",      address: "25 Shoe Ave, Marikina" },
  "uriel.vega@alumnihub.com":        { phone: "+63 970 200 0021", date_of_birth: "2003-10-06", gender: "Male",    city: "Taguig",        address: "13 9th Ave, BGC" },
  "vanessa.wenceslao@alumnihub.com": { phone: "+63 971 200 0022", date_of_birth: "2004-04-18", gender: "Female",  city: "Parañaque",     address: "60 BF Homes, Parañaque" },
  "walter.xavier@alumnihub.com":     { phone: "+63 972 200 0023", date_of_birth: "2005-07-12", gender: "Male",    city: "Las Piñas",     address: "18 Padre Diego Cera Ave, Las Piñas" },
  "xandra.yap@alumnihub.com":        { phone: "+63 973 200 0024", date_of_birth: "2003-06-29", gender: "Female",  city: "Muntinlupa",    address: "2 Filinvest Ave, Alabang" },
  "yvan.zamora@alumnihub.com":       { phone: "+63 974 200 0025", date_of_birth: "2004-10-21", gender: "Male",    city: "Pasig",         address: "9 Emerald Ave, Ortigas" },
};

async function getAllUsers() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  return users;
}

async function main() {
  console.log("\nFetching users...");
  const users = await getAllUsers();
  const emailToId = Object.fromEntries(users.map((u) => [u.email, u.id]));

  let updated = 0, failed = 0;
  for (const [email, patch] of Object.entries(PROFILE_PATCHES)) {
    const id = emailToId[email];
    if (!id) { console.warn(`  ! not found: ${email}`); continue; }

    const { error } = await supabase.from("profiles").update(patch).eq("id", id);
    if (error) {
      console.error(`  ✗ ${email}: ${error.message}`);
      failed++;
    } else {
      console.log(`  ✓ ${email}`);
      updated++;
    }
  }

  console.log(`\n──────────────────────────────────`);
  console.log(`  Updated : ${updated}`);
  console.log(`  Failed  : ${failed}`);
  console.log(`──────────────────────────────────\n`);
  if (failed) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
