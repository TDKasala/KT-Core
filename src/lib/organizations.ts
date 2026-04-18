import { supabase } from './supabaseClient';

const STORAGE_KEY = 'supabase_selected_organization_id';

/**
 * Helper to synchronously get the currently active organization_id.
 * This is populated initially by useCurrentOrganization hook.
 */
export function getCurrentOrganizationId(): string {
  const orgId = localStorage.getItem(STORAGE_KEY);
  if (!orgId) {
    throw new Error('No active organization selected. Ensure you are logged in and have selected a workspace.');
  }
  return orgId;
}

/**
 * Creates an organization and automatically assigns the user as the owner.
 */
export async function createOrganizationWithOwner(name: string, type: string, user_id: string) {
  // 1. Create organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert([{ name, type }])
    .select()
    .single();

  if (orgError) {
    console.error('Error creating organization:', orgError.message);
    throw orgError;
  }

  // 2. Insert membership with role = 'owner'
  const { error: membershipError } = await supabase
    .from('memberships')
    .insert([{
      user_id,
      organization_id: org.id,
      role: 'owner'
    }]);

  if (membershipError) {
    console.error('Error creating membership:', membershipError.message);
    // Ideally we would rollback the organization creation here, 
    // but the Supabase JS client doesn't support transactions yet.
    throw membershipError;
  }

  // 3. Return organization
  return org;
}

/**
 * Fetches all organizations (Super Admin only).
 */
export async function getAllOrganizations() {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('name');
    
  if (error) {
    console.error('Error fetching all organizations:', error.message);
    throw error;
  }
  
  return data;
}
