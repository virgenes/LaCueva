import React from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { cn } from '@/lib/utils';

interface GameCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  glowing?: boolean;
}

export const GameCard: React.FC<GameCardProps> = ({
  children,
  className,
  onClick,
  hoverable = true,
  glowing = false,
}) => {
  const { playClick, playHover } = useSoundEffects();

  const handleClick = () => {
    if (onClick) {
      playClick();
      onClick();
    }
  };

  return (
    <div
      className={cn(
        'game-card p-4 rounded-sm relative overflow-hidden',
        hoverable && 'cursor-pointer',
        glowing && 'animate-pixel-pulse',
        className
      )}
      onClick={handleClick}
      onMouseEnter={hoverable ? playHover : undefined}
    >
      {children}
    </div>
  );
};
