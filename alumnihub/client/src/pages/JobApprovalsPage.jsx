import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Briefcase, Building2, MapPin, Clock, GraduationCap, Calendar,
  CheckCircle2, XCircle, Loader2, AlertCircle, RefreshCw, X, User,
} from "lucide-react";

const TABS = [
  { key: "pending",  label: "Pending Review", color: "amber"  },
  { key: "approved", label: "Approved",       color: "green"  },
  { key: "declined", label: "Declined",       color: "red"    },
];

function StatusPill({ status }) {
  const map = {
    pending:  { cls: "bg-amber-50 text-amber-700 border-amber-200", label: "Pending" },
    approved: { cls: "bg-green-50 text-green-700 border-green-200", label: "Approved" },
    declined: { cls: "bg-red-50 text-red-700 border-red-200",       label: "Declined" },
  };
  const m = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${m.cls}`}>
      {m.label}
    </span>
  );
}

function DeclineModal({ job, onClose, onConfirm, saving }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Decline Job Posting</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm text-gray-600">
            You are about to decline <span className="font-semibold">{job.title}</span> at <span className="font-semibold">{job.company}</span>.
          </p>
          <div>
            <label className="label">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="input-field resize-none h-24"
              placeholder="Let the poster know why this listing was declined…"
            />
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="btn-secondary flex-1" disabled={saving}>Cancel</button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={saving}
            className="btn-danger flex-1 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin"/>}
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}

function JobReviewCard({ job, onApprove, onDeclineClick, savingId }) {
  const isSaving = savingId === job.id;
  const poster = job.profiles;

  return (
    <div className="card border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-gray-900">{job.title}</h3>
            <StatusPill status={job.status}/>
          </div>
          <p className="text-sm text-gray-600 font-medium flex items-center gap-1.5">
            <Building2 size={13}/>{job.company}
          </p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Briefcase size={18} className="text-blue-600"/>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500 mb-3">
        {job.location         && <span className="flex items-center gap-1"><MapPin size={11}/>{job.location}</span>}
        {job.job_type         && <span className="flex items-center gap-1"><Clock size={11}/>{job.job_type}</span>}
        {job.industry         && <span className="flex items-center gap-1"><Briefcase size={11}/>{job.industry}</span>}
        {job.experience_level && <span className="flex items-center gap-1"><GraduationCap size={11}/>{job.experience_level} level</span>}
        {job.expires_at       && <span className="flex items-center gap-1"><Calendar size={11}/>Deadline: {new Date(job.expires_at).toLocaleDateString()}</span>}
      </div>

      {(job.salary_min || job.salary_max) && (
        <p className="text-xs font-semibold text-green-700 mb-3">
          ₱ {job.salary_min ? Number(job.salary_min).toLocaleString() : "?"}
          {job.salary_max ? ` – ₱ ${Number(job.salary_max).toLocaleString()}` : "+"}
        </p>
      )}

      {job.description && (
        <div className="mb-3">
          <p className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Description</p>
          <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-line">{job.description}</p>
        </div>
      )}

      {job.requirements && (
        <div className="mb-3">
          <p className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Requirements</p>
          <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-line">{job.requirements}</p>
        </div>
      )}

      {job.decline_reason && job.status === "declined" && (
        <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-100">
          <p className="text-[11px] text-red-700 uppercase tracking-widest font-semibold mb-0.5 flex items-center gap-1">
            <AlertCircle size={11}/>Decline Reason
          </p>
          <p className="text-xs text-red-700">{job.decline_reason}</p>
        </div>
      )}

      {/* Posted by */}
      {poster && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 overflow-hidden">
              {poster.avatar_url
                ? <img src={poster.avatar_url} className="w-full h-full object-cover" alt=""/>
                : `${poster.first_name?.[0] || ""}${poster.last_name?.[0] || ""}`.toUpperCase()}
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Posted by</p>
              <Link to={`/profile/${job.posted_by}`} className="text-sm font-semibold text-gray-900 hover:text-blue-600">
                {poster.first_name} {poster.last_name}
                <span className="ml-2 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full capitalize font-medium">
                  {poster.role}
                </span>
              </Link>
            </div>
          </div>
          <span className="text-[10px] text-gray-400">
            {new Date(job.created_at).toLocaleDateString()}
          </span>
        </div>
      )}

      {/* Action buttons */}
      {job.status === "pending" && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={() => onApprove(job)}
            disabled={isSaving}
            className="btn-primary flex-1 flex items-center justify-center gap-1.5 text-sm"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle2 size={14}/>}
            Approve
          </button>
          <button
            onClick={() => onDeclineClick(job)}
            disabled={isSaving}
            className="btn-danger flex-1 flex items-center justify-center gap-1.5 text-sm"
          >
            <XCircle size={14}/>
            Decline
          </button>
        </div>
      )}

      {job.status !== "pending" && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
          {job.status === "declined" && (
            <button
              onClick={() => onApprove(job)}
              disabled={isSaving}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              {isSaving ? <Loader2 size={12} className="animate-spin"/> : <CheckCircle2 size={12}/>}
              Approve Instead
            </button>
          )}
          {job.status === "approved" && (
            <button
              onClick={() => onDeclineClick(job)}
              disabled={isSaving}
              className="btn-secondary text-xs flex items-center gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle size={12}/>Revoke / Decline
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function JobApprovalsPage() {
  const { isAdmin } = useAuth();
  const [tab, setTab]         = useState("pending");
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [declining, setDeclining] = useState(null);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, declined: 0 });

  async function fetchJobs(targetTab = tab) {
    setLoading(true);
    try {
      const { data } = await api.get(`/jobs?status=${targetTab}&limit=100`);
      setJobs(data.jobs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCounts() {
    try {
      const [p, a, d] = await Promise.all([
        api.get("/jobs?status=pending&limit=1"),
        api.get("/jobs?status=approved&limit=1"),
        api.get("/jobs?status=declined&limit=1"),
      ]);
      setCounts({
        pending:  p.data.total || 0,
        approved: a.data.total || 0,
        declined: d.data.total || 0,
      });
    } catch {}
  }

  useEffect(() => { fetchJobs(tab); }, [tab]);
  useEffect(() => { fetchCounts(); }, [tab]);

  async function handleApprove(job) {
    setSavingId(job.id);
    try {
      await api.patch(`/jobs/${job.id}/approve`);
      setJobs(prev => prev.filter(j => j.id !== job.id));
      fetchCounts();
    } catch (e) {
      alert("Failed to approve. Please try again.");
    } finally { setSavingId(null); }
  }

  async function handleDeclineConfirm(reason) {
    if (!declining) return;
    setSavingId(declining.id);
    try {
      await api.patch(`/jobs/${declining.id}/decline`, { reason });
      setJobs(prev => prev.filter(j => j.id !== declining.id));
      setDeclining(null);
      fetchCounts();
    } catch (e) {
      alert("Failed to decline. Please try again.");
    } finally { setSavingId(null); }
  }

  if (!isAdmin) {
    return (
      <div className="card text-center py-16">
        <AlertCircle size={36} className="mx-auto text-gray-300 mb-3"/>
        <p className="text-sm text-gray-500">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Approvals</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review job postings submitted by alumni and other contributors.
          </p>
        </div>
        <button onClick={() => { fetchJobs(tab); fetchCounts(); }} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={14}/>Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-0">
        {TABS.map(t => {
          const active = tab === t.key;
          const accent = {
            amber: { active: "border-amber-600 text-amber-700", badgeActive: "bg-amber-100 text-amber-700", badgeIdle: "bg-gray-100 text-gray-500" },
            green: { active: "border-green-600 text-green-700", badgeActive: "bg-green-100 text-green-700", badgeIdle: "bg-gray-100 text-gray-500" },
            red:   { active: "border-red-600 text-red-700",     badgeActive: "bg-red-100 text-red-700",     badgeIdle: "bg-gray-100 text-gray-500" },
          }[t.color];
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active
                  ? accent.active
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? accent.badgeActive : accent.badgeIdle}`}>
                {counts[t.key]}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={24} className="animate-spin text-blue-600"/>
        </div>
      ) : jobs.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <Briefcase size={36} className="mx-auto mb-3 opacity-40"/>
          <p className="text-sm">No {tab} job postings.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {jobs.map(job => (
            <JobReviewCard
              key={job.id}
              job={job}
              onApprove={handleApprove}
              onDeclineClick={setDeclining}
              savingId={savingId}
            />
          ))}
        </div>
      )}

      {declining && (
        <DeclineModal
          job={declining}
          onClose={() => setDeclining(null)}
          onConfirm={handleDeclineConfirm}
          saving={savingId === declining.id}
        />
      )}
    </div>
  );
}
