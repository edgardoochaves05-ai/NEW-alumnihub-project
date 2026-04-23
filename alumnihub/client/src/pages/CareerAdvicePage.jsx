import { useEffect, useState } from "react";
import { Lightbulb, Star, ExternalLink, Loader2, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import api from "../services/api";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";

// ── Item card ────────────────────────────────────────────────────────────────

function AdviceCard({ item }) {
  const advisor = item.advisor;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-50 border border-blue-200">
          <Star size={16} className="text-blue-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              Recommendation
            </span>
            {item.title && (
              <span className="text-sm font-semibold text-gray-900">{item.title}</span>
            )}
          </div>

          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {item.description || item.title}
          </p>

          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:underline font-medium"
            >
              <ExternalLink size={11} /> Open resource
            </a>
          )}

          <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
            {advisor && (
              <>
                <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-600 flex-shrink-0">
                  {advisor.first_name?.[0] ?? "A"}
                </div>
                <span className="text-gray-500 font-medium">
                  {advisor.first_name} {advisor.last_name}
                </span>
                <span>·</span>
              </>
            )}
            <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CareerAdvicePage() {
  const { user } = useAuth();

  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    api.get("/advice")
      .then(({ data }) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => {
        setLoading(false);
        api.patch("/advice/mark-read").catch(() => {});
      });
  }, [user]);

  // Realtime: refresh list when advisor sends a new recommendation
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("advice-page-recs")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "advisor_recommendations",
        filter: `student_id=eq.${user.id}`,
      }, () => {
        api.get("/advice")
          .then(({ data }) => { if (Array.isArray(data)) setItems(data); })
          .catch(() => {});
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb size={20} className="text-amber-500" />
          <h1 className="text-2xl font-bold text-gray-900">Career Advice</h1>
        </div>
        <p className="text-sm text-gray-500">
          Recommendations from your career advisor.
        </p>
      </div>

      {/* Feed */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox size={40} className="text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-500">No recommendations yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Check back later — your advisor will send guidance here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <AdviceCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
