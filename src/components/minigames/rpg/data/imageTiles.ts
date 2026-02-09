// Image-based tile system with LAYER SUPPORT
// Instructions:
// 1. Add your PNG file to src/assets/rpg/tiles/
// 2. Import it below
// 3. Add it to the imageTiles object

// Import your tile images here
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

// Image tile configuration type
export interface ImageTile {
  id: string;
  src: string;
  solid: boolean;
  interactable: boolean;
  interactionType?: 'dialogue' | 'item' | 'teleport' | 'event';
  interactionData?: string;
  // Layer system: 'ground' tiles go on bottom, 'object' tiles render on top of ground
  layer: 'ground' | 'object';
  // For object tiles: what ground tile should appear underneath
  groundTile?: string;
  // Size overrides (for objects that span multiple cells visually)
  displayWidth?: number;  // Visual width in tiles (default 1)
  displayHeight?: number; // Visual height in tiles (default 1)
  // Offset for visual positioning
  offsetY?: number; // Pixels to offset vertically (negative = up)
}

export const imageTiles: Record<string, ImageTile> = {
  // ============ GROUND TILES ============
  img_grass: {
    id: 'img_grass',
    src: GrassImage,
    solid: false,
    interactable: false,
    layer: 'ground',
  },
  img_dirt: {
    id: 'img_dirt',
    src: DirtImage,
    solid: false,
    interactable: false,
    layer: 'ground',
  },
  img_wood_floor: {
    id: 'img_wood_floor',
    src: WoodFloorImage,
    solid: false,
    interactable: false,
    layer: 'ground',
  },
  img_water: {
    id: 'img_water',
    src: WaterImage,
    solid: true,
    interactable: false,
    layer: 'ground',
  },
  
  // ============ WALL TILES (ground layer, solid) ============
  img_wall: {
    id: 'img_wall',
    src: WallImage,
    solid: true,
    interactable: false,
    layer: 'ground',
  },
  img_stone: {
    id: 'img_stone',
    src: StoneImage,
    solid: true,
    interactable: false,
    layer: 'ground',
  },
  
  // ============ OBJECT TILES (render on top of grass/ground) ============
  img_bush: {
    id: 'img_bush',
    src: BushImage,
    solid: true,
    interactable: false,
    layer: 'object',
    groundTile: 'img_grass', // Bush sits on grass
  },
  img_window: {
    id: 'img_window',
    src: WindowImage,
    solid: true,
    interactable: false,
    layer: 'object',
    groundTile: 'img_wall', // Window is on a wall
  },
  img_sign: {
    id: 'img_sign',
    src: SignImage,
    solid: true,
    interactable: true,
    interactionType: 'dialogue',
    interactionData: 'sign_welcome',
    layer: 'object',
    groundTile: 'img_grass',
  },
  img_bed: {
    id: 'img_bed',
    src: BedImage,
    solid: true,
    interactable: true,
    interactionType: 'dialogue',
    interactionData: 'bed_rest',
    layer: 'object',
    groundTile: 'img_wood_floor',
  },
};

// Helper function to check if a tile ID is an image tile
export const isImageTile = (tileId: string): boolean => {
  return tileId?.startsWith('img_') || tileId in imageTiles;
};

// Check if tile is an object that renders on top of ground
export const isObjectTile = (tileId: string): boolean => {
  const tile = imageTiles[tileId];
  return tile?.layer === 'object';
};

// Get the ground tile for an object tile
export const getGroundTileFor = (tileId: string): string | null => {
  const tile = imageTiles[tileId];
  return tile?.groundTile || null;
};

// Get all available image tile IDs
export const getImageTileIds = (): string[] => {
  return Object.keys(imageTiles);
};

// Export a list of tile categories for the editor
export const tileCategories = {
  ground: ['img_grass', 'img_dirt', 'img_wood_floor', 'img_water'],
  walls: ['img_wall', 'img_stone'],
  objects: ['img_bush', 'img_sign', 'img_bed', 'img_window'],
};
