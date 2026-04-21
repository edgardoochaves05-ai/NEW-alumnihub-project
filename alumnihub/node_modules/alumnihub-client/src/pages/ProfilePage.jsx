import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { supabase } from "../services/supabase";
import { format } from "date-fns";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  User, Briefcase, GraduationCap, MapPin,
  Linkedin, Edit2, Save, X, Plus, Trash2, Loader2,
  CheckCircle, Lock, Tag, Calendar,
  Award, BookOpen, Star, ChevronUp, Upload,
  FileText, Camera, Eye, EyeOff, ExternalLink, Send, MessageCircle,
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────
const MILESTONE_TYPES = ["job", "promotion", "certification", "award", "education", "other"];
const MILESTONE_COLORS = {
  job:           { bg: "bg-blue-100",   text: "text-blue-700",   icon: Briefcase },
  promotion:     { bg: "bg-green-100",  text: "text-green-700",  icon: ChevronUp },
  certification: { bg: "bg-purple-100", text: "text-purple-700", icon: Award },
  award:         { bg: "bg-amber-100",  text: "text-amber-700",  icon: Star },
  education:     { bg: "bg-teal-100",   text: "text-teal-700",   icon: GraduationCap },
  other:         { bg: "bg-gray-100",   text: "text-gray-600",   icon: BookOpen },
};

const INDUSTRIES = [
  "Information Technology", "Telecommunications", "Finance & Banking",
  "Healthcare", "Education", "Government", "Manufacturing",
  "Retail & E-commerce", "Business Process Outsourcing (BPO)",
  "Engineering", "Media & Entertainment", "Real Estate", "Other",
];

const PROGRAMS = [
  "BS Information Systems", "BS Information Technology",
  "BS Computer Science", "BS Computer Engineering",
  "BS Electronics Engineering", "BS Electrical Engineering",
  "BS Civil Engineering", "BS Mechanical Engineering",
  "BS Accountancy", "BS Business Administration",
  "BS Industrial Engineering", "Other",
];

// ── Helpers ─────────────────────────────────────────────────────
const initForm = (p) => ({
  first_name: p?.first_name || "",
  last_name: p?.last_name || "",
  avatar_url: p?.avatar_url || "",
  phone: p?.phone || "",
  date_of_birth: p?.date_of_birth || "",
  gender: p?.gender || "",
  address: p?.address || "",
  city: p?.city || "",
  bio: p?.bio || "",
  student_number: p?.student_number || "",
  program: p?.program || "",
  department: p?.department || "",
  graduation_year: p?.graduation_year || "",
  batch_year: p?.batch_year || "",
  current_job_title: p?.current_job_title || "",
  current_company: p?.current_company || "",
  industry: p?.industry || "",
  linkedin_url: p?.linkedin_url || "",
  skills: p?.skills || [],
});

const initMilestoneForm = () => ({
  title: "", company: "", industry: "", description: "",
  milestone_type: "job", start_date: "", end_date: "",
  is_current: false, location: "", skills_used: [],
});

