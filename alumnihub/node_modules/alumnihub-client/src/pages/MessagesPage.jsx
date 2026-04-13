import { useEffect, useState, useRef, useCallback } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import {
  Search, Send, Loader2, MessageSquare, Filter, X, ChevronDown, Lock
} from "lucide-react";

const PROGRAMS = [
  "BS Information Systems",
  "BS Information Technology",
  "BS Computer Science",
  "BS Computer Engineering",
  "Other",
];

function formatMsgTime(ts) {
  const d = new Date(ts);
  if (isToday(d))     return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

function formatSectionDate(ts) {
  const d = new Date(ts);
  if (isToday(d))     return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM d, yyyy");
}

function ConversationItem({ conv, active, onClick }) {
  const { profile } = useAuth();
  const other = conv.other_participant;
  const name  = other ? `${other.first_name} ${other.last_name}` : "Unknown";
  const initials = [other?.first_name?.[0], other?.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?";

  return (
    <button
      onClick={() => onClick(conv)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${active ? "bg-blue-50 border-l-2 border-l-blue-600" : ""}`}
    >
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
          {other?.avatar_url
            ? <img src={other.avatar_url} className="w-10 h-10 rounded-full object-cover" alt=""/>
            : initials}
        </div>
        {conv.unread_count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-medium">
            {conv.unread_count > 9 ? "9+" : conv.unread_count}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate ${conv.unread_count > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-800"}`}>{name}</p>
          {conv.last_message_at && (
            <span className="text-xs text-gray-400 flex-shrink-0">{formatMsgTime(conv.last_message_at)}</span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">{conv.last_message || <span className="italic">No messages yet</span>}</p>
      </div>
    </button>
  );
}

function MessageBubble({ msg, isMine }) {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMine ? "bg-blue-600 text-white rounded-br-sm" : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"}`}>
        <p>{msg.content}</p>
        <p className={`text-xs mt-1 ${isMine ? "text-blue-200" : "text-gray-400"}`}>
          {format(new Date(msg.created_at), "h:mm a")}
        </p>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv]       = useState(null);
  const [messages, setMessages]           = useState([]);
  const [msgText, setMsgText]             = useState("");
  const [loadingConvs, setLoadingConvs]   = useState(true);
  const [loadingMsgs, setLoadingMsgs]     = useState(false);
  const [sending, setSending]             = useState(false);
  const [search, setSearch]               = useState("");
  const [program, setProgram]             = useState("");
  const [unreadOnly, setUnreadOnly]       = useState(false);
  const [showFilters, setShowFilters]     = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef        = useRef(null);
  const debounceRef    = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchConversations, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, program, unreadOnly]);

  async function fetchConversations() {
    setLoadingConvs(true);
    try {
      const params = new URLSearchParams();
      if (search)     params.set("search", search);
      if (program)    params.set("program", program);
      if (unreadOnly) params.set("unread_only", "true");
      const { data } = await api.get(`/messages/conversations?${params}`);
      setConversations(data);
    } catch(e) { console.error(e); }
    finally { setLoadingConvs(false); }
  }

  const fetchMessages = useCallback(async (convId, silent = false) => {
    if (!silent) setLoadingMsgs(true);
    try {
      const { data } = await api.get(`/messages/${convId}`);
      setMessages(data);
    } catch(e) { console.error(e); }
    finally { if (!silent) setLoadingMsgs(false); }
  }, []);

  useEffect(() => {
    if (!activeConv) { clearInterval(pollRef.current); return; }
    fetchMessages(activeConv.id);
    pollRef.current = setInterval(() => fetchMessages(activeConv.id, true), 5000);
    return () => clearInterval(pollRef.current);
  }, [activeConv?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSelectConv(conv) {
    setActiveConv(conv);
    // Mark as read by updating locally
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c));
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!msgText.trim() || !activeConv) return;
    setSending(true);
    const text = msgText.trim();
    setMsgText("");
    try {
      const { data } = await api.post("/messages", { conversation_id: activeConv.id, content: text });
      setMessages(prev => [...prev, data]);
      setConversations(prev => prev.map(c => c.id === activeConv.id
        ? { ...c, last_message: text, last_message_at: data.created_at }
        : c));
    } catch(e) { console.error(e); setMsgText(text); }
    finally { setSending(false); }
  }

  // Group messages by date for section headers
  function groupedMessages() {
    const groups = [];
    let lastDate = null;
    for (const msg of messages) {
      const dateLabel = formatSectionDate(msg.created_at);
      if (dateLabel !== lastDate) { groups.push({ type: "date", label: dateLabel, id: `d-${msg.id}` }); lastDate = dateLabel; }
      groups.push({ type: "msg", msg });
    }
    return groups;
  }

  const activeParticipant = activeConv?.other_participant;
  const activeName = activeParticipant ? `${activeParticipant.first_name} ${activeParticipant.last_name}` : "";
  const activeFiltersCount = [program, unreadOnly].filter(Boolean).length;

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-96 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-gray-200">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Messages</h2>
            <button onClick={() => setShowFilters(v => !v)}
              className={`p-1.5 rounded-lg transition-colors text-sm ${showFilters || activeFiltersCount > 0 ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}>
              <Filter size={14}/>
            </button>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full text-sm pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Search conversations…"/>
          </div>
          {showFilters && (
            <div className="space-y-2">
              <select value={program} onChange={e => setProgram(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-blue-500">
                <option value="">All Programs</option>
                {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input type="checkbox" checked={unreadOnly} onChange={e => setUnreadOnly(e.target.checked)} className="rounded"/>
                Unread only
              </label>
            </div>
          )}
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex items-center justify-center h-24"><Loader2 size={18} className="animate-spin text-blue-600"/></div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 text-gray-400 px-4">
              <MessageSquare size={28} className="mx-auto mb-2 opacity-40"/>
              <p className="text-xs">No conversations yet.</p>
            </div>
          ) : (
            conversations.map(conv => (
              <ConversationItem key={conv.id} conv={conv} active={activeConv?.id === conv.id} onClick={handleSelectConv}/>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {activeConv ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-white">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {activeParticipant?.avatar_url
                ? <img src={activeParticipant.avatar_url} className="w-9 h-9 rounded-full object-cover" alt=""/>
                : [activeParticipant?.first_name?.[0], activeParticipant?.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?"}
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">{activeName}</p>
              {activeParticipant?.program && <p className="text-xs text-gray-500">{activeParticipant.program}</p>}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50">
            {loadingMsgs ? (
              <div className="flex items-center justify-center h-32"><Loader2 size={20} className="animate-spin text-blue-600"/></div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <MessageSquare size={28} className="mx-auto mb-2 opacity-40"/>
                <p className="text-xs">No messages yet. Say hello!</p>
              </div>
            ) : (
              groupedMessages().map((item, idx) =>
                item.type === "date" ? (
                  <div key={item.id} className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-200"/>
                    <span className="text-xs text-gray-400 font-medium">{item.label}</span>
                    <div className="flex-1 h-px bg-gray-200"/>
                  </div>
                ) : (
                  <MessageBubble key={item.msg.id} msg={item.msg} isMine={item.msg.sender_id === profile?.id}/>
                )
              )
            )}
            <div ref={messagesEndRef}/>
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="flex items-end gap-3 px-5 py-4 border-t border-gray-100 bg-white">
            <textarea
              value={msgText}
              onChange={e => setMsgText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
              className="flex-1 resize-none text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 max-h-32"
              rows={1}
              placeholder="Type a message… (Enter to send)"
            />
            <button type="submit" disabled={!msgText.trim() || sending}
              className="btn-primary p-2.5 rounded-xl flex-shrink-0 disabled:opacity-50">
              {sending ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <MessageSquare size={40} className="mx-auto mb-3 opacity-30"/>
            <p className="text-sm">Select a conversation to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
}
