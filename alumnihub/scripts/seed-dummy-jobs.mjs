/**
 * Seed dummy job listings posted by the dummy alumni accounts.
 * Run from the alumnihub/ directory:
 *   node scripts/seed-dummy-jobs.mjs
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

// Alumni emails (from seed-dummy-accounts.mjs)
const ALUMNI_EMAILS = [
  "ana.reyes@alumnihub.com",
  "carlo.mendoza@alumnihub.com",
  "diana.cruz@alumnihub.com",
  "emilio.garcia@alumnihub.com",
  "felicia.torres@alumnihub.com",
  "gian.bautista@alumnihub.com",
  "hannah.villanueva@alumnihub.com",
  "ivan.lim@alumnihub.com",
  "jasmine.ocampo@alumnihub.com",
  "kevin.aquino@alumnihub.com",
  "laura.santos@alumnihub.com",
  "miguel.delarosa@alumnihub.com",
  "nina.pascual@alumnihub.com",
  "oscar.fernandez@alumnihub.com",
  "patricia.navarro@alumnihub.com",
];

// Job templates — 2 jobs per alumni (30 total)
const JOB_TEMPLATES = [
  {
    title: "Junior Software Engineer",
    company: "Accenture Philippines",
    description: "Join our dynamic team building enterprise web applications. You will collaborate with senior engineers to design, develop, and maintain scalable software solutions for our global clients.",
    requirements: "Bachelor's degree in CS, IT, or related field. Proficiency in JavaScript or Python. Familiarity with REST APIs and Git. Strong problem-solving skills.",
    location: "BGC, Taguig",
    job_type: "full-time",
    industry: "Information Technology",
    salary_min: 25000,
    salary_max: 35000,
    salary_currency: "PHP",
    required_skills: ["JavaScript", "React", "Node.js", "Git"],
    experience_level: "entry",
    application_email: "careers@accenture.ph",
  },
  {
    title: "Systems Analyst",
    company: "Concentrix",
    description: "Analyze and improve existing IT systems to support business operations. Work closely with stakeholders to gather requirements and design efficient solutions.",
    requirements: "2+ years experience in systems analysis. Knowledge of SDLC methodologies. Excellent documentation and communication skills.",
    location: "Quezon City",
    job_type: "full-time",
    industry: "Information Technology",
    salary_min: 30000,
    salary_max: 45000,
    salary_currency: "PHP",
    required_skills: ["Systems Analysis", "SQL", "Documentation", "Agile"],
    experience_level: "mid",
    application_email: "jobs@concentrix.com",
  },
  {
    title: "Data Analyst Intern",
    company: "Globe Telecom",
    description: "Support the data analytics team in processing and visualizing telecom data. Generate reports and dashboards to help management make data-driven decisions.",
    requirements: "Currently enrolled in BS IT, CS, or Statistics. Familiar with Excel and basic SQL. Willing to commit for 3–6 months.",
    location: "Mandaluyong",
    job_type: "internship",
    industry: "Telecommunications",
    salary_min: 10000,
    salary_max: 15000,
    salary_currency: "PHP",
    required_skills: ["Excel", "SQL", "Power BI", "Data Analysis"],
    experience_level: "entry",
    application_email: "internships@globe.com.ph",
  },
  {
    title: "Network Administrator",
    company: "PLDT",
    description: "Maintain and monitor network infrastructure across multiple sites. Ensure 99.9% uptime and respond to network incidents in a timely manner.",
    requirements: "CCNA certification preferred. 1–3 years of network administration experience. Hands-on experience with routers, switches, and firewalls.",
    location: "Makati",
    job_type: "full-time",
    industry: "Telecommunications",
    salary_min: 35000,
    salary_max: 50000,
    salary_currency: "PHP",
    required_skills: ["Cisco", "Networking", "Firewall", "Linux"],
    experience_level: "mid",
    application_email: "recruitment@pldt.com.ph",
  },
  {
    title: "IT Project Manager",
    company: "BDO Unibank",
    description: "Lead digital transformation projects for one of the Philippines' largest banks. Coordinate cross-functional teams and deliver projects on time and within budget.",
    requirements: "PMP or CAPM certification is a plus. 3+ years in IT project management. Strong stakeholder management and risk assessment skills.",
    location: "Ortigas, Pasig",
    job_type: "full-time",
    industry: "Banking and Finance",
    salary_min: 60000,
    salary_max: 90000,
    salary_currency: "PHP",
    required_skills: ["Project Management", "Agile", "JIRA", "Stakeholder Management"],
    experience_level: "senior",
    application_email: "careers@bdo.com.ph",
  },
  {
    title: "Full Stack Developer",
    company: "Metrobank",
    description: "Develop and maintain web-based banking applications. Collaborate with the UX team to implement responsive, accessible interfaces backed by robust APIs.",
    requirements: "Proficiency in React and Node.js or Spring Boot. Experience with relational databases. Knowledge of banking security standards is a plus.",
    location: "Makati",
    job_type: "full-time",
    industry: "Banking and Finance",
    salary_min: 45000,
    salary_max: 65000,
    salary_currency: "PHP",
    required_skills: ["React", "Node.js", "PostgreSQL", "REST APIs"],
    experience_level: "mid",
    application_email: "it.recruitment@metrobank.com.ph",
  },
  {
    title: "QA Engineer",
    company: "Sprout Solutions",
    description: "Ensure software quality through manual and automated testing. Write test cases, report bugs, and work closely with developers to deliver reliable HR tech products.",
    requirements: "ISTQB certification is a plus. Experience with Selenium or Cypress. Strong attention to detail and analytical mindset.",
    location: "Remote (Philippines)",
    job_type: "full-time",
    industry: "Software Development",
    salary_min: 30000,
    salary_max: 45000,
    salary_currency: "PHP",
    required_skills: ["QA Testing", "Selenium", "Test Cases", "Bug Reporting"],
    experience_level: "mid",
    application_email: "jobs@sprout.ph",
  },
  {
    title: "Database Administrator",
    company: "UnionBank",
    description: "Manage and optimize PostgreSQL and Oracle databases supporting our digital banking platform. Ensure data integrity, backup, and disaster recovery protocols.",
    requirements: "3+ years of DBA experience. Proficient in PostgreSQL or Oracle. Experience with cloud databases (AWS RDS or Azure SQL) is a plus.",
    location: "Pasig",
    job_type: "full-time",
    industry: "Banking and Finance",
    salary_min: 50000,
    salary_max: 75000,
    salary_currency: "PHP",
    required_skills: ["PostgreSQL", "Oracle", "Database Optimization", "Backup & Recovery"],
    experience_level: "senior",
    application_email: "careers@unionbankph.com",
  },
  {
    title: "DevOps Engineer",
    company: "Lazada Philippines",
    description: "Build and maintain CI/CD pipelines and cloud infrastructure for one of Southeast Asia's largest e-commerce platforms. Drive automation and improve deployment reliability.",
    requirements: "Experience with Docker, Kubernetes, and AWS or GCP. Proficiency in scripting (Bash, Python). Strong understanding of Linux systems.",
    location: "Mandaluyong",
    job_type: "full-time",
    industry: "E-Commerce",
    salary_min: 55000,
    salary_max: 80000,
    salary_currency: "PHP",
    required_skills: ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux"],
    experience_level: "senior",
    application_email: "tech.careers@lazada.com.ph",
  },
  {
    title: "Business Analyst",
    company: "Shopee Philippines",
    description: "Bridge the gap between business stakeholders and technical teams at Shopee. Gather requirements, create functional specs, and support product launches.",
    requirements: "2+ years as a Business Analyst in tech or e-commerce. Strong analytical and communication skills. Familiarity with SQL for data queries.",
    location: "Pasig",
    job_type: "full-time",
    industry: "E-Commerce",
    salary_min: 40000,
    salary_max: 60000,
    salary_currency: "PHP",
    required_skills: ["Business Analysis", "SQL", "Requirements Gathering", "Process Mapping"],
    experience_level: "mid",
    application_email: "careers@shopee.ph",
  },
  {
    title: "Frontend Developer",
    company: "Accenture Philippines",
    description: "Create beautiful, high-performance web UIs for enterprise clients. Work with modern JavaScript frameworks and collaborate with UX designers.",
    requirements: "Strong command of React or Vue.js. Experience with CSS-in-JS and responsive design. Portfolio of past web projects required.",
    location: "BGC, Taguig",
    job_type: "full-time",
    industry: "Information Technology",
    salary_min: 35000,
    salary_max: 55000,
    salary_currency: "PHP",
    required_skills: ["React", "CSS", "TypeScript", "Figma"],
    experience_level: "mid",
    application_email: "careers@accenture.ph",
  },
  {
    title: "Cloud Engineer",
    company: "Globe Telecom",
    description: "Design and manage cloud infrastructure supporting Globe's digital services. Migrate on-premises workloads to AWS and ensure cloud security best practices.",
    requirements: "AWS Solutions Architect or equivalent certification preferred. Experience with Terraform and infrastructure-as-code. Strong scripting skills.",
    location: "Mandaluyong",
    job_type: "full-time",
    industry: "Telecommunications",
    salary_min: 60000,
    salary_max: 85000,
    salary_currency: "PHP",
    required_skills: ["AWS", "Terraform", "Docker", "Python", "Cloud Security"],
    experience_level: "senior",
    application_email: "tech@globe.com.ph",
  },
  {
    title: "Mobile Developer (Android)",
    company: "BDO Unibank",
    description: "Build and maintain BDO's Android banking app used by millions of Filipinos. Implement new features, improve performance, and ensure security compliance.",
    requirements: "3+ years in Android development with Kotlin. Experience with banking or fintech apps is a plus. Knowledge of mobile security standards.",
    location: "Ortigas, Pasig",
    job_type: "full-time",
    industry: "Banking and Finance",
    salary_min: 50000,
    salary_max: 70000,
    salary_currency: "PHP",
    required_skills: ["Android", "Kotlin", "Firebase", "REST APIs"],
    experience_level: "senior",
    application_email: "careers@bdo.com.ph",
  },
  {
    title: "IT Support Specialist",
    company: "Sprout Solutions",
    description: "Provide Level 1 and Level 2 technical support to internal staff and clients. Troubleshoot hardware, software, and network issues efficiently.",
    requirements: "CompTIA A+ or equivalent. 1+ year in IT support or help desk. Strong communication and troubleshooting skills.",
    location: "Quezon City",
    job_type: "full-time",
    industry: "Software Development",
    salary_min: 20000,
    salary_max: 30000,
    salary_currency: "PHP",
    required_skills: ["Technical Support", "Windows", "Networking", "Ticketing Systems"],
    experience_level: "entry",
    application_email: "jobs@sprout.ph",
  },
  {
    title: "Cybersecurity Analyst",
    company: "Metrobank",
    description: "Monitor and protect Metrobank's digital assets from cyber threats. Conduct vulnerability assessments, respond to incidents, and implement security controls.",
    requirements: "CEH or CompTIA Security+ certification is a plus. 2+ years in cybersecurity or SOC analyst role. Knowledge of SIEM tools.",
    location: "Makati",
    job_type: "full-time",
    industry: "Banking and Finance",
    salary_min: 50000,
    salary_max: 75000,
    salary_currency: "PHP",
    required_skills: ["Cybersecurity", "SIEM", "Vulnerability Assessment", "Network Security"],
    experience_level: "mid",
    application_email: "it.recruitment@metrobank.com.ph",
  },
  {
    title: "Data Engineer",
    company: "Shopee Philippines",
    description: "Design and maintain data pipelines that power Shopee's analytics and ML models. Work with large-scale data using Spark, Airflow, and cloud data warehouses.",
    requirements: "3+ years as a data engineer. Proficient in Python and SQL. Experience with Apache Spark or Airflow. Knowledge of BigQuery or Redshift.",
    location: "Pasig",
    job_type: "full-time",
    industry: "E-Commerce",
    salary_min: 65000,
    salary_max: 95000,
    salary_currency: "PHP",
    required_skills: ["Python", "Apache Spark", "SQL", "Airflow", "BigQuery"],
    experience_level: "senior",
    application_email: "careers@shopee.ph",
  },
  {
    title: "Scrum Master",
    company: "Lazada Philippines",
    description: "Facilitate Agile ceremonies and remove impediments for 2–3 cross-functional engineering teams. Drive continuous improvement and foster a high-performance culture.",
    requirements: "Certified Scrum Master (CSM) or PSM I. 2+ years as a Scrum Master in a tech company. Experience with JIRA and Confluence.",
    location: "Mandaluyong",
    job_type: "full-time",
    industry: "E-Commerce",
    salary_min: 55000,
    salary_max: 75000,
    salary_currency: "PHP",
    required_skills: ["Scrum", "Agile", "JIRA", "Confluence", "Team Facilitation"],
    experience_level: "mid",
    application_email: "tech.careers@lazada.com.ph",
  },
  {
    title: "Software Engineer Intern",
    company: "Sprout Solutions",
    description: "Work alongside our engineering team to build features for our HR and payroll SaaS platform. Real projects, real impact — not just coffee runs.",
    requirements: "Currently enrolled in BS CS, IT, or CpE. Basic knowledge of any programming language. Willing to learn and take initiative.",
    location: "Remote (Philippines)",
    job_type: "internship",
    industry: "Software Development",
    salary_min: 8000,
    salary_max: 12000,
    salary_currency: "PHP",
    required_skills: ["JavaScript", "Git", "Problem Solving"],
    experience_level: "entry",
    application_email: "internships@sprout.ph",
  },
  {
    title: "UI/UX Designer",
    company: "UnionBank",
    description: "Design intuitive digital banking experiences for web and mobile. Conduct user research, create wireframes, and collaborate with developers to ship pixel-perfect interfaces.",
    requirements: "Portfolio demonstrating strong UI/UX work. Proficient in Figma. Understanding of accessibility standards and design systems.",
    location: "Pasig",
    job_type: "full-time",
    industry: "Banking and Finance",
    salary_min: 40000,
    salary_max: 60000,
    salary_currency: "PHP",
    required_skills: ["Figma", "UI Design", "UX Research", "Prototyping"],
    experience_level: "mid",
    application_email: "careers@unionbankph.com",
  },
  {
    title: "Technical Writer",
    company: "Concentrix",
    description: "Produce clear, accurate technical documentation for internal systems and client-facing products. Work with engineers and product managers to translate complex concepts into readable guides.",
    requirements: "Bachelor's degree in any field. Excellent written English. Experience with tools like Confluence, Notion, or MadCap Flare is a plus.",
    location: "Quezon City",
    job_type: "full-time",
    industry: "Information Technology",
    salary_min: 25000,
    salary_max: 40000,
    salary_currency: "PHP",
    required_skills: ["Technical Writing", "Documentation", "Confluence", "Attention to Detail"],
    experience_level: "entry",
    application_email: "jobs@concentrix.com",
  },
];

async function getAlumniProfiles() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error("listUsers: " + error.message);

  const alumniUsers = users.filter((u) => ALUMNI_EMAILS.includes(u.email));
  return alumniUsers.map((u) => ({ id: u.id, email: u.email }));
}

async function main() {
  console.log("\nFetching dummy alumni profiles...");
  const alumni = await getAlumniProfiles();

  if (alumni.length === 0) {
    console.error("No dummy alumni found. Run seed-dummy-accounts.mjs first.");
    process.exit(1);
  }

  console.log(`Found ${alumni.length} alumni. Seeding ${JOB_TEMPLATES.length} job listings...\n`);

  const results = { created: 0, failed: 0 };

  for (let i = 0; i < JOB_TEMPLATES.length; i++) {
    const poster = alumni[i % alumni.length];
    const job = { ...JOB_TEMPLATES[i], posted_by: poster.id, is_active: true };

    const { error } = await supabase.from("job_listings").insert(job);
    if (error) {
      console.error(`  ✗ failed  "${job.title}": ${error.message}`);
      results.failed++;
    } else {
      console.log(`  ✓ posted  "${job.title}" at ${job.company} — by ${poster.email}`);
      results.created++;
    }
  }

  console.log("\n─────────────────────────────────────────");
  console.log(`  Created : ${results.created}`);
  console.log(`  Failed  : ${results.failed}`);
  console.log("─────────────────────────────────────────\n");

  if (results.failed) process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
