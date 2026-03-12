import React from 'react';
import { BRAND_CONFIG } from '../constants';
import { LucideIcon } from 'lucide-react';

interface BrandLogoProps {
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  alt?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  iconContainerClassName?: string;
}

export function BrandLogo({ className, imageClassName, textClassName, alt, icon: Icon, iconClassName, iconContainerClassName }: BrandLogoProps) {
  if (BRAND_CONFIG.logoUrl) {
    return (
      <img 
        src={BRAND_CONFIG.logoUrl} 
        alt={alt || BRAND_CONFIG.name} 
        className={imageClassName || "h-8 w-auto"} 
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div className={className || "flex items-center gap-2"}>
      {Icon && (
        <div className={iconContainerClassName || "w-8 h-8 md:w-10 md:h-10 rounded-xl bg-ayur-accent/10 flex items-center justify-center"}>
          <Icon className={iconClassName || "text-ayur-accent"} size={20} />
        </div>
      )}
      <span className={textClassName || "font-serif font-bold text-2xl tracking-tight text-ayur-accent"}>
        {BRAND_CONFIG.name}
      </span>
    </div>
  );
}
