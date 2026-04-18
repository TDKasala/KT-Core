import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { isSuperAdmin } from '../lib/auth';
import { getAllOrganizations } from '../lib/organizations';
import { getAllProducts, getOrganizationProducts, setProductActiveState, Product } from '../lib/products';

export default function Admin() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [orgProductsMap, setOrgProductsMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;
    async function checkAccess() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/login'); return; }
        
        // Block access unless explicitly verified against super_admins table
        const isAdmin = await isSuperAdmin(user.id);
        if (!isAdmin) { navigate('/dashboard'); return; }
        if (!mounted) return;
        
        // Fetch global state safely
        const [fetchedOrgs, fetchedProducts] = await Promise.all([
          getAllOrganizations(),
          getAllProducts()
        ]);
        
        setOrgs(fetchedOrgs);
        setProducts(fetchedProducts);
        setChecking(false);
      } catch (err) {
        console.error('Admin check failed', err);
        navigate('/dashboard');
      }
    }
    checkAccess();
    
    return () => { mounted = false; };
  }, [navigate]);

  useEffect(() => {
    if (!selectedOrgId) return;
    
    async function loadOrgProducts() {
      // Intentionally passing the explicit selectedOrgId to bypass local hooks logic
      const ops = await getOrganizationProducts(selectedOrgId);
      const map: Record<string, boolean> = {};
      ops.forEach(op => {
        map[op.product_id] = op.is_active;
      });
      setOrgProductsMap(map);
    }
    
    loadOrgProducts();
  }, [selectedOrgId]);

  const handleToggle = async (productId: string, currentIsActive: boolean) => {
    if (!selectedOrgId) return;
    
    try {
      const newStatus = !currentIsActive;
      // Optimistic UI update so controls feel instant
      setOrgProductsMap(prev => ({ ...prev, [productId]: newStatus }));
      await setProductActiveState(productId, selectedOrgId, newStatus);
    } catch (err) {
      console.error(err);
      // Revert optimism on structural failure
      setOrgProductsMap(prev => ({ ...prev, [productId]: currentIsActive }));
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="w-8 h-8 flex items-center justify-center gap-1">
           <div className="w-2 h-2 bg-[#3ecf8e] rounded-full animate-pulse" />
           <div className="w-2 h-2 bg-[#3ecf8e] rounded-full animate-pulse [animation-delay:0.2s]" />
           <div className="w-2 h-2 bg-[#3ecf8e] rounded-full animate-pulse [animation-delay:0.4s]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-[#ededed] font-['Helvetica_Neue',Helvetica,Arial,sans-serif] p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        
        <header className="flex items-center justify-between border-b border-[#2e2e2e] pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#3ecf8e]">Système Super Admin</h1>
            <p className="text-[#a0a0a0] mt-1 text-sm">Protocole de contrôle global des espaces</p>
          </div>
          
          <button 
            onClick={() => navigate('/dashboard')}
            className="font-mono text-[11px] uppercase tracking-wider text-[#a0a0a0] border border-[#2e2e2e] bg-[#181818] hover:bg-[#2e2e2e] px-4 py-2 rounded transition-colors"
          >
            Retour au tableau de bord
          </button>
        </header>

        <div className="grid grid-cols-[250px_1fr] gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-[#a0a0a0] mb-2 border-b border-[#2e2e2e] pb-2">Organisations</h2>
            {orgs.map(org => (
              <button
                key={org.id}
                onClick={() => setSelectedOrgId(org.id)}
                className={`text-left text-sm px-3 py-2 rounded border transition-colors ${
                  selectedOrgId === org.id 
                    ? 'bg-[#3ecf8e]/10 border-[#3ecf8e] text-[#3ecf8e]' 
                    : 'bg-[#181818] border-[#2e2e2e] text-[#ededed] hover:border-[#3ecf8e]/50'
                }`}
              >
                <div className="font-medium truncate">{org.name}</div>
                <div className="font-mono text-[10px] text-[#a0a0a0] capitalize mt-0.5">{org.type}</div>
              </button>
            ))}
            {orgs.length === 0 && <div className="text-xs text-[#a0a0a0]">Aucune organisation trouvée.</div>}
          </div>

          <div className="bg-[#181818] border border-[#2e2e2e] rounded p-6 h-fit">
            {!selectedOrgId ? (
              <div className="text-[#a0a0a0] text-sm text-center py-10 font-mono">
                Sélectionnez une organisation pour gérer les produits
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold border-b border-[#2e2e2e] pb-4 mb-4 relative after:absolute after:bottom-0 after:left-0 after:w-8 after:h-[1px] after:bg-[#3ecf8e]">
                  Configuration des produits
                </h2>
                <div className="flex flex-col gap-4">
                  {products.map(product => {
                    const isActive = !!orgProductsMap[product.id];
                    return (
                      <div key={product.id} className="flex items-center justify-between border-b border-[#2e2e2e]/50 pb-4 last:border-0 last:pb-0">
                        <div>
                          <div className="text-[#ededed] text-sm font-medium">{product.name}</div>
                          <div className="font-mono text-[10px] text-[#a0a0a0] mt-1">{product.code}</div>
                        </div>
                        <button
                          onClick={() => handleToggle(product.id, isActive)}
                          className={`font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded border transition-colors ${
                            isActive 
                              ? 'bg-[#3ecf8e]/10 border-[#3ecf8e] text-[#3ecf8e] hover:bg-[#ff5f56]/10 hover:border-[#ff5f56] hover:text-[#ff5f56]'
                              : 'bg-[#000000] border-[#2e2e2e] text-[#a0a0a0] hover:border-[#3ecf8e] hover:text-[#3ecf8e]'
                          }`}
                        >
                          {isActive ? 'Actif' : 'Désactivé'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
