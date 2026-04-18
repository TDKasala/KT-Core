import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface Organization {
  id: string;
  name: string;
  type: string;
  created_at: string;
}

export interface MembershipType {
  role: string;
  organization_id: string;
  organizations: Organization;
}

const STORAGE_KEY = 'supabase_selected_organization_id';

export function useCurrentOrganization() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganizationState] = useState<Organization | null>(null);
  const [memberships, setMemberships] = useState<MembershipType[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchMemberships() {
      try {
        setIsLoading(true);
        
        // 1. Get current logged-in user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          if (isMounted) setIsLoading(false);
          return;
        }

        // 2. Fetch memberships along with the linked organization data
        const { data, error } = await supabase
          .from('memberships')
          .select(`
            role,
            organization_id,
            organizations (*)
          `)
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }

        if (data && isMounted) {
          // Type casting because we know the relation is one-to-one from membership -> organization
          const fetchedMemberships = data as unknown as MembershipType[];
          setMemberships(fetchedMemberships);
          
          // Extract just the organization objects into an array
          const orgs = fetchedMemberships
            .map(m => m.organizations)
            .filter(Boolean); // Filter out any nulls just in case
            
          setOrganizations(orgs);

          // 3. Determine previously selected organization from localStorage
          const savedId = localStorage.getItem(STORAGE_KEY);
          let selected = null;

          if (savedId) {
            selected = orgs.find(o => o.id === savedId) || null;
          }

          // If no explicitly saved (or matched) organization, default to the first one available
          if (!selected && orgs.length > 0) {
            selected = orgs[0];
            localStorage.setItem(STORAGE_KEY, selected.id);
          }

          setCurrentOrganizationState(selected);
          
          // Determine the user's role in the currently selected organization
          if (selected) {
            const currentMembership = fetchedMemberships.find(m => m.organization_id === selected.id);
            setRole(currentMembership ? currentMembership.role : null);
          }
        }
      } catch (error) {
        console.error('Failed to fetch memberships:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchMemberships();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Helper function to change the current organization
   * Updates state, recalculates role, and stores the newly selected ID in localStorage.
   */
  const setCurrentOrganization = (orgId: string) => {
    const selected = organizations.find(o => o.id === orgId) || null;
    setCurrentOrganizationState(selected);
    
    if (selected) {
      localStorage.setItem(STORAGE_KEY, selected.id);
      const currentMembership = memberships.find(m => m.organization_id === selected.id);
      setRole(currentMembership ? currentMembership.role : null);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setRole(null);
    }
  };

  return {
    organizations,
    currentOrganization,
    setCurrentOrganization,
    role,
    isLoading
  };
}
