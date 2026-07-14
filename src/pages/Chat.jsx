import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Image, MoreVertical } from 'lucide-react';
import { fetchConversationById, fetchMessagesForConversation, sendMessage as sendMsg } from '../data/mockMessages';
import { getCurrentUserId } from '../data/mockUsers';

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUserId = getCurrentUserId();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [conv, msgs] = await Promise.all([
        fetchConversationById(id),
        fetchMessagesForConversation(id),
      ]);
      if (!cancelled) {
        setConversation(conv);
        setMessages(msgs);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const text = newMessage.trim();
    // Optimistic UI update
    const optimistic = {
      id: `msg-new-${Date.now()}`,
      senderId: currentUserId,
      text,
      timestamp: new Date().toISOString(),
      type: 'text',
    };
    setMessages(prev => [...prev, optimistic]);
    setNewMessage('');

    // Persist to Supabase
    await sendMsg(id, currentUserId, text);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,255,135,0.5)]" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="text-charcoal-light font-bold">Conversation not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-panel border-b border-border-light px-4 pt-safe pb-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/messages')}
          className="w-10 h-10 rounded-full bg-dark-surface border border-border flex items-center justify-center text-white hover:bg-surface transition-colors"
          id="chat-back"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="w-10 h-10 rounded-full bg-dark flex items-center justify-center text-[13px] font-black text-accent flex-shrink-0 border border-border shadow-inner">
          {conversation.participantInitials}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-[16px] font-bold text-white truncate">{conversation.participantName}</h2>
          <p className="text-[11px] text-accent font-bold uppercase tracking-wider truncate">{conversation.taskTitle}</p>
        </div>

        <button className="w-10 h-10 rounded-full flex items-center justify-center text-charcoal-light hover:bg-surface hover:text-white transition-colors">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        {messages.map((msg, i) => {
          const isMine = msg.senderId === currentUserId;
          const showTimestamp = i === 0 || 
            new Date(msg.timestamp).getTime() - new Date(messages[i-1].timestamp).getTime() > 300000;

          return (
            <div key={msg.id} className="mb-3">
              {showTimestamp && (
               <div className="text-center py-3 mb-2">
                  <span className="text-[11px] text-charcoal-light font-bold uppercase tracking-wider bg-dark-surface border border-border px-4 py-1.5 rounded-full shadow-sm">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              )}
              <div
                className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[75%] px-4 py-3 text-[14px] leading-relaxed font-medium shadow-md
                    ${isMine
                      ? 'bg-accent text-dark rounded-3xl rounded-br-md shadow-[0_4px_15px_rgba(0,255,135,0.2)]'
                      : 'bg-dark-surface text-white rounded-3xl rounded-bl-md border border-border-light'
                    }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start animate-fade-in mt-2">
            <div className="bg-dark-surface rounded-3xl rounded-bl-md px-5 py-4 border border-border-light shadow-md">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 bg-charcoal-light rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <span className="w-2.5 h-2.5 bg-charcoal-light rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                <span className="w-2.5 h-2.5 bg-charcoal-light rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div 
        className="sticky bottom-0 glass-panel border-t border-border-light px-4 pt-3"
        style={{ paddingBottom: 'calc(16px + var(--safe-area-bottom, 0px))' }}
      >
        <div className="flex items-center gap-3">
          <button className="w-12 h-12 rounded-full bg-dark-surface border border-border flex items-center justify-center text-charcoal-light hover:text-white transition-colors flex-shrink-0">
            <Image size={22} />
          </button>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="input-field w-full px-5 py-3.5 rounded-full text-[15px] font-medium"
              id="chat-input"
            />
          </div>

          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300
              ${newMessage.trim()
                ? 'bg-accent text-dark shadow-[0_4px_15px_rgba(0,255,135,0.4)] hover:scale-105 active:scale-95'
                : 'bg-dark-surface text-charcoal-light border border-border'
              }`}
            id="chat-send"
            aria-label="Send message"
          >
            <Send size={20} className={newMessage.trim() ? 'ml-1' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
}
