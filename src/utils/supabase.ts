import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

// Using the provided URL and Key as fallbacks to ensure the client initializes
export const supabase = createClient(
  supabaseUrl || 'https://bkakcnintlflqfndzccl.supabase.co',
  supabaseKey || 'sb_publishable_PO3or2oK1EAtfyQV0JJGXQ_QRlvNgte'
);
