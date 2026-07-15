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
    lastMessage: row.last_message,
    lastMessageTime: row.last_message_time,
    unread: row.unread,
  };
}

function rowToMessage(row) {
  return {
    id: row.id,
    senderId: row.sender_id,
    text: row.text,
    timestamp: row.timestamp,
    type: row.type,
  };
}

// Fetch all conversations with participant profile info
export async function fetchConversations() {
  const { data, error } = await supabase
    .from('conversations')
    .select('*, profiles:participant_id(*), tasks:task_id(title)')
    .order('last_message_time', { ascending: false });
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
export async function sendMessage(conversationId, senderId, text) {
  const id = `msg-${Date.now()}`;
  const now = new Date().toISOString();

  // Insert message
  const { error: msgError } = await supabase.from('messages').insert({
    id,
    conversation_id: conversationId,
    sender_id: senderId,
    text,
    timestamp: now,
    type: 'text',
  });
  if (msgError) { console.error('sendMessage error:', msgError); return null; }

  // Update conversation's last message
  await supabase
    .from('conversations')
    .update({ last_message: text, last_message_time: now })
    .eq('id', conversationId);

  return { id, senderId, text, timestamp: now, type: 'text' };
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
