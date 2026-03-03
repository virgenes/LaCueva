import React, { useState, useEffect } from 'react';
import { getMonsterSpriteAsset } from '../data/monsterSpriteAssets';
import { SpriteRenderer } from './SpriteRenderer';

interface MonsterSpriteRendererProps {
  monsterId: string;
  fallbackSprite: string[][];
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const MonsterSpriteRenderer: React.FC<MonsterSpriteRendererProps> = ({
  monsterId,
  fallbackSprite,
  size = 6,
  className = '',
  style = {},
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  
  const spriteAsset = getMonsterSpriteAsset(monsterId);
  
  // Animate through frames for idle animation (only for slime)
  useEffect(() => {
    if (!spriteAsset) return;
    
    // Only animate slime
    if (monsterId !== 'slime') {
      setCurrentFrame(0);
      return;
    }
    
    const idleAnim = spriteAsset.animations.idle;
    const maxFrames = idleAnim?.frames || 1;
    
    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % maxFrames);
    }, 150); // 150ms per frame (~6.7 FPS)
    
    return () => clearInterval(interval);
  }, [spriteAsset, monsterId]);
  
  // If no PNG sprite asset, use fallback SpriteRenderer
  if (!spriteAsset) {
    return <SpriteRenderer sprite={fallbackSprite} size={size} />;
  }
  
  const { frameWidth, frameHeight, animations } = spriteAsset;
  const idleAnim = animations.idle;
  const baseCol = idleAnim?.col || 0;
  const row = idleAnim?.row || 0;
  const col = baseCol + currentFrame;
  
  // Calculate scale based on size
  const scale = (size * 8) / frameWidth; // size is in "tiles", each tile is 8 pixels base
  
  // Calculate total spritesheet size
  const maxCols = Math.max(...Object.values(animations).map(a => (a.col || 0) + (a.frames || 1)));
  const maxRows = Math.max(...Object.values(animations).map(a => a.row)) + 1;
  
  return (
    <div
      className={`pixelated ${className}`}
      style={{
        width: `${frameWidth * scale}px`,
        height: `${frameHeight * scale}px`,
        imageRendering: 'pixelated',
        backgroundImage: `url(${spriteAsset.src})`,
        backgroundPosition: `-${col * frameWidth * scale}px -${row * frameHeight * scale}px`,
        backgroundSize: `${frameWidth * maxCols * scale}px ${frameHeight * maxRows * scale}px`,
        backgroundRepeat: 'no-repeat',
        transition: 'none',
        ...style,
      }}
    />
  );
};
