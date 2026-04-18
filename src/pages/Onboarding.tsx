import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { createOrganizationWithOwner } from '../lib/organizations';
import { ensureProfile } from '../lib/auth';

export default function Onboarding() {
  const [name, setName] = useState('');
  const [type, setType] = useState('retail');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non trouvé");
      
      console.log('Onboarding: Ensuring profile exists...');
      // 1. Ensure profile exists (timeout protected)
      await Promise.race([
        ensureProfile(user),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Délai d'attente dépassé (Profil)")), 8000))
      ]);
      
      console.log('Onboarding: Creating organization...');
      // 2. Create organization (timeout protected)
      await Promise.race([
        createOrganizationWithOwner(name, type, user.id),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Délai d'attente dépassé (Organisation)")), 8000))
      ]);
      
      console.log('Onboarding: Success, redirecting...');
      // Use replace for a cleaner transition that won't show 'loading' again if they hit back
      window.location.replace('/dashboard');
    } catch (err: any) {
      console.error('Onboarding Error:', err);
      setError(err.message || "Une erreur inattendue est survenue");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
      <div className="w-full max-w-md bg-[#181818] border border-[#2e2e2e] rounded p-8 flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-[#ededed] text-2xl font-bold tracking-tight relative inline-block pb-4 after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-10 after:h-[2px] after:bg-[#3ecf8e]">
            Configuration de l'espace
          </h1>
          <p className="text-[#a0a0a0] text-sm mt-6">
            Créez votre organisation.
          </p>
        </div>

        {error && (
          <div className="bg-[#ff5f56]/10 border border-[#ff5f56]/20 text-[#ff5f56] px-4 py-3 rounded text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase text-[#a0a0a0] tracking-widest">Nom de l'entreprise</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#000000] border border-[#2e2e2e] rounded px-4 py-3 text-[#ededed] text-sm focus:outline-none focus:border-[#3ecf8e] transition-colors"
              required
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase text-[#a0a0a0] tracking-widest">Secteur/Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-[#000000] border border-[#2e2e2e] rounded px-4 py-3 text-[#ededed] text-sm focus:outline-none focus:border-[#3ecf8e] transition-colors appearance-none"
            >
              <option value="school">École</option>
              <option value="business">Entreprise</option>
              <option value="retail">Vente au détail</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading || !name}
            className="mt-4 bg-[#3ecf8e] hover:bg-[#32b279] text-[#000] font-bold py-3 px-4 rounded transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Création...' : 'Créer l\'organisation'}
          </button>
        </form>
      </div>
    </div>
  );
}
