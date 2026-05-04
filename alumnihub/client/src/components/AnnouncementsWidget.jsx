import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import {
  Megaphone, Plus, Check, Trash2, Loader2, X, Clock3,
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

export default function AnnouncementsWidget() {
  const [recent, setRecent]   = useState([]);
  const [pending, setPending] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("approved"); // "approved" | "pending"

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
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3"
        >
          <Plus size={13} /> New Announcement
        </button>
      </div>

      {/* Tab switcher — same UX as job-listing approval */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => setTab("approved")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
            tab === "approved" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Recent
        </button>
        <button
          onClick={() => setTab("pending")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition flex items-center gap-1.5 ${
            tab === "pending" ? "border-amber-500 text-amber-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Clock3 size={13} /> Pending Review
          {pending.length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {pending.length}
            </span>
          )}
        </button>
        <Link
          to="/announcements"
          className="ml-auto text-xs text-blue-600 hover:underline self-center"
        >
          View all →
        </Link>
      </div>

      {tab === "pending" ? (
        pending.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No announcements awaiting review.</p>
        ) : (
          <div className="space-y-2">
            {pending.map(a => (
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
                        {a.profiles.role && (
                          <span className="ml-1 text-gray-400 capitalize">· {a.profiles.role}</span>
                        )}
                      </p>
                    )}
                    <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{a.content}</p>
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
                      <Trash2 size={11} /> Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : recent.length === 0 ? (
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
