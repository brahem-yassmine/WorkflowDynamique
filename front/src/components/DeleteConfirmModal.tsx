'use client';
 
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Trash2, X } from 'lucide-react';
 
interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isDeleting?: boolean;
}
 
export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isDeleting = false
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          {/* Backdrop blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[6px]"
          />
 
          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="relative bg-white w-full max-w-md rounded-[40px] overflow-hidden shadow-2xl border border-slate-100"
          >
            {/* Top Security Banner */}
            <div className="bg-rose-600 p-8 text-white relative overflow-hidden">
               {/* Background pattern */}
               <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                 <Trash2 size={120} />
               </div>
               
               <div className="relative z-10 flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-xl">
                   <AlertCircle className="w-8 h-8 text-white" />
                 </div>
                 <h2 className="text-2xl font-black tracking-tight uppercase">Irreversible Action</h2>
                 <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mt-1">Resource Liquidation Protocol</p>
               </div>
            </div>
 
            {/* Modal Body */}
            <div className="p-8 pb-10">
              <div className="text-center mb-10">
                <h3 className="text-xl font-black text-slate-800 mb-3">{title}</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed px-4">
                  {description}
                </p>
              </div>
 
              <div className="flex items-center gap-4">
                <button 
                  onClick={onClose}
                  className="flex-1 py-4 px-6 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all border border-slate-100 hover:text-slate-600 active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  onClick={onConfirm}
                  disabled={isDeleting}
                  className="flex-1 py-4 px-6 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-rose-700 active:scale-95 transition-all shadow-xl shadow-rose-100 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
 
            {/* Close Cross button */}
            <button 
               onClick={onClose}
               className="absolute top-4 right-4 p-2 text-white/60 hover:text-white rounded-lg transition-colors z-20"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
