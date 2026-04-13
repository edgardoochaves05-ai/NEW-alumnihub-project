import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { Search, Filter, Users, ChevronLeft, ChevronRight, Loader2, GraduationCap, Briefcase, X, Lock } from "lucide-react";

const PROGRAMS = [
  "BS Information Systems",
  "BS Information Technology",
  "BS Computer Science",
  "BS Computer Engineering",
  "BS Electronics Engineering",
  "Other",
];

const YEARS = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i);

function AlumniRow({ alumni }) {
  const name     = `${alumni.first_name} ${alumni.last_name}`;
  const initials = [alumni.first_name?.[0], alumni.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?";

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-5 py-4">
        <Link to={`/profile/${alumni.id}`} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {alumni.avatar_url
              ? <img src={alumni.avatar_url} className="w-9 h-9 rounded-full object-cover" alt=""/>
              : initials}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
              {name}
              {alumni.is_private && <Lock size={11} className="text-gray-400" title="Private profile"/>}
            </p>
            <p className="text-xs text-gray-500">{alumni.email}</p>
          </div>
        </Link>
      </td>
      <td className="px-5 py-4">
        <p className="text-sm text-gray-700">{alumni.program || "—"}</p>
      </td>
      <td className="px-5 py-4">
        <p className="text-sm text-gray-700 text-center">{alumni.graduation_year || "—"}</p>
      </td>
      <td className="px-5 py-4">
        <p className="text-sm text-gray-700">{alumni.current_job_title || "—"}</p>
        {alumni.current_employer && <p className="text-xs text-gray-400">{alumni.current_employer}</p>}
      </td>
      <td className="px-5 py-4">
        <p className="text-sm text-gray-700">{alumni.industry || "—"}</p>
      </td>
      <td className="px-5 py-4">
        {alumni.is_verified
          ? <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-medium">Verified</span>
          : <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Unverified</span>}
      </td>
    </tr>
  );
}

export default function AlumniListPage() {
  const [alumni, setAlumni]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [program, setProgram]     = useState("");
  const [gradYear, setGradYear]   = useState("");
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchAlumni, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, program, gradYear, page]);

  async function fetchAlumni() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)   params.set("search", search);
      if (program)  params.set("program", program);
      if (gradYear) params.set("graduation_year", gradYear);
      params.set("page", page);
      const { data } = await api.get(`/profiles/alumni?${params}`);
      // API may return { alumni, total, totalPages } or plain array
      if (Array.isArray(data)) {
        setAlumni(data);
        setTotalPages(1);
        setTotalCount(data.length);
      } else {
        setAlumni(data.alumni || data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      }
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  const activeFilters = [program, gradYear].filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alumni Directory</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse and manage alumni records.{totalCount > 0 && ` ${totalCount.toLocaleString()} alumni found.`}
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
          <Filter size={14}/>Filters
          {activeFilters > 0 && (
            <span className="bg-blue-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">{activeFilters}</span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="card flex flex-wrap gap-4">
          <div className="flex-1 min-w-48">
            <label className="label">Program</label>
            <select value={program} onChange={e => { setProgram(e.target.value); setPage(1); }} className="input-field bg-white text-sm">
              <option value="">All Programs</option>
              {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-36">
            <label className="label">Graduation Year</label>
            <select value={gradYear} onChange={e => { setGradYear(e.target.value); setPage(1); }} className="input-field bg-white text-sm">
              <option value="">All Years</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {activeFilters > 0 && (
            <div className="flex items-end">
              <button onClick={() => { setProgram(""); setGradYear(""); setPage(1); }}
                className="btn-secondary text-sm flex items-center gap-1.5"><X size={13}/>Clear</button>
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
        ) : alumni.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users size={36} className="mx-auto mb-3 opacity-40"/>
            <p className="text-sm">No alumni found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <span className="flex items-center gap-1.5"><GraduationCap size={12}/>Name</span>
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Program</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Year</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <span className="flex items-center gap-1.5"><Briefcase size={12}/>Current Role</span>
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Industry</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {alumni.map(a => <AlumniRow key={a.id} alumni={a}/>)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
            className="btn-secondary p-2 disabled:opacity-40"><ChevronLeft size={16}/></button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
            className="btn-secondary p-2 disabled:opacity-40"><ChevronRight size={16}/></button>
        </div>
      )}
    </div>
  );
}
