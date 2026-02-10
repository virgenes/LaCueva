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
      id: 'burn', name: 'Burn', nameEs: 'Quemadura',
      type: 'burn', duration: 3, power: 5, icon: '🔥',
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
      id: 'attack_up', name: 'Attack Up', nameEs: 'Ataque Aumentado',
      type: 'buff', duration: 3, power: 25, icon: '⚔️',
    },
  },
  // === ENEMY-SPECIFIC SKILLS ===
  poison_bite: {
    id: 'poison_bite',
    name: 'Poison Bite',
    nameEs: 'Mordida Venenosa',
    description: 'A venomous bite that poisons the target.',
    descriptionEs: 'Una mordida venenosa que envenena al objetivo.',
    type: 'attack',
    power: 12,
    cost: 0,
    cooldown: 2,
    animation: 'bite',
    targetType: 'single',
    statusEffect: {
      id: 'poison', name: 'Poison', nameEs: 'Veneno',
      type: 'poison', duration: 4, power: 4, icon: '☠️',
    },
  },
  howl: {
    id: 'howl',
    name: 'Howl',
    nameEs: 'Aullido',
    description: 'Terrifying howl that boosts attack.',
    descriptionEs: 'Aullido aterrador que aumenta el ataque.',
    type: 'buff',
    power: 20,
    cost: 0,
    cooldown: 3,
    animation: 'howl',
    targetType: 'self',
    statusEffect: {
      id: 'attack_up', name: 'Attack Up', nameEs: 'Ataque Aumentado',
      type: 'buff', duration: 3, power: 20, icon: '🐺',
    },
  },
  sonic_wave: {
    id: 'sonic_wave',
    name: 'Sonic Wave',
    nameEs: 'Onda Sónica',
    description: 'Emit a disorienting sound wave.',
    descriptionEs: 'Emite una onda de sonido desorientadora.',
    type: 'magic',
    power: 15,
    cost: 0,
    cooldown: 1,
    animation: 'wave',
    targetType: 'all',
    statusEffect: {
      id: 'stun', name: 'Stunned', nameEs: 'Aturdido',
      type: 'stun', duration: 1, power: 0, icon: '💫',
    },
  },
  rock_smash: {
    id: 'rock_smash',
    name: 'Rock Smash',
    nameEs: 'Rompe Rocas',
    description: 'A devastating stone fist attack.',
    descriptionEs: 'Un devastador puñetazo de piedra.',
    type: 'attack',
    power: 30,
    cost: 0,
    cooldown: 2,
    animation: 'smash',
    targetType: 'single',
  },
  stone_wall: {
    id: 'stone_wall',
    name: 'Stone Wall',
    nameEs: 'Muro de Piedra',
    description: 'Raise defense significantly.',
    descriptionEs: 'Aumenta la defensa significativamente.',
    type: 'buff',
    power: 40,
    cost: 0,
    cooldown: 3,
    animation: 'shield',
    targetType: 'self',
    statusEffect: {
      id: 'defense_up', name: 'Defense Up', nameEs: 'Defensa Aumentada',
      type: 'buff', duration: 3, power: 40, icon: '🛡️',
    },
  },
  spore_cloud: {
    id: 'spore_cloud',
    name: 'Spore Cloud',
    nameEs: 'Nube de Esporas',
    description: 'Release poisonous spores on all enemies.',
    descriptionEs: 'Libera esporas venenosas sobre todos.',
    type: 'magic',
    power: 8,
    cost: 0,
    cooldown: 2,
    animation: 'cloud',
    targetType: 'all',
    statusEffect: {
      id: 'poison', name: 'Poison', nameEs: 'Veneno',
      type: 'poison', duration: 3, power: 3, icon: '🍄',
    },
  },
  soul_drain: {
    id: 'soul_drain',
    name: 'Soul Drain',
    nameEs: 'Drenar Alma',
    description: 'Drain HP from the target.',
    descriptionEs: 'Drena HP del objetivo.',
    type: 'magic',
    power: 20,
    cost: 0,
    cooldown: 1,
    animation: 'drain',
    targetType: 'single',
  },
  // === BOSS SKILLS ===
  memory_shatter: {
    id: 'memory_shatter',
    name: 'Memory Shatter',
    nameEs: 'Fragmentar Memoria',
    description: 'A psychic blast that damages all party members.',
    descriptionEs: 'Un estallido psíquico que daña a todo el grupo.',
    type: 'magic',
    power: 18,
    cost: 0,
    cooldown: 2,
    animation: 'psychic',
    targetType: 'all',
    statusEffect: {
      id: 'debuff_def', name: 'Weakened', nameEs: 'Debilitado',
      type: 'debuff', duration: 2, power: 10, icon: '💀',
    },
  },
  void_blast: {
    id: 'void_blast',
    name: 'Void Blast',
    nameEs: 'Explosión del Vacío',
    description: 'Channel the power of the void for massive damage.',
    descriptionEs: 'Canaliza el poder del vacío para daño masivo.',
    type: 'magic',
    power: 40,
    cost: 0,
    cooldown: 3,
    animation: 'void',
    targetType: 'single',
  },
  dark_shield: {
    id: 'dark_shield',
    name: 'Dark Shield',
    nameEs: 'Escudo Oscuro',
    description: 'Surround yourself with dark energy.',
    descriptionEs: 'Rodéate de energía oscura.',
    type: 'buff',
    power: 50,
    cost: 0,
    cooldown: 4,
    animation: 'dark_shield',
    targetType: 'self',
    statusEffect: {
      id: 'defense_up', name: 'Dark Shield', nameEs: 'Escudo Oscuro',
      type: 'buff', duration: 2, power: 50, icon: '🌑',
    },
  },
  life_drain: {
    id: 'life_drain',
    name: 'Life Drain',
    nameEs: 'Drenar Vida',
    description: 'Steal life force from target, healing self.',
    descriptionEs: 'Roba fuerza vital del objetivo, curándote.',
    type: 'magic',
    power: 25,
    cost: 0,
    cooldown: 2,
    animation: 'drain',
    targetType: 'single',
  },
};

