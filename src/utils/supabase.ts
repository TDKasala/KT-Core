import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || 'https://bkakcnintlflqfndzccl.supabase.co').trim();
const supabaseKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrYWtjbmludGxmbHFmbmR6Y2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NDAwMDEsImV4cCI6MjA5MjExNjAwMX0.nxolAQ5DjEMyFxYCSFSbSjd1mZ16zZVsux_lEC_H50A').trim();

// Using the provided URL and Key as fallbacks to ensure the client initializes
export const supabase = createClient(supabaseUrl, supabaseKey);
