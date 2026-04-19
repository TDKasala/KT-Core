import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, X } from 'lucide-react';

export interface ReceiptItem {
  product_id?: string;
  name: string;
  quantity: number;
  price: number;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationName: string;
  branchName?: string;
  cashierName: string;
  date: string;
  receiptId: string;
  items: ReceiptItem[];
  total: number;
}

export function ReceiptModal({
  isOpen,
  onClose,
  organizationName,
  branchName,
  cashierName,
  date,
  receiptId,
  items,
  total
}: ReceiptModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:bg-white print:p-0 print:backdrop-blur-none print:z-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-sm bg-white text-black p-6 rounded-2xl shadow-2xl print:shadow-none print:rounded-none print:p-4 print:w-full print:max-w-none"
          >
            {/* Header Actions - Hidden on print */}
            <div className="flex items-center justify-between mb-6 print:hidden">
              <h2 className="font-bold text-gray-800">Reçu de paiement</h2>
              <button 
                onClick={onClose} 
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Thermal Receipt Body */}
            <div className="font-mono text-sm space-y-4">
              <div className="text-center space-y-1">
                <h3 className="font-bold text-lg uppercase">{organizationName}</h3>
                {branchName && <p className="text-xs">{branchName}</p>}
                <p className="text-xs text-gray-500 mt-2">Reçu #{receiptId.replace('offline_', '').substring(0, 8).toUpperCase()}</p>
                <p className="text-xs text-gray-500">{date}</p>
              </div>

              <div className="border-t-2 border-dashed border-gray-300 my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase text-gray-500">
                  <span>Qte x Article</span>
                  <span>Prix</span>
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="flex gap-2">
                      <span className="w-4">{item.quantity}</span>
                      <span>x {item.name}</span>
                    </div>
                    <span>{(item.price * item.quantity).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-dashed border-gray-300 my-4" />

              <div className="flex justify-between items-center font-bold text-lg">
                <span>TOTAL</span>
                <span>{total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
              </div>

              <div className="border-t-2 border-dashed border-gray-300 my-4" />

              <div className="text-center space-y-1 text-xs">
                <p>Caissier : {cashierName}</p>
                <p>Merci de votre visite !</p>
              </div>
            </div>

            {/* Footer Actions - Hidden on print */}
            <div className="mt-8 space-y-3 print:hidden">
              <button 
                onClick={handlePrint}
                className="w-full bg-black text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors active:scale-95"
              >
                <Printer size={18} />
                Imprimer le reçu
              </button>
              <p className="text-center text-[10px] text-gray-400">
                L'impression permet également d'enregistrer en PDF.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
