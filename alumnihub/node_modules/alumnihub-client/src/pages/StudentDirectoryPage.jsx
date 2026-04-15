import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import {
  Search, Filter, Users, ChevronLeft, ChevronRight,
  Loader2, GraduationCap, X, BookOpen,
} from "lucide-react";

const PROGRAMS = [
  "BS Information Systems",
  "BS Information Technology",
  "BS Computer Science",
  "BS Computer Engineering",
  "BS Electronics Engineering",
  "BS Electrical Engineering",
  "BS Civil Engineering",
  "BS Mechanical Engineering",
  "BS Accountancy",
  "BS Business Administration",
  "BS Industrial Engineering",
  "Other",
];

function StudentRow({ student }) {
  const name     = [student.first_name, student.last_name].filter(Boolean).join(" ") || "—";
  const initials = [student.first_name?.[0], student.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?";

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      {/* Name */}
      <td className="px-5 py-4">
        <Link to={`/profile/${student.id}`} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {student.avatar_url
              ? <img src={student.avatar_url} className="w-9 h-9 rounded-full object-cover" alt=""/>
              : initials}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
              {name}
            </p>
            <p className="text-xs text-gray-500">{student.email}</p>
          </div>
        </Link>
      </td>

      {/* Student No. */}
      <td className="px-5 py-4">
        <p className="text-sm text-gray-700 font-mono">{student.student_number || "—"}</p>
      </td>

      {/* Program */}
      <td className="px-5 py-4">
        <p className="text-sm text-gray-700">{student.program || "—"}</p>
      </td>

      {/* Department */}
      <td className="px-5 py-4">
        <p className="text-sm text-gray-700">{student.department || "—"}</p>
      </td>

      {/* Batch Year */}
      <td className="px-5 py-4 text-center">
        <p className="text-sm text-gray-700">{student.batch_year || "—"}</p>
      </td>
    </tr>
  );
}

export default function StudentDirectoryPage() {
  const [students, setStudents]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [program, setProgram]         = useState("");
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalCount, setTotalCount]   = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchStudents, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, program, page]);

  async function fetchStudents() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)  params.set("search", search);
      if (program) params.set("program", program);
      params.set("page", page);

      const { data } = await api.get(`/profiles/students?${params}`);
      setStudents(data.students || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const activeFilters = [program].filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Directory</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse registered student accounts.
            {totalCount > 0 && ` ${totalCount.toLocaleString()} student${totalCount !== 1 ? "s" : ""} found.`}
          </p>
        </div>
      </div>

      {/* Search + Filter Bar */}
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
          <Filter size={14}/> Filters
          {activeFilters > 0 && (
            <span className="bg-blue-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="card flex flex-wrap gap-4">
          <div className="flex-1 min-w-48">
            <label className="label">Program</label>
            <select
              value={program}
              onChange={e => { setProgram(e.target.value); setPage(1); }}
              className="input-field bg-white text-sm"
            >
              <option value="">All Programs</option>
              {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {activeFilters > 0 && (
            <div className="flex items-end">
              <button
                onClick={() => { setProgram(""); setPage(1); }}
                className="btn-secondary text-sm flex items-center gap-1.5"
              >
                <X size={13}/> Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={24} className="animate-spin text-blue-600"/>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users size={36} className="mx-auto mb-3 opacity-40"/>
            <p className="text-sm">No students found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <span className="flex items-center gap-1.5"><GraduationCap size={12}/> Name</span>
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Student No.</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <span className="flex items-center gap-1.5"><BookOpen size={12}/> Program</span>
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Department</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Batch Year</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => <StudentRow key={s.id} student={s}/>)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary p-2 disabled:opacity-40"
          >
            <ChevronLeft size={16}/>
          </button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-secondary p-2 disabled:opacity-40"
          >
            <ChevronRight size={16}/>
          </button>
        </div>
      )}
    </div>
  );
}
