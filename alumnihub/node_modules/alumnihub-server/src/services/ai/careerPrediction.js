import { supabase } from "../../config/supabase.js";

/**
 * Career Path Prediction Engine
 *
 * Analyzes historical career milestone data from alumni in the same program
 * to predict likely career trajectories for a given alumni profile.
 *
 * Algorithm:
 * 1. Find alumni from the same program with similar starting positions
 * 2. Analyze their career progression patterns
 * 3. Identify the most common next roles and industries
 * 4. Generate predictions with confidence scores
 */

export async function generateCareerPredictions(profileId) {
  // 1. Get the target alumni's profile and current milestones
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, career_milestones(*)")
    .eq("id", profileId)
    .single();

  if (!profile) throw new Error("Profile not found");

  const currentMilestones = profile.career_milestones || [];
  const currentRole = currentMilestones.find((m) => m.is_current);
  const program = profile.program;

  // 2. Find alumni from the same program who are further in their careers
  const { data: peerAlumni } = await supabase
    .from("profiles")
    .select("id, graduation_year, current_job_title, industry, career_milestones(*)")
    .eq("program", program)
    .neq("id", profileId)
    .not("current_job_title", "is", null);

  if (!peerAlumni || peerAlumni.length < 3) {
    return {
      predictions: [],
      message: "Not enough alumni data from your program to generate predictions. At least 3 alumni profiles are needed.",
      sample_size: peerAlumni?.length || 0,
    };
  }

  // 3. Analyze career progression patterns
  const careerPaths = analyzeCareerPaths(peerAlumni, currentRole);

  // 4. Generate predictions
  const predictions = generatePredictionResults(careerPaths, profile);

  // 5. Store predictions
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

  return { predictions, sample_size: peerAlumni.length };
}

function analyzeCareerPaths(peerAlumni, currentRole) {
  const pathMap = {};

  for (const peer of peerAlumni) {
    const milestones = (peer.career_milestones || []).sort(
      (a, b) => new Date(a.start_date) - new Date(b.start_date)
    );

    // Track role transitions
    for (let i = 0; i < milestones.length - 1; i++) {
      const from = milestones[i].title?.toLowerCase() || "";
      const to = milestones[i + 1].title || "";
      const industry = milestones[i + 1].industry || "";
      const key = `${to}|||${industry}`;

      if (!pathMap[key]) {
        pathMap[key] = { role: to, industry, count: 0, fromRoles: [], timeDiffs: [] };
      }
      pathMap[key].count++;
      pathMap[key].fromRoles.push(from);

      // Calculate time between transitions
      if (milestones[i].start_date && milestones[i + 1].start_date) {
        const months = monthsBetween(milestones[i].start_date, milestones[i + 1].start_date);
        pathMap[key].timeDiffs.push(months);
      }
    }
  }

  return Object.values(pathMap).sort((a, b) => b.count - a.count);
}

function generatePredictionResults(careerPaths, profile) {
  const totalPeers = new Set(careerPaths.flatMap((p) => p.fromRoles)).size || 1;
  const predictions = [];

  // Take top 3 most common career paths
  const topPaths = careerPaths.slice(0, 3);

  for (const path of topPaths) {
    const confidence = Math.min(95, Math.round((path.count / totalPeers) * 100));
    const avgMonths = path.timeDiffs.length > 0
      ? Math.round(path.timeDiffs.reduce((a, b) => a + b, 0) / path.timeDiffs.length)
      : 24;

    const timeHorizon = avgMonths <= 12 ? "0-1 years"
      : avgMonths <= 24 ? "1-2 years"
      : avgMonths <= 36 ? "2-3 years"
      : "3-5 years";

    predictions.push({
      role: path.role,
      industry: path.industry,
      confidence,
      timeHorizon,
      peerCount: path.count,
      avgTransitionMonths: avgMonths,
      reasoning: `Based on ${path.count} alumni from ${profile.program} who followed similar career paths. ${confidence}% of peers in comparable roles transitioned to ${path.role} within ${timeHorizon}.`,
    });
  }

  return predictions;
}

function monthsBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.abs((d2.getFullYear() - d1.getFullYear()) * 12 + d2.getMonth() - d1.getMonth());
}
