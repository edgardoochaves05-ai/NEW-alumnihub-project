import { supabase } from "../../config/supabase.js";

/**
 * Smart Job Matching Engine
 *
 * Matches alumni profiles with job listings using multi-factor scoring:
 * - Skill overlap (40% weight)
 * - Industry alignment (25% weight)
 * - Experience level fit (20% weight)
 * - Program relevance (15% weight)
 */

const WEIGHTS = {
  skills: 0.40,
  industry: 0.25,
  experience: 0.20,
  program: 0.15,
};

export async function computeJobMatches(profileId) {
  // 1. Get alumni profile with milestones
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, career_milestones(*)")
    .eq("id", profileId)
    .single();

  if (!profile) throw new Error("Profile not found");

  // 2. Get all active job listings
  const { data: jobs } = await supabase
    .from("job_listings")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (!jobs || jobs.length === 0) return [];

  // 3. Compute match scores
  const matches = jobs.map((job) => {
    const score = computeMatchScore(profile, job);
    return { ...score, job };
  });

  // 4. Sort by score and store top matches
  matches.sort((a, b) => b.totalScore - a.totalScore);

  // 5. Upsert scores into database
  const upsertData = matches.map((m) => ({
    profile_id: profileId,
    job_id: m.job.id,
    match_score: m.totalScore,
    matching_skills: m.matchingSkills,
    score_breakdown: {
      skills: m.skillScore,
      industry: m.industryScore,
      experience: m.experienceScore,
      program: m.programScore,
    },
  }));

  await supabase.from("job_match_scores").upsert(upsertData, {
    onConflict: "profile_id,job_id",
  });

  return matches;
}

function computeMatchScore(profile, job) {
  const skillScore = computeSkillScore(profile, job);
  const industryScore = computeIndustryScore(profile, job);
  const experienceScore = computeExperienceScore(profile, job);
  const programScore = computeProgramScore(profile, job);

  const totalScore = Math.round(
    skillScore.score * WEIGHTS.skills +
    industryScore * WEIGHTS.industry +
    experienceScore * WEIGHTS.experience +
    programScore * WEIGHTS.program
  );

  return {
    totalScore: Math.min(100, totalScore),
    skillScore: skillScore.score,
    matchingSkills: skillScore.matchingSkills,
    industryScore,
    experienceScore,
    programScore,
  };
}

function computeSkillScore(profile, job) {
  const profileSkills = (profile.skills || []).map((s) => s.toLowerCase().trim());
  const jobSkills = (job.required_skills || []).map((s) => s.toLowerCase().trim());

  if (jobSkills.length === 0) return { score: 50, matchingSkills: [] }; // Neutral if no skills specified

  // Also consider skills from career milestones
  const milestoneSkills = (profile.career_milestones || [])
    .flatMap((m) => m.skills_used || [])
    .map((s) => s.toLowerCase().trim());

  const allProfileSkills = [...new Set([...profileSkills, ...milestoneSkills])];
  const matchingSkills = jobSkills.filter((js) =>
    allProfileSkills.some((ps) => ps.includes(js) || js.includes(ps))
  );

  const score = Math.round((matchingSkills.length / jobSkills.length) * 100);
  return { score, matchingSkills };
}

function computeIndustryScore(profile, job) {
  if (!job.industry) return 50;

  const profileIndustry = (profile.industry || "").toLowerCase();
  const jobIndustry = job.industry.toLowerCase();

  // Exact match
  if (profileIndustry === jobIndustry) return 100;

  // Check milestone industries
  const milestoneIndustries = (profile.career_milestones || [])
    .map((m) => (m.industry || "").toLowerCase())
    .filter(Boolean);

  if (milestoneIndustries.includes(jobIndustry)) return 80;

  // Partial match (e.g., "information technology" contains "technology")
  if (profileIndustry.includes(jobIndustry) || jobIndustry.includes(profileIndustry)) return 60;

  return 20;
}

function computeExperienceScore(profile, job) {
  if (!job.experience_level) return 50;

  const milestones = profile.career_milestones || [];
  const yearsOfExperience = calculateYearsOfExperience(milestones);

  const levelYears = { entry: 0, mid: 2, senior: 5, executive: 10 };
  const requiredYears = levelYears[job.experience_level] || 0;

  // Perfect fit: within ±1 year of required
  const diff = Math.abs(yearsOfExperience - requiredYears);
  if (diff <= 1) return 100;
  if (diff <= 2) return 75;
  if (diff <= 3) return 50;
  return 25;
}

function computeProgramScore(profile, job) {
  // Map programs to relevant industries
  const programIndustryMap = {
    "information systems": ["information technology", "software", "consulting", "fintech"],
    "information technology": ["information technology", "software", "networking", "cybersecurity"],
    "computer science": ["software", "information technology", "ai", "data science"],
    "business administration": ["consulting", "finance", "marketing", "management"],
    "engineering": ["engineering", "manufacturing", "construction", "technology"],
  };

  const program = (profile.program || "").toLowerCase();
  const jobIndustry = (job.industry || "").toLowerCase();

  for (const [prog, industries] of Object.entries(programIndustryMap)) {
    if (program.includes(prog)) {
      if (industries.some((ind) => jobIndustry.includes(ind) || ind.includes(jobIndustry))) {
        return 100;
      }
      return 40;
    }
  }

  return 50; // Default neutral
}

function calculateYearsOfExperience(milestones) {
  if (milestones.length === 0) return 0;

  const sorted = milestones
    .filter((m) => m.start_date)
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  if (sorted.length === 0) return 0;

  const earliest = new Date(sorted[0].start_date);
  const now = new Date();
  return Math.round((now - earliest) / (365.25 * 24 * 60 * 60 * 1000));
}
