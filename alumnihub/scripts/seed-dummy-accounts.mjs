/**
 * Bulk seed script: creates 55 dummy accounts (30 alumni + 25 students).
 * Run from the alumnihub/ directory:
 *   node scripts/seed-dummy-accounts.mjs
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

// ─── Account Data ────────────────────────────────────────────────────────────

const ALUMNI_PASSWORD  = "Alumni@Hub2026!";
const STUDENT_PASSWORD = "Student@Hub2026!";

const PROGRAMS = [
  "BS Information Systems",
  "BS Information Technology",
  "BS Computer Science",
  "BS Computer Engineering",
  "BS Electronics Engineering",
];

const DEPARTMENTS = {
  "BS Information Systems":      "College of Information Technology",
  "BS Information Technology":   "College of Information Technology",
  "BS Computer Science":         "College of Information Technology",
  "BS Computer Engineering":     "College of Engineering",
  "BS Electronics Engineering":  "College of Engineering",
};

const INDUSTRIES = [
  "Information Technology",
  "Software Development",
  "Data Analytics",
  "Telecommunications",
  "Banking and Finance",
  "Healthcare IT",
  "E-Commerce",
  "Government / Public Sector",
];

const JOB_TITLES = [
  "Software Engineer",
  "Systems Analyst",
  "Data Analyst",
  "Network Administrator",
  "IT Project Manager",
  "Full Stack Developer",
  "QA Engineer",
  "Database Administrator",
  "DevOps Engineer",
  "Business Analyst",
];

const COMPANIES = [
  "Accenture Philippines",
  "Concentrix",
  "Globe Telecom",
  "PLDT",
  "BDO Unibank",
  "Metrobank",
  "Sprout Solutions",
  "UnionBank",
  "Lazada Philippines",
  "Shopee Philippines",
];

const SKILLS_POOL = [
  ["JavaScript", "React", "Node.js", "SQL"],
  ["Python", "Django", "PostgreSQL", "Docker"],
  ["Java", "Spring Boot", "MySQL", "AWS"],
  ["C#", ".NET", "Azure", "SQL Server"],
  ["PHP", "Laravel", "MySQL", "Linux"],
  ["TypeScript", "Angular", "REST APIs", "Git"],
  ["Data Analysis", "Excel", "Power BI", "Python"],
  ["Network Security", "Cisco", "Firewall", "Linux"],
  ["Project Management", "Agile", "JIRA", "Confluence"],
  ["Android", "Kotlin", "Firebase", "REST APIs"],
];

// 30 alumni accounts
const ALUMNI = [
  { first_name: "Ana",        last_name: "Reyes",         email: "ana.reyes@alumnihub.com",         student_number: "2017-00101", batch_year: 2017, graduation_year: 2021, program_idx: 0, job_idx: 0,  company_idx: 0,  industry_idx: 0, skills_idx: 0, bio: "Passionate software engineer with 4 years in web development." },
  { first_name: "Carlo",      last_name: "Mendoza",       email: "carlo.mendoza@alumnihub.com",     student_number: "2016-00102", batch_year: 2016, graduation_year: 2020, program_idx: 1, job_idx: 1,  company_idx: 1,  industry_idx: 0, skills_idx: 1, bio: "Systems analyst specializing in enterprise IT infrastructure." },
  { first_name: "Diana",      last_name: "Cruz",          email: "diana.cruz@alumnihub.com",        student_number: "2018-00103", batch_year: 2018, graduation_year: 2022, program_idx: 2, job_idx: 2,  company_idx: 2,  industry_idx: 3, skills_idx: 6, bio: "Data analyst with a focus on business intelligence." },
  { first_name: "Emilio",     last_name: "Garcia",        email: "emilio.garcia@alumnihub.com",     student_number: "2015-00104", batch_year: 2015, graduation_year: 2019, program_idx: 3, job_idx: 3,  company_idx: 3,  industry_idx: 3, skills_idx: 7, bio: "Network administrator ensuring uptime for critical telco systems." },
  { first_name: "Felicia",    last_name: "Torres",        email: "felicia.torres@alumnihub.com",    student_number: "2017-00105", batch_year: 2017, graduation_year: 2021, program_idx: 0, job_idx: 4,  company_idx: 4,  industry_idx: 4, skills_idx: 8, bio: "IT project manager leading digital transformation at a bank." },
  { first_name: "Gian",       last_name: "Bautista",      email: "gian.bautista@alumnihub.com",     student_number: "2018-00106", batch_year: 2018, graduation_year: 2022, program_idx: 1, job_idx: 5,  company_idx: 5,  industry_idx: 4, skills_idx: 0, bio: "Full stack developer building fintech products." },
  { first_name: "Hannah",     last_name: "Villanueva",    email: "hannah.villanueva@alumnihub.com", student_number: "2016-00107", batch_year: 2016, graduation_year: 2020, program_idx: 2, job_idx: 6,  company_idx: 6,  industry_idx: 0, skills_idx: 1, bio: "QA engineer passionate about delivering bug-free software." },
  { first_name: "Ivan",       last_name: "Lim",           email: "ivan.lim@alumnihub.com",          student_number: "2017-00108", batch_year: 2017, graduation_year: 2021, program_idx: 3, job_idx: 7,  company_idx: 7,  industry_idx: 4, skills_idx: 2, bio: "DBA managing high-availability databases for a major bank." },
  { first_name: "Jasmine",    last_name: "Ocampo",        email: "jasmine.ocampo@alumnihub.com",    student_number: "2015-00109", batch_year: 2015, graduation_year: 2019, program_idx: 0, job_idx: 8,  company_idx: 0,  industry_idx: 0, skills_idx: 3, bio: "DevOps engineer streamlining CI/CD pipelines at a global consultancy." },
  { first_name: "Kevin",      last_name: "Aquino",        email: "kevin.aquino@alumnihub.com",      student_number: "2018-00110", batch_year: 2018, graduation_year: 2022, program_idx: 1, job_idx: 9,  company_idx: 1,  industry_idx: 1, skills_idx: 4, bio: "Business analyst bridging IT and business stakeholders." },
  { first_name: "Laura",      last_name: "Santos",        email: "laura.santos@alumnihub.com",      student_number: "2016-00111", batch_year: 2016, graduation_year: 2020, program_idx: 2, job_idx: 0,  company_idx: 8,  industry_idx: 6, skills_idx: 5, bio: "Software engineer building scalable e-commerce platforms." },
  { first_name: "Miguel",     last_name: "Dela Rosa",     email: "miguel.delarosa@alumnihub.com",   student_number: "2017-00112", batch_year: 2017, graduation_year: 2021, program_idx: 4, job_idx: 1,  company_idx: 9,  industry_idx: 6, skills_idx: 6, bio: "Electronics engineer turned data analyst in retail tech." },
  { first_name: "Nina",       last_name: "Pascual",       email: "nina.pascual@alumnihub.com",      student_number: "2015-00113", batch_year: 2015, graduation_year: 2019, program_idx: 0, job_idx: 2,  company_idx: 2,  industry_idx: 3, skills_idx: 7, bio: "Senior data analyst at a leading telco company." },
  { first_name: "Oscar",      last_name: "Fernandez",     email: "oscar.fernandez@alumnihub.com",   student_number: "2016-00114", batch_year: 2016, graduation_year: 2020, program_idx: 1, job_idx: 3,  company_idx: 3,  industry_idx: 3, skills_idx: 8, bio: "Network specialist with expertise in enterprise wireless solutions." },
  { first_name: "Patricia",   last_name: "Navarro",       email: "patricia.navarro@alumnihub.com",  student_number: "2018-00115", batch_year: 2018, graduation_year: 2022, program_idx: 2, job_idx: 4,  company_idx: 4,  industry_idx: 4, skills_idx: 9, bio: "Mobile developer focused on Android banking apps." },
  { first_name: "Ramon",      last_name: "Castillo",      email: "ramon.castillo@alumnihub.com",    student_number: "2017-00116", batch_year: 2017, graduation_year: 2021, program_idx: 3, job_idx: 5,  company_idx: 5,  industry_idx: 4, skills_idx: 0, bio: "Full stack developer at one of the Philippines' top banks." },
  { first_name: "Sofia",      last_name: "Ramos",         email: "sofia.ramos@alumnihub.com",       student_number: "2015-00117", batch_year: 2015, graduation_year: 2019, program_idx: 0, job_idx: 6,  company_idx: 6,  industry_idx: 1, skills_idx: 1, bio: "QA lead with 6+ years in software quality assurance." },
  { first_name: "Tristan",    last_name: "Morales",       email: "tristan.morales@alumnihub.com",   student_number: "2016-00118", batch_year: 2016, graduation_year: 2020, program_idx: 1, job_idx: 7,  company_idx: 7,  industry_idx: 4, skills_idx: 2, bio: "Database architect specializing in cloud migration." },
  { first_name: "Ursula",     last_name: "Aguilar",       email: "ursula.aguilar@alumnihub.com",    student_number: "2018-00119", batch_year: 2018, graduation_year: 2022, program_idx: 2, job_idx: 8,  company_idx: 8,  industry_idx: 6, skills_idx: 3, bio: "DevOps engineer automating deployments for e-commerce." },
  { first_name: "Victor",     last_name: "Flores",        email: "victor.flores@alumnihub.com",     student_number: "2017-00120", batch_year: 2017, graduation_year: 2021, program_idx: 4, job_idx: 9,  company_idx: 9,  industry_idx: 6, skills_idx: 4, bio: "Business analyst in a high-growth retail tech company." },
  { first_name: "Wendy",      last_name: "Reyes",         email: "wendy.reyes@alumnihub.com",       student_number: "2015-00121", batch_year: 2015, graduation_year: 2019, program_idx: 0, job_idx: 0,  company_idx: 0,  industry_idx: 0, skills_idx: 5, bio: "Senior software engineer at a global IT consultancy." },
  { first_name: "Xavier",     last_name: "De Leon",       email: "xavier.deleon@alumnihub.com",     student_number: "2016-00122", batch_year: 2016, graduation_year: 2020, program_idx: 1, job_idx: 1,  company_idx: 1,  industry_idx: 0, skills_idx: 6, bio: "Systems analyst with expertise in ERP implementations." },
  { first_name: "Yvonne",     last_name: "Santiago",      email: "yvonne.santiago@alumnihub.com",   student_number: "2018-00123", batch_year: 2018, graduation_year: 2022, program_idx: 2, job_idx: 2,  company_idx: 2,  industry_idx: 3, skills_idx: 7, bio: "Data analyst turning raw telecom data into actionable insights." },
  { first_name: "Zachary",    last_name: "Hernandez",     email: "zachary.hernandez@alumnihub.com", student_number: "2017-00124", batch_year: 2017, graduation_year: 2021, program_idx: 3, job_idx: 3,  company_idx: 3,  industry_idx: 3, skills_idx: 8, bio: "Network security engineer protecting telco infrastructure." },
  { first_name: "Abigail",    last_name: "Lopez",         email: "abigail.lopez@alumnihub.com",     student_number: "2015-00125", batch_year: 2015, graduation_year: 2019, program_idx: 0, job_idx: 4,  company_idx: 4,  industry_idx: 4, skills_idx: 9, bio: "Project manager delivering banking digital projects on time." },
  { first_name: "Benjamin",   last_name: "Tan",           email: "benjamin.tan@alumnihub.com",      student_number: "2016-00126", batch_year: 2016, graduation_year: 2020, program_idx: 1, job_idx: 5,  company_idx: 5,  industry_idx: 4, skills_idx: 0, bio: "Full stack developer with deep expertise in fintech APIs." },
  { first_name: "Carla",      last_name: "Guevara",       email: "carla.guevara@alumnihub.com",     student_number: "2018-00127", batch_year: 2018, graduation_year: 2022, program_idx: 2, job_idx: 6,  company_idx: 6,  industry_idx: 1, skills_idx: 1, bio: "QA engineer with ISTQB certification." },
  { first_name: "Dante",      last_name: "Peralta",       email: "dante.peralta@alumnihub.com",     student_number: "2017-00128", batch_year: 2017, graduation_year: 2021, program_idx: 3, job_idx: 7,  company_idx: 7,  industry_idx: 4, skills_idx: 2, bio: "Database administrator ensuring data integrity for financial systems." },
  { first_name: "Elena",      last_name: "Valdez",        email: "elena.valdez@alumnihub.com",      student_number: "2015-00129", batch_year: 2015, graduation_year: 2019, program_idx: 0, job_idx: 8,  company_idx: 8,  industry_idx: 6, skills_idx: 3, bio: "DevOps lead with 6 years driving cloud-native transformation." },
  { first_name: "Franco",     last_name: "Magno",         email: "franco.magno@alumnihub.com",      student_number: "2016-00130", batch_year: 2016, graduation_year: 2020, program_idx: 4, job_idx: 9,  company_idx: 9,  industry_idx: 6, skills_idx: 4, bio: "Business analyst at a leading Philippine e-commerce platform." },
];

// 25 student accounts
const STUDENTS = [
  { first_name: "Alyssa",    last_name: "Bautista",   email: "alyssa.bautista@alumnihub.com",   student_number: "2022-00201", batch_year: 2022, program_idx: 0, bio: "2nd year IS student interested in UX design." },
  { first_name: "Bernard",   last_name: "Corpus",     email: "bernard.corpus@alumnihub.com",    student_number: "2023-00202", batch_year: 2023, program_idx: 1, bio: "1st year IT student with a passion for networking." },
  { first_name: "Christine", last_name: "Domingo",    email: "christine.domingo@alumnihub.com", student_number: "2021-00203", batch_year: 2021, program_idx: 2, bio: "3rd year CS student focusing on machine learning." },
  { first_name: "Dennis",    last_name: "Enriquez",   email: "dennis.enriquez@alumnihub.com",   student_number: "2022-00204", batch_year: 2022, program_idx: 3, bio: "2nd year CpE student building embedded systems projects." },
  { first_name: "Erica",     last_name: "Fajardo",    email: "erica.fajardo@alumnihub.com",     student_number: "2023-00205", batch_year: 2023, program_idx: 4, bio: "1st year ECE student eager to learn signal processing." },
  { first_name: "Felix",     last_name: "Guerrero",   email: "felix.guerrero@alumnihub.com",    student_number: "2021-00206", batch_year: 2021, program_idx: 0, bio: "3rd year IS student working on thesis on alumni tracking." },
  { first_name: "Grace",     last_name: "Hidalgo",    email: "grace.hidalgo@alumnihub.com",     student_number: "2022-00207", batch_year: 2022, program_idx: 1, bio: "2nd year IT student with internship at a startup." },
  { first_name: "Harold",    last_name: "Ignacio",    email: "harold.ignacio@alumnihub.com",    student_number: "2023-00208", batch_year: 2023, program_idx: 2, bio: "1st year CS student competitive programmer." },
  { first_name: "Irene",     last_name: "Julian",     email: "irene.julian@alumnihub.com",      student_number: "2021-00209", batch_year: 2021, program_idx: 3, bio: "3rd year CpE student specializing in IoT." },
  { first_name: "Jerome",    last_name: "Kalaw",      email: "jerome.kalaw@alumnihub.com",      student_number: "2022-00210", batch_year: 2022, program_idx: 4, bio: "2nd year ECE student interested in robotics." },
  { first_name: "Karen",     last_name: "Luna",       email: "karen.luna@alumnihub.com",        student_number: "2023-00211", batch_year: 2023, program_idx: 0, bio: "1st year IS student with strong Excel and data skills." },
  { first_name: "Lorenzo",   last_name: "Manalo",     email: "lorenzo.manalo@alumnihub.com",    student_number: "2021-00212", batch_year: 2021, program_idx: 1, bio: "3rd year IT student specializing in cybersecurity." },
  { first_name: "Monica",    last_name: "Natividad",  email: "monica.natividad@alumnihub.com",  student_number: "2022-00213", batch_year: 2022, program_idx: 2, bio: "2nd year CS student doing research on NLP." },
  { first_name: "Nathaniel", last_name: "Ong",        email: "nathaniel.ong@alumnihub.com",     student_number: "2023-00214", batch_year: 2023, program_idx: 3, bio: "1st year CpE student learning VHDL and FPGA design." },
  { first_name: "Olivia",    last_name: "Padilla",    email: "olivia.padilla@alumnihub.com",    student_number: "2021-00215", batch_year: 2021, program_idx: 0, bio: "3rd year IS student with part-time work as a web developer." },
  { first_name: "Paulo",     last_name: "Quizon",     email: "paulo.quizon@alumnihub.com",      student_number: "2022-00216", batch_year: 2022, program_idx: 1, bio: "2nd year IT student building a startup mobile app." },
  { first_name: "Queenie",   last_name: "Rivero",     email: "queenie.rivero@alumnihub.com",    student_number: "2023-00217", batch_year: 2023, program_idx: 2, bio: "1st year CS student fascinated by computer graphics." },
  { first_name: "Renato",    last_name: "Soriano",    email: "renato.soriano@alumnihub.com",    student_number: "2021-00218", batch_year: 2021, program_idx: 4, bio: "3rd year ECE student doing thesis on smart grid systems." },
  { first_name: "Sheila",    last_name: "Tugade",     email: "sheila.tugade@alumnihub.com",     student_number: "2022-00219", batch_year: 2022, program_idx: 0, bio: "2nd year IS student with interest in business process modeling." },
  { first_name: "Timothy",   last_name: "Uy",         email: "timothy.uy@alumnihub.com",        student_number: "2023-00220", batch_year: 2023, program_idx: 1, bio: "1st year IT student excited about cloud computing." },
  { first_name: "Uriel",     last_name: "Vega",       email: "uriel.vega@alumnihub.com",        student_number: "2021-00221", batch_year: 2021, program_idx: 2, bio: "3rd year CS student participating in ACM ICPC." },
  { first_name: "Vanessa",   last_name: "Wenceslao",  email: "vanessa.wenceslao@alumnihub.com", student_number: "2022-00222", batch_year: 2022, program_idx: 3, bio: "2nd year CpE student building Arduino-based projects." },
  { first_name: "Walter",    last_name: "Xavier",     email: "walter.xavier@alumnihub.com",     student_number: "2023-00223", batch_year: 2023, program_idx: 4, bio: "1st year ECE student with a background in ham radio." },
  { first_name: "Xandra",    last_name: "Yap",        email: "xandra.yap@alumnihub.com",        student_number: "2021-00224", batch_year: 2021, program_idx: 0, bio: "3rd year IS student interning at a government IT agency." },
  { first_name: "Yvan",      last_name: "Zamora",     email: "yvan.zamora@alumnihub.com",       student_number: "2022-00225", batch_year: 2022, program_idx: 1, bio: "2nd year IT student with strong Linux administration skills." },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getUserByEmail(email) {
  const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error("listUsers: " + error.message);
  return users.find((u) => u.email === email) ?? null;
}

async function createAccount({ email, password, role, first_name, last_name, profile }) {
  // Create auth user (skip if already exists)
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role, first_name, last_name },
  });

  let userId;
  if (authErr) {
    if (authErr.message?.toLowerCase().includes("already been registered") ||
        authErr.message?.toLowerCase().includes("already exists")) {
      const existing = await getUserByEmail(email);
      if (!existing) throw new Error(`Cannot find existing user: ${email}`);
      userId = existing.id;
    } else {
      throw new Error("Auth error for " + email + ": " + authErr.message);
    }
  } else {
    userId = authData.user.id;
  }

  // Upsert profile
  const { error: profileErr } = await supabase
    .from("profiles")
    .upsert({ id: userId, email, role, first_name, last_name, ...profile }, { onConflict: "id" });

  if (profileErr) throw new Error("Profile error for " + email + ": " + profileErr.message);

  return userId;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const results = { created: [], skipped: [], failed: [] };

  console.log(`\nSeeding ${ALUMNI.length} alumni + ${STUDENTS.length} students...\n`);

  // Alumni
  for (const a of ALUMNI) {
    const program    = PROGRAMS[a.program_idx];
    const department = DEPARTMENTS[program];
    try {
      await createAccount({
        email:      a.email,
        password:   ALUMNI_PASSWORD,
        role:       "alumni",
        first_name: a.first_name,
        last_name:  a.last_name,
        profile: {
          program,
          department,
          student_number:      a.student_number,
          batch_year:          a.batch_year,
          graduation_year:     a.graduation_year,
          current_job_title:   JOB_TITLES[a.job_idx],
          current_company:     COMPANIES[a.company_idx],
          industry:            INDUSTRIES[a.industry_idx],
          skills:              SKILLS_POOL[a.skills_idx],
          bio:                 a.bio,
          is_verified:         true,
        },
      });
      console.log(`  ✓ alumni  ${a.first_name} ${a.last_name} <${a.email}>`);
      results.created.push(a.email);
    } catch (err) {
      if (err.message.includes("already")) {
        console.log(`  ~ skip    ${a.email} (exists)`);
        results.skipped.push(a.email);
      } else {
        console.error(`  ✗ failed  ${a.email}: ${err.message}`);
        results.failed.push(a.email);
      }
    }
  }

  // Students
  for (const s of STUDENTS) {
    const program    = PROGRAMS[s.program_idx];
    const department = DEPARTMENTS[program];
    try {
      await createAccount({
        email:      s.email,
        password:   STUDENT_PASSWORD,
        role:       "student",
        first_name: s.first_name,
        last_name:  s.last_name,
        profile: {
          program,
          department,
          student_number: s.student_number,
          batch_year:     s.batch_year,
          bio:            s.bio,
        },
      });
      console.log(`  ✓ student ${s.first_name} ${s.last_name} <${s.email}>`);
      results.created.push(s.email);
    } catch (err) {
      if (err.message.includes("already")) {
        console.log(`  ~ skip    ${s.email} (exists)`);
        results.skipped.push(s.email);
      } else {
        console.error(`  ✗ failed  ${s.email}: ${err.message}`);
        results.failed.push(s.email);
      }
    }
  }

  console.log("\n─────────────────────────────────────────");
  console.log(`  Created : ${results.created.length}`);
  console.log(`  Skipped : ${results.skipped.length} (already existed)`);
  console.log(`  Failed  : ${results.failed.length}`);
  console.log("─────────────────────────────────────────");
  console.log(`\n  Alumni password : ${ALUMNI_PASSWORD}`);
  console.log(`  Student password: ${STUDENT_PASSWORD}`);
  console.log("─────────────────────────────────────────\n");

  if (results.failed.length) process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
