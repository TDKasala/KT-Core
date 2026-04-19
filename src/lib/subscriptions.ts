import { supabase } from './supabaseClient';

export interface Subscription {
  id: string;
  organization_id: string;
  plan: string;
  status: 'active' | 'inactive' | 'canceled';
  expires_at: string | null;
  created_at: string;
}

export async function getAllSubscriptions() {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      organizations(name)
    `);

  if (error) {
    if (error.code === '42P01') {
      // Table doesn't exist yet, return empty to not break the UI
      return [];
    }
    console.error('Error fetching subscriptions:', error);
    return []; // Return empty array on error for resilience
  }

  return data;
}

export async function upsertSubscription(orgId: string, plan: string, status: string, expiresAt: string | null) {
  const { data, error } = await supabase
    .from('subscriptions')
    .upsert([{
      organization_id: orgId,
      plan,
      status,
      expires_at: expiresAt
    }], { onConflict: 'organization_id' })
    .select()
    .single();

  if (error) {
    console.error('Error upserting subscription:', error);
    throw error;
  }

  return data;
}

export async function getOverviewStats() {
  try {
    const [orgsRes, usersRes, subsRes] = await Promise.all([
      supabase.from('organizations').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active')
    ]);

    return {
      orgs: orgsRes.count || 0,
      users: usersRes.count || 0,
      activeSubs: subsRes.count || 0
    };
  } catch (error) {
    console.error('Error fetching global stats:', error);
    return { orgs: 0, users: 0, activeSubs: 0 };
  }
}
