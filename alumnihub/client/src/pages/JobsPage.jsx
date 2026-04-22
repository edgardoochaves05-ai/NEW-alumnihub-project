import { useEffect, useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  Search, Filter, Briefcase, Building2, MapPin, Clock, Plus, X,
  ChevronLeft, ChevronRight, Loader2, Sparkles, ExternalLink,
  BookmarkPlus, Calendar, GraduationCap, User, Mail,
  Code2, TrendingUp, Factory, ChevronDown, ChevronUp,
} from "lucide-react";

const INDUSTRIES = ["Technology","Finance","Healthcare","Education","Engineering","Business","Government","Non-profit","Other"];
const JOB_TYPES  = ["full-time","part-time","contract","internship","remote"];
const EXP_LEVELS = ["entry","mid","senior","executive"];

function normalizeScore(score) {
  if (!score) return 0;
  // If score is already a percentage (> 1), clamp to 100
  // If score is a decimal (0-1 range), multiply by 100
  const raw = score > 1 ? score : score * 100;
  return Math.min(100, Math.round(raw));
}

// ── Match Analytics Helpers ────────────────────────────────────
const EXP_LEVEL_ORDER = ["entry", "mid", "senior", "executive"];

const PROGRAM_KEYWORD_MAP = {
  "information technology": ["software","developer","engineer","systems","tech","web","data","network","devops","qa","it ","programmer"],
  "information systems": ["systems analyst","business analyst","it","software","data","erp","database","analyst","systems"],
  "computer science": ["software","developer","engineer","data scientist","machine learning","ai","algorithm","backend","frontend","fullstack"],
  "computer engineering": ["embedded","firmware","hardware","systems","network","iot","developer","engineer"],
  "business administration": ["business","management","marketing","sales","operations","hr","human resources","admin","supervisor"],
  "accounting": ["accounting","finance","audit","tax","bookkeeping","cpa","controller","treasury"],
  "engineering": ["engineer","technical","manufacturing","design","mechanical","civil","electrical","production"],
  "nursing": ["nurse","medical","healthcare","clinical","patient","hospital"],
  "education": ["teacher","instructor","tutor","professor","learning","curriculum","trainer"],
  "marketing": ["marketing","brand","digital","content","social media","seo","campaign","creative"],
  "communications": ["communications","pr","public relations","media","journalism","writing","content"],
};

function calcMatchBreakdown(job, profile) {
  // Skills (40 %)
  const required = (job.required_skills || []).map(s => s.toLowerCase().trim());
  const userSkills = (profile.skills || []).map(s => s.toLowerCase().trim());
  let skillsScore;
  let matchedSkills = [];
  if (required.length === 0) {
    skillsScore = 70;
  } else {
    matchedSkills = required.filter(r => userSkills.some(u => u.includes(r) || r.includes(u)));
    skillsScore = Math.round((matchedSkills.length / required.length) * 100);
  }

  // Experience (20 %)
  let expScore;
  const jobLevel = (job.experience_level || "").toLowerCase();
  const gradYear = profile.graduation_year;
  if (!jobLevel || !gradYear) {
    expScore = 55;
  } else {
    const yearsOut = new Date().getFullYear() - gradYear;
    const userIdx = yearsOut <= 2 ? 0 : yearsOut <= 5 ? 1 : yearsOut <= 10 ? 2 : 3;
    const jobIdx = EXP_LEVEL_ORDER.indexOf(jobLevel);
    const diff = jobIdx < 0 ? 1 : Math.abs(userIdx - jobIdx);
    expScore = diff === 0 ? 100 : diff === 1 ? 65 : diff === 2 ? 30 : 15;
  }

  // Industry (25 %)
  let industryScore;
  const jobInd = (job.industry || "").toLowerCase();
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
  const programLower = (profile.program || "").toLowerCase();
  const titleLower   = (job.title || "").toLowerCase();
  const reqLower     = (job.requirements || "").toLowerCase();
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
    skills: skillsScore,
    experience: expScore,
    industry: industryScore,
    program: programScore,
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

function MatchBadge({ score }) {
  if (!score) return null;
  const pct = normalizeScore(score);
  const color = pct >= 75 ? "bg-green-100 text-green-700" : pct >= 50 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500";
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
      <Sparkles size={10}/>{pct}% match
    </span>
  );
}

