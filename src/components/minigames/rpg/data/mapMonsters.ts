import { Position } from '../types/GameTypes';

// Colors for monsters - Standardized Palette
const MONSTER_COLORS = {
  slime: { body: '#4ade80', light: '#86efac', dark: '#22c55e', eye: '#1a1a2e' },
  wolf: { fur: '#6b7280', light: '#9ca3af', dark: '#4b5563', eye: '#ef4444', nose: '#1f2937' },
  bat: { wing: '#581c87', light: '#7c3aed', body: '#3b0764', eye: '#fbbf24' },
  golem: { stone: '#78716c', light: '#a8a29e', dark: '#57534e', crystal: '#22d3ee', eye: '#fbbf24' },
  sprite: { body: '#c084fc', light: '#e9d5ff', glow: '#a855f7', eye: '#1e1b4b' },
  rabbit: { fur: '#fef3c7', light: '#fffbeb', ear: '#fcd34d', eye: '#292524', nose: '#f472b6' },
  deer: { fur: '#92400e', light: '#b45309', spot: '#fef3c7', eye: '#1c1917' },
  bird: { body: '#3b82f6', wing: '#1d4ed8', belly: '#fef3c7', beak: '#f97316', eye: '#1e1b4b' },
  mushroom: { cap: '#dc2626', spot: '#fef3c7', stem: '#fef3c7', eye: '#1c1917' },
  ghost: { body: '#e0e7ff', light: '#f8fafc', eye: '#312e81' },
  wraith: { main: '#4a2a6a', dark: '#6a4a8a', glow: '#00ffff' },
  void: { dark: '#1a1a2e', mid: '#2a2a4e', light: '#3a3a6e', glow: '#ff00ff', danger: '#ff0000' }
};

const T = 'transparent';
const C = MONSTER_COLORS;

