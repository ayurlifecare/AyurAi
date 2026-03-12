import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
}

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, title = "this consultation" }: DeleteConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
            className="relative bg-ayur-surface w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden border border-ayur-border-strong"
          >
            <div className="p-6 border-b border-ayur-border flex items-center justify-between bg-red-500/5">
              <h3 className="font-serif font-bold text-xl flex items-center gap-2 text-red-600">
                <AlertTriangle size={20} />
                Confirm Deletion
              </h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-red-500/10 rounded-xl transition-colors text-red-600/60 hover:text-red-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-ayur-text/80 text-[15px] leading-relaxed">
                Are you sure you want to delete <strong className="text-ayur-text font-semibold">{title}</strong>? This action cannot be undone and all chat history for this session will be permanently lost.
              </p>
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-3 bg-ayur-surface border border-ayur-border-strong text-ayur-text rounded-xl font-medium shadow-sm hover:bg-ayur-hover transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium shadow-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
