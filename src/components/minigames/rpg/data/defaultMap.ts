import { GameMap } from '../types/GameTypes';
import { classroomMap, forestMap, caveMap, houseMap } from './mapsData';

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
        ['stone', 'grass', 'grass', 'grass', 'grass', 'teleporter', 'grass', 'grass', 'grass', 'grass', 'grass', 'stone'],
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

// Teleporter connections
export const teleporterConnections: Record<string, { mapId: string; x: number; y: number }> = {
  // From memory_garden (5,1) to forest
  'memory_garden_5_1': { mapId: 'forest', x: 7, y: 10 },
  // From forest (7,10) back to memory_garden
  'forest_7_10': { mapId: 'memory_garden', x: 5, y: 2 },
  // From forest (6,5) to cave
  'forest_6_5': { mapId: 'cave', x: 5, y: 8 },
  // From cave (5,8) back to forest
  'cave_5_8': { mapId: 'forest', x: 6, y: 6 },
  // From cave (5,5) to house
  'cave_5_5': { mapId: 'house', x: 4, y: 6 },
  // From house (4,6) back to cave
  'house_4_6': { mapId: 'cave', x: 5, y: 6 },
  // From classroom (5,8) to memory_garden
  'classroom_5_8': { mapId: 'memory_garden', x: 5, y: 7 },
};

export const defaultMaps: Record<string, GameMap> = {
  memory_garden: memoryGardenMap,
  classroom: classroomMap,
  forest: forestMap,
  cave: caveMap,
  house: houseMap,
};
