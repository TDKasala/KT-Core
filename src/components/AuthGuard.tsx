import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useCurrentOrganization } from '../hooks/useCurrentOrganization';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { organizations, isLoading: isOrgLoading } = useCurrentOrganization();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 1. Initial check of session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    // 2. Listen to changes (login/logout events)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthenticated === false) {
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    } else if (isAuthenticated === true && !isOrgLoading) {
      if (organizations.length === 0) {
        if (location.pathname !== '/onboarding') {
          navigate('/onboarding', { replace: true });
        }
      } else {
        if (location.pathname === '/onboarding' || location.pathname === '/login' || location.pathname === '/') {
          navigate('/dashboard', { replace: true });
        }
      }
    }
  }, [isAuthenticated, isOrgLoading, organizations.length, navigate, location.pathname]);

  // Loading state blocking visual flash before accurate redirects hit
  // We add a safety check for isOrgLoading to ensure we don't hang if organizations are actually 
  // available but the hook hasn't toggled isLoading yet.
  const isReallyLoading = isAuthenticated === null || (isAuthenticated && isOrgLoading && organizations.length === 0);

  if (isReallyLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 flex items-center justify-center gap-1">
             <div className="w-2 h-2 bg-[#3ecf8e] rounded-full animate-bounce" />
             <div className="w-2 h-2 bg-[#3ecf8e] rounded-full animate-bounce [animation-delay:0.2s]" />
             <div className="w-2 h-2 bg-[#3ecf8e] rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
          <p className="text-[#a0a0a0] font-mono text-[10px] uppercase tracking-widest animate-pulse">Initialisation...</p>
        </div>
      </div>
    );
  }

  // Only render if we aren't about to redirect
  // i.e. NOT logged in AND on /login
  // OR Logged in AND NO orgs AND on /onboarding
  // OR Logged in AND HAS orgs AND NOT on /login or /onboarding
  const willRedirect = 
    (isAuthenticated === false && location.pathname !== '/login') ||
    (isAuthenticated === true && organizations.length === 0 && location.pathname !== '/onboarding') ||
    (isAuthenticated === true && organizations.length > 0 && (location.pathname === '/login' || location.pathname === '/onboarding'));

  if (willRedirect) return null;

  return <>{children}</>;
}
