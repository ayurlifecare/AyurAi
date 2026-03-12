import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SliderAdProps {
  ads: {
    id: string;
    title: string;
    description: string;
    image?: string;
    link?: string;
  }[];
}

export function SliderAd({ ads }: SliderAdProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [ads.length]);

  const next = () => setCurrentIndex((prev) => (prev + 1) % ads.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);

  if (ads.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-ayur-accent/5 to-ayur-sidebar border border-ayur-border group">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="p-4 md:p-6 flex flex-col md:flex-row items-center gap-4"
        >
          {ads[currentIndex].image && (
            <div className="w-full md:w-1/3 h-32 rounded-xl overflow-hidden shadow-sm">
              <img 
                src={ads[currentIndex].image} 
                alt={ads[currentIndex].title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          <div className="flex-1 text-center md:text-left">
            <span className="text-[10px] font-bold text-ayur-accent uppercase tracking-widest mb-1 block">Sponsored</span>
            <h3 className="font-serif font-bold text-lg text-ayur-accent mb-1">{ads[currentIndex].title}</h3>
            <p className="text-sm text-ayur-text/60 line-clamp-2">{ads[currentIndex].description}</p>
            {ads[currentIndex].link && (
              <a 
                href={ads[currentIndex].link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block mt-3 text-xs font-bold text-ayur-accent hover:underline"
              >
                Learn More →
              </a>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-y-0 left-0 flex items-center pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={prev} className="p-1.5 rounded-full bg-white/80 shadow-sm text-ayur-accent hover:bg-white">
          <ChevronLeft size={16} />
        </button>
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={next} className="p-1.5 rounded-full bg-white/80 shadow-sm text-ayur-accent hover:bg-white">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {ads.map((_, i) => (
          <div 
            key={i} 
            className={`w-1 h-1 rounded-full transition-all ${i === currentIndex ? 'w-3 bg-ayur-accent' : 'bg-ayur-accent/20'}`}
          />
        ))}
      </div>
    </div>
  );
}
