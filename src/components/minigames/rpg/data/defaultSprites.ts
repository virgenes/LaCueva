import { Sprite, Tile } from '../types/GameTypes';

// Color palette for easy theming
const COLORS = {
  transparent: 'transparent',
  black: '#1a1a2e',
  darkPurple: '#16213e',
  purple: '#0f3460',
  cyan: '#00fff5',
  pink: '#ff00ff',
  gold: '#ffd700',
  white: '#e8e8e8',
  skin: '#ffd5b8',
  hair: '#4a3728',
  shirt: '#00d4aa',
  pants: '#2a4858',
  grass: '#2d5a27',
  grassLight: '#3d7a37',
  dirt: '#8b7355',
  stone: '#6b6b6b',
  stoneLight: '#8a8a8a',
  wood: '#8b4513',
  woodLight: '#a0522d',
  water: '#1e90ff',
  waterLight: '#4da6ff',
};

const C = COLORS;
const T = COLORS.transparent;

// Helper to create 32x32 grid
const createGrid = (pattern: string[][]): string[][] => pattern;

// Player sprite frames (32x32 pixels represented as 8x8 simplified)
// Each "pixel" in our simplified version represents 4x4 actual pixels
export const playerSprite: Sprite = {
  id: 'player',
  name: 'Protagonist',
  width: 32,
  height: 32,
  animationSpeed: 200,
  frames: [
    // Frame 1 - Standing
    [
      [T, T, C.hair, C.hair, C.hair, C.hair, T, T],
      [T, C.hair, C.hair, C.hair, C.hair, C.hair, C.hair, T],
      [T, C.skin, C.skin, C.skin, C.skin, C.skin, C.skin, T],
      [T, C.skin, C.black, C.skin, C.skin, C.black, C.skin, T],
      [T, T, C.skin, C.skin, C.skin, C.skin, T, T],
      [T, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, T],
      [T, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, T],
      [T, T, C.pants, C.pants, C.pants, C.pants, T, T],
    ],
    // Frame 2 - Walk 1
    [
      [T, T, C.hair, C.hair, C.hair, C.hair, T, T],
      [T, C.hair, C.hair, C.hair, C.hair, C.hair, C.hair, T],
      [T, C.skin, C.skin, C.skin, C.skin, C.skin, C.skin, T],
      [T, C.skin, C.black, C.skin, C.skin, C.black, C.skin, T],
      [T, T, C.skin, C.skin, C.skin, C.skin, T, T],
      [T, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, T],
      [C.skin, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, T],
      [T, C.pants, T, C.pants, C.pants, T, C.pants, T],
    ],
  ],
};

// NPC sprite - mysterious figure
export const npcMysteriousSprite: Sprite = {
  id: 'npc_mysterious',
  name: 'Mysterious Figure',
  width: 32,
  height: 32,
  animationSpeed: 300,
  frames: [
    [
      [T, T, C.purple, C.purple, C.purple, C.purple, T, T],
      [T, C.purple, C.darkPurple, C.darkPurple, C.darkPurple, C.darkPurple, C.purple, T],
      [T, C.purple, C.cyan, C.darkPurple, C.darkPurple, C.pink, C.purple, T],
      [T, C.purple, C.darkPurple, C.darkPurple, C.darkPurple, C.darkPurple, C.purple, T],
      [T, T, C.purple, C.purple, C.purple, C.purple, T, T],
      [T, C.purple, C.purple, C.purple, C.purple, C.purple, C.purple, T],
      [C.purple, C.purple, C.purple, C.purple, C.purple, C.purple, C.purple, C.purple],
      [T, C.purple, T, C.purple, C.purple, T, C.purple, T],
    ],
  ],
};

// Default tiles
export const grassTile: Tile = {
  id: 'grass',
  solid: false,
  interactable: false,
  sprite: [
    [C.grass, C.grassLight, C.grass, C.grass, C.grassLight, C.grass, C.grass, C.grassLight],
    [C.grass, C.grass, C.grass, C.grassLight, C.grass, C.grass, C.grassLight, C.grass],
    [C.grassLight, C.grass, C.grass, C.grass, C.grass, C.grassLight, C.grass, C.grass],
    [C.grass, C.grass, C.grassLight, C.grass, C.grass, C.grass, C.grass, C.grassLight],
    [C.grass, C.grassLight, C.grass, C.grass, C.grassLight, C.grass, C.grass, C.grass],
    [C.grassLight, C.grass, C.grass, C.grass, C.grass, C.grass, C.grassLight, C.grass],
    [C.grass, C.grass, C.grass, C.grassLight, C.grass, C.grassLight, C.grass, C.grass],
    [C.grass, C.grassLight, C.grass, C.grass, C.grass, C.grass, C.grass, C.grassLight],
  ],
};

