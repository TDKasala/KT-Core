import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, CreditCard, ArrowLeft } from 'lucide-react';
import { useCurrentOrganization } from '../hooks/useCurrentOrganization';
import { getOrganizationProducts } from '../lib/products';

interface ProductGuardProps {
  appCode: string; // e.g., 'kt_pos', 'kt_inventory', etc.
  appName: string; // e.g., 'Point de Vente Kasala', 'Gestion de Stock'
  children: React.ReactNode;
}

export function ProductGuard({ appCode, appName, children }: ProductGuardProps) {
  const { currentOrganization, isLoading: isOrgLoading } = useCurrentOrganization();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAccess() {
      if (!currentOrganization) return;
      
      try {
        setIsChecking(true);
        const products = await getOrganizationProducts(currentOrganization.id);
        
        // Find if the target appCode is active
        // Fallback robust check in case 'products' relation uses a property called 'code'
        const isAppActive = products.some(p => 
          (p.products?.code === appCode) && p.is_active
        );
        
        setHasAccess(isAppActive);
      } catch (err) {
        console.error('Failed to verify product access:', err);
        setHasAccess(false);
      } finally {
        setIsChecking(false);
      }
    }

    if (currentOrganization) {
      checkAccess();
    }
  }, [currentOrganization, appCode]);

  if (isOrgLoading || isChecking || hasAccess === null) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 flex items-center justify-center gap-1">
             <div className="w-2 h-2 bg-[#3ecf8e] rounded-full animate-bounce" />
             <div className="w-2 h-2 bg-[#3ecf8e] rounded-full animate-bounce [animation-delay:0.2s]" />
             <div className="w-2 h-2 bg-[#3ecf8e] rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
          <p className="text-[#a0a0a0] font-mono text-[10px] uppercase tracking-widest animate-pulse">Vérification de la licence...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#121212] text-[#ededed] font-['Inter',sans-serif] flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-[#181818] border border-[#2e2e2e] p-8 rounded-2xl text-center shadow-xl shadow-[#000]/50"
        >
          <div className="w-16 h-16 bg-[#3ecf8e]/10 text-[#3ecf8e] rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={32} />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Accès restreint</h2>
          <p className="text-[#a0a0a0] mb-8 text-sm leading-relaxed">
            Votre organisation <strong>{currentOrganization?.name}</strong> n'a pas souscrit au module <span className="text-[#ededed] font-medium">{appName}</span>. Renouvelez ou mettez à niveau votre abonnement pour débloquer cette fonctionnalité.
          </p>

          <div className="space-y-3">
            <button className="w-full bg-[#3ecf8e] hover:bg-[#32b279] text-black font-bold h-12 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
              <CreditCard size={18} />
              Mettre à niveau maintenant
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full bg-[#121212] hover:bg-[#2e2e2e] border border-[#2e2e2e] text-[#ededed] font-medium h-12 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <ArrowLeft size={18} />
              Retour au tableau de bord
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
