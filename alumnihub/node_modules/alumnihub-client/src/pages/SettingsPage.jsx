import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase";
import { Lock, Eye, EyeOff, Shield, User, Loader2, CheckCircle, AlertTriangle } from "lucide-react";

function Section({ title, description, children }) {
  return (
    <div className="card space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Toast({ message, type }) {
  if (!message) return null;
  const styles = type === "success"
    ? "bg-green-50 border-green-200 text-green-700"
    : "bg-red-50 border-red-200 text-red-700";
  const Icon = type === "success" ? CheckCircle : AlertTriangle;
  return (
    <div className={`flex items-center gap-2 px-4 py-3 border rounded-lg text-sm ${styles}`}>
      <Icon size={15}/>{message}
    </div>
  );
}

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const isAlumni = profile?.role === "alumni";

  // Privacy
  const [isPrivate, setIsPrivate] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [privacyMsg, setPrivacyMsg] = useState({ text: "", type: "" });

  // Password
  const [pwForm, setPwForm]     = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPw, setShowPw]     = useState({ current: false, new: false });
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg]       = useState({ text: "", type: "" });

  useEffect(() => {
    if (profile) setIsPrivate(profile.is_private ?? false);
  }, [profile]);

  async function handlePrivacyToggle() {
    setSavingPrivacy(true);
    setPrivacyMsg({ text: "", type: "" });
    try {
      await api.put("/profiles/me", { is_private: !isPrivate });
      setIsPrivate(v => !v);
      if (refreshProfile) await refreshProfile();
      setPrivacyMsg({ text: "Privacy setting updated.", type: "success" });
    } catch(err) {
      setPrivacyMsg({ text: err.response?.data?.error || "Failed to update.", type: "error" });
    } finally { setSavingPrivacy(false); }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      setPwMsg({ text: "Please fill in all fields.", type: "error" }); return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMsg({ text: "New password must be at least 6 characters.", type: "error" }); return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ text: "Passwords do not match.", type: "error" }); return;
    }
    setSavingPw(true);
    setPwMsg({ text: "", type: "" });
    try {
      // Re-authenticate with current password first
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: pwForm.currentPassword,
      });
      if (signInErr) throw new Error("Current password is incorrect.");
      const { error: updateErr } = await supabase.auth.updateUser({ password: pwForm.newPassword });
      if (updateErr) throw updateErr;
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPwMsg({ text: "Password changed successfully.", type: "success" });
    } catch(err) {
      setPwMsg({ text: err.message || "Failed to change password.", type: "error" });
    } finally { setSavingPw(false); }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account preferences and security.</p>
      </div>

      {/* Account Info */}
      <Section title="Account Information" description="Your account details.">
        <div className="grid gap-4">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" className="w-10 h-10 object-cover"/>
                : `${profile?.first_name?.[0] || ""}${profile?.last_name?.[0] || ""}`}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{profile?.first_name} {profile?.last_name}</p>
              <p className="text-xs text-gray-500">{profile?.email}</p>
              <span className="inline-block mt-0.5 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full capitalize font-medium">{profile?.role}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <User size={12}/>To update your name or contact info, go to <a href="/profile" className="text-blue-600 underline">My Profile</a>.
          </p>
        </div>
      </Section>

      {/* Privacy (Alumni only) */}
      {isAlumni && (
        <Section
          title="Privacy"
          description="Control who can see your profile and contact you."
        >
          <Toast message={privacyMsg.text} type={privacyMsg.type}/>
          <div className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-start gap-3">
              <Shield size={18} className="text-gray-600 mt-0.5 flex-shrink-0"/>
              <div>
                <p className="text-sm font-medium text-gray-900">Private Profile</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  When enabled, other alumni cannot find you in the directory. Faculty and admins can still view your profile. People who want to message you must send a request first.
                </p>
              </div>
            </div>
            <button
              onClick={handlePrivacyToggle}
              disabled={savingPrivacy}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${isPrivate ? "bg-blue-600" : "bg-gray-300"}`}
            >
              {savingPrivacy && <Loader2 size={10} className="animate-spin absolute inset-0 m-auto text-white"/>}
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isPrivate ? "translate-x-6" : "translate-x-1"}`}/>
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Status: <span className="font-medium text-gray-700">{isPrivate ? "Profile is private" : "Profile is public"}</span>
          </p>
        </Section>
      )}

      {/* Change Password */}
      <Section title="Change Password" description="Update your login password.">
        <Toast message={pwMsg.text} type={pwMsg.type}/>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <div className="relative">
              <input
                type={showPw.current ? "text" : "password"}
                value={pwForm.currentPassword}
                onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                className="input-field pr-10"
                placeholder="Enter current password"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPw(p => ({ ...p, current: !p.current }))}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">
                {showPw.current ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
          </div>
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <input
                type={showPw.new ? "text" : "password"}
                value={pwForm.newPassword}
                onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                className="input-field pr-10"
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPw(p => ({ ...p, new: !p.new }))}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">
                {showPw.new ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type={showPw.new ? "text" : "password"}
              value={pwForm.confirmPassword}
              onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
              className="input-field"
              placeholder="Re-enter new password"
              autoComplete="new-password"
            />
          </div>
          <button type="submit" disabled={savingPw} className="btn-primary flex items-center gap-2 text-sm">
            {savingPw && <Loader2 size={14} className="animate-spin"/>}
            <Lock size={14}/>Change Password
          </button>
        </form>
      </Section>
    </div>
  );
}
