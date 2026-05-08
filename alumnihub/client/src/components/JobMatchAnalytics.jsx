import { useMemo } from "react";
import { Sparkles, Code2, TrendingUp, Factory, GraduationCap } from "lucide-react";

// ── Pure calculation helpers (exported for testing / reuse) ───────

const EXP_LEVEL_ORDER = ["entry", "mid", "senior", "executive"];

const PROGRAM_KEYWORD_MAP = {
  "information technology":  ["software","developer","engineer","systems","tech","web","data","network","devops","qa","it ","programmer"],
  "information systems":     ["systems analyst","business analyst","it","software","data","erp","database","analyst","systems"],
  "computer science":        ["software","developer","engineer","data scientist","machine learning","ai","algorithm","backend","frontend","fullstack"],
  "computer engineering":    ["embedded","firmware","hardware","systems","network","iot","developer","engineer"],
  "business administration": ["business","management","marketing","sales","operations","hr","human resources","admin","supervisor"],
  "accounting":              ["accounting","finance","audit","tax","bookkeeping","cpa","controller","treasury"],
  "engineering":             ["engineer","technical","manufacturing","design","mechanical","civil","electrical","production"],
  "nursing":                 ["nurse","medical","healthcare","clinical","patient","hospital"],
  "education":               ["teacher","instructor","tutor","professor","learning","curriculum","trainer"],
  "marketing":               ["marketing","brand","digital","content","social media","seo","campaign","creative"],
  "communications":          ["communications","pr","public relations","media","journalism","writing","content"],
};

function localNormalize(score) {
  if (!score) return 0;
  const raw = score > 1 ? score : score * 100;
  return Math.min(100, Math.round(raw));
}

export function calcMatchBreakdown(job, profile) {
  // Skills (40 %)
  const required   = (job.required_skills || []).map(s => s.toLowerCase().trim());
  const userSkills = (profile.skills      || []).map(s => s.toLowerCase().trim());
  let skillsScore, matchedSkills = [];
  if (required.length === 0) {
    skillsScore = 70;
  } else {
    matchedSkills = required.filter(r => userSkills.some(u => u.includes(r) || r.includes(u)));
    skillsScore   = Math.round((matchedSkills.length / required.length) * 100);
  }

  // Experience (20 %)
  let expScore;
  const jobLevel = (job.experience_level || "").toLowerCase();
  const gradYear = profile.graduation_year;
  if (!jobLevel || !gradYear) {
    expScore = 55;
  } else {
    const yearsOut = new Date().getFullYear() - gradYear;
    const userIdx  = yearsOut <= 2 ? 0 : yearsOut <= 5 ? 1 : yearsOut <= 10 ? 2 : 3;
    const jobIdx   = EXP_LEVEL_ORDER.indexOf(jobLevel);
    const diff     = jobIdx < 0 ? 1 : Math.abs(userIdx - jobIdx);
    expScore = diff === 0 ? 100 : diff === 1 ? 65 : diff === 2 ? 30 : 15;
  }

  // Industry (25 %)
  let industryScore;
  const jobInd  = (job.industry   || "").toLowerCase();
  const userInd = (profile.industry || "").toLowerCase();
  if (!jobInd || !userInd) {
    industryScore = 50;
  } else if (jobInd === userInd) {
    industryScore = 100;
  } else if (jobInd.split(" ").some(w => w.length > 3 && userInd.includes(w))) {
    industryScore = 60;
  } else {
    industryScore = 20;
  }

  // Program (15 %)
  let programScore;
  const programLower = (profile.program    || "").toLowerCase();
  const titleLower   = (job.title          || "").toLowerCase();
  const reqLower     = (job.requirements   || "").toLowerCase();
  let programMatched = false;
  for (const [key, keywords] of Object.entries(PROGRAM_KEYWORD_MAP)) {
    if (programLower.includes(key)) {
      programMatched = keywords.some(k => titleLower.includes(k) || reqLower.includes(k));
      break;
    }
  }
  programScore = !programLower ? 50 : programMatched ? 90 : 35;

  const total = Math.round(
    skillsScore * 0.4 + expScore * 0.2 + industryScore * 0.25 + programScore * 0.15
  );

  return {
    skills:        skillsScore,
    experience:    expScore,
    industry:      industryScore,
    program:       programScore,
    total,
    matchedSkills: matchedSkills.map(s => s.replace(/\b\w/g, c => c.toUpperCase())),
    requiredCount: required.length,
  };
}

