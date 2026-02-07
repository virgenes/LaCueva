import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Maximize, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

interface TouchControlsProps {
  onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onInteract: () => void;
  onMenu?: () => void;
  onFullscreen?: () => void;
  disabled?: boolean;
  opacity?: number;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMove,
  onInteract,
  onMenu,
  onFullscreen,
  disabled = false,
  opacity = 0.8,
}) => {
  const [activeDirection, setActiveDirection] = useState<string | null>(null);

  const handleTouch = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!disabled) {
      setActiveDirection(direction);
      onMove(direction);
    }
  };

  const handleTouchEnd = () => {
    setActiveDirection(null);
  };

  const buttonClass = (direction: string) => `
    w-12 h-12 flex items-center justify-center rounded-lg
    border-2 transition-all duration-75
    ${activeDirection === direction 
      ? 'bg-neon-cyan/50 border-neon-cyan scale-95 shadow-lg shadow-neon-cyan/30' 
      : 'bg-card/80 border-border hover:border-muted-foreground'}
    active:scale-90 backdrop-blur-sm
  `;

  return (
    <div 
      className="absolute bottom-2 left-0 right-0 flex justify-between items-end px-3 pointer-events-none"
      style={{ opacity }}
    >
      {/* D-Pad with improved layout */}
      <div className="relative pointer-events-auto">
        {/* Up button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onTouchStart={() => handleTouch('up')}
          onTouchEnd={handleTouchEnd}
          onClick={() => handleTouch('up')}
          className={`${buttonClass('up')} absolute -top-12 left-1/2 -translate-x-1/2`}
          disabled={disabled}
        >
          <ChevronUp size={24} className="text-foreground" />
        </motion.button>

        {/* Middle row: Left, Center, Right */}
        <div className="flex items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onTouchStart={() => handleTouch('left')}
            onTouchEnd={handleTouchEnd}
            onClick={() => handleTouch('left')}
            className={buttonClass('left')}
            disabled={disabled}
          >
            <ChevronLeft size={24} className="text-foreground" />
          </motion.button>
          
          {/* Center indicator */}
          <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
          </div>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            onTouchStart={() => handleTouch('right')}
            onTouchEnd={handleTouchEnd}
            onClick={() => handleTouch('right')}
            className={buttonClass('right')}
            disabled={disabled}
          >
            <ChevronRight size={24} className="text-foreground" />
          </motion.button>
        </div>

        {/* Down button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onTouchStart={() => handleTouch('down')}
          onTouchEnd={handleTouchEnd}
          onClick={() => handleTouch('down')}
          className={`${buttonClass('down')} absolute -bottom-12 left-1/2 -translate-x-1/2`}
          disabled={disabled}
        >
          <ChevronDown size={24} className="text-foreground" />
        </motion.button>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col items-end gap-2 pointer-events-auto">
        {/* Secondary buttons row */}
        <div className="flex gap-2">
          {onMenu && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onMenu}
              className="w-10 h-10 flex items-center justify-center rounded-lg
                bg-card/80 border-2 border-star-gold/50 backdrop-blur-sm
                active:bg-star-gold/30 transition-colors"
            >
              <Menu size={18} className="text-star-gold" />
            </motion.button>
          )}
          {onFullscreen && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onFullscreen}
              className="w-10 h-10 flex items-center justify-center rounded-lg
                bg-card/80 border-2 border-muted-foreground/50 backdrop-blur-sm
                active:bg-muted/50 transition-colors"
            >
              <Maximize size={18} className="text-muted-foreground" />
            </motion.button>
          )}
        </div>

        {/* Main action button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onTouchStart={onInteract}
          onClick={onInteract}
          disabled={disabled}
          className="w-16 h-16 flex items-center justify-center rounded-full
            bg-gradient-to-br from-neon-cyan to-neon-cyan/70 
            border-4 border-neon-cyan shadow-lg shadow-neon-cyan/30
            active:shadow-neon-cyan/50 active:scale-95 
            transition-all font-pixel text-sm text-night-deep
            backdrop-blur-sm"
        >
          A
        </motion.button>
      </div>
    </div>
  );
};
