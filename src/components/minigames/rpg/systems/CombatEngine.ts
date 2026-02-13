// CombatEngine — Pure combat logic, no React dependencies
// All methods are static, receiving state and returning new state

import {
  CombatState,
  CombatCharacter,
  CombatAction,
  CombatLogEntry,
  Skill,
  defaultSkills,
  defaultEnemies,
  TimelineEntry,
} from '../types/CombatTypes';
import { Character } from '../types/GameTypes';

export class CombatEngine {
  /** Initialize combat state from party and enemy IDs */
  static start(
    playerParty: Character[],
    enemyIds: string[],
    isSpanish: boolean
  ): CombatState {
    const players: CombatCharacter[] = playerParty.map((char, i) => ({
      id: char.id,
      name: isSpanish ? char.nameEs : char.name,
      nameEs: char.nameEs,
      stats: {
        hp: char.stats.hp,
        maxHp: char.stats.maxHp,
        attack: 10 + i * 2,
        defense: 5 + i,
        speed: char.stats.speed,
        magic: 8 + i * 2,
      },
      skills: [defaultSkills.basic_attack, defaultSkills.defend, defaultSkills.heal],
      sprite: [],
      position: { x: 50, y: 150 + i * 60 },
      statusEffects: [],
      isDefending: false,
    }));

    const enemies: CombatCharacter[] = enemyIds.map((id, i) => {
      const enemy = defaultEnemies[id] || defaultEnemies.shadow_slime;
      return {
        id: `${id}_${i}`,
        name: isSpanish ? enemy.nameEs : enemy.name,
        nameEs: enemy.nameEs,
        stats: { ...enemy.stats },
        skills: enemy.skills.map(s => defaultSkills[s]).filter(Boolean),
        sprite: enemy.sprite,
        position: { x: 250, y: 120 + i * 70 },
        statusEffects: [],
        isDefending: false,
      };
    });

    const timeline = CombatEngine.buildTimeline(players, enemies);

    return {
      isActive: true,
      turn: 1,
      phase: 'player_select',
      timeline,
      currentActorIndex: 0,
      playerParty: players,
      enemyParty: enemies,
      selectedAction: null,
      combatLog: [],
      animations: [],
    };
  }

  /** Build turn order timeline sorted by speed */
  static buildTimeline(
    players: CombatCharacter[],
    enemies: CombatCharacter[]
  ): TimelineEntry[] {
    const all = [...players, ...enemies]
      .filter(c => c.stats.hp > 0)
      .sort((a, b) => b.stats.speed - a.stats.speed);

    return all.map((char, i) => ({
      characterId: char.id,
      name: char.name,
      isPlayer: players.some(p => p.id === char.id),
      turnOrder: i,
      currentPosition: Math.random() * 20,
      icon: char.sprite,
      statusEffects: char.statusEffects,
    }));
  }

