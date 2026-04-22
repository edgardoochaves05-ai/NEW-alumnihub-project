import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import {
  Users, UserPlus, Trash2, Search, Loader2, X, Plus,
  UserCog, ChevronDown, Link as LinkIcon, CheckCircle,
} from "lucide-react";

// ── Reusable user search input ─────────────────────────────────────────────

function UserSearchInput({ placeholder, onSelect, roleFilter, disabled }) {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSrch]  = useState(false);
  const debounceRef = useRef(null);

  function handleChange(e) {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (val.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSrch(true);
      try {
        const params = new URLSearchParams({ search: val });
        if (roleFilter) params.set("role", roleFilter);
        const { data } = await api.get(`/advisor/search-users?${params}`);
        setResults(data);
      } catch { setResults([]); }
      finally { setSrch(false); }
    }, 300);
  }

  function pick(user) {
    onSelect(user);
    setQuery(`${user.first_name} ${user.last_name} (${user.email})`);
    setResults([]);
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input
          value={query}
          onChange={handleChange}
          disabled={disabled}
          className="input-field pl-9 text-sm"
          placeholder={placeholder}
        />
        {searching && <Loader2 size={13} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/>}
      </div>
      {results.length > 0 && (
        <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {results.map(u => (
            <button
              key={u.id}
              onClick={() => pick(u)}
              className="w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-sm"
            >
              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {u.first_name?.[0]}{u.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{u.first_name} {u.last_name}</p>
                <p className="text-xs text-gray-400 truncate">{u.email} · <span className="capitalize">{u.role === 'career_advisor' ? 'career advisor' : u.role}</span></p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Assign Role Modal ──────────────────────────────────────────────────────

function AssignRoleModal({ onClose, onSuccess }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState("");

  async function handleAssign() {
    if (!selectedUser) return;
    setSaving(true);
    setError("");
    try {
      await api.patch(`/profiles/${selectedUser.id}/role`, { role: "career_advisor" });
      onSuccess(selectedUser);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to assign role.");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Assign Career Advisor Role</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-500">Search for a career advisor or existing user to assign the Career Advisor role. This role is hidden from public registration.</p>
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</div>}
          <UserSearchInput
            placeholder="Search by name or email…"
            onSelect={setSelectedUser}
          />
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
            <button
              onClick={handleAssign}
              disabled={!selectedUser || saving}
              className="btn-primary flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 size={13} className="animate-spin"/> : <UserCog size={13}/>} Assign Role
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add Assignment Modal ────────────────────────────────────────────────────

function AddAssignmentModal({ advisors, onClose, onSuccess }) {
  const [advisorId, setAdvisorId]     = useState(advisors[0]?.id || "");
  const [selectedStudent, setStudent] = useState(null);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");

  async function handleAdd() {
    if (!advisorId || !selectedStudent) return;
    setSaving(true);
    setError("");
    try {
      const { data } = await api.post("/advisor/assignments", { advisor_id: advisorId, student_id: selectedStudent.id });
      onSuccess(data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create assignment. The student may already be assigned.");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Assign Student to Advisor</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</div>}
          <div>
            <label className="label">Career Advisor</label>
            <select value={advisorId} onChange={e => setAdvisorId(e.target.value)} className="input-field bg-white text-sm">
              {advisors.map(a => (
                <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Student</label>
            <UserSearchInput
              placeholder="Search student by name or email…"
              onSelect={setStudent}
              roleFilter="student"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
            <button
              onClick={handleAdd}
              disabled={!advisorId || !selectedStudent || saving}
              className="btn-primary flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 size={13} className="animate-spin"/> : <Plus size={13}/>} Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function AdvisorManagementPage() {
  const [advisors, setAdvisors]         = useState([]);
  const [assignments, setAssignments]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showRoleModal, setRoleModal]   = useState(false);
  const [showAssignModal, setAssign]    = useState(false);
  const [filterAdvisor, setFilterAdv]   = useState("");

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [{ data: adv }, { data: asgn }] = await Promise.all([
        api.get("/advisor/list"),
        api.get("/advisor/assignments"),
      ]);
      setAdvisors(adv || []);
      setAssignments(asgn || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function removeAssignment(id) {
    try {
      await api.delete(`/advisor/assignments/${id}`);
      setAssignments(prev => prev.filter(a => a.id !== id));
    } catch (e) { console.error(e); }
  }

  async function removeAdvisor(id) {
    if (!window.confirm("Are you sure you want to remove this career advisor? Their role will be reverted to 'alumni'.")) return;
    try {
      await api.patch(`/profiles/${id}/role`, { role: "alumni" });
      setAdvisors(prev => prev.filter(a => a.id !== id));
      // Re-fetch assignments to reflect any cascade deletes
      const { data: asgn } = await api.get("/advisor/assignments");
      setAssignments(asgn || []);
    } catch (e) { 
      console.error(e); 
      alert(e.response?.data?.error || "Failed to remove advisor."); 
    }
  }

  function onRoleAssigned(user) {
    setAdvisors(prev => [...prev, { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email }]);
    setRoleModal(false);
  }

  function onAssignmentAdded(data) {
    setAssignments(prev => [data, ...prev]);
    setAssign(false);
  }

  const filteredAssignments = filterAdvisor
    ? assignments.filter(a => a.advisor?.id === filterAdvisor)
    : assignments;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Advisor Management</h1>
        <p className="text-sm text-gray-500 mt-1">Assign Career Advisor roles and manage student–advisor assignments.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={24} className="animate-spin text-blue-600"/>
        </div>
      ) : (
        <>
          {/* ── Career Advisors Section ── */}
          <section className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <UserCog size={16} className="text-blue-600"/>Career Advisors
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{advisors.length}</span>
              </h2>
              <button onClick={() => setRoleModal(true)} className="btn-primary text-sm flex items-center gap-2">
                <UserPlus size={14}/>Add Advisor
              </button>
            </div>

            {advisors.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <UserCog size={28} className="mx-auto mb-2 opacity-30"/>
                <p className="text-sm">No career advisors assigned yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {advisors.map(a => (
                  <div key={a.id} className="flex items-center gap-4 py-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {a.first_name?.[0]}{a.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{a.first_name} {a.last_name}</p>
                      <p className="text-xs text-gray-400">{a.email}{a.department ? ` · ${a.department}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {assignments.filter(x => x.advisor?.id === a.id).length} student{assignments.filter(x => x.advisor?.id === a.id).length !== 1 ? "s" : ""}
                      </span>
                      <button
                        onClick={() => removeAdvisor(a.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove advisor"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Assignments Section ── */}
          <section className="card space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Users size={16} className="text-blue-600"/>Student Assignments
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{assignments.length}</span>
              </h2>
              <div className="flex items-center gap-3">
                {advisors.length > 0 && (
                  <select
                    value={filterAdvisor}
                    onChange={e => setFilterAdv(e.target.value)}
                    className="input-field bg-white text-sm py-1.5 min-w-40"
                  >
                    <option value="">All Advisors</option>
                    {advisors.map(a => (
                      <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>
                    ))}
                  </select>
                )}
                <button
                  onClick={() => setAssign(true)}
                  disabled={advisors.length === 0}
                  className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <Plus size={14}/>Assign Student
                </button>
              </div>
            </div>

            {filteredAssignments.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Users size={28} className="mx-auto mb-2 opacity-30"/>
                <p className="text-sm">{advisors.length === 0 ? "Add a career advisor first to create assignments." : "No assignments found."}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredAssignments.map(a => (
                  <div key={a.id} className="flex items-center gap-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-sm text-gray-900">
                        <span className="font-medium">{a.student?.first_name} {a.student?.last_name}</span>
                        {a.student?.program && <span className="text-xs text-gray-400">· {a.student.program}</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Assigned to <span className="font-medium text-gray-600">{a.advisor?.first_name} {a.advisor?.last_name}</span>
                        {" · "}{new Date(a.assigned_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <button
                      onClick={() => removeAssignment(a.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                      title="Remove assignment"
                    >
                      <Trash2 size={15}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {showRoleModal && <AssignRoleModal onClose={() => setRoleModal(false)} onSuccess={onRoleAssigned}/>}
      {showAssignModal && advisors.length > 0 && (
        <AddAssignmentModal advisors={advisors} onClose={() => setAssign(false)} onSuccess={onAssignmentAdded}/>
      )}
    </div>
  );
}
