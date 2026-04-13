import { useEffect, useState } from "react";
import api from "../services/api";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { BookOpen, Loader2, Sparkles, TrendingUp, Briefcase, Users, AlertCircle, ChevronDown } from "lucide-react";

const PIE_COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4","#84cc16"];

function StatBadge({ label, value, color = "bg-blue-50 text-blue-700" }) {
  return (
    <div className={`rounded-xl px-4 py-3 ${color}`}>
      <p className="text-xl font-bold">{value ?? "—"}</p>
      <p className="text-xs mt-0.5 opacity-80">{label}</p>
    </div>
  );
}

export default function CurriculumImpactPage() {
  const [programs,   setPrograms]   = useState([]);
  const [program,    setProgram]    = useState("");
  const [yearStart,  setYearStart]  = useState("");
  const [yearEnd,    setYearEnd]    = useState("");
  const [report,     setReport]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [loadingPrg, setLoadingPrg] = useState(true);
  const [error,      setError]      = useState("");

  const YEARS = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    api.get("/analytics/programs")
      .then(({ data }) => setPrograms(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingPrg(false));
  }, []);

  async function handleGenerate(e) {
    e.preventDefault();
    if (!program) { setError("Please select a program."); return; }
    setLoading(true);
    setError("");
    setReport(null);
    try {
      const params = new URLSearchParams({ program });
      if (yearStart) params.set("yearStart", yearStart);
      if (yearEnd)   params.set("yearEnd", yearEnd);
      const { data } = await api.get(`/analytics/curriculum-impact?${params}`);
      setReport(data);
    } catch(err) {
      setError(err.response?.data?.error || "Failed to generate report.");
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Curriculum Impact</h1>
        <p className="text-sm text-gray-500 mt-1">Analyze how program curricula translate into alumni career outcomes.</p>
      </div>

      {/* Config Card */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen size={16} className="text-blue-600"/>Generate Report
        </h2>
        <form onSubmit={handleGenerate} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-48">
            <label className="label">Program *</label>
            <select value={program} onChange={e => setProgram(e.target.value)} className="input-field bg-white" disabled={loadingPrg}>
              <option value="">{loadingPrg ? "Loading…" : "Select a program"}</option>
              {programs.map(p => (
                <option key={p.id || p.program || p} value={p.program || p}>{p.program || p}</option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="label">Year From</label>
            <select value={yearStart} onChange={e => setYearStart(e.target.value)} className="input-field bg-white">
              <option value="">Any</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="w-32">
            <label className="label">Year To</label>
            <select value={yearEnd} onChange={e => setYearEnd(e.target.value)} className="input-field bg-white">
              <option value="">Any</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button type="submit" disabled={loading || !program} className="btn-primary flex items-center gap-2 text-sm">
            {loading ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>}
            {loading ? "Generating…" : "Generate Report"}
          </button>
        </form>
        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-lg">
            <AlertCircle size={14}/>{error}
          </div>
        )}
      </div>

      {/* Report */}
      {loading && (
        <div className="card flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 size={32} className="animate-spin text-blue-600 mb-4"/>
          <p className="text-sm">Analyzing curriculum data…</p>
        </div>
      )}

      {!loading && report && (
        <div className="space-y-6">
          {/* Summary banner */}
          {report.summary && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <Sparkles size={18} className="text-blue-600 flex-shrink-0 mt-0.5"/>
              <p className="text-sm text-blue-800 leading-relaxed">{report.summary}</p>
            </div>
          )}

          {/* Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatBadge label="Graduates Analyzed" value={report.totalGraduates?.toLocaleString()} color="bg-blue-50 text-blue-700"/>
            <StatBadge label="Employment Rate"
              value={report.employmentRate != null ? `${Math.round(report.employmentRate * 100)}%` : null}
              color="bg-green-50 text-green-700"/>
            <StatBadge label="Avg. Progression Score"
              value={report.avgProgressionScore != null ? `${Math.round(report.avgProgressionScore * 100)}%` : null}
              color="bg-amber-50 text-amber-700"/>
            <StatBadge label="Industries Represented"
              value={report.industries?.length ?? report.topIndustries?.length}
              color="bg-purple-50 text-purple-700"/>
          </div>

          {/* Industry Distribution */}
          {(report.industryDistribution || report.industries || report.topIndustries)?.length > 0 && (() => {
            const industryData = report.industryDistribution || report.industries || report.topIndustries;
            return (
              <div className="card">
                <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase size={15} className="text-blue-600"/>Industry Distribution
                </h2>
                <div className="flex items-center gap-6 flex-wrap">
                  <ResponsiveContainer width="50%" height={200} minWidth={180}>
                    <PieChart>
                      <Pie data={industryData} dataKey="count" nameKey="industry" cx="50%" cy="50%" outerRadius={80} paddingAngle={2}>
                        {industryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                      </Pie>
                      <Tooltip/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    {industryData.slice(0, 8).map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}/>
                        <span className="truncate">{d.industry}</span>
                        <span className="ml-auto font-medium text-gray-900 flex-shrink-0">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Top Job Titles */}
          {(report.topJobTitles || report.jobTitles)?.length > 0 && (
            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp size={15} className="text-blue-600"/>Top Job Titles
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={(report.topJobTitles || report.jobTitles).slice(0, 10)} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="title" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0}/>
                  <YAxis tick={{ fontSize: 11 }}/>
                  <Tooltip/>
                  <Bar dataKey="count" fill="#10b981" radius={[4,4,0,0]} name="Graduates"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Skills */}
          {(report.topSkills || report.skills)?.length > 0 && (
            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={15} className="text-blue-600"/>Most Common Skills
              </h2>
              <div className="space-y-3">
                {(report.topSkills || report.skills).slice(0, 10).map((s, i) => {
                  const max = (report.topSkills || report.skills)[0]?.count || 1;
                  const pct = Math.round((s.count / max) * 100);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-gray-700 w-40 truncate">{s.skill}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }}/>
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">{s.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top Companies */}
          {(report.topCompanies || report.companies)?.length > 0 && (
            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase size={15} className="text-blue-600"/>Top Employers
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(report.topCompanies || report.companies).slice(0, 8)} margin={{ top: 5, right: 10, left: 0, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="company" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0}/>
                  <YAxis tick={{ fontSize: 11 }}/>
                  <Tooltip/>
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4,4,0,0]} name="Alumni"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Insights from AI */}
          {report.insights && (
            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles size={15} className="text-blue-600"/>AI Insights
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{report.insights}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
