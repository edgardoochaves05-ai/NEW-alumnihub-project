import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import {
  Search, Filter, Briefcase, Building2, MapPin, Clock, Plus, X,
  ChevronLeft, ChevronRight, Loader2, Sparkles, ExternalLink,
  BookmarkPlus, Calendar, GraduationCap
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

function JobCard({ job, matchScore, onClick }) {
  return (
    <div onClick={() => onClick(job)} className="card cursor-pointer hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-gray-900 text-sm">{job.title}</h3>
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
      {job.salary_range && <p className="text-xs text-green-700 font-medium mt-3">₱ {job.salary_range}</p>}
      <p className="text-xs text-gray-400 mt-2">{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</p>
    </div>
  );
}

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
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {job.location       && <span className="flex items-center gap-1.5"><MapPin size={14}/>{job.location}</span>}
            {job.job_type       && <span className="flex items-center gap-1.5"><Clock size={14}/>{job.job_type}</span>}
            {job.industry       && <span className="flex items-center gap-1.5"><Briefcase size={14}/>{job.industry}</span>}
            {job.experience_level && <span className="flex items-center gap-1.5"><GraduationCap size={14}/>{job.experience_level} level</span>}
            {job.deadline       && <span className="flex items-center gap-1.5"><Calendar size={14}/>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>}
          </div>
          {job.salary_range && <p className="text-sm font-semibold text-green-700">Salary: ₱ {job.salary_range}</p>}
          {job.description && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Description</h4>
              <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{job.description}</p>
            </div>
          )}
          {job.requirements && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Requirements</h4>
              <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{job.requirements}</p>
            </div>
          )}
          {job.application_url && (
            <a href={job.application_url} target="_blank" rel="noreferrer"
              className="btn-primary inline-flex items-center gap-2 text-sm">
              Apply Now <ExternalLink size={14}/>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function PostJobModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title:"", company:"", location:"", industry:"", job_type:"full-time", experience_level:"entry", salary_range:"", description:"", requirements:"", application_url:"", deadline:"" });
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
      setError(err.response?.data?.error || "Failed to post job.");
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
              <label className="label">Salary Range</label>
              <input name="salary_range" value={form.salary_range} onChange={handleChange} className="input-field" placeholder="e.g. 30,000 – 50,000"/>
            </div>
            <div>
              <label className="label">Application Deadline</label>
              <input name="deadline" type="date" value={form.deadline} onChange={handleChange} className="input-field"/>
            </div>
            <div className="col-span-2">
              <label className="label">Application URL</label>
              <input name="application_url" value={form.application_url} onChange={handleChange} className="input-field" placeholder="https://..."/>
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} className="input-field resize-none h-24" placeholder="Role overview..."/>
            </div>
            <div className="col-span-2">
              <label className="label">Requirements</label>
              <textarea name="requirements" value={form.requirements} onChange={handleChange} className="input-field resize-none h-20" placeholder="Qualifications and skills..."/>
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

export default function JobsPage() {
  const { profile } = useAuth();
  const [jobs, setJobs]           = useState([]);
  const [matchMap, setMatchMap]   = useState({});
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [industry, setIndustry]   = useState("");
  const [jobType, setJobType]     = useState("");
  const [expLevel, setExpLevel]   = useState("");
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showPost, setShowPost]   = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    // Load AI match scores for alumni
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

      {/* Search + Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-56">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-9" placeholder="Search jobs or companies…"/>
        </div>
        <button onClick={() => setShowFilters(v => !v)}
          className={`btn-secondary flex items-center gap-2 text-sm ${activeFilters ? "border-blue-500 text-blue-600" : ""}`}>
          <Filter size={14}/>Filters{activeFilters > 0 && <span className="bg-blue-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">{activeFilters}</span>}
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
      {profile?.role === "alumni" && Object.keys(matchMap).length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
          <Sparkles size={16}/> AI match scores are shown on each listing based on your profile.
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
