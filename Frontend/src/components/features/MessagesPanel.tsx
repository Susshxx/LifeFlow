import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircleIcon, DropletIcon, ChevronRightIcon } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ConnectedUser {
  _id: string;
  name: string;
  avatar?: string;
  bloodGroup?: string;
  phone?: string;
  role?: string;
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
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function previewText(msg: ChatMessage, isMe: boolean): string {
  const prefix = isMe ? 'You: ' : '';
  if (msg.type === 'image') return `${prefix}📷 Image`;
  if (msg.type === 'audio') return `${prefix}🎤 Voice message`;
  if (msg.type === 'file') return `${prefix}📎 ${msg.fileName || 'File'}`;
  return `${prefix}${msg.content}`;
}

export function MessagesPanel({ className = '' }: { className?: string }) {
  const navigate = useNavigate();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [previews, setPreviews] = useState<Record<string, ConvPreview>>({});
  const [loading, setLoading] = useState(true);

  const me = getMe();
  const myId = me?.id || me?._id || '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('lf_token');
        if (!token) return;

        // Fetch connections
        const connRes = await fetch(`${API}/api/connections`, { headers: authHeaders() });
        if (!connRes.ok) return;
        const conns: Connection[] = await connRes.json();
        setConnections(conns);

        // Fetch previews for each connection
        const previewResults = await Promise.all(
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
        previewResults.forEach(({ id, preview }) => {
          map[id] = preview;
        });
        setPreviews(map);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Poll every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [myId]);

  const handleOpenChat = () => {
    // Navigate to Messages page
    navigate('/dashboard/chat');
  };

  // Count unique users with unread messages
  const usersWithUnreadMessages = Object.entries(previews).filter(
    ([_, preview]) => (preview.unreadCount || 0) > 0
  ).length;

  // Sort connections by latest message timestamp (most recent first)
  const sortedConnections = [...connections].sort((a, b) => {
    const previewA = previews[a._id];
    const previewB = previews[b._id];
    
    const timeA = previewA?.latest?.createdAt ? new Date(previewA.latest.createdAt).getTime() : 0;
    const timeB = previewB?.latest?.createdAt ? new Date(previewB.latest.createdAt).getTime() : 0;
    
    return timeB - timeA; // Most recent first
  });

  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircleIcon className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Messages</h3>
          {usersWithUnreadMessages > 0 && (
            <span className="px-2 py-0.5 text-xs font-semibold bg-primary text-white rounded-full">
              {usersWithUnreadMessages}
            </span>
          )}
        </div>
      </div>

      {/* Messages List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading messages...</p>
          </div>
        ) : connections.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageCircleIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No conversations yet</p>
            <p className="text-xs mt-1">
              Connect with donors on the Search page to start messaging
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedConnections.map((conn) => {
              const other = conn.from._id === myId ? conn.to : conn.from;
              const preview = previews[conn._id];
              const unread = preview?.unreadCount || 0;
              const latest = preview?.latest;

              const subtitle = (() => {
                if (!latest) {
                  return other.bloodGroup ? (
                    <span className="flex items-center gap-1 text-red-500 text-xs">
                      <DropletIcon className="w-3 h-3" />
                      {other.bloodGroup}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">No messages yet</span>
                  );
                }
                const isMe = latest.sender._id === myId;
                const text = previewText(latest, isMe);
                return unread > 0 ? (
                  <span className="font-semibold text-primary text-xs truncate">
                    {text}
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs truncate">{text}</span>
                );
              })();

              return (
                <button
                  key={conn._id}
                  onClick={handleOpenChat}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left relative"
                >
                  {/* Avatar */}
                  {other.avatar ? (
                    <img
                      src={other.avatar}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0"
                      alt={other.name}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                      {other.name[0]}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {other.name}
                      </p>
                      {latest && (
                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                          {formatTime(latest.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <div className="flex-1 min-w-0">{subtitle}</div>
                      {unread > 0 && (
                        <span className="flex-shrink-0 h-[18px] bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5">
                          {unread} new
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* View All Button */}
      {connections.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100">
          <button
            onClick={() => navigate('/dashboard/chat')}
            className="w-full text-sm text-primary font-medium hover:underline flex items-center justify-center gap-1"
          >
            View All Messages
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
