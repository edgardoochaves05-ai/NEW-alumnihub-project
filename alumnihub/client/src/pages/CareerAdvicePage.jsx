import { useEffect, useState } from "react";
import { Lightbulb, FileText, Star, ExternalLink, Loader2, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import api from "../services/api";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";

// ── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  { key: "all",            label: "All" },
  { key: "recommendation", label: "Recommendations" },
  { key: "note",           label: "Notes" },
];

// ── Item card ────────────────────────────────────────────────────────────────

function AdviceCard({ item }) {
  const isNote = item.kind === "note";
  const advisor = item.advisor;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* Kind icon */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isNote ? "bg-amber-50 border border-amber-200" : "bg-blue-50 border border-blue-200"
        }`}>
          {isNote
            ? <FileText size={16} className="text-amber-600" />
            : <Star     size={16} className="text-blue-600"  />}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              isNote
                ? "bg-amber-100 text-amber-700"
                : "bg-blue-100 text-blue-700"
            }`}>
              {isNote ? "Private Note" : "Recommendation"}
            </span>
            {!isNote && item.title && (
              <span className="text-sm font-semibold text-gray-900">{item.title}</span>
            )}
          </div>

          {/* Content */}
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {isNote ? item.content : (item.description || item.title)}
          </p>

          {/* URL link for recommendations */}
          {!isNote && item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:underline font-medium"
            >
              <ExternalLink size={11} /> Open resource
            </a>
          )}

          {/* Footer: advisor + time */}
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

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ tab }) {
  const messages = {
    all:            "Your career advisor hasn't sent any advice yet.",
    note:           "No private notes from your advisor yet.",
    recommendation: "No recommendations from your advisor yet.",
  };
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Inbox size={40} className="text-gray-200 mb-3" />
      <p className="text-sm font-medium text-gray-500">{messages[tab]}</p>
      <p className="text-xs text-gray-400 mt-1">
        Check back later — your advisor will send guidance here.
      </p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CareerAdvicePage() {
  const { user } = useAuth();

  const [allItems, setAllItems] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("all");

  // Fetch + mark read on load
  useEffect(() => {
    if (!user) return;

    api.get("/advice")
      .then(({ data }) => setAllItems(Array.isArray(data) ? data : []))
      .catch(() => setAllItems([]))
      .finally(() => {
        setLoading(false);
        // Mark read independently so a failure here never blocks the page render
        api.patch("/advice/mark-read").catch(() => {});
      });
  }, [user]);

  // Realtime: prepend new items live
  useEffect(() => {
    if (!user) return;

    async function handleInsert(payload, kind) {
      // Fetch the full item with advisor join so the card renders correctly
      try {
        const { data } = await api.get("/advice");
        if (Array.isArray(data)) setAllItems(data);
      } catch { /* non-critical */ }
    }

    const notesChannel = supabase
      .channel("advice-page-notes")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "advisor_notes",
        filter: `student_id=eq.${user.id}`,
      }, (p) => handleInsert(p, "note"))
      .subscribe();

    const recsChannel = supabase
      .channel("advice-page-recs")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "advisor_recommendations",
        filter: `student_id=eq.${user.id}`,
      }, (p) => handleInsert(p, "recommendation"))
      .subscribe();

    return () => {
      supabase.removeChannel(notesChannel);
      supabase.removeChannel(recsChannel);
    };
  }, [user]);

  const filtered =
    tab === "all" ? allItems : allItems.filter((i) => i.kind === tab);

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
          Guidance, notes, and recommendations from your career advisor.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
            {key !== "all" && (
              <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                tab === key ? "bg-gray-100 text-gray-600" : "bg-gray-200 text-gray-500"
              }`}>
                {allItems.filter((i) => i.kind === key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <AdviceCard key={`${item.kind}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