  /** Process a combat action and return new state */
  static act(state: CombatState, action: CombatAction, isSpanish: boolean): CombatState {
    const newState: CombatState = {
      ...state,
      playerParty: state.playerParty.map(p => ({ ...p, stats: { ...p.stats } })),
      enemyParty: state.enemyParty.map(e => ({ ...e, stats: { ...e.stats } })),
    };

    const allChars = [...newState.playerParty, ...newState.enemyParty];
    const actor = allChars.find(c => c.id === action.actorId);
    if (!actor) return state;

    const log: CombatLogEntry = {
      turn: state.turn,
      actorName: actor.name,
      action: '',
      timestamp: Date.now(),
    };

    if (action.type === 'attack' || action.type === 'skill') {
      const skill = action.skillId ? defaultSkills[action.skillId] : defaultSkills.basic_attack;
      if (!skill) return state;

      const targets = CombatEngine.resolveTargets(newState, action, skill);

      for (const target of targets) {
        if (target.stats.hp <= 0) continue;

        if (skill.type === 'attack' || skill.type === 'magic') {
          const baseDmg = skill.type === 'magic'
            ? actor.stats.magic + skill.power
            : actor.stats.attack + skill.power;
          const def = target.isDefending ? target.stats.defense * 2 : target.stats.defense;
          const damage = Math.max(1, Math.floor(baseDmg - def * 0.5));
          target.stats.hp = Math.max(0, target.stats.hp - damage);
          log.damage = damage;
          log.target = target.name;
        } else if (skill.type === 'heal') {
          const heal = skill.power + Math.floor(actor.stats.magic * 0.5);
          target.stats.hp = Math.min(target.stats.maxHp, target.stats.hp + heal);
          log.heal = heal;
          log.target = target.name;
        }
      }
      log.action = isSpanish ? skill.nameEs : skill.name;
    } else if (action.type === 'defend') {
      const idx = newState.playerParty.findIndex(p => p.id === action.actorId);
      if (idx >= 0) newState.playerParty[idx].isDefending = true;
      const eidx = newState.enemyParty.findIndex(e => e.id === action.actorId);
      if (eidx >= 0) newState.enemyParty[eidx].isDefending = true;
      log.action = isSpanish ? 'Defender' : 'Defend';
    } else if (action.type === 'flee') {
      if (Math.random() > 0.5) {
        return { ...newState, phase: 'victory', combatLog: [...state.combatLog, { ...log, action: isSpanish ? 'Huir (Éxito)' : 'Flee (Success)' }] };
      }
      log.action = isSpanish ? 'Huir (Fallido)' : 'Flee (Failed)';
    }

    newState.combatLog = [...state.combatLog, log];

    // Check win/lose
    if (newState.enemyParty.every(e => e.stats.hp <= 0)) {
      newState.phase = 'victory';
      return newState;
    }
    if (newState.playerParty.every(p => p.stats.hp <= 0)) {
      newState.phase = 'defeat';
      return newState;
    }

    // Advance turn
    return CombatEngine.advanceTurn(newState);
  }

  /** Get enemy AI action */
  static getEnemyAction(state: CombatState, enemyId: string): CombatAction {
    const alivePlayers = state.playerParty.filter(p => p.stats.hp > 0);
    if (alivePlayers.length === 0) {
      return { type: 'defend', actorId: enemyId };
    }
    const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
    return { type: 'attack', actorId: enemyId, targetId: target.id, skillId: 'basic_attack' };
  }

  /** Calculate total rewards */
  static getRewards(enemyIds: string[]): { exp: number; gold: number } {
    return enemyIds.reduce(
      (sum, id) => ({
        exp: sum.exp + (defaultEnemies[id]?.exp || 10),
        gold: sum.gold + (defaultEnemies[id]?.gold || 5),
      }),
      { exp: 0, gold: 0 }
    );
  }

  // ===== PRIVATE HELPERS =====

  private static resolveTargets(
    state: CombatState,
    action: CombatAction,
    skill: Skill
  ): CombatCharacter[] {
    if (skill.targetType === 'all') {
      const isEnemy = state.enemyParty.some(e => e.id === action.actorId);
      return isEnemy ? state.playerParty : state.enemyParty;
    }
    if (skill.targetType === 'self') {
      return [...state.playerParty, ...state.enemyParty].filter(c => c.id === action.actorId);
    }
    if (action.targetId) {
      return [...state.playerParty, ...state.enemyParty].filter(c => c.id === action.targetId);
    }
    return [];
  }

  private static advanceTurn(state: CombatState): CombatState {
    // Remove dead from timeline
    const timeline = state.timeline.filter(t => {
      const char = [...state.playerParty, ...state.enemyParty].find(c => c.id === t.characterId);
      return char && char.stats.hp > 0;
    });

    let nextIndex = (state.currentActorIndex + 1) % Math.max(1, timeline.length);
    let turn = state.turn;

    if (nextIndex === 0) {
      turn++;
      state.playerParty.forEach(p => (p.isDefending = false));
      state.enemyParty.forEach(e => (e.isDefending = false));
    }

    const nextEntry = timeline[nextIndex];
    const phase = nextEntry?.isPlayer ? 'player_select' : 'enemy_select';

    return { ...state, timeline, currentActorIndex: nextIndex, turn, phase };
  }
}
