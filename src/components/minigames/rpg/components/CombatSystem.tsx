import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpriteRenderer } from './SpriteRenderer';
import { useSettings } from '@/contexts/SettingsContext';
import { CombatEngine } from '../systems/CombatEngine';
import { CombatState, CombatAction, Skill, defaultSkills } from '../types/CombatTypes';
import { Character } from '../types/GameTypes';
import { heroClasses, characterClassMap, classSkills } from '../data/heroClasses';

interface CombatSystemProps {
  playerParty: Character[];
  enemies: string[];
  onVictory: (exp: number, gold: number, items: string[]) => void;
  onDefeat: () => void;
  onFlee: () => void;
}

// Merge class skills into the available skills pool
const allSkills: Record<string, Skill> = { ...defaultSkills, ...classSkills };

export const CombatSystem: React.FC<CombatSystemProps> = ({
  playerParty,
  enemies,
  onVictory,
  onDefeat,
  onFlee,
}) => {
  const { language } = useSettings();
  const isSpanish = language === 'es';

  const [combatState, setCombatState] = useState<CombatState>(() =>
    CombatEngine.start(playerParty, enemies, isSpanish)
  );
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [targetMode, setTargetMode] = useState(false);
  const [activeMenu, setActiveMenu] = useState<'main' | 'skills' | 'items'>('main');
  const [damageNumbers, setDamageNumbers] = useState<Array<{ id: string; value: number; x: number; y: number; isHeal: boolean }>>([]);

  const dispatchAction = useCallback((action: CombatAction) => {
    setCombatState(prev => {
      if (action.type === 'flee') {
        const next = CombatEngine.act(prev, action, isSpanish);
        if (next.phase === 'victory' && action.type === 'flee') {
          setTimeout(() => onFlee(), 0);
          return prev;
        }
        return next;
      }
      const next = CombatEngine.act(prev, action, isSpanish);
      // Show damage numbers from animations
      if (next.animations.length > 0) {
        const newNums = next.animations.map(a => ({
          id: a.id,
          value: a.data?.damage || a.data?.heal || 0,
          x: 50 + Math.random() * 30,
          y: 20 + Math.random() * 20,
          isHeal: a.type === 'heal',
        }));
        setDamageNumbers(prev => [...prev, ...newNums]);
        setTimeout(() => setDamageNumbers(prev => prev.filter(n => !newNums.find(nn => nn.id === n.id))), 1500);
      }
      return next;
    });
    setSelectedSkill(null);
    setTargetMode(false);
    setActiveMenu('main');
  }, [isSpanish, onFlee]);

  const currentActor = useMemo(() => {
    const entry = combatState.timeline[combatState.currentActorIndex];
    if (!entry) return null;
    return [...combatState.playerParty, ...combatState.enemyParty].find(c => c.id === entry.characterId) || null;
  }, [combatState]);

  const isPlayerTurn = useMemo(() => {
    const entry = combatState.timeline[combatState.currentActorIndex];
    return entry?.isPlayer ?? false;
  }, [combatState]);

  // Enemy AI
  useEffect(() => {
    if (combatState.phase === 'enemy_select' && currentActor) {
      const timer = setTimeout(() => {
        const action = CombatEngine.getEnemyAction(combatState, currentActor.id);
        dispatchAction(action);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [combatState.phase, currentActor, combatState, dispatchAction]);

  // Victory/Defeat
  useEffect(() => {
    if (combatState.phase === 'victory') {
      const timer = setTimeout(() => {
        const rewards = CombatEngine.getRewards(enemies);
        onVictory(rewards.exp, rewards.gold, rewards.drops);
      }, 2500);
      return () => clearTimeout(timer);
    } else if (combatState.phase === 'defeat') {
      const timer = setTimeout(() => onDefeat(), 2500);
      return () => clearTimeout(timer);
    }
  }, [combatState.phase, enemies, onVictory, onDefeat]);

  const handleSkillSelect = (skill: Skill) => {
    setSelectedSkill(skill);
    if (skill.targetType === 'self' && currentActor) {
      dispatchAction({ type: 'skill', actorId: currentActor.id, targetId: currentActor.id, skillId: skill.id });
    } else {
      setTargetMode(true);
    }
  };

  const handleTargetSelect = (targetId: string) => {
    if (!selectedSkill || !currentActor) return;
    dispatchAction({
      type: selectedSkill.type === 'attack' || selectedSkill.type === 'magic' ? 'attack' : 'skill',
      actorId: currentActor.id,
      targetId,
      skillId: selectedSkill.id,
    });
  };

  // Get the current actor's class
  const currentActorClass = currentActor
    ? heroClasses[characterClassMap[currentActor.id]] || null
    : null;

  // Get actor's skills from their character data
  const actorSkills = useMemo(() => {
    if (!currentActor) return [];
    const char = playerParty.find(c => c.id === currentActor.id);
    if (!char?.skillIds) return [allSkills.basic_attack, allSkills.defend].filter(Boolean);
    return char.skillIds.map(id => allSkills[id] || defaultSkills[id]).filter(Boolean);
  }, [currentActor, playerParty]);

  const getHpPercent = (current: number, max: number) => Math.max(0, (current / max) * 100);
  const getHpColor = (percent: number) => percent > 50 ? '#22c55e' : percent > 25 ? '#eab308' : '#ef4444';

  // Latest log entry
  const latestLog = combatState.combatLog[combatState.combatLog.length - 1];

  return (
    <div className="absolute inset-0 bg-black flex flex-col">
      {/* Enemy display area - top half */}
      <div className="flex-1 relative flex items-center justify-center border-b-4 border-white/30 overflow-hidden">
        {/* Battle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-black" />
        
        {/* Grid lines for depth */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          transform: 'perspective(300px) rotateX(60deg)',
          transformOrigin: 'bottom',
        }} />

        {/* Enemies */}
        <div className="relative z-10 flex items-end justify-center gap-6">
          {combatState.enemyParty.map((enemy, idx) => (
            <motion.div
              key={enemy.id}
              initial={{ y: -40, opacity: 0 }}
              animate={{
                y: 0,
                opacity: enemy.stats.hp <= 0 ? 0.2 : 1,
                scale: enemy.stats.hp <= 0 ? 0.6 : 1,
              }}
              transition={{ delay: idx * 0.15, type: 'spring' }}
              className={`flex flex-col items-center ${
                targetMode && selectedSkill?.type !== 'heal' && enemy.stats.hp > 0
                  ? 'cursor-pointer'
                  : ''
              }`}
              onClick={() => {
                if (targetMode && selectedSkill?.type !== 'heal' && enemy.stats.hp > 0)
                  handleTargetSelect(enemy.id);
              }}
            >
              {/* Enemy sprite - larger */}
              <motion.div
                animate={targetMode && selectedSkill?.type !== 'heal' && enemy.stats.hp > 0 ? {
                  y: [0, -4, 0],
                } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
                className={`${targetMode && selectedSkill?.type !== 'heal' && enemy.stats.hp > 0 ? 'ring-2 ring-red-400 rounded-sm' : ''}`}
              >
                <SpriteRenderer sprite={enemy.sprite} size={8} />
              </motion.div>
              {/* Enemy name and HP */}
              <div className="mt-2 text-center">
                <p className="font-pixel text-[8px] text-white/80">{enemy.name}</p>
                <div className="w-16 h-1.5 bg-white/10 rounded-full mt-0.5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    initial={false}
                    animate={{
                      width: `${getHpPercent(enemy.stats.hp, enemy.stats.maxHp)}%`,
                      backgroundColor: getHpColor(getHpPercent(enemy.stats.hp, enemy.stats.maxHp)),
                    }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Damage numbers */}
        <AnimatePresence>
          {damageNumbers.map(num => (
            <motion.div
              key={num.id}
              initial={{ opacity: 1, y: `${num.y}%`, x: `${num.x}%`, scale: 0.5 }}
              animate={{ opacity: 0, y: `${num.y - 20}%`, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className={`absolute font-pixel text-lg ${num.isHeal ? 'text-green-400' : 'text-red-400'}`}
              style={{ textShadow: '2px 2px 0 black' }}
            >
              {num.isHeal ? '+' : '-'}{num.value}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Victory/Defeat overlay */}
        <AnimatePresence>
          {combatState.phase === 'victory' && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
              <div className="text-center">
                <motion.p
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="font-pixel text-3xl text-yellow-400"
                  style={{ textShadow: '0 0 20px rgba(234,179,8,0.5)' }}
                >
                  {isSpanish ? '¡VICTORIA!' : 'VICTORY!'}
                </motion.p>
                <p className="font-pixel text-xs text-white/60 mt-2">★ ★ ★</p>
              </div>
            </motion.div>
          )}
          {combatState.phase === 'defeat' && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="font-pixel text-2xl text-red-500"
              >
                {isSpanish ? 'DERROTA...' : 'DEFEAT...'}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom panel - Player info + actions (Undertale style) */}
      <div className="bg-black border-t-0">
        {/* Combat log */}
        <div className="h-10 border-b-2 border-white/20 px-3 flex items-center overflow-hidden">
          <AnimatePresence mode="wait">
            {latestLog ? (
              <motion.p
                key={latestLog.timestamp}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="font-pixel text-[9px] text-white/80 w-full"
              >
                <span className="text-yellow-400">* </span>
                {latestLog.actorName} {isSpanish ? 'usó' : 'used'} {latestLog.action}
                {latestLog.target && ` → ${latestLog.target}`}
                {latestLog.damage && <span className="text-red-400"> (-{latestLog.damage} HP)</span>}
                {latestLog.heal && <span className="text-green-400"> (+{latestLog.heal} HP)</span>}
              </motion.p>
            ) : (
              <p className="font-pixel text-[9px] text-white/40">
                <span className="text-yellow-400">* </span>
                {isSpanish ? 'El combate comienza...' : 'Combat begins...'}
              </p>
            )}
          </AnimatePresence>
        </div>

        {/* Player HP bars */}
        <div className="flex items-center gap-4 px-3 py-2 border-b-2 border-white/20">
          {combatState.playerParty.map((char) => {
            const hpPercent = getHpPercent(char.stats.hp, char.stats.maxHp);
            const isActive = currentActor?.id === char.id;
            const classColor = heroClasses[characterClassMap[char.id]]?.accentColor || '#fff';
            return (
              <div
                key={char.id}
                className={`flex items-center gap-2 ${
                  targetMode && selectedSkill?.type === 'heal' ? 'cursor-pointer hover:opacity-100' : ''
                } ${char.stats.hp <= 0 ? 'opacity-30' : isActive ? 'opacity-100' : 'opacity-60'}`}
                onClick={() => {
                  if (targetMode && selectedSkill?.type === 'heal' && char.stats.hp > 0)
                    handleTargetSelect(char.id);
                }}
              >
                <span className="font-pixel text-[9px]" style={{ color: isActive ? classColor : 'rgba(255,255,255,0.6)' }}>
                  {char.name}
                </span>
                <div className="flex items-center gap-1">
                  <span className="font-pixel text-[7px] text-white/40">HP</span>
                  <div className="w-16 h-2 bg-white/10 rounded-sm overflow-hidden border border-white/20">
                    <motion.div
                      className="h-full"
                      initial={false}
                      animate={{
                        width: `${hpPercent}%`,
                        backgroundColor: getHpColor(hpPercent),
                      }}
                    />
                  </div>
                  <span className="font-pixel text-[7px] text-white/50">
                    {char.stats.hp}/{char.stats.maxHp}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action buttons - Undertale style */}
        {isPlayerTurn && combatState.phase === 'player_select' && currentActor && (
          <div className="p-2">
            {activeMenu === 'main' && !targetMode && (
              <div className="flex items-center justify-center gap-2">
                {[
                  { label: isSpanish ? '⚔ LUCHAR' : '⚔ FIGHT', color: '#ef4444', action: () => {
                    const atkSkill = actorSkills.find(s => s.type === 'attack') || allSkills.basic_attack;
                    handleSkillSelect(atkSkill);
                  }},
                  { label: isSpanish ? '★ HAB.' : '★ SKILLS', color: '#eab308', action: () => setActiveMenu('skills') },
                  { label: isSpanish ? '🛡 DEFENDER' : '🛡 DEFEND', color: '#3b82f6', action: () => {
                    dispatchAction({ type: 'defend', actorId: currentActor.id });
                  }},
                  { label: isSpanish ? '✖ HUIR' : '✖ FLEE', color: '#a855f7', action: () => {
                    dispatchAction({ type: 'flee', actorId: currentActor.id });
                  }},
                ].map(btn => (
                  <motion.button
                    key={btn.label}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={btn.action}
                    className="px-3 py-2 font-pixel text-[9px] border-2 rounded-sm hover:bg-white/5 transition-colors min-w-[70px]"
                    style={{ borderColor: btn.color, color: btn.color }}
                  >
                    {btn.label}
                  </motion.button>
                ))}
              </div>
            )}

            {activeMenu === 'skills' && !targetMode && (
              <div className="space-y-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-pixel text-[8px] text-white/50">
                    {currentActorClass?.icon} {currentActor.name} - {isSpanish ? 'Habilidades' : 'Skills'}
                  </span>
                  <button
                    onClick={() => setActiveMenu('main')}
                    className="font-pixel text-[7px] text-red-400 hover:text-red-300"
                  >
                    {isSpanish ? '← Volver' : '← Back'}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                  {actorSkills.map(skill => (
                    <button
                      key={skill.id}
                      onClick={() => handleSkillSelect(skill)}
                      className="px-2 py-1.5 font-pixel text-[7px] text-left border border-white/20 rounded-sm 
                        hover:border-yellow-400 hover:bg-yellow-400/5 transition-colors"
                    >
                      <span className="text-yellow-300">{isSpanish ? skill.nameEs : skill.name}</span>
                      {skill.cost > 0 && (
                        <span className="text-white/30 ml-1">({skill.cost})</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {targetMode && (
              <div className="flex items-center justify-between">
                <p className="font-pixel text-[9px] text-yellow-400 animate-pulse">
                  <span className="text-white/50">* </span>
                  {isSpanish ? 'Selecciona un objetivo...' : 'Select a target...'}
                </p>
                <button
                  onClick={() => { setTargetMode(false); setSelectedSkill(null); setActiveMenu('main'); }}
                  className="font-pixel text-[8px] text-red-400 hover:text-red-300 border border-red-400/50 px-2 py-1 rounded-sm"
                >
                  {isSpanish ? 'Cancelar' : 'Cancel'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Enemy turn indicator */}
        {!isPlayerTurn && combatState.phase === 'enemy_select' && (
          <div className="p-3 flex items-center justify-center">
            <motion.p
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="font-pixel text-[10px] text-red-400"
            >
              {currentActor?.name} {isSpanish ? 'está atacando...' : 'is attacking...'}
            </motion.p>
          </div>
        )}
      </div>
    </div>
  );
};
