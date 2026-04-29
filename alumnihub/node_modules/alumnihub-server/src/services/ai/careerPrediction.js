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
  let lastError;
  for (const key of keys) {
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
  throw lastError;
}

async function generateCareerPredictions(profileId) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, career_milestones(*)")
    .eq("id", profileId)
    .single();

  if (!profile) throw new Error("Profile not found");

  const { data: cvData } = await supabase
    .from("cv_parsed_data")
    .select("parsed_skills, parsed_education")
    .eq("profile_id", profileId)
    .in("status", ["parsed", "confirmed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const profileSkills = profile.skills || [];
  const cvSkills = cvData?.parsed_skills || [];
  const alumniSkills = [...new Set([...profileSkills, ...cvSkills].map(s => s.toLowerCase()))];

  const currentMilestones = profile.career_milestones || [];
  const currentRole = currentMilestones.find((m) => m.is_current);
  const program = profile.program;

  const { data: peerAlumni } = await supabase
    .from("profiles")
    .select("id, graduation_year, current_job_title, industry, career_milestones(*)")
    .eq("program", program)
    .neq("id", profileId)
    .not("current_job_title", "is", null);

  if (!peerAlumni || peerAlumni.length < 3) {
    return {
      predictions: [],
      summary: null,
      skillAlignment: [],
      peerInsights: null,
      message: "Not enough alumni data from your program to generate predictions. At least 3 alumni profiles are needed.",
      sample_size: peerAlumni?.length || 0,
    };
  }

  const careerPaths = analyzeCareerPaths(peerAlumni, currentRole);

  let predictions;
  try {
    predictions = await generatePredictionsWithGemini(profile, careerPaths, alumniSkills, peerAlumni.length, currentRole);
  } catch {
    predictions = generatePredictionResultsFallback(careerPaths, profile, alumniSkills);
  }

  // Always sort by confidence descending so cards are numbered 1 (highest) → 3 (lowest)
  predictions.sort((a, b) => b.confidence - a.confidence);

  const skillAlignment = computeSkillAlignment(careerPaths.slice(0, 3), alumniSkills);
  const summary = buildSummary(profile, alumniSkills, peerAlumni.length);
  const peerInsights = buildPeerInsights(profile, peerAlumni);

  await supabase.from("career_predictions").delete().eq("profile_id", profileId);

  for (const prediction of predictions) {
    await supabase.from("career_predictions").insert({
      profile_id: profileId,
      predicted_role: prediction.role,
      predicted_industry: prediction.industry,
      confidence_score: prediction.confidence,
      time_horizon: prediction.timeHorizon,
      based_on_sample_size: peerAlumni.length,
      reasoning: prediction.reasoning,
      prediction_data: prediction,
    });
  }

  return { predictions, summary, skillAlignment, peerInsights, sample_size: peerAlumni.length };
}

async function generatePredictionsWithGemini(profile, careerPaths, alumniSkills, peerCount, currentRole) {
  const milestones = (profile.career_milestones || [])
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  const milestoneLines = milestones.map((m) => {
    const period = [m.start_date, m.end_date || "present"].filter(Boolean).join("–");
    const skills = (m.skills_used || []).join(", ");
    return `- ${m.title || "Unknown"}${m.company ? ` at ${m.company}` : ""}${m.industry ? ` (${m.industry})` : ""} [${period}]${skills ? ` | skills: ${skills}` : ""}`;
  }).join("\n");

  const topPaths = careerPaths.slice(0, 8).map((p) => {
    const avgMonths = p.timeDiffs.length > 0
      ? Math.round(p.timeDiffs.reduce((a, b) => a + b, 0) / p.timeDiffs.length)
      : null;
    const topSkills = [...new Set(p.skillsUsed)].slice(0, 6).join(", ");
    return `- ${p.role}${p.industry ? ` (${p.industry})` : ""} | ${p.count} peer(s)${avgMonths ? ` | avg ${avgMonths} months to transition` : ""}${topSkills ? ` | common skills: ${topSkills}` : ""}`;
  }).join("\n");

  const VALID_HORIZONS = ["0-1 years", "1-2 years", "2-3 years", "3-5 years"];

  const prompt = `You are a career counselor. Based on the alumni profile and peer patterns, predict the top 3 most likely next career paths.

Alumni:
Program: ${profile.program || "not specified"}
Graduation year: ${profile.graduation_year || "not specified"}
Current role: ${currentRole?.title || "not specified"}${currentRole?.company ? ` at ${currentRole.company}` : ""}
Industry: ${profile.industry || "not specified"}
Skills: ${alumniSkills.join(", ") || "none listed"}
Career milestones:
${milestoneLines || "none"}

Career path patterns from ${peerCount} peer alumni (sorted by frequency):
${topPaths || "no peer data"}

Return ONLY a valid JSON array of exactly 3 predictions, sorted by confidence DESCENDING (index 0 = most likely):
[{"role":"Senior Software Engineer","industry":"Information Technology","confidence":82,"timeHorizon":"1-2 years","reasoning":"2-3 sentences referencing the alumni specific background and peer evidence","requiredSkills":["Docker","Kubernetes"]}]

Rules:
- confidence is 0–100 (integer), array must be sorted highest to lowest
- timeHorizon must be exactly one of: "0-1 years", "1-2 years", "2-3 years", "3-5 years"
- reasoning must be specific to this person — cite their actual roles, industry, skills
- requiredSkills are skills NOT in the alumni current set that are commonly used in this role
- If there is insufficient peer data to fill 3 predictions, use the alumni profile alone to infer plausible paths`;

  const geminiResults = await callGemini(prompt);

  if (!Array.isArray(geminiResults) || geminiResults.length === 0) {
    throw new Error("Gemini returned no predictions");
  }

  return geminiResults.slice(0, 3).map((r) => ({
    role: r.role || "Unknown Role",
    industry: r.industry || "",
    confidence: Math.min(95, Math.max(0, Number(r.confidence) || 50)),
    timeHorizon: VALID_HORIZONS.includes(r.timeHorizon) ? r.timeHorizon : "1-2 years",
    requiredSkills: Array.isArray(r.requiredSkills) ? r.requiredSkills.slice(0, 5) : [],
    reasoning: r.reasoning || "",
    peerCount: 0,
  }));
}

// ── Rule-based fallback ──────────────────────────────────────────────────────

function analyzeCareerPaths(peerAlumni, currentRole) {
  const pathMap = {};

  for (const peer of peerAlumni) {
    const milestones = (peer.career_milestones || []).sort(
      (a, b) => new Date(a.start_date) - new Date(b.start_date)
    );

    for (let i = 0; i < milestones.length - 1; i++) {
      const from = milestones[i].title?.toLowerCase() || "";
      const to = milestones[i + 1].title || "";
      const industry = milestones[i + 1].industry || "";
      const skillsUsed = milestones[i + 1].skills_used || [];
      const key = `${to}|||${industry}`;

      if (!pathMap[key]) {
        pathMap[key] = { role: to, industry, count: 0, fromRoles: [], timeDiffs: [], skillsUsed: [] };
      }
      pathMap[key].count++;
      pathMap[key].fromRoles.push(from);
      pathMap[key].skillsUsed.push(...skillsUsed.map(s => s.toLowerCase()));

      if (milestones[i].start_date && milestones[i + 1].start_date) {
        const months = monthsBetween(milestones[i].start_date, milestones[i + 1].start_date);
        pathMap[key].timeDiffs.push(months);
      }
    }
  }

  return Object.values(pathMap).sort((a, b) => b.count - a.count);
}

function generatePredictionResultsFallback(careerPaths, profile, alumniSkills) {
  const totalPeers = new Set(careerPaths.flatMap((p) => p.fromRoles)).size || 1;
  const predictions = [];
  const topPaths = careerPaths.slice(0, 3);

  for (const path of topPaths) {
    const baseConfidence = Math.min(95, Math.round((path.count / totalPeers) * 100));
    const roleSkills = [...new Set(path.skillsUsed)];
    const overlapCount = alumniSkills.filter(s => roleSkills.includes(s)).length;
    const skillOverlapRatio = roleSkills.length > 0 ? overlapCount / roleSkills.length : 0;
    const adjustedConfidence = Math.min(95, Math.round(baseConfidence * 0.7 + skillOverlapRatio * 30));

    const avgMonths = path.timeDiffs.length > 0
      ? Math.round(path.timeDiffs.reduce((a, b) => a + b, 0) / path.timeDiffs.length)
      : 24;

    const timeHorizon = avgMonths <= 12 ? "0-1 years"
      : avgMonths <= 24 ? "1-2 years"
      : avgMonths <= 36 ? "2-3 years"
      : "3-5 years";

    const requiredSkills = roleSkills
      .filter(s => !alumniSkills.includes(s))
      .slice(0, 5)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1));

    const skillNote = alumniSkills.length > 0
      ? ` Your current skill profile has a ${Math.round(skillOverlapRatio * 100)}% alignment with skills used in this role.`
      : "";

    predictions.push({
      role: path.role,
      industry: path.industry,
      confidence: adjustedConfidence,
      timeHorizon,
      peerCount: path.count,
      avgTransitionMonths: avgMonths,
      requiredSkills,
      reasoning: `Based on ${path.count} alumni from ${profile.program} who followed similar career paths.${skillNote} ${adjustedConfidence}% overall likelihood of transitioning to ${path.role} within ${timeHorizon}.`,
    });
  }

  return predictions;
}

