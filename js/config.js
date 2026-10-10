// Supabase Configuration & Client Initialization
const SUPABASE_URL = 'https://wqsgotvsxjlagztyoawp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indxc2dvdHZzeGpsYWd6dHlvYXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1NjcwNjQsImV4cCI6MjEwNzE0MzA2NH0.PJ9DkEhHjY2stfoZbrI_kxcnZbX40Gs3pXixaYfms1E';

// Set to false to use live Supabase database; fallback to dummy data if offline or tables not yet ready
const USE_DUMMY = false;

// Initialize Supabase JS Client
let supabaseClient = null;
if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function' && SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
  }
}