function generateMatchSummary(job, profile, breakdown, pct) {
  const name  = profile.first_name ? `${profile.first_name}'s` : "Your";
  const label = pct >= 75 ? "strong" : pct >= 55 ? "good" : "partial";

  const highlights = [];
  if (profile.program) highlights.push(profile.program);
  if (breakdown.matchedSkills.length > 0) {
    highlights.push(breakdown.matchedSkills.slice(0, 2).join(" & ") + " skills");
  } else if ((profile.skills || []).length > 0) {
    highlights.push((profile.skills || []).slice(0, 2).join(" & ") + " background");
  }

  if (highlights.length === 0) {
    return `You are a ${label} ${pct}% match for this ${job.title} role at ${job.company}.`;
  }
  const verb = name === "Your" ? " make you" : " make";
  return `${name} ${highlights.join(" and ")}${verb} a ${label} ${pct}% match for the ${job.title} role at ${job.company}.`;
}

// ── Shared style utilities ────────────────────────────────────────
function textCls(s) {
  return s >= 75 ? "text-green-700" : s >= 50 ? "text-blue-700" : "text-amber-600";
}
function barCls(s) {
  return s >= 75 ? "bg-green-500" : s >= 50 ? "bg-blue-500" : "bg-amber-400";
}
function badgeCls(s) {
  return s >= 75 ? "bg-green-50 text-green-700" : s >= 50 ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-600";
}
function matchLabel(s) {
  return s >= 75 ? "Strong" : s >= 50 ? "Good" : "Partial";
}

