const { supabase } = require("../../config/supabase.js");

/**
 * Career Path Prediction Engine
 */

async function generateCareerPredictions(profileId) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, career_milestones(*)")
    .eq("id", profileId)
    .single();

  if (!profile) throw new Error("Profile not found");

  // Fetch most recent parsed/confirmed CV data for this alumni
  const { data: cvData } = await supabase
    .from("cv_parsed_data")
    .select("parsed_skills, parsed_education")
    .eq("profile_id", profileId)
    .in("status", ["parsed", "confirmed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Merge profile skills + CV-extracted skills into one deduplicated set
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
  const predictions = generatePredictionResults(careerPaths, profile, alumniSkills);
  const skillAlignment = computeSkillAlignment(careerPaths.slice(0, 3), alumniSkills);
  const summary = buildSummary(profile, alumniSkills, peerAlumni.length);
  const peerInsights = buildPeerInsights(profile, peerAlumni);

  // Clear stale predictions before inserting fresh ones
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

function generatePredictionResults(careerPaths, profile, alumniSkills) {
  const totalPeers = new Set(careerPaths.flatMap((p) => p.fromRoles)).size || 1;
  const predictions = [];
  const topPaths = careerPaths.slice(0, 3);

  for (const path of topPaths) {
    const baseConfidence = Math.min(95, Math.round((path.count / totalPeers) * 100));

    // Skill overlap between this alumni and the skills used in this role by peers
    const roleSkills = [...new Set(path.skillsUsed)];
    const overlapCount = alumniSkills.filter(s => roleSkills.includes(s)).length;
    const skillOverlapRatio = roleSkills.length > 0 ? overlapCount / roleSkills.length : 0;

    // Weighted confidence: 70% frequency-based, 30% skill alignment
    const adjustedConfidence = Math.min(95, Math.round(baseConfidence * 0.7 + skillOverlapRatio * 30));

    const avgMonths = path.timeDiffs.length > 0
      ? Math.round(path.timeDiffs.reduce((a, b) => a + b, 0) / path.timeDiffs.length)
      : 24;

    const timeHorizon = avgMonths <= 12 ? "0-1 years"
      : avgMonths <= 24 ? "1-2 years"
      : avgMonths <= 36 ? "2-3 years"
      : "3-5 years";

    // Skills the alumni doesn't have yet that are common in this role
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

  // Count how often each skill appears across the top predicted roles
  const skillFrequency = {};
  for (const path of topPaths) {
    for (const skill of path.skillsUsed) {
      skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
    }
  }

  // Take top 8 skills by frequency
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
