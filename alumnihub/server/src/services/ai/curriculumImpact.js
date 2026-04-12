import { supabase } from "../../config/supabase.js";

/**
 * Curriculum Impact Analytics Engine
 *
 * Analyzes correlations between academic programs and alumni career outcomes.
 * Generates reports for faculty showing:
 * - Employment rates per program
 * - Average time to first employment
 * - Top industries and job titles per program
 * - Skills demand alignment
 * - Career progression scoring
 */

export async function generateCurriculumImpact(program, options = {}) {
  const { yearStart, yearEnd } = options;

  // 1. Get all alumni from the specified program
  let query = supabase
    .from("profiles")
    .select("*, career_milestones(*)")
    .eq("role", "alumni")
    .eq("program", program);

  if (yearStart) query = query.gte("graduation_year", yearStart);
  if (yearEnd) query = query.lte("graduation_year", yearEnd);

  const { data: alumni, error } = await query;

  if (error) throw error;
  if (!alumni || alumni.length < 2) {
    return {
      program,
      message: "Insufficient alumni data for this program. At least 2 alumni profiles are needed.",
      total_alumni: alumni?.length || 0,
    };
  }

  // 2. Compute metrics
  const totalAlumni = alumni.length;
  const employedAlumni = alumni.filter((a) => a.current_job_title);
  const employmentRate = Math.round((employedAlumni.length / totalAlumni) * 100 * 100) / 100;

  const avgTimeToEmployment = computeAvgTimeToEmployment(alumni);
  const topIndustries = computeTopItems(employedAlumni, "industry");
  const topJobTitles = computeTopItems(employedAlumni, "current_job_title");
  const topCompanies = computeTopItems(employedAlumni, "current_company");
  const avgProgressionScore = computeCareerProgressionScore(alumni);
  const skillsDemand = computeSkillsDemandAlignment(alumni);

  const graduationRange = yearStart && yearEnd
    ? `${yearStart}-${yearEnd}`
    : computeGraduationRange(alumni);

  // 3. Generate insights summary
  const insights = generateInsightsSummary({
    program,
    totalAlumni,
    employmentRate,
    avgTimeToEmployment,
    topIndustries,
    topJobTitles,
    avgProgressionScore,
  });

  // 4. Store results
  const report = {
    program,
    department: alumni[0]?.department || null,
    graduation_year_range: graduationRange,
    total_alumni_analyzed: totalAlumni,
    employment_rate: employmentRate,
    avg_time_to_employment_months: avgTimeToEmployment,
    top_industries: topIndustries,
    top_job_titles: topJobTitles,
    top_companies: topCompanies,
    avg_career_progression_score: avgProgressionScore,
    skills_demand_alignment: skillsDemand,
    insights,
  };

  await supabase.from("curriculum_impact").insert(report);

  return report;
}

/**
 * Get all available programs for the analytics dropdown
 */
export async function getAvailablePrograms() {
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
export async function getOverallStats() {
  const { data: alumni } = await supabase
    .from("profiles")
    .select("program, current_job_title, industry, graduation_year")
    .eq("role", "alumni");

  if (!alumni) return null;

  const totalAlumni = alumni.length;
  const employed = alumni.filter((a) => a.current_job_title).length;
  const programs = [...new Set(alumni.map((a) => a.program).filter(Boolean))];

  const programStats = programs.map((prog) => {
    const progAlumni = alumni.filter((a) => a.program === prog);
    const progEmployed = progAlumni.filter((a) => a.current_job_title).length;
    return {
      program: prog,
      total: progAlumni.length,
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
    programStats: programStats.sort((a, b) => b.employmentRate - a.employmentRate),
  };
}

// ── Helper Functions ──

function computeAvgTimeToEmployment(alumni) {
  const times = [];

  for (const alum of alumni) {
    if (!alum.graduation_year || !alum.career_milestones?.length) continue;

    const firstJob = alum.career_milestones
      .filter((m) => m.milestone_type === "job" && m.start_date)
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))[0];

    if (firstJob) {
      const gradDate = new Date(alum.graduation_year, 3); // Approximate April graduation
      const jobDate = new Date(firstJob.start_date);
      const months = (jobDate.getFullYear() - gradDate.getFullYear()) * 12 +
        jobDate.getMonth() - gradDate.getMonth();

      if (months >= 0 && months <= 60) { // Reasonable range: 0-5 years
        times.push(months);
      }
    }
  }

  if (times.length === 0) return null;
  return Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) / 10;
}

function computeTopItems(alumni, field, limit = 5) {
  const counts = {};

  for (const alum of alumni) {
    const value = alum[field];
    if (value) {
      counts[value] = (counts[value] || 0) + 1;
    }
  }

  const total = alumni.length || 1;
  return Object.entries(counts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function computeCareerProgressionScore(alumni) {
  // Score based on: number of milestones, promotions, and current seniority
  const scores = [];

  for (const alum of alumni) {
    const milestones = alum.career_milestones || [];
    if (milestones.length === 0) continue;

    let score = 0;
    score += Math.min(milestones.length * 10, 40); // Up to 40 points for milestones
    score += milestones.filter((m) => m.milestone_type === "promotion").length * 15; // 15 per promotion
    score += milestones.filter((m) => m.milestone_type === "certification").length * 10; // 10 per cert
    score += milestones.filter((m) => m.milestone_type === "award").length * 10; // 10 per award

    scores.push(Math.min(score, 100));
  }

  if (scores.length === 0) return 0;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100;
}

function computeSkillsDemandAlignment(alumni) {
  // Aggregate skills across all alumni and count frequency
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
      alumni_count: count,
      percentage: Math.round((count / alumni.length) * 100),
    }))
    .sort((a, b) => b.alumni_count - a.alumni_count)
    .slice(0, 15);
}

function computeGraduationRange(alumni) {
  const years = alumni.map((a) => a.graduation_year).filter(Boolean);
  if (years.length === 0) return "N/A";
  return `${Math.min(...years)}-${Math.max(...years)}`;
}

function generateInsightsSummary(data) {
  const { program, totalAlumni, employmentRate, avgTimeToEmployment, topIndustries, topJobTitles, avgProgressionScore } = data;

  let summary = `Analysis of ${totalAlumni} alumni from ${program}: `;
  summary += `Employment rate is ${employmentRate}%. `;

  if (avgTimeToEmployment !== null) {
    summary += `Graduates find employment in an average of ${avgTimeToEmployment} months. `;
  }

  if (topIndustries.length > 0) {
    const topInd = topIndustries.slice(0, 3).map((i) => `${i.name} (${i.percentage}%)`).join(", ");
    summary += `Top industries: ${topInd}. `;
  }

  if (topJobTitles.length > 0) {
    const topJobs = topJobTitles.slice(0, 3).map((j) => j.name).join(", ");
    summary += `Most common roles: ${topJobs}. `;
  }

  if (avgProgressionScore > 0) {
    const level = avgProgressionScore >= 70 ? "strong" : avgProgressionScore >= 40 ? "moderate" : "developing";
    summary += `Career progression is rated as ${level} (${avgProgressionScore}/100).`;
  }

  return summary;
}
