// Map monsters that roam and can be encountered
import { Position } from '../types/GameTypes';

// Sprites for map monsters (smaller, visible on overworld)
const T = 'transparent';

// Colors for monsters
const MONSTER_COLORS = {
  // Slime
  slimeBody: '#4ade80',
  slimeLight: '#86efac',
  slimeDark: '#22c55e',
  slimeEye: '#1a1a2e',
  
  // Wolf
  wolfFur: '#6b7280',
  wolfFurLight: '#9ca3af',
  wolfFurDark: '#4b5563',
  wolfEye: '#ef4444',
  wolfNose: '#1f2937',
  
  // Bat
  batWing: '#581c87',
  batWingLight: '#7c3aed',
  batBody: '#3b0764',
  batEye: '#fbbf24',
  
  // Golem
  golemStone: '#78716c',
  golemStoneLight: '#a8a29e',
  golemStoneDark: '#57534e',
  golemCrystal: '#22d3ee',
  golemEye: '#fbbf24',
  
  // Sprite/Fairy
  spriteBody: '#c084fc',
  spriteLight: '#e9d5ff',
  spriteGlow: '#a855f7',
  spriteEye: '#1e1b4b',
  
  // Rabbit (friendly animal)
  rabbitFur: '#fef3c7',
  rabbitFurLight: '#fffbeb',
  rabbitEar: '#fcd34d',
  rabbitEye: '#292524',
  rabbitNose: '#f472b6',
  
  // Deer
  deerFur: '#92400e',
  deerFurLight: '#b45309',
  deerSpot: '#fef3c7',
  deerEye: '#1c1917',
  
  // Bird
  birdBody: '#3b82f6',
  birdWing: '#1d4ed8',
  birdBelly: '#fef3c7',
  birdBeak: '#f97316',
  birdEye: '#1e1b4b',
  
  // Mushroom creature
  mushCap: '#dc2626',
  mushCapSpot: '#fef3c7',
  mushStem: '#fef3c7',
  mushEye: '#1c1917',
  
  // Ghost
  ghostBody: '#e0e7ff',
  ghostLight: '#f8fafc',
  ghostEye: '#312e81',
};

const M = MONSTER_COLORS;