export const stoneTile: Tile = {
  id: 'stone',
  solid: true,
  interactable: false,
  sprite: [
    [C.stone, C.stoneLight, C.stone, C.stone, C.stoneLight, C.stone, C.stone, C.stoneLight],
    [C.stoneLight, C.stone, C.stone, C.stoneLight, C.stone, C.stone, C.stoneLight, C.stone],
    [C.stone, C.stone, C.stoneLight, C.stone, C.stone, C.stoneLight, C.stone, C.stone],
    [C.stone, C.stoneLight, C.stone, C.stone, C.stoneLight, C.stone, C.stone, C.stoneLight],
    [C.stoneLight, C.stone, C.stone, C.stone, C.stone, C.stone, C.stoneLight, C.stone],
    [C.stone, C.stone, C.stoneLight, C.stone, C.stoneLight, C.stone, C.stone, C.stone],
    [C.stone, C.stoneLight, C.stone, C.stone, C.stone, C.stoneLight, C.stone, C.stoneLight],
    [C.stoneLight, C.stone, C.stone, C.stoneLight, C.stone, C.stone, C.stone, C.stone],
  ],
};

export const waterTile: Tile = {
  id: 'water',
  solid: true,
  interactable: false,
  sprite: [
    [C.water, C.waterLight, C.water, C.water, C.waterLight, C.water, C.water, C.waterLight],
    [C.waterLight, C.water, C.water, C.waterLight, C.water, C.water, C.waterLight, C.water],
    [C.water, C.water, C.waterLight, C.water, C.water, C.waterLight, C.water, C.water],
    [C.water, C.waterLight, C.water, C.water, C.waterLight, C.water, C.water, C.waterLight],
    [C.waterLight, C.water, C.water, C.water, C.water, C.water, C.waterLight, C.water],
    [C.water, C.water, C.waterLight, C.water, C.waterLight, C.water, C.water, C.water],
    [C.water, C.waterLight, C.water, C.water, C.water, C.waterLight, C.water, C.waterLight],
    [C.waterLight, C.water, C.water, C.waterLight, C.water, C.water, C.water, C.water],
  ],
};

export const woodFloorTile: Tile = {
  id: 'wood_floor',
  solid: false,
  interactable: false,
  sprite: [
    [C.wood, C.wood, C.wood, C.woodLight, C.wood, C.wood, C.wood, C.woodLight],
    [C.wood, C.wood, C.wood, C.woodLight, C.wood, C.wood, C.wood, C.woodLight],
    [C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight],
    [C.wood, C.wood, C.wood, C.woodLight, C.wood, C.wood, C.wood, C.woodLight],
    [C.wood, C.wood, C.wood, C.woodLight, C.wood, C.wood, C.wood, C.woodLight],
    [C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight],
    [C.wood, C.wood, C.wood, C.woodLight, C.wood, C.wood, C.wood, C.woodLight],
    [C.wood, C.wood, C.wood, C.woodLight, C.wood, C.wood, C.wood, C.woodLight],
  ],
};

// Interactive tile - sign
export const signTile: Tile = {
  id: 'sign',
  solid: true,
  interactable: true,
  interactionType: 'dialogue',
  interactionData: 'sign_welcome',
  sprite: [
    [T, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, T],
    [C.wood, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.wood],
    [C.wood, C.woodLight, C.black, C.black, C.black, C.black, C.woodLight, C.wood],
    [C.wood, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.wood],
    [T, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, T],
    [T, T, T, C.wood, C.wood, T, T, T],
    [T, T, T, C.wood, C.wood, T, T, T],
    [T, T, T, C.wood, C.wood, T, T, T],
  ],
};

// All default sprites bundled
export const defaultSprites = {
  player: playerSprite,
  npc_mysterious: npcMysteriousSprite,
};

export const defaultTiles = {
  grass: grassTile,
  stone: stoneTile,
  water: waterTile,
  wood_floor: woodFloorTile,
  sign: signTile,
};
