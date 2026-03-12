import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Crown, Check, Shield, CreditCard, Loader2, AlertCircle } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  onSuccess: () => void;
}

export function PaymentModal({ isOpen, onClose, userId, userEmail, onSuccess }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [payuData, setPayuData] = useState<any>(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const txnid = `TXN_${Date.now()}`;
      const amount = "99.00";
      const productinfo = "AyurAi Pro Subscription";
      const firstname = userEmail.split('@')[0] || "User";
      const email = userEmail;

      const response = await fetch('/api/payu/hash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ txnid, amount, productinfo, firstname, email }),
      });

      const { hash, error: hashError } = await response.json();

      if (hashError) {
        throw new Error(hashError);
      }

      const data = {
        key: import.meta.env.VITE_PAYU_MERCHANT_KEY,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        phone: '9999999999', // Placeholder as PayU requires phone
        surl: `${window.location.origin}/api/payu/callback`,
        furl: `${window.location.origin}/api/payu/callback`,
        hash,
        service_provider: 'payu_paisa'
      };

      setPayuData(data);

      // Wait for state update and submit form
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.submit();
        }
      }, 100);

    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-ayur-surface rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden border border-ayur-border-strong"
          >
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-4 md:mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-ayur-accent/10 flex items-center justify-center text-ayur-accent">
                  <Crown size={20} className="md:w-6 md:h-6" />
                </div>
                <button onClick={onClose} className="p-2 hover:bg-ayur-hover rounded-full transition-colors">
                  <X size={18} className="text-ayur-text/40 md:w-5 md:h-5" />
                </button>
              </div>

              <h2 className="text-xl md:text-2xl font-serif font-bold text-ayur-accent mb-1.5 md:mb-2">Upgrade to AyurAi Pro</h2>
              <p className="text-ayur-text/60 text-xs md:text-sm mb-6 md:mb-8">Unlock the full potential of Ayurvedic wisdom with our premium features.</p>

              <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                {[
                  "Unlimited AI Consultations",
                  "Ad-free Experience",
                  "Priority Response Time",
                  "Advanced Clinical Analysis",
                  "Save Unlimited Sessions"
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2.5 md:gap-3">
                    <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                      <Check size={10} strokeWidth={3} className="md:w-3 md:h-3" />
                    </div>
                    <span className="text-xs md:text-sm font-medium text-ayur-text/80">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="bg-ayur-accent/5 rounded-2xl p-4 md:p-6 border border-ayur-accent/10 mb-6 md:mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl md:text-3xl font-bold text-ayur-accent">₹99</span>
                  <span className="text-ayur-text/40 text-xs md:text-sm font-medium">/ month</span>
                </div>
                <p className="text-[9px] md:text-[10px] text-ayur-accent/60 font-bold uppercase tracking-widest mt-1.5 md:mt-2">Cancel anytime • Secure payment</p>
              </div>

              {error && (
                <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 md:gap-3 text-red-600">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 md:w-[18px] md:h-[18px]" />
                  <p className="text-[11px] md:text-xs font-medium leading-relaxed">{error}</p>
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full py-3.5 md:py-4 bg-ayur-accent text-white rounded-2xl font-bold shadow-xl shadow-ayur-accent/20 hover:bg-ayur-accent-dark transition-all flex items-center justify-center gap-2.5 md:gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin md:w-5 md:h-5" />
                ) : (
                  <CreditCard size={18} className="md:w-5 md:h-5" />
                )}
                <span className="text-sm md:text-base">{loading ? "Redirecting to PayU..." : "Continue to Payment"}</span>
              </button>

              {/* Hidden PayU Form */}
              {payuData && (
                <form 
                  ref={formRef} 
                  action={import.meta.env.VITE_PAYU_BASE_URL || "https://test.payu.in/_payment"} 
                  method="post" 
                  className="hidden"
                >
                  {Object.entries(payuData).map(([key, value]: [string, any]) => (
                    <input key={key} type="hidden" name={key} value={value} />
                  ))}
                </form>
              )}

              <div className="mt-6 flex items-center justify-center gap-4 text-ayur-text/30">
                <div className="flex items-center gap-1.5">
                  <Shield size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Secure Checkout</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-ayur-border" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Powered by PayU</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
