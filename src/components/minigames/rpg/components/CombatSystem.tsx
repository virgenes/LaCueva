import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpriteRenderer } from './SpriteRenderer';
import { ClassMinigame } from './ClassMinigame';
import { MonsterDodgeBox } from './MonsterDodgeBox';
import { useSettings } from '@/contexts/SettingsContext';
import { CombatEngine } from '../systems/CombatEngine';
import { CombatState, CombatAction, Skill, defaultSkills } from '../types/CombatTypes';
import { Character } from '../types/GameTypes';
import { heroClasses, characterClassMap, classSkills } from '../data/heroClasses';
import { monsterRegistry } from '../data/monsters';
import { getMonsterSpriteAsset, MonsterAnimState } from '../data/monsterSpriteAssets';
import { sfxAttack, sfxDamage, sfxHeal, sfxVictory, sfxDefeat, sfxSelect, sfxFlee } from '../systems/RPGAudioManager';

interface CombatSystemProps {
  playerParty: Character[];
  enemies: string[];
  onVictory: (exp: number, gold: number, items: string[]) => void;
  onDefeat: () => void;
  onFlee: () => void;
}

const allSkills: Record<string, Skill> = { ...defaultSkills, ...classSkills };

type CombatPhaseUI =
  | 'select_character'  // Pick which party member acts
  | 'select_action'     // FIGHT/SKILLS/DEF/FLEE
  | 'select_skill'      // Pick a skill
  | 'select_target'     // Pick enemy target
  | 'class_minigame'    // Player attack minigame
  | 'enemy_dodge'       // Monster attacks, player dodges
  | 'animating'         // Attack/result animation
  | 'victory'
  | 'defeat';

const MONSTER_SPRITE_SCALE = 2;

