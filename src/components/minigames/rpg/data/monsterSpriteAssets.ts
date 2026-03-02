// Monster sprite sheet assets — maps monster IDs to imported PNG sprites
// Each sprite sheet has different animation states (idle, attack, die) at different positions

import HadaOscura from '@/assets/rpg/monsters/Hada_Oscura.png';
import LoboOscuro from '@/assets/rpg/monsters/Lobo_Oscuro.png';
import MurcielagoCristal from '@/assets/rpg/monsters/Murcielago_Cristal.png';
import SlimeVerde from '@/assets/rpg/monsters/Slime_Verde.png';
import BestiaHongo from '@/assets/rpg/monsters/Bestia_Hongo.png';
import FantasmaErrante from '@/assets/rpg/monsters/Fantasma_Errante.png';
import GolemRoca from '@/assets/rpg/monsters/Golem_Roca.png';

export type MonsterAnimState = 'idle' | 'attack' | 'die';

export interface MonsterSpriteAsset {
  src: string;
  frameWidth: number;
  frameHeight: number;
  animations: Record<MonsterAnimState, { row: number; col: number; frames?: number }>;
}

// Sprite sheet configurations based on the uploaded images
// Each image has different layouts, so we configure them individually

const monsterSpriteAssets: Record<string, MonsterSpriteAsset> = {
  // Hada Oscura: Row 0 = Descanso (6 frames), Row 1 = Atacar (2 frames), Row 2 = Morir (6 frames)
  sprite: {
    src: HadaOscura,
    frameWidth: 96,
    frameHeight: 96,
    animations: {
      idle: { row: 0, col: 0, frames: 6 },
      attack: { row: 1, col: 0, frames: 2 },
      die: { row: 2, col: 0, frames: 6 },
    },
  },

  // Lobo Oscuro: Row 0 = Idle (4 frames), Row 1 = Attack (3 frames), Row 2 = Die (3 frames)
  wolf: {
    src: LoboOscuro,
    frameWidth: 100,
    frameHeight: 100,
    animations: {
      idle: { row: 0, col: 0, frames: 4 },
      attack: { row: 1, col: 0, frames: 3 },
      die: { row: 2, col: 0, frames: 3 },
    },
  },

  // Murciélago Cristal: Row 0 = Rest (2), Row 1 = Attack (2), Row 2 = Die (3)
  bat: {
    src: MurcielagoCristal,
    frameWidth: 80,
    frameHeight: 60,
    animations: {
      idle: { row: 0, col: 0, frames: 2 },
      attack: { row: 1, col: 0, frames: 2 },
      die: { row: 2, col: 0, frames: 3 },
    },
  },

  // Slime Verde: Row 0 = Rest (3), Row 1 = Attack (3), Row 2 = Die (2)
  slime: {
    src: SlimeVerde,
    frameWidth: 96,
    frameHeight: 96,
    animations: {
      idle: { row: 0, col: 0, frames: 3 },
      attack: { row: 1, col: 0, frames: 3 },
      die: { row: 2, col: 0, frames: 2 },
    },
  },

  // Bestia Hongo: Row 0 = Idle (5), Row 1 = Walking (6), Row 2 = Attacking (6), Row 3 = Dying (3)
  mushroom: {
    src: BestiaHongo,
    frameWidth: 80,
    frameHeight: 80,
    animations: {
      idle: { row: 0, col: 0, frames: 5 },
      attack: { row: 2, col: 0, frames: 6 },
      die: { row: 3, col: 0, frames: 3 },
    },
  },

  // Fantasma Errante: Row 0 = 3 states (Descanso, Atacar, Morir) side by side
  // Row 1 = additional idle frames
  ghost: {
    src: FantasmaErrante,
    frameWidth: 80,
    frameHeight: 80,
    animations: {
      idle: { row: 1, col: 0, frames: 3 },
      attack: { row: 0, col: 1, frames: 1 },
      die: { row: 0, col: 2, frames: 2 },
    },
  },

  // Golem de Roca: Row 0 = Idle (3), Row 1-2 = Walking (8 total), Row 3 = Attacking (4)
  golem: {
    src: GolemRoca,
    frameWidth: 70,
    frameHeight: 70,
    animations: {
      idle: { row: 0, col: 0, frames: 3 },
      attack: { row: 3, col: 0, frames: 4 },
      die: { row: 0, col: 2, frames: 1 }, // No die animation, use last idle
    },
  },
};

export function getMonsterSpriteAsset(monsterId: string): MonsterSpriteAsset | null {
  return monsterSpriteAssets[monsterId] || null;
}
