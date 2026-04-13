import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  generateCareerPredictions,
  computeJobMatches,
  generateCurriculumImpact,
  getAvailablePrograms,
  getOverallStats,
} from "../services/ai/index.js";
import { supabase } from "../config/supabase.js";

const router = Router();

// ── Dashboard Stats (Faculty/Admin) ──
router.get("/dashboard", authenticate, authorize("faculty", "admin"), async (req, res, next) => {
  try {
    const stats = await getOverallStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// ── Alumni Dashboard Stats ──
router.get("/alumni-dashboard", authenticate, async (req, res, next) => {
  try {
    const profileId = req.user.id;

    const [
      { count: totalJobs },
      { data: conversations },
      { data: matchedJobs },
      { data: announcements },
    ] = await Promise.all([
      supabase.from("job_listings").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("conversation_participants").select("conversation_id").eq("profile_id", profileId),
      supabase.from("job_match_scores").select("match_score, job_listings(id, title, company, industry, job_type)").eq("profile_id", profileId).order("match_score", { ascending: false }).limit(3),
      supabase.from("announcements").select("id, title, content, created_at, target_audience").eq("is_published", true).order("created_at", { ascending: false }).limit(5),
    ]);

    // Count unread messages across all conversations
    let unreadCount = 0;
    if (conversations?.length) {
      for (const { conversation_id } of conversations) {
        const { data: cp } = await supabase
          .from("conversation_participants")
          .select("last_read_at")
          .eq("conversation_id", conversation_id)
          .eq("profile_id", profileId)
          .single();

        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conversation_id)
          .neq("sender_id", profileId)
          .gt("created_at", cp?.last_read_at || "1970-01-01");

        unreadCount += count || 0;
      }
    }

    res.json({
      totalJobs: totalJobs || 0,
      unreadMessages: unreadCount,
      topMatches: matchedJobs || [],
      announcements: announcements || [],
    });
  } catch (err) {
    next(err);
  }
});

// ── Career Path Prediction ──
router.get("/career-prediction/:profileId", authenticate, async (req, res, next) => {
  try {
    const { profileId } = req.params;
    if (req.profile.role === "alumni" && profileId !== req.user.id) {
      return res.status(403).json({ error: "You can only view your own predictions" });
    }
    const predictions = await generateCareerPredictions(profileId);
    res.json(predictions);
  } catch (err) {
    next(err);
  }
});

// ── Smart Job Matching ──
router.get("/job-matches", authenticate, async (req, res, next) => {
  try {
    const matches = await computeJobMatches(req.user.id);
    res.json(matches);
  } catch (err) {
    next(err);
  }
});

// ── Curriculum Impact Analytics (Faculty/Admin) ──
router.get("/curriculum-impact", authenticate, authorize("faculty", "admin"), async (req, res, next) => {
  try {
    const { program, yearStart, yearEnd } = req.query;
    if (!program) return res.status(400).json({ error: "Program parameter is required" });

    const report = await generateCurriculumImpact(program, {
      yearStart: yearStart ? parseInt(yearStart) : undefined,
      yearEnd: yearEnd ? parseInt(yearEnd) : undefined,
    });
    res.json(report);
  } catch (err) {
    next(err);
  }
});

// ── Available Programs ──
router.get("/programs", authenticate, authorize("faculty", "admin"), async (req, res, next) => {
  try {
    const programs = await getAvailablePrograms();
    res.json(programs);
  } catch (err) {
    next(err);
  }
});

// ── Employment Trends ──
router.get("/employment-trends", authenticate, authorize("faculty", "admin"), async (req, res, next) => {
  try {
    const { data: alumni } = await supabase
      .from("profiles")
      .select("graduation_year, industry, current_job_title, program")
      .eq("role", "alumni")
      .not("graduation_year", "is", null);

    const byYear = {};
    for (const alum of alumni || []) {
      const year = alum.graduation_year;
      if (!byYear[year]) byYear[year] = { total: 0, employed: 0 };
      byYear[year].total++;
      if (alum.current_job_title) byYear[year].employed++;
    }

    const trends = Object.entries(byYear)
      .map(([year, stats]) => ({
        year: parseInt(year),
        total: stats.total,
        employed: stats.employed,
        employmentRate: Math.round((stats.employed / stats.total) * 100),
      }))
      .sort((a, b) => a.year - b.year);

    res.json(trends);
  } catch (err) {
    next(err);
  }
});

export default router;