// Overworld monster sprites (8x8 for map display)
export const overworldMonsterSprites: Record<string, string[][]> = {
  slime: [
    [T, T, C.slime.light, C.slime.body, C.slime.body, C.slime.light, T, T],
    [T, C.slime.light, C.slime.body, C.slime.body, C.slime.body, C.slime.body, C.slime.light, T],
    [C.slime.body, C.slime.body, C.slime.eye, C.slime.body, C.slime.body, C.slime.eye, C.slime.body, C.slime.body],
    [C.slime.body, C.slime.body, C.slime.body, C.slime.body, C.slime.body, C.slime.body, C.slime.body, C.slime.body],
    [C.slime.light, C.slime.body, C.slime.body, C.slime.body, C.slime.body, C.slime.body, C.slime.body, C.slime.light],
    [T, C.slime.dark, C.slime.body, C.slime.body, C.slime.body, C.slime.body, C.slime.dark, T],
    [T, T, C.slime.dark, C.slime.dark, C.slime.dark, C.slime.dark, T, T],
    [T, T, T, T, T, T, T, T],
  ],
  wolf: [
    [T, C.wolf.light, T, T, T, T, C.wolf.light, T],
    [T, C.wolf.fur, C.wolf.fur, C.wolf.fur, C.wolf.fur, C.wolf.fur, C.wolf.fur, T],
    [C.wolf.fur, C.wolf.eye, C.wolf.fur, C.wolf.fur, C.wolf.fur, C.wolf.eye, C.wolf.fur, C.wolf.fur],
    [C.wolf.fur, C.wolf.fur, C.wolf.fur, C.wolf.nose, C.wolf.fur, C.wolf.fur, C.wolf.fur, C.wolf.fur],
    [T, C.wolf.dark, C.wolf.fur, C.wolf.fur, C.wolf.fur, C.wolf.fur, C.wolf.dark, T],
    [T, C.wolf.fur, C.wolf.fur, C.wolf.dark, C.wolf.dark, C.wolf.fur, C.wolf.fur, T],
    [T, C.wolf.fur, T, C.wolf.fur, C.wolf.fur, T, C.wolf.fur, T],
    [T, C.wolf.dark, T, C.wolf.dark, C.wolf.dark, T, C.wolf.dark, T],
  ],
  bat: [
    [C.bat.wing, T, T, T, T, T, T, C.bat.wing],
    [C.bat.light, C.bat.wing, T, C.bat.body, C.bat.body, T, C.bat.wing, C.bat.light],
    [T, C.bat.wing, C.bat.body, C.bat.eye, C.bat.eye, C.bat.body, C.bat.wing, T],
    [T, T, C.bat.body, C.bat.body, C.bat.body, C.bat.body, T, T],
    [T, T, T, C.bat.body, C.bat.body, T, T, T],
    [T, T, T, T, T, T, T, T],
    [T, T, T, T, T, T, T, T],
    [T, T, T, T, T, T, T, T],
  ],
  golem: [
    [T, C.golem.stone, C.golem.stone, C.golem.stone, C.golem.stone, C.golem.stone, C.golem.stone, T],
    [C.golem.stone, C.golem.eye, C.golem.light, C.golem.crystal, C.golem.crystal, C.golem.light, C.golem.eye, C.golem.stone],
    [C.golem.stone, C.golem.stone, C.golem.stone, C.golem.stone, C.golem.stone, C.golem.stone, C.golem.stone, C.golem.stone],
    [C.golem.dark, C.golem.stone, C.golem.stone, C.golem.stone, C.golem.stone, C.golem.stone, C.golem.stone, C.golem.dark],
    [T, C.golem.stone, C.golem.stone, C.golem.dark, C.golem.dark, C.golem.stone, C.golem.stone, T],
    [T, C.golem.stone, T, C.golem.stone, C.golem.stone, T, C.golem.stone, T],
    [T, C.golem.dark, T, C.golem.dark, C.golem.dark, T, C.golem.dark, T],
    [T, T, T, T, T, T, T, T],
  ],
  sprite: [
    [T, T, C.sprite.glow, C.sprite.light, C.sprite.light, C.sprite.glow, T, T],
    [T, C.sprite.glow, C.sprite.body, C.sprite.light, C.sprite.light, C.sprite.body, C.sprite.glow, T],
    [C.sprite.light, C.sprite.body, C.sprite.eye, C.sprite.body, C.sprite.body, C.sprite.eye, C.sprite.body, C.sprite.light],
    [T, C.sprite.body, C.sprite.body, C.sprite.light, C.sprite.light, C.sprite.body, C.sprite.body, T],
    [T, T, C.sprite.glow, C.sprite.body, C.sprite.body, C.sprite.glow, T, T],
    [T, T, T, C.sprite.glow, C.sprite.glow, T, T, T],
    [T, T, T, T, T, T, T, T],
    [T, T, T, T, T, T, T, T],
  ],
  rabbit: [
    [T, C.rabbit.ear, T, T, T, T, C.rabbit.ear, T],
    [T, C.rabbit.fur, C.rabbit.ear, T, T, C.rabbit.ear, C.rabbit.fur, T],
    [T, C.rabbit.fur, C.rabbit.fur, C.rabbit.fur, C.rabbit.fur, C.rabbit.fur, C.rabbit.fur, T],
    [C.rabbit.fur, C.rabbit.eye, C.rabbit.fur, C.rabbit.fur, C.rabbit.fur, C.rabbit.eye, C.rabbit.fur, C.rabbit.fur],
    [C.rabbit.fur, C.rabbit.fur, C.rabbit.fur, C.rabbit.nose, C.rabbit.fur, C.rabbit.fur, C.rabbit.fur, C.rabbit.fur],
    [T, C.rabbit.light, C.rabbit.fur, C.rabbit.fur, C.rabbit.fur, C.rabbit.fur, C.rabbit.light, T],
    [T, T, C.rabbit.fur, T, T, C.rabbit.fur, T, T],
    [T, T, T, T, T, T, T, T],
  ],
  deer: [
    [C.deer.fur, T, T, T, T, T, T, C.deer.fur],
    [C.deer.light, C.deer.fur, T, T, T, T, C.deer.fur, C.deer.light],
    [T, C.deer.fur, C.deer.fur, C.deer.fur, C.deer.fur, C.deer.fur, C.deer.fur, T],
    [T, C.deer.eye, C.deer.fur, C.deer.spot, C.deer.spot, C.deer.fur, C.deer.eye, T],
    [T, C.deer.fur, C.deer.fur, C.deer.fur, C.deer.fur, C.deer.fur, C.deer.fur, T],
    [T, T, C.deer.fur, C.deer.light, C.deer.light, C.deer.fur, T, T],
    [T, T, C.deer.fur, T, T, C.deer.fur, T, T],
    [T, T, C.deer.light, T, T, C.deer.light, T, T],
  ],
  bird: [
    [T, T, T, C.bird.body, C.bird.body, T, T, T],
    [T, T, C.bird.body, C.bird.body, C.bird.body, C.bird.body, T, T],
    [C.bird.wing, C.bird.body, C.bird.eye, C.bird.body, C.bird.body, C.bird.eye, C.bird.body, C.bird.wing],
    [C.bird.wing, C.bird.body, C.bird.body, C.bird.beak, C.bird.body, C.bird.body, C.bird.body, C.bird.wing],
    [T, T, C.bird.belly, C.bird.belly, C.bird.belly, C.bird.belly, T, T],
    [T, T, T, C.bird.body, C.bird.body, T, T, T],
    [T, T, T, T, T, T, T, T],
    [T, T, T, T, T, T, T, T],
  ],
  mushroom: [
    [T, T, C.mushroom.cap, C.mushroom.cap, C.mushroom.cap, C.mushroom.cap, T, T],
    [T, C.mushroom.cap, C.mushroom.spot, C.mushroom.cap, C.mushroom.cap, C.mushroom.spot, C.mushroom.cap, T],
    [C.mushroom.cap, C.mushroom.cap, C.mushroom.cap, C.mushroom.cap, C.mushroom.cap, C.mushroom.cap, C.mushroom.cap, C.mushroom.cap],
    [T, T, C.mushroom.stem, C.mushroom.stem, C.mushroom.stem, C.mushroom.stem, T, T],
    [T, T, C.mushroom.eye, C.mushroom.stem, C.mushroom.stem, C.mushroom.eye, T, T],
    [T, T, C.mushroom.stem, C.mushroom.stem, C.mushroom.stem, C.mushroom.stem, T, T],
    [T, T, T, C.mushroom.stem, C.mushroom.stem, T, T, T],
    [T, T, T, T, T, T, T, T],
  ],
  ghost: [
    [T, T, C.ghost.body, C.ghost.light, C.ghost.light, C.ghost.body, T, T],
    [T, C.ghost.body, C.ghost.light, C.ghost.light, C.ghost.light, C.ghost.light, C.ghost.body, T],
    [C.ghost.body, C.ghost.light, C.ghost.eye, C.ghost.light, C.ghost.light, C.ghost.eye, C.ghost.light, C.ghost.body],
    [C.ghost.body, C.ghost.light, C.ghost.light, C.ghost.light, C.ghost.light, C.ghost.light, C.ghost.light, C.ghost.body],
    [C.ghost.body, C.ghost.light, C.ghost.light, C.ghost.body, C.ghost.body, C.ghost.light, C.ghost.light, C.ghost.body],
    [T, C.ghost.body, C.ghost.light, C.ghost.light, C.ghost.light, C.ghost.light, C.ghost.body, T],
    [T, C.ghost.body, T, C.ghost.body, C.ghost.body, T, C.ghost.body, T],
    [T, T, T, T, T, T, T, T],
  ],
  memory_wraith: [
    [T, C.wraith.main, C.wraith.main, T, T, C.wraith.main, C.wraith.main, T],
    [C.wraith.main, C.wraith.dark, C.wraith.dark, C.wraith.main, C.wraith.main, C.wraith.dark, C.wraith.dark, C.wraith.main],
    [C.wraith.main, C.wraith.glow, C.wraith.dark, C.wraith.dark, C.wraith.dark, C.wraith.dark, C.wraith.glow, C.wraith.main],
    [T, C.wraith.main, C.wraith.dark, C.wraith.dark, C.wraith.dark, C.wraith.dark, C.wraith.main, T],
    [T, C.wraith.main, C.wraith.dark, C.wraith.dark, C.wraith.dark, C.wraith.dark, C.wraith.main, T],
    [C.wraith.main, C.wraith.dark, T, C.wraith.dark, C.wraith.dark, T, C.wraith.dark, C.wraith.main],
    [T, C.wraith.main, T, T, T, T, C.wraith.main, T],
    [T, T, C.wraith.main, T, T, C.wraith.main, T, T],
  ],
  void_guardian: [
    [C.void.dark, C.void.dark, C.void.dark, C.void.glow, C.void.glow, C.void.dark, C.void.dark, C.void.dark],
    [C.void.dark, C.void.mid, C.void.mid, C.void.glow, C.void.glow, C.void.mid, C.void.mid, C.void.dark],
    [C.void.mid, C.void.light, C.void.danger, C.void.light, C.void.light, C.void.danger, C.void.light, C.void.mid],
    [C.void.mid, C.void.light, C.void.light, C.void.light, C.void.light, C.void.light, C.void.light, C.void.mid],
    [C.void.light, C.void.light, C.void.light, C.void.light, C.void.light, C.void.light, C.void.light, C.void.light],
    [C.void.mid, C.void.light, C.void.light, C.void.light, C.void.light, C.void.light, C.void.light, C.void.mid],
    [C.void.dark, C.void.mid, C.void.light, C.void.light, C.void.light, C.void.light, C.void.mid, C.void.dark],
    [C.void.dark, C.void.dark, C.void.mid, C.void.mid, C.void.mid, C.void.mid, C.void.dark, C.void.dark],
  ],
};