// Overworld monster sprites (8x8 for map display)
export const overworldMonsterSprites: Record<string, string[][]> = {
  // Green Slime - bouncy blob
  slime: [
    [T, T, M.slimeLight, M.slimeBody, M.slimeBody, M.slimeLight, T, T],
    [T, M.slimeLight, M.slimeBody, M.slimeBody, M.slimeBody, M.slimeBody, M.slimeLight, T],
    [M.slimeBody, M.slimeBody, M.slimeEye, M.slimeBody, M.slimeBody, M.slimeEye, M.slimeBody, M.slimeBody],
    [M.slimeBody, M.slimeBody, M.slimeBody, M.slimeBody, M.slimeBody, M.slimeBody, M.slimeBody, M.slimeBody],
    [M.slimeLight, M.slimeBody, M.slimeBody, M.slimeBody, M.slimeBody, M.slimeBody, M.slimeBody, M.slimeLight],
    [T, M.slimeDark, M.slimeBody, M.slimeBody, M.slimeBody, M.slimeBody, M.slimeDark, T],
    [T, T, M.slimeDark, M.slimeDark, M.slimeDark, M.slimeDark, T, T],
    [T, T, T, T, T, T, T, T],
  ],
  
  // Shadow Wolf - predator
  wolf: [
    [T, M.wolfFurLight, T, T, T, T, M.wolfFurLight, T],
    [T, M.wolfFur, M.wolfFur, M.wolfFur, M.wolfFur, M.wolfFur, M.wolfFur, T],
    [M.wolfFur, M.wolfEye, M.wolfFur, M.wolfFur, M.wolfFur, M.wolfEye, M.wolfFur, M.wolfFur],
    [M.wolfFur, M.wolfFur, M.wolfFur, M.wolfNose, M.wolfFur, M.wolfFur, M.wolfFur, M.wolfFur],
    [T, M.wolfFurDark, M.wolfFur, M.wolfFur, M.wolfFur, M.wolfFur, M.wolfFurDark, T],
    [T, M.wolfFur, M.wolfFur, M.wolfFurDark, M.wolfFurDark, M.wolfFur, M.wolfFur, T],
    [T, M.wolfFur, T, M.wolfFur, M.wolfFur, T, M.wolfFur, T],
    [T, M.wolfFurDark, T, M.wolfFurDark, M.wolfFurDark, T, M.wolfFurDark, T],
  ],
  
  // Crystal Bat - cave dweller
  bat: [
    [M.batWing, T, T, T, T, T, T, M.batWing],
    [M.batWingLight, M.batWing, T, M.batBody, M.batBody, T, M.batWing, M.batWingLight],
    [T, M.batWing, M.batBody, M.batEye, M.batEye, M.batBody, M.batWing, T],
    [T, T, M.batBody, M.batBody, M.batBody, M.batBody, T, T],
    [T, T, T, M.batBody, M.batBody, T, T, T],
    [T, T, T, T, T, T, T, T],
    [T, T, T, T, T, T, T, T],
    [T, T, T, T, T, T, T, T],
  ],
  
  // Rock Golem - heavy hitter
  golem: [
    [T, M.golemStone, M.golemStone, M.golemStone, M.golemStone, M.golemStone, M.golemStone, T],
    [M.golemStone, M.golemEye, M.golemStoneLight, M.golemCrystal, M.golemCrystal, M.golemStoneLight, M.golemEye, M.golemStone],
    [M.golemStone, M.golemStone, M.golemStone, M.golemStone, M.golemStone, M.golemStone, M.golemStone, M.golemStone],
    [M.golemStoneDark, M.golemStone, M.golemStone, M.golemStone, M.golemStone, M.golemStone, M.golemStone, M.golemStoneDark],
    [T, M.golemStone, M.golemStone, M.golemStoneDark, M.golemStoneDark, M.golemStone, M.golemStone, T],
    [T, M.golemStone, T, M.golemStone, M.golemStone, T, M.golemStone, T],
    [T, M.golemStoneDark, T, M.golemStoneDark, M.golemStoneDark, T, M.golemStoneDark, T],
    [T, T, T, T, T, T, T, T],
  ],
  
  // Dark Sprite - magical creature
  sprite: [
    [T, T, M.spriteGlow, M.spriteLight, M.spriteLight, M.spriteGlow, T, T],
    [T, M.spriteGlow, M.spriteBody, M.spriteLight, M.spriteLight, M.spriteBody, M.spriteGlow, T],
    [M.spriteLight, M.spriteBody, M.spriteEye, M.spriteBody, M.spriteBody, M.spriteEye, M.spriteBody, M.spriteLight],
    [T, M.spriteBody, M.spriteBody, M.spriteLight, M.spriteLight, M.spriteBody, M.spriteBody, T],
    [T, T, M.spriteGlow, M.spriteBody, M.spriteBody, M.spriteGlow, T, T],
    [T, T, T, M.spriteGlow, M.spriteGlow, T, T, T],
    [T, T, T, T, T, T, T, T],
    [T, T, T, T, T, T, T, T],
  ],
  
  // Friendly Rabbit - passive animal
  rabbit: [
    [T, M.rabbitEar, T, T, T, T, M.rabbitEar, T],
    [T, M.rabbitFur, M.rabbitEar, T, T, M.rabbitEar, M.rabbitFur, T],
    [T, M.rabbitFur, M.rabbitFur, M.rabbitFur, M.rabbitFur, M.rabbitFur, M.rabbitFur, T],
    [M.rabbitFur, M.rabbitEye, M.rabbitFur, M.rabbitFur, M.rabbitFur, M.rabbitEye, M.rabbitFur, M.rabbitFur],
    [M.rabbitFur, M.rabbitFur, M.rabbitFur, M.rabbitNose, M.rabbitFur, M.rabbitFur, M.rabbitFur, M.rabbitFur],
    [T, M.rabbitFurLight, M.rabbitFur, M.rabbitFur, M.rabbitFur, M.rabbitFur, M.rabbitFurLight, T],
    [T, T, M.rabbitFur, T, T, M.rabbitFur, T, T],
    [T, T, T, T, T, T, T, T],
  ],
  
  // Forest Deer - graceful creature
  deer: [
    [M.deerFur, T, T, T, T, T, T, M.deerFur],
    [M.deerFurLight, M.deerFur, T, T, T, T, M.deerFur, M.deerFurLight],
    [T, M.deerFur, M.deerFur, M.deerFur, M.deerFur, M.deerFur, M.deerFur, T],
    [T, M.deerEye, M.deerFur, M.deerSpot, M.deerSpot, M.deerFur, M.deerEye, T],
    [T, M.deerFur, M.deerFur, M.deerFur, M.deerFur, M.deerFur, M.deerFur, T],
    [T, T, M.deerFur, M.deerFurLight, M.deerFurLight, M.deerFur, T, T],
    [T, T, M.deerFur, T, T, M.deerFur, T, T],
    [T, T, M.deerFurLight, T, T, M.deerFurLight, T, T],
  ],
  
  // Blue Bird - flying creature
  bird: [
    [T, T, T, M.birdBody, M.birdBody, T, T, T],
    [T, T, M.birdBody, M.birdBody, M.birdBody, M.birdBody, T, T],
    [M.birdWing, M.birdBody, M.birdEye, M.birdBody, M.birdBody, M.birdEye, M.birdBody, M.birdWing],
    [M.birdWing, M.birdBody, M.birdBody, M.birdBeak, M.birdBody, M.birdBody, M.birdBody, M.birdWing],
    [T, T, M.birdBelly, M.birdBelly, M.birdBelly, M.birdBelly, T, T],
    [T, T, T, M.birdBody, M.birdBody, T, T, T],
    [T, T, T, T, T, T, T, T],
    [T, T, T, T, T, T, T, T],
  ],
  
  // Mushroom Creature - forest enemy
  mushroom: [
    [T, T, M.mushCap, M.mushCap, M.mushCap, M.mushCap, T, T],
    [T, M.mushCap, M.mushCapSpot, M.mushCap, M.mushCap, M.mushCapSpot, M.mushCap, T],
    [M.mushCap, M.mushCap, M.mushCap, M.mushCap, M.mushCap, M.mushCap, M.mushCap, M.mushCap],
    [T, T, M.mushStem, M.mushStem, M.mushStem, M.mushStem, T, T],
    [T, T, M.mushEye, M.mushStem, M.mushStem, M.mushEye, T, T],
    [T, T, M.mushStem, M.mushStem, M.mushStem, M.mushStem, T, T],
    [T, T, T, M.mushStem, M.mushStem, T, T, T],
    [T, T, T, T, T, T, T, T],
  ],
  
  // Ghost - spooky enemy
  ghost: [
    [T, T, M.ghostBody, M.ghostLight, M.ghostLight, M.ghostBody, T, T],
    [T, M.ghostBody, M.ghostLight, M.ghostLight, M.ghostLight, M.ghostLight, M.ghostBody, T],
    [M.ghostBody, M.ghostLight, M.ghostEye, M.ghostLight, M.ghostLight, M.ghostEye, M.ghostLight, M.ghostBody],
    [M.ghostBody, M.ghostLight, M.ghostLight, M.ghostLight, M.ghostLight, M.ghostLight, M.ghostLight, M.ghostBody],
    [M.ghostBody, M.ghostLight, M.ghostLight, M.ghostBody, M.ghostBody, M.ghostLight, M.ghostLight, M.ghostBody],
    [T, M.ghostBody, M.ghostLight, M.ghostLight, M.ghostLight, M.ghostLight, M.ghostBody, T],
    [T, M.ghostBody, T, M.ghostBody, M.ghostBody, T, M.ghostBody, T],
    [T, T, T, T, T, T, T, T],
  ],
};

