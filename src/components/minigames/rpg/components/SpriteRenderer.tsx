import React, { useMemo } from 'react';
import { imageTiles, isImageTile } from '../data/imageTiles';
import { ImageTileRenderer } from './ImageTileRenderer';

interface SpriteRendererProps {
  // Can be either a 2D array of CSS colors OR a tile ID string
  sprite: string[][] | string;
  size?: number; // Size of each pixel (for array) or total size (for image)
  className?: string;
  style?: React.CSSProperties;
}

export const SpriteRenderer: React.FC<SpriteRendererProps> = ({
  sprite,
  size = 4,
  className = '',
  style = {},
}) => {
  // Memoize the array-based sprite rendering
  const arraySprite = useMemo(() => {
    // Only process if it's an array
    if (typeof sprite !== 'object' || !Array.isArray(sprite) || sprite.length === 0) {
      return null;
    }
    
    const height = sprite.length;
    const width = sprite[0]?.length || 0;
    
    return (
      <svg
        width={width * size}
        height={height * size}
        viewBox={`0 0 ${width * size} ${height * size}`}
        style={{ imageRendering: 'pixelated', ...style }}
        className={className}
      >
        {sprite.map((row, y) =>
          row.map((color, x) => {
            if (color === 'transparent' || !color) return null;
            return (
              <rect
                key={`${x}-${y}`}
                x={x * size}
                y={y * size}
                width={size}
                height={size}
                fill={color}
              />
            );
          })
        )}
      </svg>
    );
  }, [sprite, size, className, style]);

  // Check if sprite is an image tile ID (string)
  if (typeof sprite === 'string') {
    const imageTile = imageTiles[sprite];
    if (imageTile) {
      return (
        <ImageTileRenderer
          tile={imageTile}
          size={size * 8} // Convert pixel size to total size (8x8 grid)
          className={className}
          style={style}
        />
      );
    }
    // If not found, return null
    return null;
  }

  return arraySprite;
};

// New unified tile renderer that handles both types
interface UnifiedTileRendererProps {
  tileId: string;
  tileData?: { sprite: string[][] };
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const UnifiedTileRenderer: React.FC<UnifiedTileRendererProps> = ({
  tileId,
  tileData,
  size = 32,
  className = '',
  style = {},
}) => {
  // Check if it's an image tile first
  if (isImageTile(tileId)) {
    const imageTile = imageTiles[tileId];
    if (imageTile) {
      return (
        <ImageTileRenderer
          tile={imageTile}
          size={size}
          className={className}
          style={style}
        />
      );
    }
  }
  
  // Fall back to array-based sprite
  if (tileData?.sprite) {
    const pixelSize = size / (tileData.sprite[0]?.length || 8);
    return (
      <SpriteRenderer
        sprite={tileData.sprite}
        size={pixelSize}
        className={className}
        style={style}
      />
    );
  }
  
  return null;
};
