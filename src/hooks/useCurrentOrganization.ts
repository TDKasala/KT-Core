import { useState, useEffect, useCallback } from 'react';
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

  const fetchMemberships = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('memberships')
        .select(`
          role,
          organization_id,
          organizations (*)
        `)
        .eq('user_id', userId);

      if (error) throw error;

      if (data) {
        const fetchedMemberships = data as unknown as MembershipType[];
        setMemberships(fetchedMemberships);
        
        const orgs = fetchedMemberships
          .map(m => m.organizations)
          .filter(Boolean);
          
        setOrganizations(orgs);

        const savedId = localStorage.getItem(STORAGE_KEY);
        let selected = null;

        if (savedId) {
          selected = orgs.find(o => o.id === savedId) || null;
        }

        if (!selected && orgs.length > 0) {
          selected = orgs[0];
          localStorage.setItem(STORAGE_KEY, selected.id);
        }

        setCurrentOrganizationState(selected);
        
        if (selected) {
          const currentMembership = fetchedMemberships.find(m => m.organization_id === selected.id);
          setRole(currentMembership ? currentMembership.role : null);
        } else {
          setRole(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch memberships:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let authSubscription: any = null;

    async function init() {
      // 1. Initial check
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && isMounted) {
        await fetchMemberships(session.user.id);
      } else if (isMounted) {
        setIsLoading(false);
      }

      // 2. Listen for auth changes to re-fetch
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!isMounted) return;
        
        if (session?.user) {
          await fetchMemberships(session.user.id);
        } else {
          setOrganizations([]);
          setCurrentOrganizationState(null);
          setMemberships([]);
          setRole(null);
          setIsLoading(false);
        }
      });
      authSubscription = subscription;
    }

    init();

    // 3. Mandatory timeout to prevent infinite loading state in case of network or internal hanging
    const timeoutId = setTimeout(() => {
      if (isMounted && isLoading) {
        console.warn('Organization loading timed out');
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      isMounted = false;
      if (authSubscription) authSubscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [fetchMemberships]);

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
