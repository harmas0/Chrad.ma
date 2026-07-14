import { supabase } from '../utils/supabaseClient';

// Fetch all profiles
export async function fetchProfiles() {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) { console.error('fetchProfiles error:', error); return []; }
  return data;
}

// Fetch a single profile by id
export async function fetchProfileById(id) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (error) { console.error('fetchProfileById error:', error); return null; }
  return data;
}

// Fetch runners only
export async function fetchRunners() {
  const { data, error } = await supabase.from('profiles').select('*').eq('is_runner', true);
  if (error) { console.error('fetchRunners error:', error); return []; }
  return data;
}

// Fetch the current authenticated user profile

export async function fetchCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    return fetchProfileById(session.user.id);
  }
  return null;
}