// ── CriterionCompact — 2×2 grid tile used in JobCard accordion ────
function CriterionCompact({ label, icon: Icon, score, weight }) {
  return (
    <div className="bg-white rounded-lg p-2.5 border border-gray-100 shadow-sm flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Icon size={11} className="text-blue-600" />
        </div>
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide leading-none flex-1 min-w-0 truncate">
          {label}
        </span>
        <span className={`text-[10px] font-bold ml-auto ${textCls(score)}`}>{score}%</span>
      </div>
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barCls(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${badgeCls(score)}`}>
          {matchLabel(score)}
        </span>
        <span className="text-[9px] text-gray-400">weight {weight}</span>
      </div>
    </div>
  );
}

// ── CriterionFull — horizontal row used in JobDetailModal ─────────
function CriterionFull({ label, icon: Icon, score, weight }) {
  const iconBg  = score >= 75 ? "bg-green-50"  : score >= 50 ? "bg-blue-50"  : "bg-amber-50";
  const iconTxt = score >= 75 ? "text-green-600" : score >= 50 ? "text-blue-600" : "text-amber-500";
  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={16} className={iconTxt} />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-700">{label}</span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badgeCls(score)}`}>
              {matchLabel(score)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-sm font-bold ${textCls(score)}`}>{score}%</span>
            <span className="text-[10px] text-gray-400">({weight})</span>
          </div>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barCls(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── SVG donut ring — overall score visualisation in full mode ──────
function ScoreRing({ pct }) {
  const r    = 28;
  const circ = 2 * Math.PI * r;
  const dash = circ - (pct / 100) * circ;
  const stroke   = pct >= 75 ? "#16a34a" : pct >= 50 ? "#2563eb" : "#d97706";
  const labelTxt = pct >= 75 ? "text-green-700" : pct >= 50 ? "text-blue-700" : "text-amber-600";
  const label    = pct >= 75 ? "Strong" : pct >= 50 ? "Good" : "Partial";

  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      <div className="relative w-16 h-16">
        <svg width="64" height="64" className="-rotate-90" aria-hidden>
          <circle cx="32" cy="32" r={r} fill="none" stroke="#e5e7eb" strokeWidth="5" />
          <circle
            cx="32" cy="32" r={r}
            fill="none"
            stroke={stroke}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={dash}
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-black leading-none ${labelTxt}`}>{pct}%</span>
        </div>
      </div>
      <span className={`text-[10px] font-semibold ${labelTxt}`}>{label} Match</span>
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────
//
// Props:
//   job         — job listing object (required)
//   profile     — alumni profile object (required)
//   matchScore  — raw server score (0-1 decimal OR 0-100 integer)
//   mode        — "compact" | "full"  (default "full")
//
// mode="compact"  → rendered inside JobCard accordion, tight 2×2 grid
// mode="full"     → rendered inside JobDetailModal / Dashboard, full panel

export default function JobMatchAnalytics({ job, profile, matchScore, mode = "full" }) {
  const pct = localNormalize(matchScore);

  const breakdown = useMemo(
    () => calcMatchBreakdown(job, profile),
    // Recalculate only when the job or profile identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [job.id, profile?.id]
  );

  const summary = useMemo(
    () => generateMatchSummary(job, profile, breakdown, pct),
    [breakdown, job, profile, pct]
  );

  const criteria = [
    { label: "Skills",     icon: Code2,         score: breakdown.skills,     weight: "40%" },
    { label: "Experience", icon: TrendingUp,    score: breakdown.experience, weight: "20%" },
    { label: "Industry",   icon: Factory,       score: breakdown.industry,   weight: "25%" },
    { label: "Program",    icon: GraduationCap, score: breakdown.program,    weight: "15%" },
  ];

  const overallBadgeCls =
    pct >= 75 ? "bg-green-100 text-green-700 border-green-200" :
    pct >= 50 ? "bg-blue-100 text-blue-700 border-blue-200"   :
    "bg-gray-100 text-gray-500 border-gray-200";

  // ─── Compact mode ───────────────────────────────────────────────
  if (mode === "compact") {
    return (
      <div className="px-4 pb-4 bg-gradient-to-b from-blue-50/50 to-white">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
            Match Breakdown
          </span>
          <div className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border ${overallBadgeCls}`}>
            <Sparkles size={10} />{pct}% Overall Match
          </div>
        </div>

        {/* 2×2 criteria grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {criteria.map(c => <CriterionCompact key={c.label} {...c} />)}
        </div>

        {/* Matched skill chips */}
        {breakdown.matchedSkills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {breakdown.matchedSkills.slice(0, 5).map(skill => (
              <span
                key={skill}
                className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full"
              >
                <Code2 size={8} />{skill}
              </span>
            ))}
            {breakdown.requiredCount > 5 && (
              <span className="text-[10px] text-gray-400">
                +{breakdown.requiredCount - 5} more
              </span>
            )}
          </div>
        )}

        {/* Personalised summary */}
        <p className="text-[11px] text-gray-600 leading-relaxed bg-white rounded-lg px-3 py-2.5 border border-gray-100 italic">
          "{summary}"
        </p>
      </div>
    );
  }

  // ─── Full mode ──────────────────────────────────────────────────
  return (
    <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-indigo-50/20 overflow-hidden">
      {/* Header with score ring */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-blue-100/80 bg-white/50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Sparkles size={15} className="text-blue-600" />
            <p className="text-sm font-bold text-gray-900">AI Match Analytics</p>
          </div>
          <p className="text-xs text-gray-500">
            Personalised breakdown based on your profile
          </p>
        </div>
        <ScoreRing pct={pct} />
      </div>

      {/* Criterion rows */}
      <div className="px-5 py-4 space-y-3.5">
        {criteria.map(c => <CriterionFull key={c.label} {...c} />)}
      </div>

      {/* Matched skill chips */}
      {breakdown.matchedSkills.length > 0 && (
        <div className="px-5 pb-3">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            Matched Skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {breakdown.matchedSkills.map(skill => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 text-xs font-medium bg-green-50 text-green-700 border border-green-100 px-2.5 py-1 rounded-full"
              >
                <Code2 size={10} />{skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Personalised summary */}
      <div className="px-5 pb-5">
        <div className="bg-white rounded-xl px-4 py-3 border border-blue-100 shadow-sm">
          <p className="text-xs text-gray-600 leading-relaxed italic">
            "{summary}"
          </p>
        </div>
      </div>
    </div>
  );
}
