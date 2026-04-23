import { useEffect, useState } from "react";
import api from "../services/api";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList
} from "recharts";
import { Users, Briefcase, TrendingUp, GraduationCap, Loader2, RefreshCw, Eye, Send, ChevronUp, ChevronDown, Filter, X } from "lucide-react";

const PIE_COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4","#84cc16"];

function StatCard({ label, value, icon: Icon, color = "text-blue-600", sub }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0`}>
        <Icon size={20} className={color}/>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? "—"}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [stats,      setStats]      = useState(null);
  const [trends,     setTrends]     = useState([]);
  const [jobMetrics, setJobMetrics] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [sortField,     setSortField]     = useState("engagement");
  const [sortDir,       setSortDir]       = useState("desc");
  const [industryFilter, setIndustryFilter] = useState("");

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [statsRes, trendsRes, metricsRes] = await Promise.all([
        api.get("/analytics/dashboard"),
        api.get("/analytics/employment-trends"),
        api.get("/analytics/job-metrics?limit=10"),
      ]);
      setStats(statsRes.data);
      setTrends(trendsRes.data);
      setJobMetrics(metricsRes.data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  function handleSort(field) {
    if (sortField === field) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortField(field); setSortDir("desc"); }
  }

  function SortIcon({ field }) {
    if (sortField !== field) return <ChevronDown size={12} className="text-gray-300 inline ml-1"/>;
    return sortDir === "desc"
      ? <ChevronDown size={12} className="text-blue-500 inline ml-1"/>
      : <ChevronUp size={12} className="text-blue-500 inline ml-1"/>;
  }

  // Unique industries from all jobs (for filter dropdown)
  const allJobsList = jobMetrics?.allJobs || [];
  const industries = [...new Set(allJobsList.map(j => j.industry).filter(Boolean))].sort();

  // Apply industry filter then sort
  const filteredJobs = industryFilter
    ? allJobsList.filter(j => j.industry === industryFilter)
    : allJobsList;

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const diff = b[sortField] - a[sortField];
    return sortDir === "desc" ? diff : -diff;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-blue-600"/>
      </div>
    );
  }

  // Derived chart data from stats
  const programData = stats?.programBreakdown || stats?.programs || [];
  const industryData = stats?.industryBreakdown || stats?.industries || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of alumni employment and program outcomes.</p>
        </div>
        <button onClick={fetchAll} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={14}/>Refresh
        </button>
      </div>

      {/* Stat Cards — Alumni */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Alumni" value={stats?.totalAlumni?.toLocaleString()} icon={GraduationCap} color="text-blue-600"/>
        <StatCard label="Employed" value={stats?.totalEmployed?.toLocaleString()} icon={Briefcase} color="text-green-600"/>
        <StatCard
          label="Employment Rate"
          value={stats?.overallEmploymentRate != null ? `${stats.overallEmploymentRate}%` : "—"}
          icon={TrendingUp}
          color="text-amber-600"
        />
        <StatCard label="Active Programs" value={stats?.totalPrograms ?? programData.length} icon={Users} color="text-purple-600"/>
      </div>

      {/* Student Stats — visible when data is present (career advisor + admin) */}
      {stats?.totalStudents != null && (
        <>
          <div className="flex items-center gap-4 pt-1">
            <div className="flex-1 border-t border-gray-200"/>
            <h2 className="text-base font-bold text-gray-900 whitespace-nowrap">Student Overview</h2>
            <div className="flex-1 border-t border-gray-200"/>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard
              label="Total Students"
              value={stats.totalStudents.toLocaleString()}
              icon={Users}
              color="text-indigo-600"
              sub="Registered student accounts"
            />
            <StatCard
              label="Programs with Students"
              value={stats.studentsPerProgram?.length ?? "—"}
              icon={GraduationCap}
              color="text-purple-600"
            />
          </div>

          {stats.studentsPerProgram?.length > 0 && (
            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Students per Program</h2>
              <p className="text-xs text-gray-400 mb-4">Number of registered students in each program</p>
              <ResponsiveContainer width="100%" height={Math.max(220, stats.studentsPerProgram.length * 36)}>
                <BarChart
                  data={stats.studentsPerProgram}
                  layout="vertical"
                  margin={{ left: 0, right: 48, top: 4, bottom: 4 }}
                >
                  <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false}/>
                  <YAxis
                    type="category"
                    dataKey="program"
                    width={160}
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v.replace("BS ", "").replace("Bachelor of Science in ", "")}
                  />
                  <Tooltip formatter={(v) => [v, "Students"]}/>
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Students">
                    <LabelList dataKey="count" position="right" style={{ fontSize: 11, fontWeight: 700, fill: "#374151" }}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {/* Employment Trends Line Chart */}
      {trends.length > 0 && (
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Employment Rate by Graduation Year</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="year" tick={{ fontSize: 12 }}/>
              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={v => `${v}%`}/>
              <Tooltip formatter={v => [`${v}%`, "Employment Rate"]}/>
              <Legend/>
              <Line type="monotone" dataKey="employmentRate" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} name="Employment Rate (%)"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Program + Industry side-by-side */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Employed per Program */}
        {programData.length > 0 && (
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Alumni by Program</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={programData} margin={{ top: 5, right: 10, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="program" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0}/>
                <YAxis tick={{ fontSize: 11 }}/>
                <Tooltip/>
                <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} name="Alumni"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Industry Pie */}
        {industryData.length > 0 && (
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Alumni by Industry</h2>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={industryData} dataKey="count" nameKey="industry" cx="50%" cy="50%" outerRadius={80} paddingAngle={2}>
                    {industryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {industryData.slice(0, 8).map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}/>
                    <span className="truncate">{d.industry}</span>
                    <span className="ml-auto font-medium text-gray-900">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alumni per Program — vertical bar chart with count labels */}
      {(() => {
        const programStats = stats?.programStats || [];
        if (programStats.length === 0) return null;
        const COLORS = ["#2563eb","#16a34a","#9333ea","#d97706","#dc2626","#0891b2","#db2777","#65a30d"];
        return (
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Alumni per Program</h2>
            <p className="text-xs text-gray-400 mb-4">Total number of registered alumni in each department / program</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={programStats}
                margin={{ top: 28, right: 16, left: 0, bottom: 56 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="program"
                  tick={{ fontSize: 10 }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  tickFormatter={(v) => v.replace("BS ", "").replace("Bachelor of Science in ", "")}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(v, _name, props) => [`${v} alumni`, props.payload?.program]}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]} name="Alumni">
                  {programStats.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                  <LabelList
                    dataKey="total"
                    position="top"
                    style={{ fontSize: 12, fontWeight: 700, fill: "#374151" }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      })()}

      {/* Employment Trend Table */}
      {trends.length > 0 && (
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Year-by-Year Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Year</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Graduates</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Employed</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Employment Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...trends].reverse().map(row => (
                  <tr key={row.year} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{row.year}</td>
                    <td className="py-3 text-right text-gray-600">{row.total.toLocaleString()}</td>
                    <td className="py-3 text-right text-gray-600">{row.employed.toLocaleString()}</td>
                    <td className="py-3 text-right">
                      <span className={`font-semibold ${row.employmentRate >= 75 ? "text-green-600" : row.employmentRate >= 50 ? "text-amber-600" : "text-red-600"}`}>
                        {row.employmentRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Job Posting Analytics ── */}
      {jobMetrics && (
        <>
          {/* Section divider */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex-1 border-t border-gray-200"/>
            <h2 className="text-base font-bold text-gray-900 whitespace-nowrap">Job Posting Analytics</h2>
            <div className="flex-1 border-t border-gray-200"/>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Active Job Listings"
              value={jobMetrics.summary.totalActiveJobs}
              icon={Briefcase}
              color="text-blue-600"
            />
            <StatCard
              label="Total Unique Views"
              value={jobMetrics.summary.totalViews.toLocaleString()}
              icon={Eye}
              color="text-indigo-600"
              sub="Distinct users who opened a listing"
            />
            <StatCard
              label="Total Inquiries"
              value={jobMetrics.summary.totalInquiries.toLocaleString()}
              icon={Send}
              color="text-green-600"
              sub="Apply / Visit Website clicks"
            />
          </div>

          {/* Top 10 horizontal bar chart */}
          {jobMetrics.topByEngagement.some(j => j.engagement > 0) && (
            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Top 10 Listings by Engagement</h2>
              <p className="text-xs text-gray-400 mb-4">Views + inquiry clicks per listing</p>
              <ResponsiveContainer width="100%" height={jobMetrics.topByEngagement.length * 38 + 24}>
                <BarChart
                  data={jobMetrics.topByEngagement.map(j => ({
                    name: j.title.length > 26 ? j.title.slice(0, 26) + "…" : j.title,
                    Views: j.views,
                    Inquiries: j.inquiries,
                  }))}
                  layout="vertical"
                  margin={{ left: 0, right: 48, top: 0, bottom: 0 }}
                >
                  <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} axisLine={false} tickLine={false}/>
                  <Tooltip/>
                  <Legend wrapperStyle={{ fontSize: 12 }}/>
                  <Bar dataKey="Views"     stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]}/>
                  <Bar dataKey="Inquiries" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]}
                    label={{ position: "right", formatter: (_, entry) => entry?.payload?.Views + entry?.payload?.Inquiries || "", fontSize: 10, fill: "#6b7280" }}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block"/>Views</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block"/>Inquiries</span>
              </div>
            </div>
          )}

          {/* Full metrics table */}
          <div className="card">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h2 className="text-base font-semibold text-gray-900">All Active Listings — Detailed Metrics</h2>
              {/* Industry filter */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Filter size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                  <select
                    value={industryFilter}
                    onChange={e => setIndustryFilter(e.target.value)}
                    className={`pl-8 pr-8 py-1.5 text-xs rounded-lg border ${
                      industryFilter
                        ? "border-blue-400 bg-blue-50 text-blue-700 font-medium"
                        : "border-gray-200 bg-white text-gray-600"
                    } focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer`}
                  >
                    <option value="">All Industries</option>
                    {industries.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
                {industryFilter && (
                  <button
                    onClick={() => setIndustryFilter("")}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
                    title="Clear filter"
                  >
                    <X size={13}/> Clear
                  </button>
                )}
                {industryFilter && (
                  <span className="text-xs text-gray-400">
                    {sortedJobs.length} of {allJobsList.length} listings
                  </span>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Job Listing</th>
                    <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Industry</th>
                    <th
                      className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700"
                      onClick={() => handleSort("views")}
                    >
                      <Eye size={11} className="inline mr-1 mb-0.5"/>Views<SortIcon field="views"/>
                    </th>
                    <th
                      className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700"
                      onClick={() => handleSort("inquiries")}
                    >
                      <Send size={11} className="inline mr-1 mb-0.5"/>Inquiries<SortIcon field="inquiries"/>
                    </th>
                    <th
                      className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700"
                      onClick={() => handleSort("engagement")}
                    >
                      Total<SortIcon field="engagement"/>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedJobs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-gray-400 text-xs">No active job listings found.</td>
                    </tr>
                  ) : sortedJobs.map(job => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="py-3">
                        <p className="font-medium text-gray-900 truncate max-w-[200px]">{job.title}</p>
                        <p className="text-xs text-gray-400">{job.company}</p>
                      </td>
                      <td className="py-3 text-gray-500 hidden sm:table-cell text-xs">{job.industry || "—"}</td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold">
                          <Eye size={11}/>{job.views}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                          <Send size={11}/>{job.inquiries}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span className={`font-bold ${job.engagement > 0 ? "text-gray-900" : "text-gray-300"}`}>
                          {job.engagement}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
