import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { isSuperAdmin } from '../lib/auth';

export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'authorized' | 'denied'>('loading');
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setStatus('denied');
        navigate('/login', { replace: true });
        return;
      }
      isSuperAdmin(user.id).then((isAdmin) => {
        if (isAdmin) {
          setStatus('authorized');
        } else {
          setStatus('denied');
          navigate('/dashboard', { replace: true });
        }
      });
    });
  }, [navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 flex items-center justify-center gap-1">
            <div className="w-2 h-2 bg-[#3ecf8e] rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-[#3ecf8e] rounded-full animate-bounce [animation-delay:0.2s]" />
            <div className="w-2 h-2 bg-[#3ecf8e] rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
          <p className="text-[#a0a0a0] font-mono text-[10px] uppercase tracking-widest animate-pulse">Vérification...</p>
        </div>
      </div>
    );
  }

  if (status === 'denied') return null;

  return <>{children}</>;
}
