/**
 * Seeds career milestones for the 30 dummy alumni accounts.
 * Run from alumnihub/: node scripts/seed-career-milestones.mjs
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

// milestones[email] = array of milestone objects (newest first = current job)
const MILESTONES = {
  "ana.reyes@alumnihub.com": [
    { title: "Software Engineer", company: "Accenture Philippines", industry: "Information Technology", location: "BGC, Taguig", start_date: "2021-07-01", end_date: null, is_current: true, milestone_type: "job", skills_used: ["JavaScript", "React", "Node.js", "SQL"], description: "Building enterprise web applications for global clients." },
    { title: "Junior Developer", company: "Exist Software Labs", industry: "Information Technology", location: "Quezon City", start_date: "2021-01-15", end_date: "2021-06-30", is_current: false, milestone_type: "job", skills_used: ["JavaScript", "HTML", "CSS"], description: "OJT-to-hire track. Developed internal tooling." },
  ],
  "carlo.mendoza@alumnihub.com": [
    { title: "Systems Analyst", company: "Concentrix", industry: "Information Technology", location: "Quezon City", start_date: "2021-03-01", end_date: null, is_current: true, milestone_type: "job", skills_used: ["Systems Analysis", "SQL", "Agile"], description: "Analyzing and improving enterprise IT systems." },
    { title: "IT Support Analyst", company: "Telus International Philippines", industry: "Information Technology", location: "Ortigas, Pasig", start_date: "2020-06-01", end_date: "2021-02-28", is_current: false, milestone_type: "job", skills_used: ["Technical Support", "Networking", "Windows"], description: "Provided L2 support for international clients." },
  ],
  "diana.cruz@alumnihub.com": [
    { title: "Data Analyst", company: "Globe Telecom", industry: "Telecommunications", location: "Mandaluyong", start_date: "2022-06-01", end_date: null, is_current: true, milestone_type: "job", skills_used: ["Python", "SQL", "Power BI", "Excel"], description: "Turning raw telecom data into actionable business insights." },
    { title: "Data Analyst Intern", company: "Smart Communications", industry: "Telecommunications", location: "Makati", start_date: "2022-01-01", end_date: "2022-05-31", is_current: false, milestone_type: "internship", skills_used: ["Excel", "SQL"], description: "OJT program — data cleaning and dashboard support." },
  ],
  "emilio.garcia@alumnihub.com": [
    { title: "Network Administrator", company: "PLDT", industry: "Telecommunications", location: "Makati", start_date: "2020-02-01", end_date: null, is_current: true, milestone_type: "job", skills_used: ["Cisco", "Firewall", "Linux", "Networking"], description: "Maintaining critical network infrastructure across multiple sites." },
    { title: "NOC Engineer", company: "Converge ICT", industry: "Telecommunications", location: "Quezon City", start_date: "2019-07-01", end_date: "2020-01-31", is_current: false, milestone_type: "job", skills_used: ["Network Monitoring", "Linux", "Cisco"], description: "24/7 network operations center monitoring." },
  ],
  "felicia.torres@alumnihub.com": [
    { title: "IT Project Manager", company: "BDO Unibank", industry: "Banking and Finance", location: "Ortigas, Pasig", start_date: "2022-01-01", end_date: null, is_current: true, milestone_type: "job", skills_used: ["Project Management", "Agile", "JIRA"], description: "Leading digital transformation projects for a top Philippine bank." },
    { title: "Business Analyst", company: "Accenture Philippines", industry: "Information Technology", location: "BGC, Taguig", start_date: "2021-06-01", end_date: "2021-12-31", is_current: false, milestone_type: "job", skills_used: ["Business Analysis", "Requirements Gathering"], description: "Requirements analysis for banking system migrations." },
    { title: "PMP Certification", company: "Project Management Institute", industry: "Banking and Finance", location: "Online", start_date: "2021-11-01", end_date: "2021-11-30", is_current: false, milestone_type: "certification", skills_used: ["Project Management", "Risk Management"], description: "Passed PMP exam on first attempt." },
  ],
  "gian.bautista@alumnihub.com": [
    { title: "Full Stack Developer", company: "Metrobank", industry: "Banking and Finance", location: "Makati", start_date: "2022-08-01", end_date: null, is_current: true, milestone_type: "job", skills_used: ["React", "Node.js", "PostgreSQL", "REST APIs"], description: "Building secure fintech products for millions of users." },
    { title: "Web Developer", company: "Sprout Solutions", industry: "Software Development", location: "Quezon City", start_date: "2022-02-01", end_date: "2022-07-31", is_current: false, milestone_type: "job", skills_used: ["Vue.js", "PHP", "MySQL"], description: "Developed HR SaaS product features." },
  ],
  "hannah.villanueva@alumnihub.com": [
    { title: "QA Lead", company: "Sprout Solutions", industry: "Software Development", location: "Remote", start_date: "2023-01-01", end_date: null, is_current: true, milestone_type: "promotion", skills_used: ["QA Testing", "Selenium", "Test Plans"], description: "Promoted to QA Lead, managing a team of 4 testers." },
    { title: "QA Engineer", company: "Sprout Solutions", industry: "Software Development", location: "Quezon City", start_date: "2020-08-01", end_date: "2022-12-31", is_current: false, milestone_type: "job", skills_used: ["Manual Testing", "JIRA", "Test Cases"], description: "Ensured software quality across all product releases." },
  ],
  "ivan.lim@alumnihub.com": [
    { title: "Database Administrator", company: "UnionBank", industry: "Banking and Finance", location: "Pasig", start_date: "2021-09-01", end_date: null, is_current: true, milestone_type: "job", skills_used: ["PostgreSQL", "Oracle", "Backup & Recovery"], description: "Managing high-availability DBs for digital banking platform." },
    { title: "Junior DBA", company: "BDO Unibank", industry: "Banking and Finance", location: "Ortigas, Pasig", start_date: "2021-01-01", end_date: "2021-08-31", is_current: false, milestone_type: "job", skills_used: ["MySQL", "SQL Server"], description: "Assisted senior DBAs in database maintenance tasks." },
  ],
  "jasmine.ocampo@alumnihub.com": [
    { title: "DevOps Engineer", company: "Accenture Philippines", industry: "Information Technology", location: "BGC, Taguig", start_date: "2020-04-01", end_date: null, is_current: true, milestone_type: "job", skills_used: ["Docker", "Kubernetes", "AWS", "CI/CD"], description: "Streamlining CI/CD pipelines for global consulting projects." },
    { title: "Systems Engineer", company: "DXC Technology", industry: "Information Technology", location: "Makati", start_date: "2019-07-01", end_date: "2020-03-31", is_current: false, milestone_type: "job", skills_used: ["Linux", "Bash", "Jenkins"], description: "Managed on-premise servers and deployment pipelines." },
  ],
  "kevin.aquino@alumnihub.com": [
    { title: "Business Analyst", company: "Shopee Philippines", industry: "E-Commerce", location: "Pasig", start_date: "2022-10-01", end_date: null, is_current: true, milestone_type: "job", skills_used: ["Business Analysis", "SQL", "Process Mapping"], description: "Bridging IT and business for Shopee's PH operations." },
    { title: "Junior BA", company: "Concentrix", industry: "Information Technology", location: "Quezon City", start_date: "2022-04-01", end_date: "2022-09-30", is_current: false, milestone_type: "job", skills_used: ["Requirements Gathering", "Agile"], description: "Gathered requirements for BPO client systems." },
  ],
  "laura.santos@alumnihub.com": [
    { title: "Software Engineer", company: "Lazada Philippines", industry: "E-Commerce", location: "Mandaluyong", start_date: "2020-11-01", end_date: null, is_current: true, milestone_type: "job", skills_used: ["JavaScript", "React", "Node.js", "AWS"], description: "Building scalable e-commerce platform features." },
    { title: "Frontend Developer", company: "Kalibrr", industry: "Software Development", location: "Makati", start_date: "2020-04-01", end_date: "2020-10-31", is_current: false, milestone_type: "job", skills_used: ["React", "CSS", "REST APIs"], description: "Developed job-matching platform UI components." },
  ],
  "miguel.delarosa@alumnihub.com": [
    { title: "Data Analyst", company: "Shopee Philippines", industry: "E-Commerce", location: "Pasig", start_date: "2021-05-01", end_date: null, is_current: true, milestone_type: "job", skills_used: ["Python", "SQL", "Power BI", "Data Analysis"], description: "Analyzing retail tech data for business decisions." },
    { title: "Electronics Engineer", company: "Emerson Electric", industry: "Manufacturing", location: "Cavite", start_date: "2020-09-01", end_date: "2021-04-30", is_current: false, milestone_type: "job", skills_used: ["Circuit Design", "AutoCAD", "Testing"], description: "Hardware testing and quality assurance for industrial equipment." },
  ],
  "nina.pascual@alumnihub.com": [
    { title: "Senior Data Analyst", company: "Globe Telecom", industry: "Telecommunications", location: "Mandaluyong", start_date: "2022-03-01", end_date: null, is_current: true, milestone_type: "promotion", skills_used: ["Python", "SQL", "Tableau", "Machine Learning"], description: "Leading data analytics for Globe's subscriber insights team." },
    { title: "Data Analyst", company: "Globe Telecom", industry: "Telecommunications", location: "Mandaluyong", start_date: "2019-07-01", end_date: "2022-02-28", is_current: false, milestone_type: "job", skills_used: ["SQL", "Excel", "Power BI"], description: "Built dashboards and reports for the commercial team." },
  ],
  "oscar.fernandez@alumnihub.com": [
    { title: "Network Specialist", company: "PLDT", industry: "Telecommunications", location: "Makati", start_date: "2020-06-01", end_date: null, is_current: true, milestone_type: "job", skills_used: ["Cisco", "Wireless Networking", "CCNP"], description: "Enterprise wireless solutions for PLDT's corporate clients." },
    { title: "Network Engineer", company: "Eastern Telecoms", industry: "Telecommunications", location: "Makati", start_date: "2020-01-01", end_date: "2020-05-31", is_current: false, milestone_type: "job", skills_used: ["Networking", "Cisco", "Linux"], description: "Deployed and maintained enterprise LAN/WAN infrastructure." },
  ],
  "patricia.navarro@alumnihub.com": [
    { title: "Mobile Developer (Android)", company: "BDO Unibank", industry: "Banking and Finance", location: "Ortigas, Pasig", start_date: "2022-07-01", end_date: null, is_current: true, milestone_type: "job", skills_used: ["Kotlin", "Android", "Firebase", "REST APIs"], description: "Building BDO's Android banking app used by millions." },
    { title: "Android Developer Intern", company: "PayMaya Philippines", industry: "Banking and Finance", location: "Taguig", start_date: "2022-01-01", end_date: "2022-06-30", is_current: false, milestone_type: "internship", skills_used: ["Kotlin", "Android", "Git"], description: "Assisted in developing mobile wallet features." },
  ],
  "ramon.castillo@alumnihub.com": [
    { title: "Full Stack Developer", company: "Metrobank", industry: "Banking and Finance", location: "Makati", start_date: "2021-08-01", end_date: null, is_current: true, milestone_type: "job", skills_used: ["React", "Spring Boot", "PostgreSQL"], description: "Building fintech APIs and dashboards for Metrobank's digital team." },
    { title: "Backend Developer", company: "Globe Fintech Innovations", industry: "Banking and Finance", location: "Taguig", start_date: "2021-02-01", end_date: "2021-07-31", is_current: false, milestone_type: "job", skills_used: ["Java", "Spring Boot", "MySQL"], description: "REST API development for mobile banking integrations." },
  ],
  "sofia.ramos@alumnihub.com": [
    { title: "QA Lead", company: "Accenture Philippines", industry: "Information Technology", location: "BGC, Taguig", start_date: "2021-04-01", end_date: null, is_current: true, milestone_type: "promotion", skills_used: ["QA", "Selenium", "Test Strategy", "ISTQB"], description: "Leading QA for a 20-person engineering team." },
    { title: "QA Engineer", company: "Accenture Philippines", industry: "Information Technology", location: "BGC, Taguig", start_date: "2019-07-01", end_date: "2021-03-31", is_current: false, milestone_type: "job", skills_used: ["Manual Testing", "Automation", "JIRA"], description: "Wrote and executed test cases for enterprise apps." },
    { title: "ISTQB Foundation Certification", company: "ISTQB", industry: "Information Technology", location: "Online", start_date: "2020-05-01", end_date: "2020-05-31", is_current: false, milestone_type: "certification", skills_used: ["Software Testing"], description: "Passed ISTQB Foundation Level exam." },
  ],
  "tristan.morales@alumnihub.com": [
    { title: "Database Architect", company: "UnionBank", industry: "Banking and Finance", location: "Pasig", start_date: "2022-05-01", end_date: null, is_current: true, milestone_type: "promotion", skills_used: ["PostgreSQL", "AWS RDS", "Cloud Migration", "Architecture"], description: "Designing cloud-native database solutions for UnionBank." },
    { title: "Database Administrator", company: "UnionBank", industry: "Banking and Finance", location: "Pasig", start_date: "2020-07-01", end_date: "2022-04-30", is_current: false, milestone_type: "job", skills_used: ["PostgreSQL", "Oracle", "Backup & Recovery"], description: "Managed high-availability databases for digital banking." },
  ],
  "ursula.aguilar@alumnihub.com": [
    { title: "DevOps Engineer", company: "Lazada Philippines", industry: "E-Commerce", location: "Mandaluyong", start_date: "2022-09-01", end_date: null, is_current: true, milestone_type: "job", skills_used: ["Docker", "Kubernetes", "GCP", "Terraform"], description: "Automating deployments and managing cloud infra at Lazada." },
    { title: "Cloud Engineer", company: "Accenture Philippines", industry: "Information Technology", location: "BGC, Taguig", start_date: "2022-01-01", end_date: "2022-08-31", is_current: false, milestone_type: "job", skills_used: ["AWS", "Terraform", "CI/CD"], description: "Cloud infrastructure work for enterprise clients." },
  ],
  "victor.flores@alumnihub.com": [
    { title: "Business Analyst", company: "Shopee Philippines", industry: "E-Commerce", location: "Pasig", start_date: "2021-06-01", end_date: null, is_current: true, milestone_type: "job", skills_used: ["Business Analysis", "SQL", "Agile", "JIRA"], description: "Supporting product and tech teams in Shopee's PH market." },
    { title: "Electronics Engineer", company: "Jollibee Foods Corporation", industry: "Food & Beverage", location: "Pasig", start_date: "2020-09-01", end_date: "2021-05-31", is_current: false, milestone_type: "job", skills_used: ["Technical Documentation", "Systems Testing"], description: "Systems analyst for POS and ordering technology." },
  ],
  "wendy.reyes@alumnihub.com": [
    { title: "Senior Software Engineer", company: "Accenture Philippines", industry: "Information Technology", location: "BGC, Taguig", start_date: "2021-10-01", end_date: null, is_current: true, milestone_type: "promotion", skills_used: ["JavaScript", "React", "Node.js", "TypeScript", "AWS"], description: "Tech lead for a squad of 5 engineers on a global banking project." },
    { title: "Software Engineer", company: "Accenture Philippines", industry: "Information Technology", location: "BGC, Taguig", start_date: "2019-07-01", end_date: "2021-09-30", is_current: false, milestone_type: "job", skills_used: ["JavaScript", "React", "Node.js"], description: "Full stack development for enterprise clients." },
  ],
  "xavier.deleon@alumnihub.com": [
    { title: "Systems Analyst", company: "Concentrix", industry: "Information Technology", location: "Quezon City", start_date: "2021-02-01", end_date: null, is_current: true, milestone_type: "job", skills_used: ["SAP", "Systems Analysis", "ERP", "SQL"], description: "ERP implementation and systems analysis for BPO clients." },
    { title: "IT Analyst", company: "IBM Philippines", industry: "Information Technology", location: "Makati", start_date: "2020-06-01", end_date: "2021-01-31", is_current: false, milestone_type: "job", skills_used: ["SQL", "Business Analysis", "Documentation"], description: "Supported SAP system configurations and user training." },
  ],
  "yvonne.santiago@alumnihub.com": [
    { title: "Data Analyst", company: "Globe Telecom", industry: "Telecommunications", location: "Mandaluyong", start_date: "2022-08-01", end_date: null, is_current: true, milestone_type: "job", skills_used: ["SQL", "Python", "Tableau", "Data Analysis"], description: "Converting telecom data into insights for the commercial team." },
    { title: "Research Assistant", company: "University IT Department", industry: "Education", location: "Quezon City", start_date: "2022-01-01", end_date: "2022-07-31", is_current: false, milestone_type: "job", skills_used: ["Data Analysis", "Excel", "Research"], description: "Academic research on network traffic patterns." },
  ],
  "zachary.hernandez@alumnihub.com": [
    { title: "Network Security Engineer", company: "PLDT", industry: "Telecommunications", location: "Makati", start_date: "2021-11-01", end_date: null, is_current: true, milestone_type: "job", skills_used: ["Cybersecurity", "Firewall", "Cisco", "SIEM"], description: "Protecting PLDT's critical network and telecom infrastructure." },
    { title: "Network Engineer", company: "Converge ICT", industry: "Telecommunications", location: "Quezon City", start_date: "2021-04-01", end_date: "2021-10-31", is_current: false, milestone_type: "job", skills_used: ["Cisco", "Linux", "Networking"], description: "Deployed fiber network infrastructure for residential subscribers." },
  ],
  "abigail.lopez@alumnihub.com": [
    { title: "IT Project Manager", company: "BDO Unibank", industry: "Banking and Finance", location: "Ortigas, Pasig", start_date: "2020-03-01", end_date: null, is_current: true, milestone_type: "job", skills_used: ["Project Management", "Agile", "Risk Management", "Stakeholder Management"], description: "Delivering digital banking projects on time and within budget." },
    { title: "Business Analyst", company: "Metrobank", industry: "Banking and Finance", location: "Makati", start_date: "2019-07-01", end_date: "2020-02-28", is_current: false, milestone_type: "job", skills_used: ["Business Analysis", "Requirements Gathering", "Documentation"], description: "Requirements analysis for Metrobank's digital channels." },
  ],
  "benjamin.tan@alumnihub.com": [
    { title: "Full Stack Developer", company: "Metrobank", industry: "Banking and Finance", location: "Makati", start_date: "2020-10-01", end_date: null, is_current: true, milestone_type: "job", skills_used: ["React", "Node.js", "PostgreSQL", "REST APIs"], description: "Building fintech APIs and consumer web banking portal." },
    { title: "Junior Developer", company: "Ayala Land IT", industry: "Real Estate", location: "Makati", start_date: "2020-04-01", end_date: "2020-09-30", is_current: false, milestone_type: "job", skills_used: ["PHP", "Laravel", "MySQL"], description: "Maintained internal property management systems." },
  ],
  "carla.guevara@alumnihub.com": [
    { title: "QA Engineer", company: "Sprout Solutions", industry: "Software Development", location: "Remote", start_date: "2022-10-01", end_date: null, is_current: true, milestone_type: "job", skills_used: ["QA Testing", "Selenium", "Cypress", "ISTQB"], description: "Automated and manual testing for HR SaaS platform." },
    { title: "QA Analyst", company: "Accenture Philippines", industry: "Information Technology", location: "BGC, Taguig", start_date: "2022-04-01", end_date: "2022-09-30", is_current: false, milestone_type: "job", skills_used: ["Manual Testing", "JIRA", "Test Plans"], description: "Testing enterprise applications for global banking clients." },
  ],
  "dante.peralta@alumnihub.com": [
    { title: "Database Administrator", company: "UnionBank", industry: "Banking and Finance", location: "Pasig", start_date: "2021-07-01", end_date: null, is_current: true, milestone_type: "job", skills_used: ["PostgreSQL", "Oracle", "Data Integrity", "Cloud Databases"], description: "Ensuring financial data integrity and database performance." },
    { title: "Junior DBA", company: "Security Bank", industry: "Banking and Finance", location: "Makati", start_date: "2021-01-01", end_date: "2021-06-30", is_current: false, milestone_type: "job", skills_used: ["SQL Server", "MySQL", "Backup"], description: "Database maintenance and performance tuning support." },
  ],
  "elena.valdez@alumnihub.com": [
    { title: "DevOps Lead", company: "Lazada Philippines", industry: "E-Commerce", location: "Mandaluyong", start_date: "2022-02-01", end_date: null, is_current: true, milestone_type: "promotion", skills_used: ["Kubernetes", "AWS", "Terraform", "Python", "CI/CD"], description: "Leading cloud-native transformation for Lazada PH engineering." },
    { title: "DevOps Engineer", company: "Accenture Philippines", industry: "Information Technology", location: "BGC, Taguig", start_date: "2019-07-01", end_date: "2022-01-31", is_current: false, milestone_type: "job", skills_used: ["Docker", "Jenkins", "AWS", "Linux"], description: "Built and maintained CI/CD pipelines for enterprise clients." },
    { title: "AWS Solutions Architect Associate", company: "Amazon Web Services", industry: "Information Technology", location: "Online", start_date: "2021-03-01", end_date: "2021-03-31", is_current: false, milestone_type: "certification", skills_used: ["AWS", "Cloud Architecture"], description: "Passed AWS SAA-C02 certification exam." },
  ],
  "franco.magno@alumnihub.com": [
    { title: "Business Analyst", company: "Shopee Philippines", industry: "E-Commerce", location: "Pasig", start_date: "2020-08-01", end_date: null, is_current: true, milestone_type: "job", skills_used: ["Business Analysis", "SQL", "Agile", "Confluence"], description: "Supporting business strategy through data-driven analysis." },
    { title: "Electronics Engineer", company: "Intel Philippines", industry: "Semiconductors", location: "Cavite", start_date: "2020-02-01", end_date: "2020-07-31", is_current: false, milestone_type: "job", skills_used: ["Circuit Testing", "Failure Analysis", "Documentation"], description: "Failure mode analysis for semiconductor manufacturing." },
  ],
};

async function getAllUsers() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  return Object.fromEntries(users.map((u) => [u.email, u.id]));
}

async function main() {
  console.log("\nFetching users...");
  const emailToId = await getAllUsers();

  let inserted = 0, failed = 0;

  for (const [email, milestones] of Object.entries(MILESTONES)) {
    const profileId = emailToId[email];
    if (!profileId) { console.warn(`  ! not found: ${email}`); continue; }

    for (const m of milestones) {
      const { error } = await supabase.from("career_milestones").insert({ ...m, profile_id: profileId });
      if (error) {
        console.error(`  ✗ [${email}] ${m.title}: ${error.message}`);
        failed++;
      } else {
        console.log(`  ✓ [${email}] ${m.title} @ ${m.company}`);
        inserted++;
      }
    }
  }

  console.log(`\n──────────────────────────────────`);
  console.log(`  Inserted : ${inserted} milestones`);
  console.log(`  Failed   : ${failed}`);
  console.log(`──────────────────────────────────\n`);
  if (failed) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
