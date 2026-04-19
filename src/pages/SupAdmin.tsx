import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CreditCard, 
  LayoutDashboard, 
  LogOut, 
  PackageSearch, 
  ShieldAlert,
  Search,
  ArrowRight,
  ArrowLeft,
  Users,
  Store,
  Menu,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { getAllOrganizations } from '../lib/organizations';
import { getOrganizationProducts, getAllProducts, setProductActiveState, getAllOrganizationProducts, type OrganizationProduct, type Product } from '../lib/products';
import { getOverviewStats, getAllSubscriptions, upsertSubscription, type Subscription } from '../lib/subscriptions';

type Tab = 'overview' | 'organizations' | 'products' | 'subscriptions';

export default function SupAdmin() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const tabs = [
    { id: 'overview', label: "Vue d'ensemble", icon: LayoutDashboard },
    { id: 'organizations', label: 'Organisations', icon: Building2 },
    { id: 'products', label: 'Produits KT', icon: PackageSearch },
    { id: 'subscriptions', label: 'Abonnements', icon: CreditCard },
  ] as const;

  return (
    <div className="flex h-screen bg-[#121212] text-[#ededed] font-['Inter',sans-serif]">
      {/* Mobile Menu Toggle (Visible only on mobile) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#181818] border-b border-[#2e2e2e] z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-2 text-[#3ecf8e] font-bold tracking-tight">
          <ShieldAlert size={20} />
          <span>Kasala SuperAdmin</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-[#a0a0a0] p-2 -mr-2">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#181818] border-r border-[#2e2e2e] flex flex-col shrink-0
        transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-[#2e2e2e] mt-16 md:mt-0">
          <div className="hidden md:flex items-center gap-2 text-[#3ecf8e] font-bold tracking-tight">
            <ShieldAlert size={20} />
            <span>Kasala SuperAdmin</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsMobileMenuOpen(false); // Close menu on select
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
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-[#a0a0a0] hover:text-[#ff5f56] hover:bg-[#ff5f56]/10"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden pt-16 md:pt-0">
        <header className="hidden md:flex h-16 border-b border-[#2e2e2e] bg-[#181818]/50 items-center px-8 shrink-0">
          <h1 className="text-xl font-bold">
            {tabs.find(t => t.id === activeTab)?.label || 'Dashboard'}
          </h1>
        </header>

        {/* Mobile Header Title */}
        <header className="md:hidden px-6 pt-6 pb-2 shrink-0">
          <h1 className="text-xl font-bold">
            {tabs.find(t => t.id === activeTab)?.label || 'Dashboard'}
          </h1>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <div className="max-w-6xl mx-auto h-full">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'organizations' && <OrganizationsTab />}
            {activeTab === 'products' && <ProductsTab />}
            {activeTab === 'subscriptions' && <SubscriptionsTab />}
          </div>
        </div>
      </main>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
        />
      )}
    </div>
  );
}

