// CombatEngine — Pure combat logic, no React dependencies
// All methods are static, receiving state and returning new state

import {
  CombatState,
  CombatCharacter,
  CombatAction,
  CombatLogEntry,
  Skill,
  defaultSkills,
  TimelineEntry,
  CombatAnimation,
} from '../types/CombatTypes';
import { Character, getEffectiveStats } from '../types/GameTypes';
import { monsterRegistry } from '../data/monsters';
import { classSkills } from '../data/heroClasses';

// Merge all available skills
const allSkills: Record<string, Skill> = { ...defaultSkills, ...classSkills };

export class CombatEngine {
  /** Initialize combat state from party and enemy IDs (uses monsterRegistry) */
  static start(
    playerParty: Character[],
    enemyIds: string[],
    isSpanish: boolean
  ): CombatState {
    const players: CombatCharacter[] = playerParty.map((char) => {
      const effective = getEffectiveStats(char.stats);
      const skills = (char.skillIds || ['basic_attack', 'defend', 'heal'])
        .map(id => allSkills[id])
        .filter(Boolean);
      return {
        id: char.id,
        name: isSpanish ? char.nameEs : char.name,
        nameEs: char.nameEs,
        stats: { ...effective, magic: effective.magic },
        skills,
        sprite: [],
        position: { x: 50, y: 150 },
        statusEffects: [],
        isDefending: false,
      };
    });

    const enemies: CombatCharacter[] = enemyIds.map((id, i) => {
      const def = monsterRegistry[id];
      if (!def) {
        // fallback
        return {
          id: `${id}_${i}`,
          name: id,
          nameEs: id,
          stats: { hp: 20, maxHp: 20, attack: 5, defense: 2, speed: 3, magic: 2 },
          skills: [defaultSkills.basic_attack],
          sprite: [],
          position: { x: 250, y: 120 + i * 70 },
          statusEffects: [],
          isDefending: false,
        };
      }
      return {
        id: `${id}_${i}`,
        name: isSpanish ? def.nameEs : def.name,
        nameEs: def.nameEs,
        stats: { ...def.stats },
        skills: def.skills.map(s => allSkills[s]).filter(Boolean),
        sprite: def.combatSprite,
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

  /** Process a combat action and return new state + animations */
  static act(state: CombatState, action: CombatAction, isSpanish: boolean): CombatState {
    const newState: CombatState = {
      ...state,
      playerParty: state.playerParty.map(p => ({ ...p, stats: { ...p.stats } })),
      enemyParty: state.enemyParty.map(e => ({ ...e, stats: { ...e.stats } })),
      animations: [],
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
      const skill = action.skillId ? allSkills[action.skillId] : allSkills.basic_attack;
      if (!skill) return state;

      const targets = CombatEngine.resolveTargets(newState, action, skill);

      for (const target of targets) {
        if (target.stats.hp <= 0) continue;

        if (skill.type === 'attack' || skill.type === 'magic') {
          const baseDmg = skill.type === 'magic'
            ? actor.stats.magic + skill.power
            : actor.stats.attack + skill.power;
          const def = target.isDefending ? target.stats.defense * 2 : target.stats.defense;
          const variance = 0.9 + Math.random() * 0.2; // ±10% damage variance
          const damage = Math.max(1, Math.floor((baseDmg - def * 0.5) * variance));
          target.stats.hp = Math.max(0, target.stats.hp - damage);
          log.damage = damage;
          log.target = target.name;

          // Add damage animation
          newState.animations.push({
            id: `dmg_${Date.now()}_${target.id}`,
            type: target.stats.hp <= 0 ? 'death' : 'damage',
            targetId: target.id,
            duration: 500,
            startTime: Date.now(),
            data: { damage },
          });
        } else if (skill.type === 'heal') {
          const heal = skill.power + Math.floor(actor.stats.magic * 0.5);
          target.stats.hp = Math.min(target.stats.maxHp, target.stats.hp + heal);
          log.heal = heal;
          log.target = target.name;

          newState.animations.push({
            id: `heal_${Date.now()}_${target.id}`,
            type: 'heal',
            targetId: target.id,
            duration: 500,
            startTime: Date.now(),
            data: { heal },
          });
        }

        // Apply status effect
        if (skill.statusEffect && target.stats.hp > 0) {
          target.statusEffects = [...target.statusEffects, { ...skill.statusEffect }];
          log.effect = isSpanish ? skill.statusEffect.nameEs : skill.statusEffect.name;
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

    // Process status effects (poison, burn, etc.)
    CombatEngine.processStatusEffects(newState, isSpanish);

    // Check win/lose
    if (newState.enemyParty.every(e => e.stats.hp <= 0)) {
      newState.phase = 'victory';
      return newState;
    }
    if (newState.playerParty.every(p => p.stats.hp <= 0)) {
      newState.phase = 'defeat';
      return newState;
    }

    return CombatEngine.advanceTurn(newState);
  }

  /** Process status effects at end of turn */
  private static processStatusEffects(state: CombatState, isSpanish: boolean) {
    const allChars = [...state.playerParty, ...state.enemyParty];
    for (const char of allChars) {
      if (char.stats.hp <= 0) continue;
      const remaining: typeof char.statusEffects = [];
      for (const effect of char.statusEffects) {
        if (effect.type === 'poison' || effect.type === 'burn') {
          const tick = effect.power;
          char.stats.hp = Math.max(0, char.stats.hp - tick);
          state.combatLog.push({
            turn: state.turn,
            actorName: char.name,
            action: `${isSpanish ? effect.nameEs : effect.name} (-${tick} HP)`,
            damage: tick,
            timestamp: Date.now(),
          });
        }
        const copy = { ...effect, duration: effect.duration - 1 };
        if (copy.duration > 0) remaining.push(copy);
      }
      char.statusEffects = remaining;
    }
  }

  /** Get enemy AI action */
  static getEnemyAction(state: CombatState, enemyId: string): CombatAction {
    const enemy = state.enemyParty.find(e => e.id === enemyId);
    const alivePlayers = state.playerParty.filter(p => p.stats.hp > 0);
    if (alivePlayers.length === 0 || !enemy) {
      return { type: 'defend', actorId: enemyId };
    }

    // Use available skills sometimes
    if (enemy.skills.length > 1 && Math.random() < 0.4) {
      const skill = enemy.skills[Math.floor(Math.random() * enemy.skills.length)];
      if (skill.type === 'heal' && enemy.stats.hp < enemy.stats.maxHp * 0.5) {
        return { type: 'skill', actorId: enemyId, targetId: enemyId, skillId: skill.id };
      }
      if (skill.type !== 'heal') {
        const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
        return { type: 'skill', actorId: enemyId, targetId: target.id, skillId: skill.id };
      }
    }

    const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
    return { type: 'attack', actorId: enemyId, targetId: target.id, skillId: 'basic_attack' };
  }

  /** Calculate total rewards from monsterRegistry */
  static getRewards(enemyIds: string[]): { exp: number; gold: number; drops: string[] } {
    const drops: string[] = [];
    const result = enemyIds.reduce(
      (sum, id) => {
        const def = monsterRegistry[id];
        if (!def) return sum;
        // Roll for drops
        for (const drop of def.drops) {
          if (Math.random() < drop.chance) {
            drops.push(drop.itemId);
          }
        }
        return {
          exp: sum.exp + def.exp,
          gold: sum.gold + def.gold,
        };
      },
      { exp: 0, gold: 0 }
    );
    return { ...result, drops };
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
