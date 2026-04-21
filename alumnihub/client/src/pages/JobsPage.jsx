import { useEffect, useState, useRef } from "react";
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
  BookmarkPlus, Calendar, GraduationCap, User, Mail, ChevronDown, ChevronUp,
} from "lucide-react";

const INDUSTRIES = ["Technology","Finance","Healthcare","Education","Engineering","Business","Government","Non-profit","Other"];
const JOB_TYPES  = ["full-time","part-time","contract","internship","remote"];
const EXP_LEVELS = ["entry","mid","senior","executive"];

function MatchBadge({ score }) {
  if (!score) return null;
  const pct = Math.round(score * 100);
  const color = pct >= 75 ? "bg-green-100 text-green-700" : pct >= 50 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500";
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
      <Sparkles size={10}/>{pct}% match
    </span>
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
      score: Math.round((matchMap[j.id] || 0) * 100),
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
function JobCard({ job, matchScore, onClick }) {
  const [expanded, setExpanded] = useState(false);
  const desc    = job.description || "";
  const isLong  = desc.length > 110;
  const preview = isLong && !expanded ? desc.slice(0, 110) + "…" : desc;

  return (
    <div onClick={() => onClick(job)} className="card cursor-pointer hover:shadow-md transition-shadow flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug">{job.title}</h3>
            <MatchBadge score={matchScore}/>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
            <Building2 size={12}/><span className="font-medium text-gray-700">{job.company}</span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            {job.location && <span className="flex items-center gap-1"><MapPin size={11}/>{job.location}</span>}
            {job.job_type  && <span className="flex items-center gap-1"><Clock size={11}/>{job.job_type}</span>}
            {job.industry  && <span className="flex items-center gap-1"><Briefcase size={11}/>{job.industry}</span>}
          </div>
        </div>
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
          <Briefcase size={18} className="text-blue-600"/>
        </div>
      </div>

      {/* Truncated description */}
      {desc && (
        <div onClick={e => e.stopPropagation()}>
          <p className="text-xs text-gray-500 leading-relaxed">{preview}</p>
          {isLong && (
            <button
              onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
              className="flex items-center gap-0.5 text-xs text-blue-600 hover:underline mt-1"
            >
              {expanded ? <><ChevronUp size={11}/>Show less</> : <><ChevronDown size={11}/>Read more</>}
            </button>
          )}
        </div>
      )}

      {(job.salary_min || job.salary_max) && (
        <p className="text-xs text-green-700 font-medium">
          ₱ {job.salary_min ? Number(job.salary_min).toLocaleString() : "?"}
          {job.salary_max ? ` – ₱ ${Number(job.salary_max).toLocaleString()}` : "+"}
        </p>
      )}
      <div className="flex items-center justify-between mt-auto">
        {job.profiles ? (
          <Link to={`/profile/${job.posted_by}`} onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
            <User size={11}/>{job.profiles.first_name} {job.profiles.last_name}
          </Link>
        ) : <span/>}
        <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</p>
      </div>
    </div>
  );
}

// ── Job Detail Modal ───────────────────────────────────────────
function JobDetailModal({ job, matchScore, onClose }) {
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
            <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                {job.profiles.avatar_url
                  ? <img src={job.profiles.avatar_url} className="w-8 h-8 rounded-full object-cover" alt=""/>
                  : `${job.profiles.first_name?.[0]}${job.profiles.last_name?.[0]}`}
              </div>
              <div>
                <p className="text-xs text-gray-400">Posted by</p>
                <Link to={`/profile/${job.posted_by}`} onClick={onClose}
                  className="text-sm font-medium text-blue-600 hover:underline">
                  {job.profiles.first_name} {job.profiles.last_name}
                </Link>
                <span className="ml-2 text-xs text-gray-400 capitalize">{job.profiles.role}</span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {(job.application_url || job.application_email) && (
            <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
              {job.application_url && (
                <a href={job.application_url} target="_blank" rel="noreferrer"
                  className="btn-primary inline-flex items-center gap-2 text-sm">
                  Visit Website <ExternalLink size={14}/>
                </a>
              )}
              {job.application_email && (
                <a href={`mailto:${job.application_email}`}
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
  const debounceRef = useRef(null);

  useEffect(() => {
    if (profile?.role === "alumni") {
      api.get("/jobs/matched").then(({ data }) => {
        const map = {};
        for (const m of data) { if (m.job_listings?.id) map[m.job_listings.id] = m.match_score; }
        setMatchMap(map);
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

      {/* Top 10 Chart — alumni only */}
      {hasMatches && (
        <Top10MatchChart jobs={jobs} matchMap={matchMap} onJobClick={setSelectedJob}/>
      )}

      {/* Search + Filter */}
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

      {/* AI Banner */}
      {hasMatches && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
          <Sparkles size={16}/> AI match scores shown on each listing are based on your profile.
        </div>
      )}

      {/* Jobs Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 size={24} className="animate-spin text-blue-600"/></div>
      ) : jobs.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <BookmarkPlus size={36} className="mx-auto mb-3 opacity-40"/>
          <p className="text-sm">No job listings found.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {jobs.map(job => (
            <JobCard key={job.id} job={job} matchScore={matchMap[job.id]} onClick={setSelectedJob}/>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
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