// Monster definitions with stats for combat
export interface MapMonsterDefinition {
  id: string;
  name: string;
  nameEs: string;
  spriteKey: keyof typeof overworldMonsterSprites;
  hostile: boolean; // Can be fought
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  expReward: number;
}

export const monsterDefinitions: Record<string, MapMonsterDefinition> = {
  slime: {
    id: 'slime',
    name: 'Green Slime',
    nameEs: 'Slime Verde',
    spriteKey: 'slime',
    hostile: true,
    hp: 20,
    attack: 5,
    defense: 2,
    speed: 3,
    expReward: 10,
  },
  wolf: {
    id: 'wolf',
    name: 'Shadow Wolf',
    nameEs: 'Lobo Sombra',
    spriteKey: 'wolf',
    hostile: true,
    hp: 45,
    attack: 12,
    defense: 5,
    speed: 8,
    expReward: 35,
  },
  bat: {
    id: 'bat',
    name: 'Crystal Bat',
    nameEs: 'Murciélago Cristal',
    spriteKey: 'bat',
    hostile: true,
    hp: 25,
    attack: 8,
    defense: 3,
    speed: 10,
    expReward: 20,
  },
  golem: {
    id: 'golem',
    name: 'Rock Golem',
    nameEs: 'Golem de Roca',
    spriteKey: 'golem',
    hostile: true,
    hp: 80,
    attack: 15,
    defense: 12,
    speed: 2,
    expReward: 60,
  },
  sprite: {
    id: 'sprite',
    name: 'Dark Sprite',
    nameEs: 'Hada Oscura',
    spriteKey: 'sprite',
    hostile: true,
    hp: 30,
    attack: 10,
    defense: 4,
    speed: 9,
    expReward: 25,
  },
  mushroom: {
    id: 'mushroom',
    name: 'Mushroom Beast',
    nameEs: 'Bestia Hongo',
    spriteKey: 'mushroom',
    hostile: true,
    hp: 35,
    attack: 7,
    defense: 6,
    speed: 4,
    expReward: 28,
  },
  ghost: {
    id: 'ghost',
    name: 'Wandering Ghost',
    nameEs: 'Fantasma Errante',
    spriteKey: 'ghost',
    hostile: true,
    hp: 40,
    attack: 9,
    defense: 2,
    speed: 7,
    expReward: 32,
  },
  // Friendly animals
  rabbit: {
    id: 'rabbit',
    name: 'Forest Rabbit',
    nameEs: 'Conejo del Bosque',
    spriteKey: 'rabbit',
    hostile: false,
    hp: 10,
    attack: 0,
    defense: 0,
    speed: 12,
    expReward: 0,
  },
  deer: {
    id: 'deer',
    name: 'Gentle Deer',
    nameEs: 'Ciervo Gentil',
    spriteKey: 'deer',
    hostile: false,
    hp: 15,
    attack: 0,
    defense: 0,
    speed: 10,
    expReward: 0,
  },
  bird: {
    id: 'bird',
    name: 'Blue Bird',
    nameEs: 'Pájaro Azul',
    spriteKey: 'bird',
    hostile: false,
    hp: 8,
    attack: 0,
    defense: 0,
    speed: 15,
    expReward: 0,
  },
};

