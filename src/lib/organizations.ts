import { supabase } from './supabaseClient';

const STORAGE_KEY = 'supabase_selected_organization_id';

// Fallback UUID generator in case crypto.randomUUID is not available in non-secure contexts
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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
  // Generate ID on client to avoid needing a .select() on the organization insert
  // .select() fails because the membership isn't created yet (RLS blocks SELECT)
  const orgId = generateUUID();

  // 1. Create organization
  const { error: orgError } = await supabase
    .from('organizations')
    .insert([{ id: orgId, name, type }]);

  if (orgError) {
    console.error('Error creating organization:', orgError.message);
    throw orgError;
  }

  // 2. Insert membership
  const { error: membershipError } = await supabase
    .from('memberships')
    .insert([{
      user_id,
      organization_id: orgId,
      role: 'owner'
    }]);

  if (membershipError) {
    console.error('Error creating membership:', membershipError.message);
    throw membershipError;
  }

  // 3. Return the manually constructed organization object
  return { id: orgId, name, type };
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
