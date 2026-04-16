import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import {
  Search, Filter, Users, ChevronLeft, ChevronRight,
  Loader2, GraduationCap, X, Briefcase,
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

function FacultyCard({ faculty }) {
  const name     = [faculty.first_name, faculty.last_name].filter(Boolean).join(" ") || "—";
  const initials = [faculty.first_name?.[0], faculty.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?";

  return (
    <Link
      to={`/profile/${faculty.id}`}
      className="card flex flex-col items-center text-center gap-3 hover:shadow-md hover:border-blue-200 border border-transparent transition-all p-5 group"
    >
      {/* Avatar */}
      <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 overflow-hidden ring-4 ring-blue-50 group-hover:ring-blue-100 transition-all">
        {faculty.avatar_url
          ? <img src={faculty.avatar_url} className="w-16 h-16 object-cover" alt={name} />
          : initials}
      </div>

      {/* Name & title */}
      <div className="min-w-0 w-full">
        <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
          {name}
        </p>
        {faculty.current_job_title && (
          <p className="text-xs text-gray-500 mt-0.5 flex items-center justify-center gap-1 truncate">
            <Briefcase size={11} className="flex-shrink-0" />
            {faculty.current_job_title}
          </p>
        )}
      </div>

      {/* Program badge */}
      {faculty.program && (
        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium w-full justify-center truncate">
          <GraduationCap size={11} className="flex-shrink-0" />
          <span className="truncate">{faculty.program}</span>
        </span>
      )}

      {/* Department */}
      {faculty.department && (
        <p className="text-xs text-gray-400 truncate w-full">{faculty.department}</p>
      )}
    </Link>
  );
}

export default function FacultyDirectoryPage() {
  const [faculty, setFaculty]         = useState([]);
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
    debounceRef.current = setTimeout(fetchFaculty, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, program, page]);

  async function fetchFaculty() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)  params.set("search", search);
      if (program) params.set("program", program);
      params.set("page", page);

      const { data } = await api.get(`/profiles/faculty?${params}`);
      setFaculty(data.faculty || []);
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Faculty Directory</h1>
        <p className="text-sm text-gray-500 mt-1">
          Browse faculty members and their programs.
          {totalCount > 0 && ` ${totalCount.toLocaleString()} faculty member${totalCount !== 1 ? "s" : ""} found.`}
        </p>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-56">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
          <Filter size={14} /> Filters
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
                <X size={13} /> Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cards grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={24} className="animate-spin text-blue-600" />
        </div>
      ) : faculty.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <Users size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No faculty members found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {faculty.map(f => <FacultyCard key={f.id} faculty={f} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary p-2 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-secondary p-2 disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