// Default enemies - matching map monsters
export const defaultEnemies: Record<string, Enemy> = {
  // === SLIMES ===
  slime: {
    id: 'slime',
    name: 'Green Slime',
    nameEs: 'Slime Verde',
    sprite: [
      ['transparent', 'transparent', '#4ade80', '#4ade80', '#4ade80', '#4ade80', 'transparent', 'transparent'],
      ['transparent', '#4ade80', '#86efac', '#86efac', '#86efac', '#86efac', '#4ade80', 'transparent'],
      ['#4ade80', '#86efac', '#1a1a2e', '#86efac', '#86efac', '#1a1a2e', '#86efac', '#4ade80'],
      ['#4ade80', '#86efac', '#86efac', '#86efac', '#86efac', '#86efac', '#86efac', '#4ade80'],
      ['#4ade80', '#86efac', '#86efac', '#86efac', '#86efac', '#86efac', '#86efac', '#4ade80'],
      ['#22c55e', '#4ade80', '#86efac', '#86efac', '#86efac', '#86efac', '#4ade80', '#22c55e'],
      ['transparent', '#22c55e', '#4ade80', '#4ade80', '#4ade80', '#4ade80', '#22c55e', 'transparent'],
      ['transparent', 'transparent', '#22c55e', '#22c55e', '#22c55e', '#22c55e', 'transparent', 'transparent'],
    ],
    stats: { hp: 20, maxHp: 20, attack: 5, defense: 2, speed: 3, magic: 2 },
    skills: ['basic_attack', 'poison_bite'],
    drops: [{ itemId: 'slime_gel', chance: 0.4 }],
    exp: 10,
    gold: 3,
    ai: 'random',
  },
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
    skills: ['basic_attack', 'soul_drain'],
    drops: [{ itemId: 'slime_essence', chance: 0.3 }],
    exp: 15,
    gold: 5,
    ai: 'random',
  },

  // === FOREST CREATURES ===
  wolf: {
    id: 'wolf',
    name: 'Shadow Wolf',
    nameEs: 'Lobo Sombra',
    sprite: [
      ['transparent', '#9ca3af', 'transparent', 'transparent', 'transparent', 'transparent', '#9ca3af', 'transparent'],
      ['transparent', '#6b7280', '#6b7280', '#6b7280', '#6b7280', '#6b7280', '#6b7280', 'transparent'],
      ['#6b7280', '#ef4444', '#6b7280', '#6b7280', '#6b7280', '#ef4444', '#6b7280', '#6b7280'],
      ['#6b7280', '#6b7280', '#6b7280', '#1f2937', '#6b7280', '#6b7280', '#6b7280', '#6b7280'],
      ['transparent', '#4b5563', '#6b7280', '#6b7280', '#6b7280', '#6b7280', '#4b5563', 'transparent'],
      ['transparent', '#6b7280', '#6b7280', '#4b5563', '#4b5563', '#6b7280', '#6b7280', 'transparent'],
      ['transparent', '#6b7280', 'transparent', '#6b7280', '#6b7280', 'transparent', '#6b7280', 'transparent'],
      ['transparent', '#4b5563', 'transparent', '#4b5563', '#4b5563', 'transparent', '#4b5563', 'transparent'],
    ],
    stats: { hp: 45, maxHp: 45, attack: 12, defense: 5, speed: 8, magic: 3 },
    skills: ['basic_attack', 'howl', 'poison_bite'],
    drops: [{ itemId: 'wolf_fang', chance: 0.25 }],
    exp: 35,
    gold: 12,
    ai: 'aggressive',
  },
  sprite: {
    id: 'sprite',
    name: 'Dark Sprite',
    nameEs: 'Hada Oscura',
    sprite: [
      ['transparent', 'transparent', '#a855f7', '#e9d5ff', '#e9d5ff', '#a855f7', 'transparent', 'transparent'],
      ['transparent', '#a855f7', '#c084fc', '#e9d5ff', '#e9d5ff', '#c084fc', '#a855f7', 'transparent'],
      ['#e9d5ff', '#c084fc', '#1e1b4b', '#c084fc', '#c084fc', '#1e1b4b', '#c084fc', '#e9d5ff'],
      ['transparent', '#c084fc', '#c084fc', '#e9d5ff', '#e9d5ff', '#c084fc', '#c084fc', 'transparent'],
      ['transparent', 'transparent', '#a855f7', '#c084fc', '#c084fc', '#a855f7', 'transparent', 'transparent'],
      ['transparent', 'transparent', 'transparent', '#a855f7', '#a855f7', 'transparent', 'transparent', 'transparent'],
      ['transparent', 'transparent', 'transparent', 'transparent', 'transparent', 'transparent', 'transparent', 'transparent'],
      ['transparent', 'transparent', 'transparent', 'transparent', 'transparent', 'transparent', 'transparent', 'transparent'],
    ],
    stats: { hp: 30, maxHp: 30, attack: 8, defense: 4, speed: 10, magic: 15 },
    skills: ['basic_attack', 'fire_bolt', 'soul_drain'],
    drops: [{ itemId: 'fairy_dust', chance: 0.3 }],
    exp: 28,
    gold: 10,
    ai: 'smart',
  },
  mushroom: {
    id: 'mushroom',
    name: 'Mushroom Beast',
    nameEs: 'Bestia Hongo',
    sprite: [
      ['transparent', 'transparent', '#dc2626', '#dc2626', '#dc2626', '#dc2626', 'transparent', 'transparent'],
      ['transparent', '#dc2626', '#fef3c7', '#dc2626', '#dc2626', '#fef3c7', '#dc2626', 'transparent'],
      ['#dc2626', '#dc2626', '#dc2626', '#dc2626', '#dc2626', '#dc2626', '#dc2626', '#dc2626'],
      ['transparent', 'transparent', '#fef3c7', '#fef3c7', '#fef3c7', '#fef3c7', 'transparent', 'transparent'],
      ['transparent', 'transparent', '#1c1917', '#fef3c7', '#fef3c7', '#1c1917', 'transparent', 'transparent'],
      ['transparent', 'transparent', '#fef3c7', '#fef3c7', '#fef3c7', '#fef3c7', 'transparent', 'transparent'],
      ['transparent', 'transparent', 'transparent', '#fef3c7', '#fef3c7', 'transparent', 'transparent', 'transparent'],
      ['transparent', 'transparent', 'transparent', 'transparent', 'transparent', 'transparent', 'transparent', 'transparent'],
    ],
    stats: { hp: 35, maxHp: 35, attack: 7, defense: 6, speed: 4, magic: 8 },
    skills: ['basic_attack', 'spore_cloud'],
    drops: [{ itemId: 'spore_cloud', chance: 0.35 }],
    exp: 25,
    gold: 8,
    ai: 'defensive',
  },

  // === CAVE CREATURES ===
  bat: {
    id: 'bat',
    name: 'Crystal Bat',
    nameEs: 'Murciélago Cristal',
    sprite: [
      ['#7c3aed', 'transparent', 'transparent', 'transparent', 'transparent', 'transparent', 'transparent', '#7c3aed'],
      ['#581c87', '#7c3aed', 'transparent', '#3b0764', '#3b0764', 'transparent', '#7c3aed', '#581c87'],
      ['transparent', '#581c87', '#3b0764', '#fbbf24', '#fbbf24', '#3b0764', '#581c87', 'transparent'],
      ['transparent', 'transparent', '#3b0764', '#3b0764', '#3b0764', '#3b0764', 'transparent', 'transparent'],
      ['transparent', 'transparent', 'transparent', '#3b0764', '#3b0764', 'transparent', 'transparent', 'transparent'],
      ['transparent', 'transparent', 'transparent', 'transparent', 'transparent', 'transparent', 'transparent', 'transparent'],
      ['transparent', 'transparent', 'transparent', 'transparent', 'transparent', 'transparent', 'transparent', 'transparent'],
      ['transparent', 'transparent', 'transparent', 'transparent', 'transparent', 'transparent', 'transparent', 'transparent'],
    ],
    stats: { hp: 25, maxHp: 25, attack: 8, defense: 3, speed: 12, magic: 6 },
    skills: ['basic_attack', 'sonic_wave'],
    drops: [{ itemId: 'bat_wing', chance: 0.4 }],
    exp: 20,
    gold: 7,
    ai: 'aggressive',
  },
  golem: {
    id: 'golem',
    name: 'Rock Golem',
    nameEs: 'Golem de Roca',
    sprite: [
      ['transparent', '#78716c', '#78716c', '#78716c', '#78716c', '#78716c', '#78716c', 'transparent'],
      ['#78716c', '#fbbf24', '#a8a29e', '#22d3ee', '#22d3ee', '#a8a29e', '#fbbf24', '#78716c'],
      ['#78716c', '#78716c', '#78716c', '#78716c', '#78716c', '#78716c', '#78716c', '#78716c'],
      ['#57534e', '#78716c', '#78716c', '#78716c', '#78716c', '#78716c', '#78716c', '#57534e'],
      ['transparent', '#78716c', '#78716c', '#57534e', '#57534e', '#78716c', '#78716c', 'transparent'],
      ['transparent', '#78716c', 'transparent', '#78716c', '#78716c', 'transparent', '#78716c', 'transparent'],
      ['transparent', '#57534e', 'transparent', '#57534e', '#57534e', 'transparent', '#57534e', 'transparent'],
      ['transparent', 'transparent', 'transparent', 'transparent', 'transparent', 'transparent', 'transparent', 'transparent'],
    ],
    stats: { hp: 80, maxHp: 80, attack: 15, defense: 12, speed: 2, magic: 5 },
    skills: ['basic_attack', 'rock_smash', 'stone_wall', 'defend'],
    drops: [{ itemId: 'stone_heart', chance: 0.2 }],
    exp: 60,
    gold: 25,
    ai: 'defensive',
  },
  ghost: {
    id: 'ghost',
    name: 'Wandering Ghost',
    nameEs: 'Fantasma Errante',
    sprite: [
      ['transparent', 'transparent', '#e0e7ff', '#f8fafc', '#f8fafc', '#e0e7ff', 'transparent', 'transparent'],
      ['transparent', '#e0e7ff', '#f8fafc', '#f8fafc', '#f8fafc', '#f8fafc', '#e0e7ff', 'transparent'],
      ['#e0e7ff', '#f8fafc', '#312e81', '#f8fafc', '#f8fafc', '#312e81', '#f8fafc', '#e0e7ff'],
      ['#e0e7ff', '#f8fafc', '#f8fafc', '#f8fafc', '#f8fafc', '#f8fafc', '#f8fafc', '#e0e7ff'],
      ['#e0e7ff', '#f8fafc', '#f8fafc', '#e0e7ff', '#e0e7ff', '#f8fafc', '#f8fafc', '#e0e7ff'],
      ['transparent', '#e0e7ff', '#f8fafc', '#f8fafc', '#f8fafc', '#f8fafc', '#e0e7ff', 'transparent'],
      ['transparent', '#e0e7ff', 'transparent', '#e0e7ff', '#e0e7ff', 'transparent', '#e0e7ff', 'transparent'],
      ['transparent', 'transparent', 'transparent', 'transparent', 'transparent', 'transparent', 'transparent', 'transparent'],
    ],
    stats: { hp: 40, maxHp: 40, attack: 10, defense: 2, speed: 8, magic: 12 },
    skills: ['basic_attack', 'soul_drain', 'fire_bolt'],
    drops: [{ itemId: 'ectoplasm', chance: 0.3 }],
    exp: 35,
    gold: 15,
    ai: 'smart',
  },

  // === BOSSES ===
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
    stats: { hp: 150, maxHp: 150, attack: 18, defense: 10, speed: 9, magic: 22 },
    skills: ['basic_attack', 'memory_shatter', 'life_drain', 'soul_drain'],
    drops: [{ itemId: 'memory_fragment', chance: 0.8 }],
    exp: 120,
    gold: 80,
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
    stats: { hp: 250, maxHp: 250, attack: 25, defense: 18, speed: 5, magic: 28 },
    skills: ['basic_attack', 'void_blast', 'dark_shield', 'thunder_strike', 'memory_shatter'],
    drops: [{ itemId: 'void_crystal', chance: 1.0 }],
    exp: 250,
    gold: 150,
    ai: 'smart',
  },
};