function MatchBar({ score }) {
  if (!score) return null;
  const pct = normalizeScore(score);
  const barColor = pct >= 75 ? "bg-green-500" : pct >= 50 ? "bg-blue-500" : "bg-gray-300";
  const textColor = pct >= 75 ? "text-green-700" : pct >= 50 ? "text-blue-700" : "text-gray-500";
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400 flex items-center gap-1"><Sparkles size={10}/>AI Match</span>
        <span className={`text-xs font-semibold ${textColor}`}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${pct}%` }}/>
      </div>
    </div>
  );
}

// ── Top 10 Match Chart (alumni only) ───────────────────────────
function Top10MatchChart({ jobs, matchMap, onJobClick }) {
  const top10 = jobs
    .filter(j => matchMap[j.id] > 0)
    .sort((a, b) => (matchMap[b.id] || 0) - (matchMap[a.id] || 0))
    .slice(0, 10)
    .map(j => ({
      name: j.title.length > 24 ? j.title.slice(0, 24) + "…" : j.title,
      company: j.company,
      score: normalizeScore(matchMap[j.id] || 0),
      job: j,
    }));

  if (top10.length === 0) return null;

  const barColor = (score) =>
    score >= 75 ? "#16a34a" : score >= 50 ? "#2563eb" : "#9ca3af";

  function ChartTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const { name, company, score } = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-sm">
        <p className="font-semibold text-gray-900">{name}</p>
        <p className="text-gray-400 text-xs">{company}</p>
        <p className="font-medium mt-1" style={{ color: barColor(score) }}>{score}% match</p>
        <p className="text-xs text-gray-400 mt-0.5">Click to view details</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={15} className="text-blue-600"/>
        <h3 className="font-semibold text-gray-900 text-sm">Top 10 AI-Matched Jobs</h3>
        <span className="text-xs text-gray-400 ml-auto hidden sm:block">Click a bar to view details</span>
      </div>
      <p className="text-xs text-gray-400 mb-4">Ranked by your profile match score</p>
      <ResponsiveContainer width="100%" height={top10.length * 36 + 20}>
        <BarChart data={top10} layout="vertical" margin={{ left: 0, right: 48, top: 0, bottom: 0 }}>
          <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false}/>
          <YAxis type="category" dataKey="name" width={148} tick={{ fontSize: 11 }} axisLine={false} tickLine={false}/>
          <Tooltip content={<ChartTooltip/>} cursor={{ fill: "#f1f5f9" }}/>
          <Bar dataKey="score" radius={[0, 4, 4, 0]} cursor="pointer"
            label={{ position: "right", formatter: v => `${v}%`, fontSize: 11, fill: "#6b7280" }}
            onClick={(data) => onJobClick(data.job)}>
            {top10.map((entry, i) => (
              <Cell key={i} fill={barColor(entry.score)}/>
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block"/>75%+ Strong Match</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"/>50%+ Good Match</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block"/>Partial Match</span>
      </div>
    </div>
  );
}

// ── Job Card ───────────────────────────────────────────────────
function CriterionBar({ label, icon: Icon, score, weight }) {
  const textCls = score >= 75 ? "text-green-700" : score >= 50 ? "text-blue-700" : "text-amber-600";
  const barCls  = score >= 75 ? "bg-green-500"  : score >= 50 ? "bg-blue-500"  : "bg-amber-400";
  const badgeCls = score >= 75
    ? "bg-green-50 text-green-700"
    : score >= 50
    ? "bg-blue-50 text-blue-700"
    : "bg-amber-50 text-amber-600";

  return (
    <div className="bg-white rounded-lg p-2.5 border border-gray-100 shadow-sm flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Icon size={11} className="text-blue-600"/>
        </div>
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide leading-none flex-1 min-w-0 truncate">
          {label}
        </span>
        <span className={`text-[10px] font-bold ml-auto ${textCls}`}>{score}%</span>
      </div>
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barCls}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${badgeCls}`}>
          {score >= 75 ? "Strong" : score >= 50 ? "Good" : "Partial"}
        </span>
        <span className="text-[9px] text-gray-400">weight {weight}</span>
      </div>
    </div>
  );
}

