import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Mail, Briefcase, Save, Loader2, Camera } from 'lucide-react';
import { UserProfile } from '../../hooks/useAuth';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onSave: (data: Partial<UserProfile>) => Promise<void>;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, userProfile, onSave }) => {
  const [name, setName] = useState(userProfile?.name || '');
  const [profession, setProfession] = useState(userProfile?.profession || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setProfession(userProfile.profession || '');
    }
  }, [userProfile, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({ name, profession });
      onClose();
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-ayur-surface w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-ayur-border"
        >
          <div className="p-6 border-b border-ayur-border flex items-center justify-between bg-ayur-bg/50">
            <h2 className="text-xl font-serif font-bold text-ayur-text">Profile Information</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-ayur-hover rounded-full transition-colors text-ayur-text/40"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-6">
            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-ayur-accent/10 flex items-center justify-center text-ayur-accent border-4 border-ayur-surface shadow-xl overflow-hidden">
                  {userProfile?.photoURL ? (
                    <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} />
                  )}
                </div>
                <div className="absolute bottom-0 right-0 p-1.5 bg-ayur-accent text-white rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform">
                  <Camera size={14} />
                </div>
              </div>
              <div className="mt-4 text-center">
                <span className={userProfile?.subscription === 'pro' ? "bg-yellow-500/10 text-yellow-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest border border-yellow-500/20" : "bg-ayur-accent/10 text-ayur-accent text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest border border-ayur-accent/20"}>
                  {userProfile?.subscription === 'pro' ? 'Pro Member' : 'Free Member'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ayur-text/40 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-ayur-text/30" size={18} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-ayur-bg border border-ayur-border rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-ayur-accent/20 focus:border-ayur-accent transition-all text-ayur-text"
                    placeholder="Enter your name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ayur-text/40 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-ayur-text/30" size={18} />
                  <input
                    type="email"
                    value={userProfile?.email || ''}
                    disabled
                    className="w-full bg-ayur-bg/50 border border-ayur-border rounded-2xl py-3 pl-12 pr-4 text-ayur-text/50 cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-ayur-text/30 ml-1 italic">Email cannot be changed</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ayur-text/40 uppercase tracking-widest ml-1">Profession</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-ayur-text/30" size={18} />
                  <input
                    type="text"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full bg-ayur-bg border border-ayur-border rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-ayur-accent/20 focus:border-ayur-accent transition-all text-ayur-text"
                    placeholder="Your profession"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-ayur-accent text-white py-4 rounded-2xl font-bold shadow-lg shadow-ayur-accent/20 hover:bg-ayur-accent/90 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Save size={20} />
                  Save Changes
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
