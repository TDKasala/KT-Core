import { supabase } from '../lib/supabaseClient';
import { getCurrentOrganizationId } from '../lib/organizations';

export interface Branch {
  id: string;
  organization_id: string;
  name: string;
  location: string;
  created_at: string;
}

/**
 * Creates a new branch for the currently active organization.
 */
export async function createBranch(name: string, location: string, organization_id?: string) {
  const orgId = organization_id || getCurrentOrganizationId();
  
  const { data, error } = await supabase
    .from('branches')
    .insert([{
      name,
      location,
      organization_id: orgId
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating branch:', error.message);
    throw error;
  }

  return data as Branch;
}

/**
 * Fetches all branches belonging to the currently active organization.
 */
export async function getBranches(organization_id?: string) {
  const orgId = organization_id || getCurrentOrganizationId();
  
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching branches:', error.message);
    throw error;
  }

  return data as Branch[];
}
