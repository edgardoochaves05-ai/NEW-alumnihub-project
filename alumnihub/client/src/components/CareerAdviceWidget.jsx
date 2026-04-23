import { useEffect, useRef, useState } from "react";
import { Lightbulb, X, Send, Loader2, ChevronLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import api from "../services/api";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";

// ── helpers ────────────────────────────────────────────────────────────────

function isAdvisor(role) {
  return role === "career_advisor" || role === "faculty";
}

// ── Thread view ─────────────────────────────────────────────────────────────

function ThreadView({ conversation, currentUserId, onBack, onNewMessage }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/messages/${conversation.id}`)
      .then(({ data }) => setMessages(Array.isArray(data) ? data : []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [conversation.id]);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime: append new messages live
  useEffect(() => {
    const channel = supabase
      .channel(`advice-thread-${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const msg = payload.new;
          setMessages((prev) => {
            // Avoid duplicates (optimistic insert may already be there)
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          // Notify parent so it can clear the badge for this conversation
          if (msg.sender_id !== currentUserId) onNewMessage(conversation.id);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [conversation.id, currentUserId, onNewMessage]);

  async function handleSend(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    setSending(true);
    setError("");
    setText("");

    // Optimistic insert
    const optimistic = {
      id: `optimistic-${Date.now()}`,
      conversation_id: conversation.id,
      sender_id: currentUserId,
      content: trimmed,
      created_at: new Date().toISOString(),
      is_read: false,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      await api.post("/messages", {
        conversationId: conversation.id,
        content: trimmed,
      });
    } catch {
      // Roll back optimistic insert and show error
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setText(trimmed);
      setError("Failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const advisor = conversation.other_participant;

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-gray-600 mr-1"
            aria-label="Back"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
          {advisor?.first_name?.[0] ?? "A"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {advisor ? `${advisor.first_name} ${advisor.last_name}` : "Career Advisor"}
          </p>
          <p className="text-xs text-blue-600">Career Advisor</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={20} className="animate-spin text-blue-500" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">
            No messages yet. Your advisor will reach out soon.
          </p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    isMine
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}
                >
                  <p>{msg.content}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      isMine ? "text-blue-200" : "text-gray-400"
                    }`}
                  >
                    {formatDistanceToNow(new Date(msg.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 px-4 pb-1 flex-shrink-0">{error}</p>
      )}

      {/* Reply input */}
      <form
        onSubmit={handleSend}
        className="flex items-end gap-2 px-4 py-3 border-t border-gray-100 flex-shrink-0"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
          rows={1}
          placeholder="Reply to your advisor…"
          className="flex-1 resize-none text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
          style={{ maxHeight: "80px" }}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 flex items-center justify-center transition-colors"
          aria-label="Send"
        >
          {sending ? (
            <Loader2 size={13} className="animate-spin text-white" />
          ) : (
            <Send size={13} className={text.trim() ? "text-white" : "text-gray-400"} />
          )}
        </button>
      </form>
    </div>
  );
}

// ── Conversation list (multiple advisors) ───────────────────────────────────

function ConversationList({ conversations, onSelect }) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 text-center py-8">
        <Lightbulb size={32} className="text-gray-200 mb-3" />
        <p className="text-sm font-medium text-gray-500">No advice yet</p>
        <p className="text-xs text-gray-400 mt-1">
          Your career advisor will reach out to you here.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 overflow-y-auto flex-1">
      {conversations.map((conv) => {
        const advisor = conv.other_participant;
        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 flex-shrink-0">
              {advisor?.first_name?.[0] ?? "A"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {advisor
                    ? `${advisor.first_name} ${advisor.last_name}`
                    : "Career Advisor"}
                </p>
                {conv.unread_count > 0 && (
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {conv.unread_count > 9 ? "9+" : conv.unread_count}
                  </span>
                )}
              </div>
              {conv.last_message && (
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {conv.last_message}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Main widget ─────────────────────────────────────────────────────────────

export default function CareerAdviceWidget() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [advisorConvs, setAdvisorConvs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedConv, setSelectedConv] = useState(null);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const panelRef = useRef(null);

  // Load advisor conversations
  useEffect(() => {
    if (!profile) return;

    api.get("/messages/conversations")
      .then(({ data }) => {
        const convs = Array.isArray(data) ? data : [];
        const advisorOnly = convs.filter((c) =>
          isAdvisor(c.other_participant?.role)
        );
        setAdvisorConvs(advisorOnly);
        setUnreadCount(advisorOnly.reduce((sum, c) => sum + (c.unread_count || 0), 0));

        // Auto-select if there's exactly one advisor conversation
        if (advisorOnly.length === 1) setSelectedConv(advisorOnly[0]);
      })
      .catch(() => {})
      .finally(() => setLoadingConvs(false));
  }, [profile]);

  // Realtime: watch for new messages in any advisor conversation
  useEffect(() => {
    if (!advisorConvs.length || !user?.id) return;

    const channels = advisorConvs.map((conv) =>
      supabase
        .channel(`advice-badge-${conv.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conv.id}`,
          },
          (payload) => {
            const msg = payload.new;
            // Only count messages from the advisor (not our own sends)
            if (msg.sender_id === user.id) return;
            // Don't increment badge if the panel for this thread is already open
            if (open && selectedConv?.id === conv.id) return;
            setUnreadCount((n) => n + 1);
            setAdvisorConvs((prev) =>
              prev.map((c) =>
                c.id === conv.id
                  ? {
                      ...c,
                      unread_count: (c.unread_count || 0) + 1,
                      last_message: msg.content,
                    }
                  : c
              )
            );
          }
        )
        .subscribe()
    );

    return () => channels.forEach((ch) => supabase.removeChannel(ch));
  }, [advisorConvs, user?.id, open, selectedConv?.id]);

  // Close popover on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // When thread is opened, clear its unread count locally
  function handleSelectConv(conv) {
    setSelectedConv(conv);
    setAdvisorConvs((prev) =>
      prev.map((c) =>
        c.id === conv.id ? { ...c, unread_count: 0 } : c
      )
    );
    setUnreadCount((prev) =>
      Math.max(0, prev - (conv.unread_count || 0))
    );
  }

  // Called by ThreadView when a realtime message arrives while thread is open
  function handleNewMessage(convId) {
    if (selectedConv?.id === convId) return; // thread is open, already visible
    setUnreadCount((n) => n + 1);
  }

  function toggleOpen() {
    setOpen((v) => !v);
    // If opening and only one advisor, auto-navigate to thread
    if (!open && advisorConvs.length === 1 && !selectedConv) {
      handleSelectConv(advisorConvs[0]);
    }
  }

  const showBack = selectedConv && advisorConvs.length > 1;

  return (
    <div className="relative flex-shrink-0" ref={panelRef}>
      {/* Icon trigger */}
      <button
        onClick={toggleOpen}
        className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
        aria-label="Career advice"
      >
        <Lightbulb size={18} className="text-amber-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover panel */}
      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 h-96 bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0 bg-gradient-to-r from-amber-50 to-white">
            <div className="flex items-center gap-2">
              <Lightbulb size={15} className="text-amber-500" />
              <span className="text-sm font-semibold text-gray-900">
                Career Advice
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          {loadingConvs ? (
            <div className="flex items-center justify-center flex-1">
              <Loader2 size={22} className="animate-spin text-blue-500" />
            </div>
          ) : selectedConv ? (
            <ThreadView
              conversation={selectedConv}
              currentUserId={user?.id}
              onBack={showBack ? () => setSelectedConv(null) : null}
              onNewMessage={handleNewMessage}
            />
          ) : (
            <ConversationList
              conversations={advisorConvs}
              onSelect={handleSelectConv}
            />
          )}
        </div>
      )}
    </div>
  );
}
