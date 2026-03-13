import React from 'react';
import { ExternalLink, ShoppingBag } from 'lucide-react';

interface CompactAdProps {
  title: string;
  description: string;
  link?: string;
  cta?: string;
}

export function CompactAd({ title, description, link, cta = "View Product" }: CompactAdProps) {
  return (
    <div className="mt-4 pt-4 border-t border-ayur-accent/10">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[8px] font-bold text-ayur-accent/40 uppercase tracking-widest">Sponsored Recommendation</span>
      </div>
      <div className="bg-white/50 dark:bg-black/10 rounded-xl p-3 border border-ayur-accent/5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-ayur-accent/10 flex items-center justify-center shrink-0">
          <ShoppingBag size={18} className="text-ayur-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h5 className="text-xs font-bold text-ayur-accent truncate">{title}</h5>
          <p className="text-[10px] text-ayur-text/60 line-clamp-1">{description}</p>
        </div>
        <a 
          href={link || "#"} 
          target="_blank" 
          rel="noopener noreferrer"
          className="shrink-0 p-2 bg-ayur-accent/10 text-ayur-accent rounded-lg hover:bg-ayur-accent hover:text-white transition-all"
          title={cta}
        >
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
