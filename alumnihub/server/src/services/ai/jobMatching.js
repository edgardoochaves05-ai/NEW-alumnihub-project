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
  const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
  let lastError;
  for (const modelName of MODELS) {
    for (const key of keys) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const raw = result.response.text().trim();
        return JSON.parse(raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim());
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

async function computeJobMatches(profileId) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, career_milestones(*)")
    .eq("id", profileId)
    .single();

  if (!profile) throw new Error("Profile not found");

  const { data: jobs } = await supabase
    .from("job_listings")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!jobs || jobs.length === 0) return [];

  let scoredMatches;
  try {
    scoredMatches = await matchJobsWithGemini(profile, jobs);
  } catch {
    scoredMatches = matchJobsRuleBased(profile, jobs);
  }

  scoredMatches.sort((a, b) => b.totalScore - a.totalScore);

  const upsertData = scoredMatches.map((m) => ({
    profile_id: profileId,
    job_id: m.job.id,
    match_score: m.totalScore,
    matching_skills: m.matchingSkills,
    score_breakdown: {
      skills:     m.skillScore,
      industry:   m.industryScore,
      experience: m.experienceScore,
      program:    m.programScore,
    },
  }));

  await supabase.from("job_match_scores").upsert(upsertData, {
    onConflict: "profile_id,job_id",
  });

  return scoredMatches;
}

async function matchJobsWithGemini(profile, jobs) {
  const milestones = (profile.career_milestones || [])
    .sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

  const currentRole = milestones.find((m) => m.is_current) || milestones[0];

  const milestoneLines = milestones.map((m) => {
    const period = [m.start_date, m.end_date || "present"].filter(Boolean).join("–");
    const skills = (m.skills_used || []).join(", ");
    return `- ${m.title || "Unknown"}${m.company ? ` at ${m.company}` : ""}${m.industry ? ` (${m.industry})` : ""} [${period}]${skills ? ` | skills: ${skills}` : ""}`;
  }).join("\n");

  const allSkills = [
    ...(profile.skills || []),
    ...milestones.flatMap((m) => m.skills_used || []),
  ];
  const uniqueSkills = [...new Set(allSkills.map((s) => s.toLowerCase()))];

  const jobsPayload = jobs.map((job, index) => ({
    index,
    title: job.title,
    company: job.company,
    industry: job.industry,
    required_skills: job.required_skills || [],
    experience_level: job.experience_level,
    description: (job.description || "").slice(0, 300),
  }));

  const prompt = `You are a job matching expert. Score how well each job fits this alumni's professional background.

Alumni:
Program: ${profile.program || "not specified"}
Graduation year: ${profile.graduation_year || "not specified"}
Industry: ${profile.industry || "not specified"}
Current title: ${currentRole?.title || "not specified"}
Skills: ${uniqueSkills.join(", ") || "none listed"}
Career milestones:
${milestoneLines || "none"}

Jobs to evaluate:
${JSON.stringify(jobsPayload)}

Return ONLY a valid JSON array — one object per job, in the same order as the input:
[{"job_index":0,"match_score":85,"matching_skills":["skill1","skill2"],"reasoning":"1-2 sentences citing specific overlaps from the alumni career history","score_breakdown":{"skills":90,"industry":80,"experience":75,"program":85}}]

Rules:
- match_score is 0–100 (integer)
- Evaluate using the full career history: role progression, industries worked in, skills from milestones — not just the listed skills array
- reasoning must reference specific details from the alumni's actual background
- Return an entry for EVERY job in the input array, preserving job_index`;

  const geminiResults = await callGemini(prompt);

  return geminiResults.map((r) => {
    const job = jobs[r.job_index];
    if (!job) return null;
    const breakdown = r.score_breakdown || {};
    return {
      totalScore: Math.min(100, Math.max(0, r.match_score || 0)),
      skillScore: breakdown.skills ?? 50,
      industryScore: breakdown.industry ?? 50,
      experienceScore: breakdown.experience ?? 50,
      programScore: breakdown.program ?? 50,
      matchingSkills: r.matching_skills || [],
      reasoning: r.reasoning || "",
      job,
    };
  }).filter(Boolean);
}

