import { useEffect, useState } from "react";
import api from "../services/api";
import { formatDistanceToNow } from "date-fns";
import { MailQuestion, CheckCircle, XCircle, Clock, Loader2, Inbox, Send } from "lucide-react";

const STATUS_CONFIG = {
  pending:  { bg:"bg-amber-50",  text:"text-amber-700",  icon:Clock,        label:"Pending" },
  accepted: { bg:"bg-green-50",  text:"text-green-700",  icon:CheckCircle,  label:"Accepted" },
  declined: { bg:"bg-red-50",    text:"text-red-600",    icon:XCircle,      label:"Declined" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
      <Icon size={11}/>{cfg.label}
    </span>
  );
}

function RequestCard({ req, type, onAccept, onDecline, processing }) {
  const person = type === "incoming" ? req.sender : req.recipient;
  const name   = person ? `${person.first_name} ${person.last_name}` : "Unknown";
  const initials = [person?.first_name?.[0], person?.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?";

  return (
    <div className="card">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
          {person?.avatar_url ? <img src={person.avatar_url} className="w-11 h-11 rounded-full object-cover" alt=""/> : initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-gray-900 text-sm">{name}</p>
            <StatusBadge status={req.status}/>
          </div>
          {person?.program && <p className="text-xs text-gray-500 mt-0.5">{person.program}</p>}
          {person?.current_job_title && <p className="text-xs text-gray-400">{person.current_job_title}</p>}
          {req.message && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-600 italic">"{req.message}"</p>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">{formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}</p>
        </div>
      </div>

      {type === "incoming" && req.status === "pending" && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
          <button onClick={() => onDecline(req.id)} disabled={processing === req.id}
            className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm">
            {processing === req.id ? <Loader2 size={13} className="animate-spin"/> : <XCircle size={14}/>} Decline
          </button>
          <button onClick={() => onAccept(req.id)} disabled={processing === req.id}
            className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
            {processing === req.id ? <Loader2 size={13} className="animate-spin"/> : <CheckCircle size={14}/>} Accept
          </button>
        </div>
      )}
    </div>
  );
}

export default function MessageRequestsPage() {
  const [incoming,setIncoming] = useState([]);
  const [outgoing,setOutgoing] = useState([]);
  const [loading,setLoading]   = useState(true);
  const [tab,setTab]           = useState("incoming");
  const [processing,setProcessing] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/message-requests/incoming"), api.get("/message-requests/outgoing")])
      .then(([inc, out]) => { setIncoming(inc.data); setOutgoing(out.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleAccept(id) {
    setProcessing(id);
    try {
      await api.patch(`/message-requests/${id}/accept`);
      setIncoming(prev => prev.map(r => r.id === id ? { ...r, status: "accepted" } : r));
    } catch(e) { console.error(e); }
    finally { setProcessing(null); }
  }

  async function handleDecline(id) {
    setProcessing(id);
    try {
      await api.patch(`/message-requests/${id}/decline`);
      setIncoming(prev => prev.map(r => r.id === id ? { ...r, status: "declined" } : r));
    } catch(e) { console.error(e); }
    finally { setProcessing(null); }
  }

  const pendingCount = incoming.filter(r => r.status === "pending").length;
  const list = tab === "incoming" ? incoming : outgoing;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Message Requests</h1>
        <p className="text-sm text-gray-500 mt-1">Manage connection requests from other users.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id:"incoming", label:"Incoming", icon:Inbox, count:pendingCount },
          { id:"outgoing", label:"Sent",     icon:Send  },
        ].map(({ id, label, icon: Icon, count }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab===id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            <Icon size={15}/>{label}
            {count > 0 && <span className="bg-blue-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">{count}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 size={24} className="animate-spin text-blue-600"/></div>
      ) : list.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <MailQuestion size={36} className="mx-auto mb-3 opacity-40"/>
          <p className="text-sm">{tab === "incoming" ? "No incoming requests." : "You haven't sent any requests."}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map(req => (
            <RequestCard key={req.id} req={req} type={tab}
              onAccept={handleAccept} onDecline={handleDecline} processing={processing}/>
          ))}
        </div>
      )}
    </div>
  );
}
