import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  Package, 
  X,
  CreditCard,
  History,
  LayoutGrid,
  AlertCircle,
  RotateCw,
  Store
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useCurrentOrganization } from '../hooks/useCurrentOrganization';
import { useCartStore } from '../store/useCartStore';
import { useBranchStore } from '../store/useBranchStore';
import { getBranches, type Branch } from '../components/branches';
import { saveSaleOffline, markSaleAsSynced, syncProductsToOffline, getOfflineProducts, db } from '../lib/db';

const ReceiptModal = React.lazy(() => import('../components/ReceiptModal').then(mod => ({ default: mod.ReceiptModal })));

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  organization_id: string;
}

const ProductCard = React.memo(({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) => {
  return (
    <motion.button
      layout
      whileTap={{ scale: 0.96 }}
      onClick={() => onAdd(product)}
      className="flex flex-col items-start text-left bg-[#181818] border border-[#2e2e2e] rounded-xl p-4 transition-all hover:border-[#3ecf8e]/50 group relative overflow-hidden"
    >
      <div className="w-full aspect-square bg-[#000] rounded-lg mb-4 flex items-center justify-center text-[#3ecf8e]/20 group-hover:text-[#3ecf8e]/40 transition-colors">
        <LayoutGrid size={32} />
      </div>
      <div className="w-full">
        <h3 className="text-sm font-bold text-[#ededed] truncate leading-tight mb-1">{product.name}</h3>
        <div className="flex items-center justify-between">
          <span className="text-[#3ecf8e] font-mono text-sm tracking-tighter">
            {product.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </span>
          <span className="text-[10px] text-[#a0a0a0] font-mono uppercase opacity-50">STOCK: {product.stock}</span>
        </div>
      </div>
    </motion.button>
  );
});
ProductCard.displayName = 'ProductCard';

export default function POS() {
  const { currentOrganization, isLoading: isOrgLoading } = useCurrentOrganization();
  const { items, addItem, removeItem, updateQuantity, clearCart, getTotalAmount } = useCartStore();
  const { currentBranch, setCurrentBranch } = useBranchStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showCartMobile, setShowCartMobile] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [receiptData, setReceiptData] = useState<any>(null); // To store completed sale data for the receipt

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (currentOrganization) {
      loadInitialData();
      fetchBranches();
    }
  }, [currentOrganization]);

  async function fetchBranches() {
    try {
      const orgBranches = await getBranches(currentOrganization?.id);
      setBranches(orgBranches);
      if (orgBranches.length > 0 && !currentBranch) {
        // Auto-select first branch if none selected
        setCurrentBranch(orgBranches[0]);
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
    }
  }

  async function loadInitialData() {
    setIsLoading(true);
    try {
      // 1. Always load from local DB first for instant UI
      await loadFromOffline();
      
      // 2. Trigger a background refresh from server
      refreshProducts();
    } finally {
      setIsLoading(false);
    }
  }

  async function loadFromOffline() {
    if (!currentOrganization) return;
    const offlineList = await getOfflineProducts(currentOrganization.id);
    setProducts(offlineList as Product[]);
  }

  async function refreshProducts() {
    if (!currentOrganization || !navigator.onLine) return;
    
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('name');

      if (error) throw error;

      if (data) {
        // Update local DB
        await syncProductsToOffline(currentOrganization.id, data.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          stock: p.stock,
          organization_id: p.organization_id
        })));
        
        // Ensure UI strictly reads from IDB
        await loadFromOffline();
      }
    } catch (err) {
      console.warn('Silent refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  }

  const handleAddToCart = useCallback((product: Product) => {
    addItem(product);
  }, [addItem]);

  const productGridContent = useMemo(() => {
    if (products.length === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-[#a0a0a0] gap-4">
          <Package size={48} className="opacity-20" />
          <p className="text-sm font-mono uppercase tracking-widest text-center">Aucun produit trouvé.<br/><span className="text-[10px] lowercase opacity-50">Ajoutez-en depuis l'administration.</span></p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <AnimatePresence mode="popLayout">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={handleAddToCart} />
          ))}
        </AnimatePresence>
      </div>
    );
  }, [products, handleAddToCart]);

  const subtotal = getTotalAmount();

  const handleCheckout = async () => {
    if (items.length === 0 || !currentOrganization) return;
    if (!currentBranch) {
      alert("Veuillez sélectionner une succursale avant d'encaisser.");
      return;
    }
    
    setIsCheckingOut(true);
    try {
      // (The rest of checkout logic proceeds as normal)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié");

      const saleData = {
        organization_id: currentOrganization.id,
        branch_id: currentBranch.id, // Ensure branch is tracked
        user_id: user.id,
        total: subtotal,
        status: 'completed',
        created_at: new Date().toISOString()
      };

      const itemsData = items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }));

      // 1. SAVE LOCALLY (Synchronous from UI perspective)
      const tempId = await saveSaleOffline(saleData, itemsData);

      // Extract cashier name (prefer metadata name, fallback to email prefix)
      const cashierName = user.user_metadata?.full_name 
        || (user.email ? user.email.split('@')[0] : 'Caissier');

      const dateStr = new Date().toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short'
      });

      // Populate Receipt Data
      setReceiptData({
        receiptId: tempId,
        date: dateStr,
        items: [...items], // Clone items since cart will be cleared
        total: subtotal,
        cashierName
      });

      // 2. INSTANT UI UPDATE
      clearCart();
      setIsCheckingOut(false);
      setShowCartMobile(false);
      
      // 3. BACKGROUND SYNC (Doesn't block user)
      if (navigator.onLine) {
        performBackgroundSync(tempId, saleData, itemsData);
      }

      // Refresh products to potentially update stock levels
      refreshProducts();
    } catch (err: any) {
      console.error('Checkout error:', err);
      alert('Erreur: ' + err.message);
      setIsCheckingOut(false);
    }
  };

  async function performBackgroundSync(tempId: string, saleData: any, itemsData: any[]) {
    // ... logic remains unchanged ...
    try {
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([saleData])
        .select()
        .single();

      if (saleError || !sale) throw saleError;

      const saleItems = itemsData.map(item => ({
        ...item,
        sale_id: sale.id
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Update Stock in Supabase
      for (const item of itemsData) {
        const { data: prod } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();
        
        if (prod) {
          await supabase
            .from('products')
            .update({ stock: Math.max(0, prod.stock - item.quantity) })
            .eq('id', item.product_id);
        }
      }

      await markSaleAsSynced(tempId, sale.id);
      console.log('Vente synchronisée avec succès:', sale.id);
    } catch (syncErr) {
      console.warn('La synchronisation en arrière-plan a échoué (sera réessayée plus tard):', syncErr);
    }
  }

  if (isOrgLoading || (isLoading && products.length === 0)) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 flex items-center justify-center gap-1">
             <div className="w-2 h-2 bg-[#3ecf8e] rounded-full animate-bounce" />
             <div className="w-2 h-2 bg-[#3ecf8e] rounded-full animate-bounce [animation-delay:0.2s]" />
             <div className="w-2 h-2 bg-[#3ecf8e] rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
          <p className="text-[#a0a0a0] font-mono text-[10px] uppercase tracking-widest animate-pulse">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#121212] text-[#ededed] flex flex-col md:flex-row h-screen overflow-hidden font-['Inter',sans-serif] print:hidden">
        
        {/* Sidebar Navigation (Desktop) */}
      <nav className="hidden md:flex flex-col w-16 bg-[#181818] border-r border-[#2e2e2e] items-center py-6 gap-8">
        <div className="w-10 h-10 bg-[#3ecf8e] rounded flex items-center justify-center text-black font-bold">O</div>
        <button className="text-[#3ecf8e] p-2 bg-[#3ecf8e]/10 rounded"><LayoutGrid size={20} /></button>
        <button className="text-[#a0a0a0] hover:text-[#ededed] transition-colors p-2"><History size={20} /></button>
        <div className="mt-auto">
          <button className="text-[#a0a0a0] hover:text-[#ededed] transition-colors p-2"><Package size={20} /></button>
        </div>
      </nav>

      {/* Main Content: Product Grid */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#121212]">
        {/* Header */}
        <header className="h-16 border-b border-[#2e2e2e] bg-[#181818] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold tracking-tight">Caisse</h1>
            
            <div className="hidden md:flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#3ecf8e]/10 text-[#3ecf8e] text-[10px] font-mono uppercase tracking-widest border border-[#3ecf8e]/20">
                {currentOrganization?.name}
              </span>
              
              <div className="relative flex items-center">
                <Store size={14} className="absolute left-2 text-[#a0a0a0]" />
                <select 
                  className="bg-[#121212] border border-[#2e2e2e] rounded-lg text-xs py-1 pl-7 pr-6 appearance-none focus:outline-none focus:border-[#3ecf8e]"
                  value={currentBranch?.id || ''}
                  onChange={(e) => {
                    const branch = branches.find(b => b.id === e.target.value);
                    setCurrentBranch(branch || null);
                  }}
                >
                  <option value="" disabled>Sélectionner succursale</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {isOffline && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#ff5f56]/10 text-[#ff5f56] text-[10px] font-mono uppercase tracking-widest border border-[#ff5f56]/20 animate-pulse">
                <AlertCircle size={10} /> Hors-ligne
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={refreshProducts}
              disabled={isRefreshing || !navigator.onLine}
              className={`p-2 rounded-lg transition-all ${isRefreshing ? 'animate-spin text-[#3ecf8e]' : 'text-[#a0a0a0] hover:text-[#ededed] hover:bg-[#2e2e2e]'}`}
              title="Actualiser les produits"
            >
              <RotateCw size={18} />
            </button>
            <div className="relative md:hidden" onClick={() => setShowCartMobile(true)}>
              <ShoppingCart size={20} className="text-[#ededed]" />
              {items.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#3ecf8e] text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {items.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Categories / Search Filter stub */}
        <div className="px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button className="px-4 py-1.5 rounded bg-[#3ecf8e] text-black text-xs font-bold whitespace-nowrap">Tous</button>
          <button className="px-4 py-1.5 rounded bg-[#181818] border border-[#2e2e2e] text-[#a0a0a0] text-xs transition-colors hover:border-[#3ecf8e]/50 whitespace-nowrap">Boissons</button>
          <button className="px-4 py-1.5 rounded bg-[#181818] border border-[#2e2e2e] text-[#a0a0a0] text-xs transition-colors hover:border-[#3ecf8e]/50 whitespace-nowrap">Snacks</button>
          <button className="px-4 py-1.5 rounded bg-[#181818] border border-[#2e2e2e] text-[#a0a0a0] text-xs transition-colors hover:border-[#3ecf8e]/50 whitespace-nowrap">Services</button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {productGridContent}
        </div>
      </main>

      {/* Cart Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-[380px] bg-[#181818] border-l border-[#2e2e2e] shrink-0">
        <header className="h-16 border-b border-[#2e2e2e] flex items-center px-6 shrink-0 bg-[#121212]/50">
          <h2 className="text-sm font-mono uppercase tracking-[0.2em] font-bold text-[#a0a0a0]">Panier Actuel</h2>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence initial={false}>
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[#a0a0a0] gap-4">
                <ShoppingCart size={32} className="opacity-10" />
                <p className="text-[10px] font-mono uppercase tracking-widest text-center opacity-30">Votre panier est vide</p>
              </div>
            ) : (
              items.map((item) => (
                <motion.div
                  key={item.product_id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#121212] border border-[#2e2e2e] rounded-lg p-3 group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xs font-bold text-[#ededed] truncate pr-4">{item.name}</h4>
                    <button 
                      onClick={() => removeItem(item.product_id)}
                      className="text-[#a0a0a0] hover:text-[#ff5f56] transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-[#000] rounded overflow-hidden p-0.5 border border-[#2e2e2e]">
                      <button 
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="p-1 px-2 hover:bg-[#181818] text-[#a0a0a0]"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="px-2 font-mono text-xs text-[#3ecf8e] min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="p-1 px-2 hover:bg-[#181818] text-[#a0a0a0]"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="font-mono text-xs text-[#ededed]">
                      {(item.price * item.quantity).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <footer className="p-6 bg-[#121212]/50 border-t border-[#2e2e2e] space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-[#a0a0a0] font-mono">
              <span>Sous-total</span>
              <span>{subtotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
            </div>
            <div className="flex justify-between text-xs text-[#a0a0a0] font-mono">
              <span>TVA (20%)</span>
              <span>{(subtotal * 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
            </div>
            <div className="pt-2 border-t border-[#2e2e2e] flex justify-between items-baseline">
              <span className="text-xs font-mono uppercase tracking-widest font-bold">Total</span>
              <span className="text-2xl font-bold text-[#3ecf8e] font-mono tracking-tighter">
                {subtotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={items.length === 0 || isCheckingOut}
            className="w-full bg-[#3ecf8e] hover:bg-[#32b279] text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {isCheckingOut ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CreditCard size={18} />
                Payer
              </>
            )}
          </button>
        </footer>
      </aside>

      {/* Mobile Cart Overlay */}
      <AnimatePresence>
        {showCartMobile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCartMobile(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 max-h-[90vh] bg-[#181818] border-t border-[#2e2e2e] z-50 rounded-t-3xl flex flex-col md:hidden"
            >
              <div className="w-12 h-1.5 bg-[#2e2e2e] rounded-full mx-auto my-4" />
              <div className="flex-1 overflow-y-auto px-6 py-2">
                <header className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-lg">Mon Panier</h2>
                  <button onClick={() => setShowCartMobile(false)} className="p-2 text-[#a0a0a0]">
                    <X size={20} />
                  </button>
                </header>
                
                <div className="space-y-4 mb-8">
                  {items.length === 0 ? (
                    <p className="text-center text-[#a0a0a0] py-12 text-sm italic opacity-50">Panier vide</p>
                  ) : (
                    items.map((item) => (
                      <div key={item.product_id} className="flex items-center justify-between gap-4 p-3 bg-[#121212] rounded-xl border border-[#2e2e2e]">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold truncate">{item.name}</h4>
                          <p className="text-[10px] font-mono text-[#3ecf8e]">
                            {item.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-[#000] rounded-lg border border-[#2e2e2e]">
                            <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="p-2 text-[#a0a0a0]"><Minus size={14} /></button>
                            <span className="w-8 text-center font-mono text-xs">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="p-2 text-[#3ecf8e]"><Plus size={14} /></button>
                          </div>
                          <button onClick={() => removeItem(item.product_id)} className="text-[#ff5f56]/50 p-1"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="sticky bottom-0 bg-[#181818] pt-2 pb-8 space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs uppercase font-mono text-[#a0a0a0] tracking-widest">Total</span>
                    <span className="text-3xl font-bold text-[#3ecf8e] font-mono tracking-tighter">
                      {subtotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={items.length === 0 || isCheckingOut}
                    className="w-full bg-[#3ecf8e] text-black font-bold h-16 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all text-lg mb-4"
                  >
                    {isCheckingOut ? (
                      <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CreditCard size={20} />
                        Payer Maintenant
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </div>

      {/* Post-Sale Receipt Modal */}
      {currentOrganization && receiptData && (
        <React.Suspense fallback={null}>
          <ReceiptModal
            isOpen={!!receiptData}
            onClose={() => setReceiptData(null)}
            organizationName={currentOrganization.name}
            branchName={currentBranch?.name}
            cashierName={receiptData.cashierName}
            date={receiptData.date}
            receiptId={receiptData.receiptId}
            items={receiptData.items}
            total={receiptData.total}
          />
        </React.Suspense>
      )}
    </>
  );
}
