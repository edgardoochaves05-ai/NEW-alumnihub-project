import { useEffect, useState, useRef, useCallback } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import {
  Search, Send, Loader2, MessageSquare, Filter, X,
  Inbox, CheckCircle, XCircle, MailQuestion,
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

const REQ_STATUS = {
  pending:  { cls: "bg-amber-50 text-amber-700",  label: "Pending" },
  accepted: { cls: "bg-green-50 text-green-700",  label: "Accepted" },
  declined: { cls: "bg-red-50 text-red-600",      label: "Declined" },
};

// ── Conversation list item ──────────────────────────────────────
function ConversationItem({ conv, active, onClick }) {
  const other    = conv.other_participant;
  const name     = other ? `${other.first_name} ${other.last_name}` : "Unknown";
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

// ── Compact request card (sidebar) ─────────────────────────────
function SidebarRequestItem({ req, type, onAccept, onDecline, processing }) {
  const person   = type === "incoming" ? req.sender : req.recipient;
  const name     = person ? `${person.first_name} ${person.last_name}` : "Unknown";
  const initials = [person?.first_name?.[0], person?.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?";
  const status   = REQ_STATUS[req.status] || REQ_STATUS.pending;

  return (
    <div className="px-4 py-3 border-b border-gray-100">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
          {person?.avatar_url
            ? <img src={person.avatar_url} className="w-8 h-8 rounded-full object-cover" alt=""/>
            : initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${status.cls}`}>
              {status.label}
            </span>
          </div>
          {person?.program && <p className="text-xs text-gray-400 truncate">{person.program}</p>}
          {req.message && (
            <p className="text-xs text-gray-500 mt-1 italic line-clamp-2">"{req.message}"</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
      {type === "incoming" && req.status === "pending" && (
        <div className="flex gap-2 mt-2.5">
          <button onClick={() => onDecline(req.id)} disabled={processing === req.id}
            className="flex-1 text-xs py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1 disabled:opacity-50">
            {processing === req.id ? <Loader2 size={10} className="animate-spin"/> : <XCircle size={11}/>} Decline
          </button>
          <button onClick={() => onAccept(req.id)} disabled={processing === req.id}
            className="flex-1 text-xs py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 disabled:opacity-50">
            {processing === req.id ? <Loader2 size={10} className="animate-spin"/> : <CheckCircle size={11}/>} Accept
          </button>
        </div>
      )}
    </div>
  );
}

// ── Message bubble ──────────────────────────────────────────────
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

// ── Main page ───────────────────────────────────────────────────
export default function MessagesPage() {
  const { profile } = useAuth();

  // Conversations
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

  // Requests
  const [sidebarTab, setSidebarTab]       = useState("messages");
  const [incoming, setIncoming]           = useState([]);
  const [outgoing, setOutgoing]           = useState([]);
  const [loadingReqs, setLoadingReqs]     = useState(false);
  const [requestsTab, setRequestsTab]     = useState("incoming");
  const [processingReq, setProcessingReq] = useState(null);

  const messagesEndRef = useRef(null);
  const pollRef        = useRef(null);
  const debounceRef    = useRef(null);

  // Conversations: reload on filter changes
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchConversations, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, program, unreadOnly]);

  // Requests: load once on mount
  useEffect(() => {
    fetchRequests();
  }, []);

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

  async function fetchRequests() {
    setLoadingReqs(true);
    try {
      const [inc, out] = await Promise.all([
        api.get("/message-requests/incoming"),
        api.get("/message-requests/outgoing"),
      ]);
      setIncoming(inc.data);
      setOutgoing(out.data);
    } catch(e) { console.error(e); }
    finally { setLoadingReqs(false); }
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

  async function handleAcceptRequest(id) {
    setProcessingReq(id);
    try {
      await api.patch(`/message-requests/${id}/accept`);
      setIncoming(prev => prev.map(r => r.id === id ? { ...r, status: "accepted" } : r));
      fetchConversations(); // a new conversation was just created
    } catch(e) { console.error(e); }
    finally { setProcessingReq(null); }
  }

  async function handleDeclineRequest(id) {
    setProcessingReq(id);
    try {
      await api.patch(`/message-requests/${id}/decline`);
      setIncoming(prev => prev.map(r => r.id === id ? { ...r, status: "declined" } : r));
    } catch(e) { console.error(e); }
    finally { setProcessingReq(null); }
  }

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

  const activeParticipant  = activeConv?.other_participant;
  const activeName         = activeParticipant ? `${activeParticipant.first_name} ${activeParticipant.last_name}` : "";
  const activeFiltersCount = [program, unreadOnly].filter(Boolean).length;
  const pendingReqCount    = incoming.filter(r => r.status === "pending").length;
  const requestList        = requestsTab === "incoming" ? incoming : outgoing;

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-96 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

      {/* ── Sidebar ── */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-gray-200">

        {/* Top tabs: Messages | Requests */}
        <div className="flex border-b border-gray-200 flex-shrink-0">
          <button onClick={() => setSidebarTab("messages")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${sidebarTab === "messages" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            <MessageSquare size={13}/> Messages
          </button>
          <button onClick={() => setSidebarTab("requests")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${sidebarTab === "requests" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            <Inbox size={13}/> Requests
            {pendingReqCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-medium">
                {pendingReqCount > 9 ? "9+" : pendingReqCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Messages tab ── */}
        {sidebarTab === "messages" && (
          <>
            <div className="p-4 border-b border-gray-100 space-y-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 text-sm">Messages</h2>
                <button onClick={() => setShowFilters(v => !v)}
                  className={`p-1.5 rounded-lg transition-colors ${showFilters || activeFiltersCount > 0 ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}>
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
          </>
        )}

        {/* ── Requests tab ── */}
        {sidebarTab === "requests" && (
          <>
            {/* Incoming / Sent sub-tabs */}
            <div className="flex border-b border-gray-100 flex-shrink-0">
              {[
                { id: "incoming", label: "Incoming", count: pendingReqCount },
                { id: "outgoing", label: "Sent" },
              ].map(({ id, label, count }) => (
                <button key={id} onClick={() => setRequestsTab(id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${requestsTab === id ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
                  {label}
                  {count > 0 && (
                    <span className="bg-blue-600 text-white text-[10px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-medium">
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingReqs ? (
                <div className="flex items-center justify-center h-24"><Loader2 size={18} className="animate-spin text-blue-600"/></div>
              ) : requestList.length === 0 ? (
                <div className="text-center py-12 text-gray-400 px-4">
                  <MailQuestion size={28} className="mx-auto mb-2 opacity-40"/>
                  <p className="text-xs">
                    {requestsTab === "incoming" ? "No incoming requests." : "No sent requests."}
                  </p>
                </div>
              ) : (
                requestList.map(req => (
                  <SidebarRequestItem
                    key={req.id} req={req} type={requestsTab}
                    onAccept={handleAcceptRequest} onDecline={handleDeclineRequest}
                    processing={processingReq}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Main area ── */}
      {sidebarTab === "requests" ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400">
          <div className="text-center px-8">
            <MailQuestion size={40} className="mx-auto mb-3 opacity-30"/>
            <p className="text-sm font-medium text-gray-500">Message Requests</p>
            <p className="text-xs text-gray-400 mt-1">
              {pendingReqCount > 0
                ? `You have ${pendingReqCount} pending request${pendingReqCount > 1 ? "s" : ""}. Accept to start a conversation.`
                : "Accept a request to start a new conversation."}
            </p>
          </div>
        </div>
      ) : activeConv ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
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
              groupedMessages().map((item) =>
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
