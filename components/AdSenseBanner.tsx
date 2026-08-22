import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdSenseBannerProps {
  slotId?: string;
  clientId?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
  className?: string;
  showLabel?: boolean;
}

const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  slotId = '3445970693',
  clientId = 'ca-pub-1707058266999409',
  format = 'auto',
  responsive = true,
  className = '',
  showLabel = true,
}) => {
  const adRef = useRef<HTMLModElement | null>(null);
  const isLoadedRef = useRef(false);

  useEffect(() => {
    // Avoid double push in React StrictMode
    if (isLoadedRef.current) return;

    const timer = setTimeout(() => {
      try {
        if (typeof window !== 'undefined' && adRef.current) {
          // Check if ad hasn't already been populated
          if (!adRef.current.getAttribute('data-adsbygoogle-status')) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            isLoadedRef.current = true;
          }
        }
      } catch (err) {
        // Suppress benign script errors in sandboxed or adblocked environments
        console.debug('AdSense script notification:', err);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`w-full max-w-full my-5 p-2 sm:p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between px-2 pb-1.5 mb-1 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <span>Publicidade</span>
          <span className="text-[9px] text-slate-300 font-normal">Google AdSense</span>
        </div>
      )}
      
      <div className="w-full flex justify-center items-center min-h-[90px] overflow-hidden bg-slate-50/50 rounded-xl">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', minWidth: '250px', width: '100%' }}
          data-ad-client={clientId}
          data-ad-slot={slotId}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
        />
      </div>
    </div>
  );
};

export default AdSenseBanner;
