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

// Default simulated user id — stored in localStorage so the user can switch
const DEFAULT_USER_ID = 'client-1';

export function getCurrentUserId() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('ghrad_current_user') || DEFAULT_USER_ID;
  }
  return DEFAULT_USER_ID;
}

export function setCurrentUserId(id) {
  localStorage.setItem('ghrad_current_user', id);
}

export async function fetchCurrentUser() {
  const id = getCurrentUserId();
  return fetchProfileById(id);
}
