// Combat system types

export interface CombatStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  magic: number;
}

export interface Skill {
  id: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  type: 'attack' | 'magic' | 'heal' | 'buff' | 'debuff';
  power: number;
  cost: number; // MP or special resource
  cooldown: number; // Turns before can use again
  animation: string;
  targetType: 'single' | 'all' | 'self';
  statusEffect?: StatusEffect;
}

export interface StatusEffect {
  id: string;
  name: string;
  nameEs: string;
  type: 'poison' | 'burn' | 'freeze' | 'stun' | 'buff' | 'debuff';
  duration: number; // Turns
  power: number;
  icon: string;
}

export interface CombatAction {
  type: 'attack' | 'skill' | 'item' | 'defend' | 'flee';
  actorId: string;
  targetId?: string;
  skillId?: string;
  itemId?: string;
}

export interface TimelineEntry {
  characterId: string;
  name: string;
  isPlayer: boolean;
  turnOrder: number;
  currentPosition: number; // 0-100 on timeline
  icon: string[][];
  statusEffects: StatusEffect[];
}

export interface CombatState {
  isActive: boolean;
  turn: number;
  phase: 'start' | 'player_select' | 'enemy_select' | 'action' | 'result' | 'victory' | 'defeat';
  timeline: TimelineEntry[];
  currentActorIndex: number;
  playerParty: CombatCharacter[];
  enemyParty: CombatCharacter[];
  selectedAction: CombatAction | null;
  combatLog: CombatLogEntry[];
  animations: CombatAnimation[];
}

export interface CombatCharacter {
  id: string;
  name: string;
  nameEs: string;
  stats: CombatStats;
  skills: Skill[];
  sprite: string[][];
  position: { x: number; y: number };
  statusEffects: StatusEffect[];
  isDefending: boolean;
}

export interface CombatLogEntry {
  turn: number;
  actorName: string;
  action: string;
  target?: string;
  damage?: number;
  heal?: number;
  effect?: string;
  timestamp: number;
}

export interface CombatAnimation {
  id: string;
  type: 'attack' | 'damage' | 'heal' | 'effect' | 'death';
  targetId: string;
  duration: number;
  startTime: number;
  data: any;
}

export interface Enemy {
  id: string;
  name: string;
  nameEs: string;
  sprite: string[][];
  stats: CombatStats;
  skills: string[];
  drops: { itemId: string; chance: number }[];
  exp: number;
  gold: number;
  ai: 'aggressive' | 'defensive' | 'random' | 'smart';
}

// Default skills
export const defaultSkills: Record<string, Skill> = {
  basic_attack: {
    id: 'basic_attack',
    name: 'Attack',
    nameEs: 'Atacar',
    description: 'A basic physical attack.',
    descriptionEs: 'Un ataque físico básico.',
    type: 'attack',
    power: 10,
    cost: 0,
    cooldown: 0,
    animation: 'slash',
    targetType: 'single',
  },
  defend: {
    id: 'defend',
    name: 'Defend',
    nameEs: 'Defender',
    description: 'Reduce damage taken this turn.',
    descriptionEs: 'Reduce el daño recibido este turno.',
    type: 'buff',
    power: 0,
    cost: 0,
    cooldown: 0,
    animation: 'shield',
    targetType: 'self',
  },
  fire_bolt: {
    id: 'fire_bolt',
    name: 'Fire Bolt',
    nameEs: 'Rayo de Fuego',
    description: 'Launch a bolt of fire at the enemy.',
    descriptionEs: 'Lanza un rayo de fuego al enemigo.',
    type: 'magic',
    power: 25,
    cost: 10,
    cooldown: 0,
    animation: 'fire',
    targetType: 'single',
    statusEffect: {
      id: 'burn',
      name: 'Burn',
      nameEs: 'Quemadura',
      type: 'burn',
      duration: 3,
      power: 5,
      icon: '🔥',
    },
  },
  heal: {
    id: 'heal',
    name: 'Heal',
    nameEs: 'Curar',
    description: 'Restore HP to an ally.',
    descriptionEs: 'Restaura HP a un aliado.',
    type: 'heal',
    power: 30,
    cost: 15,
    cooldown: 1,
    animation: 'heal',
    targetType: 'single',
  },
  thunder_strike: {
    id: 'thunder_strike',
    name: 'Thunder Strike',
    nameEs: 'Golpe de Trueno',
    description: 'Call down lightning on all enemies.',
    descriptionEs: 'Invoca rayos sobre todos los enemigos.',
    type: 'magic',
    power: 20,
    cost: 25,
    cooldown: 2,
    animation: 'lightning',
    targetType: 'all',
  },
  focus: {
    id: 'focus',
    name: 'Focus',
    nameEs: 'Concentración',
    description: 'Increase your attack for 3 turns.',
    descriptionEs: 'Aumenta tu ataque por 3 turnos.',
    type: 'buff',
    power: 25,
    cost: 10,
    cooldown: 3,
    animation: 'buff',
    targetType: 'self',
    statusEffect: {
      id: 'attack_up',
      name: 'Attack Up',
      nameEs: 'Ataque Aumentado',
      type: 'buff',
      duration: 3,
      power: 25,
      icon: '⚔️',
    },
  },
};

