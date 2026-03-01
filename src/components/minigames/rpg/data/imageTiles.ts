// Image-based tile system with LAYER SUPPORT
import WallImage from '@/assets/rpg/tiles/Wall.png';
import BushImage from '@/assets/rpg/tiles/Bush.png';
import BedImage from '@/assets/rpg/tiles/Bed.png';
import DirtImage from '@/assets/rpg/tiles/Dirt.png';
import GrassImage from '@/assets/rpg/tiles/Grass.png';
import SignImage from '@/assets/rpg/tiles/Sign.png';
import StoneImage from '@/assets/rpg/tiles/Stone.png';
import WaterImage from '@/assets/rpg/tiles/Water.png';
import WoodFloorImage from '@/assets/rpg/tiles/WoodFloor.png';
import WindowImage from '@/assets/rpg/tiles/Window.png';

export interface ImageTile {
  id: string;
  src: string;
  solid: boolean;
  interactable: boolean;
  interactionType?: 'dialogue' | 'item' | 'teleport' | 'event';
  interactionData?: string;
  layer: 'ground' | 'object';
  groundTile?: string;
  // Size overrides for visual rendering (in tile units)
  displayWidth?: number;
  displayHeight?: number;
  offsetY?: number;
  // Random scale variation range [min, max] multiplier
  scaleVariation?: [number, number];
}

export const imageTiles: Record<string, ImageTile> = {
  // ============ GROUND TILES ============
  img_grass: {
    id: 'img_grass', src: GrassImage, solid: false, interactable: false, layer: 'ground',
  },
  img_dirt: {
    id: 'img_dirt', src: DirtImage, solid: false, interactable: false, layer: 'ground',
  },
  img_wood_floor: {
    id: 'img_wood_floor', src: WoodFloorImage, solid: false, interactable: false, layer: 'ground',
  },
  img_water: {
    id: 'img_water', src: WaterImage, solid: true, interactable: false, layer: 'ground',
  },

  // ============ WALL TILES ============
  img_wall: {
    id: 'img_wall', src: WallImage, solid: true, interactable: false, layer: 'ground',
  },

  // ============ OBJECT TILES (render on top of ground) ============
  // Stone/Rock is now an OBJECT on top of dirt — no more black background
  img_stone: {
    id: 'img_stone', src: StoneImage, solid: true, interactable: false,
    layer: 'object',
    groundTile: 'img_dirt',
    scaleVariation: [0.7, 1.2],
  },
  img_bush: {
    id: 'img_bush', src: BushImage, solid: true, interactable: false,
    layer: 'object',
    groundTile: 'img_grass',
    scaleVariation: [0.8, 1.3],
  },
  img_window: {
    id: 'img_window', src: WindowImage, solid: true, interactable: false,
    layer: 'object',
    groundTile: 'img_wall',
  },
  img_sign: {
    id: 'img_sign', src: SignImage, solid: true, interactable: true,
    interactionType: 'dialogue', interactionData: 'sign_welcome',
    layer: 'object',
    groundTile: 'img_grass',
    displayWidth: 1.3,
    displayHeight: 1.3,
  },
  img_bed: {
    id: 'img_bed', src: BedImage, solid: true, interactable: true,
    interactionType: 'dialogue', interactionData: 'bed_rest',
    layer: 'object',
    groundTile: 'img_wood_floor',
    displayWidth: 1.6,
    displayHeight: 1.6,
    offsetY: -8,
  },
};

export const isImageTile = (tileId: string): boolean => {
  return tileId?.startsWith('img_') || tileId in imageTiles;
};

export const isObjectTile = (tileId: string): boolean => {
  const tile = imageTiles[tileId];
  return tile?.layer === 'object';
};

export const getGroundTileFor = (tileId: string): string | null => {
  const tile = imageTiles[tileId];
  return tile?.groundTile || null;
};

export const getImageTileIds = (): string[] => Object.keys(imageTiles);

// Deterministic "random" scale for a tile at position (x,y)
export const getTileScale = (tileId: string, x: number, y: number): number => {
  const tile = imageTiles[tileId];
  if (!tile?.scaleVariation) return 1;
  const [min, max] = tile.scaleVariation;
  // Simple hash
  const hash = ((x * 73 + y * 137 + 42) % 1000) / 1000;
  return min + hash * (max - min);
};

export const tileCategories = {
  ground: ['img_grass', 'img_dirt', 'img_wood_floor', 'img_water'],
  walls: ['img_wall'],
  objects: ['img_stone', 'img_bush', 'img_sign', 'img_bed', 'img_window'],
};
