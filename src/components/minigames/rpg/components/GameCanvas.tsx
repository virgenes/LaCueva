import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { SpriteRenderer } from './SpriteRenderer';
import { GameData, GameState, GameMap, Position } from '../types/GameTypes';
import { imageTiles, isImageTile, isObjectTile, getGroundTileFor } from '../data/imageTiles';
import { SpatialHash } from '../systems/SpatialHash';
import { imageSprites, PLAYER_SPRITE_SHEET_ID } from '../data/imageSprites';

interface GameCanvasProps {
  gameData: GameData;
  gameState: GameState;
  currentMap: GameMap;
  pixelSize?: number;
  mapMonsters?: MapMonster[];
  onMonsterEncounter?: (monster: MapMonster) => void;
  spatialHash?: SpatialHash;
  isMobile?: boolean;
  isWalking?: boolean;
  selectedCharacterId?: string;
}

export interface MapMonster {
  id: string;
  monsterId: string;
  position: Position;
  sprite: string[][];
}

export const GameCanvas: React.FC<GameCanvasProps> = React.memo(({
  gameData,
  gameState,
  currentMap,
  pixelSize: pixelSizeProp,
  mapMonsters = [],
  onMonsterEncounter,
  spatialHash,
  isMobile = false,
  isWalking = false,
  selectedCharacterId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Measure container with ResizeObserver
  useEffect(() => {
    const el = containerRef.current?.parentElement;
    if (!el) return;

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Responsive tileSize calculation
  const targetVisibleTilesY = isMobile ? 9 : 9;
  const targetVisibleTilesX = isMobile ? 11 : 13;

  // Use prop pixelSize if container not measured yet, otherwise compute
  const pixelSize = useMemo(() => {
    if (containerSize.height <= 0) return pixelSizeProp || 5;
    const fromHeight = Math.floor(containerSize.height / (targetVisibleTilesY * 8));
    const fromWidth = Math.floor(containerSize.width / (targetVisibleTilesX * 8));
    const computed = Math.min(fromHeight, fromWidth);
    const min = isMobile ? 3 : 4;
    const max = isMobile ? 6 : 7;
    return Math.max(min, Math.min(max, computed));
  }, [containerSize, targetVisibleTilesY, targetVisibleTilesX, isMobile, pixelSizeProp]);

  const tileSize = 8 * pixelSize;

  const viewportTiles = useMemo(() => ({
    width: containerSize.width > 0 ? Math.min(Math.floor(containerSize.width / tileSize), currentMap.width) : targetVisibleTilesX,
    height: containerSize.height > 0 ? Math.min(Math.floor(containerSize.height / tileSize), currentMap.height) : targetVisibleTilesY,
  }), [containerSize, tileSize, currentMap.width, currentMap.height, targetVisibleTilesX, targetVisibleTilesY]);

  // Camera offset clamped to map bounds
  const cameraOffset = useMemo(() => {
    const centerX = Math.floor(viewportTiles.width / 2);
    const centerY = Math.floor(viewportTiles.height / 2);
    let offsetX = gameState.playerPosition.x - centerX;
    let offsetY = gameState.playerPosition.y - centerY;
    offsetX = Math.max(0, Math.min(offsetX, currentMap.width - viewportTiles.width));
    offsetY = Math.max(0, Math.min(offsetY, currentMap.height - viewportTiles.height));
    return { x: offsetX, y: offsetY };
  }, [gameState.playerPosition, currentMap, viewportTiles]);

  // Render tile (supports ground + object layers)
  const renderTile = useCallback((tileId: string, x: number, y: number, key: string) => {
    const elements: JSX.Element[] = [];

    if (isImageTile(tileId)) {
      const imageTile = imageTiles[tileId];
      if (!imageTile) return null;

      if (isObjectTile(tileId)) {
        const groundTileId = getGroundTileFor(tileId);
        if (groundTileId && imageTiles[groundTileId]) {
          elements.push(
            <img key={`${key}-ground`} src={imageTiles[groundTileId].src} alt={groundTileId}
              className="absolute inset-0 pointer-events-none"
              style={{ width: tileSize, height: tileSize, imageRendering: 'pixelated', objectFit: 'cover' }}
              draggable={false} />
          );
        }
        elements.push(
          <img key={`${key}-object`} src={imageTile.src} alt={tileId}
            className="absolute pointer-events-none"
            style={{ width: tileSize, height: tileSize, imageRendering: 'pixelated', objectFit: 'contain',
              zIndex: 5 + y, top: imageTile.offsetY || 0, left: 0 }}
            draggable={false} />
        );
      } else {
        elements.push(
          <img key={`${key}-tile`} src={imageTile.src} alt={tileId}
            className="pointer-events-none"
            style={{ width: tileSize, height: tileSize, imageRendering: 'pixelated', objectFit: 'cover' }}
            draggable={false} />
        );
      }
      return elements;
    }

    const tile = gameData.tiles[tileId];
    if (tile) {
      return <SpriteRenderer key={`${key}-sprite`} sprite={tile.sprite} size={pixelSize} />;
    }
    return null;
  }, [tileSize, pixelSize, gameData.tiles]);

  // Visible tiles
  const visibleTiles = useMemo(() => {
    const tiles: JSX.Element[] = [];
    const groundLayer = currentMap.layers.find(l => l.name === 'ground');
    if (!groundLayer) return tiles;

    for (let y = cameraOffset.y; y < cameraOffset.y + viewportTiles.height && y < currentMap.height; y++) {
      for (let x = cameraOffset.x; x < cameraOffset.x + viewportTiles.width && x < currentMap.width; x++) {
        const tileId = groundLayer.tiles[y]?.[x];
        if (tileId) {
          tiles.push(
            <div key={`tile-${x}-${y}`} className="absolute"
              style={{ left: (x - cameraOffset.x) * tileSize, top: (y - cameraOffset.y) * tileSize, width: tileSize, height: tileSize }}>
              {renderTile(tileId, x, y, `tile-${x}-${y}`)}
            </div>
          );
        }
      }
    }
    return tiles;
  }, [currentMap, cameraOffset, tileSize, pixelSize, viewportTiles, renderTile]);

  // Visible monsters — use SpatialHash if available, otherwise filter manually
  const renderedMonsters = useMemo(() => {
    let visibleMonsters = mapMonsters;

    if (spatialHash) {
      const entities = spatialHash.queryRect(
        cameraOffset.x, cameraOffset.y,
        cameraOffset.x + viewportTiles.width - 1,
        cameraOffset.y + viewportTiles.height - 1
      );
      const monsterIds = new Set(entities.filter(e => e.type === 'monster').map(e => e.id));
      visibleMonsters = mapMonsters.filter(m => monsterIds.has(m.id));
    }

    return visibleMonsters.map(monster => {
      const screenX = monster.position.x - cameraOffset.x;
      const screenY = monster.position.y - cameraOffset.y;
      if (screenX < 0 || screenX >= viewportTiles.width || screenY < 0 || screenY >= viewportTiles.height) return null;

      return (
        <div key={`monster-${monster.id}`} className="absolute transition-all duration-200 cursor-pointer hover:scale-110"
          style={{ left: screenX * tileSize, top: screenY * tileSize, width: tileSize, height: tileSize, zIndex: 15 + monster.position.y }}
          onClick={() => onMonsterEncounter?.(monster)}>
          <SpriteRenderer sprite={monster.sprite} size={pixelSize} />
        </div>
      );
    }).filter(Boolean);
  }, [mapMonsters, cameraOffset, tileSize, pixelSize, viewportTiles, onMonsterEncounter, spatialHash]);

  // Visible NPCs — use SpatialHash if available
  const renderedNpcs = useMemo(() => {
    let npcIds = currentMap.npcs;

    if (spatialHash) {
      const entities = spatialHash.queryRect(
        cameraOffset.x, cameraOffset.y,
        cameraOffset.x + viewportTiles.width - 1,
        cameraOffset.y + viewportTiles.height - 1
      );
      const visibleNpcIds = new Set(entities.filter(e => e.type === 'npc').map(e => e.id));
      npcIds = npcIds.filter(id => visibleNpcIds.has(id));
    }

    return npcIds.map(npcId => {
      const npc = gameData.characters[npcId];
      if (!npc) return null;
      const sprite = gameData.sprites[npc.spriteId];
      if (!sprite || !sprite.frames[0]) return null;

      const screenX = npc.position.x - cameraOffset.x;
      const screenY = npc.position.y - cameraOffset.y;
      if (screenX < 0 || screenX >= viewportTiles.width || screenY < 0 || screenY >= viewportTiles.height) return null;

      return (
        <div key={`npc-${npcId}`} className="absolute transition-all duration-150"
          style={{ left: screenX * tileSize, top: screenY * tileSize, width: tileSize, height: tileSize, zIndex: 10 + npc.position.y }}>
          <SpriteRenderer sprite={sprite.frames[0]} size={pixelSize} />
        </div>
      );
    }).filter(Boolean);
  }, [currentMap.npcs, gameData.characters, gameData.sprites, cameraOffset, tileSize, pixelSize, viewportTiles, spatialHash]);

  // Player sprite sheet
  const playerSpriteSheet = imageSprites[PLAYER_SPRITE_SHEET_ID];
  const playerScreenX = gameState.playerPosition.x - cameraOffset.x;
  const playerScreenY = gameState.playerPosition.y - cameraOffset.y;

  // Sprite sheet animation state
  const [playerFrame, setPlayerFrame] = useState(0);
  const playerDir = gameState.playerDirection;

  useEffect(() => {
    if (!isWalking || !playerSpriteSheet) {
      setPlayerFrame(0);
      return;
    }
    const animKey = `walk_${playerDir}`;
    const anim = playerSpriteSheet.animations[animKey];
    if (!anim) return;

    const interval = setInterval(() => {
      setPlayerFrame(prev => (prev + 1) % anim.frameCount);
    }, anim.speed);
    return () => clearInterval(interval);
  }, [isWalking, playerDir, playerSpriteSheet]);

  // Compute background-position for the sprite sheet
  const playerSpriteStyle = useMemo(() => {
    if (!playerSpriteSheet) return null;
    const animKey = isWalking ? `walk_${playerDir}` : `idle_${playerDir}`;
    const anim = playerSpriteSheet.animations[animKey];
    if (!anim) return null;

    // Make player sprite larger (1.5x tile size) for visual presence
    const playerScale = 1.5;
    const renderSize = tileSize * playerScale;
    const frameX = -(playerFrame * playerSpriteSheet.frameWidth);
    const frameY = -(anim.row * playerSpriteSheet.frameHeight);
    const scaleX = renderSize / playerSpriteSheet.frameWidth;
    const scaleY = renderSize / playerSpriteSheet.frameHeight;
    const sheetCols = 4;
    const sheetRows = 4;
    const bgWidth = playerSpriteSheet.frameWidth * sheetCols * scaleX;
    const bgHeight = playerSpriteSheet.frameHeight * sheetRows * scaleY;

    return {
      renderSize,
      offset: (renderSize - tileSize) / 2,
      backgroundImage: `url(${playerSpriteSheet.src})`,
      backgroundPosition: `${frameX * scaleX}px ${frameY * scaleY}px`,
      backgroundSize: `${bgWidth}px ${bgHeight}px`,
      backgroundRepeat: 'no-repeat' as const,
      imageRendering: 'pixelated' as const,
    };
  }, [playerSpriteSheet, playerDir, isWalking, playerFrame, tileSize]);

  // Fallback: old pixel-art sprite
  const fallbackPlayerSprite = gameData.sprites['player'];
  const fallbackPlayerFrame = fallbackPlayerSprite?.frames[0];

  return (
    <div ref={containerRef}
      className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg shadow-2xl border-4 border-slate-700"
      style={{
        width: viewportTiles.width * tileSize,
        height: viewportTiles.height * tileSize,
        imageRendering: 'pixelated',
      }}>
      {visibleTiles}
      {renderedMonsters}
      {renderedNpcs}

      {/* Player rendered with sprite sheet */}
      {playerSpriteStyle ? (
        <div
          className="absolute"
          style={{
            left: playerScreenX * tileSize - playerSpriteStyle.offset,
            top: playerScreenY * tileSize - playerSpriteStyle.offset,
            width: playerSpriteStyle.renderSize,
            height: playerSpriteStyle.renderSize,
            zIndex: 20 + gameState.playerPosition.y,
            backgroundImage: playerSpriteStyle.backgroundImage,
            backgroundPosition: playerSpriteStyle.backgroundPosition,
            backgroundSize: playerSpriteStyle.backgroundSize,
            backgroundRepeat: playerSpriteStyle.backgroundRepeat,
            imageRendering: playerSpriteStyle.imageRendering,
          }}
        />
      ) : fallbackPlayerSprite && fallbackPlayerFrame ? (
        <div className="absolute transition-all duration-100"
          style={{
            left: playerScreenX * tileSize - tileSize * 0.25,
            top: playerScreenY * tileSize - tileSize * 0.25,
            width: tileSize * 1.5,
            height: tileSize * 1.5,
            zIndex: 20 + gameState.playerPosition.y,
            transform: gameState.playerDirection === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
          }}>
          <SpriteRenderer sprite={fallbackPlayerFrame} size={Math.ceil(pixelSize * 1.5)} />
        </div>
      ) : null}

      {/* Ambient lighting */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 50%, transparent 30%, rgba(0,0,0,0.3) 100%)' }} />
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-5"
        style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)' }} />
    </div>
  );
});

GameCanvas.displayName = 'GameCanvas';