function JobCard({ job, matchScore, profile, onClick }) {
  const [showAnalytics, setShowAnalytics] = useState(false);
  const hasAnalytics = profile?.role === "alumni" && !!matchScore;
  const overallPct = normalizeScore(matchScore);

  const breakdown = useMemo(
    () => (hasAnalytics ? calcMatchBreakdown(job, profile) : null),
    // profile and job objects are stable enough — recalc only when ids change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [job.id, profile?.id, hasAnalytics]
  );

  const summary = useMemo(
    () => (breakdown ? generateMatchSummary(job, profile, breakdown, overallPct) : ""),
    [breakdown, job, profile, overallPct]
  );

  const overallBadgeCls =
    overallPct >= 75
      ? "bg-green-100 text-green-700 border-green-200"
      : overallPct >= 50
      ? "bg-blue-100 text-blue-700 border-blue-200"
      : "bg-gray-100 text-gray-500 border-gray-200";

  const criteria = breakdown
    ? [
        { label: "Skills",     icon: Code2,        score: breakdown.skills,     weight: "40%" },
        { label: "Experience", icon: TrendingUp,   score: breakdown.experience, weight: "20%" },
        { label: "Industry",   icon: Factory,      score: breakdown.industry,   weight: "25%" },
        { label: "Program",    icon: GraduationCap, score: breakdown.program,   weight: "15%" },
      ]
    : [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col">
      {/* ── Main card body ── */}
      <div
        onClick={() => onClick(job)}
        className="flex flex-col gap-1.5 p-5 cursor-pointer flex-1"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1">{job.title}</h3>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Building2 size={12}/><span className="font-medium">{job.company}</span>
            </div>
            {job.location && (
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                <MapPin size={11}/>{job.location}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Briefcase size={18} className="text-blue-600"/>
            </div>
            {hasAnalytics && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${overallBadgeCls}`}>
                <Sparkles size={9}/>{overallPct}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Analytics accordion — alumni only ── */}
      {hasAnalytics && breakdown && (
        <div className="border-t border-gray-100">
          <button
            onClick={e => { e.stopPropagation(); setShowAnalytics(v => !v); }}
            className="w-full flex items-center justify-between px-5 py-2.5 text-xs font-semibold text-blue-600 hover:bg-blue-50/70 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles size={11}/>View Match Details
            </span>
            {showAnalytics ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
          </button>

          {showAnalytics && (
            <div
              className="px-4 pb-4 bg-gradient-to-b from-blue-50/50 to-white"
              onClick={e => e.stopPropagation()}
            >
              {/* Overall score pill */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                  Match Breakdown
                </span>
                <div className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border ${overallBadgeCls}`}>
                  <Sparkles size={10}/>{overallPct}% Overall Match
                </div>
              </div>

              {/* 2 × 2 criteria grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {criteria.map(c => <CriterionBar key={c.label} {...c}/>)}
              </div>

              {/* Skill tags row */}
              {breakdown.matchedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {breakdown.matchedSkills.slice(0, 5).map(skill => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full"
                    >
                      <Code2 size={8}/>{skill}
                    </span>
                  ))}
                  {breakdown.requiredCount > 5 && (
                    <span className="text-[10px] text-gray-400">+{breakdown.requiredCount - 5} more</span>
                  )}
                </div>
              )}

              {/* Personalized summary */}
              <p className="text-[11px] text-gray-600 leading-relaxed bg-white rounded-lg px-3 py-2.5 border border-gray-100 italic">
                "{summary}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Job Detail Modal ───────────────────────────────────────────
function JobDetailModal({ job, matchScore, onClose }) {
  // Fire a unique view event whenever this modal opens for a different job
  useEffect(() => {
    if (job?.id) api.post(`/jobs/${job.id}/view`).catch(() => {});
  }, [job?.id]);

  const trackInquiry = () => {
    if (job?.id) api.post(`/jobs/${job.id}/inquire`).catch(() => {});
  };

  if (!job) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-lg font-bold text-gray-900">{job.title}</h2>
              <MatchBadge score={matchScore}/>
            </div>
            <p className="text-sm text-gray-600 font-medium">{job.company}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-4"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {job.location        && <span className="flex items-center gap-1.5"><MapPin size={14}/>{job.location}</span>}
            {job.job_type        && <span className="flex items-center gap-1.5"><Clock size={14}/>{job.job_type}</span>}
            {job.industry        && <span className="flex items-center gap-1.5"><Briefcase size={14}/>{job.industry}</span>}
            {job.experience_level && <span className="flex items-center gap-1.5"><GraduationCap size={14}/>{job.experience_level} level</span>}
            {job.expires_at      && <span className="flex items-center gap-1.5"><Calendar size={14}/>Deadline: {new Date(job.expires_at).toLocaleDateString()}</span>}
          </div>

          {/* Salary */}
          {(job.salary_min || job.salary_max) && (
            <p className="text-sm font-semibold text-green-700">
              Salary: ₱ {job.salary_min ? Number(job.salary_min).toLocaleString() : "?"}
              {job.salary_max ? ` – ₱ ${Number(job.salary_max).toLocaleString()}` : "+"}
            </p>
          )}

          {/* Description */}
          {job.description && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Description</h4>
              <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{job.description}</p>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Requirements</h4>
              <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{job.requirements}</p>
            </div>
          )}

          {/* Posted by */}
          {job.profiles && (
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {job.profiles.avatar_url
                    ? <img src={job.profiles.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="Profile"/>
                    : `${job.profiles.first_name?.[0] || ""}${job.profiles.last_name?.[0] || ""}`.toUpperCase()}
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold mb-0.5">Posted By</p>
                  <div className="flex items-end gap-2">
                    <Link to={`/profile/${job.posted_by}`} onClick={onClose}
                      className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors">
                      {job.profiles.first_name} {job.profiles.last_name}
                    </Link>
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full capitalize font-medium mb-px">
                      {job.profiles.role}
                    </span>
                  </div>
                </div>
              </div>
              
              <Link to={`/profile/${job.posted_by}`} onClick={onClose}
                className="btn-secondary inline-flex items-center gap-1.5 text-xs py-1.5 px-3">
                <User size={13}/> View Profile
              </Link>
            </div>
          )}

          {/* Action buttons */}
          {(job.application_url || job.application_email) && (
            <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
              {job.application_url && (
                <a href={job.application_url} target="_blank" rel="noreferrer"
                  onClick={trackInquiry}
                  className="btn-primary inline-flex items-center gap-2 text-sm">
                  Visit Website <ExternalLink size={14}/>
                </a>
              )}
              {job.application_email && (
                <a href={`mailto:${job.application_email}`}
                  onClick={trackInquiry}
                  className="btn-secondary inline-flex items-center gap-2 text-sm">
                  Apply via Email <Mail size={14}/>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Post Job Modal ─────────────────────────────────────────────
function PostJobModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title:"", company:"", location:"", industry:"", job_type:"full-time",
    experience_level:"entry", salary_min:"", salary_max:"",
    description:"", requirements:"", application_url:"", application_email:"", expires_at:"",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title || !form.company) { setError("Title and company are required."); return; }
    setSaving(true);
    try {
      const { data } = await api.post("/jobs", form);
      onCreated(data);
    } catch(err) {
      const errorMsg = err.response?.data?.error || "Failed to post job.";
      setError(typeof errorMsg === 'string' ? errorMsg : errorMsg.message || "Failed to post job.");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Post a Job</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Job Title *</label>
              <input name="title" value={form.title} onChange={handleChange} className="input-field" placeholder="e.g. Software Engineer"/>
            </div>
            <div className="col-span-2">
              <label className="label">Company *</label>
              <input name="company" value={form.company} onChange={handleChange} className="input-field" placeholder="Company name"/>
            </div>
            <div>
              <label className="label">Location</label>
              <input name="location" value={form.location} onChange={handleChange} className="input-field" placeholder="City or Remote"/>
            </div>
            <div>
              <label className="label">Industry</label>
              <select name="industry" value={form.industry} onChange={handleChange} className="input-field bg-white">
                <option value="">Select</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Job Type</label>
              <select name="job_type" value={form.job_type} onChange={handleChange} className="input-field bg-white">
                {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Experience Level</label>
              <select name="experience_level" value={form.experience_level} onChange={handleChange} className="input-field bg-white">
                {EXP_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Min Salary (₱)</label>
              <input name="salary_min" type="number" min="0" value={form.salary_min} onChange={handleChange} className="input-field" placeholder="e.g. 30000"/>
            </div>
            <div>
              <label className="label">Max Salary (₱)</label>
              <input name="salary_max" type="number" min="0" value={form.salary_max} onChange={handleChange} className="input-field" placeholder="e.g. 50000"/>
            </div>
            <div>
              <label className="label">Application Deadline</label>
              <input name="expires_at" type="date" value={form.expires_at} onChange={handleChange} className="input-field"/>
            </div>
            <div>
              <label className="label">Application Email</label>
              <input name="application_email" type="email" value={form.application_email} onChange={handleChange} className="input-field" placeholder="hr@company.com"/>
            </div>
            <div className="col-span-2">
              <label className="label">Website / Application URL</label>
              <input name="application_url" value={form.application_url} onChange={handleChange} className="input-field" placeholder="https://..."/>
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} className="input-field resize-none h-24" placeholder="Role overview…"/>
            </div>
            <div className="col-span-2">
              <label className="label">Requirements</label>
              <textarea name="requirements" value={form.requirements} onChange={handleChange} className="input-field resize-none h-20" placeholder="Qualifications and skills…"/>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin"/>} Post Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function JobsPage() {
  const { profile } = useAuth();
  const [jobs, setJobs]               = useState([]);
  const [top10Jobs, setTop10Jobs]     = useState([]); // stable — never changes on pagination
  const [matchMap, setMatchMap]       = useState({});
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [industry, setIndustry]       = useState("");
  const [jobType, setJobType]         = useState("");
  const [expLevel, setExpLevel]       = useState("");
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showPost, setShowPost]       = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showOthers, setShowOthers]   = useState(false);
  const debounceRef = useRef(null);

  // top10Ids derived from the stable top10Jobs list (unaffected by pagination)
  const top10Ids = useMemo(() => {
    if (!top10Jobs.length) return new Set();
    return new Set(top10Jobs.map(j => j.id));
  }, [top10Jobs]);

  useEffect(() => {
    if (profile?.role === "alumni") {
      api.get("/jobs/matched").then(({ data }) => {
        const map = {};
        const jobObjs = [];
        for (const m of data) {
          if (m.job_listings?.id) {
            map[m.job_listings.id] = m.match_score;
            jobObjs.push(m.job_listings);
          }
        }
        setMatchMap(map);
        // Sort by score descending and take top 10 — stored permanently
        const sorted = jobObjs
          .sort((a, b) => (map[b.id] || 0) - (map[a.id] || 0))
          .slice(0, 10);
        setTop10Jobs(sorted);
      }).catch(() => {});
    }
  }, [profile]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchJobs, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, industry, jobType, expLevel, page]);

  async function fetchJobs() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)   params.set("search", search);
      if (industry) params.set("industry", industry);
      if (jobType)  params.set("job_type", jobType);
      if (expLevel) params.set("experience_level", expLevel);
      params.set("page", page);
      const { data } = await api.get(`/jobs?${params}`);
      setJobs(data.jobs || data);
      if (data.totalPages) setTotalPages(data.totalPages);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  const activeFilters = [industry, jobType, expLevel].filter(Boolean).length;
  const hasMatches    = profile?.role === "alumni" && Object.keys(matchMap).length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Listings</h1>
          <p className="text-sm text-gray-500 mt-1">Browse opportunities and post openings for the alumni network.</p>
        </div>
        <button onClick={() => setShowPost(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15}/> Post a Job
        </button>
      </div>

      {/* Top 10 Chart — alumni only, uses stable top10Jobs */}
      {hasMatches && (
        <Top10MatchChart jobs={top10Jobs} matchMap={matchMap} onJobClick={setSelectedJob}/>
      )}

      {/* AI Banner */}
      {hasMatches && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
          <Sparkles size={16}/> AI match scores shown on each listing are based on your profile.
        </div>
      )}

      {/* Other Listings toggle */}
      {hasMatches && (
        <div>
          <button
            onClick={() => setShowOthers(v => !v)}
            className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-colors border ${
              showOthers
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Other Listings
          </button>
        </div>
      )}

      {/* Search + Filter — only visible when Other Listings is open (or non-alumni) */}
      {(!hasMatches || showOthers) && (
        <>
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-56">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="input-field pl-9" placeholder="Search jobs or companies…"/>
            </div>
            <button onClick={() => setShowFilters(v => !v)}
              className={`btn-secondary flex items-center gap-2 text-sm ${activeFilters ? "border-blue-500 text-blue-600" : ""}`}>
              <Filter size={14}/>Filters
              {activeFilters > 0 && (
                <span className="bg-blue-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">{activeFilters}</span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="card flex flex-wrap gap-4">
              <div className="flex-1 min-w-36">
                <label className="label">Industry</label>
                <select value={industry} onChange={e => { setIndustry(e.target.value); setPage(1); }} className="input-field bg-white text-sm">
                  <option value="">All Industries</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-36">
                <label className="label">Job Type</label>
                <select value={jobType} onChange={e => { setJobType(e.target.value); setPage(1); }} className="input-field bg-white text-sm">
                  <option value="">All Types</option>
                  {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-36">
                <label className="label">Experience Level</label>
                <select value={expLevel} onChange={e => { setExpLevel(e.target.value); setPage(1); }} className="input-field bg-white text-sm">
                  <option value="">All Levels</option>
                  {EXP_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              {activeFilters > 0 && (
                <div className="flex items-end">
                  <button onClick={() => { setIndustry(""); setJobType(""); setExpLevel(""); setPage(1); }}
                    className="btn-secondary text-sm flex items-center gap-1.5"><X size={13}/>Clear</button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Jobs Grid */}
      {(() => {
        // For alumni with matches: only show when "Other Listings" is toggled on
        // For others (non-alumni / no match data): always show all jobs
        const shouldShow = !hasMatches || showOthers;
        if (!shouldShow) return null;

        const displayedJobs = hasMatches ? jobs.filter(j => !top10Ids.has(j.id)) : jobs;

        return loading ? (
          <div className="flex items-center justify-center h-48"><Loader2 size={24} className="animate-spin text-blue-600"/></div>
        ) : displayedJobs.length === 0 ? (
          <div className="card text-center py-16 text-gray-400">
            <BookmarkPlus size={36} className="mx-auto mb-3 opacity-40"/>
            <p className="text-sm">No other listings outside your top 10 matches.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {displayedJobs.map(job => (
              <JobCard key={job.id} job={job} matchScore={matchMap[job.id]} profile={profile} onClick={setSelectedJob}/>
            ))}
          </div>
        );
      })()}

      {/* Pagination — only visible when Other Listings is open */}
      {(!hasMatches || showOthers) && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn-secondary p-2 disabled:opacity-40">
            <ChevronLeft size={16}/>
          </button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="btn-secondary p-2 disabled:opacity-40">
            <ChevronRight size={16}/>
          </button>
        </div>
      )}

      {selectedJob && (
        <JobDetailModal job={selectedJob} matchScore={matchMap[selectedJob.id]} onClose={() => setSelectedJob(null)}/>
      )}
      {showPost && (
        <PostJobModal onClose={() => setShowPost(false)} onCreated={newJob => { setJobs(prev => [newJob, ...prev]); setShowPost(false); }}/>
      )}
    </div>
  );
}
