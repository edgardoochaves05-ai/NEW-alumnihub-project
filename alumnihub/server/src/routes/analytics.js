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
