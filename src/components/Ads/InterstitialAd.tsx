import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PlayCircle, Coins, Timer } from 'lucide-react';

interface InterstitialAdProps {
  isOpen: boolean;
  onClose: () => void;
  duration: number; // in seconds
  type: 'reward' | 'interstitial';
  onReward?: () => void;
}

export function InterstitialAd({ isOpen, onClose, duration, type, onReward }: InterstitialAdProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeLeft(duration);
      setCanClose(false);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanClose(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen, duration]);

  const handleClose = () => {
    if (canClose) {
      if (type === 'reward' && onReward) {
        onReward();
      }
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white"
        >
          <div className="max-w-md w-full text-center space-y-8">
            <div className="relative aspect-video bg-gray-900 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-ayur-accent/20 to-transparent opacity-50" />
              <PlayCircle size={64} className="text-ayur-accent animate-pulse" />
              
              {/* Mock Ad Content */}
              <div className="absolute bottom-4 left-4 right-4 text-left">
                <div className="bg-ayur-accent text-white text-[10px] font-bold px-2 py-0.5 rounded inline-block mb-2 uppercase tracking-wider">Sponsored</div>
                <h3 className="font-bold text-lg leading-tight">Ayurvedic Wellness Retreats</h3>
                <p className="text-xs text-white/60">Find your inner peace with our curated retreats.</p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold">
                {type === 'reward' ? 'Watch to earn Coins' : 'Wait for a moment...'}
              </h2>
              <p className="text-white/60 text-sm">
                {type === 'reward' 
                  ? 'Watch this short ad to get 2 coins for more consultations.' 
                  : 'Ads help us keep AyurAi free for everyone.'}
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-white/10"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * (duration - timeLeft)) / duration}
                    className="text-ayur-accent transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{timeLeft}</span>
                  <span className="text-[10px] uppercase font-bold text-white/40">Sec</span>
                </div>
              </div>

              <button
                onClick={handleClose}
                disabled={!canClose}
                className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                  canClose 
                    ? 'bg-ayur-accent text-white shadow-lg shadow-ayur-accent/20 hover:scale-105 active:scale-95' 
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
              >
                {canClose ? (
                  <>
                    {type === 'reward' ? <Coins size={18} /> : <X size={18} />}
                    {type === 'reward' ? 'Claim 2 Coins' : 'Close Ad'}
                  </>
                ) : (
                  <>
                    <Timer size={18} />
                    Wait {timeLeft}s
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