// ── Rule-based fallback ──────────────────────────────────────────────────────

const WEIGHTS = { skills: 0.40, industry: 0.25, experience: 0.20, program: 0.15 };

function matchJobsRuleBased(profile, jobs) {
  return jobs.map((job) => {
    const skillScore    = computeSkillScore(profile, job);
    const industryScore = computeIndustryScore(profile, job);
    const experienceScore = computeExperienceScore(profile, job);
    const programScore  = computeProgramScore(profile, job);

    const totalScore = Math.min(100, Math.round(
      skillScore.score     * WEIGHTS.skills +
      industryScore        * WEIGHTS.industry +
      experienceScore      * WEIGHTS.experience +
      programScore         * WEIGHTS.program
    ));

    return {
      totalScore,
      skillScore: skillScore.score,
      matchingSkills: skillScore.matchingSkills,
      industryScore,
      experienceScore,
      programScore,
      job,
    };
  });
}

function computeSkillScore(profile, job) {
  const profileSkills = (profile.skills || []).map((s) => s.toLowerCase().trim());
  const jobSkills     = (job.required_skills || []).map((s) => s.toLowerCase().trim());

  if (jobSkills.length === 0) return { score: 50, matchingSkills: [] };

  const milestoneSkills = (profile.career_milestones || [])
    .flatMap((m) => m.skills_used || [])
    .map((s) => s.toLowerCase().trim());

  const allProfileSkills = [...new Set([...profileSkills, ...milestoneSkills])];
  const matchingSkills   = jobSkills.filter((js) =>
    allProfileSkills.some((ps) => ps.includes(js) || js.includes(ps))
  );

  return { score: Math.round((matchingSkills.length / jobSkills.length) * 100), matchingSkills };
}

function computeIndustryScore(profile, job) {
  if (!job.industry) return 50;
  const profileIndustry = (profile.industry || "").toLowerCase();
  const jobIndustry     = job.industry.toLowerCase();
  if (profileIndustry === jobIndustry) return 100;
  const milestoneIndustries = (profile.career_milestones || [])
    .map((m) => (m.industry || "").toLowerCase()).filter(Boolean);
  if (milestoneIndustries.includes(jobIndustry)) return 80;
  if (profileIndustry.includes(jobIndustry) || jobIndustry.includes(profileIndustry)) return 60;
  return 20;
}

function computeExperienceScore(profile, job) {
  if (!job.experience_level) return 50;
  const milestones = profile.career_milestones || [];
  const yearsOfExperience = calculateYearsOfExperience(milestones);
  const levelYears = { entry: 0, mid: 2, senior: 5, executive: 10 };
  const requiredYears = levelYears[job.experience_level] || 0;
  const diff = Math.abs(yearsOfExperience - requiredYears);
  if (diff <= 1) return 100;
  if (diff <= 2) return 75;
  if (diff <= 3) return 50;
  return 25;
}

function computeProgramScore(profile, job) {
  const programIndustryMap = {
    "information systems":    ["information technology", "software", "consulting", "fintech"],
    "information technology": ["information technology", "software", "networking", "cybersecurity"],
    "computer science":       ["software", "information technology", "ai", "data science"],
    "business administration":["consulting", "finance", "marketing", "management"],
    "engineering":            ["engineering", "manufacturing", "construction", "technology"],
  };
  const program     = (profile.program || "").toLowerCase();
  const jobIndustry = (job.industry || "").toLowerCase();
  for (const [prog, industries] of Object.entries(programIndustryMap)) {
    if (program.includes(prog)) {
      return industries.some((ind) => jobIndustry.includes(ind) || ind.includes(jobIndustry))
        ? 100 : 40;
    }
  }
  return 50;
}

function calculateYearsOfExperience(milestones) {
  const sorted = milestones
    .filter((m) => m.start_date)
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  if (sorted.length === 0) return 0;
  const earliest = new Date(sorted[0].start_date);
  return Math.round((Date.now() - earliest) / (365.25 * 24 * 60 * 60 * 1000));
}

module.exports = { computeJobMatches };
