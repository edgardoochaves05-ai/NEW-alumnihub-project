import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip
} from "recharts";
import { Sparkles, TrendingUp, Loader2, RefreshCw, ChevronRight, Target, AlertCircle } from "lucide-react";

function ConfidenceBar({ value }) {
  const pct = Math.round((value || 0) * 100);
  const color = pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-amber-400" : "bg-gray-300";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }}/>
      </div>
      <span className="text-xs font-semibold text-gray-700 w-8 text-right">{pct}%</span>
    </div>
  );
}

function PredictionCard({ prediction, index }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm">{prediction.role || prediction.title || prediction.career_path}</h3>
            {prediction.industry && <p className="text-xs text-gray-500 mt-0.5">{prediction.industry}</p>}
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">Confidence</p>
              <ConfidenceBar value={prediction.confidence || prediction.score}/>
            </div>
          </div>
        </div>
        <button onClick={() => setExpanded(v => !v)} className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-1">
          <ChevronRight size={16} className={`transition-transform ${expanded ? "rotate-90" : ""}`}/>
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          {prediction.reasoning && (
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1">Why this path?</p>
              <p className="text-xs text-gray-600 leading-relaxed">{prediction.reasoning}</p>
            </div>
          )}
          {prediction.requiredSkills?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1.5">Skills to develop</p>
              <div className="flex flex-wrap gap-1.5">
                {prediction.requiredSkills.map((s, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          )}
          {prediction.timeframe && (
            <p className="text-xs text-gray-500 flex items-center gap-1"><Target size={11}/> Estimated timeframe: {prediction.timeframe}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function CareerPredictionPage() {
  const { profile } = useAuth();
  const { profileId } = useParams();
  const targetId = profileId || profile?.id;

  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  useEffect(() => { if (targetId) fetchPredictions(); }, [targetId]);

  async function fetchPredictions() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/analytics/career-prediction/${targetId}`);
      setPredictions(data);
    } catch(err) {
      setError(err.response?.data?.error || "Failed to load career predictions.");
    } finally { setLoading(false); }
  }

  // Build radar data from skill scores if available
  const radarData = predictions?.skillScores
    ? Object.entries(predictions.skillScores).map(([skill, score]) => ({ skill, score: Math.round(score * 100) }))
    : predictions?.skillAlignment
    ? predictions.skillAlignment.map(s => ({ skill: s.skill, score: Math.round((s.match || 0) * 100) }))
    : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Career Prediction</h1>
          <p className="text-sm text-gray-500 mt-1">
            AI-powered career trajectory analysis based on peer alumni data.
          </p>
        </div>
        <button onClick={fetchPredictions} disabled={loading}
          className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""}/>Re-run Analysis
        </button>
      </div>

      {loading ? (
        <div className="card flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 size={32} className="animate-spin text-blue-600 mb-4"/>
          <p className="text-sm">Analyzing career data…</p>
        </div>
      ) : error ? (
        <div className="card flex items-center gap-3 text-red-600 py-8 justify-center">
          <AlertCircle size={20}/>
          <p className="text-sm">{error}</p>
        </div>
      ) : !predictions ? null : (
        <>
          {/* Summary Banner */}
          {predictions.summary && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <Sparkles size={18} className="text-blue-600 flex-shrink-0 mt-0.5"/>
              <p className="text-sm text-blue-800 leading-relaxed">{predictions.summary}</p>
            </div>
          )}

          {/* Radar Chart */}
          {radarData.length > 0 && (
            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-600"/>Skill Alignment
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb"/>
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "#6b7280" }}/>
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }}/>
                  <Radar name="Skill Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2}/>
                  <Tooltip formatter={v => [`${v}%`, "Score"]}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Prediction Cards */}
          {predictions.predictions?.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles size={15} className="text-blue-600"/>Predicted Career Paths
              </h2>
              {predictions.predictions.map((pred, i) => (
                <PredictionCard key={i} prediction={pred} index={i}/>
              ))}
            </div>
          )}

          {/* Peer Insights */}
          {predictions.peerInsights && (
            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Peer Insights</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{predictions.peerInsights}</p>
            </div>
          )}

          {/* No predictions fallback */}
          {!predictions.predictions?.length && !predictions.summary && (
            <div className="card text-center py-16 text-gray-400">
              <Sparkles size={36} className="mx-auto mb-3 opacity-30"/>
              <p className="text-sm">Not enough career data to generate predictions yet.</p>
              <p className="text-xs mt-1">Upload your CV and add career milestones to improve accuracy.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
