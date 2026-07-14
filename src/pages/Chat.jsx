import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Image, MoreVertical, Phone, MapPin } from 'lucide-react';
import { fetchConversationById, fetchMessagesForConversation, sendMessage as sendMsg } from '../data/mockMessages';
import { getCurrentUserId } from '../data/mockUsers';
import { supabase } from '../utils/supabaseClient';

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateString) {
  const d = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
  const [sending, setSending] = useState(false);
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

  // Real-time Supabase subscription for new messages
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`chat-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${id}`,
      }, (payload) => {
        const newMsg = payload.new;
        // Don't duplicate if we already optimistically added it
        setMessages(prev => {
          const exists = prev.some(m => m.id === newMsg.id);
          if (exists) return prev;
          return [...prev, {
            id: newMsg.id,
            senderId: newMsg.sender_id,
            text: newMsg.content,
            timestamp: newMsg.created_at,
            type: 'text',
          }];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const text = newMessage.trim();
    setSending(true);
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
    setSending(false);

    // Simulate typing response after a short delay
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 2500);
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

  // Group messages by date
  let lastDate = null;

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-panel border-b border-border-light px-4 pt-safe pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/messages')}
            className="w-10 h-10 rounded-full bg-dark-surface border border-border flex items-center justify-center text-white hover:bg-surface transition-colors"
            id="chat-back"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-dark flex items-center justify-center text-[13px] font-black text-accent flex-shrink-0 border border-border shadow-inner">
              {conversation.participantInitials}
            </div>
            {/* Online indicator */}
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-accent rounded-full border-2 border-dark shadow-[0_0_8px_rgba(0,255,135,0.6)]" />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-[16px] font-bold text-white truncate">{conversation.participantName}</h2>
            <p className="text-[11px] text-accent font-bold uppercase tracking-wider truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-accent rounded-full" />
              {conversation.taskTitle}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button className="w-9 h-9 rounded-full flex items-center justify-center text-charcoal-light hover:bg-surface hover:text-accent transition-colors">
              <Phone size={18} />
            </button>
            <button className="w-9 h-9 rounded-full flex items-center justify-center text-charcoal-light hover:bg-surface hover:text-white transition-colors">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        {/* Task context banner */}
        <div className="mt-2 flex items-center gap-2 bg-dark/50 rounded-xl px-3 py-2 border border-border">
          <MapPin size={13} className="text-accent flex-shrink-0" />
          <span className="text-[11px] text-charcoal-light font-medium truncate">
            {conversation.taskTitle} • Tap to view task
          </span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        {messages.map((msg, i) => {
          const isMine = msg.senderId === currentUserId;
          const msgDate = formatDate(msg.timestamp);
          const showDateSep = msgDate !== lastDate;
          lastDate = msgDate;

          const showTimestamp = i === 0 || 
            new Date(msg.timestamp).getTime() - new Date(messages[i-1].timestamp).getTime() > 300000;

          return (
            <div key={msg.id} className="mb-3">
              {showDateSep && (
                <div className="text-center py-4 mb-2">
                  <span className="text-[11px] text-charcoal-light font-bold uppercase tracking-wider bg-dark-surface border border-border px-4 py-1.5 rounded-full shadow-sm">
                    {msgDate}
                  </span>
                </div>
              )}
              {showTimestamp && !showDateSep && (
               <div className="text-center py-2 mb-1">
                  <span className="text-[10px] text-charcoal-light font-medium">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              )}
              <div
                className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                {!isMine && (
                  <div className="w-7 h-7 rounded-full bg-dark-surface border border-border flex items-center justify-center text-[9px] font-black text-accent mr-2 mt-1 flex-shrink-0">
                    {conversation.participantInitials}
                  </div>
                )}
                <div
                  className={`max-w-[72%] px-4 py-3 text-[14px] leading-relaxed font-medium shadow-md
                    ${isMine
                      ? 'bg-accent text-dark rounded-3xl rounded-br-md shadow-[0_4px_15px_rgba(0,255,135,0.2)]'
                      : 'bg-dark-surface text-white rounded-3xl rounded-bl-md border border-border-light'
                    }`}
                >
                  {msg.text}
                  <div className={`text-[9px] mt-1.5 font-medium ${isMine ? 'text-dark/50 text-right' : 'text-charcoal-light/60'}`}>
                    {formatTime(msg.timestamp)}
                    {isMine && ' ✓✓'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start items-end gap-2 animate-fade-in mt-2">
            <div className="w-7 h-7 rounded-full bg-dark-surface border border-border flex items-center justify-center text-[9px] font-black text-accent flex-shrink-0">
              {conversation.participantInitials}
            </div>
            <div className="bg-dark-surface rounded-3xl rounded-bl-md px-5 py-4 border border-border-light shadow-md">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-charcoal-light rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <span className="w-2 h-2 bg-charcoal-light rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                <span className="w-2 h-2 bg-charcoal-light rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
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
          <button className="w-11 h-11 rounded-full bg-dark-surface border border-border flex items-center justify-center text-charcoal-light hover:text-white transition-colors flex-shrink-0">
            <Image size={20} />
          </button>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="input-field w-full px-5 py-3 rounded-full text-[15px] font-medium"
              id="chat-input"
            />
          </div>

          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300
              ${newMessage.trim()
                ? 'bg-accent text-dark shadow-[0_4px_15px_rgba(0,255,135,0.4)] hover:scale-105 active:scale-95'
                : 'bg-dark-surface text-charcoal-light border border-border'
              }`}
            id="chat-send"
            aria-label="Send message"
          >
            <Send size={18} className={newMessage.trim() ? 'ml-0.5' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
}
