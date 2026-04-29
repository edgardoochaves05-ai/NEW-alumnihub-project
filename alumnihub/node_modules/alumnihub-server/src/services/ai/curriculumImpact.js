const { supabase } = require("../../config/supabase.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function callGemini(prompt) {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
  ].filter(Boolean);
  if (keys.length === 0) throw new Error("No GEMINI_API_KEY configured.");
  const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];
  let lastError;
  for (const modelName of MODELS) {
    for (const key of keys) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
      } catch (err) {
        lastError = err;
        const msg = (err.message ?? "").toLowerCase();
        const isTransient = msg.includes("quota") || msg.includes("rate") ||
                            msg.includes("exhausted") || msg.includes("429") ||
                            msg.includes("503") || msg.includes("unavailable") ||
                            msg.includes("overloaded") || msg.includes("high demand") ||
                            msg.includes("try again") || err.status === 429 || err.status === 503;
        if (!isTransient) throw err;
      }
    }
  }
  throw lastError;
}

async function generateCurriculumImpact(program, options = {}) {
  const { yearStart, yearEnd } = options;

  let query = supabase
    .from("profiles")
    .select("id, first_name, last_name, graduation_year, current_job_title, current_company, industry, program, department, skills, career_milestones(*)")
    .eq("role", "alumni")
    .eq("program", program);

  if (yearStart) query = query.gte("graduation_year", yearStart);
  if (yearEnd)   query = query.lte("graduation_year", yearEnd);

  const { data: alumni, error } = await query;
  if (error) throw error;

  if (!alumni || alumni.length < 2) {
    return {
      program,
      totalGraduates: alumni?.length || 0,
      summary: `Not enough alumni data for ${program}. At least 2 alumni profiles are needed.`,
      message: "Insufficient alumni data for this program. At least 2 alumni profiles are needed.",
    };
  }

  const totalAlumni    = alumni.length;
  const employedAlumni = alumni.filter((a) => a.current_job_title);
  const employmentRate      = Math.round((employedAlumni.length / totalAlumni) * 100);
  const avgTimeToEmployment = computeAvgTimeToEmployment(alumni);
  const avgProgressionScore = computeCareerProgressionScore(alumni);

  const topIndustries = computeTopItems(employedAlumni, "industry", 8)
    .map((i) => ({ industry: i.name, count: i.count, percentage: i.percentage }));
  const topJobTitles = computeTopItems(employedAlumni, "current_job_title", 10)
    .map((i) => ({ title: i.name, count: i.count, percentage: i.percentage }));
  const topCompanies = computeTopItems(employedAlumni, "current_company", 8)
    .map((i) => ({ company: i.name, count: i.count, percentage: i.percentage }));
  const topSkills = computeSkillsDemandAlignment(alumni);

  const graduationRange = yearStart && yearEnd
    ? `${yearStart}–${yearEnd}`
    : computeGraduationRange(alumni);

  // Build alumni lookup maps for chart drill-down
  const alumniByIndustry = {};
  const alumniByTitle    = {};
  const alumniByCompany  = {};

  for (const alum of alumni) {
    const slim = {
      id:               alum.id,
      first_name:       alum.first_name,
      last_name:        alum.last_name,
      graduation_year:  alum.graduation_year,
      current_job_title: alum.current_job_title,
      current_company:  alum.current_company,
      industry:         alum.industry,
    };
    if (alum.industry) {
      (alumniByIndustry[alum.industry] = alumniByIndustry[alum.industry] || []).push(slim);
    }
    if (alum.current_job_title) {
      (alumniByTitle[alum.current_job_title] = alumniByTitle[alum.current_job_title] || []).push(slim);
    }
    if (alum.current_company) {
      (alumniByCompany[alum.current_company] = alumniByCompany[alum.current_company] || []).push(slim);
    }
  }

  // Short factual summary (no AI) shown in the top blue banner
  const summary = buildSummaryLine({ program, totalAlumni, employmentRate, graduationRange, topIndustries });

  // Gemini-generated insights shown in the AI Insights card
  let insights = null;
  try {
    insights = await generateGeminiInsights({
      program, totalAlumni, employmentRate, avgTimeToEmployment,
      avgProgressionScore, topIndustries, topJobTitles, topCompanies, topSkills,
    });
  } catch {
    insights = buildFallbackInsights({
      program, totalAlumni, employmentRate, avgTimeToEmployment,
      topIndustries, topJobTitles, avgProgressionScore,
    });
  }

  const report = {
    program,
    totalGraduates:      totalAlumni,
    employmentRate,
    avgProgressionScore,
    topIndustries,
    topJobTitles,
    topCompanies,
    topSkills,
    summary,   // short factual line → blue banner
    insights,  // Gemini narrative → AI Insights card (only one)
    department:                    alumni[0]?.department || null,
    graduation_year_range:         graduationRange,
    avg_time_to_employment_months: avgTimeToEmployment,
    alumniByIndustry,
    alumniByTitle,
    alumniByCompany,
  };

  supabase.from("curriculum_impact").insert({
    program,
    department:                    report.department,
    graduation_year_range:         graduationRange,
    total_alumni_analyzed:         totalAlumni,
    employment_rate:               employmentRate,
    avg_time_to_employment_months: avgTimeToEmployment,
    top_industries:                topIndustries,
    top_job_titles:                topJobTitles,
    top_companies:                 topCompanies,
    avg_career_progression_score:  avgProgressionScore,
    skills_demand_alignment:       topSkills,
    insights,
  }).then(() => {}).catch(() => {});

  return report;
}

