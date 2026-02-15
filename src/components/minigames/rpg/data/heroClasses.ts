// Hero Class System - defines unique classes, skills, strengths and weaknesses
import { CharacterStats, createDefaultStats } from '../types/GameTypes';
import { Skill } from '../types/CombatTypes';

export interface HeroClass {
  id: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  icon: string;
  // Base stat modifiers (multiplied against default stats)
  statModifiers: Partial<CharacterStats>;
  // Unique skills
  skillIds: string[];
  // Strengths and weaknesses
  strengths: string[];
  strengthsEs: string[];
  weaknesses: string[];
  weaknessesEs: string[];
  // Visual accent color
  accentColor: string;
}

export const heroClasses: Record<string, HeroClass> = {
  squire: {
    id: 'squire',
    name: 'Squire',
    nameEs: 'Escudero',
    description: 'A balanced defender who protects allies with his shield. Excels at tanking and buffing the party.',
    descriptionEs: 'Un defensor equilibrado que protege a sus aliados con su escudo. Sobresale en tanquear y potenciar al grupo.',
    icon: '🛡️',
    statModifiers: { hp: 110, maxHp: 110, attack: 10, defense: 14, magic: 6, speed: 3 },
    skillIds: ['basic_attack', 'defend', 'shield_bash', 'rally'],
    strengths: ['High defense', 'Party protection', 'Durable'],
    strengthsEs: ['Alta defensa', 'Protección al grupo', 'Duradero'],
    weaknesses: ['Low magic', 'Slow', 'Low damage'],
    weaknessesEs: ['Magia baja', 'Lento', 'Daño bajo'],
    accentColor: '#3b82f6',
  },
  warrior: {
    id: 'warrior',
    name: 'Warrior',
    nameEs: 'Guerrero',
    description: 'A raw powerhouse who overwhelms enemies with brute force. High HP and devastating attacks.',
    descriptionEs: 'Una fuerza bruta que abruma enemigos con poder puro. HP alto y ataques devastadores.',
    icon: '⚔️',
    statModifiers: { hp: 130, maxHp: 130, attack: 16, defense: 10, magic: 4, speed: 3 },
    skillIds: ['basic_attack', 'defend', 'power_strike', 'war_cry'],
    strengths: ['Highest HP', 'Devastating damage', 'Intimidation'],
    strengthsEs: ['HP más alto', 'Daño devastador', 'Intimidación'],
    weaknesses: ['No magic', 'Very slow', 'No healing'],
    weaknessesEs: ['Sin magia', 'Muy lento', 'Sin curación'],
    accentColor: '#ef4444',
  },
  shadow_blade: {
    id: 'shadow_blade',
    name: 'Shadow Blade',
    nameEs: 'Espadachín Sigiloso',
    description: 'A stealthy swordsman who strikes from the shadows. High speed and critical hits.',
    descriptionEs: 'Un espadachín sigiloso que ataca desde las sombras. Alta velocidad y golpes críticos.',
    icon: '🗡️',
    statModifiers: { hp: 85, maxHp: 85, attack: 13, defense: 5, magic: 8, speed: 8 },
    skillIds: ['basic_attack', 'shadow_strike', 'smoke_bomb', 'backstab'],
    strengths: ['Fastest class', 'Critical hits', 'Evasion'],
    strengthsEs: ['Clase más rápida', 'Golpes críticos', 'Evasión'],
    weaknesses: ['Low HP', 'Fragile', 'Weak defense'],
    weaknessesEs: ['HP bajo', 'Frágil', 'Defensa débil'],
    accentColor: '#8b5cf6',
  },
  archer: {
    id: 'archer',
    name: 'Archer',
    nameEs: 'Arquero',
    description: 'A precise marksman who hits from afar. Balanced speed with ranged superiority.',
    descriptionEs: 'Un tirador preciso que golpea desde lejos. Velocidad equilibrada con superioridad a distancia.',
    icon: '🏹',
    statModifiers: { hp: 90, maxHp: 90, attack: 14, defense: 6, magic: 7, speed: 6 },
    skillIds: ['basic_attack', 'piercing_arrow', 'rain_of_arrows', 'eagle_eye'],
    strengths: ['High accuracy', 'Multi-target', 'Good range'],
    strengthsEs: ['Alta precisión', 'Multi-objetivo', 'Buen rango'],
    weaknesses: ['Medium defense', 'Weak melee', 'Low HP'],
    weaknessesEs: ['Defensa media', 'Cuerpo a cuerpo débil', 'HP bajo'],
    accentColor: '#22c55e',
  },
  brawler: {
    id: 'brawler',
    name: 'Brawler',
    nameEs: 'Luchador',
    description: 'A fierce fighter who uses fists and fury. Gains power as HP drops.',
    descriptionEs: 'Un luchador feroz que usa puños y furia. Gana poder conforme baja su HP.',
    icon: '👊',
    statModifiers: { hp: 120, maxHp: 120, attack: 15, defense: 8, magic: 3, speed: 5 },
    skillIds: ['basic_attack', 'defend', 'fury_fist', 'counter_stance'],
    strengths: ['Fury mechanic', 'High attack', 'Counter attacks'],
    strengthsEs: ['Mecánica de furia', 'Ataque alto', 'Contra-ataques'],
    weaknesses: ['No magic at all', 'No ranged', 'Reckless'],
    weaknessesEs: ['Sin magia', 'Sin rango', 'Imprudente'],
    accentColor: '#f97316',
  },
  healer: {
    id: 'healer',
    name: 'Healer',
    nameEs: 'Curandero',
    description: 'A compassionate support who keeps the party alive. Highest magic and powerful heals.',
    descriptionEs: 'Un apoyo compasivo que mantiene vivo al grupo. Magia más alta y curaciones poderosas.',
    icon: '💚',
    statModifiers: { hp: 80, maxHp: 80, attack: 6, defense: 5, magic: 16, speed: 4 },
    skillIds: ['basic_attack', 'heal', 'purify', 'divine_light'],
    strengths: ['Strongest heals', 'Cure status', 'Party sustain'],
    strengthsEs: ['Curaciones más fuertes', 'Curar estados', 'Sustento del grupo'],
    weaknesses: ['Lowest HP', 'No damage', 'Very fragile'],
    weaknessesEs: ['HP más bajo', 'Sin daño', 'Muy frágil'],
    accentColor: '#10b981',
  },
};

