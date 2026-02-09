// Image-based sprite system for characters and entities
// Instructions:
// 1. Add your PNG sprite sheet to src/assets/rpg/sprites/
// 2. Import it below
// 3. Add it to the imageSprites object with its configuration

// Import your sprite images here
// Example:
// import PlayerSprite from '@/assets/rpg/sprites/player.png';
// import EnemySprite from '@/assets/rpg/sprites/enemy.png';

// Sprite configuration type
export interface ImageSprite {
  id: string;
  name: string;
  nameEs: string;
  src: string;
  // Sprite sheet configuration
  frameWidth: number;  // Width of a single frame
  frameHeight: number; // Height of a single frame
  // Animation configuration
  animations: Record<string, SpriteAnimation>;
  // Default animation
  defaultAnimation: string;
}

export interface SpriteAnimation {
  // Row in sprite sheet (0-indexed)
  row: number;
  // Number of frames in this animation
  frameCount: number;
  // Animation speed in ms per frame
  speed: number;
  // Does it loop?
  loop: boolean;
}

// Add your sprites here - template:
// {
//   id: 'sprite_id',
//   name: 'Sprite Name',
//   nameEs: 'Nombre del Sprite',
//   src: ImportedImage,
//   frameWidth: 32,
//   frameHeight: 32,
//   animations: {
//     idle: { row: 0, frameCount: 4, speed: 200, loop: true },
//     walk_down: { row: 1, frameCount: 4, speed: 150, loop: true },
//     walk_up: { row: 2, frameCount: 4, speed: 150, loop: true },
//     walk_left: { row: 3, frameCount: 4, speed: 150, loop: true },
//     walk_right: { row: 4, frameCount: 4, speed: 150, loop: true },
//     attack: { row: 5, frameCount: 6, speed: 100, loop: false },
//   },
//   defaultAnimation: 'idle',
// }

export const imageSprites: Record<string, ImageSprite> = {
  // Add your character sprites here!
  // When you have sprite sheets, import and add them like this:
  // 
  // player_custom: {
  //   id: 'player_custom',
  //   name: 'Custom Player',
  //   nameEs: 'Jugador Personalizado',
  //   src: PlayerSpriteSheet,
  //   frameWidth: 32,
  //   frameHeight: 32,
  //   animations: {
  //     idle: { row: 0, frameCount: 4, speed: 200, loop: true },
  //     walk: { row: 1, frameCount: 4, speed: 150, loop: true },
  //   },
  //   defaultAnimation: 'idle',
  // },
};

// Helper function to check if a sprite ID is an image sprite
export const isImageSprite = (spriteId: string): boolean => {
  return spriteId in imageSprites;
};

// Get all available image sprite IDs
export const getImageSpriteIds = (): string[] => {
  return Object.keys(imageSprites);
};

// Sprite categories for organization
export const spriteCategories = {
  player: [] as string[],
  npc: [] as string[],
  enemy: [] as string[],
  object: [] as string[],
};