function OverviewTab() {
  const [stats, setStats] = useState({ orgs: 0, users: 0, activeSubs: 0 });

  useEffect(() => {
    getOverviewStats().then(setStats).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#181818] border border-[#2e2e2e] p-6 rounded-xl transition-colors hover:border-[#3ecf8e]/50 cursor-default">
          <h3 className="text-[#a0a0a0] text-sm font-medium mb-2">Total Organisations</h3>
          <p className="text-3xl font-bold font-mono">{stats.orgs}</p>
        </div>
        <div className="bg-[#181818] border border-[#2e2e2e] p-6 rounded-xl transition-colors hover:border-[#3ecf8e]/50 cursor-default">
          <h3 className="text-[#a0a0a0] text-sm font-medium mb-2">Abonnements Actifs</h3>
          <p className="text-3xl font-bold font-mono text-[#3ecf8e]">{stats.activeSubs}</p>
        </div>
        <div className="bg-[#181818] border border-[#2e2e2e] p-6 rounded-xl transition-colors hover:border-[#3ecf8e]/50 cursor-default">
          <h3 className="text-[#a0a0a0] text-sm font-medium mb-2">Total Utilisateurs</h3>
          <p className="text-3xl font-bold font-mono">{stats.users}</p>
        </div>
      </div>
      
      <div className="bg-[#181818] border border-[#2e2e2e] rounded-xl flex flex-col items-center justify-center py-20 text-[#a0a0a0]">
        <LayoutDashboard size={48} className="opacity-20 mb-4" />
        <p className="font-mono text-sm uppercase tracking-widest text-center">Graphiques & Analytique<br/><span className="text-[10px] lowercase opacity-50">En cours de développement</span></p>
      </div>
    </div>
  );
}

function OrganizationsTab() {
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrgs() {
      try {
        const data = await getAllOrganizations();
        setOrganizations(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrgs();
  }, [selectedOrgId]); // Refresh list when we go back

  if (selectedOrgId) {
    return <OrganizationDetail orgId={selectedOrgId} onBack={() => setSelectedOrgId(null)} />;
  }

  const filteredOrgs = organizations.filter(org => 
    org.name?.toLowerCase().includes(search.toLowerCase()) || 
    org.type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a0a0]" />
          <input 
            type="text" 
            placeholder="Rechercher une organisation..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#181818] border border-[#2e2e2e] rounded-lg pl-9 pr-4 py-2 text-sm focus:border-[#3ecf8e] transition-colors"
          />
        </div>
      </div>

      <div className="bg-[#181818] border border-[#2e2e2e] rounded-xl overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead className="bg-[#121212] border-b border-[#2e2e2e] text-[#a0a0a0]">
            <tr>
              <th className="px-6 py-3 font-medium">Nom de l'organisation</th>
              <th className="px-6 py-3 font-medium">Type</th>
              <th className="px-6 py-3 font-medium">Date de création</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e2e2e]">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-[#a0a0a0]">Chargement...</td>
              </tr>
            ) : filteredOrgs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-[#a0a0a0]">Aucune organisation trouvée.</td>
              </tr>
            ) : (
              filteredOrgs.map((org) => (
                <tr key={org.id} className="hover:bg-[#2e2e2e]/30 transition-colors">
                  <td className="px-6 py-4 font-bold">{org.name}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full bg-[#2e2e2e] text-xs font-mono">
                      {org.type || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#a0a0a0] font-mono text-xs">
                    {new Date(org.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedOrgId(org.id)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#3ecf8e] hover:text-[#32b279] transition-colors"
                    >
                      Détails <ArrowRight size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrganizationDetail({ orgId, onBack }: { orgId: string, onBack: () => void }) {
  const [org, setOrg] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [orgProducts, setOrgProducts] = useState<OrganizationProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        // 1. Org Info
        const { data: orgData } = await supabase.from('organizations').select('*').eq('id', orgId).single();
        setOrg(orgData);

        // 2. Branches
        const { data: branchData } = await supabase.from('branches').select('*').eq('organization_id', orgId);
        setBranches(branchData || []);

        // 3. Memberships
        const { data: memberData } = await supabase.from('memberships').select('*').eq('organization_id', orgId);
        setMembers(memberData || []);

        // 4. Products
        const [catData, activeData] = await Promise.all([
          getAllProducts(),
          getOrganizationProducts(orgId)
        ]);
        setAllProducts(catData);
        setOrgProducts(activeData);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [orgId]);

  const toggleProduct = async (productId: string, currentActiveStatus: boolean) => {
    setIsToggling(productId);
    try {
      await setProductActiveState(productId, orgId, !currentActiveStatus);
      // Refresh active products
      const newActive = await getOrganizationProducts(orgId);
      setOrgProducts(newActive);
    } catch (err) {
      alert("Erreur lors de la modification de l'accès produit.");
    } finally {
      setIsToggling(null);
    }
  };

  if (isLoading || !org) return <div className="text-center text-[#a0a0a0] py-12">Chargement du profil...</div>;

  return (
    <div className="space-y-6">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-[#a0a0a0] hover:text-[#ededed] transition-colors text-sm font-medium"
      >
        <ArrowLeft size={16} /> Retour à la liste
      </button>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">{org.name}</h2>
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-md bg-[#2e2e2e] text-xs font-mono">{org.type}</span>
            <span className="px-2.5 py-1 rounded-md bg-[#2e2e2e] text-xs font-mono">
              Créé le {new Date(org.created_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Products Access Panel */}
        <div className="bg-[#181818] border border-[#2e2e2e] rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold flex items-center gap-2"><PackageSearch size={18} className="text-[#3ecf8e]" /> Accès Produits (Licences)</h3>
          </div>
          <div className="space-y-3">
            {allProducts.map(product => {
              const activeStatus = orgProducts.find(op => op.product_id === product.id)?.is_active || false;
              const isWorking = isToggling === product.id;

              return (
                <div key={product.id} className="flex items-center justify-between p-3 rounded-lg border border-[#2e2e2e] bg-[#121212]">
                  <div>
                    <h4 className="font-bold text-sm">{product.name}</h4>
                    <p className="text-xs text-[#a0a0a0] font-mono">{product.code}</p>
                  </div>
                  <button 
                    onClick={() => toggleProduct(product.id, activeStatus)}
                    disabled={isWorking}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeStatus 
                        ? 'bg-[#3ecf8e]/20 text-[#3ecf8e] border border-[#3ecf8e]/30 hover:bg-[#ff5f56]/20 hover:text-[#ff5f56] hover:border-[#ff5f56]/30'
                        : 'bg-[#2e2e2e] text-[#a0a0a0] hover:bg-[#3ecf8e] hover:text-black'
                    }`}
                  >
                    {isWorking ? '...' : activeStatus ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Branches Panel */}
        <div className="space-y-6">
          <div className="bg-[#181818] border border-[#2e2e2e] rounded-xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Store size={18} className="text-[#3ecf8e]" /> Succursales ({branches.length})</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {branches.length === 0 ? (
                <p className="text-sm text-[#a0a0a0] italic">Aucune succursale.</p>
              ) : (
                branches.map(b => (
                  <div key={b.id} className="p-3 bg-[#121212] rounded border border-[#2e2e2e] text-sm">
                    <span className="font-bold">{b.name}</span> <span className="text-[#a0a0a0]">({b.location})</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[#181818] border border-[#2e2e2e] rounded-xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Users size={18} className="text-[#3ecf8e]" /> Utilisateurs ({members.length})</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {members.length === 0 ? (
                <p className="text-sm text-[#a0a0a0] italic">Aucun utilisateur.</p>
              ) : (
                members.map(m => (
                  <div key={m.id} className="p-3 bg-[#121212] rounded border border-[#2e2e2e] flex justify-between items-center">
                    <span className="text-sm font-mono truncate mr-2" title={m.user_id}>{m.user_id.split('-')[0]}***</span>
                    <span className="px-2 py-0.5 rounded bg-[#3ecf8e]/10 text-[#3ecf8e] text-[10px] font-mono uppercase">
                      {m.role}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [orgProducts, setOrgProducts] = useState<OrganizationProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [togglingMap, setTogglingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadData() {
      try {
        const [prods, orgs, links] = await Promise.all([
          getAllProducts(),
          getAllOrganizations(),
          getAllOrganizationProducts()
        ]);
        setProducts(prods);
        setOrganizations(orgs || []);
        setOrgProducts(links);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleToggle = async (orgId: string, productId: string, currentStatus: boolean) => {
    const key = `${orgId}-${productId}`;
    
    // Optimistic Update
    setTogglingMap(prev => ({ ...prev, [key]: true }));
    setOrgProducts(prev => {
      const exists = prev.find(p => p.organization_id === orgId && p.product_id === productId);
      if (exists) {
        return prev.map(p => p.id === exists.id ? { ...p, is_active: !currentStatus } : p);
      } else {
        return [...prev, { id: 'temp-id', organization_id: orgId, product_id: productId, is_active: !currentStatus }];
      }
    });

    try {
      const updated = await setProductActiveState(productId, orgId, !currentStatus);
      // Sync real ID back
      setOrgProducts(prev => prev.map(p => 
        (p.organization_id === orgId && p.product_id === productId) ? updated : p
      ));
    } catch (err) {
      alert("Erreur lors de la mise à jour.");
      // Rollback
      setOrgProducts(prev => {
        const exists = prev.find(p => p.organization_id === orgId && p.product_id === productId);
        if (exists) {
          return prev.map(p => p.id === exists.id ? { ...p, is_active: currentStatus } : p);
        }
        return prev;
      });
    } finally {
      setTogglingMap(prev => ({ ...prev, [key]: false }));
    }
  };

  if (isLoading) {
    return <div className="text-center text-[#a0a0a0] py-12">Chargement du catalogue...</div>;
  }

  if (selectedProductId) {
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return null;

    const filteredOrgs = organizations.filter(org => 
      org.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSelectedProductId(null)}
          className="flex items-center gap-2 text-[#a0a0a0] hover:text-[#ededed] transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} /> Retour au catalogue
        </button>

        <div className="bg-[#181818] border border-[#2e2e2e] p-6 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-[#3ecf8e]/10 rounded-lg flex items-center justify-center text-[#3ecf8e]">
            <PackageSearch size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#ededed]">{product.name}</h2>
            <p className="text-sm font-mono text-[#a0a0a0]">{product.code}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="font-bold">Déploiement Clients</h3>
          <div className="relative w-full md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a0a0]" />
            <input 
              type="text" 
              placeholder="Rechercher une orga..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#181818] border border-[#2e2e2e] rounded-lg pl-9 pr-4 py-2 text-sm focus:border-[#3ecf8e] transition-colors"
            />
          </div>
        </div>

        <div className="bg-[#181818] border border-[#2e2e2e] rounded-xl overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-[#121212] border-b border-[#2e2e2e] text-[#a0a0a0]">
              <tr>
                <th className="px-6 py-3 font-medium">Organisation</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium text-right">Statut / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2e2e]">
              {filteredOrgs.map(org => {
                const link = orgProducts.find(op => op.product_id === product.id && op.organization_id === org.id);
                const isActive = link?.is_active || false;
                const isWorking = togglingMap[`${org.id}-${product.id}`];

                return (
                  <tr key={org.id} className="hover:bg-[#2e2e2e]/30 transition-colors">
                    <td className="px-6 py-4 font-bold">{org.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-[#2e2e2e] text-xs font-mono">
                        {org.type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleToggle(org.id, product.id, isActive)}
                        disabled={isWorking}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all w-32 justify-center flex ml-auto ${
                          isActive 
                            ? 'bg-[#3ecf8e]/20 text-[#3ecf8e] border border-[#3ecf8e]/30 hover:bg-[#ff5f56]/20 hover:text-[#ff5f56] hover:border-[#ff5f56]/30'
                            : 'bg-[#2e2e2e] text-[#a0a0a0] hover:bg-[#3ecf8e] hover:text-black border border-transparent'
                        }`}
                      >
                        {isWorking ? <span className="animate-pulse">...</span> : isActive ? 'Actif' : 'Désactivé'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => {
          const activesCount = orgProducts.filter(op => op.product_id === product.id && op.is_active).length;
          return (
            <div 
              key={product.id} 
              className="bg-[#181818] border border-[#2e2e2e] rounded-xl p-6 transition-all hover:border-[#3ecf8e]/50 cursor-pointer group"
              onClick={() => {
                setSearch('');
                setSelectedProductId(product.id);
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-[#3ecf8e]/10 rounded-lg flex items-center justify-center text-[#3ecf8e] group-hover:scale-110 transition-transform">
                  <PackageSearch size={24} />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#2e2e2e] text-[#a0a0a0] text-xs font-mono">
                  {activesCount} client{activesCount !== 1 ? 's' : ''}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#ededed] mb-1">{product.name}</h3>
              <p className="text-sm font-mono text-[#a0a0a0]">{product.code}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SubscriptionsTab() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Edit State
  const [editPlan, setEditPlan] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editExpires, setEditExpires] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [subs, orgs] = await Promise.all([
          getAllSubscriptions(),
          getAllOrganizations()
        ]);
        setSubscriptions(subs || []);
        setOrganizations(orgs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const openEditor = (orgId: string, currentSub: any) => {
    setEditingId(orgId);
    setEditPlan(currentSub?.plan || 'basic');
    setEditStatus(currentSub?.status || 'inactive');
    setEditExpires(currentSub?.expires_at ? new Date(currentSub.expires_at).toISOString().split('T')[0] : '');
  };

  const handleSave = async (orgId: string) => {
    try {
      const expDate = editExpires ? new Date(editExpires).toISOString() : null;
      const updated = await upsertSubscription(orgId, editPlan, editStatus, expDate);
      
      // Update local state
      setSubscriptions(prev => {
        const filtered = prev.filter(s => s.organization_id !== orgId);
        const orgName = organizations.find(o => o.id === orgId)?.name || '';
        return [...filtered, { ...updated, organizations: { name: orgName } }];
      });
      setEditingId(null);
    } catch (err) {
      alert("Erreur lors de la sauvegarde de l'abonnement.");
    }
  };

  const filteredOrgs = organizations.filter(org => 
    org.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold">Abonnements globaux</h2>
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a0a0]" />
          <input 
            type="text" 
            placeholder="Rechercher par organisation..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#181818] border border-[#2e2e2e] rounded-lg pl-9 pr-4 py-2 text-sm focus:border-[#3ecf8e] transition-colors"
          />
        </div>
      </div>

      <div className="bg-[#181818] border border-[#2e2e2e] rounded-xl overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead className="bg-[#121212] border-b border-[#2e2e2e] text-[#a0a0a0]">
            <tr>
              <th className="px-6 py-3 font-medium">Organisation</th>
              <th className="px-6 py-3 font-medium">Plan</th>
              <th className="px-6 py-3 font-medium">Statut</th>
              <th className="px-6 py-3 font-medium">Expiration</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e2e2e]">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-[#a0a0a0]">Chargement des abonnements...</td>
              </tr>
            ) : filteredOrgs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-[#a0a0a0]">Aucune organisation trouvée.</td>
              </tr>
            ) : (
              filteredOrgs.map(org => {
                const sub = subscriptions.find(s => s.organization_id === org.id);
                const isEditing = editingId === org.id;

                return (
                  <tr key={org.id} className="hover:bg-[#2e2e2e]/30 transition-colors">
                    <td className="px-6 py-4 font-bold">{org.name}</td>
                    
                    {/* Plan Column */}
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <select 
                          value={editPlan} 
                          onChange={(e) => setEditPlan(e.target.value)}
                          className="bg-[#121212] border border-[#2e2e2e] rounded px-2 py-1 text-xs"
                        >
                          <option value="basic">Basic (Gratuit)</option>
                          <option value="premium">Premium</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md bg-[#2e2e2e] text-xs font-mono uppercase tracking-wider text-[#a0a0a0]">
                          {sub?.plan || 'Aucun'}
                        </span>
                      )}
                    </td>

                    {/* Status Column */}
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <select 
                          value={editStatus} 
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="bg-[#121212] border border-[#2e2e2e] rounded px-2 py-1 text-xs"
                        >
                          <option value="active">Actif</option>
                          <option value="inactive">Inactif</option>
                          <option value="canceled">Annulé</option>
                        </select>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          sub?.status === 'active' ? 'bg-[#3ecf8e]/20 text-[#3ecf8e]' : 
                          sub?.status === 'canceled' ? 'bg-[#ff5f56]/20 text-[#ff5f56]' : 
                          'bg-[#2e2e2e] text-[#a0a0a0]'
                        }`}>
                          {sub?.status === 'active' ? 'Actif' : sub?.status === 'canceled' ? 'Annulé' : 'Inactif'}
                        </span>
                      )}
                    </td>

                    {/* Expires Column */}
                    <td className="px-6 py-4 text-[#a0a0a0] font-mono text-xs">
                      {isEditing ? (
                        <input 
                          type="date"
                          value={editExpires}
                          onChange={(e) => setEditExpires(e.target.value)}
                          className="bg-[#121212] border border-[#2e2e2e] rounded px-2 py-1"
                        />
                      ) : (
                        sub?.expires_at ? new Date(sub.expires_at).toLocaleDateString('fr-FR') : 'Jamais'
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 py-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setEditingId(null)}
                            className="text-xs font-medium text-[#a0a0a0] hover:text-[#ededed]"
                          >
                            Annuler
                          </button>
                          <button 
                            onClick={() => handleSave(org.id)}
                            className="bg-[#3ecf8e] text-black text-xs font-bold px-3 py-1.5 rounded hover:bg-[#32b279]"
                          >
                            Enregistrer
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => openEditor(org.id, sub)}
                          className="text-xs font-medium text-[#3ecf8e] hover:text-[#32b279]"
                        >
                          Éditer
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

