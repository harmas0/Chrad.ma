import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qmnyfzshxvegjapmmrbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbnlmenNoeHZlZ2phcG1tcmJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NTExNTYsImV4cCI6MjA5OTUyNzE1Nn0.gIZvdKCxgJMPSXSgmh7Et6881sPa9J1KgXhQb3GlYU0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
