// Tiled JSON Map Loader
// Supports maps exported from Tiled Map Editor as JSON
// Features: layers, tilesets, collisions, NPCs, objects, teleporters

import { GameMap, MapLayer, Position } from '../types/GameTypes';

// Tiled JSON format types
export interface TiledMap {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: TiledLayer[];
  tilesets: TiledTileset[];
  properties?: TiledProperty[];
  orientation: string;
  renderorder: string;
}

export interface TiledLayer {
  name: string;
  type: 'tilelayer' | 'objectgroup' | 'imagelayer' | 'group';
  data?: number[];  // For tile layers (1D array, row-major)
  objects?: TiledObject[];  // For object layers
  width?: number;
  height?: number;
  visible: boolean;
  opacity: number;
  x: number;
  y: number;
  properties?: TiledProperty[];
}

export interface TiledObject {
  id: number;
  name: string;
  type: string;  // "npc", "teleporter", "spawn", "monster", etc.
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  properties?: TiledProperty[];
  gid?: number;
}

export interface TiledTileset {
  firstgid: number;
  name: string;
  tilewidth: number;
  tileheight: number;
  tilecount: number;
  columns: number;
  image?: string;
  tiles?: TiledTileData[];
  properties?: TiledProperty[];
}

export interface TiledTileData {
  id: number;
  properties?: TiledProperty[];
  type?: string;
  animation?: { tileid: number; duration: number }[];
}

export interface TiledProperty {
  name: string;
  type: string;
  value: string | number | boolean;
}

// Mapping from Tiled tile IDs to our internal tile IDs
export interface TileMapping {
  [gid: number]: string;  // Maps Tiled GID to our tile ID (e.g., 1 -> 'img_grass')
}

// Configuration for loading a Tiled map
export interface TiledMapConfig {
  id: string;
  name: string;
  nameEs: string;
  tileMapping: TileMapping;
  defaultTile?: string;
  music?: string;
}

// Get a property value from a Tiled object or layer
function getProperty<T = string>(properties: TiledProperty[] | undefined, name: string): T | undefined {
  const prop = properties?.find(p => p.name === name);
  return prop?.value as T | undefined;
}

// Convert Tiled GID to internal tile ID using tileset mappings
function gidToTileId(gid: number, tileMapping: TileMapping, defaultTile: string): string {
  if (gid === 0) return defaultTile; // 0 = empty in Tiled
  return tileMapping[gid] || defaultTile;
}

// Parse a Tiled JSON map into our GameMap format
export function loadTiledMap(
  tiledJson: TiledMap,
  config: TiledMapConfig
): GameMap {
  const { width, height } = tiledJson;
  const defaultTile = config.defaultTile || 'img_grass';

  // Parse tile layers
  const layers: MapLayer[] = [];
  const npcs: string[] = [];
  let spawnPoint: Position = { x: Math.floor(width / 2), y: Math.floor(height / 2) };
  const teleporters: { x: number; y: number; targetMap: string; targetX: number; targetY: number }[] = [];
  let encounterRate = 0;
  const possibleEncounters: string[] = [];

  // Map-level properties
  encounterRate = getProperty<number>(tiledJson.properties, 'encounterRate') || 0;
  const encountersStr = getProperty<string>(tiledJson.properties, 'possibleEncounters');
  if (encountersStr) {
    possibleEncounters.push(...encountersStr.split(',').map(s => s.trim()));
  }

  // Process each layer
  for (const layer of tiledJson.layers) {
    if (!layer.visible) continue;

    if (layer.type === 'tilelayer' && layer.data) {
      // Convert 1D array to 2D grid
      const tiles: (string | null)[][] = [];
      const layerWidth = layer.width || width;
      const layerHeight = layer.height || height;

      for (let y = 0; y < layerHeight; y++) {
        const row: (string | null)[] = [];
        for (let x = 0; x < layerWidth; x++) {
          const idx = y * layerWidth + x;
          const gid = layer.data[idx] || 0;
          // Clear flip flags (Tiled uses high bits for flipping)
          const cleanGid = gid & 0x1FFFFFFF;
          row.push(cleanGid === 0 ? null : gidToTileId(cleanGid, config.tileMapping, defaultTile));
        }
        tiles.push(row);
      }

      // Determine layer name mapping
      const layerName = layer.name.toLowerCase().includes('collision')
        ? 'collision'
        : layer.name.toLowerCase().includes('object')
          ? 'objects'
          : 'ground';

      layers.push({ name: layerName, tiles });
    }

    if (layer.type === 'objectgroup' && layer.objects) {
      for (const obj of layer.objects) {
        const tileX = Math.floor(obj.x / tiledJson.tilewidth);
        const tileY = Math.floor(obj.y / tiledJson.tileheight);
        const objType = (obj.type || '').toLowerCase();

        switch (objType) {
          case 'spawn':
          case 'spawnpoint':
          case 'player_spawn':
            spawnPoint = { x: tileX, y: tileY };
            break;

          case 'npc':
            const npcId = getProperty<string>(obj.properties, 'npcId') || obj.name;
            if (npcId) npcs.push(npcId);
            break;

          case 'teleporter':
          case 'teleport':
          case 'warp':
            teleporters.push({
              x: tileX,
              y: tileY,
              targetMap: getProperty<string>(obj.properties, 'targetMap') || '',
              targetX: getProperty<number>(obj.properties, 'targetX') || 0,
              targetY: getProperty<number>(obj.properties, 'targetY') || 0,
            });
            break;

          case 'monster':
          case 'encounter':
            const monsterId = getProperty<string>(obj.properties, 'monsterId') || obj.name;
            if (monsterId && !possibleEncounters.includes(monsterId)) {
              possibleEncounters.push(monsterId);
            }
            break;
        }
      }
    }
  }

  // Ensure at least a ground layer exists
  if (layers.length === 0 || !layers.find(l => l.name === 'ground')) {
    const emptyGrid: (string | null)[][] = [];
    for (let y = 0; y < height; y++) {
      emptyGrid.push(new Array(width).fill(defaultTile));
    }
    layers.unshift({ name: 'ground', tiles: emptyGrid });
  }

  // Apply collision data: if there's a "collision" layer, mark corresponding tiles as solid
  const collisionLayer = layers.find(l => l.name === 'collision');
  const groundLayer = layers.find(l => l.name === 'ground');

  if (collisionLayer && groundLayer) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (collisionLayer.tiles[y]?.[x]) {
          // There's a collision tile here - the ground tile stays, 
          // collision is handled by checking the collision layer
        }
      }
    }
  }

  // Insert teleporter tiles into ground layer
  if (groundLayer) {
    for (const tp of teleporters) {
      if (tp.y >= 0 && tp.y < height && tp.x >= 0 && tp.x < width) {
        groundLayer.tiles[tp.y][tp.x] = 'teleporter';
      }
    }
  }

  const gameMap: GameMap = {
    id: config.id,
    name: config.name,
    nameEs: config.nameEs,
    width,
    height,
    layers,
    npcs,
    spawnPoint,
    music: config.music,
    encounterRate,
    possibleEncounters,
  };

  return gameMap;
}

