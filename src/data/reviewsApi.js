import { supabase } from '../utils/supabaseClient';

export async function submitReview({ taskId, reviewerId, revieweeId, rating, comment }) {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      task_id: taskId,
      reviewer_id: reviewerId,
      reviewee_id: revieweeId,
      rating: Number(rating),
      comment,
    })
    .select()
    .single();

  if (error) {
    console.error('submitReview error:', error);
    return null;
  }
  return data;
}

export async function submitSupportTicket({ userId, subject, message }) {
  const { data, error } = await supabase
    .from('support_tickets')
    .insert({
      user_id: userId,
      subject,
      message,
    })
    .select()
    .single();

  if (error) {
    console.error('submitSupportTicket error:', error);
    return null;
  }
  return data;
}

export async function fetchReviewsForUser(userId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles:reviewer_id(*)')
    .eq('reviewee_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchReviewsForUser error:', error); return []; }
  return data;
}