function computeSkillAlignment(topPaths, alumniSkills) {
  if (alumniSkills.length === 0) return [];

  const skillFrequency = {};
  for (const path of topPaths) {
    for (const skill of path.skillsUsed) {
      skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
    }
  }

  const topSkills = Object.entries(skillFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([skill]) => skill);

  return topSkills.map(skill => ({
    skill: skill.charAt(0).toUpperCase() + skill.slice(1),
    match: alumniSkills.includes(skill) ? 1 : 0,
  }));
}

function buildSummary(profile, alumniSkills, peerCount) {
  const skillPhrase = alumniSkills.length > 0
    ? `and ${alumniSkills.length} identified skill${alumniSkills.length !== 1 ? "s" : ""}`
    : "";
  const programPhrase = profile.program ? `in ${profile.program}` : "";
  return `Based on your background ${programPhrase} ${skillPhrase}, we analyzed ${peerCount} peer alumni to predict your most likely career paths.`.replace(/\s+/g, " ").trim();
}

function buildPeerInsights(profile, peerAlumni) {
  const years = peerAlumni.map(p => p.graduation_year).filter(Boolean).sort();
  const yearRange = years.length > 0 ? `${years[0]}–${years[years.length - 1]}` : null;

  const industryCounts = {};
  for (const peer of peerAlumni) {
    if (peer.industry) industryCounts[peer.industry] = (industryCounts[peer.industry] || 0) + 1;
  }
  const topIndustry = Object.entries(industryCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  const parts = [`${peerAlumni.length} alumni from ${profile.program || "your program"}`];
  if (yearRange) parts.push(`graduating between ${yearRange}`);
  parts.push("contributed to this analysis.");
  if (topIndustry) parts.push(`The most common destination industry among peers is ${topIndustry}.`);

  return parts.join(" ");
}

function monthsBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.abs((d2.getFullYear() - d1.getFullYear()) * 12 + d2.getMonth() - d1.getMonth());
}

module.exports = { generateCareerPredictions };
