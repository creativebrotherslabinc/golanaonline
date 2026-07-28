import React from 'react';

interface AdSenseProps {
  slot: 'top' | 'mid' | 'sidebar' | 'bottom';
  className?: string;
}

export function AdSense({ slot, className = '' }: AdSenseProps) {
  const dimensions = {
    top: 'max-w-[970px] h-[90px] mx-auto',
    mid: 'max-w-[728px] h-[90px] mx-auto',
    bottom: 'max-w-[970px] h-[90px] mx-auto',
    sidebar: 'w-[300px] h-[600px]'
  };

  return (
    <div 
      className={`bg-muted/50 border-2 border-dashed border-muted-foreground/20 rounded-md flex items-center justify-center text-muted-foreground/50 text-sm font-medium ${dimensions[slot]} ${className}`}
      aria-hidden="true"
    >
      [AdSense {slot.charAt(0).toUpperCase() + slot.slice(1)} Banner]
    </div>
  );
}
