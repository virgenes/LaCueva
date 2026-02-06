import React, { useMemo } from 'react';

interface SpriteRendererProps {
  sprite: string[][]; // 2D array of CSS colors
  size?: number; // Size of each pixel
  className?: string;
  style?: React.CSSProperties;
}

export const SpriteRenderer: React.FC<SpriteRendererProps> = ({
  sprite,
  size = 4,
  className = '',
  style = {},
}) => {
  const renderedSprite = useMemo(() => {
    if (!sprite || sprite.length === 0) return null;
    
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

  return renderedSprite;
};
