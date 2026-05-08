/**
 * Seeds 20 unemployed alumni accounts with complete personal info.
 * Run from alumnihub/: node scripts/seed-unemployed-alumni.mjs
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

// 20 unemployed alumni — no current_job_title / current_company
const ALUMNI = [
  {
    first_name: "Aaron",    last_name: "Buenaventura", email: "aaron.buenaventura@alumnihub.com",
    student_number: "2019-00301", batch_year: 2019, graduation_year: 2023, program_idx: 0,
    phone: "+63 917 300 0001", date_of_birth: "2001-04-10", gender: "Male",
    city: "Quezon City",  address: "5 Kalayaan Ave, Diliman",
    linkedin_url: "https://linkedin.com/in/aaron-buenaventura-ph",
    skills: ["JavaScript", "React", "SQL"],
    bio: "Recent IS graduate actively looking for a software development role.",
  },
  {
    first_name: "Bianca",   last_name: "Domingo",      email: "bianca.domingo@alumnihub.com",
    student_number: "2019-00302", batch_year: 2019, graduation_year: 2023, program_idx: 1,
    phone: "+63 918 300 0002", date_of_birth: "2001-08-22", gender: "Female",
    city: "Makati",       address: "18 Legazpi St, Legaspi Village",
    linkedin_url: "https://linkedin.com/in/bianca-domingo-ph",
    skills: ["Python", "Data Analysis", "Excel"],
    bio: "IT graduate with a passion for data analytics, currently job-hunting.",
  },
  {
    first_name: "Carlos",   last_name: "Evangelista",  email: "carlos.evangelista@alumnihub.com",
    student_number: "2018-00303", batch_year: 2018, graduation_year: 2022, program_idx: 2,
    phone: "+63 919 300 0003", date_of_birth: "2000-12-05", gender: "Male",
    city: "Pasig",        address: "44 Julia Vargas Ave, Ortigas",
    linkedin_url: "https://linkedin.com/in/carlos-evangelista-ph",
    skills: ["Java", "Spring Boot", "MySQL"],
    bio: "CS graduate exploring opportunities in backend development.",
  },
  {
    first_name: "Daria",    last_name: "Fuentes",      email: "daria.fuentes@alumnihub.com",
    student_number: "2019-00304", batch_year: 2019, graduation_year: 2023, program_idx: 3,
    phone: "+63 920 300 0004", date_of_birth: "2001-03-18", gender: "Female",
    city: "Mandaluyong",  address: "9 Boni Ave, Mandaluyong",
    linkedin_url: "https://linkedin.com/in/daria-fuentes-ph",
    skills: ["Embedded Systems", "C", "VHDL", "Arduino"],
    bio: "CpE graduate looking for embedded systems or IoT opportunities.",
  },
  {
    first_name: "Erwin",    last_name: "Gonzales",     email: "erwin.gonzales@alumnihub.com",
    student_number: "2018-00305", batch_year: 2018, graduation_year: 2022, program_idx: 4,
    phone: "+63 921 300 0005", date_of_birth: "2000-07-29", gender: "Male",
    city: "Taguig",       address: "3 Bayani Rd, Fort Bonifacio",
    linkedin_url: "https://linkedin.com/in/erwin-gonzales-ph",
    skills: ["Signal Processing", "MATLAB", "Circuit Design"],
    bio: "ECE graduate open to roles in telecommunications or electronics.",
  },
  {
    first_name: "Faith",    last_name: "Herrera",      email: "faith.herrera@alumnihub.com",
    student_number: "2019-00306", batch_year: 2019, graduation_year: 2023, program_idx: 0,
    phone: "+63 922 300 0006", date_of_birth: "2001-01-14", gender: "Female",
    city: "Quezon City",  address: "21 Visayas Ave, Project 6",
    linkedin_url: "https://linkedin.com/in/faith-herrera-ph",
    skills: ["Business Analysis", "SQL", "Excel", "Agile"],
    bio: "IS graduate interested in business analyst or project coordinator roles.",
  },
  {
    first_name: "Gerald",   last_name: "Ibañez",       email: "gerald.ibanez@alumnihub.com",
    student_number: "2018-00307", batch_year: 2018, graduation_year: 2022, program_idx: 1,
    phone: "+63 923 300 0007", date_of_birth: "2000-10-03", gender: "Male",
    city: "Caloocan",     address: "78 Rizal Ave Ext, Caloocan",
    linkedin_url: "https://linkedin.com/in/gerald-ibanez-ph",
    skills: ["Networking", "Cisco", "Linux", "CompTIA"],
    bio: "IT graduate with CCNA training looking for network engineer roles.",
  },
  {
    first_name: "Helena",   last_name: "Jimenez",      email: "helena.jimenez@alumnihub.com",
    student_number: "2019-00308", batch_year: 2019, graduation_year: 2023, program_idx: 2,
    phone: "+63 924 300 0008", date_of_birth: "2001-06-25", gender: "Female",
    city: "Marikina",     address: "14 Sumulong Hwy, Marikina",
    linkedin_url: "https://linkedin.com/in/helena-jimenez-ph",
    skills: ["Machine Learning", "Python", "TensorFlow", "SQL"],
    bio: "CS graduate passionate about AI/ML, seeking entry-level data roles.",
  },
  {
    first_name: "Ivan",     last_name: "Kabigting",    email: "ivan.kabigting@alumnihub.com",
    student_number: "2018-00309", batch_year: 2018, graduation_year: 2022, program_idx: 3,
    phone: "+63 925 300 0009", date_of_birth: "2000-02-11", gender: "Male",
    city: "Antipolo",     address: "30 Circumferential Rd, Antipolo",
    linkedin_url: "https://linkedin.com/in/ivan-kabigting-ph",
    skills: ["IoT", "Arduino", "Raspberry Pi", "C++"],
    bio: "CpE graduate looking for embedded or IoT engineering opportunities.",
  },
  {
    first_name: "Jasper",   last_name: "Lara",         email: "jasper.lara@alumnihub.com",
    student_number: "2019-00310", batch_year: 2019, graduation_year: 2023, program_idx: 4,
    phone: "+63 926 300 0010", date_of_birth: "2001-09-08", gender: "Male",
    city: "Las Piñas",    address: "6 Alabang-Zapote Rd, Las Piñas",
    linkedin_url: "https://linkedin.com/in/jasper-lara-ph",
    skills: ["RF Engineering", "Signal Processing", "AutoCAD"],
    bio: "ECE graduate targeting telecom or electronics manufacturing companies.",
  },
  {
    first_name: "Kristina", last_name: "Manalo",       email: "kristina.manalo@alumnihub.com",
    student_number: "2018-00311", batch_year: 2018, graduation_year: 2022, program_idx: 0,
    phone: "+63 927 300 0011", date_of_birth: "2000-05-17", gender: "Female",
    city: "Parañaque",    address: "50 Dr. A. Santos Ave, Sucat",
    linkedin_url: "https://linkedin.com/in/kristina-manalo-ph",
    skills: ["Project Management", "Agile", "Confluence", "JIRA"],
    bio: "IS graduate with OJT experience in project coordination, now job-seeking.",
  },
  {
    first_name: "Lemuel",   last_name: "Navarro",      email: "lemuel.navarro@alumnihub.com",
    student_number: "2019-00312", batch_year: 2019, graduation_year: 2023, program_idx: 1,
    phone: "+63 928 300 0012", date_of_birth: "2001-11-30", gender: "Male",
    city: "Muntinlupa",   address: "22 Filinvest Ave, Alabang",
    linkedin_url: "https://linkedin.com/in/lemuel-navarro-ph",
    skills: ["Cybersecurity", "Linux", "Networking", "Wireshark"],
    bio: "IT graduate with cybersecurity specialization looking for SOC analyst roles.",
  },
  {
    first_name: "Miriam",   last_name: "Ocampo",       email: "miriam.ocampo@alumnihub.com",
    student_number: "2018-00313", batch_year: 2018, graduation_year: 2022, program_idx: 2,
    phone: "+63 929 300 0013", date_of_birth: "2000-08-04", gender: "Female",
    city: "San Juan",     address: "11 N. Domingo St, San Juan",
    linkedin_url: "https://linkedin.com/in/miriam-ocampo-ph",
    skills: ["UI/UX Design", "Figma", "Adobe XD", "Prototyping"],
    bio: "CS graduate specializing in UI/UX, building portfolio while job-hunting.",
  },
  {
    first_name: "Nathan",   last_name: "Pascua",       email: "nathan.pascua@alumnihub.com",
    student_number: "2019-00314", batch_year: 2019, graduation_year: 2023, program_idx: 3,
    phone: "+63 930 300 0014", date_of_birth: "2001-04-21", gender: "Male",
    city: "Pasay",        address: "8 Roxas Blvd, Pasay",
    linkedin_url: "https://linkedin.com/in/nathan-pascua-ph",
    skills: ["PCB Design", "Embedded C", "FPGA", "Altium"],
    bio: "CpE grad open to hardware design and electronics R&D roles.",
  },
  {
    first_name: "Olive",    last_name: "Quirino",      email: "olive.quirino@alumnihub.com",
    student_number: "2018-00315", batch_year: 2018, graduation_year: 2022, program_idx: 0,
    phone: "+63 931 300 0015", date_of_birth: "2000-01-27", gender: "Female",
    city: "Quezon City",  address: "3 Maginhawa St, Teacher's Village",
    linkedin_url: "https://linkedin.com/in/olive-quirino-ph",
    skills: ["Web Development", "HTML", "CSS", "JavaScript"],
    bio: "IS graduate with freelance web dev experience, seeking full-time work.",
  },
  {
    first_name: "Paolo",    last_name: "Reyes",        email: "paolo.reyes@alumnihub.com",
    student_number: "2019-00316", batch_year: 2019, graduation_year: 2023, program_idx: 1,
    phone: "+63 932 300 0016", date_of_birth: "2001-07-15", gender: "Male",
    city: "Makati",       address: "25 Chino Roces Ave, Makati",
    linkedin_url: "https://linkedin.com/in/paolo-reyes-ph",
    skills: ["Cloud Computing", "AWS", "Docker", "Linux"],
    bio: "IT graduate targeting cloud or DevOps entry-level positions.",
  },
  {
    first_name: "Rachel",   last_name: "Santos",       email: "rachel.santos@alumnihub.com",
    student_number: "2018-00317", batch_year: 2018, graduation_year: 2022, program_idx: 2,
    phone: "+63 933 300 0017", date_of_birth: "2000-11-19", gender: "Female",
    city: "Taguig",       address: "16 28th St, BGC",
    linkedin_url: "https://linkedin.com/in/rachel-santos-ph",
    skills: ["Mobile Development", "Flutter", "Dart", "Firebase"],
    bio: "CS graduate who built two mobile apps during college, now job-seeking.",
  },
  {
    first_name: "Samuel",   last_name: "Torres",       email: "samuel.torres@alumnihub.com",
    student_number: "2019-00318", batch_year: 2019, graduation_year: 2023, program_idx: 4,
    phone: "+63 934 300 0018", date_of_birth: "2001-02-06", gender: "Male",
    city: "Pasig",        address: "60 San Miguel Ave, Ortigas",
    linkedin_url: "https://linkedin.com/in/samuel-torres-ph",
    skills: ["Instrumentation", "PLC Programming", "AutoCAD", "MATLAB"],
    bio: "ECE graduate open to instrumentation, automation, and controls roles.",
  },
  {
    first_name: "Theresa",  last_name: "Uy",           email: "theresa.uy@alumnihub.com",
    student_number: "2018-00319", batch_year: 2018, graduation_year: 2022, program_idx: 0,
    phone: "+63 935 300 0019", date_of_birth: "2000-09-12", gender: "Female",
    city: "Mandaluyong",  address: "7 Pioneer St, Mandaluyong",
    linkedin_url: "https://linkedin.com/in/theresa-uy-ph",
    skills: ["Data Entry", "Excel", "SQL", "Tableau"],
    bio: "IS graduate with internship experience in data management, looking for analyst roles.",
  },
  {
    first_name: "Ulysses",  last_name: "Valdez",       email: "ulysses.valdez@alumnihub.com",
    student_number: "2019-00320", batch_year: 2019, graduation_year: 2023, program_idx: 1,
    phone: "+63 936 300 0020", date_of_birth: "2001-05-28", gender: "Male",
    city: "Quezon City",  address: "40 Batangas St, Sta. Mesa Heights",
    linkedin_url: "https://linkedin.com/in/ulysses-valdez-ph",
    skills: ["Technical Support", "Windows", "Active Directory", "Networking"],
    bio: "IT graduate with helpdesk OJT experience, eager to start IT support career.",
  },
];

async function getUserByEmail(email) {
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  return users.find((u) => u.email === email) ?? null;
}

async function main() {
  const results = { created: 0, skipped: 0, failed: 0 };
  console.log(`\nSeeding ${ALUMNI.length} unemployed alumni...\n`);

  for (const a of ALUMNI) {
    const program    = PROGRAMS[a.program_idx];
    const department = DEPARTMENTS[program];

    // 1. Create auth user
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

    // 2. Upsert full profile — no current_job_title / current_company / industry
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
      console.log(`  ✓ created  ${a.first_name} ${a.last_name} <${a.email}>`);
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
