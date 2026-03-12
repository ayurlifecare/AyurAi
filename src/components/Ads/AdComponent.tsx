import React, { useEffect } from 'react';

interface AdComponentProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  style?: React.CSSProperties;
}

export function AdComponent({ slot, format = 'auto', style }: AdComponentProps) {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, []);

  return (
    <div className="ad-container my-4 overflow-hidden flex justify-center bg-gray-50/50 rounded-lg border border-gray-100 min-h-[100px] items-center text-xs text-gray-400 italic">
      <ins
        className="adsbygoogle"
        style={style || { display: 'block' }}
        data-ad-client={import.meta.env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-XXXXXXXXXXXXXXXX'}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
      <span className="absolute">Advertisement</span>
    </div>
  );
}
