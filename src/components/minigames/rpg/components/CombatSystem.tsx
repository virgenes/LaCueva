import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Shield, Sparkles, Heart, Zap, X } from 'lucide-react';
import { SpriteRenderer } from './SpriteRenderer';
import { useSettings } from '@/contexts/SettingsContext';
import { 
  CombatState, 
  CombatCharacter, 
  TimelineEntry, 
  CombatAction,
  Skill,
  defaultSkills,
  Enemy,
  defaultEnemies,
  CombatLogEntry,
} from '../types/CombatTypes';
import { Character } from '../types/GameTypes';

interface CombatSystemProps {
  playerParty: Character[];
  enemies: string[];
  onVictory: (exp: number, gold: number, items: string[]) => void;
  onDefeat: () => void;
  onFlee: () => void;
}

export const CombatSystem: React.FC<CombatSystemProps> = ({
  playerParty,
  enemies,
  onVictory,
  onDefeat,
  onFlee,
}) => {
  const { language } = useSettings();
  const isSpanish = language === 'es';

  // Initialize combat characters
  const initializeParty = (chars: Character[]): CombatCharacter[] => {
    return chars.map((char, index) => ({
      id: char.id,
      name: isSpanish ? char.nameEs : char.name,
      nameEs: char.nameEs,
      stats: {
        hp: char.stats.hp,
        maxHp: char.stats.maxHp,
        attack: 10 + index * 2,
        defense: 5 + index,
        speed: char.stats.speed,
        magic: 8 + index * 2,
      },
      skills: [defaultSkills.basic_attack, defaultSkills.defend, defaultSkills.heal],
      sprite: [], // Will be loaded from sprites
      position: { x: 50, y: 150 + index * 60 },
      statusEffects: [],
      isDefending: false,
    }));
  };

  const initializeEnemies = (enemyIds: string[]): CombatCharacter[] => {
    return enemyIds.map((id, index) => {
      const enemy = defaultEnemies[id] || defaultEnemies.shadow_slime;
      return {
        id: `${id}_${index}`,
        name: isSpanish ? enemy.nameEs : enemy.name,
        nameEs: enemy.nameEs,
        stats: { ...enemy.stats },
        skills: enemy.skills.map(s => defaultSkills[s]).filter(Boolean),
        sprite: enemy.sprite,
        position: { x: 250, y: 120 + index * 70 },
        statusEffects: [],
        isDefending: false,
      };
    });
  };

  const [combatState, setCombatState] = useState<CombatState>({
    isActive: true,
    turn: 1,
    phase: 'start',
    timeline: [],
    currentActorIndex: 0,
    playerParty: initializeParty(playerParty),
    enemyParty: initializeEnemies(enemies),
    selectedAction: null,
    combatLog: [],
    animations: [],
  });

  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [targetMode, setTargetMode] = useState(false);
  const [showLog, setShowLog] = useState(false);

  // Build timeline based on speed
  const buildTimeline = useCallback(() => {
    const allChars = [...combatState.playerParty, ...combatState.enemyParty]
      .filter(c => c.stats.hp > 0)
      .map(char => ({
        characterId: char.id,
        name: char.name,
        isPlayer: combatState.playerParty.some(p => p.id === char.id),
        turnOrder: 0,
        currentPosition: Math.random() * 20, // Start position varies
        icon: char.sprite,
        statusEffects: char.statusEffects,
      }))
      .sort((a, b) => {
        const charA = [...combatState.playerParty, ...combatState.enemyParty].find(c => c.id === a.characterId);
        const charB = [...combatState.playerParty, ...combatState.enemyParty].find(c => c.id === b.characterId);
        return (charB?.stats.speed || 0) - (charA?.stats.speed || 0);
      });

    return allChars.map((char, index) => ({ ...char, turnOrder: index }));
  }, [combatState.playerParty, combatState.enemyParty]);

  // Initialize timeline on first render
  useEffect(() => {
    if (combatState.phase === 'start') {
      const timeline = buildTimeline();
      setCombatState(prev => ({
        ...prev,
        timeline,
        phase: 'player_select',
      }));
    }
  }, [combatState.phase, buildTimeline]);

  // Get current actor
  const currentActor = useMemo(() => {
    const entry = combatState.timeline[combatState.currentActorIndex];
    if (!entry) return null;
    
    const allChars = [...combatState.playerParty, ...combatState.enemyParty];
    return allChars.find(c => c.id === entry.characterId);
  }, [combatState.timeline, combatState.currentActorIndex, combatState.playerParty, combatState.enemyParty]);

  const isPlayerTurn = useMemo(() => {
    const entry = combatState.timeline[combatState.currentActorIndex];
    return entry?.isPlayer ?? false;
  }, [combatState.timeline, combatState.currentActorIndex]);

  // Execute action
  const executeAction = useCallback((action: CombatAction) => {
    setCombatState(prev => {
      const newState = { ...prev };
      const actor = [...prev.playerParty, ...prev.enemyParty].find(c => c.id === action.actorId);
      if (!actor) return prev;

      let logEntry: CombatLogEntry = {
        turn: prev.turn,
        actorName: actor.name,
        action: '',
        timestamp: Date.now(),
      };

      if (action.type === 'attack' || action.type === 'skill') {
        const skill = action.skillId ? defaultSkills[action.skillId] : defaultSkills.basic_attack;
        const targetList = skill.targetType === 'all' 
          ? (action.actorId.includes('_') ? prev.playerParty : prev.enemyParty)
          : action.targetId 
            ? [...prev.playerParty, ...prev.enemyParty].filter(c => c.id === action.targetId)
            : [];

        targetList.forEach(target => {
          if (target.stats.hp <= 0) return;

          let damage = 0;
          if (skill.type === 'attack' || skill.type === 'magic') {
            const baseDamage = skill.type === 'magic' 
              ? actor.stats.magic + skill.power 
              : actor.stats.attack + skill.power;
            const defense = target.isDefending ? target.stats.defense * 2 : target.stats.defense;
            damage = Math.max(1, Math.floor(baseDamage - defense * 0.5));
            
            // Update target HP
            if (prev.playerParty.some(p => p.id === target.id)) {
              const idx = newState.playerParty.findIndex(p => p.id === target.id);
              if (idx >= 0) {
                newState.playerParty[idx] = {
                  ...newState.playerParty[idx],
                  stats: {
                    ...newState.playerParty[idx].stats,
                    hp: Math.max(0, newState.playerParty[idx].stats.hp - damage),
                  },
                };
              }
            } else {
              const idx = newState.enemyParty.findIndex(e => e.id === target.id);
              if (idx >= 0) {
                newState.enemyParty[idx] = {
                  ...newState.enemyParty[idx],
                  stats: {
                    ...newState.enemyParty[idx].stats,
                    hp: Math.max(0, newState.enemyParty[idx].stats.hp - damage),
                  },
                };
              }
            }
            logEntry.damage = damage;
            logEntry.target = target.name;
          } else if (skill.type === 'heal') {
            const healAmount = skill.power + Math.floor(actor.stats.magic * 0.5);
            if (prev.playerParty.some(p => p.id === target.id)) {
              const idx = newState.playerParty.findIndex(p => p.id === target.id);
              if (idx >= 0) {
                newState.playerParty[idx] = {
                  ...newState.playerParty[idx],
                  stats: {
                    ...newState.playerParty[idx].stats,
                    hp: Math.min(newState.playerParty[idx].stats.maxHp, newState.playerParty[idx].stats.hp + healAmount),
                  },
                };
              }
            }
            logEntry.heal = healAmount;
            logEntry.target = target.name;
          }
        });

        logEntry.action = isSpanish ? skill.nameEs : skill.name;
      } else if (action.type === 'defend') {
        const idx = prev.playerParty.findIndex(p => p.id === action.actorId);
        if (idx >= 0) {
          newState.playerParty[idx] = {
            ...newState.playerParty[idx],
            isDefending: true,
          };
        }
        logEntry.action = isSpanish ? 'Defender' : 'Defend';
      } else if (action.type === 'flee') {
        if (Math.random() > 0.5) {
          onFlee();
          return prev;
        }
        logEntry.action = isSpanish ? 'Huir (Fallido)' : 'Flee (Failed)';
      }

      newState.combatLog = [...prev.combatLog, logEntry];

      // Check for victory/defeat
      const allEnemiesDead = newState.enemyParty.every(e => e.stats.hp <= 0);
      const allPlayersDead = newState.playerParty.every(p => p.stats.hp <= 0);

      if (allEnemiesDead) {
        newState.phase = 'victory';
      } else if (allPlayersDead) {
        newState.phase = 'defeat';
      } else {
        // Next turn
        const nextIndex = (prev.currentActorIndex + 1) % prev.timeline.length;
        newState.currentActorIndex = nextIndex;
        if (nextIndex === 0) {
          newState.turn = prev.turn + 1;
          // Reset defending status
          newState.playerParty = newState.playerParty.map(p => ({ ...p, isDefending: false }));
          newState.enemyParty = newState.enemyParty.map(e => ({ ...e, isDefending: false }));
        }
        
        // Rebuild timeline removing dead characters
        newState.timeline = newState.timeline.filter(t => {
          const char = [...newState.playerParty, ...newState.enemyParty].find(c => c.id === t.characterId);
          return char && char.stats.hp > 0;
        });
        
        const nextEntry = newState.timeline[nextIndex];
        newState.phase = nextEntry?.isPlayer ? 'player_select' : 'enemy_select';
      }

      return newState;
    });
    setSelectedSkill(null);
    setTargetMode(false);
  }, [isSpanish, onFlee]);

  // Enemy AI - uses skills intelligently based on AI type
  useEffect(() => {
    if (combatState.phase === 'enemy_select' && currentActor) {
      const timer = setTimeout(() => {
        const alivePlayers = combatState.playerParty.filter(p => p.stats.hp > 0);
        if (alivePlayers.length === 0) return;

        const availableSkills = currentActor.skills.filter(s => s && s.id);
        
        // Determine action based on enemy's available skills
        let chosenSkill = defaultSkills.basic_attack;
        let target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];

        if (availableSkills.length > 1) {
          // Smart AI: use special skills sometimes
          const useSpecial = Math.random() < 0.6; // 60% chance to use a special skill
          
          if (useSpecial) {
            // Pick a non-basic skill
            const specialSkills = availableSkills.filter(s => s.id !== 'basic_attack' && s.id !== 'defend');
            if (specialSkills.length > 0) {
              chosenSkill = specialSkills[Math.floor(Math.random() * specialSkills.length)];
            }
          }

          // If HP is low and has healing/defensive skills, prioritize defense
          const hpPercent = currentActor.stats.hp / currentActor.stats.maxHp;
          if (hpPercent < 0.3) {
            const defensiveSkills = availableSkills.filter(s => 
              s.type === 'buff' || s.type === 'heal' || s.id === 'defend'
            );
            if (defensiveSkills.length > 0 && Math.random() < 0.7) {
              chosenSkill = defensiveSkills[Math.floor(Math.random() * defensiveSkills.length)];
            }
          }

          // Target lowest HP player for aggressive attacks
          if (chosenSkill.type === 'attack' || chosenSkill.type === 'magic') {
            target = alivePlayers.reduce((lowest, p) => 
              p.stats.hp < lowest.stats.hp ? p : lowest
            , alivePlayers[0]);
          }
        }

        if (chosenSkill.targetType === 'self') {
          executeAction({
            type: 'skill',
            actorId: currentActor.id,
            targetId: currentActor.id,
            skillId: chosenSkill.id,
          });
        } else {
          executeAction({
            type: chosenSkill.type === 'attack' || chosenSkill.type === 'magic' ? 'attack' : 'skill',
            actorId: currentActor.id,
            targetId: chosenSkill.targetType === 'all' ? target.id : target.id,
            skillId: chosenSkill.id,
          });
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [combatState.phase, currentActor, combatState.playerParty, executeAction]);

  // Handle victory/defeat
  useEffect(() => {
    if (combatState.phase === 'victory') {
      const timer = setTimeout(() => {
        const totalExp = enemies.reduce((sum, id) => sum + (defaultEnemies[id]?.exp || 10), 0);
        const totalGold = enemies.reduce((sum, id) => sum + (defaultEnemies[id]?.gold || 5), 0);
        onVictory(totalExp, totalGold, []);
      }, 2000);
      return () => clearTimeout(timer);
    } else if (combatState.phase === 'defeat') {
      const timer = setTimeout(() => {
        onDefeat();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [combatState.phase, enemies, onVictory, onDefeat]);

  // Handle skill selection
  const handleSkillSelect = (skill: Skill) => {
    setSelectedSkill(skill);
    if (skill.targetType === 'self') {
      executeAction({
        type: 'skill',
        actorId: currentActor!.id,
        targetId: currentActor!.id,
        skillId: skill.id,
      });
    } else {
      setTargetMode(true);
    }
  };

  // Handle target selection
  const handleTargetSelect = (targetId: string) => {
    if (!selectedSkill || !currentActor) return;
    executeAction({
      type: selectedSkill.type === 'attack' || selectedSkill.type === 'magic' ? 'attack' : 'skill',
      actorId: currentActor.id,
      targetId,
      skillId: selectedSkill.id,
    });
  };

  // Calculate HP bar width
  const getHpBarWidth = (current: number, max: number) => {
    return `${Math.max(0, (current / max) * 100)}%`;
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-night-deep/95 to-card/95 flex flex-col z-50">
      {/* Timeline */}
      <div className="h-12 bg-card/80 border-b border-pixel-border px-2 py-1">
        <div className="text-[7px] font-pixel text-muted-foreground mb-0.5">
          {isSpanish ? 'LÍNEA DE TIEMPO' : 'TIMELINE'} - {isSpanish ? 'Turno' : 'Turn'} {combatState.turn}
        </div>
        <div className="relative h-6 bg-muted rounded-sm overflow-hidden">
          <div className="absolute inset-0 flex items-center">
            {combatState.timeline.map((entry, idx) => (
              <motion.div
                key={entry.characterId}
                initial={{ x: 0 }}
                animate={{ 
                  x: `${idx * 40}px`,
                  scale: idx === combatState.currentActorIndex ? 1.2 : 1,
                }}
                className={`absolute w-6 h-6 rounded-sm border-2 flex items-center justify-center text-[8px] font-pixel
                  ${entry.isPlayer ? 'border-neon-cyan bg-neon-cyan/20' : 'border-neon-pink bg-neon-pink/20'}
                  ${idx === combatState.currentActorIndex ? 'ring-2 ring-star-gold' : ''}`}
              >
                {entry.name.charAt(0)}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Battle Arena */}
      <div className="flex-1 relative overflow-hidden">
        {/* Player Party */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 space-y-2">
          {combatState.playerParty.map((char, idx) => (
            <motion.div
              key={char.id}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative p-1 rounded-sm border ${
                char.stats.hp <= 0 ? 'opacity-50 grayscale' : ''
              } ${targetMode && selectedSkill?.type === 'heal' ? 'cursor-pointer hover:ring-2 ring-green-400' : ''}`}
              onClick={() => {
                if (targetMode && selectedSkill?.type === 'heal') {
                  handleTargetSelect(char.id);
                }
              }}
            >
              <div className="w-8 h-8 bg-muted rounded-sm flex items-center justify-center">
                <span className="text-lg">{char.name.charAt(0)}</span>
              </div>
              <div className="text-[6px] font-pixel text-center mt-0.5 truncate w-10">
                {char.name}
              </div>
              {/* HP Bar */}
              <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden mt-0.5">
                <motion.div
                  className="h-full bg-green-500"
                  initial={false}
                  animate={{ width: getHpBarWidth(char.stats.hp, char.stats.maxHp) }}
                />
              </div>
              <div className="text-[5px] text-center text-muted-foreground">
                {char.stats.hp}/{char.stats.maxHp}
              </div>
              {char.isDefending && (
                <div className="absolute -top-1 -right-1">
                  <Shield size={10} className="text-neon-cyan" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Enemy Party */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 space-y-2">
          {combatState.enemyParty.map((enemy, idx) => (
            <motion.div
              key={enemy.id}
              initial={{ x: 50, opacity: 0 }}
              animate={{ 
                x: 0, 
                opacity: 1,
                scale: enemy.stats.hp <= 0 ? 0.5 : 1,
              }}
              transition={{ delay: idx * 0.1 }}
              className={`relative p-1 rounded-sm border ${
                enemy.stats.hp <= 0 ? 'opacity-30' : ''
              } ${targetMode && selectedSkill?.type !== 'heal' ? 'cursor-pointer hover:ring-2 ring-neon-pink' : ''}`}
              onClick={() => {
                if (targetMode && selectedSkill?.type !== 'heal' && enemy.stats.hp > 0) {
                  handleTargetSelect(enemy.id);
                }
              }}
            >
              <div className="w-10 h-10">
                <SpriteRenderer sprite={enemy.sprite} size={5} />
              </div>
              <div className="text-[6px] font-pixel text-center mt-0.5 truncate w-12 text-neon-pink">
                {enemy.name}
              </div>
              {/* HP Bar */}
              <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden mt-0.5">
                <motion.div
                  className="h-full bg-red-500"
                  initial={false}
                  animate={{ width: getHpBarWidth(enemy.stats.hp, enemy.stats.maxHp) }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Center Battle Animation Area */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <AnimatePresence>
            {combatState.phase === 'victory' && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="text-center"
              >
                <div className="font-pixel text-2xl text-star-gold mb-2">
                  {isSpanish ? '¡VICTORIA!' : 'VICTORY!'}
                </div>
                <Sparkles className="w-12 h-12 text-star-gold mx-auto animate-pulse" />
              </motion.div>
            )}
            {combatState.phase === 'defeat' && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="text-center"
              >
                <div className="font-pixel text-2xl text-neon-pink mb-2">
                  {isSpanish ? 'DERROTA...' : 'DEFEAT...'}
                </div>
                <X className="w-12 h-12 text-neon-pink mx-auto" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Action Menu */}
      {isPlayerTurn && combatState.phase === 'player_select' && currentActor && (
        <div className="h-28 bg-card border-t-2 border-pixel-border p-2">
          <div className="text-[7px] font-pixel text-neon-cyan mb-1">
            {currentActor.name} - {isSpanish ? '¿Qué harás?' : 'What will you do?'}
          </div>
          
          {!targetMode ? (
            <div className="grid grid-cols-4 gap-1">
              <button
                onClick={() => handleSkillSelect(defaultSkills.basic_attack)}
                className="flex flex-col items-center p-1.5 bg-muted hover:bg-neon-pink/20 
                  rounded-sm border border-border hover:border-neon-pink transition-colors"
              >
                <Sword size={16} className="text-neon-pink mb-0.5" />
                <span className="text-[7px] font-pixel">{isSpanish ? 'Atacar' : 'Attack'}</span>
              </button>
              <button
                onClick={() => {
                  executeAction({ type: 'defend', actorId: currentActor.id });
                }}
                className="flex flex-col items-center p-1.5 bg-muted hover:bg-neon-cyan/20 
                  rounded-sm border border-border hover:border-neon-cyan transition-colors"
              >
                <Shield size={16} className="text-neon-cyan mb-0.5" />
                <span className="text-[7px] font-pixel">{isSpanish ? 'Defender' : 'Defend'}</span>
              </button>
              <button
                onClick={() => handleSkillSelect(defaultSkills.heal)}
                className="flex flex-col items-center p-1.5 bg-muted hover:bg-green-500/20 
                  rounded-sm border border-border hover:border-green-500 transition-colors"
              >
                <Heart size={16} className="text-green-500 mb-0.5" />
                <span className="text-[7px] font-pixel">{isSpanish ? 'Curar' : 'Heal'}</span>
              </button>
              <button
                onClick={() => handleSkillSelect(defaultSkills.fire_bolt)}
                className="flex flex-col items-center p-1.5 bg-muted hover:bg-orange-500/20 
                  rounded-sm border border-border hover:border-orange-500 transition-colors"
              >
                <Zap size={16} className="text-orange-500 mb-0.5" />
                <span className="text-[7px] font-pixel">{isSpanish ? 'Magia' : 'Magic'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-[8px] font-pixel text-star-gold">
                {isSpanish ? 'Selecciona un objetivo...' : 'Select a target...'}
              </div>
              <button
                onClick={() => {
                  setTargetMode(false);
                  setSelectedSkill(null);
                }}
                className="text-[7px] font-pixel text-neon-pink hover:underline"
              >
                {isSpanish ? 'Cancelar' : 'Cancel'}
              </button>
            </div>
          )}

          {/* Flee button */}
          {!targetMode && (
            <button
              onClick={() => executeAction({ type: 'flee', actorId: currentActor.id })}
              className="mt-1 w-full text-[7px] font-pixel text-muted-foreground hover:text-foreground"
            >
              {isSpanish ? '🏃 Huir' : '🏃 Flee'}
            </button>
          )}
        </div>
      )}

      {/* Enemy Turn Indicator */}
      {!isPlayerTurn && combatState.phase === 'enemy_select' && (
        <div className="h-28 bg-card border-t-2 border-pixel-border p-2 flex items-center justify-center">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="font-pixel text-neon-pink"
          >
            {currentActor?.name} {isSpanish ? 'está pensando...' : 'is thinking...'}
          </motion.div>
        </div>
      )}
    </div>
  );
};
