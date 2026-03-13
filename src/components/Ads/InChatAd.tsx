import React from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Tag } from 'lucide-react';

interface InChatAdProps {
  title: string;
  description: string;
  image?: string;
  link?: string;
  cta?: string;
  onRemoveAds?: () => void;
}

export function InChatAd({ title, description, image, link, cta = "Learn More", onRemoveAds }: InChatAdProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto my-8 p-4 rounded-2xl bg-gradient-to-br from-ayur-accent/5 to-ayur-sidebar border border-ayur-accent/20 shadow-sm relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-2 flex items-center gap-2">
        <button 
          onClick={onRemoveAds}
          className="text-[8px] font-bold text-ayur-text/30 hover:text-ayur-accent transition-colors uppercase tracking-widest"
        >
          Remove Ads
        </button>
        <span className="flex items-center gap-1 text-[9px] font-bold text-ayur-accent/40 uppercase tracking-widest bg-ayur-accent/5 px-2 py-0.5 rounded-full">
          <Tag size={8} /> Sponsored
        </span>
      </div>

      <div className="flex gap-4 items-start">
        {image && (
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden shrink-0 shadow-sm border border-ayur-border">
            <img 
              src={image} 
              alt={title} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        <div className="flex-1">
          <h4 className="font-serif font-bold text-ayur-accent text-base md:text-lg mb-1 leading-tight">{title}</h4>
          <p className="text-xs md:text-sm text-ayur-text/60 line-clamp-2 mb-3">{description}</p>
          <a 
            href={link || "#"} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ayur-accent text-white text-[10px] md:text-xs font-bold rounded-lg hover:bg-ayur-accent-dark transition-colors shadow-sm"
          >
            {cta} <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
