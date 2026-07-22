import { supabase } from '../utils/supabaseClient';

// Helper to convert DB row to UI shape
function rowToConversation(row, profile) {
  return {
    id: row.id,
    taskId: row.task_id,
    taskTitle: '', // Will be filled by the caller or a join
    participantId: row.participant_id,
    participantName: profile?.name || 'Unknown',
    participantInitials: profile?.initials || '??',
    participantPhone: profile?.phone || '',
    lastMessageText: row.last_message,        // aligned with Messages.jsx usage
    lastMessage: row.last_message,            // backward-compat alias
    lastMessageTime: row.last_message_time,
    unreadCount: row.unread || 0,             // aligned with Messages.jsx usage
    unread: row.unread || 0,                  // backward-compat alias
  };
}

function rowToMessage(row) {
  return {
    id: row.id,
    senderId: row.sender_id,
    text: row.text,
    // Use created_at as fallback since some rows store it there
    timestamp: row.timestamp || row.created_at,
    type: row.type || 'text',
  };
}

// Fetch all conversations for the logged-in user
// Conversations table has: id, task_id, client_id, participant_id, last_message, last_message_time, unread
export async function fetchConversations(userId) {
  let query = supabase
    .from('conversations')
    .select('*, profiles:participant_id(*), tasks:task_id(title)')
    .order('last_message_time', { ascending: false });

  // If userId is provided, filter to conversations this user is part of
  if (userId) {
    query = query.or(`client_id.eq.${userId},participant_id.eq.${userId}`);
  }

  const { data, error } = await query;
  if (error) { console.error('fetchConversations error:', error); return []; }
  return data.map(row => {
    const conv = rowToConversation(row, row.profiles);
    conv.taskTitle = row.tasks?.title || '';
    return conv;
  });
}

// Fetch a single conversation by ID
export async function fetchConversationById(id) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*, profiles:participant_id(*), tasks:task_id(title)')
    .eq('id', id)
    .single();
  if (error) { console.error('fetchConversationById error:', error); return null; }
  const conv = rowToConversation(data, data.profiles);
  conv.taskTitle = data.tasks?.title || '';
  return conv;
}

// Fetch all messages for a conversation
export async function fetchMessagesForConversation(conversationId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('timestamp', { ascending: true });
  if (error) { console.error('fetchMessagesForConversation error:', error); return []; }
  return data.map(rowToMessage);
}

// Send a new message
export async function sendMessage(conversationId, senderId, text, type = 'text') {
  const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  // Insert message
  const { error: msgError } = await supabase.from('messages').insert({
    id: msgId,
    conversation_id: conversationId,
    sender_id: senderId,
    text,
    timestamp: now,
    type,
  });
  if (msgError) { console.error('sendMessage error:', msgError); return null; }

  // Update conversation's last message + increment unread for the OTHER participant
  const { data: conv } = await supabase
    .from('conversations')
    .select('unread, client_id, participant_id')
    .eq('id', conversationId)
    .single();

  const currentUnread = conv?.unread || 0;
  await supabase
    .from('conversations')
    .update({ 
      last_message: type === 'image' ? '📷 Photo' : text, 
      last_message_time: now,
      unread: currentUnread + 1,
    })
    .eq('id', conversationId);

  return { id: msgId, senderId, text, timestamp: now, type };
}

// Fetch or create conversation between client and runner for a task
export async function fetchOrCreateConversation(taskId, participantId) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('task_id', taskId)
    .eq('participant_id', participantId)
    .maybeSingle();
  
  if (error) {
    console.error('fetchOrCreateConversation check error:', error);
  }
  if (data) return data;
  
  const id = `conv-${Date.now()}`;
  const { data: newConv, error: createError } = await supabase
    .from('conversations')
    .insert({
      id,
      task_id: taskId,
      participant_id: participantId,
      last_message: 'Conversation started',
      last_message_time: new Date().toISOString(),
      unread: 0
    })
    .select()
    .single();
    
  if (createError) {
    console.error('fetchOrCreateConversation create error:', createError);
    return null;
  }
  return newConv;
}

// Mark conversation as read (clear unread count)
export async function markConversationAsRead(conversationId) {
  const { error } = await supabase
    .from('conversations')
    .update({ unread: 0 })
    .eq('id', conversationId);
  if (error) console.error('markConversationAsRead error:', error);
}