// Generate random monsters for a map
export const generateMapMonsters = (
  mapId: string,
  mapWidth: number,
  mapHeight: number,
  possibleMonsters: string[],
  count: number,
  occupiedTiles: Set<string>
): Array<{ id: string; monsterId: string; position: Position; sprite: string[][] }> => {
  const monsters: Array<{ id: string; monsterId: string; position: Position; sprite: string[][] }> = [];
  
  for (let i = 0; i < count; i++) {
    const monsterId = possibleMonsters[Math.floor(Math.random() * possibleMonsters.length)];
    const definition = monsterDefinitions[monsterId];
    if (!definition) continue;
    
    // Find a valid position
    let attempts = 0;
    let x: number, y: number;
    do {
      x = Math.floor(Math.random() * (mapWidth - 4)) + 2;
      y = Math.floor(Math.random() * (mapHeight - 4)) + 2;
      attempts++;
    } while (occupiedTiles.has(`${x},${y}`) && attempts < 50);
    
    if (attempts < 50) {
      occupiedTiles.add(`${x},${y}`);
      monsters.push({
        id: `${mapId}_${monsterId}_${i}`,
        monsterId,
        position: { x, y },
        sprite: overworldMonsterSprites[definition.spriteKey],
      });
    }
  }
  
  return monsters;
};
