import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { format } from "date-fns";
import {
  ArrowLeft, Briefcase, GraduationCap, TrendingUp, Award, BookOpen,
  Circle, Loader2, AlertCircle, Plus, Trash2, Edit2, ExternalLink,
  ChevronRight, Save, X, Send, StickyNote, Star,
} from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(dateStr) {
  if (!dateStr) return "";
  try { return format(new Date(dateStr), "MMM yyyy"); } catch { return dateStr; }
}

const MILESTONE_ICON = {
  job:           Briefcase,
  promotion:     TrendingUp,
  certification: Award,
  award:         Star,
  education:     BookOpen,
  other:         Circle,
};

const MILESTONE_COLOR = {
  job:           { dot: "bg-blue-500",   ring: "ring-blue-200" },
  promotion:     { dot: "bg-green-500",  ring: "ring-green-200" },
  certification: { dot: "bg-amber-500",  ring: "ring-amber-200" },
  award:         { dot: "bg-yellow-500", ring: "ring-yellow-200" },
  education:     { dot: "bg-indigo-500", ring: "ring-indigo-200" },
  other:         { dot: "bg-gray-400",   ring: "ring-gray-200" },
  academic:      { dot: "bg-purple-500", ring: "ring-purple-200" },
  graduation:    { dot: "bg-purple-600", ring: "ring-purple-200" },
};

function buildTimeline(profile) {
  const events = [];

  if (profile.batch_year) {
    events.push({
      key: "academic-start",
      type: "academic",
      title: `Started ${profile.program || "Academic Program"}`,
      subtitle: profile.department || null,
      dateLabel: `${profile.batch_year}`,
      dateSort: new Date(profile.batch_year, 7, 1),
      skills: [],
    });
  }

  for (const m of profile.career_milestones || []) {
    const startLabel = fmtDate(m.start_date);
    const endLabel   = m.is_current ? "Present" : m.end_date ? fmtDate(m.end_date) : "";
    events.push({
      key: m.id,
      type: m.milestone_type || "other",
      title: m.title,
      subtitle: [m.company, m.location].filter(Boolean).join(" · ") || null,
      description: m.description || null,
      dateLabel: [startLabel, endLabel].filter(Boolean).join(" – "),
      dateSort: m.start_date ? new Date(m.start_date) : new Date(0),
      skills: m.skills_used || [],
    });
  }

  if (profile.graduation_year) {
    events.push({
      key: "graduation",
      type: "graduation",
      title: `Graduated — ${profile.program || "Academic Program"}`,
      subtitle: profile.department || null,
      dateLabel: `${profile.graduation_year}`,
      dateSort: new Date(profile.graduation_year, 3, 1),
      skills: [],
    });
  }

  events.sort((a, b) => a.dateSort - b.dateSort);
  return events;
}

// ── Timeline ───────────────────────────────────────────────────────────────

