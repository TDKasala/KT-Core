import { createClient } from '@supabase/supabase-js';

// Note: In Vite applications, environment variables are exposed via import.meta.env
// and must be prefixed with VITE_. If you strictly need NEXT_PUBLIC_, it would require
// custom Vite configuration. We map it here primarily for the VITE_ equivalent.
const getEnvKey = () => {
  const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
  // If the env variable contains the old invalid key, ignore it and use fallback
  if (envKey && envKey.startsWith('sb_publishable_')) {
    return null;
  }
  return envKey;
};

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || 'https://bkakcnintlflqfndzccl.supabase.co').trim();
const supabaseAnonKey = (getEnvKey() || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrYWtjbmludGxmbHFmbmR6Y2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NDAwMDEsImV4cCI6MjA5MjExNjAwMX0.nxolAQ5DjEMyFxYCSFSbSjd1mZ16zZVsux_lEC_H50A').trim();

if (!supabaseUrl.includes('.') || supabaseAnonKey.length < 10) {
  console.warn(
    'Missing or invalid Supabase environment variables. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

// Initialize and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