// Default enemies
export const defaultEnemies: Record<string, Enemy> = {
  shadow_slime: {
    id: 'shadow_slime',
    name: 'Shadow Slime',
    nameEs: 'Slime Sombrío',
    sprite: [
      ['transparent', 'transparent', '#2a2a4a', '#2a2a4a', '#2a2a4a', '#2a2a4a', 'transparent', 'transparent'],
      ['transparent', '#2a2a4a', '#3a3a6a', '#3a3a6a', '#3a3a6a', '#3a3a6a', '#2a2a4a', 'transparent'],
      ['#2a2a4a', '#3a3a6a', '#ff0000', '#3a3a6a', '#3a3a6a', '#ff0000', '#3a3a6a', '#2a2a4a'],
      ['#2a2a4a', '#3a3a6a', '#3a3a6a', '#3a3a6a', '#3a3a6a', '#3a3a6a', '#3a3a6a', '#2a2a4a'],
      ['#2a2a4a', '#3a3a6a', '#3a3a6a', '#3a3a6a', '#3a3a6a', '#3a3a6a', '#3a3a6a', '#2a2a4a'],
      ['#2a2a4a', '#3a3a6a', '#3a3a6a', '#3a3a6a', '#3a3a6a', '#3a3a6a', '#3a3a6a', '#2a2a4a'],
      ['transparent', '#2a2a4a', '#3a3a6a', '#3a3a6a', '#3a3a6a', '#3a3a6a', '#2a2a4a', 'transparent'],
      ['transparent', 'transparent', '#2a2a4a', '#2a2a4a', '#2a2a4a', '#2a2a4a', 'transparent', 'transparent'],
    ],
    stats: { hp: 30, maxHp: 30, attack: 8, defense: 3, speed: 4, magic: 5 },
    skills: ['basic_attack'],
    drops: [{ itemId: 'slime_essence', chance: 0.3 }],
    exp: 10,
    gold: 5,
    ai: 'random',
  },
  memory_wraith: {
    id: 'memory_wraith',
    name: 'Memory Wraith',
    nameEs: 'Espectro de Memoria',
    sprite: [
      ['transparent', '#4a2a6a', '#4a2a6a', 'transparent', 'transparent', '#4a2a6a', '#4a2a6a', 'transparent'],
      ['#4a2a6a', '#6a4a8a', '#6a4a8a', '#4a2a6a', '#4a2a6a', '#6a4a8a', '#6a4a8a', '#4a2a6a'],
      ['#4a2a6a', '#00ffff', '#6a4a8a', '#6a4a8a', '#6a4a8a', '#6a4a8a', '#00ffff', '#4a2a6a'],
      ['transparent', '#4a2a6a', '#6a4a8a', '#6a4a8a', '#6a4a8a', '#6a4a8a', '#4a2a6a', 'transparent'],
      ['transparent', '#4a2a6a', '#6a4a8a', '#6a4a8a', '#6a4a8a', '#6a4a8a', '#4a2a6a', 'transparent'],
      ['#4a2a6a', '#6a4a8a', 'transparent', '#6a4a8a', '#6a4a8a', 'transparent', '#6a4a8a', '#4a2a6a'],
      ['transparent', '#4a2a6a', 'transparent', 'transparent', 'transparent', 'transparent', '#4a2a6a', 'transparent'],
      ['transparent', 'transparent', '#4a2a6a', 'transparent', 'transparent', '#4a2a6a', 'transparent', 'transparent'],
    ],
    stats: { hp: 50, maxHp: 50, attack: 12, defense: 5, speed: 7, magic: 15 },
    skills: ['basic_attack', 'fire_bolt'],
    drops: [{ itemId: 'memory_fragment', chance: 0.2 }],
    exp: 25,
    gold: 15,
    ai: 'smart',
  },
  void_guardian: {
    id: 'void_guardian',
    name: 'Void Guardian',
    nameEs: 'Guardián del Vacío',
    sprite: [
      ['#1a1a2e', '#1a1a2e', '#1a1a2e', '#ff00ff', '#ff00ff', '#1a1a2e', '#1a1a2e', '#1a1a2e'],
      ['#1a1a2e', '#2a2a4e', '#2a2a4e', '#ff00ff', '#ff00ff', '#2a2a4e', '#2a2a4e', '#1a1a2e'],
      ['#2a2a4e', '#3a3a6e', '#ff0000', '#3a3a6e', '#3a3a6e', '#ff0000', '#3a3a6e', '#2a2a4e'],
      ['#2a2a4e', '#3a3a6e', '#3a3a6e', '#3a3a6e', '#3a3a6e', '#3a3a6e', '#3a3a6e', '#2a2a4e'],
      ['#3a3a6e', '#3a3a6e', '#3a3a6e', '#3a3a6e', '#3a3a6e', '#3a3a6e', '#3a3a6e', '#3a3a6e'],
      ['#2a2a4e', '#3a3a6e', '#3a3a6e', '#3a3a6e', '#3a3a6e', '#3a3a6e', '#3a3a6e', '#2a2a4e'],
      ['#1a1a2e', '#2a2a4e', '#3a3a6e', '#3a3a6e', '#3a3a6e', '#3a3a6e', '#2a2a4e', '#1a1a2e'],
      ['#1a1a2e', '#1a1a2e', '#2a2a4e', '#2a2a4e', '#2a2a4e', '#2a2a4e', '#1a1a2e', '#1a1a2e'],
    ],
    stats: { hp: 100, maxHp: 100, attack: 20, defense: 15, speed: 3, magic: 25 },
    skills: ['basic_attack', 'thunder_strike'],
    drops: [{ itemId: 'void_crystal', chance: 0.5 }],
    exp: 50,
    gold: 30,
    ai: 'defensive',
  },
};
