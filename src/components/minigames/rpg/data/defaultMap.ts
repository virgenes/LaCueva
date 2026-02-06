import { GameMap } from '../types/GameTypes';

// Default map: Memory Garden (12x10 tiles)
export const memoryGardenMap: GameMap = {
  id: 'memory_garden',
  name: 'Memory Garden',
  nameEs: 'Jardín de la Memoria',
  width: 12,
  height: 10,
  spawnPoint: { x: 5, y: 7 },
  npcs: ['mysterious'],
  layers: [
    // Ground layer
    {
      name: 'ground',
      tiles: [
        ['stone', 'stone', 'stone', 'stone', 'stone', 'stone', 'stone', 'stone', 'stone', 'stone', 'stone', 'stone'],
        ['stone', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'stone'],
        ['stone', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'water', 'water', 'stone'],
        ['stone', 'grass', 'grass', 'sign', 'grass', 'grass', 'grass', 'grass', 'grass', 'water', 'water', 'stone'],
        ['stone', 'grass', 'grass', 'grass', 'grass', 'wood_floor', 'wood_floor', 'grass', 'grass', 'grass', 'grass', 'stone'],
        ['stone', 'grass', 'grass', 'grass', 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', 'grass', 'grass', 'grass', 'stone'],
        ['stone', 'grass', 'grass', 'grass', 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', 'grass', 'grass', 'grass', 'stone'],
        ['stone', 'grass', 'grass', 'grass', 'grass', 'wood_floor', 'wood_floor', 'grass', 'grass', 'grass', 'grass', 'stone'],
        ['stone', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'stone'],
        ['stone', 'stone', 'stone', 'stone', 'stone', 'stone', 'stone', 'stone', 'stone', 'stone', 'stone', 'stone'],
      ],
    },
  ],
};

export const defaultMaps: Record<string, GameMap> = {
  memory_garden: memoryGardenMap,
};
