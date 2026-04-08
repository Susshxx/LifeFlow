import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircleIcon, SendIcon, PaperclipIcon, ImageIcon, MicIcon,
  DropletIcon, PhoneIcon, ArrowLeftIcon, StopCircleIcon, FileIcon,
  Trash2Icon, SearchIcon, MoreVerticalIcon,
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const HATE_SPEECH_PATTERNS = [
  /\b(fuck|shit|bitch|asshole|bastard|damn|hell|crap|piss|dick|cock|pussy|slut|whore|motherfucker|douche|prick|twat)\b/gi,
  /\b(idiot|stupid|dumb|moron|retard|imbecile|fool|clown|loser|airhead|nitwit|blockhead|dimwit|halfwit)\b/gi,
  /\b(jerk|scumbag|piece of shit|trash|garbage|filth|vermin|pig|dog|rat|snake|weasel)\b/gi,
  /\b(shut up|go away|get lost|nobody likes you|you suck|hate you|kill yourself|kys|drop dead)\b/gi,
  /\b(arrogant|pathetic|worthless|useless|disgusting|annoying|obnoxious|creep|pervert|psycho|freak)\b/gi,
  /\b(noob|trash player|ez|get rekt|owned|skill issue|cry more)\b/gi,
  /\b(simp|incel|beta|alpha loser|snowflake|keyboard warrior)\b/gi,
  /\b(fatass|lard|skinny bitch|ugly|hideous|disfigured)\b/gi,
  /\b(bitchy|nagging|gold digger|manchild|drama queen)\b/gi,
  /\b(i will kill you|i'll kill you|die bitch|burn in hell|go die)\b/gi,
];

function containsHateSpeech(text: string): boolean {
  return HATE_SPEECH_PATTERNS.some(pattern => pattern.test(text));
}

interface ConnectedUser {
  _id: string;
  name: string;
  avatar?: string;
  bloodGroup?: string;
  phone?: string;
  municipality?: string;
}

interface Connection {
  _id: string;
  from: ConnectedUser;
  to: ConnectedUser;
  status: 'accepted';
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
  readBy: string[];
  createdAt: string;
}

interface ConvPreview {
  latest: ChatMessage | null;
  unreadCount: number;
}

function authHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem('lf_token') || ''}`,
    'Content-Type': 'application/json',
  };
}

function getMe() {
  try {
    return JSON.parse(localStorage.getItem('lf_user') || 'null');
  } catch {
    return null;
  }
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

function previewText(msg: ChatMessage, isMe: boolean): string {
  const prefix = isMe ? 'You: ' : '';
  if (msg.type === 'image') return `${prefix}📷 Image`;
  if (msg.type === 'audio') return `${prefix}🎤 Voice message`;
  if (msg.type === 'file') return `${prefix}📎 ${msg.fileName || 'File'}`;
  return `${prefix}${msg.content}`;
}

function ReadReceipt({ readBy, otherUserId }: { readBy: string[]; otherUserId: string }) {
  const seen = Array.isArray(readBy) && readBy.includes(otherUserId);
  const tickColor = seen ? '#60C3F5' : 'rgba(255,255,255,0.55)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 2 }} title={seen ? 'Seen' : 'Delivered'}>
      <svg width="18" height="10" viewBox="0 0 18 10" fill="none">
        <path d="M1 5L4 8L9 2" stroke={tickColor} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 5L9 8L14 2" stroke={tickColor} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function MessageBubble({
  msg,
  isMe,
  otherUserId,
  onDelete,
}: {
  msg: ChatMessage;
  isMe: boolean;
  otherUserId: string;
  onDelete: (id: string) => void;
}) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMe ? 'row-reverse' : 'row',
        gap: 6,
        alignItems: 'flex-end',
      }}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <button
        onClick={() => onDelete(msg._id)}
        title="Delete for me"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 2px',
          flexShrink: 0,
          alignSelf: 'center',
          order: isMe ? 1 : -1,
          opacity: showDelete ? 1 : 0,
          transform: showDelete ? 'scale(1)' : 'scale(0.7)',
          transition: 'opacity 0.15s ease, transform 0.15s ease',
          pointerEvents: showDelete ? 'auto' : 'none',
        }}
      >
        <Trash2Icon style={{ width: 14, height: 14, color: '#ef4444' }} />
      </button>

      <div
        style={{
          maxWidth: '75%',
          padding: '8px 12px',
          borderRadius: 16,
          borderBottomRightRadius: isMe ? 4 : 16,
          borderBottomLeftRadius: isMe ? 16 : 4,
          background: isMe ? '#ef4444' : '#fff',
          color: isMe ? '#fff' : '#1f2937',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        {msg.type === 'image' ? (
          <img
            src={msg.content}
            alt={msg.fileName || 'image'}
            style={{ maxWidth: 180, borderRadius: 8, display: 'block' }}
          />
        ) : msg.type === 'audio' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MicIcon
              style={{
                width: 16,
                height: 16,
                color: isMe ? '#fff' : '#ef4444',
              }}
            />
            <audio controls src={msg.content} style={{ height: 32, maxWidth: 160 }} />
            {msg.duration && <span style={{ fontSize: 11, opacity: 0.8 }}>{msg.duration}s</span>}
          </div>
        ) : msg.type === 'file' ? (
          <a
            href={msg.content}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: isMe ? '#fff' : '#3b82f6',
              textDecoration: 'none',
            }}
          >
            <FileIcon style={{ width: 16, height: 16, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>{msg.fileName || 'File'}</p>
              {msg.fileSize && (
                <p style={{ fontSize: 10, margin: 0, opacity: 0.8 }}>{formatSize(msg.fileSize)}</p>
              )}
            </div>
          </a>
        ) : (
          <span style={{ fontSize: 13, lineHeight: 1.5 }}>{msg.content}</span>
        )}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            marginTop: 4,
            justifyContent: isMe ? 'flex-end' : 'flex-start',
          }}
        >
          <span style={{ fontSize: 10, opacity: 0.6, lineHeight: 1 }}>{formatTime(msg.createdAt)}</span>
          {isMe && <ReadReceipt readBy={msg.readBy ?? []} otherUserId={otherUserId} />}
        </div>
      </div>
    </div>
  );
}

export function HospitalMessagesPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [previews, setPreviews] = useState<Record<string, ConvPreview>>({});
  const [activeConn, setActiveConn] = useState<Connection | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [hateSpeechWarning, setHateSpeechWarning] = useState('');
  const [hasHateSpeech, setHasHateSpeech] = useState(false);

  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const prevMessagesLengthRef = useRef(0);

  const me = getMe();
  const myId = me?.id || me?._id || '';

  const checkIfNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    
    const threshold = 150;
    const isNear = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    setIsNearBottom(isNear);
  };

  useEffect(() => {
    const newMessagesAdded = messages.length > prevMessagesLengthRef.current;
    const lastMessage = messages[messages.length - 1];
    const userSentMessage = lastMessage?.sender._id === myId;
    
    if (newMessagesAdded && (isNearBottom || userSentMessage)) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    
    prevMessagesLengthRef.current = messages.length;
  }, [messages, isNearBottom, myId]);

  const fetchConnections = async (): Promise<Connection[]> => {
    try {
      const r = await fetch(`${API}/api/connections`, { headers: authHeaders() });
      if (r.ok) {
        const data: Connection[] = await r.json();
        setConnections(data);
        return data;
      }
    } catch (err) {
      console.error('Failed to fetch connections:', err);
    }
    return [];
  };

  const fetchPreviews = async (conns: Connection[]) => {
    const results = await Promise.all(
      conns.map(async (c) => {
        try {
          const r = await fetch(`${API}/api/connections/${c._id}/preview`, {
            headers: authHeaders(),
          });
          if (r.ok) {
            const data = await r.json();
            return { id: c._id, preview: data as ConvPreview };
          }
        } catch {}
        return { id: c._id, preview: { latest: null, unreadCount: 0 } };
      })
    );
    const map: Record<string, ConvPreview> = {};
    results.forEach(({ id, preview }) => {
      map[id] = preview;
    });
    setPreviews(map);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const conns = await fetchConnections();
      await fetchPreviews(conns);
      setLoading(false);
    };
    load();

    const interval = setInterval(async () => {
      const conns = await fetchConnections();
      await fetchPreviews(conns);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeConn) return;

    const loadMessages = async () => {
      try {
        const r = await fetch(`${API}/api/connections/${activeConn._id}/messages`, {
          headers: authHeaders(),
        });
        if (r.ok) setMessages(await r.json());
      } catch {}
    };

    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [activeConn]);

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
        method: 'POST',
        headers: authHeaders(),
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
      setMessages((prev) => [...prev, msg]);
      
      // Refresh previews to update conversation order
      const conns = await fetchConnections();
      await fetchPreviews(conns);
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const sendFile = async (file: File, type: 'file' | 'image') => {
    if (!activeConn) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const content = reader.result as string;
      try {
        const r = await fetch(`${API}/api/connections/${activeConn._id}/messages`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ type, content, fileName: file.name, fileSize: file.size }),
        });
        if (r.ok) {
          const msg = await r.json();
          setMessages((prev) => [...prev, msg]);
        }
      } catch {}
    };
    reader.readAsDataURL(file);
  };

  const deleteMessage = async (messageId: string) => {
    if (!activeConn) return;
    setMessages((prev) => prev.filter((m) => m._id !== messageId));
    try {
      await fetch(`${API}/api/connections/${activeConn._id}/messages/${messageId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
    } catch {
      const r = await fetch(`${API}/api/connections/${activeConn._id}/messages`, {
        headers: authHeaders(),
      });
      if (r.ok) setMessages(await r.json());
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());
        if (!activeConn) return;
        const reader = new FileReader();
        reader.onload = async () => {
          const content = reader.result as string;
          try {
            const r = await fetch(`${API}/api/connections/${activeConn._id}/messages`, {
              method: 'POST',
              headers: authHeaders(),
              body: JSON.stringify({ type: 'audio', content, duration: recordSecs }),
            });
            if (r.ok) {
              const msg = await r.json();
              setMessages((prev) => [...prev, msg]);
            }
          } catch {}
        };
        reader.readAsDataURL(blob);
        setRecordSecs(0);
      };
      mr.start();
      mediaRecRef.current = mr;
      setRecording(true);
      recordTimerRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
    } catch {
      alert('Microphone access denied.');
    }
  };

  const stopRecording = () => {
    mediaRecRef.current?.stop();
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setRecording(false);
  };

  const deleteEntireChat = async () => {
    if (!activeConn) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to delete this entire conversation? This will only remove it from your view.'
    );
    
    if (!confirmed) return;
    
    try {
      await fetch(`${API}/api/connections/${activeConn._id}/messages/clear`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      
      setMessages([]);
      setActiveConn(null);
      
      const conns = await fetchConnections();
      await fetchPreviews(conns);
      
      setShowChatMenu(false);
    } catch (err) {
      console.error('Failed to delete chat:', err);
      alert('Failed to delete conversation. Please try again.');
    }
  };

  const otherUser: ConnectedUser | null = activeConn
    ? activeConn.from._id === myId
      ? activeConn.to
      : activeConn.from
    : null;

  const filteredConnections = connections.filter((conn) => {
    const other = conn.from._id === myId ? conn.to : conn.from;
    return other.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const sortedConnections = [...filteredConnections].sort((a, b) => {
    const previewA = previews[a._id];
    const previewB = previews[b._id];
    
    const timeA = previewA?.latest?.createdAt ? new Date(previewA.latest.createdAt).getTime() : 0;
    const timeB = previewB?.latest?.createdAt ? new Date(previewB.latest.createdAt).getTime() : 0;
    
    return timeB - timeA;
  });

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <Sidebar role="hospital" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/hospital/dashboard')}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <MessageCircleIcon className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-heading font-bold text-gray-900">Messages</h1>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Conversations List */}
          <div className="w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex-shrink-0">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Loading conversations...</p>
                </div>
              ) : filteredConnections.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircleIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500 font-medium">No conversations yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Connect with donors to start messaging
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {sortedConnections.map((conn) => {
                    const other = conn.from._id === myId ? conn.to : conn.from;
                    const preview = previews[conn._id];
                    const unread = preview?.unreadCount || 0;
                    const latest = preview?.latest;
                    const isActive = activeConn?._id === conn._id;

                    return (
                      <button
                        key={conn._id}
                        onClick={() => setActiveConn(conn)}
                        className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left ${
                          isActive ? 'bg-primary/5' : ''
                        }`}
                      >
                        {other.avatar ? (
                          <img
                            src={other.avatar}
                            className="w-12 h-12 rounded-full object-cover border border-gray-200 flex-shrink-0"
                            alt={other.name}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center font-bold text-white flex-shrink-0">
                            {other.name[0]}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="font-semibold text-gray-900 truncate">
                              {other.name}
                            </p>
                            {latest && (
                              <span className="text-xs text-gray-400 flex-shrink-0">
                                {formatTime(latest.createdAt)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-1 mt-1">
                            <div className="flex-1 min-w-0">
                              {!latest ? (
                                other.bloodGroup ? (
                                  <span className="flex items-center gap-1 text-red-500 text-xs">
                                    <DropletIcon className="w-3 h-3" />
                                    {other.bloodGroup}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-xs">No messages yet</span>
                                )
                              ) : unread > 0 ? (
                                <span className="font-semibold text-primary text-xs truncate">
                                  {previewText(latest, latest.sender._id === myId)}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs truncate">
                                  {previewText(latest, latest.sender._id === myId)}
                                </span>
                              )}
                            </div>
                            {unread > 0 && (
                              <span className="flex-shrink-0 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center px-2">
                                {unread} new
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-gray-50 h-full min-w-0 overflow-hidden">
            {!activeConn ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircleIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-semibold text-gray-600">Select a conversation</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
                  {otherUser?.avatar ? (
                    <img
                      src={otherUser.avatar}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      alt={otherUser.name}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center font-bold text-white">
                      {otherUser?.name[0]}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{otherUser?.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {otherUser?.bloodGroup && (
                        <span className="flex items-center gap-1 text-red-600 font-semibold">
                          <DropletIcon className="w-3 h-3" />
                          {otherUser.bloodGroup}
                        </span>
                      )}
                      {otherUser?.phone && (
                        <span className="flex items-center gap-1">
                          <PhoneIcon className="w-3 h-3" />
                          {otherUser.phone}
                        </span>
                      )}
                      {otherUser?.municipality && <span>· {otherUser.municipality}</span>}
                    </div>
                  </div>
                  
                  <div className="relative">
                    <button
                      onClick={() => setShowChatMenu(!showChatMenu)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Chat options"
                    >
                      <MoreVerticalIcon className="w-5 h-5 text-gray-600" />
                    </button>
                    
                    {showChatMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowChatMenu(false)}
                        />
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                          <button
                            onClick={deleteEntireChat}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2Icon className="w-4 h-4" />
                            Delete Conversation
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div 
                  ref={messagesContainerRef}
                  onScroll={checkIfNearBottom}
                  className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
                >
                  {messages.length === 0 ? (
                    <p className="text-center text-sm text-gray-400 mt-8">
                      No messages yet. Say hello! 👋
                    </p>
                  ) : (
                    messages.map((msg, index) => {
                      const isMe = msg.sender._id === myId;
                      const showDateSeparator = index === 0 || !isSameDay(messages[index - 1].createdAt, msg.createdAt);

                      return (
                        <div key={msg._id}>
                          {showDateSeparator && (
                            <div className="flex items-center justify-center my-4">
                              <div className="px-3 py-1 bg-gray-200 rounded-full text-xs text-gray-600 font-medium">
                                {formatDate(msg.createdAt)}
                              </div>
                            </div>
                          )}
                          <MessageBubble
                            msg={msg}
                            isMe={isMe}
                            otherUserId={otherUser?._id || ''}
                            onDelete={deleteMessage}
                          />
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
                  {hateSpeechWarning && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
                      <span>⚠️</span>
                      <span>{hateSpeechWarning}</span>
                    </div>
                  )}
                  
                  {recording ? (
                    <div className="flex items-center gap-3 px-3 py-2 bg-red-50 rounded-xl border border-red-200">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-sm text-red-600 font-semibold flex-1">
                        Recording… {recordSecs}s
                      </span>
                      <button
                        onClick={stopRecording}
                        className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <StopCircleIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-end gap-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => imgInputRef.current?.click()}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                          title="Send image"
                        >
                          <ImageIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                          title="Send file"
                        >
                          <PaperclipIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={startRecording}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Voice message"
                        >
                          <MicIcon className="w-5 h-5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && !hasHateSpeech) {
                            e.preventDefault();
                            sendText();
                          }
                        }}
                        placeholder="Type a message…"
                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 ${
                          hasHateSpeech 
                            ? 'bg-red-50 border-2 border-red-300 focus:ring-red-200' 
                            : 'bg-gray-100 focus:ring-primary/20'
                        }`}
                      />
                      <button
                        onClick={sendText}
                        disabled={!input.trim() || sending || hasHateSpeech || containsHateSpeech(input.trim())}
                        className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                        title={hasHateSpeech || containsHateSpeech(input.trim()) ? 'Remove inappropriate language to send' : 'Send message'}
                      >
                        <SendIcon className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  <input
                    ref={imgInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) sendFile(f, 'image');
                      e.target.value = '';
                    }}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) sendFile(f, 'file');
                      e.target.value = '';
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
