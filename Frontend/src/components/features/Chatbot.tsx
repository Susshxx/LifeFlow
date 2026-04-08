import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  MessageCircleIcon, XIcon, SendIcon, BotIcon, UserIcon,
  MinimizeIcon, PaperclipIcon, MicIcon, PhoneIcon,
  CheckIcon, XCircleIcon, ImageIcon, FileIcon,
  DropletIcon, ChevronLeftIcon, StopCircleIcon, Trash2Icon,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const ORIGINAL_TITLE = document.title;

// ── Hate speech detection ─────────────────────────────────────────────────────
const HATE_SPEECH_PATTERNS = [
  // General profanity
  /\b(fuck|shit|bitch|asshole|bastard|damn|hell|crap|piss|dick|cock|pussy|slut|whore|motherfucker|douche|prick|twat)\b/gi,

  // Intelligence insults
  /\b(idiot|stupid|dumb|moron|retard|imbecile|fool|clown|loser|airhead|nitwit|blockhead|dimwit|halfwit)\b/gi,

  // Aggressive insults
  /\b(jerk|scumbag|piece of shit|trash|garbage|filth|vermin|pig|dog|rat|snake|weasel)\b/gi,

  // Bullying / harassment
  /\b(shut up|go away|get lost|nobody likes you|you suck|hate you|kill yourself|kys|drop dead)\b/gi,

  // Derogatory personality terms
  /\b(arrogant|pathetic|worthless|useless|disgusting|annoying|obnoxious|creep|pervert|psycho|freak)\b/gi,

  // Toxic gamer/internet slang
  /\b(noob|trash player|ez|get rekt|owned|skill issue|cry more)\b/gi,

  // Mild slurs / harmful language (non-protected but offensive)
  /\b(simp|incel|beta|alpha loser|snowflake|keyboard warrior)\b/gi,

  // Body shaming
  /\b(fatass|lard|skinny bitch|ugly|hideous|disfigured)\b/gi,

  // Gender-based insults (non-protected phrasing)
  /\b(bitchy|nagging|gold digger|manchild|drama queen)\b/gi,

  // Violence / threats
  /\b(i will kill you|i'll kill you|die bitch|burn in hell|go die)\b/gi,
];

function containsHateSpeech(text: string): boolean {
  return HATE_SPEECH_PATTERNS.some(pattern => pattern.test(text));
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface BotMessage { id: string; type: 'user' | 'bot'; content: string; timestamp: Date; }

interface ConnectedUser {
  _id: string; name: string; avatar?: string;
  bloodGroup?: string; phone?: string; role?: string;
  municipality?: string;
}
interface Connection {
  _id: string;
  from: ConnectedUser; to: ConnectedUser;
  status: 'pending' | 'accepted' | 'declined';
  updatedAt: string;
}
interface ChatMessage {
  _id: string;
  sender: { _id: string; name: string; avatar?: string };
  type: 'text' | 'file' | 'image' | 'audio';
  content: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  readBy:    string[];  // user IDs who read this
  deletedBy: string[];  // user IDs who soft-deleted this
  createdAt: string;
}
// Preview data per connection (_id → preview)
interface ConvPreview {
  latest: ChatMessage | null;
  unreadCount: number;
}

// ── LifeFlow Assistant responses ──────────────────────────────────────────────
const botResponses: Record<string, string> = {
  'how do i donate blood?':   'To donate blood: 1) Register on LifeFlow, 2) Find a nearby camp or hospital via the map, 3) Complete a health screening, 4) Donate (takes ~10–15 min). Would you like me to help find a donation center?',
  'find nearest blood bank':  "Share your location or district and I'll show you the closest blood banks!",
  'am i eligible to donate?': 'General eligibility: Age 18–65, weight above 45 kg, no recent illness, and at least 3 months since your last donation. Would you like a quick eligibility quiz?',
  'emergency blood request':  'For emergencies, call our hotline: 1660-01-66666 immediately. You can also create an emergency request via the "Find Blood" page.',
  default:                    "I'm LifeFlow Assistant 🩸 Ask me about donation eligibility, finding blood banks, or emergency assistance!",
};
const quickReplies = ['How do I donate blood?', 'Find nearest blood bank', 'Am I eligible to donate?', 'Emergency blood request'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('lf_token') || ''}`, 'Content-Type': 'application/json' };
}
function getMe() {
  try { return JSON.parse(localStorage.getItem('lf_user') || 'null'); } catch { return null; }
}
function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (d.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return d.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
  }
}

function isSameDay(date1: string, date2: string) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.toDateString() === d2.toDateString();
}
function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
// Summarise a message for the preview line
function previewText(msg: ChatMessage, isMe: boolean): string {
  const prefix = isMe ? 'You: ' : '';
  if (msg.type === 'image') return `${prefix}📷 Image`;
  if (msg.type === 'audio') return `${prefix}🎤 Voice message`;
  if (msg.type === 'file')  return `${prefix}📎 ${msg.fileName || 'File'}`;
  return `${prefix}${msg.content}`;
}

// ── Read Receipt ──────────────────────────────────────────────────────────────
function ReadReceipt({ readBy, otherUserId }: { readBy: string[]; otherUserId: string }) {
  const seen = Array.isArray(readBy) && readBy.includes(otherUserId);
  const tickColor = seen ? '#60C3F5' : 'rgba(255,255,255,0.55)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 2, verticalAlign: 'middle' }} title={seen ? 'Seen' : 'Delivered'}>
      <svg width="18" height="10" viewBox="0 0 18 10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 5L4 8L9 2"  stroke={tickColor} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 5L9 8L14 2" stroke={tickColor} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
}

// ── Sub-component: connection request card ────────────────────────────────────
function RequestCard({ conn, onRespond }: { conn: Connection; onRespond: () => void }) {
  const [loading, setLoading] = useState(false);
  const respond = async (action: 'accepted' | 'declined') => {
    setLoading(true);
    try {
      await fetch(`${API}/api/connections/respond`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ connectionId: conn._id, action }),
      });
      onRespond();
    } catch { /* ignore */ } finally { setLoading(false); }
  };
  const u = conn.from;
  return (
    <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        {u.avatar
          ? <img src={u.avatar} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
          : <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">{u.name[0]}</div>
        }
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{u.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {u.bloodGroup && (
              <span className="text-xs text-red-600 font-semibold flex items-center gap-1">
                <DropletIcon className="w-3 h-3" /> {u.bloodGroup}
              </span>
            )}
            {u.role && <span className="text-xs text-gray-400 capitalize">{u.role}</span>}
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500">Wants to connect with you</p>
      <div className="flex gap-2">
        <button onClick={() => respond('accepted')} disabled={loading}
          className="flex-1 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 hover:bg-green-600 disabled:opacity-50 transition-colors">
          <CheckIcon className="w-3.5 h-3.5" /> Accept
        </button>
        <button onClick={() => respond('declined')} disabled={loading}
          className="flex-1 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 hover:bg-gray-200 disabled:opacity-50 transition-colors">
          <XCircleIcon className="w-3.5 h-3.5" /> Decline
        </button>
      </div>
    </div>
  );
}

// ── Sub-component: conversation list item ─────────────────────────────────────
// ✅ Now shows: unread badge, latest message preview, or blood group fallback
function ConvItem({ conn, myId, preview, onClick, active }: {
  conn: Connection; myId: string; preview?: ConvPreview;
  onClick: () => void; active: boolean;
}) {
  const other = conn.from._id === myId ? conn.to : conn.from;
  const unread = preview?.unreadCount ?? 0;
  const latest = preview?.latest ?? null;

  // What to show as the subtitle
  const subtitle = (() => {
    if (!latest) {
      // No messages yet — fall back to blood group
      return other.bloodGroup
        ? <span className="flex items-center gap-1 text-red-500"><DropletIcon className="w-3 h-3" />{other.bloodGroup}</span>
        : <span className="text-gray-400">No messages yet</span>;
    }
    const isMe = latest.sender._id === myId;
    if (unread > 1) {
      // Multiple unread from the other person
      return <span className="font-semibold text-primary">{unread} new messages</span>;
    }
    if (unread === 1) {
      // Exactly one unread — show the message text
      return <span className="font-semibold text-primary truncate">{previewText(latest, isMe)}</span>;
    }
    // All read — show latest message normally
    return <span className="text-gray-400 truncate">{previewText(latest, isMe)}</span>;
  })();

  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${active ? 'bg-primary/10' : 'hover:bg-gray-50'}`}>
      {other.avatar
        ? <img src={other.avatar} className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0" />
        : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">{other.name[0]}</div>
      }
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className="font-semibold text-gray-900 text-sm truncate">{other.name}</p>
          {latest && (
            <span className="text-[10px] text-gray-400 flex-shrink-0">{formatTime(latest.createdAt)}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <p className="text-xs truncate flex-1">{subtitle}</p>
          {/* ✅ Unread badge */}
          {unread > 0 && (
            <span className="flex-shrink-0 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Sub-component: message bubble ─────────────────────────────────────────────
// ✅ Long-press / hover reveals a delete button for soft-deleting the message
function MsgBubble({ msg, isMe, otherUserId, onDelete }: {
  msg: ChatMessage; isMe: boolean; otherUserId: string;
  onDelete: (id: string) => void;
}) {
  const [showDelete, setShowDelete] = useState(false);
  const bg    = isMe ? '#ef4444' : '#fff';
  const color = isMe ? '#fff' : '#1f2937';

  const inner = (() => {
    if (msg.type === 'image') return (
      <img src={msg.content} alt={msg.fileName || 'image'} style={{ maxWidth: 180, borderRadius: 8, display: 'block' }} />
    );
    if (msg.type === 'audio') return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <MicIcon style={{ width: 16, height: 16, color: isMe ? '#fff' : '#ef4444' }} />
        <audio controls src={msg.content} style={{ height: 32, maxWidth: 160 }} />
        {msg.duration ? <span style={{ fontSize: 11, opacity: 0.8 }}>{msg.duration}s</span> : null}
      </div>
    );
    if (msg.type === 'file') return (
      <a href={msg.content} target="_blank" rel="noopener noreferrer"
        style={{ display: 'flex', alignItems: 'center', gap: 8, color: isMe ? '#fff' : '#3b82f6', textDecoration: 'none' }}>
        <FileIcon style={{ width: 16, height: 16, flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>{msg.fileName || 'File'}</p>
          {msg.fileSize ? <p style={{ fontSize: 10, margin: 0, opacity: 0.8 }}>{formatSize(msg.fileSize)}</p> : null}
        </div>
      </a>
    );
    return <span style={{ fontSize: 13, lineHeight: 1.5 }}>{msg.content}</span>;
  })();

  return (
    // ✅ Delete button revealed via CSS opacity on group hover — no conditional
    // render means the button always exists in the DOM and transitions smoothly.
    <div
      style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 6, alignItems: 'flex-end' }}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      {/* Delete button — always rendered, opacity animated */}
      <button
        onClick={() => onDelete(msg._id)}
        title="Delete for me"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '4px 2px', flexShrink: 0, alignSelf: 'center',
          order: isMe ? 1 : -1,
          opacity: showDelete ? 1 : 0,
          transform: showDelete ? 'scale(1)' : 'scale(0.7)',
          transition: 'opacity 0.15s ease, transform 0.15s ease',
          pointerEvents: showDelete ? 'auto' : 'none',
        }}
      >
        <Trash2Icon style={{ width: 14, height: 14, color: '#ef4444' }} />
      </button>

      <div style={{
        maxWidth: '75%', padding: '8px 12px', borderRadius: 16,
        borderBottomRightRadius: isMe ? 4 : 16,
        borderBottomLeftRadius:  isMe ? 16 : 4,
        background: bg, color, boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        {inner}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 3, marginTop: 4,
          justifyContent: isMe ? 'flex-end' : 'flex-start',
        }}>
          <span style={{ fontSize: 10, opacity: 0.6, lineHeight: 1 }}>{formatTime(msg.createdAt)}</span>
          {isMe && <ReadReceipt readBy={msg.readBy ?? []} otherUserId={otherUserId} />}
        </div>
      </div>
    </div>
  );
}

// ── Main Chatbot component ────────────────────────────────────────────────────
export function Chatbot() {
  const [isOpen,      setIsOpen]      = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [tab,         setTab]         = useState<'requests' | 'messages' | 'assistant'>('messages');

  const [requests,        setRequests]        = useState<Connection[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const [connections,     setConnections]     = useState<Connection[]>([]);
  const [previews,        setPreviews]        = useState<Record<string, ConvPreview>>({});
  const [activeConn,      setActiveConn]      = useState<Connection | null>(null);
  const [messages,        setMessages]        = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [input,           setInput]           = useState('');
  const [sending,         setSending]         = useState(false);
  const [hateSpeechWarning, setHateSpeechWarning] = useState('');
  const [hasHateSpeech,   setHasHateSpeech]   = useState(false);

  const [recording,    setRecording]    = useState(false);
  const [recordSecs,   setRecordSecs]   = useState(0);
  const mediaRecRef    = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [botMsgs, setBotMsgs] = useState<BotMessage[]>([{
    id: '1', type: 'bot',
    content: "Hello! I'm LifeFlow Assistant 🩸 How can I help you today?",
    timestamp: new Date(),
  }]);
  const [botInput, setBotInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const imgInputRef    = useRef<HTMLInputElement>(null);
  const me   = getMe();
  const myId = me?.id || me?._id || '';

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, botMsgs]);

  // ── Fetch requests ────────────────────────────────────────────────────────
  const fetchRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const r = await fetch(`${API}/api/connections/requests`, { headers: authHeaders() });
      if (r.ok) setRequests(await r.json());
    } catch { /* ignore */ } finally { setRequestsLoading(false); }
  }, []);

  // ── Fetch connections ─────────────────────────────────────────────────────
  const fetchConnections = useCallback(async (): Promise<Connection[]> => {
    try {
      const r = await fetch(`${API}/api/connections`, { headers: authHeaders() });
      if (r.ok) {
        const data: Connection[] = await r.json();
        setConnections(data);
        return data;
      }
    } catch { /* ignore */ }
    return [];
  }, []);

  // ── Fetch preview for each connection ────────────────────────────────────
  // ✅ Loads latest message + unread count per conversation for the list view
  const fetchPreviews = useCallback(async (conns: Connection[]) => {
    const results = await Promise.all(
      conns.map(async (c) => {
        try {
          const r = await fetch(`${API}/api/connections/${c._id}/preview`, { headers: authHeaders() });
          if (r.ok) {
            const data = await r.json();
            return { id: c._id, preview: data as ConvPreview };
          }
        } catch { /* ignore */ }
        return { id: c._id, preview: { latest: null, unreadCount: 0 } };
      })
    );
    const map: Record<string, ConvPreview> = {};
    results.forEach(({ id, preview }) => { map[id] = preview; });
    setPreviews(map);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    fetchRequests();
    fetchConnections().then(fetchPreviews);
  }, [isOpen, fetchRequests, fetchConnections, fetchPreviews]);

  // Poll connections + previews every 10s when open (faster than before so list stays fresh)
  useEffect(() => {
    if (!isOpen) return;
    const t = setInterval(async () => {
      fetchRequests();
      const conns = await fetchConnections();
      fetchPreviews(conns);
    }, 10000);
    return () => clearInterval(t);
  }, [isOpen, fetchRequests, fetchConnections, fetchPreviews]);

  // ── Notification helpers (title blink + sound) ───────────────────────────
  const blinkTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const blinkStopRef     = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const lastUnreadRef    = useRef(0); // tracks previous unread count to detect NEW messages

  /** Play a soft two-tone ping using the Web Audio API for ~2 seconds. */
  const playNotifSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

      const playTone = (freq: number, startAt: number, duration: number, gain: number) => {
        const osc  = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startAt);
        gainNode.gain.setValueAtTime(0, ctx.currentTime + startAt);
        gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + startAt + 0.02);
        gainNode.gain.linearRampToValueAtTime(0,    ctx.currentTime + startAt + duration);
        osc.start(ctx.currentTime + startAt);
        osc.stop(ctx.currentTime  + startAt + duration);
      };

      // Two gentle tones spread over ~2 seconds
      playTone(880, 0.0, 0.35, 0.25);   // first  ping  at 0.0 s
      playTone(660, 0.5, 0.35, 0.20);   // second ping  at 0.5 s
      playTone(880, 1.0, 0.35, 0.20);   // repeat ping  at 1.0 s
      playTone(660, 1.5, 0.35, 0.15);   // fade   ping  at 1.5 s

      // Close the context after the sound finishes to free resources
      setTimeout(() => ctx.close(), 2200);
    } catch { /* AudioContext not available — silent fallback */ }
  }, []);

  /** Blink the tab title for exactly 4 seconds, then restore it. */
  const blinkTitle = useCallback((count: number) => {
    // Clear any previous blink cycle
    if (blinkTimerRef.current) {
      clearInterval(blinkTimerRef.current);
      blinkTimerRef.current = null;
    }
    if (blinkStopRef.current) {
      clearTimeout(blinkStopRef.current);
      blinkStopRef.current = null;
    }

    const notifTitle = `(${count}) New Message${count > 1 ? 's' : ''} — ${ORIGINAL_TITLE}`;
    let   showNotif  = true;

    // Toggle between notif title and original every 500 ms
    blinkTimerRef.current = setInterval(() => {
      document.title = showNotif ? notifTitle : ORIGINAL_TITLE;
      showNotif = !showNotif;
    }, 500);

    // Stop blinking after 4 seconds and restore the original title
    blinkStopRef.current = setTimeout(() => {
      if (blinkTimerRef.current) {
        clearInterval(blinkTimerRef.current);
        blinkTimerRef.current = null;
      }
      document.title = ORIGINAL_TITLE;
      blinkStopRef.current = null;
    }, 4000);
  }, []);

  // Cleanup function for title blinking
  const stopTitleBlink = useCallback(() => {
    if (blinkTimerRef.current) {
      clearInterval(blinkTimerRef.current);
      blinkTimerRef.current = null;
    }
    if (blinkStopRef.current) {
      clearTimeout(blinkStopRef.current);
      blinkStopRef.current = null;
    }
    document.title = ORIGINAL_TITLE;
  }, []);

  // ── Unread count poll — drives badge, blink + sound on NEW messages ────────
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const r = await fetch(`${API}/api/connections/unread/count`, { headers: authHeaders() });
        if (r.ok) {
          const d = await r.json();
          const totalUnread = (d.pendingRequests ?? 0) + (d.unreadMessages ?? 0);
          setUnreadCount(totalUnread);

          // ✅ Fire blink + sound when unread count increases
          const chatVisible = isOpen && !isMinimized && tab === 'messages';
          
          if (totalUnread > 0 && totalUnread > lastUnreadRef.current && !chatVisible) {
            blinkTitle(totalUnread);
            playNotifSound();
          }

          lastUnreadRef.current = totalUnread;
        }
      } catch { /* ignore */ }
    };
    fetchCount();
    // ✅ Poll every 5 s so the badge and notification fire quickly
    const t = setInterval(fetchCount, 5000);
    return () => clearInterval(t);
  }, [isOpen, isMinimized, tab, blinkTitle, playNotifSound]);

  // Stop blinking and restore title when chat is opened AND expanded AND on messages tab
  useEffect(() => {
    if (isOpen && !isMinimized && tab === 'messages') {
      stopTitleBlink();
      lastUnreadRef.current = 0;
    }
  }, [isOpen, isMinimized, tab, stopTitleBlink]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTitleBlink();
    };
  }, [stopTitleBlink]);

  // ── Listen for lf:openchat event ─────────────────────────────────────────
  useEffect(() => {
    const handler = async (e: Event) => {
      const userId = (e as CustomEvent<string>).detail;
      setIsOpen(true);
      setTab('messages');
      const conns = await fetchConnections();
      const conn  = conns.find(c => c.from._id === userId || c.to._id === userId);
      if (conn) setActiveConn(conn);
    };
    window.addEventListener('lf:openchat', handler);
    return () => window.removeEventListener('lf:openchat', handler);
  }, [fetchConnections]);

  // ── Fetch messages for active conversation ────────────────────────────────
  useEffect(() => {
    if (!activeConn) return;
    setMessagesLoading(true);

    const load = async () => {
      try {
        // ✅ Only mark messages as read if chatbot is open AND not minimized AND on messages tab (not assistant)
        const shouldMarkAsRead = isOpen && !isMinimized && tab === 'messages';
        const url = `${API}/api/connections/${activeConn._id}/messages${shouldMarkAsRead ? '' : '?markAsRead=false'}`;
        const r = await fetch(url, { headers: authHeaders() });
        if (r.ok) setMessages(await r.json());
      } catch { /* ignore */ }
    };

    load().finally(() => setMessagesLoading(false));
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [activeConn, isOpen, isMinimized, tab]);

  // Check for hate speech in real-time as user types
  const handleInputChange = (value: string) => {
    setInput(value);
    // Check both the raw value and trimmed value for hate speech
    const detected = containsHateSpeech(value) || containsHateSpeech(value.trim());
    setHasHateSpeech(detected);
    
    if (detected) {
      setHateSpeechWarning('Your message contains inappropriate language. Please remove it to send.');
    } else {
      setHateSpeechWarning('');
    }
  };

  // ── Send text ─────────────────────────────────────────────────────────────
  const sendText = async () => {
    const text = input.trim();
    
    // Check if empty or contains hate speech
    if (!text || !activeConn || sending) return;
    
    // Double-check for hate speech before sending (check both raw and trimmed)
    if (containsHateSpeech(text) || containsHateSpeech(input)) {
      setHateSpeechWarning('Your message contains inappropriate language. Please be respectful.');
      setHasHateSpeech(true);
      return;
    }
    
    setInput(''); // Clear input immediately for better UX
    setHasHateSpeech(false);
    setSending(true);
    try {
      const r = await fetch(`${API}/api/connections/${activeConn._id}/messages`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ type: 'text', content: text }),
      });
      
      if (!r.ok) {
        // Handle any error response (including hate speech detection)
        if (r.status === 400) {
          const errorData = await r.json();
          setHateSpeechWarning(errorData.message || 'Your message contains inappropriate language. Please be respectful.');
          setTimeout(() => setHateSpeechWarning(''), 5000);
        } else {
          console.error('Failed to send message:', r.status);
        }
        return; // Don't add message to UI
      }
      
      // Only add message to UI if backend confirms it was sent
      const msg = await r.json();
      setMessages(prev => [...prev, msg]);
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  // ── Send file / image ─────────────────────────────────────────────────────
  const sendFile = async (file: File, type: 'file' | 'image') => {
    if (!activeConn) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const content = reader.result as string;
      try {
        const r = await fetch(`${API}/api/connections/${activeConn._id}/messages`, {
          method: 'POST', headers: authHeaders(),
          body: JSON.stringify({ type, content, fileName: file.name, fileSize: file.size }),
        });
        if (r.ok) { const msg = await r.json(); setMessages(prev => [...prev, msg]); }
      } catch { /* ignore */ }
    };
    reader.readAsDataURL(file);
  };

  // ── Soft-delete a message ─────────────────────────────────────────────────
  // ✅ Calls DELETE endpoint, then removes message from local state immediately
  const deleteMessage = async (messageId: string) => {
    if (!activeConn) return;
    // Optimistic UI update — remove from view instantly
    setMessages(prev => prev.filter(m => m._id !== messageId));
    try {
      await fetch(`${API}/api/connections/${activeConn._id}/messages/${messageId}`, {
        method: 'DELETE', headers: authHeaders(),
      });
    } catch {
      // If the request fails, re-fetch to restore accurate state
      const r = await fetch(`${API}/api/connections/${activeConn._id}/messages`, { headers: authHeaders() });
      if (r.ok) setMessages(await r.json());
    }
  };

  // ── Voice recording ───────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        if (!activeConn) return;
        const reader = new FileReader();
        reader.onload = async () => {
          const content = reader.result as string;
          try {
            const r = await fetch(`${API}/api/connections/${activeConn._id}/messages`, {
              method: 'POST', headers: authHeaders(),
              body: JSON.stringify({ type: 'audio', content, duration: recordSecs }),
            });
            if (r.ok) { const msg = await r.json(); setMessages(prev => [...prev, msg]); }
          } catch { /* ignore */ }
        };
        reader.readAsDataURL(blob);
        setRecordSecs(0);
      };
      mr.start();
      mediaRecRef.current = mr;
      setRecording(true);
      recordTimerRef.current = setInterval(() => setRecordSecs(s => s + 1), 1000);
    } catch { alert('Microphone access denied.'); }
  };

  const stopRecording = () => {
    mediaRecRef.current?.stop();
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setRecording(false);
  };

  // ── Bot send ──────────────────────────────────────────────────────────────
  const sendBot = (text?: string) => {
    const t = text || botInput.trim();
    if (!t) return;
    setBotInput('');
    const user: BotMessage = { id: Date.now().toString(), type: 'user', content: t, timestamp: new Date() };
    setBotMsgs(prev => [...prev, user]);
    setTimeout(() => {
      const key   = t.toLowerCase();
      const reply = botResponses[key] || botResponses.default;
      setBotMsgs(prev => [...prev, { id: (Date.now() + 1).toString(), type: 'bot', content: reply, timestamp: new Date() }]);
    }, 800);
  };

  // ── Other user in active conversation ─────────────────────────────────────
  const otherUser: ConnectedUser | null = activeConn
    ? (activeConn.from._id === myId ? activeConn.to : activeConn.from)
    : null;

  const tabBase     = 'flex-1 py-2 text-xs font-semibold transition-colors relative';
  const tabActive   = 'text-primary border-b-2 border-primary';
  const tabInactive = 'text-gray-500 hover:text-gray-700';

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button onClick={() => setIsOpen(true)}
            className="relative w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all group"
            aria-label={`Open chat${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}>
            <MessageCircleIcon className="w-6 h-6" />
            {/* ✅ Glowing notification badge */}
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1">
                {/* Pulsing glow rings */}
                <div className="absolute inset-0 w-6 h-6 bg-red-500 rounded-full notification-pulse"></div>
                <div className="absolute inset-0 w-6 h-6 bg-red-500 rounded-full opacity-60 blur-sm"></div>
                {/* Main badge with glow */}
                <span className="relative w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white shadow-lg notification-glow">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </div>
            )}
            {/* Tooltip */}
            <span className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {unreadCount > 0 ? `${unreadCount} new message${unreadCount > 1 ? 's' : ''}` : 'Messages & Assistant'}
            </span>
          </button>
        </div>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 w-[370px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 ${isMinimized ? 'h-14' : 'h-[580px]'}`}>

          {/* Header */}
          <div className="bg-primary text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              {activeConn && tab === 'messages' ? (
                <>
                  <button onClick={() => setActiveConn(null)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  {otherUser?.avatar
                    ? <img src={otherUser.avatar} className="w-8 h-8 rounded-full object-cover border-2 border-white/50" />
                    : <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">{otherUser?.name[0]}</div>
                  }
                  <div>
                    <p className="font-semibold text-sm">{otherUser?.name}</p>
                    {otherUser?.bloodGroup && (
                      <p className="text-xs text-white/70 flex items-center gap-1">
                        <DropletIcon className="w-3 h-3" /> {otherUser.bloodGroup}
                        {otherUser.phone && <> · <PhoneIcon className="w-3 h-3" /> {otherUser.phone}</>}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                    <MessageCircleIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">LifeFlow</h3>
                    <p className="text-xs text-white/70">Connect · Message · Help</p>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                <MinimizeIcon className="w-4 h-4" />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Tabs */}
              {!activeConn && (
                <div className="flex border-b border-gray-100 bg-white flex-shrink-0">
                  <button onClick={() => setTab('requests')}
                    className={`${tabBase} ${tab === 'requests' ? tabActive : tabInactive}`}>
                    Requests
                    {requests.length > 0 && (
                      <span className="absolute top-1 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {requests.length}
                      </span>
                    )}
                  </button>
                  <button onClick={() => setTab('messages')}
                    className={`${tabBase} ${tab === 'messages' ? tabActive : tabInactive}`}>
                    Messages
                    {Object.values(previews).reduce((total, preview) => total + (preview.unreadCount || 0), 0) > 0 && (
                      <span className="absolute top-1 right-2 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {Object.values(previews).reduce((total, preview) => total + (preview.unreadCount || 0), 0)}
                      </span>
                    )}
                  </button>
                  <button onClick={() => setTab('assistant')}
                    className={`${tabBase} ${tab === 'assistant' ? tabActive : tabInactive}`}>
                    Assistant
                  </button>
                </div>
              )}

              {/* ── TAB: Requests ── */}
              {!activeConn && tab === 'requests' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
                  {requestsLoading ? (
                    <p className="text-center text-sm text-gray-400 mt-8">Loading…</p>
                  ) : requests.length === 0 ? (
                    <div className="text-center mt-12 space-y-2">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                        <UserIcon className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 font-medium">No connection requests</p>
                      <p className="text-xs text-gray-400">When someone clicks Connect on your map pin, it will appear here</p>
                    </div>
                  ) : (
                    requests.map(r => (
                      <RequestCard key={r._id} conn={r} onRespond={() => {
                        fetchRequests();
                        fetchConnections().then(fetchPreviews);
                      }} />
                    ))
                  )}
                </div>
              )}

              {/* ── TAB: Messages — conversation list ── */}
              {!activeConn && tab === 'messages' && (
                <div className="flex-1 overflow-y-auto bg-white">
                  {connections.length === 0 ? (
                    <div className="text-center mt-12 space-y-2 px-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                        <MessageCircleIcon className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 font-medium">No messages yet</p>
                      <p className="text-xs text-gray-400">Accept connection requests to start chatting. Find donors on the map and click Connect.</p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {/* ✅ Sort connections by most recent message */}
                      {[...connections]
                        .sort((a, b) => {
                          const previewA = previews[a._id];
                          const previewB = previews[b._id];
                          const timeA = previewA?.latest?.createdAt ? new Date(previewA.latest.createdAt).getTime() : 0;
                          const timeB = previewB?.latest?.createdAt ? new Date(previewB.latest.createdAt).getTime() : 0;
                          return timeB - timeA; // Most recent first
                        })
                        .map(conn => (
                          <ConvItem
                            key={conn._id}
                            conn={conn}
                            myId={myId}
                            preview={previews[conn._id]}   // ✅ pass preview data
                            active={activeConn?._id === conn._id}
                            onClick={() => setActiveConn(conn)}
                          />
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB: Messages — active conversation ── */}
              {activeConn && tab === 'messages' && (
                <>
                  {otherUser && (
                    <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-3 text-xs flex-shrink-0">
                      <DropletIcon className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      <span className="text-gray-600">
                        <span className="font-semibold text-gray-800">{otherUser.name}</span>
                        {otherUser.bloodGroup && <> · <span className="text-red-600 font-semibold">{otherUser.bloodGroup}</span></>}
                        {otherUser.phone && <> · <span className="text-blue-700">{otherUser.phone}</span></>}
                        {otherUser.municipality && <> · {otherUser.municipality}</>}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
                    {messagesLoading ? (
                      <p className="text-center text-sm text-gray-400 mt-8">Loading messages…</p>
                    ) : messages.length === 0 ? (
                      <p className="text-center text-xs text-gray-400 mt-8">No messages yet. Say hello! 👋</p>
                    ) : (
                      messages.map((msg, index) => {
                        const showDateSeparator = index === 0 || !isSameDay(messages[index - 1].createdAt, msg.createdAt);
                        
                        return (
                          <div key={msg._id}>
                            {/* ✅ Date separator */}
                            {showDateSeparator && (
                              <div className="flex items-center justify-center my-3">
                                <div className="px-3 py-1 bg-gray-200 rounded-full text-xs text-gray-600 font-medium">
                                  {formatDate(msg.createdAt)}
                                </div>
                              </div>
                            )}
                            <MsgBubble
                              msg={msg}
                              isMe={msg.sender._id === myId}
                              otherUserId={otherUser?._id || ''}
                              onDelete={deleteMessage}   // ✅ pass delete handler
                            />
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-3 border-t border-gray-100 bg-white flex-shrink-0">
                    {hateSpeechWarning && (
                      <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
                        <span>⚠️</span>
                        <span>{hateSpeechWarning}</span>
                      </div>
                    )}
                    {recording ? (
                      <div className="flex items-center gap-3 px-3 py-2 bg-red-50 rounded-xl border border-red-200">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-sm text-red-600 font-semibold flex-1">Recording… {recordSecs}s</span>
                        <button onClick={stopRecording} className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                          <StopCircleIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-end gap-2">
                        <div className="flex gap-1">
                          <button onClick={() => imgInputRef.current?.click()}
                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors" title="Send image">
                            <ImageIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => fileInputRef.current?.click()}
                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors" title="Send file">
                            <PaperclipIcon className="w-4 h-4" />
                          </button>
                          <button onClick={startRecording}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Voice message">
                            <MicIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="text" value={input}
                          onChange={e => handleInputChange(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !hasHateSpeech) { e.preventDefault(); sendText(); } }}
                          placeholder="Type a message…"
                          className={`flex-1 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 ${
                            hasHateSpeech 
                              ? 'bg-red-50 border-2 border-red-300 focus:ring-red-200' 
                              : 'bg-gray-100 focus:ring-primary/20'
                          }`}
                        />
                        <button onClick={sendText} disabled={!input.trim() || sending || hasHateSpeech || containsHateSpeech(input.trim())}
                          className="w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                          title={hasHateSpeech || containsHateSpeech(input.trim()) ? 'Remove inappropriate language to send' : 'Send message'}>
                          <SendIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <input ref={imgInputRef} type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) sendFile(f, 'image'); e.target.value = ''; }} />
                    <input ref={fileInputRef} type="file" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) sendFile(f, 'file'); e.target.value = ''; }} />
                  </div>
                </>
              )}

              {/* ── TAB: Assistant ── */}
              {tab === 'assistant' && !activeConn && (
                <>
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
                    {botMsgs.map(msg => (
                      <div key={msg.id} className={`flex gap-2 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.type === 'user' ? 'bg-primary/10' : 'bg-red-50'}`}>
                          {msg.type === 'user'
                            ? <UserIcon className="w-4 h-4 text-primary" />
                            : <BotIcon className="w-4 h-4 text-red-500" />}
                        </div>
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${msg.type === 'user' ? 'bg-primary text-white rounded-br-md' : 'bg-white text-gray-700 rounded-bl-md shadow-sm'}`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="px-3 py-2 border-t border-gray-100 flex gap-2 overflow-x-auto bg-white flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
                    {quickReplies.map(r => (
                      <button key={r} onClick={() => sendBot(r)}
                        className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/5 rounded-full whitespace-nowrap hover:bg-primary/10 transition-colors">
                        {r}
                      </button>
                    ))}
                  </div>
                  <div className="p-3 border-t border-gray-100 bg-white flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <input type="text" value={botInput} onChange={e => setBotInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendBot(); } }}
                        placeholder="Ask LifeFlow Assistant…"
                        className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      <button onClick={() => sendBot()} disabled={!botInput.trim()}
                        className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        <SendIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}