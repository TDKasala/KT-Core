import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentOrganization } from '../hooks/useCurrentOrganization';
import { signOut } from '../lib/auth';
import { supabase } from '../lib/supabaseClient';
import { ShoppingCart, LayoutGrid, Settings, Users } from 'lucide-react';

export default function Dashboard() {
  const { currentOrganization, role } = useCurrentOrganization();
  const [todos, setTodos] = useState<any[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  useEffect(() => {
    async function getTodos() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id);

      if (data) {
        setTodos(data);
      }
    }

    getTodos();
  }, []);

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('todos')
      .insert([{ 
        name: newTodo, 
        user_id: user.id,
        organization_id: currentOrganization?.id 
      }])
      .select()
      .single();

    if (data && !error) {
      setTodos([...todos, data]);
      setNewTodo('');
    }
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Section: POS Launch */}
          <section className="bg-[#181818] border border-[#2e2e2e] rounded p-6 flex flex-col gap-6">
            <h2 className="text-lg font-bold border-b border-[#2e2e2e] pb-4 mb-0 relative after:absolute after:bottom-0 after:left-0 after:w-8 after:h-[1px] after:bg-[#3ecf8e]">
              Actions Rapides
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => navigate('/pos')}
                className="flex flex-col items-center justify-center aspect-square rounded-xl bg-[#3ecf8e]/10 border border-[#3ecf8e]/30 hover:bg-[#3ecf8e]/20 transition-all group"
              >
                <ShoppingCart size={32} className="text-[#3ecf8e] mb-3 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-[#ededed]">Vendre</span>
              </button>
              
              <button 
                onClick={() => navigate('/inventory')}
                className="flex flex-col items-center justify-center aspect-square rounded-xl bg-[#181818] border border-[#2e2e2e] hover:border-[#a0a0a0] transition-all group"
              >
                <LayoutGrid size={32} className="text-[#a0a0a0] mb-3 group-hover:text-[#ededed] transition-colors" />
                <span className="text-xs font-bold text-[#ededed]">Produits</span>
              </button>

              <button 
                onClick={() => navigate('/superadmin')}
                className="flex flex-col items-center justify-center aspect-square rounded-xl bg-[#181818] border border-[#2e2e2e] hover:border-[#a0a0a0] hover:bg-[#ff5f56]/10 hover:border-[#ff5f56]/30 transition-all group lg:col-span-2"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#ff5f56]/20 mb-3 group-hover:scale-110 transition-transform">
                  <Settings size={20} className="text-[#ff5f56]" />
                </div>
                <span className="text-xs font-bold text-[#ff5f56]">Super Admin</span>
              </button>
            </div>
          </section>

          <section className="bg-[#181818] border border-[#2e2e2e] rounded p-6">
            <h2 className="text-lg font-bold border-b border-[#2e2e2e] pb-4 mb-4 relative after:absolute after:bottom-0 after:left-0 after:w-8 after:h-[1px] after:bg-[#3ecf8e]">
              Espace de travail sélectionné
            </h2>
            
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-[120px_1fr] items-center text-sm">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#a0a0a0]">Organisation</span>
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

          <section className="bg-[#181818] border border-[#2e2e2e] rounded p-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold border-b border-[#2e2e2e] pb-4 mb-4 relative after:absolute after:bottom-0 after:left-0 after:w-8 after:h-[1px] after:bg-[#3ecf8e]">
              Liste de tâches
            </h2>

            <form onSubmit={addTodo} className="flex gap-2">
              <input 
                type="text" 
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Nouvelle tâche..."
                className="flex-1 bg-black border border-[#2e2e2e] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#3ecf8e]"
              />
              <button 
                type="submit"
                className="bg-[#3ecf8e] text-black text-xs font-bold px-4 py-2 rounded hover:bg-[#32b279] transition-colors"
              >
                Ajouter
              </button>
            </form>

            <ul className="flex flex-col gap-2 mt-2">
              {todos.map((todo) => (
                <li key={todo.id} className="text-sm border-b border-[#2e2e2e]/50 pb-2 last:border-0">
                  <span className="text-[#ededed]">{todo.name}</span>
                </li>
              ))}
              {todos.length === 0 && (
                <p className="text-[#a0a0a0] text-xs py-4 text-center font-mono">Aucune tâche pour le moment</p>
              )}
            </ul>
          </section>
        </div>

      </div>
    </div>
  );
}