export interface MapMonsterDefinition {
  id: string;
  name: string;
  nameEs: string;
  spriteKey: keyof typeof overworldMonsterSprites;
  hostile: boolean;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  expReward: number;
}

export const monsterDefinitions: Record<string, MapMonsterDefinition> = {
  slime: { id: 'slime', name: 'Green Slime', nameEs: 'Slime Verde', spriteKey: 'slime', hostile: true, hp: 20, attack: 5, defense: 2, speed: 3, expReward: 10 },
  wolf: { id: 'wolf', name: 'Shadow Wolf', nameEs: 'Lobo Sombra', spriteKey: 'wolf', hostile: true, hp: 45, attack: 12, defense: 5, speed: 8, expReward: 35 },
  bat: { id: 'bat', name: 'Crystal Bat', nameEs: 'Murciélago Cristal', spriteKey: 'bat', hostile: true, hp: 25, attack: 8, defense: 3, speed: 10, expReward: 20 },
  golem: { id: 'golem', name: 'Rock Golem', nameEs: 'Golem de Roca', spriteKey: 'golem', hostile: true, hp: 80, attack: 15, defense: 12, speed: 2, expReward: 60 },
  sprite: { id: 'sprite', name: 'Dark Sprite', nameEs: 'Hada Oscura', spriteKey: 'sprite', hostile: true, hp: 30, attack: 10, defense: 4, speed: 9, expReward: 25 },
  mushroom: { id: 'mushroom', name: 'Mushroom Beast', nameEs: 'Bestia Hongo', spriteKey: 'mushroom', hostile: true, hp: 35, attack: 7, defense: 6, speed: 4, expReward: 28 },
  ghost: { id: 'ghost', name: 'Wandering Ghost', nameEs: 'Fantasma Errante', spriteKey: 'ghost', hostile: true, hp: 40, attack: 9, defense: 2, speed: 7, expReward: 32 },
  rabbit: { id: 'rabbit', name: 'Forest Rabbit', nameEs: 'Conejo del Bosque', spriteKey: 'rabbit', hostile: false, hp: 10, attack: 0, defense: 0, speed: 12, expReward: 0 },
  deer: { id: 'deer', name: 'Gentle Deer', nameEs: 'Ciervo Gentil', spriteKey: 'deer', hostile: false, hp: 15, attack: 0, defense: 0, speed: 10, expReward: 0 },
  bird: { id: 'bird', name: 'Blue Bird', nameEs: 'Pájaro Azul', spriteKey: 'bird', hostile: false, hp: 8, attack: 0, defense: 0, speed: 15, expReward: 0 },
  memory_wraith: { id: 'memory_wraith', name: 'Memory Wraith', nameEs: 'Espectro de Memoria', spriteKey: 'memory_wraith', hostile: true, hp: 150, attack: 18, defense: 10, speed: 9, expReward: 120 },
  void_guardian: { id: 'void_guardian', name: 'Void Guardian', nameEs: 'Guardián del Vacío', spriteKey: 'void_guardian', hostile: true, hp: 250, attack: 25, defense: 18, speed: 5, expReward: 250 },
};

export const generateMapMonsters = (
  mapId: string,
  mapWidth: number,
  mapHeight: number,
  possibleMonsters: string[],
  count: number,
  occupiedTiles: Set<string>
): Array<{ id: string; monsterId: string; position: Position; sprite: string[][] }> => {
  const monsters: Array<{ id: string; monsterId: string; position: Position; sprite: string[][] }> = [];
  
  // Safety check for empty or invalid data
  if (!possibleMonsters || possibleMonsters.length === 0) return monsters;

  for (let i = 0; i < count; i++) {
    const monsterId = possibleMonsters[Math.floor(Math.random() * possibleMonsters.length)];
    const definition = monsterDefinitions[monsterId];
    if (!definition) continue;
    
    // Find a valid position
    let attempts = 0;
    let x: number, y: number;
    let isValid = false;

    // Retry loop to find empty spot
    do {
      x = Math.floor(Math.random() * (mapWidth - 4)) + 2;
      y = Math.floor(Math.random() * (mapHeight - 4)) + 2;
      const key = `${x},${y}`;
      if (!occupiedTiles.has(key)) {
        isValid = true;
        occupiedTiles.add(key);
      }
      attempts++;
    } while (!isValid && attempts < 50);
    
    if (isValid) {
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