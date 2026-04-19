import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  Package, 
  Box, 
  Users, 
  Settings,
  Store,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { useCurrentOrganization } from '../hooks/useCurrentOrganization';
import { useBranchStore } from '../store/useBranchStore';
import { getBranches } from '../components/branches';

type AdminTab = 'dashboard' | 'sales' | 'products' | 'inventory' | 'staff' | 'settings';

export default function Admin() {
  const navigate = useNavigate();
  const { currentOrganization, role } = useCurrentOrganization();
  const { currentBranch, setCurrentBranch } = useBranchStore();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    // Only let owners or admins see this? 
    if (role && role !== 'owner' && role !== 'admin') {
      navigate('/dashboard');
    }
  }, [role, navigate]);

  useEffect(() => {
    if (currentOrganization) {
      getBranches(currentOrganization.id).then(data => {
        setBranches(data || []);
        if (data && data.length > 0 && !currentBranch) {
          setCurrentBranch(data[0]);
        }
      });
    }
  }, [currentOrganization]);

  const tabs = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'sales', label: 'Ventes', icon: Receipt },
    { id: 'products', label: 'Produits', icon: Package },
    { id: 'inventory', label: 'Stock', icon: Box },
    { id: 'staff', label: 'Équipe', icon: Users },
    { id: 'settings', label: 'Réglages', icon: Settings },
  ] as const;

  return (
    <div className="flex h-screen bg-[#121212] text-[#ededed] font-['Inter',sans-serif]">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#181818] border-r border-[#2e2e2e] flex flex-col shrink-0
        transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-[#2e2e2e] mt-16 md:mt-0">
          <div className="flex items-center gap-2 text-[#ededed] font-bold tracking-tight truncate">
            <Store size={20} className="text-[#3ecf8e] shrink-0" />
            <span className="truncate">{currentOrganization?.name || 'Mon Organisation'}</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto w-full">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                  isActive 
                    ? 'bg-[#3ecf8e]/10 text-[#3ecf8e]' 
                    : 'text-[#a0a0a0] hover:text-[#ededed] hover:bg-[#2e2e2e]'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-[#2e2e2e]">
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full text-center px-3 py-2.5 rounded-lg transition-colors text-xs font-mono tracking-widest uppercase text-[#a0a0a0] hover:text-[#ededed] hover:bg-[#2e2e2e]"
          >
            Quitter
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Bar */}
        <header className="h-16 border-b border-[#2e2e2e] bg-[#181818]/50 flex items-center justify-between px-4 md:px-8 shrink-0 relative z-30">
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="text-[#a0a0a0] md:hidden"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg md:text-xl font-bold hidden md:block">
              {tabs.find(t => t.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <div className="flex flex-col items-end mr-4 hidden sm:flex">
              <span className="text-xs text-[#a0a0a0] font-mono leading-none mb-1">Espace</span>
              <span className="text-sm font-medium leading-none">{currentOrganization?.name || '...'}</span>
            </div>
            
            {/* Branch Selector */}
            <div className="relative">
              <select
                value={currentBranch?.id || ''}
                onChange={(e) => {
                  const branch = branches.find(b => b.id === e.target.value);
                  if (branch) setCurrentBranch(branch);
                }}
                className="appearance-none bg-[#121212] border border-[#2e2e2e] text-[#ededed] text-sm rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-[#3ecf8e] transition-colors"
                disabled={branches.length === 0}
              >
                {branches.length === 0 && <option value="">Aucune succursale</option>}
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a0a0] pointer-events-none" />
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Page Header for Mobile */}
            <h1 className="text-2xl font-bold mb-6 md:hidden">
              {tabs.find(t => t.id === activeTab)?.label}
            </h1>

            {activeTab === 'dashboard' && <PlaceholderTab icon={LayoutDashboard} name="Tableau de bord" />}
            {activeTab === 'sales' && <PlaceholderTab icon={Receipt} name="Ventes" />}
            {activeTab === 'products' && <PlaceholderTab icon={Package} name="Produits" />}
            {activeTab === 'inventory' && <PlaceholderTab icon={Box} name="Stock" />}
            {activeTab === 'staff' && <PlaceholderTab icon={Users} name="Équipe" />}
            {activeTab === 'settings' && <PlaceholderTab icon={Settings} name="Réglages" />}
          </div>
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
        />
      )}
    </div>
  );
}

function PlaceholderTab({ icon: Icon, name }: { icon: any, name: string }) {
  return (
    <div className="bg-[#181818] border border-[#2e2e2e] rounded-xl flex flex-col items-center justify-center py-32 text-[#a0a0a0]">
      <Icon size={48} className="opacity-20 mb-4" />
      <p className="font-mono text-sm uppercase tracking-widest text-center">{name}<br/><span className="text-[10px] lowercase opacity-50">Sera implémenté bientôt</span></p>
    </div>
  );
}
