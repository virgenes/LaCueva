import React, { useState, useEffect } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTouchStart = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!disabled) {
      setActiveDirection(direction);
      onMove(direction);
    }
  };

  const handleTouchEnd = () => {
    setActiveDirection(null);
  };

  const handleInteract = () => {
    if (!disabled) {
      onInteract();
    }
  };

  const buttonClass = (direction: string) => `
    w-14 h-14 flex items-center justify-center rounded-full
    border-2 transition-all duration-75
    ${activeDirection === direction 
      ? 'bg-neon-cyan/70 border-neon-cyan scale-95 shadow-lg shadow-neon-cyan/50' 
      : 'bg-card/90 border-border/70 hover:border-neon-cyan/50'}
    active:scale-90 backdrop-blur-sm
    touch-manipulation select-none
  `;

  // For mobile, show larger controls
  const controlSize = isMobile ? 'w-16 h-16' : 'w-14 h-14';
  const iconSize = isMobile ? 28 : 24;

  return (
    <div 
      className="fixed bottom-4 left-0 right-0 flex justify-between items-end px-4 pointer-events-none z-40"
      style={{ opacity }}
    >
      {/* D-Pad Container */}
      <div className="relative pointer-events-auto">
        {/* D-Pad Grid */}
        <div className="grid grid-cols-3 grid-rows-3 gap-1">
          {/* Empty top-left */}
          <div className="w-14 h-14" />
          
          {/* Up button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onTouchStart={() => handleTouchStart('up')}
            onTouchEnd={handleTouchEnd}
            onMouseDown={() => handleTouchStart('up')}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
            className={`${buttonClass('up')} ${controlSize} col-start-2 row-start-1`}
            disabled={disabled}
          >
            <ChevronUp size={iconSize} className="text-foreground" />
          </motion.button>
          
          {/* Empty top-right */}
          <div className="w-14 h-14" />

          {/* Left button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onTouchStart={() => handleTouchStart('left')}
            onTouchEnd={handleTouchEnd}
            onMouseDown={() => handleTouchStart('left')}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
            className={`${buttonClass('left')} ${controlSize} col-start-1 row-start-2`}
            disabled={disabled}
          >
            <ChevronLeft size={iconSize} className="text-foreground" />
          </motion.button>
          
          {/* Center indicator */}
          <div className={`${controlSize} flex items-center justify-center bg-muted/40 rounded-full border border-border/50`}>
            <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
          </div>
          
          {/* Right button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onTouchStart={() => handleTouchStart('right')}
            onTouchEnd={handleTouchEnd}
            onMouseDown={() => handleTouchStart('right')}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
            className={`${buttonClass('right')} ${controlSize} col-start-3 row-start-2`}
            disabled={disabled}
          >
            <ChevronRight size={iconSize} className="text-foreground" />
          </motion.button>

          {/* Empty bottom-left */}
          <div className="w-14 h-14" />
          
          {/* Down button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onTouchStart={() => handleTouchStart('down')}
            onTouchEnd={handleTouchEnd}
            onMouseDown={() => handleTouchStart('down')}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
            className={`${buttonClass('down')} ${controlSize} col-start-2 row-start-3`}
            disabled={disabled}
          >
            <ChevronDown size={iconSize} className="text-foreground" />
          </motion.button>
          
          {/* Empty bottom-right */}
          <div className="w-14 h-14" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col items-end gap-3 pointer-events-auto">
        {/* Secondary buttons row */}
        <div className="flex gap-2">
          {onMenu && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onMenu}
              onTouchStart={onMenu}
              className={`${controlSize} flex items-center justify-center rounded-full
                bg-card/90 border-2 border-star-gold/50 backdrop-blur-sm
                active:bg-star-gold/30 transition-colors`}
            >
              <Menu size={iconSize * 0.6} className="text-star-gold" />
            </motion.button>
          )}
          {onFullscreen && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onFullscreen}
              onTouchStart={onFullscreen}
              className={`${controlSize} flex items-center justify-center rounded-full
                bg-card/90 border-2 border-muted-foreground/50 backdrop-blur-sm
                active:bg-muted/50 transition-colors`}
            >
              <Maximize size={iconSize * 0.6} className="text-muted-foreground" />
            </motion.button>
          )}
        </div>

        {/* Main action button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onTouchStart={handleInteract}
          onClick={handleInteract}
          disabled={disabled}
          className={`${controlSize} flex items-center justify-center rounded-full
            bg-gradient-to-br from-neon-cyan to-neon-cyan/70 
            border-4 border-neon-cyan shadow-lg shadow-neon-cyan/30
            active:shadow-neon-cyan/50 active:scale-95 
            transition-all font-pixel text-lg text-night-deep font-bold
            backdrop-blur-sm select-none`}
        >
          A
        </motion.button>
      </div>
    </div>
  );
};