async function generateGeminiInsights({ program, totalAlumni, employmentRate, avgTimeToEmployment, avgProgressionScore, topIndustries, topJobTitles, topCompanies, topSkills }) {
  const prompt = `You are an educational analytics expert advising a Philippine university's curriculum committee.

Analyze the following alumni career outcome data for ${program} and write 2–3 paragraphs of actionable insights for curriculum improvement. Be specific, reference the actual numbers, and focus on: what the data reveals about curriculum strengths, skill gaps, and concrete recommendations to improve graduate outcomes.

Write in plain text — no bullet points, no markdown, no headers.

Program: ${program}
Alumni analyzed: ${totalAlumni}
Employment rate: ${employmentRate}%
Avg months to first employment: ${avgTimeToEmployment ?? "unknown"}
Career progression score: ${avgProgressionScore}/100

Top industries: ${topIndustries.slice(0, 5).map(i => `${i.industry} (${i.count} alumni, ${i.percentage}%)`).join(", ")}
Top job titles: ${topJobTitles.slice(0, 5).map(j => j.title).join(", ")}
Top employers: ${topCompanies.slice(0, 5).map(c => c.company).join(", ")}
Top skills: ${topSkills.slice(0, 8).map(s => s.skill).join(", ")}`;

  return await callGemini(prompt);
}

function buildSummaryLine({ program, totalAlumni, employmentRate, graduationRange, topIndustries }) {
  const topInd = topIndustries[0]?.industry;
  return `${totalAlumni} alumni from ${program} (${graduationRange}) analyzed — ${employmentRate}% employment rate${topInd ? `, primarily in ${topInd}` : ""}.`;
}

function buildFallbackInsights({ program, totalAlumni, employmentRate, avgTimeToEmployment, topIndustries, topJobTitles, avgProgressionScore }) {
  let text = `Analysis of ${totalAlumni} alumni from ${program}: employment rate is ${employmentRate}%. `;
  if (avgTimeToEmployment !== null) text += `Graduates find employment in an average of ${avgTimeToEmployment} months. `;
  if (topIndustries.length > 0) text += `Top industries: ${topIndustries.slice(0, 3).map(i => `${i.industry} (${i.percentage}%)`).join(", ")}. `;
  if (topJobTitles.length > 0) text += `Most common roles: ${topJobTitles.slice(0, 3).map(j => j.title).join(", ")}. `;
  const level = avgProgressionScore >= 70 ? "strong" : avgProgressionScore >= 40 ? "moderate" : "developing";
  text += `Career progression is rated ${level} (${avgProgressionScore}/100).`;
  return text;
}

