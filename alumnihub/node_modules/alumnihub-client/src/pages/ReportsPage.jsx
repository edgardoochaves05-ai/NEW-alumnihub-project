import { useEffect, useState } from "react";
import api from "../services/api";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Users, Briefcase, TrendingUp, GraduationCap, Loader2, RefreshCw } from "lucide-react";

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
  const [stats,   setStats]   = useState(null);
  const [trends,  setTrends]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [statsRes, trendsRes] = await Promise.all([
        api.get("/analytics/dashboard"),
        api.get("/analytics/employment-trends"),
      ]);
      setStats(statsRes.data);
      setTrends(trendsRes.data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

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

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Alumni" value={stats?.totalAlumni?.toLocaleString()} icon={GraduationCap} color="text-blue-600"/>
        <StatCard label="Employed" value={stats?.employedAlumni?.toLocaleString()} icon={Briefcase} color="text-green-600"/>
        <StatCard
          label="Employment Rate"
          value={stats?.totalAlumni ? `${Math.round((stats.employedAlumni / stats.totalAlumni) * 100)}%` : "—"}
          icon={TrendingUp}
          color="text-amber-600"
        />
        <StatCard label="Active Programs" value={stats?.totalPrograms ?? programData.length} icon={Users} color="text-purple-600"/>
      </div>

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
    </div>
  );
}