function TimelineEvent({ event, isLast }) {
  const Icon  = MILESTONE_ICON[event.type] || Circle;
  const color = MILESTONE_COLOR[event.type] || MILESTONE_COLOR.other;

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-9 h-9 rounded-full ${color.dot} ring-4 ${color.ring} flex items-center justify-center flex-shrink-0 z-10`}>
          <Icon size={14} className="text-white"/>
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 mt-1 min-h-6"/>}
      </div>
      <div className="flex-1 pb-7 min-w-0">
        <p className="text-xs text-gray-400 mb-0.5 font-medium">{event.dateLabel}</p>
        <h4 className="text-sm font-semibold text-gray-900">{event.title}</h4>
        {event.subtitle && <p className="text-xs text-gray-500 mt-0.5">{event.subtitle}</p>}
        {event.description && (
          <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{event.description}</p>
        )}
        {event.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {event.skills.map((s, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{s}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Skills Progression ─────────────────────────────────────────────────────

function SkillsTab({ profile }) {
  const currentSkills = profile.skills || [];
  const milestoneSkills = (profile.career_milestones || [])
    .filter(m => m.skills_used?.length > 0)
    .sort((a, b) => (a.start_date > b.start_date ? 1 : -1));

  return (
    <div className="space-y-5">
      {currentSkills.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Current Skills</h3>
          <div className="flex flex-wrap gap-2">
            {currentSkills.map((s, i) => (
              <span key={i} className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">{s}</span>
            ))}
          </div>
        </div>
      )}

      {milestoneSkills.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Skills Gained by Role</h3>
          <div className="space-y-4">
            {milestoneSkills.map(m => (
              <div key={m.id} className="pl-3 border-l-2 border-blue-200">
                <p className="text-xs font-semibold text-gray-700">{m.title}{m.company ? ` · ${m.company}` : ""}</p>
                <p className="text-xs text-gray-400 mb-1.5">{fmtDate(m.start_date)}{m.end_date ? ` – ${fmtDate(m.end_date)}` : m.is_current ? " – Present" : ""}</p>
                <div className="flex flex-wrap gap-1">
                  {m.skills_used.map((s, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentSkills.length === 0 && milestoneSkills.length === 0 && (
        <div className="card text-center py-16 text-gray-400">
          <Star size={32} className="mx-auto mb-3 opacity-30"/>
          <p className="text-sm">No skills recorded yet.</p>
        </div>
      )}
    </div>
  );
}

// ── Notes ──────────────────────────────────────────────────────────────────

function NotesTab({ studentId }) {
  const [notes, setNotes]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [newNote, setNewNote]   = useState("");
  const [editId, setEditId]     = useState(null);
  const [editText, setEditText] = useState("");
  const [saving, setSaving]     = useState(false);

  useEffect(() => { fetchNotes(); }, []);

  async function fetchNotes() {
    setLoading(true);
    try {
      const { data } = await api.get(`/advisor/notes/${studentId}`);
      setNotes(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function addNote() {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.post("/advisor/notes", { student_id: studentId, content: newNote.trim() });
      setNotes(prev => [data, ...prev]);
      setNewNote("");
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function saveEdit(id) {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.put(`/advisor/notes/${id}`, { content: editText.trim() });
      setNotes(prev => prev.map(n => n.id === id ? data : n));
      setEditId(null);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function deleteNote(id) {
    try {
      await api.delete(`/advisor/notes/${id}`);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (e) { console.error(e); }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-blue-600"/></div>;

  return (
    <div className="space-y-4">
      {/* Add note */}
      <div className="card space-y-3">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><StickyNote size={14}/>Add Private Note</h3>
        <textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          className="input-field resize-none h-24 text-sm"
          placeholder="Write a private note about this student…"
        />
        <div className="flex justify-end">
          <button
            onClick={addNote}
            disabled={!newNote.trim() || saving}
            className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={13} className="animate-spin"/> : <Send size={13}/>} Add Note
          </button>
        </div>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <StickyNote size={28} className="mx-auto mb-3 opacity-30"/>
          <p className="text-sm">No private notes yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div key={note.id} className="card">
              {editId === note.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    className="input-field resize-none h-24 text-sm w-full"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditId(null)} className="btn-secondary text-sm flex items-center gap-1"><X size={12}/>Cancel</button>
                    <button onClick={() => saveEdit(note.id)} disabled={saving} className="btn-primary text-sm flex items-center gap-1"><Save size={12}/>Save</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">{new Date(note.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditId(note.id); setEditText(note.content); }} className="text-gray-400 hover:text-blue-600 transition-colors"><Edit2 size={13}/></button>
                      <button onClick={() => deleteNote(note.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={13}/></button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Recommendations ─────────────────────────────────────────────────────────

const REC_TYPES = ["course", "job", "certification", "other"];
const REC_COLORS = {
  course:        "bg-blue-100 text-blue-700",
  job:           "bg-green-100 text-green-700",
  certification: "bg-amber-100 text-amber-700",
  other:         "bg-gray-100 text-gray-600",
};

const BLANK_REC = { type: "course", title: "", description: "", url: "" };

function RecsTab({ studentId }) {
  const [recs, setRecs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]       = useState(BLANK_REC);
  const [saving, setSaving]   = useState(false);

  useEffect(() => { fetchRecs(); }, []);

  async function fetchRecs() {
    setLoading(true);
    try {
      const { data } = await api.get(`/advisor/recommendations/${studentId}`);
      setRecs(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function addRec() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.post("/advisor/recommendations", { student_id: studentId, ...form });
      setRecs(prev => [data, ...prev]);
      setForm(BLANK_REC);
      setShowForm(false);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function deleteRec(id) {
    try {
      await api.delete(`/advisor/recommendations/${id}`);
      setRecs(prev => prev.filter(r => r.id !== id));
    } catch (e) { console.error(e); }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-blue-600"/></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">{recs.length} recommendation{recs.length !== 1 ? "s" : ""} sent</p>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary text-sm flex items-center gap-2">
          <Plus size={14}/> Add Recommendation
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">New Recommendation</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="input-field bg-white text-sm">
                {REC_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input-field text-sm" placeholder="e.g. React Fundamentals"/>
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input-field resize-none h-20 text-sm" placeholder="Why you're recommending this…"/>
            </div>
            <div className="col-span-2">
              <label className="label">URL</label>
              <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} className="input-field text-sm" placeholder="https://…"/>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={addRec} disabled={!form.title.trim() || saving} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 size={13} className="animate-spin"/> : <Send size={13}/>} Send
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {recs.length === 0 && !showForm ? (
        <div className="card text-center py-12 text-gray-400">
          <Send size={28} className="mx-auto mb-3 opacity-30"/>
          <p className="text-sm">No recommendations sent yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recs.map(rec => (
            <div key={rec.id} className="card flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${REC_COLORS[rec.type] || REC_COLORS.other}`}>
                    {rec.type}
                  </span>
                  <h4 className="text-sm font-semibold text-gray-900">{rec.title}</h4>
                </div>
                {rec.description && <p className="text-xs text-gray-500 leading-relaxed mb-1">{rec.description}</p>}
                {rec.url && (
                  <a href={rec.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    <ExternalLink size={11}/>Visit
                  </a>
                )}
                <p className="text-xs text-gray-400 mt-1">{new Date(rec.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}</p>
              </div>
              <button onClick={() => deleteRec(rec.id)} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 mt-1"><Trash2 size={14}/></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

const TABS = [
  { id: "timeline",        label: "Career Timeline" },
  { id: "skills",          label: "Skills Progression" },
  { id: "notes",           label: "Private Notes" },
  { id: "recommendations", label: "Recommendations" },
];

export default function StudentCareerPathPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [activeTab, setActiveTab] = useState("timeline");

  useEffect(() => { if (id) fetchProfile(); }, [id]);

  async function fetchProfile() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/profiles/${id}`);
      setProfile(data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load student profile.");
    } finally { setLoading(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-blue-600"/>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card flex items-center gap-3 text-red-600 py-8 justify-center">
          <AlertCircle size={20}/><p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const timeline = buildTimeline(profile);
  const employed = profile.current_company?.trim();

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Back */}
      <button onClick={() => navigate("/advisor/roster")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft size={15}/>Back to Roster
      </button>

      {/* Profile Header */}
      <div className="card flex items-start gap-5 flex-wrap sm:flex-nowrap">
        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 overflow-hidden">
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt="" className="w-16 h-16 object-cover"/>
            : `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{profile.first_name} {profile.last_name}</h1>
              {profile.program && <p className="text-sm text-gray-600">{profile.program} {profile.graduation_year ? `· Class of ${profile.graduation_year}` : ""}</p>}
              {profile.department && <p className="text-xs text-gray-400">{profile.department}</p>}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${employed ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
              {employed ? "Employed" : "Seeking"}
            </span>
          </div>
          {employed && (
            <p className="text-sm text-gray-600 mt-2 flex items-center gap-1.5">
              <Briefcase size={13}/>{profile.current_job_title ? `${profile.current_job_title} at ` : ""}{profile.current_company}
            </p>
          )}
          {profile.email && <p className="text-xs text-gray-400 mt-1">{profile.email}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "timeline" && (
        <div className="card">
          {timeline.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <GraduationCap size={32} className="mx-auto mb-3 opacity-30"/>
              <p className="text-sm">No career milestones recorded yet.</p>
            </div>
          ) : (
            <div>
              {timeline.map((event, i) => (
                <TimelineEvent key={event.key} event={event} isLast={i === timeline.length - 1}/>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "skills" && <SkillsTab profile={profile}/>}
      {activeTab === "notes" && <NotesTab studentId={id}/>}
      {activeTab === "recommendations" && <RecsTab studentId={id}/>}
    </div>
  );
}
