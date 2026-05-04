import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import {
  Search, Filter, Users, Briefcase, GraduationCap, ChevronRight,
  Loader2, X, UserCheck, Clock, MapPin, Megaphone, Plus, Check, Trash2,
} from "lucide-react";

const CATEGORY_COLORS = {
  "Event":       "bg-blue-100 text-blue-700",
  "Career Fair": "bg-green-100 text-green-700",
  "Campus News": "bg-yellow-100 text-yellow-700",
  "Mentorship":  "bg-purple-100 text-purple-700",
};

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function PostAnnouncementModal({ onClose, onPosted }) {
  const VALID_CATEGORIES = ["Event", "Career Fair", "Campus News", "Mentorship"];
  const [form, setForm] = useState({ title: "", content: "", category: "Event" });
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setPosting(true);
    setError("");
    try {
      const { data } = await api.post("/announcements", form);
      onPosted(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to post announcement.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Megaphone size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-900">New Announcement</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Title *</label>
            <input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Announcement title"
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Category *</label>
            <select
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="input-field bg-white"
            >
              {VALID_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Content *</label>
            <textarea
              value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              rows={5}
              placeholder="Write your announcement…"
              className="input-field resize-none"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button
              type="submit"
              disabled={posting || !form.title.trim() || !form.content.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {posting ? <Loader2 size={14} className="animate-spin" /> : <Megaphone size={14} />}
              Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AnnouncementsWidget() {
  const [recent, setRecent] = useState([]);
  const [pending, setPending] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () =>
    Promise.all([
      api.get("/announcements?limit=4"),
      api.get("/announcements/pending").catch(() => ({ data: [] })),
    ]).then(([r, p]) => {
      setRecent(Array.isArray(r.data) ? r.data : []);
      setPending(Array.isArray(p.data) ? p.data : []);
    });

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    setBusy(true);
    try {
      const { data } = await api.patch(`/announcements/${id}/approve`);
      setPending(prev => prev.filter(a => a.id !== id));
      setRecent(prev => [data, ...prev].slice(0, 4));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to approve.");
    } finally { setBusy(false); }
  };

  const handleReject = async (id) => {
    if (!confirm("Reject this submission?")) return;
    setBusy(true);
    try {
      await api.delete(`/announcements/${id}`);
      setPending(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to reject.");
    } finally { setBusy(false); }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Megaphone size={18} className="text-blue-600" />
          <h2 className="font-semibold text-gray-900">Announcements</h2>
        </div>
        <div className="flex items-center gap-2">
          {pending.length > 0 && (
            <Link
              to="/announcements"
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200 font-medium"
            >
              {pending.length} pending review
            </Link>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3"
          >
            <Plus size={13} /> New Announcement
          </button>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Awaiting your review</p>
          {pending.slice(0, 3).map(a => (
            <div key={a.id} className="border border-amber-200 bg-amber-50/40 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[a.category] || "bg-gray-100 text-gray-600"}`}>
                      {a.category}
                    </span>
                    <span className="text-xs text-gray-400">{timeAgo(a.created_at)}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{a.title}</p>
                  {a.profiles && (
                    <p className="text-xs text-gray-500">
                      by {a.profiles.first_name} {a.profiles.last_name}
                    </p>
                  )}
                  <p className="text-xs text-gray-600 line-clamp-2 mt-1">{a.content}</p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleApprove(a.id)}
                    disabled={busy}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs flex items-center gap-1 hover:bg-green-700 disabled:opacity-50"
                  >
                    <Check size={11} /> Approve
                  </button>
                  <button
                    onClick={() => handleReject(a.id)}
                    disabled={busy}
                    className="px-2 py-1 border border-red-200 text-red-600 rounded text-xs flex items-center gap-1 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 size={11} /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {recent.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6">No announcements yet.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {recent.map(a => (
            <div key={a.id} className="py-3">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="text-sm font-medium text-gray-900">{a.title}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[a.category] || "bg-gray-100 text-gray-600"}`}>
                  {a.category}
                </span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">{a.content}</p>
              <p className="text-xs text-gray-400 mt-1">{timeAgo(a.created_at)}</p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <PostAnnouncementModal
          onClose={() => setShowModal(false)}
          onPosted={(newAnn) => setRecent(prev => [newAnn, ...prev].slice(0, 4))}
        />
      )}
    </div>
  );
}

const EMP_STATUS_OPTIONS = [
  { value: "",         label: "All Students" },
  { value: "employed", label: "Current Interns" },
  { value: "seeking",  label: "Seeking Internships" },
];

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} className="text-white"/>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function EmploymentBadge({ student }) {
  const isIntern = student.current_company && student.current_company.trim() !== "";
  return isIntern ? (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
      <UserCheck size={10}/>Current Intern
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
      <Clock size={10}/>Seeking Internship
    </span>
  );
}

function StudentCard({ student, onClick }) {
  const initials = `${student.first_name?.[0] || ""}${student.last_name?.[0] || ""}`.toUpperCase();
  return (
    <div
      onClick={() => onClick(student.id)}
      className="card cursor-pointer hover:shadow-md hover:border-blue-200 transition-all flex flex-col gap-3"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden">
          {student.avatar_url
            ? <img src={student.avatar_url} alt="" className="w-12 h-12 object-cover"/>
            : initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug">
              {student.first_name} {student.last_name}
            </h3>
            <ChevronRight size={14} className="text-gray-400 flex-shrink-0 mt-0.5"/>
          </div>
          <EmploymentBadge student={student}/>
        </div>
      </div>

      <div className="space-y-1.5 text-xs text-gray-500">
        {student.program && (
          <span className="flex items-center gap-1.5"><GraduationCap size={11}/>{student.program}</span>
        )}
        {student.department && (
          <span className="flex items-center gap-1.5"><MapPin size={11}/>{student.department}</span>
        )}
        {student.current_company ? (
          <span className="flex items-center gap-1.5"><Briefcase size={11}/>{student.current_job_title ? `${student.current_job_title} · ` : ""}{student.current_company}</span>
        ) : null}
      </div>

      {student.graduation_year && (
        <p className="text-xs text-gray-400">Class of {student.graduation_year}</p>
      )}

      {student.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1 border-t border-gray-50">
          {student.skills.slice(0, 4).map((s, i) => (
            <span key={i} className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">{s}</span>
          ))}
          {student.skills.length > 4 && (
            <span className="text-xs text-gray-400">+{student.skills.length - 4}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdvisorRosterPage() {
  const navigate = useNavigate();
  const [students, setStudents]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [program, setProgram]         = useState("");
  const [department, setDepartment]   = useState("");
  const [empStatus, setEmpStatus]     = useState("");
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [total, setTotal]             = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchRoster, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, program, department, empStatus, page]);

  async function fetchRoster() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)    params.set("search", search);
      if (program)   params.set("program", program);
      if (department) params.set("department", department);
      if (empStatus) params.set("employment_status", empStatus);
      params.set("page", page);
      const { data } = await api.get(`/advisor/roster?${params}`);
      setStudents(data.students || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  // Derive filter options from loaded students
  const programs    = useMemo(() => [...new Set(students.map(s => s.program).filter(Boolean))].sort(), [students]);
  const departments = useMemo(() => [...new Set(students.map(s => s.department).filter(Boolean))].sort(), [students]);

  const interns  = students.filter(s => s.current_company?.trim()).length;
  const seeking  = students.filter(s => !s.current_company?.trim()).length;

  const activeFilters = [program, department, empStatus].filter(Boolean).length;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Student Roster</h1>
        <p className="text-sm text-gray-500 mt-1">Students assigned to you for career advising.</p>
      </div>

      {/* Announcements */}
      <AnnouncementsWidget />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Assigned"       value={total}   icon={Users}    color="bg-blue-600"/>
        <StatCard label="Current Interns"      value={interns} icon={UserCheck} color="bg-green-600"/>
        <StatCard label="Seeking Internships"  value={seeking} icon={Clock}     color="bg-amber-500"/>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-56">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-9"
            placeholder="Search by name or email…"
          />
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`btn-secondary flex items-center gap-2 text-sm ${activeFilters ? "border-blue-500 text-blue-600" : ""}`}
        >
          <Filter size={14}/>Filters
          {activeFilters > 0 && (
            <span className="bg-blue-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">{activeFilters}</span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="card flex flex-wrap gap-4">
          <div className="flex-1 min-w-36">
            <label className="label">Academic Program</label>
            <select value={program} onChange={e => { setProgram(e.target.value); setPage(1); }} className="input-field bg-white text-sm">
              <option value="">All Programs</option>
              {programs.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-36">
            <label className="label">Department</label>
            <select value={department} onChange={e => { setDepartment(e.target.value); setPage(1); }} className="input-field bg-white text-sm">
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-36">
            <label className="label">Employment Status</label>
            <select value={empStatus} onChange={e => { setEmpStatus(e.target.value); setPage(1); }} className="input-field bg-white text-sm">
              {EMP_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {activeFilters > 0 && (
            <div className="flex items-end">
              <button
                onClick={() => { setProgram(""); setDepartment(""); setEmpStatus(""); setPage(1); }}
                className="btn-secondary text-sm flex items-center gap-1.5"
              >
                <X size={13}/>Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* Student Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={24} className="animate-spin text-blue-600"/>
        </div>
      ) : students.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <Users size={36} className="mx-auto mb-3 opacity-40"/>
          <p className="text-sm">
            {total === 0 ? "No students have been assigned to you yet." : "No students match your current filters."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {students.map(s => (
            <StudentCard key={s.id} student={s} onClick={id => navigate(`/advisor/student/${id}`)}/>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40">← Prev</button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
}
