import React from 'react';

interface PixelEmojiProps {
  type: 'star' | 'heart' | 'game' | 'music' | 'art' | 'book' | 'chat' | 'sparkle' | 'fire' | 'diamond' | 'crown' | 'rocket' | 'tv' | 'mail' | 'check' | 'arrow' | 'warning';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

export const PixelEmoji: React.FC<PixelEmojiProps> = ({ type, size = 'md', className = '', animate = false }) => {
  const sizeClass = sizeMap[size];
  const animateClass = animate ? 'animate-wiggle' : '';

  const emojiSVGs: Record<string, React.ReactNode> = {
    star: (
      <svg viewBox="0 0 16 16" className={`${sizeClass} ${animateClass} ${className}`}>
        <rect x="7" y="0" width="2" height="2" fill="#FFD700"/>
        <rect x="6" y="2" width="4" height="2" fill="#FFD700"/>
        <rect x="0" y="4" width="16" height="2" fill="#FFD700"/>
        <rect x="2" y="6" width="12" height="2" fill="#FFD700"/>
        <rect x="3" y="8" width="10" height="2" fill="#FFD700"/>
        <rect x="4" y="10" width="8" height="2" fill="#FFD700"/>
        <rect x="3" y="12" width="4" height="2" fill="#FFD700"/>
        <rect x="9" y="12" width="4" height="2" fill="#FFD700"/>
        <rect x="2" y="14" width="3" height="2" fill="#FFD700"/>
        <rect x="11" y="14" width="3" height="2" fill="#FFD700"/>
      </svg>
    ),
    heart: (
      <svg viewBox="0 0 16 16" className={`${sizeClass} ${animateClass} ${className}`}>
        <rect x="2" y="2" width="4" height="2" fill="#FF69B4"/>
        <rect x="10" y="2" width="4" height="2" fill="#FF69B4"/>
        <rect x="1" y="4" width="6" height="2" fill="#FF69B4"/>
        <rect x="9" y="4" width="6" height="2" fill="#FF69B4"/>
        <rect x="0" y="6" width="16" height="2" fill="#FF69B4"/>
        <rect x="0" y="8" width="16" height="2" fill="#FF69B4"/>
        <rect x="1" y="10" width="14" height="2" fill="#FF69B4"/>
        <rect x="2" y="12" width="12" height="2" fill="#FF69B4"/>
        <rect x="4" y="14" width="8" height="2" fill="#FF69B4"/>
      </svg>
    ),
    game: (
      <svg viewBox="0 0 16 16" className={`${sizeClass} ${animateClass} ${className}`}>
        <rect x="2" y="4" width="12" height="8" fill="#00FFFF"/>
        <rect x="4" y="2" width="8" height="2" fill="#00FFFF"/>
        <rect x="4" y="12" width="8" height="2" fill="#00FFFF"/>
        <rect x="4" y="6" width="2" height="4" fill="#0A0A1A"/>
        <rect x="3" y="7" width="4" height="2" fill="#0A0A1A"/>
        <rect x="10" y="6" width="2" height="2" fill="#FF69B4"/>
        <rect x="12" y="8" width="2" height="2" fill="#FFD700"/>
      </svg>
    ),
    music: (
      <svg viewBox="0 0 16 16" className={`${sizeClass} ${animateClass} ${className}`}>
        <rect x="6" y="0" width="2" height="12" fill="#FF69B4"/>
        <rect x="8" y="0" width="6" height="2" fill="#FF69B4"/>
        <rect x="12" y="2" width="2" height="6" fill="#FF69B4"/>
        <rect x="2" y="10" width="6" height="4" fill="#FF69B4"/>
        <rect x="4" y="8" width="4" height="2" fill="#FF69B4"/>
        <rect x="10" y="6" width="4" height="4" fill="#00FFFF"/>
        <rect x="12" y="4" width="2" height="2" fill="#00FFFF"/>
      </svg>
    ),
    art: (
      <svg viewBox="0 0 16 16" className={`${sizeClass} ${animateClass} ${className}`}>
        <rect x="4" y="2" width="8" height="12" fill="#FFD700"/>
        <rect x="2" y="4" width="2" height="8" fill="#FFD700"/>
        <rect x="12" y="4" width="2" height="8" fill="#FFD700"/>
        <rect x="5" y="5" width="2" height="2" fill="#FF69B4"/>
        <rect x="9" y="5" width="2" height="2" fill="#00FFFF"/>
        <rect x="7" y="8" width="2" height="2" fill="#9B59B6"/>
        <rect x="6" y="11" width="4" height="2" fill="#FF69B4"/>
      </svg>
    ),
    book: (
      <svg viewBox="0 0 16 16" className={`${sizeClass} ${animateClass} ${className}`}>
        <rect x="2" y="2" width="12" height="12" fill="#8B4513"/>
        <rect x="4" y="3" width="8" height="10" fill="#F5E6D3"/>
        <rect x="7" y="2" width="2" height="12" fill="#654321"/>
        <rect x="5" y="5" width="2" height="1" fill="#2F1810"/>
        <rect x="5" y="7" width="2" height="1" fill="#2F1810"/>
        <rect x="9" y="5" width="2" height="1" fill="#2F1810"/>
        <rect x="9" y="7" width="2" height="1" fill="#2F1810"/>
      </svg>
    ),
    chat: (
      <svg viewBox="0 0 16 16" className={`${sizeClass} ${animateClass} ${className}`}>
        <rect x="2" y="2" width="12" height="8" fill="#00FFFF"/>
        <rect x="4" y="0" width="8" height="2" fill="#00FFFF"/>
        <rect x="2" y="10" width="4" height="2" fill="#00FFFF"/>
        <rect x="4" y="12" width="2" height="2" fill="#00FFFF"/>
        <rect x="4" y="4" width="2" height="2" fill="#0A0A1A"/>
        <rect x="7" y="4" width="2" height="2" fill="#0A0A1A"/>
        <rect x="10" y="4" width="2" height="2" fill="#0A0A1A"/>
      </svg>
    ),
    sparkle: (
      <svg viewBox="0 0 16 16" className={`${sizeClass} ${animateClass} ${className}`}>
        <rect x="7" y="0" width="2" height="4" fill="#FFD700"/>
        <rect x="7" y="12" width="2" height="4" fill="#FFD700"/>
        <rect x="0" y="7" width="4" height="2" fill="#FFD700"/>
        <rect x="12" y="7" width="4" height="2" fill="#FFD700"/>
        <rect x="6" y="6" width="4" height="4" fill="#FFFFFF"/>
        <rect x="3" y="3" width="2" height="2" fill="#FFD700"/>
        <rect x="11" y="3" width="2" height="2" fill="#FFD700"/>
        <rect x="3" y="11" width="2" height="2" fill="#FFD700"/>
        <rect x="11" y="11" width="2" height="2" fill="#FFD700"/>
      </svg>
    ),
    fire: (
      <svg viewBox="0 0 16 16" className={`${sizeClass} ${animateClass} ${className}`}>
        <rect x="6" y="0" width="4" height="2" fill="#FF4500"/>
        <rect x="5" y="2" width="6" height="2" fill="#FF4500"/>
        <rect x="4" y="4" width="8" height="2" fill="#FF6B35"/>
        <rect x="3" y="6" width="10" height="2" fill="#FF6B35"/>
        <rect x="2" y="8" width="12" height="2" fill="#FFD700"/>
        <rect x="3" y="10" width="10" height="2" fill="#FFD700"/>
        <rect x="4" y="12" width="8" height="2" fill="#FFA500"/>
        <rect x="5" y="14" width="6" height="2" fill="#FFA500"/>
      </svg>
    ),
    diamond: (
      <svg viewBox="0 0 16 16" className={`${sizeClass} ${animateClass} ${className}`}>
        <rect x="6" y="0" width="4" height="2" fill="#00BFFF"/>
        <rect x="4" y="2" width="8" height="2" fill="#00BFFF"/>
        <rect x="2" y="4" width="12" height="2" fill="#00CED1"/>
        <rect x="3" y="6" width="10" height="2" fill="#00CED1"/>
        <rect x="4" y="8" width="8" height="2" fill="#40E0D0"/>
        <rect x="5" y="10" width="6" height="2" fill="#40E0D0"/>
        <rect x="6" y="12" width="4" height="2" fill="#48D1CC"/>
        <rect x="7" y="14" width="2" height="2" fill="#48D1CC"/>
      </svg>
    ),
    crown: (
      <svg viewBox="0 0 16 16" className={`${sizeClass} ${animateClass} ${className}`}>
        <rect x="1" y="4" width="2" height="8" fill="#FFD700"/>
        <rect x="7" y="2" width="2" height="10" fill="#FFD700"/>
        <rect x="13" y="4" width="2" height="8" fill="#FFD700"/>
        <rect x="3" y="6" width="10" height="6" fill="#FFD700"/>
        <rect x="2" y="12" width="12" height="2" fill="#FFD700"/>
        <rect x="4" y="8" width="2" height="2" fill="#FF0000"/>
        <rect x="7" y="6" width="2" height="2" fill="#FF0000"/>
        <rect x="10" y="8" width="2" height="2" fill="#FF0000"/>
      </svg>
    ),
    rocket: (
      <svg viewBox="0 0 16 16" className={`${sizeClass} ${animateClass} ${className}`}>
        <rect x="7" y="0" width="2" height="2" fill="#C0C0C0"/>
        <rect x="6" y="2" width="4" height="4" fill="#C0C0C0"/>
        <rect x="5" y="6" width="6" height="4" fill="#E8E8E8"/>
        <rect x="4" y="10" width="8" height="2" fill="#FF4500"/>
        <rect x="3" y="8" width="2" height="4" fill="#00BFFF"/>
        <rect x="11" y="8" width="2" height="4" fill="#00BFFF"/>
        <rect x="5" y="12" width="2" height="2" fill="#FF6B35"/>
        <rect x="9" y="12" width="2" height="2" fill="#FF6B35"/>
        <rect x="6" y="14" width="4" height="2" fill="#FFD700"/>
      </svg>
    ),
    tv: (
      <svg viewBox="0 0 16 16" className={`${sizeClass} ${animateClass} ${className}`}>
        <rect x="1" y="3" width="14" height="10" fill="#333"/>
        <rect x="2" y="4" width="12" height="8" fill="#FF0000"/>
        <rect x="4" y="6" width="8" height="4" fill="#FFFFFF"/>
        <rect x="5" y="13" width="6" height="2" fill="#333"/>
        <rect x="3" y="0" width="2" height="3" fill="#666"/>
        <rect x="11" y="0" width="2" height="3" fill="#666"/>
      </svg>
    ),
    mail: (
      <svg viewBox="0 0 16 16" className={`${sizeClass} ${animateClass} ${className}`}>
        <rect x="1" y="3" width="14" height="10" fill="#9B59B6"/>
        <rect x="2" y="4" width="12" height="8" fill="#8E44AD"/>
        <rect x="1" y="3" width="2" height="2" fill="#D4A5E8"/>
        <rect x="3" y="5" width="2" height="2" fill="#D4A5E8"/>
        <rect x="5" y="7" width="2" height="2" fill="#D4A5E8"/>
        <rect x="13" y="3" width="2" height="2" fill="#D4A5E8"/>
        <rect x="11" y="5" width="2" height="2" fill="#D4A5E8"/>
        <rect x="9" y="7" width="2" height="2" fill="#D4A5E8"/>
        <rect x="7" y="8" width="2" height="2" fill="#FFFFFF"/>
      </svg>
    ),
    check: (
      <svg viewBox="0 0 16 16" className={`${sizeClass} ${animateClass} ${className}`}>
        <rect x="12" y="2" width="2" height="2" fill="#00FF00"/>
        <rect x="10" y="4" width="2" height="2" fill="#00FF00"/>
        <rect x="8" y="6" width="2" height="2" fill="#00FF00"/>
        <rect x="6" y="8" width="2" height="2" fill="#00FF00"/>
        <rect x="4" y="6" width="2" height="2" fill="#00FF00"/>
        <rect x="2" y="4" width="2" height="2" fill="#00FF00"/>
        <rect x="4" y="10" width="2" height="2" fill="#00FF00"/>
      </svg>
    ),
    arrow: (
      <svg viewBox="0 0 16 16" className={`${sizeClass} ${animateClass} ${className}`}>
        <rect x="2" y="7" width="10" height="2" fill="#00FFFF"/>
        <rect x="8" y="3" width="2" height="4" fill="#00FFFF"/>
        <rect x="8" y="9" width="2" height="4" fill="#00FFFF"/>
        <rect x="10" y="5" width="2" height="2" fill="#00FFFF"/>
        <rect x="10" y="9" width="2" height="2" fill="#00FFFF"/>
        <rect x="12" y="7" width="2" height="2" fill="#00FFFF"/>
      </svg>
    ),
    warning: (
      <svg viewBox="0 0 16 16" className={`${sizeClass} ${animateClass} ${className}`}>
        <rect x="7" y="1" width="2" height="2" fill="#FFD700"/>
        <rect x="6" y="3" width="4" height="2" fill="#FFD700"/>
        <rect x="5" y="5" width="6" height="2" fill="#FFD700"/>
        <rect x="4" y="7" width="8" height="2" fill="#FFD700"/>
        <rect x="3" y="9" width="10" height="2" fill="#FFD700"/>
        <rect x="2" y="11" width="12" height="2" fill="#FFD700"/>
        <rect x="1" y="13" width="14" height="2" fill="#FFD700"/>
        <rect x="7" y="5" width="2" height="4" fill="#000"/>
        <rect x="7" y="10" width="2" height="2" fill="#000"/>
      </svg>
    )
  };

  return emojiSVGs[type] || null;
};
