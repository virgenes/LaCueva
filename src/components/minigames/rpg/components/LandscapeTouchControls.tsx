import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Maximize, Menu } from 'lucide-react';

interface LandscapeTouchControlsProps {
  onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onInteract: () => void;
  onMenu?: () => void;
  onFullscreen?: () => void;
  disabled?: boolean;
}

/**
 * PSP-style landscape controls:
 * Left side: D-pad
 * Right side: action buttons (A/B/X/Y style) + shoulder buttons
 */
export const LandscapeTouchControls: React.FC<LandscapeTouchControlsProps> = ({
  onMove, onInteract, onMenu, onFullscreen, disabled = false,
}) => {
  const [activeDir, setActiveDir] = useState<string | null>(null);
  const moveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startMove = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    if (disabled) return;
    setActiveDir(dir);
    onMove(dir);
    // Continuous movement while held
    moveIntervalRef.current = setInterval(() => onMove(dir), 150);
  }, [disabled, onMove]);

  const stopMove = useCallback(() => {
    setActiveDir(null);
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = null;
    }
  }, []);

  useEffect(() => () => { if (moveIntervalRef.current) clearInterval(moveIntervalRef.current); }, []);

  const dpadBtn = (dir: string, icon: React.ReactNode, className: string) => (
    <button
      onTouchStart={(e) => { e.preventDefault(); startMove(dir as any); }}
      onTouchEnd={(e) => { e.preventDefault(); stopMove(); }}
      onTouchCancel={stopMove}
      className={`flex items-center justify-center touch-manipulation select-none
        transition-all duration-50 active:scale-90
        ${activeDir === dir ? 'bg-white/25 shadow-[0_0_12px_rgba(255,255,255,0.3)]' : 'bg-white/8 hover:bg-white/12'}
        border border-white/20 ${className}`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {icon}
    </button>
  );

  const actionBtn = (label: string, color: string, action: () => void, size: string = 'w-12 h-12') => (
    <button
      onTouchStart={(e) => { e.preventDefault(); if (!disabled) action(); }}
      className={`${size} rounded-full flex items-center justify-center font-pixel text-sm font-bold
        border-2 touch-manipulation select-none active:scale-90 transition-all duration-50`}
      style={{
        borderColor: color,
        color: color,
        backgroundColor: `${color}15`,
        boxShadow: `0 0 8px ${color}30`,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="absolute inset-0 pointer-events-none z-40 flex items-stretch justify-between">
      {/* === LEFT: D-Pad === */}
      <div className="pointer-events-auto flex items-center pl-3 pb-2">
        <div className="relative w-[120px] h-[120px]">
          {/* Up */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2">
            {dpadBtn('up', <ChevronUp size={22} className="text-white/80" />, 'w-10 h-10 rounded-t-lg')}
          </div>
          {/* Down */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
            {dpadBtn('down', <ChevronDown size={22} className="text-white/80" />, 'w-10 h-10 rounded-b-lg')}
          </div>
          {/* Left */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            {dpadBtn('left', <ChevronLeft size={22} className="text-white/80" />, 'w-10 h-10 rounded-l-lg')}
          </div>
          {/* Right */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            {dpadBtn('right', <ChevronRight size={22} className="text-white/80" />, 'w-10 h-10 rounded-r-lg')}
          </div>
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10" />
          </div>
        </div>
      </div>

      {/* === CENTER BOTTOM: START / SELECT === */}
      <div className="pointer-events-auto flex items-end gap-4 pb-3">
        {onMenu && (
          <button
            onTouchStart={(e) => { e.preventDefault(); onMenu(); }}
            className="px-3 py-1 rounded-full bg-white/8 border border-white/20 font-pixel text-[7px] text-white/50
              touch-manipulation select-none active:bg-white/15"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            MENU
          </button>
        )}
        {onFullscreen && (
          <button
            onTouchStart={(e) => { e.preventDefault(); onFullscreen(); }}
            className="px-3 py-1 rounded-full bg-white/8 border border-white/20 font-pixel text-[7px] text-white/50
              touch-manipulation select-none active:bg-white/15"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Maximize size={10} />
          </button>
        )}
      </div>

      {/* === RIGHT: Action buttons (diamond layout like PSP/DS) === */}
      <div className="pointer-events-auto flex items-center pr-3 pb-2">
        <div className="relative w-[120px] h-[120px]">
          {/* X - top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2">
            {actionBtn('X', '#a855f7', onInteract, 'w-11 h-11')}
          </div>
          {/* Y - left */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            {actionBtn('Y', '#eab308', onMenu || (() => {}), 'w-11 h-11')}
          </div>
          {/* A - right (main action) */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            {actionBtn('A', '#22c55e', onInteract, 'w-11 h-11')}
          </div>
          {/* B - bottom */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
            {actionBtn('B', '#ef4444', () => {}, 'w-11 h-11')}
          </div>
        </div>
      </div>
    </div>
  );
};
