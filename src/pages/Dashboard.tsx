import { useCurrentOrganization } from '../hooks/useCurrentOrganization';
import { signOut } from '../lib/auth';

export default function Dashboard() {
  const { currentOrganization, role } = useCurrentOrganization();

  const handleSignOut = async () => {
    // AuthGuard automatically redirects to /login sequentially
    await signOut();
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#ededed] font-['Helvetica_Neue',Helvetica,Arial,sans-serif] p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        
        <header className="flex items-center justify-between border-b border-[#2e2e2e] pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
            <p className="text-[#a0a0a0] mt-1 text-sm">Bienvenue dans votre espace de travail</p>
          </div>
          
          <button 
            onClick={handleSignOut}
            className="font-mono text-[11px] uppercase tracking-wider text-[#ff5f56] border border-[#ff5f56]/30 bg-[#ff5f56]/5 hover:bg-[#ff5f56]/10 px-4 py-2 rounded transition-colors"
          >
            Se déconnecter
          </button>
        </header>

        <section className="bg-[#181818] border border-[#2e2e2e] rounded p-6">
          <h2 className="text-lg font-bold border-b border-[#2e2e2e] pb-4 mb-4 relative after:absolute after:bottom-0 after:left-0 after:w-8 after:h-[1px] after:bg-[#3ecf8e]">
            Espace de travail sélectionné
          </h2>
          
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-[120px_1fr] items-center text-sm">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#a0a0a0]">Organization</span>
              <span className="text-[#ededed] font-medium">{currentOrganization?.name || 'Chargement...'}</span>
            </div>
            
            <div className="grid grid-cols-[120px_1fr] items-center text-sm">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#a0a0a0]">Type</span>
              <span className="text-[#ededed] capitalize border border-[#2e2e2e] bg-[#000] px-2 py-0.5 rounded inline-flex w-max text-xs">
                {currentOrganization?.type || '...'}
              </span>
            </div>
            
            <div className="grid grid-cols-[120px_1fr] items-center text-sm mt-3 pt-3 border-t border-[#2e2e2e]/50">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#a0a0a0]">Votre rôle</span>
              <span className="text-[#3ecf8e] font-mono text-[11px] uppercase tracking-wide">
                {role || '...'}
              </span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
