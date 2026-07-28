import React, { useEffect, useRef } from 'react';

interface AdSenseProps {
  slot: 'top' | 'mid' | 'sidebar' | 'bottom';
  className?: string;
}

// AdSense publisher ID
const CLIENT = 'ca-pub-1838841424732275';

// Map each slot to an ad-unit slot ID and format
const SLOT_CONFIG: Record<AdSenseProps['slot'], { slotId: string; format: string; fullWidth: boolean }> = {
  top:     { slotId: '1234567890', format: 'auto', fullWidth: true },
  mid:     { slotId: '1234567891', format: 'auto', fullWidth: true },
  bottom:  { slotId: '1234567892', format: 'auto', fullWidth: true },
  sidebar: { slotId: '1234567893', format: 'auto', fullWidth: false },
};

export function AdSense({ slot, className = '' }: AdSenseProps) {
  const ref = useRef<HTMLModElement>(null);
  const { slotId, format, fullWidth } = SLOT_CONFIG[slot];

  useEffect(() => {
    try {
      // Push the ad after the component mounts
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      // Silently ignore – ad blocker or script not yet loaded
    }
  }, []);

  const wrapperClass = {
    top:     'w-full max-w-[970px] mx-auto min-h-[90px]',
    mid:     'w-full max-w-[728px] mx-auto min-h-[90px]',
    bottom:  'w-full max-w-[970px] mx-auto min-h-[90px]',
    sidebar: 'w-[300px] min-h-[250px]',
  }[slot];

  return (
    <div className={`${wrapperClass} ${className}`}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={CLIENT}
        data-ad-slot={slotId}
        data-ad-format={format}
        {...(fullWidth ? { 'data-full-width-responsive': 'true' } : {})}
      />
    </div>
  );
}
