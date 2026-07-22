import { supabase } from '../utils/supabaseClient';

// Helper to convert DB row to UI shape
function rowToConversation(row, currentUserId) {
  // Determine which profile is the OTHER participant
  const isUserParticipant = row.participant_id === currentUserId;
  const otherProfile = isUserParticipant 
    ? (row.client || row.profiles)
    : (row.participant || row.profiles);

  return {
    id: row.id,
    taskId: row.task_id,
    taskTitle: row.tasks?.title || '',
    participantId: isUserParticipant ? row.client_id : row.participant_id,
    participantName: otherProfile?.name || 'User',
    participantInitials: otherProfile?.initials || (otherProfile?.name ? otherProfile.name.slice(0, 2).toUpperCase() : '??'),
    participantPhone: otherProfile?.phone || '',
    lastMessageText: row.last_message,
    lastMessage: row.last_message,
    lastMessageTime: row.last_message_time,
    unreadCount: row.unread || 0,
    unread: row.unread || 0,
  };
}

function rowToMessage(row) {
  return {
    id: row.id,
    senderId: row.sender_id,
    text: row.text,
    timestamp: row.timestamp || row.created_at,
    type: row.type || 'text',
  };
}

// Fetch all conversations for the logged-in user
export async function fetchConversations(userId) {
  let query = supabase
    .from('conversations')
    .select('*, client:client_id(*), participant:participant_id(*), profiles:participant_id(*), tasks:task_id(title)')
    .order('last_message_time', { ascending: false });

  if (userId) {
    query = query.or(`client_id.eq.${userId},participant_id.eq.${userId}`);
  }

  const { data, error } = await query;
  if (error) { console.error('fetchConversations error:', error); return []; }
  return data.map(row => rowToConversation(row, userId));
}

// Fetch a single conversation by ID with two-way participant resolution
export async function fetchConversationById(id, currentUserId) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*, client:client_id(*), participant:participant_id(*), profiles:participant_id(*), tasks:task_id(title)')
    .eq('id', id)
    .single();
  if (error) { console.error('fetchConversationById error:', error); return null; }
  return rowToConversation(data, currentUserId);
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
    .select('unread')
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

// Send automated system notification message inside chat
export async function sendSystemMessage(conversationId, text) {
  return sendMessage(conversationId, 'system', text, 'system');
}

// Fetch or create conversation between client and runner for a task
export async function fetchOrCreateConversation(taskId, participantId, clientId) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('task_id', taskId)
    .or(`participant_id.eq.${participantId},client_id.eq.${participantId}`)
    .maybeSingle();
  
  if (error) {
    console.error('fetchOrCreateConversation check error:', error);
  }
  if (data) return data;

  // Resolve client ID from task if missing
  let taskClientId = clientId;
  if (!taskClientId) {
    const { data: taskData } = await supabase
      .from('tasks')
      .select('client_id, user_id')
      .eq('id', taskId)
      .maybeSingle();
    taskClientId = taskData?.client_id || taskData?.user_id || null;
  }
  
  const id = `conv-${Date.now()}`;
  const { data: newConv, error: createError } = await supabase
    .from('conversations')
    .insert({
      id,
      task_id: taskId,
      client_id: taskClientId,
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
