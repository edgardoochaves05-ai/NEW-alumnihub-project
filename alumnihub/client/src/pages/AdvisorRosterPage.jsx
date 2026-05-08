import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  Search, Filter, Users, Briefcase, GraduationCap, ChevronRight,
  Loader2, X, UserCheck, Clock, MapPin,
} from "lucide-react";
import AnnouncementsWidget from "../components/AnnouncementsWidget";


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
