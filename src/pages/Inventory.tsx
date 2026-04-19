import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Package, 
  ArrowLeft,
  DollarSign,
  Tag,
  Hash,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useCurrentOrganization } from '../hooks/useCurrentOrganization';
import { syncProductsToOffline } from '../lib/db';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  organization_id: string;
  created_at: string;
}

export default function Inventory() {
  const { currentOrganization, isLoading: isOrgLoading } = useCurrentOrganization();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // New product form
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newPrice, setNewPrice] = useState('0');
  const [newStock, setNewStock] = useState('0');

  useEffect(() => {
    if (currentOrganization) {
      fetchProducts();
    }
  }, [currentOrganization]);

  async function fetchProducts() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', currentOrganization?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const productList = data || [];
      setProducts(productList);

      // Sync to local DB
      if (currentOrganization) {
        await syncProductsToOffline(currentOrganization.id, productList);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization) return;
    
    setIsAdding(true);
    setError('');
    
    try {
      const { data, error: insertError } = await supabase
        .from('products')
        .insert([{
          name: newName,
          code: newCode || `PROD-${Date.now()}`,
          price: parseFloat(newPrice),
          stock: parseInt(newStock),
          organization_id: currentOrganization.id
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      
      const updatedProducts = [data, ...products];
      setProducts(updatedProducts);
      
      // Update local cache
      await syncProductsToOffline(currentOrganization.id, updatedProducts);
      setNewName('');
      setNewCode('');
      setNewPrice('0');
      setNewStock('0');
      setError('Produit ajouté !');
      setTimeout(() => setError(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;
    if (!currentOrganization) return;
    
    try {
      const { error: delError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (delError) throw delError;
      const updatedList = products.filter(p => p.id !== id);
      setProducts(updatedList);

      // Update local cache
      await syncProductsToOffline(currentOrganization.id, updatedList);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (isOrgLoading || (isLoading && products.length === 0)) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="w-8 h-8 flex items-center justify-center gap-1">
           <div className="w-2 h-2 bg-[#3ecf8e] rounded-full animate-bounce" />
           <div className="w-2 h-2 bg-[#3ecf8e] rounded-full animate-bounce [animation-delay:0.2s]" />
           <div className="w-2 h-2 bg-[#3ecf8e] rounded-full animate-bounce [animation-delay:0.4s]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-[#ededed] font-['Inter',sans-serif] pb-20">
      <header className="sticky top-0 z-10 bg-[#181818]/80 backdrop-blur-md border-b border-[#2e2e2e] h-16 flex items-center px-6 gap-4">
        <button onClick={() => navigate('/dashboard')} className="text-[#a0a0a0] hover:text-[#ededed]">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg">Gestion de l'Inventaire</h1>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Quick Add Form */}
        <section className="bg-[#181818] border border-[#2e2e2e] rounded-2xl p-6">
          <h2 className="text-sm font-mono uppercase tracking-widest text-[#a0a0a0] mb-6 flex items-center gap-2">
            <Plus size={14} /> Nouveau Produit
          </h2>
          
          <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] uppercase font-mono tracking-widest text-[#a0a0a0]">Nom du produit</label>
              <div className="relative">
                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a0a0]" />
                <input 
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Ex: Coca-Cola 33cl"
                  className="w-full bg-[#000] border border-[#2e2e2e] rounded-lg pl-9 pr-4 py-2.5 text-sm focus:border-[#3ecf8e] transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono tracking-widest text-[#a0a0a0]">Code / SKU</label>
              <div className="relative">
                <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a0a0]" />
                <input 
                  type="text" 
                  value={newCode} 
                  onChange={e => setNewCode(e.target.value)}
                  placeholder="CODE-123"
                  className="w-full bg-[#000] border border-[#2e2e2e] rounded-lg pl-9 pr-4 py-2.5 text-sm focus:border-[#3ecf8e] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono tracking-widest text-[#a0a0a0]">Prix (€)</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a0a0]" />
                <input 
                  type="number" 
                  step="0.01" 
                  value={newPrice} 
                  onChange={e => setNewPrice(e.target.value)}
                  className="w-full bg-[#000] border border-[#2e2e2e] rounded-lg pl-9 pr-4 py-2.5 text-sm focus:border-[#3ecf8e] transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono tracking-widest text-[#a0a0a0]">Stock</label>
              <div className="relative">
                <Package size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a0a0]" />
                <input 
                  type="number" 
                  value={newStock} 
                  onChange={e => setNewStock(e.target.value)}
                  className="w-full bg-[#000] border border-[#2e2e2e] rounded-lg pl-9 pr-4 py-2.5 text-sm focus:border-[#3ecf8e] transition-colors"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-5 flex items-center justify-between gap-4 mt-2">
              <p className={`text-xs ${error.includes('ajouté') ? 'text-[#3ecf8e]' : 'text-[#ff5f56]'} transition-opacity`}>
                {error && <span className="flex items-center gap-1"><AlertCircle size={12}/> {error}</span>}
              </p>
              <button 
                type="submit" 
                disabled={isAdding}
                className="bg-[#3ecf8e] hover:bg-[#32b279] text-black font-bold h-11 px-8 rounded-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {isAdding ? 'Ajout...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </section>

        {/* Product List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-mono uppercase tracking-widest text-[#a0a0a0]">Catalogue ({products.length})</h2>
            <div className="relative w-48 hidden sm:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a0a0]" />
              <input type="text" placeholder="Rechercher..." className="w-full bg-[#181818] border border-[#2e2e2e] rounded-full pl-9 pr-4 py-1.5 text-[10px] focus:border-[#3ecf8e]" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {products.length === 0 ? (
              <div className="bg-[#181818]/50 border border-dashed border-[#2e2e2e] rounded-2xl py-12 flex flex-col items-center justify-center text-[#a0a0a0] gap-4">
                <Package size={40} className="opacity-10" />
                <p className="text-xs font-mono uppercase tracking-widest opacity-30">Aucun produit en stock</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-[#181818] border border-[#2e2e2e] p-4 rounded-xl flex items-center justify-between group hover:border-[#3ecf8e]/30 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 bg-[#000] rounded flex items-center justify-center text-[#3ecf8e]/30">
                        <Package size={20} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm truncate">{product.name}</h4>
                        <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-tighter opacity-50 mt-0.5">
                          <span>{product.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                          <span>•</span>
                          <span>Stock: {product.stock}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                       <button 
                        onClick={() => deleteProduct(product.id)}
                        className="p-2.5 text-[#a0a0a0] hover:text-[#ff5f56] hover:bg-[#ff5f56]/10 rounded-lg transition-colors"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
