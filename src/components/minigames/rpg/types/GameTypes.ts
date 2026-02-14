// RPG Game Core Types - Fully moddable structure

export interface Position {
  x: number;
  y: number;
}

export interface Sprite {
  id: string;
  name: string;
  frames: string[][][]; // Array of frames, each frame is 2D array of pixel rows (CSS colors)
  width: number;
  height: number;
  animationSpeed: number; // ms per frame
}

export interface Character {
  id: string;
  name: string;
  nameEs: string;
  spriteId: string;
  position: Position;
  direction: 'up' | 'down' | 'left' | 'right';
  isPlayer: boolean;
  dialogueIds: string[];
  stats: CharacterStats;
  skillIds?: string[]; // Skill IDs this character knows
}

export interface CharacterStats {
  hp: number;
  maxHp: number;
  speed: number;
  attack: number;
  defense: number;
  magic: number;
  level: number;
  exp: number;
  expToNext: number;
}

export interface Dialogue {
  id: string;
  speakerId: string;
  lines: DialogueLine[];
  choices?: DialogueChoice[];
  nextDialogueId?: string;
  condition?: string; // Simple flag check like "has_key"
  setFlag?: string; // Flag to set when dialogue ends
}

export interface DialogueLine {
  text: string;
  textEs: string;
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised';
  delay?: number; // Typing delay in ms
}

export interface DialogueChoice {
  text: string;
  textEs: string;
  nextDialogueId: string;
  setFlag?: string;
}

export interface Tile {
  id: string;
  sprite: string[][]; // 32x32 pixel art as CSS colors
  solid: boolean;
  interactable: boolean;
  interactionType?: 'dialogue' | 'item' | 'teleport' | 'event';
  interactionData?: string;
}

export interface MapLayer {
  name: string;
  tiles: (string | null)[][]; // Grid of tile IDs
}

export interface GameMap {
  id: string;
  name: string;
  nameEs: string;
  width: number; // In tiles
  height: number; // In tiles
  layers: MapLayer[];
  npcs: string[]; // Character IDs
  spawnPoint: Position;
  music?: string;
  ambience?: string;
  ambientTrack?: string;
  encounterRate?: number; // Chance of random encounter per step (0-1)
  possibleEncounters?: string[]; // Monster IDs from monsterRegistry
  events?: string[];
}

export interface GameState {
  currentMapId: string;
  playerPosition: Position;
  playerDirection: 'up' | 'down' | 'left' | 'right';
  flags: Record<string, boolean>;
  inventory: InventoryEntry[];
  dialogueHistory: string[];
  playtime: number; // In seconds
  savedAt: number; // Timestamp
  characterLevels: Record<string, { level: number; exp: number }>; // persistent level data
  gold: number;
}

export interface InventoryEntry {
  itemId: string;
  quantity: number;
}

export interface GameData {
  version: string;
  title: string;
  titleEs: string;
  author: string;
  sprites: Record<string, Sprite>;
  characters: Record<string, Character>;
  dialogues: Record<string, Dialogue>;
  tiles: Record<string, Tile>;
  maps: Record<string, GameMap>;
  items: Record<string, GameItem>;
  config: GameConfig;
}

export interface GameItem {
  id: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  spriteId: string;
  usable: boolean;
  useEffect?: string;
}

export interface GameConfig {
  tileSize: number;
  playerSpeed: number;
  dialogueSpeed: number;
  showFps: boolean;
  musicVolume: number;
  sfxVolume: number;
}

// Mod system types
export interface Mod {
  id: string;
  name: string;
  author: string;
  version: string;
  description: string;
  data: Partial<GameData>;
  enabled: boolean;
}

// ============ LEVEL SYSTEM ============

const EXP_BASE = 100;
const EXP_GROWTH = 1.5;

export function getExpToNextLevel(level: number): number {
  return Math.floor(EXP_BASE * Math.pow(EXP_GROWTH, level - 1));
}

/** Award exp to a character, returns updated stats (may level up multiple times) */
export function awardExp(stats: CharacterStats, expGained: number): CharacterStats {
  let s = { ...stats, exp: stats.exp + expGained };
  while (s.exp >= s.expToNext) {
    s.exp -= s.expToNext;
    s.level += 1;
    s.expToNext = getExpToNextLevel(s.level);
    // Stat gains per level
    s.maxHp += 5 + Math.floor(s.level * 1.2);
    s.hp = s.maxHp; // Full heal on level up
    s.attack += 2;
    s.defense += 1;
    s.magic += 2;
    s.speed += 1;
  }
  return s;
}

/** Get effective combat stats (base + level bonuses are already baked in) */
export function getEffectiveStats(stats: CharacterStats) {
  return {
    hp: stats.hp,
    maxHp: stats.maxHp,
    attack: stats.attack,
    defense: stats.defense,
    magic: stats.magic,
    speed: stats.speed,
  };
}

export function createDefaultStats(overrides: Partial<CharacterStats> = {}): CharacterStats {
  return {
    hp: 100,
    maxHp: 100,
    speed: 3,
    attack: 10,
    defense: 5,
    magic: 8,
    level: 1,
    exp: 0,
    expToNext: getExpToNextLevel(1),
    ...overrides,
  };
}