// Map character ID to class ID
export const characterClassMap: Record<string, string> = {
  matias: 'squire',
  maximo: 'warrior',
  miguel: 'shadow_blade',
  elias: 'archer',
  alejandro: 'brawler',
  angel: 'healer',
};

// Class-specific skills (extend defaultSkills)
export const classSkills: Record<string, Skill> = {
  // Squire skills
  shield_bash: {
    id: 'shield_bash',
    name: 'Shield Bash',
    nameEs: 'Golpe de Escudo',
    description: 'Bash enemy with shield, may stun.',
    descriptionEs: 'Golpea al enemigo con el escudo, puede aturdir.',
    type: 'attack',
    power: 15,
    cost: 5,
    cooldown: 1,
    animation: 'shield',
    targetType: 'single',
    statusEffect: { id: 'stun', name: 'Stun', nameEs: 'Aturdimiento', type: 'stun', duration: 1, power: 0, icon: '💫' },
  },
  rally: {
    id: 'rally',
    name: 'Rally',
    nameEs: 'Arenga',
    description: 'Boost all allies defense.',
    descriptionEs: 'Aumenta la defensa de todos los aliados.',
    type: 'buff',
    power: 20,
    cost: 15,
    cooldown: 3,
    animation: 'buff',
    targetType: 'self',
    statusEffect: { id: 'def_up', name: 'DEF Up', nameEs: 'DEF Arriba', type: 'buff', duration: 3, power: 20, icon: '🛡️' },
  },
  // Warrior skills
  power_strike: {
    id: 'power_strike',
    name: 'Power Strike',
    nameEs: 'Golpe de Poder',
    description: 'A devastating blow with double power.',
    descriptionEs: 'Un golpe devastador con doble poder.',
    type: 'attack',
    power: 30,
    cost: 10,
    cooldown: 2,
    animation: 'slash',
    targetType: 'single',
  },
  war_cry: {
    id: 'war_cry',
    name: 'War Cry',
    nameEs: 'Grito de Guerra',
    description: 'Intimidate all enemies, lowering their attack.',
    descriptionEs: 'Intimida a todos los enemigos, bajando su ataque.',
    type: 'debuff',
    power: 15,
    cost: 10,
    cooldown: 3,
    animation: 'buff',
    targetType: 'all',
    statusEffect: { id: 'atk_down', name: 'ATK Down', nameEs: 'ATK Abajo', type: 'debuff', duration: 2, power: 15, icon: '📉' },
  },
  // Shadow Blade skills
  shadow_strike: {
    id: 'shadow_strike',
    name: 'Shadow Strike',
    nameEs: 'Golpe Sombra',
    description: 'Strike from the shadows with high crit chance.',
    descriptionEs: 'Ataca desde las sombras con alta probabilidad de crítico.',
    type: 'attack',
    power: 20,
    cost: 8,
    cooldown: 1,
    animation: 'slash',
    targetType: 'single',
  },
  smoke_bomb: {
    id: 'smoke_bomb',
    name: 'Smoke Bomb',
    nameEs: 'Bomba de Humo',
    description: 'Blind all enemies, reducing accuracy.',
    descriptionEs: 'Ciega a todos los enemigos, reduciendo precisión.',
    type: 'debuff',
    power: 0,
    cost: 12,
    cooldown: 3,
    animation: 'effect',
    targetType: 'all',
    statusEffect: { id: 'blind', name: 'Blind', nameEs: 'Ceguera', type: 'debuff', duration: 2, power: 30, icon: '💨' },
  },
  backstab: {
    id: 'backstab',
    name: 'Backstab',
    nameEs: 'Puñalada Trasera',
    description: 'Double damage if enemy is debuffed.',
    descriptionEs: 'Doble daño si el enemigo tiene debuff.',
    type: 'attack',
    power: 35,
    cost: 15,
    cooldown: 2,
    animation: 'slash',
    targetType: 'single',
  },
  // Archer skills
  piercing_arrow: {
    id: 'piercing_arrow',
    name: 'Piercing Arrow',
    nameEs: 'Flecha Perforante',
    description: 'Ignores part of enemy defense.',
    descriptionEs: 'Ignora parte de la defensa enemiga.',
    type: 'attack',
    power: 22,
    cost: 8,
    cooldown: 1,
    animation: 'slash',
    targetType: 'single',
  },
  rain_of_arrows: {
    id: 'rain_of_arrows',
    name: 'Rain of Arrows',
    nameEs: 'Lluvia de Flechas',
    description: 'Hit all enemies from above.',
    descriptionEs: 'Golpea a todos los enemigos desde arriba.',
    type: 'attack',
    power: 12,
    cost: 20,
    cooldown: 3,
    animation: 'slash',
    targetType: 'all',
  },
  eagle_eye: {
    id: 'eagle_eye',
    name: 'Eagle Eye',
    nameEs: 'Ojo de Águila',
    description: 'Boost accuracy and crit for 3 turns.',
    descriptionEs: 'Aumenta precisión y crítico por 3 turnos.',
    type: 'buff',
    power: 25,
    cost: 10,
    cooldown: 3,
    animation: 'buff',
    targetType: 'self',
    statusEffect: { id: 'eagle_eye', name: 'Eagle Eye', nameEs: 'Ojo de Águila', type: 'buff', duration: 3, power: 25, icon: '🦅' },
  },
  // Brawler skills
  fury_fist: {
    id: 'fury_fist',
    name: 'Fury Fist',
    nameEs: 'Puño Furioso',
    description: 'Triple hit combo. More damage at low HP.',
    descriptionEs: 'Combo de triple golpe. Más daño con HP bajo.',
    type: 'attack',
    power: 25,
    cost: 10,
    cooldown: 2,
    animation: 'slash',
    targetType: 'single',
  },
  counter_stance: {
    id: 'counter_stance',
    name: 'Counter Stance',
    nameEs: 'Postura de Contra',
    description: 'Defend and counter next attack.',
    descriptionEs: 'Defiende y contraataca el siguiente ataque.',
    type: 'buff',
    power: 0,
    cost: 5,
    cooldown: 2,
    animation: 'shield',
    targetType: 'self',
    statusEffect: { id: 'counter', name: 'Counter', nameEs: 'Contra', type: 'buff', duration: 1, power: 0, icon: '🔄' },
  },
  // Healer skills
  purify: {
    id: 'purify',
    name: 'Purify',
    nameEs: 'Purificar',
    description: 'Remove all status effects from an ally.',
    descriptionEs: 'Elimina todos los efectos de estado de un aliado.',
    type: 'heal',
    power: 0,
    cost: 10,
    cooldown: 2,
    animation: 'heal',
    targetType: 'single',
  },
  divine_light: {
    id: 'divine_light',
    name: 'Divine Light',
    nameEs: 'Luz Divina',
    description: 'Heal all allies for a moderate amount.',
    descriptionEs: 'Cura a todos los aliados una cantidad moderada.',
    type: 'heal',
    power: 20,
    cost: 25,
    cooldown: 3,
    animation: 'heal',
    targetType: 'all',
  },
};

// Get stats for a character based on their class
export function getClassStats(classId: string): CharacterStats {
  const heroClass = heroClasses[classId];
  if (!heroClass) return createDefaultStats();
  return createDefaultStats(heroClass.statModifiers);
}

// Get skills for a character based on their class
export function getClassSkillIds(classId: string): string[] {
  const heroClass = heroClasses[classId];
  return heroClass?.skillIds || ['basic_attack', 'defend'];
}