export const CombatSystem: React.FC<CombatSystemProps> = ({
  playerParty, enemies, onVictory, onDefeat, onFlee,
}) => {
  const { language } = useSettings();
  const isSpanish = language === 'es';

  const [combatState, setCombatState] = useState<CombatState>(() =>
    CombatEngine.start(playerParty, enemies, isSpanish)
  );
  const [uiPhase, setUiPhase] = useState<CombatPhaseUI>('select_character');
  const [selectedCharIdx, setSelectedCharIdx] = useState(0);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [attackingActorId, setAttackingActorId] = useState<string | null>(null);
  const [shakeTargetId, setShakeTargetId] = useState<string | null>(null);
  const [damageNumbers, setDamageNumbers] = useState<Array<{ id: string; value: number; x: number; y: number; isHeal: boolean }>>([]);
  const [monsterAnims, setMonsterAnims] = useState<Record<string, MonsterAnimState>>({});
  const [monsterFrames, setMonsterFrames] = useState<Record<string, number>>({});
  const [turnLog, setTurnLog] = useState<string>('');
  const turnCountRef = useRef(0);

  // Active character for actions
  const activeChar = combatState.playerParty[selectedCharIdx];
  const activeCharClass = activeChar ? characterClassMap[activeChar.id] : 'squire';

  // Get alive characters
  const alivePlayerChars = useMemo(() =>
    combatState.playerParty.filter(p => p.stats.hp > 0),
    [combatState.playerParty]
  );
  const aliveEnemies = useMemo(() =>
    combatState.enemyParty.filter(e => e.stats.hp > 0),
    [combatState.enemyParty]
  );

  // Skills for selected character
  const actorSkills = useMemo(() => {
    if (!activeChar) return [];
    const char = playerParty.find(c => c.id === activeChar.id);
    if (!char?.skillIds) return [allSkills.basic_attack, allSkills.defend].filter(Boolean);
    return char.skillIds.map(id => allSkills[id] || defaultSkills[id]).filter(Boolean);
  }, [activeChar, playerParty]);

  // Initialize monster animation states
  useEffect(() => {
    const anims: Record<string, MonsterAnimState> = {};
    const frames: Record<string, number> = {};
    combatState.enemyParty.forEach(e => {
      anims[e.id] = 'idle';
      frames[e.id] = 0;
    });
    setMonsterAnims(anims);
    setMonsterFrames(frames);
  }, []);

  // Animate monster sprite frames (only for slime)
  useEffect(() => {
    const interval = setInterval(() => {
      setMonsterFrames(prev => {
        const updated = { ...prev };
        combatState.enemyParty.forEach(enemy => {
          const monsterId = enemy.id.replace(/_\d+$/, '');
          
          // Only animate slime, keep others at frame 0
          if (monsterId !== 'slime') {
            updated[enemy.id] = 0;
            return;
          }
          
          const spriteAsset = getMonsterSpriteAsset(monsterId);
          if (!spriteAsset) return;

          const animState = monsterAnims[enemy.id] || 'idle';
          const animData = spriteAsset.animations[animState];
          const maxFrames = animData?.frames || 1;

          // Cycle through frames
          updated[enemy.id] = ((prev[enemy.id] || 0) + 1) % maxFrames;
        });
        return updated;
      });
    }, 150); // Update frame every 150ms (~6.7 FPS animation) - slower for smoother look

    return () => clearInterval(interval);
  }, [combatState.enemyParty, monsterAnims]);

  // Check victory/defeat
  useEffect(() => {
    if (combatState.phase === 'victory' || aliveEnemies.length === 0) {
      setUiPhase('victory');
      sfxVictory();
      const timer = setTimeout(() => {
        const rewards = CombatEngine.getRewards(enemies);
        onVictory(rewards.exp, rewards.gold, rewards.drops);
      }, 3000);
      return () => clearTimeout(timer);
    }
    if (combatState.phase === 'defeat' || alivePlayerChars.length === 0) {
      setUiPhase('defeat');
      sfxDefeat();
      const timer = setTimeout(() => onDefeat(), 3000);
      return () => clearTimeout(timer);
    }
  }, [combatState.phase, aliveEnemies.length, alivePlayerChars.length, enemies, onVictory, onDefeat]);

  // Apply damage with animations
  const applyAction = useCallback((action: CombatAction, damageMultiplier: number = 1) => {
    setUiPhase('animating');
    setAttackingActorId(action.actorId);
    sfxAttack();

    // Set monster to attack anim if it's being attacked
    if (action.targetId) {
      setMonsterAnims(prev => ({ ...prev, [action.targetId!]: 'attack' as MonsterAnimState }));
    }

    setTimeout(() => {
      if (action.targetId) {
        setShakeTargetId(action.targetId);
        sfxDamage();
      }

      setCombatState(prev => {
        // Modify action power based on minigame result
        const next = CombatEngine.act(prev, action, isSpanish);

        // Show damage numbers
        if (next.animations.length > 0) {
          const newNums = next.animations.map(a => ({
            id: a.id,
            value: Math.floor((a.data?.damage || a.data?.heal || 0) * damageMultiplier),
            x: 40 + Math.random() * 20,
            y: 15 + Math.random() * 15,
            isHeal: a.type === 'heal',
          }));
          if (next.animations.some(a => a.type === 'heal')) sfxHeal();
          setDamageNumbers(p => [...p, ...newNums]);
          setTimeout(() => setDamageNumbers(p => p.filter(n => !newNums.find(nn => nn.id === n.id))), 1800);
        }

        // Check if enemy died
        next.enemyParty.forEach(e => {
          if (e.stats.hp <= 0) {
            setMonsterAnims(p => ({ ...p, [e.id]: 'die' as MonsterAnimState }));
          }
        });

        return next;
      });

      setTimeout(() => {
        setShakeTargetId(null);
        setAttackingActorId(null);
        setMonsterAnims(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(k => {
            if (updated[k] === 'attack') updated[k] = 'idle';
          });
          return updated;
        });

        // After player action, trigger enemy turn
        turnCountRef.current++;
        triggerEnemyTurn();
      }, 600);
    }, 400);
  }, [isSpanish]);

  // Enemy turn - each enemy attacks with dodge box
  const enemyQueueRef = useRef<string[]>([]);

  const triggerEnemyTurn = useCallback(() => {
    const alive = combatState.enemyParty.filter(e => e.stats.hp > 0);
    if (alive.length === 0) return;

    // Queue all alive enemies
    enemyQueueRef.current = alive.map(e => e.id);
    processNextEnemy();
  }, [combatState.enemyParty]);

  const processNextEnemy = useCallback(() => {
    if (enemyQueueRef.current.length === 0) {
      // All enemies have attacked, back to player
      setUiPhase('select_character');
      setSelectedCharIdx(0);
      return;
    }

    const enemyId = enemyQueueRef.current.shift()!;
    const enemy = combatState.enemyParty.find(e => e.id === enemyId);
    if (!enemy || enemy.stats.hp <= 0) {
      processNextEnemy();
      return;
    }

    // Set monster attack animation
    setMonsterAnims(prev => ({ ...prev, [enemyId]: 'attack' as MonsterAnimState }));
    setAttackingActorId(enemyId);

    // Show dodge box
    setTurnLog(isSpanish ? `¡${enemy.name} ataca!` : `${enemy.name} attacks!`);
    setUiPhase('enemy_dodge');
  }, [combatState.enemyParty, isSpanish]);

  // Handle dodge box completion
  const handleDodgeComplete = useCallback((damageTaken: number) => {
    setMonsterAnims(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(k => {
        if (updated[k] === 'attack') updated[k] = 'idle';
      });
      return updated;
    });
    setAttackingActorId(null);

    if (damageTaken > 0) {
      // Distribute damage to a random alive player
      setCombatState(prev => {
        const updated = {
          ...prev,
          playerParty: prev.playerParty.map(p => ({ ...p, stats: { ...p.stats } })),
        };
        const alivePlayers = updated.playerParty.filter(p => p.stats.hp > 0);
        if (alivePlayers.length > 0) {
          const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
          target.stats.hp = Math.max(0, target.stats.hp - damageTaken);
          sfxDamage();

          // Add damage number
          setDamageNumbers(p => [...p, {
            id: `dodge_${Date.now()}`,
            value: damageTaken,
            x: 20 + Math.random() * 60,
            y: 70 + Math.random() * 10,
            isHeal: false,
          }]);
          setTimeout(() => setDamageNumbers(p => p.filter(n => !n.id.startsWith('dodge_'))), 1800);

          // Check defeat
          if (updated.playerParty.every(p => p.stats.hp <= 0)) {
            updated.phase = 'defeat';
          }
        }
        return updated;
      });
    }

    // Process next enemy
    setTimeout(() => processNextEnemy(), 300);
  }, [processNextEnemy]);

  // Handle class minigame result
  const handleMinigameResult = useCallback((success: boolean, score: number) => {
    if (!selectedSkill || !activeChar || !selectedTargetId) return;

    const damageMultiplier = success ? 1 + (score / 100) * 0.5 : 0.1; // Miss = 10% damage, perfect = 150%

    setTurnLog(
      success
        ? (isSpanish ? `¡${activeChar.name} acierta! (x${damageMultiplier.toFixed(1)})` : `${activeChar.name} hits! (x${damageMultiplier.toFixed(1)})`)
        : (isSpanish ? `${activeChar.name} falla...` : `${activeChar.name} misses...`)
    );

    const action: CombatAction = {
      type: 'attack',
      actorId: activeChar.id,
      targetId: selectedTargetId,
      skillId: selectedSkill.id,
    };

    applyAction(action, damageMultiplier);
  }, [selectedSkill, activeChar, selectedTargetId, isSpanish, applyAction]);

  // UI handlers
  const handleCharacterSelect = (idx: number) => {
    const char = combatState.playerParty[idx];
    if (!char || char.stats.hp <= 0) return;
    sfxSelect();
    setSelectedCharIdx(idx);
    setUiPhase('select_action');
  };

  const handleFight = () => {
    const atkSkill = actorSkills.find(s => s.type === 'attack') || allSkills.basic_attack;
    setSelectedSkill(atkSkill);
    sfxSelect();
    setUiPhase('select_target');
  };

  const handleSkillPick = (skill: Skill) => {
    sfxSelect();
    setSelectedSkill(skill);
    if (skill.targetType === 'self') {
      // Self-targeting skill: apply immediately
      applyAction({ type: 'skill', actorId: activeChar.id, targetId: activeChar.id, skillId: skill.id });
    } else if (skill.type === 'heal') {
      setUiPhase('select_target');
    } else {
      setUiPhase('select_target');
    }
  };

  const handleDefend = () => {
    sfxSelect();
    applyAction({ type: 'defend', actorId: activeChar.id });
  };

  const handleFlee = () => {
    sfxFlee();
    if (Math.random() > 0.5) {
      onFlee();
    } else {
      setTurnLog(isSpanish ? '¡No puedes huir!' : "Can't escape!");
      triggerEnemyTurn();
    }
  };

  const handleTargetSelect = (targetId: string) => {
    sfxSelect();
    setSelectedTargetId(targetId);

    if (selectedSkill?.type === 'heal') {
      // Heals don't need minigame
      applyAction({ type: 'skill', actorId: activeChar.id, targetId, skillId: selectedSkill.id });
    } else {
      // Go to class minigame
      setUiPhase('class_minigame');
    }
  };

  const getHpPercent = (c: number, m: number) => Math.max(0, (c / m) * 100);
  const getHpColor = (p: number) => p > 50 ? '#22c55e' : p > 25 ? '#eab308' : '#ef4444';

  // Get the current attacking enemy for dodge box
  const currentAttackingEnemy = useMemo(() => {
    if (uiPhase !== 'enemy_dodge') return null;
    const id = attackingActorId;
    if (!id) return null;
    const enemy = combatState.enemyParty.find(e => e.id === id);
    return enemy || null;
  }, [uiPhase, attackingActorId, combatState.enemyParty]);

  const currentAttackingMonsterId = useMemo(() => {
    if (!currentAttackingEnemy) return '';
    // Extract base monster id from combat id (e.g., "wolf_0" -> "wolf")
    return currentAttackingEnemy.id.replace(/_\d+$/, '');
  }, [currentAttackingEnemy]);

  return (
    <div className="absolute inset-0 bg-black flex flex-col select-none">
      {/* === TOP: Enemy Display === */}
      <div className="relative flex-shrink-0 border-b-2 border-white/20 overflow-hidden"
        style={{ height: uiPhase === 'enemy_dodge' || uiPhase === 'class_minigame' ? '65%' : '50%' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-black" />
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '30px 30px', transform: 'perspective(300px) rotateX(60deg)', transformOrigin: 'bottom',
        }} />

        {/* Enemies row */}
        {uiPhase !== 'enemy_dodge' && uiPhase !== 'class_minigame' && (
          <div className="relative z-10 flex items-center justify-center gap-4 h-full px-4">
            {combatState.enemyParty.map((enemy, idx) => {
              const monsterId = enemy.id.replace(/_\d+$/, '');
              const spriteAsset = getMonsterSpriteAsset(monsterId);
              const animState = monsterAnims[enemy.id] || 'idle';
              const isDead = enemy.stats.hp <= 0;

              return (
                <motion.div key={enemy.id}
                  initial={{ y: -30, opacity: 0 }}
                  animate={{
                    y: 0,
                    opacity: isDead ? 0.15 : 1,
                    scale: isDead ? 0.5 : shakeTargetId === enemy.id ? 1.1 : 1,
                    x: shakeTargetId === enemy.id ? [0, -6, 6, -4, 4, 0] : 0,
                  }}
                  transition={shakeTargetId === enemy.id ? { duration: 0.3 } : { delay: idx * 0.1, type: 'spring' }}
                  className={`flex flex-col items-center ${
                    uiPhase === 'select_target' && selectedSkill?.type !== 'heal' && !isDead
                      ? 'cursor-pointer'
                      : ''
                  }`}
                  onClick={() => {
                    if (uiPhase === 'select_target' && selectedSkill?.type !== 'heal' && !isDead)
                      handleTargetSelect(enemy.id);
                  }}
                >
                  {/* Target indicator */}
                  {uiPhase === 'select_target' && selectedSkill?.type !== 'heal' && !isDead && (
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.5, repeat: Infinity }}
                      className="text-red-400 font-pixel text-[8px] mb-1">▼</motion.div>
                  )}

                  {/* Monster sprite - use PNG if available */}
                  <div className="relative">
                    {spriteAsset ? (
                      (() => {
                        const { frameWidth, frameHeight, animations } = spriteAsset;
                        const scale = MONSTER_SPRITE_SCALE;
                        const animData = animations[animState];
                        const baseCol = animData?.col || 0;
                        const row = animData?.row || 0;
                        
                        // Get current animated frame
                        const currentFrame = monsterFrames[enemy.id] || 0;
                        const col = baseCol + currentFrame;
                        
                        // Calculate total spritesheet size based on max frames
                        // Most spritesheets have 6-8 columns and 3-4 rows
                        const maxCols = Math.max(...Object.values(animations).map(a => (a.col || 0) + (a.frames || 1)));
                        const maxRows = Math.max(...Object.values(animations).map(a => a.row)) + 1;
                        
                        return (
                          <div
                            className="pixelated"
                            style={{
                              width: `${frameWidth * scale}px`,
                              height: `${frameHeight * scale}px`,
                              imageRendering: 'pixelated',
                              backgroundImage: `url(${spriteAsset.src})`,
                              backgroundPosition: `-${col * frameWidth * scale}px -${row * frameHeight * scale}px`,
                              backgroundSize: `${frameWidth * maxCols * scale}px ${frameHeight * maxRows * scale}px`,
                              backgroundRepeat: 'no-repeat',
                              transition: 'none', // Prevent CSS transitions on background position
                              filter: isDead ? 'grayscale(1) brightness(0.3)' : undefined,
                            }}
                          />
                        );
                      })()
                    ) : (
                      <SpriteRenderer sprite={enemy.sprite} size={6} />
                    )}

                    {/* Attack flash */}
                    {attackingActorId === enemy.id && (
                      <motion.div className="absolute inset-0 bg-white/30 rounded"
                        animate={{ opacity: [0, 0.5, 0] }} transition={{ duration: 0.3 }} />
                    )}
                  </div>

                  <div className="mt-1 text-center">
                    <p className="font-pixel text-[7px] text-white/70">{enemy.name}</p>
                    <div className="w-14 h-1 bg-white/10 rounded-full mt-0.5 overflow-hidden">
                      <motion.div className="h-full rounded-full" initial={false}
                        animate={{
                          width: `${getHpPercent(enemy.stats.hp, enemy.stats.maxHp)}%`,
                          backgroundColor: getHpColor(getHpPercent(enemy.stats.hp, enemy.stats.maxHp)),
                        }} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Class Minigame (player attack phase) */}
        {uiPhase === 'class_minigame' && activeChar && (
          <div className="relative z-10 flex items-center justify-center h-full">
            <ClassMinigame
              classId={activeCharClass}
              characterName={activeChar.name}
              difficulty={1 + turnCountRef.current * 0.1}
              onComplete={handleMinigameResult}
            />
          </div>
        )}

        {/* Monster Dodge Box (enemy attack phase) */}
        {uiPhase === 'enemy_dodge' && currentAttackingEnemy && (
          <div className="relative z-10 flex items-center justify-center h-full">
            <MonsterDodgeBox
              monsterId={currentAttackingMonsterId}
              monsterName={currentAttackingEnemy.name}
              attackPower={currentAttackingEnemy.stats.attack}
              duration={4000 + turnCountRef.current * 200}
              onComplete={handleDodgeComplete}
            />
          </div>
        )}

        {/* Damage numbers floating */}
        <AnimatePresence>
          {damageNumbers.map(num => (
            <motion.div key={num.id}
              initial={{ opacity: 1, y: `${num.y}%`, x: `${num.x}%`, scale: 0.5 }}
              animate={{ opacity: 0, y: `${num.y - 25}%`, scale: 1.4 }}
              exit={{ opacity: 0 }} transition={{ duration: 1.5 }}
              className={`absolute font-pixel text-lg ${num.isHeal ? 'text-green-400' : 'text-red-400'}`}
              style={{ textShadow: '2px 2px 0 black, -1px -1px 0 black' }}>
              {num.isHeal ? '+' : '-'}{num.value}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Attack slash effect */}
        <AnimatePresence>
          {attackingActorId && combatState.playerParty.some(p => p.id === attackingActorId) && uiPhase === 'animating' && (
            <motion.div className="absolute z-30"
              initial={{ opacity: 0, scale: 0, rotate: -45 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 2, 2, 0], rotate: [-45, 45] }}
              exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
              style={{ left: '50%', top: '35%', transform: 'translate(-50%, -50%)' }}>
              <div className="w-20 h-1.5 bg-white rounded-full" style={{ boxShadow: '0 0 20px 6px rgba(255,255,255,0.7)' }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Victory / Defeat overlay */}
        <AnimatePresence>
          {uiPhase === 'victory' && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
              <div className="text-center">
                <motion.p animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity }}
                  className="font-pixel text-3xl text-yellow-400" style={{ textShadow: '0 0 25px rgba(234,179,8,0.6)' }}>
                  {isSpanish ? '¡VICTORIA!' : 'VICTORY!'}
                </motion.p>
                <p className="font-pixel text-xs text-white/60 mt-2">★ ★ ★</p>
              </div>
            </motion.div>
          )}
          {uiPhase === 'defeat' && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
              <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
                className="font-pixel text-2xl text-red-500">
                {isSpanish ? 'DERROTA...' : 'DEFEAT...'}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* === MIDDLE: Party Display + Log === */}
      <div className="flex-shrink-0 bg-black border-b-2 border-white/20">
        {/* Turn log */}
        <div className="h-6 px-3 flex items-center border-b border-white/10">
          <AnimatePresence mode="wait">
            <motion.p key={turnLog || 'init'} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="font-pixel text-[7px] text-white/70 w-full">
              <span className="text-yellow-400">* </span>
              {turnLog || (isSpanish ? 'Selecciona quién ataca...' : 'Select who attacks...')}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Party members row */}
        <div className="flex items-center gap-1 px-2 py-1 overflow-x-auto">
          {combatState.playerParty.map((char, idx) => {
            const hpPercent = getHpPercent(char.stats.hp, char.stats.maxHp);
            const classInfo = heroClasses[characterClassMap[char.id]];
            const isActive = selectedCharIdx === idx && (uiPhase === 'select_action' || uiPhase === 'select_skill' || uiPhase === 'select_target' || uiPhase === 'class_minigame');
            const isDead = char.stats.hp <= 0;
            const isSelectable = uiPhase === 'select_character' && !isDead;
            const isHealTarget = uiPhase === 'select_target' && selectedSkill?.type === 'heal' && !isDead;

            return (
              <motion.div key={char.id}
                className={`flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-sm border transition-all ${
                  isActive ? 'border-yellow-400 bg-yellow-400/10' :
                  isSelectable ? 'border-white/30 hover:border-white/60 cursor-pointer' :
                  isHealTarget ? 'border-green-400/50 hover:border-green-400 cursor-pointer' :
                  'border-white/10'
                } ${isDead ? 'opacity-25' : ''}`}
                whileHover={isSelectable || isHealTarget ? { scale: 1.02 } : {}}
                whileTap={isSelectable || isHealTarget ? { scale: 0.98 } : {}}
                onClick={() => {
                  if (isSelectable) handleCharacterSelect(idx);
                  if (isHealTarget) handleTargetSelect(char.id);
                }}
                animate={{
                  x: attackingActorId === char.id ? [0, 10, -5, 0] : 0,
                }}
              >
                {/* Class icon */}
                <span className="text-xs">{classInfo?.icon || '👤'}</span>
                <div className="min-w-0">
                  <p className="font-pixel text-[6px] truncate" style={{ color: isActive ? (classInfo?.accentColor || '#fff') : 'rgba(255,255,255,0.6)' }}>
                    {char.name}
                  </p>
                  <div className="flex items-center gap-1">
                    <div className="w-10 h-1 bg-white/10 rounded-sm overflow-hidden border border-white/15">
                      <motion.div className="h-full" initial={false}
                        animate={{ width: `${hpPercent}%`, backgroundColor: getHpColor(hpPercent) }} />
                    </div>
                    <span className="font-pixel text-[5px] text-white/40">{char.stats.hp}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* === BOTTOM: Action Menu === */}
      <div className="flex-1 bg-black px-2 py-1 flex flex-col justify-center min-h-[60px]">
        {/* Select character phase */}
        {uiPhase === 'select_character' && (
          <div className="text-center">
            <p className="font-pixel text-[9px] text-yellow-400 mb-1">
              {isSpanish ? '¿Quién ataca?' : 'Who attacks?'}
            </p>
            <p className="font-pixel text-[7px] text-white/40">
              {isSpanish ? 'Selecciona un personaje arriba' : 'Select a character above'}
            </p>
          </div>
        )}

        {/* Select action phase */}
        {uiPhase === 'select_action' && activeChar && (
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {[
              { label: isSpanish ? '⚔ LUCHAR' : '⚔ FIGHT', color: '#ef4444', action: handleFight },
              { label: isSpanish ? '★ HAB.' : '★ SKILLS', color: '#eab308', action: () => { sfxSelect(); setUiPhase('select_skill'); } },
              { label: isSpanish ? '🛡 DEF' : '🛡 DEF', color: '#3b82f6', action: handleDefend },
              { label: isSpanish ? '✖ HUIR' : '✖ FLEE', color: '#a855f7', action: handleFlee },
            ].map(btn => (
              <motion.button key={btn.label} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                onClick={btn.action}
                className="px-3 py-2 font-pixel text-[9px] border-2 rounded-sm hover:bg-white/5 transition-colors min-w-[65px]"
                style={{ borderColor: btn.color, color: btn.color }}>
                {btn.label}
              </motion.button>
            ))}
          </div>
        )}

        {/* Skills list */}
        {uiPhase === 'select_skill' && (
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-1">
              <span className="font-pixel text-[8px] text-white/50">{activeChar?.name}</span>
              <button onClick={() => { sfxSelect(); setUiPhase('select_action'); }}
                className="font-pixel text-[7px] text-red-400 hover:text-red-300">
                {isSpanish ? '← Volver' : '← Back'}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
              {actorSkills.filter(s => s.id !== 'defend').map(skill => (
                <button key={skill.id} onClick={() => handleSkillPick(skill)}
                  className="px-2 py-1.5 font-pixel text-[7px] text-left border border-white/20 rounded-sm hover:border-yellow-400 hover:bg-yellow-400/5 transition-colors">
                  <span className="text-yellow-300">{isSpanish ? skill.nameEs : skill.name}</span>
                  {skill.cost > 0 && <span className="text-white/30 ml-1">({skill.cost})</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Select target */}
        {uiPhase === 'select_target' && (
          <div className="flex items-center justify-between">
            <p className="font-pixel text-[9px] text-yellow-400 animate-pulse">
              <span className="text-white/50">* </span>
              {selectedSkill?.type === 'heal'
                ? (isSpanish ? 'Selecciona aliado a curar...' : 'Select ally to heal...')
                : (isSpanish ? 'Selecciona un enemigo...' : 'Select an enemy...')
              }
            </p>
            <button onClick={() => { sfxSelect(); setUiPhase('select_action'); setSelectedSkill(null); }}
              className="font-pixel text-[7px] text-red-400 hover:text-red-300 border border-red-400/50 px-2 py-1 rounded-sm">
              {isSpanish ? 'Cancelar' : 'Cancel'}
            </button>
          </div>
        )}

        {/* During minigame / dodge / animation */}
        {(uiPhase === 'class_minigame') && (
          <div className="text-center">
            <p className="font-pixel text-[9px] text-yellow-400 animate-pulse">
              {isSpanish ? '¡Completa el minijuego para atacar!' : 'Complete the minigame to attack!'}
            </p>
          </div>
        )}

        {uiPhase === 'enemy_dodge' && (
          <div className="text-center">
            <p className="font-pixel text-[9px] text-red-400 animate-pulse">
              {isSpanish ? '¡ESQUIVA los ataques enemigos!' : 'DODGE enemy attacks!'}
            </p>
          </div>
        )}

        {uiPhase === 'animating' && (
          <div className="text-center">
            <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity }}
              className="font-pixel text-[9px] text-white/50">
              {isSpanish ? 'Procesando...' : 'Processing...'}
            </motion.p>
          </div>
        )}
      </div>
    </div>
  );
};