// Generate teleporter connections from Tiled objects
export function extractTeleporterConnections(
  tiledJson: TiledMap,
  mapId: string
): Record<string, { mapId: string; x: number; y: number }> {
  const connections: Record<string, { mapId: string; x: number; y: number }> = {};

  for (const layer of tiledJson.layers) {
    if (layer.type !== 'objectgroup' || !layer.objects) continue;

    for (const obj of layer.objects) {
      const objType = (obj.type || '').toLowerCase();
      if (objType === 'teleporter' || objType === 'teleport' || objType === 'warp') {
        const tileX = Math.floor(obj.x / tiledJson.tilewidth);
        const tileY = Math.floor(obj.y / tiledJson.tileheight);
        const targetMap = getProperty<string>(obj.properties, 'targetMap') || '';
        const targetX = getProperty<number>(obj.properties, 'targetX') || 0;
        const targetY = getProperty<number>(obj.properties, 'targetY') || 0;

        if (targetMap) {
          connections[`${mapId}_${tileX}_${tileY}`] = {
            mapId: targetMap,
            x: targetX,
            y: targetY,
          };
        }
      }
    }
  }

  return connections;
}

// Check if a position has collision in a Tiled-loaded map
export function hasTiledCollision(
  gameMap: GameMap,
  x: number,
  y: number
): boolean {
  const collisionLayer = gameMap.layers.find(l => l.name === 'collision');
  if (!collisionLayer) return false;
  return !!collisionLayer.tiles[y]?.[x];
}

// Utility: Create a default tile mapping for common Tiled tilesets
// Users should customize this based on their actual tileset
export function createDefaultTileMapping(firstgid: number = 1): TileMapping {
  return {
    [firstgid + 0]: 'img_grass',
    [firstgid + 1]: 'img_dirt',
    [firstgid + 2]: 'img_stone',
    [firstgid + 3]: 'img_water',
    [firstgid + 4]: 'img_wall',
    [firstgid + 5]: 'img_wood_floor',
    [firstgid + 6]: 'img_bush',
    [firstgid + 7]: 'img_sign',
    [firstgid + 8]: 'img_bed',
    [firstgid + 9]: 'img_window',
  };
}

// Instructions for users:
// 
// HOW TO USE TILED MAPS:
// 
// 1. Create your map in Tiled (https://www.mapeditor.org/)
// 2. Export as JSON (File > Export As > JSON)
// 3. Place the JSON file in src/assets/rpg/maps/
// 4. Import and load it:
//
//    import tiledMapJson from '@/assets/rpg/maps/my_map.json';
//    import { loadTiledMap, createDefaultTileMapping } from './systems/TiledMapLoader';
//
//    const myMap = loadTiledMap(tiledMapJson, {
//      id: 'my_map',
//      name: 'My Map',
//      nameEs: 'Mi Mapa',
//      tileMapping: createDefaultTileMapping(1),
//    });
//
// LAYER NAMING CONVENTION:
// - "ground" or default: Main walkable/visible layer
// - "collision": Marks solid tiles (any tile = solid)
// - "objects": Decorative object layer
//
// OBJECT TYPES (in Tiled object layer):
// - "spawn" / "spawnpoint": Player spawn position
// - "npc": NPC placement (set npcId property)
// - "teleporter": Map transition (set targetMap, targetX, targetY properties)
// - "monster": Monster spawn zone (set monsterId property)
//
// TILESET MAPPING:
// Create a TileMapping that maps Tiled GIDs to your tile IDs.
// Each tile in your tileset gets a GID starting from firstgid.
// Map each GID to the corresponding img_* tile ID.
