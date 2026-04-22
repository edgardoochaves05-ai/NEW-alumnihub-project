const { supabase } = require("../../config/supabase.js");

/**
 * Curriculum Impact Analytics Engine
 *
 * Analyzes correlations between academic programs and alumni career outcomes.
 * Returns data with field names that match the CurriculumImpactPage frontend.
 */

async function generateCurriculumImpact(program, options = {}) {
  const { yearStart, yearEnd } = options;

  // 1. Get all alumni from the specified program
  let query = supabase
    .from("profiles")
    .select("*, career_milestones(*)")
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

  // 2. Compute metrics
  const totalAlumni    = alumni.length;
  const employedAlumni = alumni.filter((a) => a.current_job_title);

  // Integer 0-100
  const employmentRate      = Math.round((employedAlumni.length / totalAlumni) * 100);
  const avgTimeToEmployment = computeAvgTimeToEmployment(alumni);

  // Map field names so frontend charts work out of the box
  const topIndustries = computeTopItems(employedAlumni, "industry")
    .map((i) => ({ industry: i.name, count: i.count, percentage: i.percentage }));

  const topJobTitles = computeTopItems(employedAlumni, "current_job_title")
    .map((i) => ({ title: i.name, count: i.count, percentage: i.percentage }));

  const topCompanies = computeTopItems(employedAlumni, "current_company")
    .map((i) => ({ company: i.name, count: i.count, percentage: i.percentage }));

  const avgProgressionScore = computeCareerProgressionScore(alumni); // 0-100

  // Skills: use "count" key (frontend reads s.count)
  const topSkills = computeSkillsDemandAlignment(alumni);

  const graduationRange = yearStart && yearEnd
    ? `${yearStart}-${yearEnd}`
    : computeGraduationRange(alumni);

  // 3. Build human-readable insights text
  const insights = generateInsightsSummary({
    program, totalAlumni, employmentRate,
    avgTimeToEmployment, topIndustries, topJobTitles, avgProgressionScore,
  });

  // 4. Return with frontend-compatible field names
  const report = {
    program,
    totalGraduates:               totalAlumni,
    employmentRate,               // integer 0-100
    avgProgressionScore,          // integer 0-100
    topIndustries,                // [{industry, count, percentage}]
    topJobTitles,                 // [{title, count, percentage}]
    topCompanies,                 // [{company, count, percentage}]
    topSkills,                    // [{skill, count, percentage}]
    summary:  insights,           // shown in blue AI banner
    insights,                     // shown in AI Insights card
    department:               alumni[0]?.department || null,
    graduation_year_range:    graduationRange,
    avg_time_to_employment_months: avgTimeToEmployment,
  };

  // Persist to curriculum_impact table (best-effort, non-blocking)
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

/**
 * Get all available programs for the analytics dropdown
 */
async function getAvailablePrograms() {
  const { data } = await supabase
    .from("profiles")
    .select("program")
    .eq("role", "alumni")
    .not("program", "is", null);

  const programs = [...new Set(data?.map((p) => p.program).filter(Boolean))];
  return programs.sort();
}

/**
 * Get aggregated stats across all programs
 */
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
    const progAlumni  = alumni.filter((a) => a.program === prog);
    const progEmployed = progAlumni.filter((a) => a.current_job_title).length;
    return {
      program: prog,
      total:   progAlumni.length,
      employed: progEmployed,
      employmentRate: progAlumni.length > 0
        ? Math.round((progEmployed / progAlumni.length) * 100)
        : 0,
    };
  });

  return {
    totalAlumni,
    totalEmployed: employed,
    overallEmploymentRate: totalAlumni > 0 ? Math.round((employed / totalAlumni) * 100) : 0,
    totalPrograms: programs.length,
    programStats:  programStats.sort((a, b) => b.employmentRate - a.employmentRate),
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
    .map(([skill, count]) => ({
      skill,
      count,                                            // ← "count" key (frontend reads s.count)
      percentage: Math.round((count / alumni.length) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
}

function computeGraduationRange(alumni) {
  const years = alumni.map((a) => a.graduation_year).filter(Boolean);
  if (years.length === 0) return "N/A";
  return `${Math.min(...years)}-${Math.max(...years)}`;
}

function generateInsightsSummary({ program, totalAlumni, employmentRate, avgTimeToEmployment, topIndustries, topJobTitles, avgProgressionScore }) {
  let summary = `Analysis of ${totalAlumni} alumni from ${program}: `;
  summary += `Employment rate is ${employmentRate}%. `;

  if (avgTimeToEmployment !== null) {
    summary += `Graduates find employment in an average of ${avgTimeToEmployment} months. `;
  }

  if (topIndustries.length > 0) {
    // Use .industry key (renamed from .name)
    const topInd = topIndustries.slice(0, 3).map((i) => `${i.industry} (${i.percentage}%)`).join(", ");
    summary += `Top industries: ${topInd}. `;
  }

  if (topJobTitles.length > 0) {
    // Use .title key (renamed from .name)
    const topJobs = topJobTitles.slice(0, 3).map((j) => j.title).join(", ");
    summary += `Most common roles: ${topJobs}. `;
  }

  if (avgProgressionScore > 0) {
    const level = avgProgressionScore >= 70 ? "strong" : avgProgressionScore >= 40 ? "moderate" : "developing";
    summary += `Career progression is rated as ${level} (${avgProgressionScore}/100).`;
  }

  return summary;
}

module.exports = { generateCurriculumImpact, getAvailablePrograms, getOverallStats };
