import React from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { cn } from '@/lib/utils';

interface RetroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'cyan' | 'pink' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const RetroButton: React.FC<RetroButtonProps> = ({
  variant = 'cyan',
  size = 'md',
  children,
  className,
  onClick,
  ...props
}) => {
  const { playClick, playHover } = useSoundEffects();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    playClick();
    onClick?.(e);
  };

  const baseStyles = `
    font-pixel text-xs uppercase tracking-wider
    border-[3px] border-night-deep
    transition-all duration-100 cursor-pointer
    active:translate-y-[2px]
  `;

  const variantStyles = {
    cyan: `
      bg-gradient-to-b from-neon-cyan to-primary
      shadow-[inset_-2px_-3px_0_hsl(180_100%_35%),inset_2px_2px_0_hsl(180_100%_70%),4px_4px_0px_hsl(252_40%_5%)]
      hover:shadow-[inset_-2px_-3px_0_hsl(180_100%_35%),inset_2px_2px_0_hsl(180_100%_70%),6px_6px_0px_hsl(252_40%_5%)]
      hover:-translate-y-[2px] hover:-translate-x-[1px]
      active:shadow-[inset_2px_3px_0_hsl(180_100%_35%),inset_-2px_-2px_0_hsl(180_100%_70%),2px_2px_0px_hsl(252_40%_5%)]
      text-night-deep
    `,
    pink: `
      bg-gradient-to-b from-neon-pink to-secondary
      shadow-[inset_-2px_-3px_0_hsl(320_100%_40%),inset_2px_2px_0_hsl(320_100%_75%),4px_4px_0px_hsl(252_40%_5%)]
      hover:shadow-[inset_-2px_-3px_0_hsl(320_100%_40%),inset_2px_2px_0_hsl(320_100%_75%),6px_6px_0px_hsl(252_40%_5%)]
      hover:-translate-y-[2px] hover:-translate-x-[1px]
      active:shadow-[inset_2px_3px_0_hsl(320_100%_40%),inset_-2px_-2px_0_hsl(320_100%_75%),2px_2px_0px_hsl(252_40%_5%)]
      text-white
    `,
    gold: `
      bg-gradient-to-b from-star-gold to-accent
      shadow-[inset_-2px_-3px_0_hsl(45_100%_40%),inset_2px_2px_0_hsl(45_100%_75%),4px_4px_0px_hsl(252_40%_5%)]
      hover:shadow-[inset_-2px_-3px_0_hsl(45_100%_40%),inset_2px_2px_0_hsl(45_100%_75%),6px_6px_0px_hsl(252_40%_5%)]
      hover:-translate-y-[2px] hover:-translate-x-[1px]
      active:shadow-[inset_2px_3px_0_hsl(45_100%_40%),inset_-2px_-2px_0_hsl(45_100%_75%),2px_2px_0px_hsl(252_40%_5%)]
      text-night-deep
    `,
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-[8px]',
    md: 'px-4 py-2 text-[10px]',
    lg: 'px-6 py-3 text-xs',
  };

  return (
    <button
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      onClick={handleClick}
      onMouseEnter={playHover}
      {...props}
    >
      {children}
    </button>
  );
};