// ── Sub-components ──────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon size={18} className="text-blue-600" />
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function Field({ label, value, editing, name, onChange, type = "text", options, textarea, placeholder, isRequired }) {
  const isEmpty = !value || String(value).trim() === "";
  const displayLabel = editing && isRequired && isEmpty ? <>{label} <span className="text-red-500">*</span></> : label;

  if (!editing) {
    return (
      <div>
        <p className="label">{label}</p>
        <p className="text-sm text-gray-800 min-h-[1.5rem]">{value || <span className="text-gray-400 italic">Not set</span>}</p>
      </div>
    );
  }
  if (options) {
    return (
      <div>
        <label className="label">{displayLabel}</label>
        <select name={name} value={value} onChange={onChange} className="input-field bg-white">
          <option value="">— Select —</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }
  if (textarea) {
    return (
      <div>
        <label className="label">{displayLabel}</label>
        <textarea name={name} value={value} onChange={onChange} rows={3}
          className="input-field resize-none" placeholder={placeholder} />
      </div>
    );
  }
  return (
    <div>
      <label className="label">{displayLabel}</label>
      <input type={type} name={name} value={value} onChange={onChange}
        className="input-field" placeholder={placeholder} />
    </div>
  );
}

function SkillsEditor({ skills, editing, onAdd, onRemove, inputVal, setInputVal }) {
  const handleKey = (e) => {
    if ((e.key === "Enter" || e.key === ",") && inputVal.trim()) {
      e.preventDefault();
      onAdd(inputVal.trim());
      setInputVal("");
    }
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {skills.map((s) => (
          <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
            {s}
            {editing && (
              <button onClick={() => onRemove(s)} className="hover:text-blue-900 ml-0.5">
                <X size={11} />
              </button>
            )}
          </span>
        ))}
        {skills.length === 0 && !editing && <p className="text-sm text-gray-400 italic">No skills added</p>}
      </div>
      {editing && (
        <input
          value={inputVal} onChange={(e) => setInputVal(e.target.value)} onKeyDown={handleKey}
          className="input-field text-sm" placeholder="Type a skill and press Enter"
        />
      )}
    </div>
  );
}

function MilestoneCard({ m, isOwn, onEdit, onDelete }) {
  const cfg = MILESTONE_COLORS[m.milestone_type] || MILESTONE_COLORS.other;
  const Icon = cfg.icon;
  const start = m.start_date ? format(new Date(m.start_date), "MMM yyyy") : null;
  const end   = m.is_current ? "Present" : m.end_date ? format(new Date(m.end_date), "MMM yyyy") : null;

  return (
    <div className="flex gap-4 group">
      {/* Timeline dot */}
      <div className="flex flex-col items-center">
        <div className={`w-9 h-9 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0 ring-4 ring-white`}>
          <Icon size={15} className={cfg.text} />
        </div>
        <div className="w-px flex-1 bg-gray-200 mt-1" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="card py-4 px-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900 text-sm">{m.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
                  {m.milestone_type}
                </span>
                {m.is_current && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                    Current
                  </span>
                )}
              </div>
              {m.company && <p className="text-sm text-gray-600 mt-0.5">{m.company}{m.location ? ` · ${m.location}` : ""}</p>}
              {(start || end) && (
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <Calendar size={11} /> {start} {start && end ? "–" : ""} {end}
                </p>
              )}
              {m.description && <p className="text-xs text-gray-500 mt-2 leading-relaxed">{m.description}</p>}
              {m.skills_used?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {m.skills_used.map((s) => (
                    <span key={s} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{s}</span>
                  ))}
                </div>
              )}
            </div>
            {isOwn && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button onClick={() => onEdit(m)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => onDelete(m.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MilestoneModal({ form, setForm, onSave, onClose, saving }) {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };
  const [skillInput, setSkillInput] = useState("");
  const addSkill = (s) => { if (!form.skills_used.includes(s)) setForm((p) => ({ ...p, skills_used: [...p.skills_used, s] })); };
  const removeSkill = (s) => setForm((p) => ({ ...p, skills_used: p.skills_used.filter((x) => x !== s) }));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{form.id ? "Edit Milestone" : "Add Career Milestone"}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Title *</label>
              <input name="title" value={form.title} onChange={handleChange} className="input-field" placeholder="e.g. Software Engineer" />
            </div>
            <div>
              <label className="label">Type</label>
              <select name="milestone_type" value={form.milestone_type} onChange={handleChange} className="input-field bg-white">
                {MILESTONE_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Company / Organization</label>
              <input name="company" value={form.company} onChange={handleChange} className="input-field" placeholder="e.g. Accenture" />
            </div>
            <div>
              <label className="label">Industry</label>
              <select name="industry" value={form.industry} onChange={handleChange} className="input-field bg-white">
                <option value="">— Select —</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Location</label>
              <input name="location" value={form.location} onChange={handleChange} className="input-field" placeholder="e.g. Quezon City" />
            </div>
            <div>
              <label className="label">Start Date</label>
              <input type="date" name="start_date" value={form.start_date} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="label">End Date</label>
              <input type="date" name="end_date" value={form.end_date} onChange={handleChange} className="input-field" disabled={form.is_current} />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="is_current" checked={form.is_current} onChange={handleChange} className="w-4 h-4 rounded accent-blue-600" />
            <span className="text-sm text-gray-700">This is my current position</span>
          </label>

          <div>
            <label className="label">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3}
              className="input-field resize-none" placeholder="Brief description of your role or achievement..." />
          </div>

          <div>
            <label className="label">Skills Used</label>
            <SkillsEditor
              skills={form.skills_used} editing={true}
              onAdd={addSkill} onRemove={removeSkill}
              inputVal={skillInput} setInputVal={setSkillInput}
            />
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={onSave} disabled={saving || !form.title} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving && <Loader2 size={15} className="animate-spin" />}
            {form.id ? "Save Changes" : "Add Milestone"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function ProfilePage() {
  const { id: paramId } = useParams();
  const { user, profile: authProfile, refreshProfile } = useAuth();

  const isOwnProfile = !paramId || paramId === user?.id;
  const profileId = paramId || user?.id;

  const [profile, setProfile]     = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState(false);
  const [form, setForm]           = useState({});
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Skills
  const [skillInput, setSkillInput] = useState("");

  // Milestone modal
  const [milestoneModal, setMilestoneModal] = useState(false);
  const [milestoneForm, setMilestoneForm]   = useState(initMilestoneForm());
  const [savingMilestone, setSavingMilestone] = useState(false);

  // Delete confirmation dialog
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

  // Avatar Upload
  const avatarInputRef = useRef(null);
  const [avatarFile, setAvatarFile]       = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Messaging
  const [msgModal, setMsgModal]   = useState(false);
  const [msgContent, setMsgContent] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgError, setMsgError]   = useState("");
  const [msgSent, setMsgSent]     = useState(false);

  // CV Upload
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [showResume, setShowResume] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [profileId]);

  async function loadProfile() {
    setLoading(true);
    try {
      let profileData, milestonesData;

      if (isOwnProfile) {
        // Fetch directly from Supabase (bypasses server auth issues)
        const { data: p, error: pErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", profileId)
          .single();

        if (pErr) {
          // No profile row yet — seed from auth user_metadata so the form
          // opens pre-filled and the user can save to create the row.
          const { data: { user: authUser } } = await supabase.auth.getUser();
          const meta = authUser?.user_metadata || {};
          profileData = {
            id: profileId,
            email: authUser?.email || null,
            role: meta.role || authProfile?.role || null,
            first_name: meta.first_name || null,
            last_name: meta.last_name || null,
            skills: [],
          };
          milestonesData = [];
          // Auto-open edit mode so the user immediately sees the form
          setEditing(true);
        } else {
          const { data: m } = await supabase
            .from("career_milestones")
            .select("*")
            .eq("profile_id", profileId)
            .order("start_date", { ascending: false });

          profileData    = p;
          milestonesData = m || [];
        }
      } else {
        // Other user's profile — go through server (handles privacy/RLS)
        const { data } = await api.get(`/profiles/${profileId}`);
        profileData    = data;
        milestonesData = data.career_milestones || [];
      }

      setProfile(profileData);
      setForm(initForm(profileData));
      setMilestones(
        milestonesData.sort(
          (a, b) => new Date(b.start_date || 0) - new Date(a.start_date || 0)
        )
      );
    } catch (e) {
      console.error("loadProfile error:", e);
      // profile stays null → "Profile not found" shown only for other-user profiles
    } finally {
      setLoading(false);
    }
  }

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  function handleAvatarSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (JPG, PNG, etc.).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5 MB.");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  const addSkill = (s) => {
    if (s && !form.skills.includes(s)) setForm((p) => ({ ...p, skills: [...p.skills, s] }));
  };
  const removeSkill = (s) => setForm((p) => ({ ...p, skills: p.skills.filter((x) => x !== s) }));

  async function handleSave() {
    setSaving(true); setSaveError(""); setSaveSuccess(false);

    // Validation for student and alumni accounts
    if (profile?.role === "student" || profile?.role === "alumni") {
      const requiredFields = [
        "first_name", "last_name", "phone", "date_of_birth", "gender", "city", "address",
        "student_number", "graduation_year", "batch_year", "department", "program"
      ];
      if (profile?.role === "alumni") {
        requiredFields.push("current_job_title", "current_company", "industry");
      }
      const missingFields = requiredFields.filter(f => !form[f] || String(form[f]).trim() === "");
      if (missingFields.length > 0) {
        setSaveError("Please fill out all missing fields marked with * before saving.");
        setSaving(false);
        return;
      }
    }

    try {
      let avatarUrl = form.avatar_url;

      // Upload new avatar if one was selected
      if (avatarFile) {
        setUploadingAvatar(true);
        const reader = new FileReader();
        const base64 = await new Promise((resolve, reject) => {
          reader.onload  = (ev) => resolve(ev.target.result.split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(avatarFile);
        });
        const { data: uploadData } = await api.post("/profiles/avatar", {
          fileBase64: base64,
          fileName:   avatarFile.name,
          mimeType:   avatarFile.type,
        });
        avatarUrl = uploadData.avatar_url;
        setUploadingAvatar(false);
      }

      // Save via server (handles allowed fields whitelist)
      await api.put("/profiles/me", {
        ...form,
        avatar_url: avatarUrl,
        date_of_birth:   form.date_of_birth   || null,
        graduation_year: form.graduation_year ? parseInt(form.graduation_year) : null,
        batch_year:      form.batch_year      ? parseInt(form.batch_year)      : null,
      });
      // Re-fetch directly from Supabase to get fresh data
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(data);
      setForm(initForm(data));
      setAvatarFile(null);
      setAvatarPreview(null);
      setEditing(false);
      setSaveSuccess(true);
      refreshProfile();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      const errorMsg = e.response?.data?.error || e.message || "Failed to save changes.";
      setSaveError(typeof errorMsg === 'string' ? errorMsg : errorMsg.message || "Failed to save changes.");
      setUploadingAvatar(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setForm(initForm(profile));
    setAvatarFile(null);
    setAvatarPreview(null);
    setEditing(false);
    setSaveError("");
  }

  // ── Messaging ──
  async function handleSendMessage() {
    setSendingMsg(true);
    setMsgError("");
    try {
      // Faculty bypass: even for private profiles, go straight to inbox
      const sendAsRequest = profile.is_private && authProfile?.role !== "faculty";
      if (sendAsRequest) {
        // Private profile (non-faculty sender) → message request
        await api.post("/message-requests", {
          recipientId: profileId,
          message: msgContent.trim() || undefined,
        });
      } else {
        // Public profile OR faculty sender → deliver directly to inbox
        await api.post("/messages", {
          recipientId: profileId,
          content: msgContent.trim(),
        });
      }
      setMsgSent(true);
      setMsgContent("");
      setTimeout(() => {
        setMsgModal(false);
        setMsgSent(false);
      }, 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to send.";
      setMsgError(typeof errorMsg === 'string' ? errorMsg : errorMsg.message || "Failed to send.");
    } finally {
      setSendingMsg(false);
    }
  }

  // ── Milestones ──
  function openAddMilestone() {
    setMilestoneForm(initMilestoneForm());
    setMilestoneModal(true);
  }

  function openEditMilestone(m) {
    setMilestoneForm({
      ...m,
      start_date: m.start_date ? m.start_date.split("T")[0] : "",
      end_date: m.end_date ? m.end_date.split("T")[0] : "",
      skills_used: m.skills_used || [],
    });
    setMilestoneModal(true);
  }

  async function handleSaveMilestone() {
    if (!milestoneForm.title) return;
    setSavingMilestone(true);
    try {
      if (milestoneForm.id) {
        const { data } = await api.put(`/career/milestones/${milestoneForm.id}`, milestoneForm);
        setMilestones((prev) => prev.map((m) => (m.id === data.id ? data : m)));
      } else {
        const { data } = await api.post("/career/milestones", milestoneForm);
        setMilestones((prev) => [data, ...prev]);
      }
      setMilestoneModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingMilestone(false);
    }
  }

  function handleDeleteMilestone(id) {
    setConfirmDelete({ open: true, id });
  }

  async function confirmDeleteMilestone() {
    const { id } = confirmDelete;
    setConfirmDelete({ open: false, id: null });
    try {
      await api.delete(`/career/milestones/${id}`);
      setMilestones((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      console.error(e);
    }
  }

  // ── CV Upload ──
  async function handleCVUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)) {
      setUploadMsg("Only PDF or DOCX files are accepted.");
      return;
    }
    setUploading(true); setUploadMsg("");
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result.split(",")[1];
        await api.post("/career/upload-cv", {
          fileBase64: base64,
          fileName: file.name,
          mimeType: file.type,
        });
        setUploadMsg("CV uploaded! AI is processing your milestones.");
        setUploading(false);
        loadProfile();
      };
      reader.readAsDataURL(file);
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Upload failed.";
      setUploadMsg(typeof errorMsg === 'string' ? errorMsg : errorMsg.message || "Upload failed.");
      setUploading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!profile) {
    return <div className="card text-center text-gray-500 py-16">Profile not found.</div>;
  }

  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email;
  const initials    = [profile.first_name?.[0], profile.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?";
  const showAlumniSections  = profile.role === "alumni" || profile.role === "student";
  const showProfessionalInfo = profile.role !== "student";
  const showMilestones       = profile.role === "alumni";
  // Admin and Faculty always see full profiles regardless of privacy setting
  const isPrivateOther = !isOwnProfile && !!profile.is_private && !["admin", "faculty"].includes(authProfile?.role);
  // For messaging: Faculty bypass privacy → message goes straight to inbox, not requests
  const isMsgRequest = !isOwnProfile && !!profile.is_private && authProfile?.role !== "faculty";

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Profile Header Card ── */}
      <div className="card">
        <div className="flex items-start gap-5 flex-wrap">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
              {avatarPreview
                ? <img src={avatarPreview} alt="Preview" className="w-20 h-20 object-cover"/>
                : profile.avatar_url
                  ? <img src={profile.avatar_url} alt={displayName} className="w-20 h-20 object-cover"/>
                  : initials}
            </div>
            {/* Camera overlay — only in edit mode */}
            {isOwnProfile && editing && (
              <>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 rounded-2xl bg-black/40 flex flex-col items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {uploadingAvatar
                    ? <Loader2 size={20} className="animate-spin"/>
                    : <><Camera size={18}/><span className="text-[10px] mt-1 font-medium">Change</span></>}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarSelect}
                />
              </>
            )}
            {/* "New photo" indicator badge */}
            {avatarPreview && (
              <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-tight">
                NEW
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
              {profile.is_verified && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                  <CheckCircle size={11} /> Verified
                </span>
              )}
              {profile.is_private && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                  <Lock size={11} /> Private
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5 capitalize">{profile.role}</p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
              {profile.current_job_title && (
                <span className="flex items-center gap-1"><Briefcase size={12} />{profile.current_job_title}{profile.current_company ? ` at ${profile.current_company}` : ""}</span>
              )}
              {profile.program && (
                <span className="flex items-center gap-1"><GraduationCap size={12} />{profile.program}</span>
              )}
              {profile.city && (
                <span className="flex items-center gap-1"><MapPin size={12} />{profile.city}</span>
              )}
              {profile.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline">
                  <Linkedin size={12} /> LinkedIn
                </a>
              )}
            </div>
          </div>

          {/* Actions (own profile only) */}
          {isOwnProfile && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {saveSuccess && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle size={13} /> Saved
                </span>
              )}
              {!editing ? (
                <button onClick={() => setEditing(true)} className="btn-secondary flex items-center gap-2 text-sm">
                  <Edit2 size={14} /> Edit Profile
                </button>
              ) : (
                <>
                  <button onClick={handleCancelEdit} className="btn-secondary flex items-center gap-2 text-sm">
                    <X size={14} /> Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 text-sm">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save
                  </button>
                </>
              )}
            </div>
          )}

          {/* Message button (other users' profiles, non-admin only) */}
          {!isOwnProfile && authProfile?.role !== "admin" && (
            <button
              onClick={() => { setMsgModal(true); setMsgError(""); setMsgSent(false); }}
              className="btn-primary flex items-center gap-2 text-sm flex-shrink-0"
            >
              <MessageCircle size={14} />
              {isMsgRequest ? "Send Request" : "Message"}
            </button>
          )}
        </div>

        {saveError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{saveError}</div>
        )}

        {profile.bio && !editing && (
          <p className="mt-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">{profile.bio}</p>
        )}
        {editing && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <label className="label">Bio</label>
            <textarea name="bio" value={form.bio} onChange={handleFieldChange} rows={3}
              className="input-field resize-none" placeholder="Write a short bio..." />
          </div>
        )}
      </div>

      {/* ── Private profile wall ── */}
      {isPrivateOther ? (
        <div className="card text-center py-16">
          <Lock size={40} className="mx-auto mb-4 text-gray-300" />
          <h3 className="font-semibold text-gray-700 mb-1">This account is private</h3>
          <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
            This user has chosen to keep their profile private.
            Send them a message request to connect.
          </p>
          {authProfile?.role !== "admin" && (
            <button
              onClick={() => { setMsgModal(true); setMsgError(""); setMsgSent(false); }}
              className="mt-5 btn-primary inline-flex items-center gap-2 text-sm"
            >
              <MessageCircle size={14} /> Send Message Request
            </button>
          )}
        </div>
      ) : (
        <>

      {/* ── Personal Information ── */}
      <div className="card">
        <SectionHeader icon={User} title="Personal Information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name"    value={form.first_name}   editing={editing} name="first_name"   onChange={handleFieldChange} placeholder="Juan" isRequired={profile?.role === "student" || profile?.role === "alumni"} />
          <Field label="Last Name"     value={form.last_name}    editing={editing} name="last_name"    onChange={handleFieldChange} placeholder="Dela Cruz" isRequired={profile?.role === "student" || profile?.role === "alumni"} />
          <Field label="Phone"         value={form.phone}        editing={editing} name="phone"        onChange={handleFieldChange} type="tel" placeholder="+63 912 345 6789" isRequired={profile?.role === "student" || profile?.role === "alumni"} />
          <Field label="Date of Birth" value={form.date_of_birth} editing={editing} name="date_of_birth" onChange={handleFieldChange} type="date" isRequired={profile?.role === "student" || profile?.role === "alumni"} />
          <Field label="Gender"        value={form.gender}       editing={editing} name="gender"       onChange={handleFieldChange}
            options={["Male", "Female", "Non-binary", "Prefer not to say"]} isRequired={profile?.role === "student" || profile?.role === "alumni"} />
          <Field label="City"          value={form.city}         editing={editing} name="city"         onChange={handleFieldChange} placeholder="Quezon City" isRequired={profile?.role === "student" || profile?.role === "alumni"} />
          <div className="sm:col-span-2">
            <Field label="Address"     value={form.address}      editing={editing} name="address"      onChange={handleFieldChange} placeholder="Street, Barangay" isRequired={profile?.role === "student" || profile?.role === "alumni"} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Email"       value={profile.email}     editing={false} name="email" />
          </div>
          <div className="sm:col-span-2">
            <Field label="LinkedIn URL" value={form.linkedin_url} editing={editing} name="linkedin_url" onChange={handleFieldChange} type="url" placeholder="https://linkedin.com/in/..." />
          </div>
        </div>
      </div>

      {/* ── Academic Information (Alumni only) ── */}
      {showAlumniSections && (
        <div className="card">
          <SectionHeader icon={GraduationCap} title="Academic Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Student Number"   value={form.student_number}  editing={editing} name="student_number"  onChange={handleFieldChange} placeholder="XXXX-XXXXX-MN-X" isRequired={profile?.role === "student" || profile?.role === "alumni"} />
            <Field label="Graduation Year"  value={form.graduation_year} editing={editing} name="graduation_year" onChange={handleFieldChange} type="number" placeholder="2023" isRequired={profile?.role === "student" || profile?.role === "alumni"} />
            <Field label="Batch Year"       value={form.batch_year}      editing={editing} name="batch_year"      onChange={handleFieldChange} type="number" placeholder="2019" isRequired={profile?.role === "student" || profile?.role === "alumni"} />
            <Field label="Department"       value={form.department}      editing={editing} name="department"      onChange={handleFieldChange} placeholder="College of IT" isRequired={profile?.role === "student" || profile?.role === "alumni"} />
            <div className="sm:col-span-2">
              <Field label="Program" value={form.program} editing={editing} name="program" onChange={handleFieldChange} options={PROGRAMS} isRequired={profile?.role === "student" || profile?.role === "alumni"} />
            </div>
          </div>
        </div>
      )}

      {/* ── Professional Information (hidden for students) ── */}
      {showProfessionalInfo && (
        <div className="card">
          <SectionHeader icon={Briefcase} title="Professional Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Current Job Title"  value={form.current_job_title} editing={editing} name="current_job_title" onChange={handleFieldChange} placeholder="Software Engineer" isRequired={profile?.role === "alumni"} />
            <Field label="Current Company"    value={form.current_company}   editing={editing} name="current_company"   onChange={handleFieldChange} placeholder="Accenture Philippines" isRequired={profile?.role === "alumni"} />
            <Field label="Industry"           value={form.industry}          editing={editing} name="industry"          onChange={handleFieldChange} options={INDUSTRIES} isRequired={profile?.role === "alumni"} />
          </div>
        </div>
      )}

      {/* ── Skills (Alumni only) ── */}
      {showAlumniSections && (
        <div className="card">
          <SectionHeader icon={Tag} title="Skills" />
          <SkillsEditor
            skills={form.skills} editing={editing}
            onAdd={addSkill} onRemove={removeSkill}
            inputVal={skillInput} setInputVal={setSkillInput}
          />
        </div>
      )}

      {/* ── CV Upload (own alumni profile only) ── */}
      {showAlumniSections && isOwnProfile && (
        <div className="card">
          <SectionHeader icon={FileText} title="Resume / CV" />
          <div className="flex items-center gap-4 flex-wrap">
            {profile.cv_url ? (
              <>
                <button onClick={() => setShowResume(v => !v)}
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  {showResume ? <EyeOff size={15}/> : <Eye size={15}/>}
                  {showResume ? "Hide Resume" : "View Resume"}
                </button>
                <a href={profile.cv_url} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                  <ExternalLink size={14}/> Open in new tab
                </a>
              </>
            ) : (
              <p className="text-sm text-gray-400 italic">No CV uploaded yet.</p>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleCVUpload} />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="btn-secondary flex items-center gap-2 text-sm">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {profile.cv_url ? "Replace CV" : "Upload CV"}
            </button>
          </div>

          {/* Inline PDF Viewer */}
          {showResume && profile.cv_url && (
            <div className="mt-4 rounded-xl overflow-hidden border border-gray-200">
              {profile.cv_url.toLowerCase().includes(".pdf") ? (
                <iframe
                  src={profile.cv_url}
                  title="Resume Preview"
                  className="w-full h-[700px] bg-gray-50"
                >
                  <div className="flex flex-col items-center justify-center h-full py-12 text-gray-500">
                    <FileText size={32} className="mb-3 opacity-40"/>
                    <p className="text-sm">Your browser cannot display this PDF inline.</p>
                    <a href={profile.cv_url} target="_blank" rel="noreferrer"
                      className="mt-2 text-sm text-blue-600 hover:underline flex items-center gap-1">
                      <ExternalLink size={13}/> Open PDF in new tab
                    </a>
                  </div>
                </iframe>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <FileText size={32} className="mb-3 opacity-40"/>
                  <p className="text-sm">Inline preview is only available for PDF files.</p>
                  <a href={profile.cv_url} target="_blank" rel="noreferrer"
                    className="mt-2 text-sm text-blue-600 hover:underline flex items-center gap-1">
                    <ExternalLink size={13}/> Open document in new tab
                  </a>
                </div>
              )}
            </div>
          )}

          {uploadMsg && (
            <p className={`mt-3 text-sm ${uploadMsg.includes("failed") || uploadMsg.includes("Only") ? "text-red-600" : "text-green-600"}`}>
              {uploadMsg}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-400">Accepted formats: PDF, DOCX. Max 10MB.</p>
        </div>
      )}

      {/* ── Career Milestones (Alumni only) ── */}
      {showMilestones && (
        <div className="card">
          <SectionHeader
            icon={TrendingUpIcon}
            title="Career Milestones"
            action={
              isOwnProfile && (
                <button onClick={openAddMilestone} className="btn-primary flex items-center gap-2 text-sm py-1.5">
                  <Plus size={15} /> Add Milestone
                </button>
              )
            }
          />

          {milestones.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Briefcase size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">No career milestones yet.</p>
              {isOwnProfile && (
                <button onClick={openAddMilestone} className="mt-3 text-sm text-blue-600 hover:underline">
                  Add your first milestone
                </button>
              )}
            </div>
          ) : (
            <div className="mt-2">
              {milestones.map((m) => (
                <MilestoneCard
                  key={m.id} m={m} isOwn={isOwnProfile}
                  onEdit={openEditMilestone} onDelete={handleDeleteMilestone}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Milestone Modal */}
      {milestoneModal && (
        <MilestoneModal
          form={milestoneForm} setForm={setMilestoneForm}
          onSave={handleSaveMilestone} onClose={() => setMilestoneModal(false)}
          saving={savingMilestone}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDelete.open}
        title="Delete Milestone"
        message="Are you sure you want to permanently delete this career milestone? This action cannot be undone."
        confirmLabel="Yes, Delete"
        onConfirm={confirmDeleteMilestone}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
      />

        </>
      )}

      {/* ── Message / Request Modal ── */}
      {msgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setMsgModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                {isMsgRequest
                  ? `Send Message Request to ${profile.first_name}`
                  : `Message ${profile.first_name}`}
              </h3>
              <button onClick={() => setMsgModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={18}/>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {isMsgRequest && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                  <Lock size={14} className="mt-0.5 flex-shrink-0"/>
                  <p>This user has a private profile. Your message will be sent as a request — they must accept before you can chat.</p>
                </div>
              )}

              {msgSent ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  <CheckCircle size={15}/>
                  {isMsgRequest ? "Message request sent!" : "Message sent!"}
                </div>
              ) : (
                <>
                  {msgError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                      {msgError}
                    </div>
                  )}
                  <div>
                    <label className="label">
                      {profile.is_private ? "Message (optional)" : "Message *"}
                    </label>
                    <textarea
                      value={msgContent}
                      onChange={e => setMsgContent(e.target.value)}
                      rows={4}
                      className="input-field resize-none"
                      placeholder={profile.is_private
                        ? "Introduce yourself or explain why you'd like to connect..."
                        : "Write your message..."}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setMsgModal(false)} className="btn-secondary flex-1 text-sm">
                      Cancel
                    </button>
                    <button
                      onClick={handleSendMessage}
                      disabled={sendingMsg || (!profile.is_private && !msgContent.trim())}
                      className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
                    >
                      {sendingMsg && <Loader2 size={14} className="animate-spin"/>}
                      <Send size={14}/>
                      {profile.is_private ? "Send Request" : "Send Message"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline icon alias (TrendingUp used in milestones header)
function TrendingUpIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
