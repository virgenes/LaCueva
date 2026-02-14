// Unified Monster Registry — Single source of truth for overworld + combat data
import { Position } from '../types/GameTypes';
import { Skill, StatusEffect } from '../types/CombatTypes';
const T = 'transparent';
// ============ OVERWORLD SPRITES (8x8) ============
const M = {
  slimeBody: '#4ade80', slimeLight: '#86efac', slimeDark: '#22c55e', slimeEye: '#1a1a2e',
  wolfFur: '#6b7280', wolfFurLight: '#9ca3af', wolfFurDark: '#4b5563', wolfEye: '#ef4444', wolfNose: '#1f2937',
  batWing: '#581c87', batWingLight: '#7c3aed', batBody: '#3b0764', batEye: '#fbbf24',
  golemStone: '#78716c', golemStoneLight: '#a8a29e', golemStoneDark: '#57534e', golemCrystal: '#22d3ee', golemEye: '#fbbf24',
  spriteBody: '#c084fc', spriteLight: '#e9d5ff', spriteGlow: '#a855f7', spriteEye: '#1e1b4b',
  rabbitFur: '#fef3c7', rabbitFurLight: '#fffbeb', rabbitEar: '#fcd34d', rabbitEye: '#292524', rabbitNose: '#f472b6',
  deerFur: '#92400e', deerFurLight: '#b45309', deerSpot: '#fef3c7', deerEye: '#1c1917',
  birdBody: '#3b82f6', birdWing: '#1d4ed8', birdBelly: '#fef3c7', birdBeak: '#f97316', birdEye: '#1e1b4b',
  mushCap: '#dc2626', mushCapSpot: '#fef3c7', mushStem: '#fef3c7', mushEye: '#1c1917',
  ghostBody: '#e0e7ff', ghostLight: '#f8fafc', ghostEye: '#312e81',
  shadowSlimeBody: '#2a2a4a', shadowSlimeLight: '#3a3a6a', shadowSlimeEye: '#ff0000',
  wraithBody: '#4a2a6a', wraithLight: '#6a4a8a', wraithEye: '#00ffff',
  voidBody: '#1a1a2e', voidMid: '#2a2a4e', voidInner: '#3a3a6e', voidEye: '#ff0000', voidAccent: '#ff00ff',
};
const overworldSprites: Record<string, string[][]> = {
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
  shadow_slime: [
    [T, T, M.shadowSlimeLight, M.shadowSlimeBody, M.shadowSlimeBody, M.shadowSlimeLight, T, T],
    [T, M.shadowSlimeLight, M.shadowSlimeBody, M.shadowSlimeBody, M.shadowSlimeBody, M.shadowSlimeBody, M.shadowSlimeLight, T],
    [M.shadowSlimeBody, M.shadowSlimeBody, M.shadowSlimeEye, M.shadowSlimeBody, M.shadowSlimeBody, M.shadowSlimeEye, M.shadowSlimeBody, M.shadowSlimeBody],
    [M.shadowSlimeBody, M.shadowSlimeBody, M.shadowSlimeBody, M.shadowSlimeBody, M.shadowSlimeBody, M.shadowSlimeBody, M.shadowSlimeBody, M.shadowSlimeBody],
    [M.shadowSlimeBody, M.shadowSlimeLight, M.shadowSlimeBody, M.shadowSlimeBody, M.shadowSlimeBody, M.shadowSlimeBody, M.shadowSlimeLight, M.shadowSlimeBody],
    [M.shadowSlimeBody, M.shadowSlimeBody, M.shadowSlimeBody, M.shadowSlimeBody, M.shadowSlimeBody, M.shadowSlimeBody, M.shadowSlimeBody, M.shadowSlimeBody],
    [T, M.shadowSlimeBody, M.shadowSlimeBody, M.shadowSlimeBody, M.shadowSlimeBody, M.shadowSlimeBody, M.shadowSlimeBody, T],
    [T, T, M.shadowSlimeBody, M.shadowSlimeBody, M.shadowSlimeBody, M.shadowSlimeBody, T, T],
  ],
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
  memory_wraith: [
    [T, M.wraithBody, M.wraithBody, T, T, M.wraithBody, M.wraithBody, T],
    [M.wraithBody, M.wraithLight, M.wraithLight, M.wraithBody, M.wraithBody, M.wraithLight, M.wraithLight, M.wraithBody],
    [M.wraithBody, M.wraithEye, M.wraithLight, M.wraithLight, M.wraithLight, M.wraithLight, M.wraithEye, M.wraithBody],
    [T, M.wraithBody, M.wraithLight, M.wraithLight, M.wraithLight, M.wraithLight, M.wraithBody, T],
    [T, M.wraithBody, M.wraithLight, M.wraithLight, M.wraithLight, M.wraithLight, M.wraithBody, T],
    [M.wraithBody, M.wraithLight, T, M.wraithLight, M.wraithLight, T, M.wraithLight, M.wraithBody],
    [T, M.wraithBody, T, T, T, T, M.wraithBody, T],
    [T, T, M.wraithBody, T, T, M.wraithBody, T, T],
  ],
  void_guardian: [
    [M.voidBody, M.voidBody, M.voidBody, M.voidAccent, M.voidAccent, M.voidBody, M.voidBody, M.voidBody],
    [M.voidBody, M.voidMid, M.voidMid, M.voidAccent, M.voidAccent, M.voidMid, M.voidMid, M.voidBody],
    [M.voidMid, M.voidInner, M.voidEye, M.voidInner, M.voidInner, M.voidEye, M.voidInner, M.voidMid],
    [M.voidMid, M.voidInner, M.voidInner, M.voidInner, M.voidInner, M.voidInner, M.voidInner, M.voidMid],
    [M.voidInner, M.voidInner, M.voidInner, M.voidInner, M.voidInner, M.voidInner, M.voidInner, M.voidInner],
    [M.voidMid, M.voidInner, M.voidInner, M.voidInner, M.voidInner, M.voidInner, M.voidInner, M.voidMid],
    [M.voidBody, M.voidMid, M.voidInner, M.voidInner, M.voidInner, M.voidInner, M.voidMid, M.voidBody],
    [M.voidBody, M.voidBody, M.voidMid, M.voidMid, M.voidMid, M.voidMid, M.voidBody, M.voidBody],
  ],
};
// ============ UNIFIED MONSTER DEFINITION ============
export type MonsterAI = 'aggressive' | 'defensive' | 'random' | 'smart';
export interface MonsterDrop {
  itemId: string;
  chance: number; // 0-1
}
export interface MonsterDefinition {
  id: string;
  name: string;
  nameEs: string;
  hostile: boolean;
  // Overworld
  overworldSprite: string[][];
  // Combat stats
  stats: {
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    speed: number;
    magic: number;
  };
  // Combat data
  skills: string[]; // skill IDs
  drops: MonsterDrop[];
  exp: number;
  gold: number;
  ai: MonsterAI;
  // Combat sprite (8x8, same as overworld for now)
  combatSprite: string[][];
}
// ============ MASTER REGISTRY ============
export const monsterRegistry: Record<string, MonsterDefinition> = {
  // === SLIMES ===
  slime: {
    id: 'slime',
    name: 'Green Slime',
    nameEs: 'Slime Verde',
    hostile: true,
    overworldSprite: overworldSprites.slime,
    stats: { hp: 20, maxHp: 20, attack: 5, defense: 2, speed: 3, magic: 2 },
    skills: ['basic_attack'],
    drops: [{ itemId: 'slime_essence', chance: 0.4 }],
    exp: 10,
    gold: 3,
    ai: 'random',
    combatSprite: overworldSprites.slime,
  },
  shadow_slime: {
    id: 'shadow_slime',
    name: 'Shadow Slime',
    nameEs: 'Slime Sombrío',
    hostile: true,
    overworldSprite: overworldSprites.shadow_slime,
    stats: { hp: 30, maxHp: 30, attack: 8, defense: 3, speed: 4, magic: 5 },
    skills: ['basic_attack'],
    drops: [{ itemId: 'slime_essence', chance: 0.3 }],
    exp: 15,
    gold: 5,
    ai: 'random',
    combatSprite: overworldSprites.shadow_slime,
  },
  // === FOREST ===
  wolf: {
    id: 'wolf',
    name: 'Shadow Wolf',
    nameEs: 'Lobo Sombra',
    hostile: true,
    overworldSprite: overworldSprites.wolf,
    stats: { hp: 45, maxHp: 45, attack: 12, defense: 5, speed: 8, magic: 3 },
    skills: ['basic_attack', 'focus'],
    drops: [{ itemId: 'wolf_fang', chance: 0.25 }],
    exp: 35,
    gold: 12,
    ai: 'aggressive',
    combatSprite: overworldSprites.wolf,
  },
  sprite: {
    id: 'sprite',
    name: 'Dark Sprite',
    nameEs: 'Hada Oscura',
    hostile: true,
    overworldSprite: overworldSprites.sprite,
    stats: { hp: 30, maxHp: 30, attack: 8, defense: 4, speed: 10, magic: 15 },
    skills: ['basic_attack', 'fire_bolt'],
    drops: [{ itemId: 'fairy_dust', chance: 0.3 }],
    exp: 28,
    gold: 10,
    ai: 'smart',
    combatSprite: overworldSprites.sprite,
  },
  mushroom: {
    id: 'mushroom',
    name: 'Mushroom Beast',
    nameEs: 'Bestia Hongo',
    hostile: true,
    overworldSprite: overworldSprites.mushroom,
    stats: { hp: 35, maxHp: 35, attack: 7, defense: 6, speed: 4, magic: 8 },
    skills: ['basic_attack'],
    drops: [{ itemId: 'spore_cloud', chance: 0.35 }],
    exp: 25,
    gold: 8,
    ai: 'defensive',
    combatSprite: overworldSprites.mushroom,
  },
  // === CAVE ===
  bat: {
    id: 'bat',
    name: 'Crystal Bat',
    nameEs: 'Murciélago Cristal',
    hostile: true,
    overworldSprite: overworldSprites.bat,
    stats: { hp: 25, maxHp: 25, attack: 8, defense: 3, speed: 12, magic: 6 },
    skills: ['basic_attack'],
    drops: [{ itemId: 'bat_wing', chance: 0.4 }],
    exp: 20,
    gold: 7,
    ai: 'aggressive',
    combatSprite: overworldSprites.bat,
  },
  golem: {
    id: 'golem',
    name: 'Rock Golem',
    nameEs: 'Golem de Roca',
    hostile: true,
    overworldSprite: overworldSprites.golem,
    stats: { hp: 80, maxHp: 80, attack: 15, defense: 12, speed: 2, magic: 5 },
    skills: ['basic_attack', 'defend'],
    drops: [{ itemId: 'stone_heart', chance: 0.2 }],
    exp: 60,
    gold: 25,
    ai: 'defensive',
    combatSprite: overworldSprites.golem,
  },
  ghost: {
    id: 'ghost',
    name: 'Wandering Ghost',
    nameEs: 'Fantasma Errante',
    hostile: true,
    overworldSprite: overworldSprites.ghost,
    stats: { hp: 40, maxHp: 40, attack: 10, defense: 2, speed: 8, magic: 12 },
    skills: ['basic_attack', 'fire_bolt'],
    drops: [{ itemId: 'ectoplasm', chance: 0.3 }],
    exp: 35,
    gold: 15,
    ai: 'smart',
    combatSprite: overworldSprites.ghost,
  },
  // === FRIENDLY ===
  rabbit: {
    id: 'rabbit',
    name: 'Forest Rabbit',
    nameEs: 'Conejo del Bosque',
    hostile: false,
    overworldSprite: overworldSprites.rabbit,
    stats: { hp: 10, maxHp: 10, attack: 0, defense: 0, speed: 12, magic: 0 },
    skills: [],
    drops: [],
    exp: 0,
    gold: 0,
    ai: 'random',
    combatSprite: overworldSprites.rabbit,
  },
  deer: {
    id: 'deer',
    name: 'Gentle Deer',
    nameEs: 'Ciervo Gentil',
    hostile: false,
    overworldSprite: overworldSprites.deer,
    stats: { hp: 15, maxHp: 15, attack: 0, defense: 0, speed: 10, magic: 0 },
    skills: [],
    drops: [],
    exp: 0,
    gold: 0,
    ai: 'random',
    combatSprite: overworldSprites.deer,
  },
  bird: {
    id: 'bird',
    name: 'Blue Bird',
    nameEs: 'Pájaro Azul',
    hostile: false,
    overworldSprite: overworldSprites.bird,
    stats: { hp: 8, maxHp: 8, attack: 0, defense: 0, speed: 15, magic: 0 },
    skills: [],
    drops: [],
    exp: 0,
    gold: 0,
    ai: 'random',
    combatSprite: overworldSprites.bird,
  },
  // === BOSSES ===
  memory_wraith: {
    id: 'memory_wraith',
    name: 'Memory Wraith',
    nameEs: 'Espectro de Memoria',
    hostile: true,
    overworldSprite: overworldSprites.memory_wraith,
    stats: { hp: 80, maxHp: 80, attack: 15, defense: 8, speed: 9, magic: 20 },
    skills: ['basic_attack', 'fire_bolt', 'thunder_strike'],
    drops: [{ itemId: 'memory_fragment', chance: 0.5 }],
    exp: 50,
    gold: 30,
    ai: 'smart',
    combatSprite: overworldSprites.memory_wraith,
  },
  void_guardian: {
    id: 'void_guardian',
    name: 'Void Guardian',
    nameEs: 'Guardián del Vacío',
    hostile: true,
    overworldSprite: overworldSprites.void_guardian,
    stats: { hp: 120, maxHp: 120, attack: 22, defense: 15, speed: 4, magic: 25 },
    skills: ['basic_attack', 'thunder_strike', 'defend'],
    drops: [{ itemId: 'void_crystal', chance: 0.6 }],
    exp: 80,
    gold: 50,
    ai: 'smart',
    combatSprite: overworldSprites.void_guardian,
  },
};
// ============ MAP MONSTER GENERATION ============
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
    const def = monsterRegistry[monsterId];
    if (!def) continue;
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
        sprite: def.overworldSprite,
      });
    }
  }
  return monsters;
};
