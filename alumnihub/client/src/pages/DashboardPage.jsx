import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  Users, Briefcase, TrendingUp, GraduationCap,
  Mail, Bell, ChevronRight, Award, BookOpen,
  ArrowUpRight, Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = "blue", to }) {
  const colors = {
    blue:   { bg: "bg-blue-50",   icon: "text-blue-600",   ring: "ring-blue-100" },
    green:  { bg: "bg-green-50",  icon: "text-green-600",  ring: "ring-green-100" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600", ring: "ring-purple-100" },
    amber:  { bg: "bg-amber-50",  icon: "text-amber-600",  ring: "ring-amber-100" },
  };
  const c = colors[color];
  const inner = (
    <div className="card flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl ${c.bg} ring-1 ${c.ring} flex items-center justify-center flex-shrink-0`}>
        <Icon size={22} className={c.icon} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {to && <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />}
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

// ── Profile Completion ──────────────────────────────────────────
function computeCompletion(profile) {
  if (!profile) return 0;
  const fields = [
    "first_name", "last_name", "phone", "bio",
    "program", "graduation_year", "current_job_title", "current_company",
    "industry", "skills", "avatar_url", "linkedin_url",
  ];
  const filled = fields.filter((f) => {
    const v = profile[f];
    return v && (Array.isArray(v) ? v.length > 0 : true);
  });
  return Math.round((filled.length / fields.length) * 100);
}

// ── Alumni Dashboard ────────────────────────────────────────────
function AlumniDashboard({ profile }) {
  const [data, setData] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/analytics/alumni-dashboard"),
      api.get("/jobs?limit=5"),
    ])
      .then(([dashRes, jobsRes]) => {
        setData(dashRes.data);
        setRecentJobs(jobsRes.data.jobs || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const completion = computeCompletion(profile);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.first_name || "Alumni"}!
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Here's what's happening in your network.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Briefcase}
          label="Jobs Available"
          value={data?.totalJobs ?? "—"}
          sub="Active listings"
          color="blue"
          to="/jobs"
        />
        <StatCard
          icon={Mail}
          label="Unread Messages"
          value={data?.unreadMessages ?? 0}
          sub="In your inbox"
          color="purple"
          to="/messages"
        />
        <StatCard
          icon={Award}
          label="Profile Completion"
          value={`${completion}%`}
          sub={completion < 100 ? "Complete your profile" : "Profile complete!"}
          color={completion >= 80 ? "green" : "amber"}
          to="/profile"
        />
      </div>

      {/* Profile completion bar */}
      {completion < 100 && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Complete your profile to unlock better job matches</p>
            <span className="text-sm font-bold text-blue-600">{completion}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
          <Link to="/profile" className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 font-medium hover:underline">
            Update profile <ArrowUpRight size={14} />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Job Listings */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Jobs</h2>
            <Link to="/jobs" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          {recentJobs.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No jobs posted yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentJobs.map((job) => (
                <div key={job.id} className="py-3 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Briefcase size={16} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                    <p className="text-xs text-gray-500">{job.company} · {job.location || "Remote"}</p>
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                      {job.job_type}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Announcements */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Announcements</h2>
            <Bell size={16} className="text-gray-400" />
          </div>
          {!data?.announcements?.length ? (
            <p className="text-gray-400 text-sm text-center py-6">No announcements yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.announcements.map((a) => (
                <div key={a.id} className="py-3">
                  <p className="text-sm font-medium text-gray-900">{a.title}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Job Matches */}
      {data?.topMatches?.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">AI Job Matches</h2>
              <p className="text-xs text-gray-500 mt-0.5">Ranked by compatibility with your profile</p>
            </div>
            <Link to="/jobs" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {data.topMatches.map(({ match_score, job_listings: job }) => (
              <div key={job.id} className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {Math.round(match_score)}% match
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                <p className="text-xs text-gray-500 truncate">{job.company}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Faculty / Admin Dashboard ──────────────────────────────────
const CHART_COLORS = ["#2563eb", "#16a34a", "#9333ea", "#d97706", "#dc2626"];

function FacultyAdminDashboard({ profile }) {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/analytics/dashboard"),
      api.get("/analytics/employment-trends"),
      api.get("/jobs?limit=1"), // just to confirm connectivity
    ])
      .then(([statsRes, trendsRes]) => {
        setStats(statsRes.data);
        setTrends(trendsRes.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Fetch announcements directly via supabase client
    import("../services/supabase").then(({ supabase }) => {
      supabase
        .from("announcements")
        .select("id, title, content, created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(4)
        .then(({ data }) => setAnnouncements(data || []));
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-blue-600" />
      </div>
    );
  }

  const topPrograms = (stats?.programStats || []).slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm capitalize">
          {profile?.role} overview · {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}        label="Total Alumni"      value={stats?.totalAlumni ?? "—"}             color="blue"   to="/alumni" />
        <StatCard icon={Briefcase}    label="Employed"          value={stats?.totalEmployed ?? "—"}           color="green"  sub={`of ${stats?.totalAlumni ?? "?"} alumni`} />
        <StatCard icon={TrendingUp}   label="Employment Rate"   value={`${stats?.overallEmploymentRate ?? 0}%`} color="purple" />
        <StatCard icon={BookOpen}     label="Programs"          value={stats?.totalPrograms ?? "—"}           color="amber"  to="/curriculum-impact" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employment Trend */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-1">Employment Trend by Year</h2>
          <p className="text-xs text-gray-500 mb-4">Employed alumni per graduation cohort</p>
          {trends.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              No graduation data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trends} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val, name) =>
                    name === "employmentRate" ? [`${val}%`, "Employment Rate"] : [val, name === "employed" ? "Employed" : "Total"]
                  }
                />
                <Line type="monotone" dataKey="employed"       stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="employed" />
                <Line type="monotone" dataKey="employmentRate" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" name="employmentRate" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Program Employment Rate */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-1">Employment Rate by Program</h2>
          <p className="text-xs text-gray-500 mb-4">Top programs ranked by employment outcome</p>
          {topPrograms.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              No program data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topPrograms} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="program"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.replace("BS ", "").replace("Bachelor of Science in ", "")}
                />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                <Tooltip formatter={(v) => [`${v}%`, "Employment Rate"]} />
                <Bar dataKey="employmentRate" radius={[4, 4, 0, 0]}>
                  {topPrograms.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Program table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Programs Overview</h2>
            <Link to="/curriculum-impact" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Full report <ChevronRight size={14} />
            </Link>
          </div>
          {topPrograms.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No program data yet. Alumni profiles need graduation year and program filled in.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-xs font-medium text-gray-500">Program</th>
                    <th className="text-right py-2 text-xs font-medium text-gray-500">Alumni</th>
                    <th className="text-right py-2 text-xs font-medium text-gray-500">Employed</th>
                    <th className="text-right py-2 text-xs font-medium text-gray-500">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topPrograms.map((p) => (
                    <tr key={p.program} className="hover:bg-gray-50">
                      <td className="py-2.5 text-gray-800 max-w-[180px] truncate">{p.program}</td>
                      <td className="py-2.5 text-right text-gray-600">{p.total}</td>
                      <td className="py-2.5 text-right text-gray-600">{p.employed}</td>
                      <td className="py-2.5 text-right">
                        <span className={`font-semibold ${p.employmentRate >= 70 ? "text-green-600" : p.employmentRate >= 40 ? "text-amber-600" : "text-red-500"}`}>
                          {p.employmentRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Announcements */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Announcements</h2>
            <Bell size={16} className="text-gray-400" />
          </div>
          {announcements.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No announcements yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {announcements.map((a) => (
                <div key={a.id} className="py-3">
                  <p className="text-sm font-medium text-gray-900">{a.title}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Export ────────────────────────────────────────────────
export default function DashboardPage() {
  const { profile, isAlumni } = useAuth();

  if (isAlumni) return <AlumniDashboard profile={profile} />;
  return <FacultyAdminDashboard profile={profile} />;
}
