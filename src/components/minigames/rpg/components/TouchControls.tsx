import React from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface TouchControlsProps {
  onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onInteract: () => void;
  disabled?: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMove,
  onInteract,
  disabled = false,
}) => {
  const handleTouch = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!disabled) {
      onMove(direction);
    }
  };

  return (
    <div className="absolute bottom-4 left-0 right-0 flex justify-between items-end px-4 pointer-events-none">
      {/* D-Pad */}
      <div className="grid grid-cols-3 gap-0.5 pointer-events-auto">
        <div />
        <button
          onTouchStart={() => handleTouch('up')}
          onClick={() => handleTouch('up')}
          className="w-10 h-10 flex items-center justify-center bg-muted/80 border border-border rounded-sm
            active:bg-neon-cyan/30 active:border-neon-cyan transition-colors"
          disabled={disabled}
        >
          <ChevronUp size={20} className="text-foreground" />
        </button>
        <div />
        
        <button
          onTouchStart={() => handleTouch('left')}
          onClick={() => handleTouch('left')}
          className="w-10 h-10 flex items-center justify-center bg-muted/80 border border-border rounded-sm
            active:bg-neon-cyan/30 active:border-neon-cyan transition-colors"
          disabled={disabled}
        >
          <ChevronLeft size={20} className="text-foreground" />
        </button>
        <div className="w-10 h-10" />
        <button
          onTouchStart={() => handleTouch('right')}
          onClick={() => handleTouch('right')}
          className="w-10 h-10 flex items-center justify-center bg-muted/80 border border-border rounded-sm
            active:bg-neon-cyan/30 active:border-neon-cyan transition-colors"
          disabled={disabled}
        >
          <ChevronRight size={20} className="text-foreground" />
        </button>
        
        <div />
        <button
          onTouchStart={() => handleTouch('down')}
          onClick={() => handleTouch('down')}
          className="w-10 h-10 flex items-center justify-center bg-muted/80 border border-border rounded-sm
            active:bg-neon-cyan/30 active:border-neon-cyan transition-colors"
          disabled={disabled}
        >
          <ChevronDown size={20} className="text-foreground" />
        </button>
        <div />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pointer-events-auto">
        <button
          onTouchStart={onInteract}
          onClick={onInteract}
          className="w-14 h-14 flex items-center justify-center bg-neon-cyan/80 border-2 border-neon-cyan rounded-full
            active:bg-neon-cyan active:scale-95 transition-all font-pixel text-[8px] text-night-deep"
        >
          A
        </button>
      </div>
    </div>
  );
};
