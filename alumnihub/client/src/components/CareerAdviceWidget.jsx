import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lightbulb, X, Loader2, FileText, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import api from "../services/api";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";

// ── helpers ─────────────────────────────────────────────────────────────────

function ItemIcon({ kind }) {
  return kind === "note"
    ? <FileText size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
    : <Star     size={14} className="text-blue-500  flex-shrink-0 mt-0.5" />;
}

function kindLabel(kind) {
  return kind === "note" ? "Note" : "Recommendation";
}

function previewText(item) {
  return item.kind === "note"
    ? item.content
    : item.description || item.title;
}

// ── widget ───────────────────────────────────────────────────────────────────

export default function CareerAdviceWidget() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [open,        setOpen]        = useState(false);
  const [unread,      setUnread]      = useState(0);
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  // Fixed-position coordinates for the popover
  const [panelPos,    setPanelPos]    = useState({ top: 0, right: 0 });

  const btnRef   = useRef(null);
  const panelRef = useRef(null);

  // ── initial unread count ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    api.get("/advice/unread-count")
      .then(({ data }) => setUnread(data.count ?? 0))
      .catch(() => {});
  }, [user]);

  // ── realtime: new note or recommendation inserted for this student ────────
  useEffect(() => {
    if (!user) return;

    const handleInsert = () => {
      // If panel is open we'll re-fetch anyway; otherwise just bump the badge
      setUnread((n) => n + 1);
    };

    const notesChannel = supabase
      .channel("advice-notes-widget")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "advisor_notes",
        filter: `student_id=eq.${user.id}`,
      }, handleInsert)
      .subscribe();

    const recsChannel = supabase
      .channel("advice-recs-widget")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "advisor_recommendations",
        filter: `student_id=eq.${user.id}`,
      }, handleInsert)
      .subscribe();

    return () => {
      supabase.removeChannel(notesChannel);
      supabase.removeChannel(recsChannel);
    };
  }, [user]);

  // ── close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e) {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        btnRef.current  && !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  // ── toggle open ───────────────────────────────────────────────────────────
  const handleOpen = useCallback(async () => {
    if (open) { setOpen(false); return; }

    // Compute fixed position from button bounds
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      setPanelPos({
        top:   rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }

    setOpen(true);
    setLoading(true);

    try {
      const { data } = await api.get("/advice");
      setItems(Array.isArray(data) ? data.slice(0, 5) : []);
      // Mark all as read
      await api.patch("/advice/mark-read");
      setUnread(0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [open]);

  // ── navigate to full page ─────────────────────────────────────────────────
  function handleItemClick() {
    setOpen(false);
    navigate("/career-advice");
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Trigger button */}
      <button
        ref={btnRef}
        onClick={handleOpen}
        aria-label="Career advice notifications"
        className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors flex-shrink-0"
      >
        <Lightbulb size={18} className="text-amber-600" />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Popover — rendered via fixed position so it's never clipped by the
          parent's overflow-y-auto scroll container */}
      {open && (
        <div
          ref={panelRef}
          style={{ position: "fixed", top: panelPos.top, right: panelPos.right, zIndex: 9999 }}
          className="w-80 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
            <div className="flex items-center gap-2">
              <Lightbulb size={15} className="text-amber-500" />
              <span className="text-sm font-semibold text-gray-900">Career Advice</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={22} className="animate-spin text-blue-500" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <Lightbulb size={30} className="text-gray-200 mb-2" />
              <p className="text-sm font-medium text-gray-500">No advice yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Your career advisor will send notes and recommendations here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <button
                  key={`${item.kind}-${item.id}`}
                  onClick={handleItemClick}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex gap-3"
                >
                  <ItemIcon kind={item.kind} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        item.kind === "note"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {kindLabel(item.kind)}
                      </span>
                      {item.kind === "recommendation" && item.title && (
                        <span className="text-xs font-medium text-gray-800 truncate">{item.title}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {previewText(item)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {item.advisor
                        ? `${item.advisor.first_name} ${item.advisor.last_name} · `
                        : ""}
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Footer */}
          {items.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
              <button
                onClick={handleItemClick}
                className="text-xs text-blue-600 font-medium hover:underline w-full text-center"
              >
                View all advice →
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
