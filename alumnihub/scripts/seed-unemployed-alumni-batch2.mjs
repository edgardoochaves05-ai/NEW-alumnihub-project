/**
 * Seeds 15 more unemployed alumni accounts with randomized graduation years.
 * Run from alumnihub/: node scripts/seed-unemployed-alumni-batch2.mjs
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

const PASSWORD = "Alumni@Hub2026!";

const PROGRAMS = [
  "BS Information Systems",
  "BS Information Technology",
  "BS Computer Science",
  "BS Computer Engineering",
  "BS Electronics Engineering",
];
const DEPARTMENTS = {
  "BS Information Systems":     "College of Information Technology",
  "BS Information Technology":  "College of Information Technology",
  "BS Computer Science":        "College of Information Technology",
  "BS Computer Engineering":    "College of Engineering",
  "BS Electronics Engineering": "College of Engineering",
};

// 15 unemployed alumni — randomized graduation years (2020–2024)
const ALUMNI = [
  {
    first_name: "Vincent",  last_name: "Aguilar",    email: "vincent.aguilar@alumnihub.com",
    student_number: "2020-00321", batch_year: 2020, graduation_year: 2024, program_idx: 0,
    phone: "+63 937 300 0021", date_of_birth: "2002-03-14", gender: "Male",
    city: "Quezon City",  address: "12 East Ave, Diliman",
    linkedin_url: "https://linkedin.com/in/vincent-aguilar-ph",
    skills: ["React", "TypeScript", "Node.js", "REST APIs"],
    bio: "Fresh IS grad eager to land a junior developer role in a product company.",
  },
  {
    first_name: "Wendy",    last_name: "Bautista",   email: "wendy.bautista@alumnihub.com",
    student_number: "2017-00322", batch_year: 2017, graduation_year: 2021, program_idx: 1,
    phone: "+63 938 300 0022", date_of_birth: "1999-07-20", gender: "Female",
    city: "Pasig",        address: "33 Meralco Ave, Ortigas Center",
    linkedin_url: "https://linkedin.com/in/wendy-bautista-ph",
    skills: ["Network Administration", "Linux", "Windows Server", "VMware"],
    bio: "IT grad with sysadmin skills looking for an infrastructure or cloud support role.",
  },
  {
    first_name: "Xavier",   last_name: "Cruz",       email: "xavier.cruz@alumnihub.com",
    student_number: "2019-00323", batch_year: 2019, graduation_year: 2023, program_idx: 2,
    phone: "+63 939 300 0023", date_of_birth: "2001-11-05", gender: "Male",
    city: "Makati",       address: "9 Ayala Ave, Makati CBD",
    linkedin_url: "https://linkedin.com/in/xavier-cruz-ph",
    skills: ["Go", "Microservices", "Docker", "Kubernetes"],
    bio: "CS grad who loves distributed systems, currently open to backend engineering roles.",
  },
  {
    first_name: "Yvonne",   last_name: "Delgado",    email: "yvonne.delgado@alumnihub.com",
    student_number: "2016-00324", batch_year: 2016, graduation_year: 2020, program_idx: 3,
    phone: "+63 940 300 0024", date_of_birth: "1998-04-28", gender: "Female",
    city: "Taguig",       address: "5 Mckinley Pkwy, BGC",
    linkedin_url: "https://linkedin.com/in/yvonne-delgado-ph",
    skills: ["Embedded C", "ARM Cortex", "PCB Design", "Altium Designer"],
    bio: "CpE grad with hardware design background seeking embedded engineering opportunities.",
  },
  {
    first_name: "Zachary",  last_name: "Estrada",    email: "zachary.estrada@alumnihub.com",
    student_number: "2018-00325", batch_year: 2018, graduation_year: 2022, program_idx: 4,
    phone: "+63 941 300 0025", date_of_birth: "2000-09-17", gender: "Male",
    city: "Mandaluyong",  address: "20 Shaw Blvd, Mandaluyong",
    linkedin_url: "https://linkedin.com/in/zachary-estrada-ph",
    skills: ["PLC Programming", "SCADA", "AutoCAD Electrical", "Instrumentation"],
    bio: "ECE grad targeting automation and controls engineering roles in manufacturing.",
  },
  {
    first_name: "Abby",     last_name: "Flores",     email: "abby.flores@alumnihub.com",
    student_number: "2020-00326", batch_year: 2020, graduation_year: 2024, program_idx: 0,
    phone: "+63 942 300 0026", date_of_birth: "2002-01-09", gender: "Female",
    city: "Caloocan",     address: "55 A. Mabini St, Caloocan",
    linkedin_url: "https://linkedin.com/in/abby-flores-ph",
    skills: ["Business Analysis", "Power BI", "SQL", "Process Documentation"],
    bio: "IS grad interested in business intelligence and systems analysis positions.",
  },
  {
    first_name: "Bernard",  last_name: "Gregorio",   email: "bernard.gregorio@alumnihub.com",
    student_number: "2017-00327", batch_year: 2017, graduation_year: 2021, program_idx: 1,
    phone: "+63 943 300 0027", date_of_birth: "1999-05-31", gender: "Male",
    city: "Las Piñas",    address: "18 CAA Rd, Las Piñas",
    linkedin_url: "https://linkedin.com/in/bernard-gregorio-ph",
    skills: ["Cybersecurity", "Penetration Testing", "Kali Linux", "OWASP"],
    bio: "IT grad with ethical hacking background, seeking a junior SOC or security analyst role.",
  },
  {
    first_name: "Cecilia",  last_name: "Hidalgo",    email: "cecilia.hidalgo@alumnihub.com",
    student_number: "2019-00328", batch_year: 2019, graduation_year: 2023, program_idx: 2,
    phone: "+63 944 300 0028", date_of_birth: "2001-08-13", gender: "Female",
    city: "Marikina",     address: "7 Lilac St, New Marikina",
    linkedin_url: "https://linkedin.com/in/cecilia-hidalgo-ph",
    skills: ["Data Science", "Python", "Pandas", "Scikit-learn", "Tableau"],
    bio: "CS grad passionate about data science, building a portfolio while job-hunting.",
  },
  {
    first_name: "Dennis",   last_name: "Ilagan",     email: "dennis.ilagan@alumnihub.com",
    student_number: "2016-00329", batch_year: 2016, graduation_year: 2020, program_idx: 3,
    phone: "+63 945 300 0029", date_of_birth: "1998-12-02", gender: "Male",
    city: "Antipolo",     address: "45 Sumulong Hwy, Antipolo",
    linkedin_url: "https://linkedin.com/in/dennis-ilagan-ph",
    skills: ["IoT", "Raspberry Pi", "Python", "MQTT", "AWS IoT"],
    bio: "CpE grad experienced in IoT prototyping, looking for smart systems engineering roles.",
  },
  {
    first_name: "Elena",    last_name: "Jacinto",    email: "elena.jacinto@alumnihub.com",
    student_number: "2018-00330", batch_year: 2018, graduation_year: 2022, program_idx: 4,
    phone: "+63 946 300 0030", date_of_birth: "2000-06-24", gender: "Female",
    city: "Parañaque",    address: "30 Quirino Ave, BF Homes",
    linkedin_url: "https://linkedin.com/in/elena-jacinto-ph",
    skills: ["RF Design", "Antenna Theory", "CST Studio", "LTE/5G"],
    bio: "ECE grad with a focus on wireless communications, targeting telco engineering roles.",
  },
  {
    first_name: "Franco",   last_name: "Katigbak",   email: "franco.katigbak@alumnihub.com",
    student_number: "2020-00331", batch_year: 2020, graduation_year: 2024, program_idx: 0,
    phone: "+63 947 300 0031", date_of_birth: "2002-10-07", gender: "Male",
    city: "San Juan",     address: "3 Wilson St, San Juan",
    linkedin_url: "https://linkedin.com/in/franco-katigbak-ph",
    skills: ["Full-Stack Development", "Vue.js", "Laravel", "MySQL"],
    bio: "IS grad with full-stack project experience, actively applying to web development roles.",
  },
  {
    first_name: "Grace",    last_name: "Lacuesta",   email: "grace.lacuesta@alumnihub.com",
    student_number: "2017-00332", batch_year: 2017, graduation_year: 2021, program_idx: 1,
    phone: "+63 948 300 0032", date_of_birth: "1999-02-18", gender: "Female",
    city: "Muntinlupa",   address: "10 Filinvest Blvd, Alabang",
    linkedin_url: "https://linkedin.com/in/grace-lacuesta-ph",
    skills: ["QA Testing", "Selenium", "JIRA", "Test Case Design"],
    bio: "IT grad specializing in QA, seeking a software testing or QA engineer position.",
  },
  {
    first_name: "Hector",   last_name: "Macaraeg",   email: "hector.macaraeg@alumnihub.com",
    student_number: "2019-00333", batch_year: 2019, graduation_year: 2023, program_idx: 2,
    phone: "+63 949 300 0033", date_of_birth: "2001-04-30", gender: "Male",
    city: "Pasay",        address: "14 Libertad St, Pasay",
    linkedin_url: "https://linkedin.com/in/hector-macaraeg-ph",
    skills: ["Game Development", "Unity", "C#", "3D Modeling"],
    bio: "CS grad who developed indie games during college, exploring game dev opportunities.",
  },
  {
    first_name: "Iris",     last_name: "Natividad",  email: "iris.natividad@alumnihub.com",
    student_number: "2016-00334", batch_year: 2016, graduation_year: 2020, program_idx: 3,
    phone: "+63 950 300 0034", date_of_birth: "1998-08-15", gender: "Female",
    city: "Quezon City",  address: "26 Batangas St, Sta. Mesa Heights",
    linkedin_url: "https://linkedin.com/in/iris-natividad-ph",
    skills: ["FPGA", "VHDL", "Digital Circuit Design", "ModelSim"],
    bio: "CpE grad with FPGA design experience seeking roles in digital design or semiconductor.",
  },
  {
    first_name: "Julius",   last_name: "Obispo",     email: "julius.obispo@alumnihub.com",
    student_number: "2018-00335", batch_year: 2018, graduation_year: 2022, program_idx: 4,
    phone: "+63 951 300 0035", date_of_birth: "2000-03-21", gender: "Male",
    city: "Taguig",       address: "8 Bayani Rd, Fort Bonifacio",
    linkedin_url: "https://linkedin.com/in/julius-obispo-ph",
    skills: ["Power Electronics", "MATLAB Simulink", "Circuit Simulation", "AutoCAD"],
    bio: "ECE grad with power electronics focus, open to roles in renewable energy or utilities.",
  },
];

async function getUserByEmail(email) {
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  return users.find((u) => u.email === email) ?? null;
}

async function main() {
  const results = { created: 0, skipped: 0, failed: 0 };
  console.log(`\nSeeding ${ALUMNI.length} unemployed alumni (batch 2)...\n`);

  for (const a of ALUMNI) {
    const program    = PROGRAMS[a.program_idx];
    const department = DEPARTMENTS[program];

    let userId;
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: a.email, password: PASSWORD, email_confirm: true,
      user_metadata: { role: "alumni", first_name: a.first_name, last_name: a.last_name },
    });

    if (authErr) {
      if (authErr.message?.toLowerCase().includes("already")) {
        const existing = await getUserByEmail(a.email);
        if (!existing) { console.error(`  ✗ cannot find: ${a.email}`); results.failed++; continue; }
        userId = existing.id;
        console.log(`  ~ skip    ${a.email} (exists)`);
        results.skipped++;
      } else {
        console.error(`  ✗ auth error ${a.email}: ${authErr.message}`);
        results.failed++;
        continue;
      }
    } else {
      userId = authData.user.id;
    }

    const { error: profileErr } = await supabase.from("profiles").upsert({
      id: userId,
      email: a.email,
      role: "alumni",
      first_name: a.first_name,
      last_name: a.last_name,
      phone: a.phone,
      date_of_birth: a.date_of_birth,
      gender: a.gender,
      city: a.city,
      address: a.address,
      linkedin_url: a.linkedin_url,
      program,
      department,
      student_number: a.student_number,
      batch_year: a.batch_year,
      graduation_year: a.graduation_year,
      skills: a.skills,
      bio: a.bio,
      is_verified: true,
      // intentionally no current_job_title, current_company, industry
    }, { onConflict: "id" });

    if (profileErr) {
      console.error(`  ✗ profile error ${a.email}: ${profileErr.message}`);
      results.failed++;
    } else if (!authErr) {
      console.log(`  ✓ created  ${a.first_name} ${a.last_name} <${a.email}> (grad: ${a.graduation_year})`);
      results.created++;
    }
  }

  console.log("\n─────────────────────────────────────────");
  console.log(`  Created : ${results.created}`);
  console.log(`  Skipped : ${results.skipped} (already existed)`);
  console.log(`  Failed  : ${results.failed}`);
  console.log("─────────────────────────────────────────");
  console.log(`\n  Password: ${PASSWORD}`);
  console.log("─────────────────────────────────────────\n");

  if (results.failed) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
