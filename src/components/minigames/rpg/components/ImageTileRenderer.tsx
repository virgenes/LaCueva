import React from 'react';
import { ImageTile } from '../data/imageTiles';

interface ImageTileRendererProps {
  tile: ImageTile;
  size?: number; // Size in pixels
  className?: string;
  style?: React.CSSProperties;
}

export const ImageTileRenderer: React.FC<ImageTileRendererProps> = ({
  tile,
  size = 32,
  className = '',
  style = {},
}) => {
  return (
    <img
      src={tile.src}
      alt={tile.id}
      className={`${className} pointer-events-none`}
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
        objectFit: 'cover',
        ...style,
      }}
      draggable={false}
    />
  );
};
