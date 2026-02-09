import React, { useState, useEffect, useCallback } from 'react';
import { ImageSprite } from '../data/imageSprites';

interface ImageSpriteRendererProps {
  sprite: ImageSprite;
  animation?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  paused?: boolean;
  direction?: 'left' | 'right' | 'up' | 'down';
}

export const ImageSpriteRenderer: React.FC<ImageSpriteRendererProps> = ({
  sprite,
  animation,
  size = 32,
  className = '',
  style = {},
  paused = false,
  direction = 'down',
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  
  const currentAnimation = sprite.animations[animation || sprite.defaultAnimation];
  
  // Animate through frames
  useEffect(() => {
    if (!currentAnimation || paused) return;
    
    const interval = setInterval(() => {
      setCurrentFrame(prev => {
        const nextFrame = prev + 1;
        if (nextFrame >= currentAnimation.frameCount) {
          return currentAnimation.loop ? 0 : prev;
        }
        return nextFrame;
      });
    }, currentAnimation.speed);
    
    return () => clearInterval(interval);
  }, [currentAnimation, paused]);
  
  // Reset frame when animation changes
  useEffect(() => {
    setCurrentFrame(0);
  }, [animation]);
  
  if (!currentAnimation) {
    return null;
  }
  
  // Calculate sprite sheet position
  const backgroundX = -(currentFrame * sprite.frameWidth);
  const backgroundY = -(currentAnimation.row * sprite.frameHeight);
  
  // Scale factor
  const scale = size / sprite.frameWidth;
  
  // Flip for left direction
  const shouldFlip = direction === 'left';
  
  return (
    <div
      className={`${className} overflow-hidden`}
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
        transform: shouldFlip ? 'scaleX(-1)' : 'scaleX(1)',
        ...style,
      }}
    >
      <div
        style={{
          width: sprite.frameWidth,
          height: sprite.frameHeight,
          backgroundImage: `url(${sprite.src})`,
          backgroundPosition: `${backgroundX}px ${backgroundY}px`,
          backgroundRepeat: 'no-repeat',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
};
