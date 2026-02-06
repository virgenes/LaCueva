import React, { useMemo } from 'react';
import { SpriteRenderer } from './SpriteRenderer';
import { GameData, GameState, GameMap, Character } from '../types/GameTypes';

interface GameCanvasProps {
  gameData: GameData;
  gameState: GameState;
  currentMap: GameMap;
  pixelSize?: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameData,
  gameState,
  currentMap,
  pixelSize = 4,
}) => {
  const tileSize = 8 * pixelSize; // 8x8 grid * pixel size

  // Calculate viewport (center on player)
  const viewportTiles = { width: 9, height: 7 };
  
  const cameraOffset = useMemo(() => {
    const centerX = Math.floor(viewportTiles.width / 2);
    const centerY = Math.floor(viewportTiles.height / 2);
    
    let offsetX = gameState.playerPosition.x - centerX;
    let offsetY = gameState.playerPosition.y - centerY;
    
    // Clamp to map bounds
    offsetX = Math.max(0, Math.min(offsetX, currentMap.width - viewportTiles.width));
    offsetY = Math.max(0, Math.min(offsetY, currentMap.height - viewportTiles.height));
    
    return { x: offsetX, y: offsetY };
  }, [gameState.playerPosition, currentMap, viewportTiles]);

  // Render visible tiles
  const visibleTiles = useMemo(() => {
    const tiles: JSX.Element[] = [];
    const groundLayer = currentMap.layers.find(l => l.name === 'ground');
    if (!groundLayer) return tiles;

    for (let y = cameraOffset.y; y < cameraOffset.y + viewportTiles.height && y < currentMap.height; y++) {
      for (let x = cameraOffset.x; x < cameraOffset.x + viewportTiles.width && x < currentMap.width; x++) {
        const tileId = groundLayer.tiles[y]?.[x];
        const tile = tileId ? gameData.tiles[tileId] : null;
        
        if (tile) {
          tiles.push(
            <div
              key={`tile-${x}-${y}`}
              className="absolute"
              style={{
                left: (x - cameraOffset.x) * tileSize,
                top: (y - cameraOffset.y) * tileSize,
                width: tileSize,
                height: tileSize,
              }}
            >
              <SpriteRenderer sprite={tile.sprite} size={pixelSize} />
            </div>
          );
        }
      }
    }
    return tiles;
  }, [currentMap, cameraOffset, gameData.tiles, tileSize, pixelSize, viewportTiles]);

  // Render NPCs
  const renderedNpcs = useMemo(() => {
    return currentMap.npcs.map(npcId => {
      const npc = gameData.characters[npcId];
      if (!npc) return null;
      
      const sprite = gameData.sprites[npc.spriteId];
      if (!sprite || !sprite.frames[0]) return null;

      // Check if in viewport
      const screenX = npc.position.x - cameraOffset.x;
      const screenY = npc.position.y - cameraOffset.y;
      
      if (screenX < 0 || screenX >= viewportTiles.width || screenY < 0 || screenY >= viewportTiles.height) {
        return null;
      }

      const frame = sprite.frames[0];

      return (
        <div
          key={`npc-${npcId}`}
          className="absolute transition-all duration-150"
          style={{
            left: screenX * tileSize,
            top: screenY * tileSize,
            width: tileSize,
            height: tileSize,
            zIndex: 10 + npc.position.y,
          }}
        >
          <SpriteRenderer sprite={frame} size={pixelSize} />
        </div>
      );
    }).filter(Boolean);
  }, [currentMap.npcs, gameData.characters, gameData.sprites, cameraOffset, tileSize, pixelSize, viewportTiles]);

  // Render player
  const playerSprite = gameData.sprites['player'];
  const playerScreenX = gameState.playerPosition.x - cameraOffset.x;
  const playerScreenY = gameState.playerPosition.y - cameraOffset.y;
  const playerFrame = playerSprite?.frames[0];

  return (
    <div 
      className="relative overflow-hidden bg-night-deep"
      style={{
        width: viewportTiles.width * tileSize,
        height: viewportTiles.height * tileSize,
        imageRendering: 'pixelated',
      }}
    >
      {/* Tiles layer */}
      {visibleTiles}
      
      {/* NPCs layer */}
      {renderedNpcs}
      
      {/* Player */}
      {playerSprite && playerFrame && (
        <div
          className="absolute transition-all duration-100"
          style={{
            left: playerScreenX * tileSize,
            top: playerScreenY * tileSize,
            width: tileSize,
            height: tileSize,
            zIndex: 20 + gameState.playerPosition.y,
            transform: gameState.playerDirection === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
          }}
        >
          <SpriteRenderer sprite={playerFrame} size={pixelSize} />
        </div>
      )}
      
      {/* Scanlines overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
        }}
      />
    </div>
  );
};
