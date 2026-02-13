import { useMemo, useCallback } from 'react';
import { GameData, Character, Tile } from '@/types/GameTypes';
import { SpatialHash } from '../systems/SpatialHash';
import { imageTiles, isImageTile, ImageTile } from '../data/imageTiles';

export const usePlayerMovement = (
  gameData: GameData,
  currentMapId: string,
  playerPosition: { x: number; y: number }
) => {
  const currentMap = gameData.maps[currentMapId];

  const spatialHash = useMemo(() => {
    const hash = new SpatialHash(16);
    if (!currentMap) return hash;
    currentMap.npcs.forEach((npcId) => {
      const npc = gameData.characters[npcId];
      if (npc) hash.insert(`npc_${npcId}`, npc.position.x, npc.position.y);
    });
    return hash;
  }, [currentMap, gameData.characters]);

  const getTileAt = useCallback(
    (x: number, y: number): Tile | ImageTile | null => {
      if (!currentMap) return null;
      const groundLayer = currentMap.layers.find((l) => l.name === 'ground');
      if (!groundLayer) return null;
      const tileId = groundLayer.tiles[y]?.[x];
      if (!tileId) return null;
      if (isImageTile(tileId)) return imageTiles[tileId] || null;
      return gameData.tiles[tileId] || null;
    },
    [currentMap, gameData.tiles]
  );

  const getNpcAt = useCallback(
    (x: number, y: number): Character | null => {
      if (!currentMap) return null;
      for (const npcId of currentMap.npcs) {
        const npc = gameData.characters[npcId];
        if (npc && npc.position.x === x && npc.position.y === y) return npc;
      }
      return null;
    },
    [currentMap, gameData.characters]
  );

  const isWithinBounds = useCallback(
    (x: number, y: number): boolean => {
      if (!currentMap) return false;
      return x >= 0 && x < currentMap.width && y >= 0 && y < currentMap.height;
    },
    [currentMap]
  );

  const canMoveTo = useCallback(
    (x: number, y: number): boolean => {
      if (!isWithinBounds(x, y)) return false;
      const tile = getTileAt(x, y);
      if (tile?.solid) return false;
      if (spatialHash.query(x, y, 0.1).size > 0) return false;
      return true;
    },
    [isWithinBounds, getTileAt, spatialHash]
  );

  return { canMoveTo, spatialHash, getTileAt, getNpcAt, isWithinBounds };
};