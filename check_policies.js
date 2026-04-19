import { supabase } from './src/lib/supabaseClient.js';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkPolicies() {
  const { data, error } = await supabase.rpc('get_policies'); // That probably doesn't exist
  // We can't query pg_catalog directly with supabase-js unless we have service role or postgres connection.
  console.log(data);
}
checkPolicies();
