import { createClient } from '@supabase/supabase-js';

// Note: In Vite applications, environment variables are exposed via import.meta.env
// and must be prefixed with VITE_. If you strictly need NEXT_PUBLIC_, it would require
// custom Vite configuration. We map it here primarily for the VITE_ equivalent.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase environment variables. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

// Initialize and export the Supabase client
// We provide placeholder fallbacks to prevent the application from crashing on load 
// when the environment variables are not yet configured.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);