async function getAvailablePrograms() {
  const { data } = await supabase
    .from("profiles")
    .select("program")
    .eq("role", "alumni")
    .not("program", "is", null);
  const programs = [...new Set(data?.map((p) => p.program).filter(Boolean))];
  return programs.sort();
}

async function getOverallStats() {
  const { data: alumni } = await supabase
    .from("profiles")
    .select("program, current_job_title, industry, graduation_year")
    .eq("role", "alumni");

  if (!alumni) return null;

  const totalAlumni = alumni.length;
  const employed    = alumni.filter((a) => a.current_job_title).length;
  const programs    = [...new Set(alumni.map((a) => a.program).filter(Boolean))];

  const programStats = programs.map((prog) => {
    const progAlumni   = alumni.filter((a) => a.program === prog);
    const progEmployed = progAlumni.filter((a) => a.current_job_title).length;
    return {
      program:        prog,
      total:          progAlumni.length,
      employed:       progEmployed,
      employmentRate: progAlumni.length > 0 ? Math.round((progEmployed / progAlumni.length) * 100) : 0,
    };
  });

  return {
    totalAlumni,
    totalEmployed:        employed,
    overallEmploymentRate: totalAlumni > 0 ? Math.round((employed / totalAlumni) * 100) : 0,
    totalPrograms:        programs.length,
    programStats:         programStats.sort((a, b) => b.employmentRate - a.employmentRate),
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function computeAvgTimeToEmployment(alumni) {
  const times = [];
  for (const alum of alumni) {
    if (!alum.graduation_year || !alum.career_milestones?.length) continue;
    const firstJob = alum.career_milestones
      .filter((m) => m.milestone_type === "job" && m.start_date)
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))[0];
    if (firstJob) {
      const gradDate = new Date(alum.graduation_year, 3);
      const jobDate  = new Date(firstJob.start_date);
      const months   = (jobDate.getFullYear() - gradDate.getFullYear()) * 12 +
                       jobDate.getMonth() - gradDate.getMonth();
      if (months >= 0 && months <= 60) times.push(months);
    }
  }
  if (times.length === 0) return null;
  return Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) / 10;
}

function computeTopItems(alumni, field, limit = 5) {
  const counts = {};
  for (const alum of alumni) {
    const value = alum[field];
    if (value) counts[value] = (counts[value] || 0) + 1;
  }
  const total = alumni.length || 1;
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count, percentage: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function computeCareerProgressionScore(alumni) {
  const scores = [];
  for (const alum of alumni) {
    const milestones = alum.career_milestones || [];
    if (milestones.length === 0) continue;
    let score = 0;
    score += Math.min(milestones.length * 10, 40);
    score += milestones.filter((m) => m.milestone_type === "promotion").length * 15;
    score += milestones.filter((m) => m.milestone_type === "certification").length * 10;
    score += milestones.filter((m) => m.milestone_type === "award").length * 10;
    scores.push(Math.min(score, 100));
  }
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function computeSkillsDemandAlignment(alumni) {
  const skillCounts = {};
  for (const alum of alumni) {
    const skills = [
      ...(alum.skills || []),
      ...(alum.career_milestones || []).flatMap((m) => m.skills_used || []),
    ];
    for (const skill of skills) {
      const normalized = skill.toLowerCase().trim();
      skillCounts[normalized] = (skillCounts[normalized] || 0) + 1;
    }
  }
  return Object.entries(skillCounts)
    .map(([skill, count]) => ({ skill, count, percentage: Math.round((count / alumni.length) * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
}

function computeGraduationRange(alumni) {
  const years = alumni.map((a) => a.graduation_year).filter(Boolean);
  if (years.length === 0) return "N/A";
  return `${Math.min(...years)}–${Math.max(...years)}`;
}

module.exports = { generateCurriculumImpact, getAvailablePrograms, getOverallStats };
