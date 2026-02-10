// Leveling and Experience System

export interface CharacterLevel {
  level: number;
  currentExp: number;
  totalExp: number;
  // Bonus stats from leveling
  bonusHp: number;
  bonusAttack: number;
  bonusDefense: number;
  bonusSpeed: number;
  bonusMagic: number;
}

// XP required to reach each level (exponential curve)
export function getExpForLevel(level: number): number {
  return Math.floor(50 * Math.pow(1.4, level - 1));
}

// Total XP needed from 1 to target level
export function getTotalExpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getExpForLevel(i);
  }
  return total;
}

// Stat growths per level for each character
const STAT_GROWTHS: Record<string, { hp: number; atk: number; def: number; spd: number; mag: number }> = {
  matias:    { hp: 8,  atk: 3, def: 2, spd: 2, mag: 3 },
  angel:     { hp: 6,  atk: 2, def: 3, spd: 3, mag: 4 },
  alejandro: { hp: 10, atk: 4, def: 3, spd: 1, mag: 2 },
  miguel:    { hp: 7,  atk: 3, def: 2, spd: 4, mag: 2 },
  elias:     { hp: 5,  atk: 2, def: 1, spd: 3, mag: 5 },
  maximo:    { hp: 9,  atk: 3, def: 4, spd: 2, mag: 2 },
};

const DEFAULT_GROWTH = { hp: 7, atk: 3, def: 2, spd: 2, mag: 3 };

export interface LevelUpResult {
  newLevel: number;
  hpGain: number;
  attackGain: number;
  defenseGain: number;
  speedGain: number;
  magicGain: number;
  levelsGained: number;
}

// Award EXP and check for level ups
export function awardExp(
  characterId: string,
  currentLevel: CharacterLevel,
  expGained: number
): { updatedLevel: CharacterLevel; levelUp: LevelUpResult | null } {
  const newLevel = { ...currentLevel };
  newLevel.currentExp += expGained;
  newLevel.totalExp += expGained;

  let levelsGained = 0;
  let totalHpGain = 0;
  let totalAtkGain = 0;
  let totalDefGain = 0;
  let totalSpdGain = 0;
  let totalMagGain = 0;

  // Check for level ups
  while (newLevel.currentExp >= getExpForLevel(newLevel.level)) {
    newLevel.currentExp -= getExpForLevel(newLevel.level);
    newLevel.level++;
    levelsGained++;

    const growth = STAT_GROWTHS[characterId] || DEFAULT_GROWTH;
    // Add some randomness (±1)
    const hpGain = growth.hp + Math.floor(Math.random() * 3) - 1;
    const atkGain = growth.atk + (Math.random() < 0.5 ? 1 : 0);
    const defGain = growth.def + (Math.random() < 0.5 ? 1 : 0);
    const spdGain = growth.spd + (Math.random() < 0.5 ? 1 : 0);
    const magGain = growth.mag + (Math.random() < 0.5 ? 1 : 0);

    newLevel.bonusHp += hpGain;
    newLevel.bonusAttack += atkGain;
    newLevel.bonusDefense += defGain;
    newLevel.bonusSpeed += spdGain;
    newLevel.bonusMagic += magGain;

    totalHpGain += hpGain;
    totalAtkGain += atkGain;
    totalDefGain += defGain;
    totalSpdGain += spdGain;
    totalMagGain += magGain;
  }

  const levelUp: LevelUpResult | null = levelsGained > 0 ? {
    newLevel: newLevel.level,
    hpGain: totalHpGain,
    attackGain: totalAtkGain,
    defenseGain: totalDefGain,
    speedGain: totalSpdGain,
    magicGain: totalMagGain,
    levelsGained,
  } : null;

  return { updatedLevel: newLevel, levelUp };
}

// Create initial level data for a character
export function createInitialLevel(): CharacterLevel {
  return {
    level: 1,
    currentExp: 0,
    totalExp: 0,
    bonusHp: 0,
    bonusAttack: 0,
    bonusDefense: 0,
    bonusSpeed: 0,
    bonusMagic: 0,
  };
}

// Get effective stats (base + level bonuses)
export function getEffectiveStats(
  baseStats: { hp: number; maxHp: number; attack?: number; defense?: number; speed: number; magic?: number },
  levelData: CharacterLevel
): { hp: number; maxHp: number; attack: number; defense: number; speed: number; magic: number } {
  return {
    hp: baseStats.hp + levelData.bonusHp,
    maxHp: baseStats.maxHp + levelData.bonusHp,
    attack: (baseStats.attack || 10) + levelData.bonusAttack,
    defense: (baseStats.defense || 5) + levelData.bonusDefense,
    speed: baseStats.speed + levelData.bonusSpeed,
    magic: (baseStats.magic || 8) + levelData.bonusMagic,
  };
}

// Storage
const LEVEL_STORAGE_KEY = 'rpg_character_levels';

export function saveLevels(levels: Record<string, CharacterLevel>): void {
  localStorage.setItem(LEVEL_STORAGE_KEY, JSON.stringify(levels));
}

export function loadLevels(): Record<string, CharacterLevel> | null {
  try {
    const saved = localStorage.getItem(LEVEL_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}
