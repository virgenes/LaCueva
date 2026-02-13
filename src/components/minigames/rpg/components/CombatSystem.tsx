import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Shield, Sparkles, Heart, Zap, X } from 'lucide-react';
import { SpriteRenderer } from './SpriteRenderer';
import { useSettings } from '@/contexts/SettingsContext';
import { CombatEngine } from '../systems/CombatEngine';
import {
  CombatState,
  CombatAction,
  Skill,
  defaultSkills,
  defaultEnemies,
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

  // State initialized by CombatEngine
  const [combatState, setCombatState] = useState<CombatState>(() =>
    CombatEngine.start(playerParty, enemies, isSpanish)
  );
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [targetMode, setTargetMode] = useState(false);

  // Dispatch action through CombatEngine
  const dispatchAction = useCallback((action: CombatAction) => {
    setCombatState(prev => {
      if (action.type === 'flee') {
        // Handle flee specially — engine returns victory phase on success
        const next = CombatEngine.act(prev, action, isSpanish);
        if (next.phase === 'victory' && action.type === 'flee') {
          // It was a successful flee
          setTimeout(() => onFlee(), 0);
          return prev;
        }
        return next;
      }
      return CombatEngine.act(prev, action, isSpanish);
    });
    setSelectedSkill(null);
    setTargetMode(false);
  }, [isSpanish, onFlee]);

  // Current actor
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
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [combatState.phase, currentActor, combatState, dispatchAction]);

  // Victory/Defeat handlers
  useEffect(() => {
    if (combatState.phase === 'victory') {
      const timer = setTimeout(() => {
        const rewards = CombatEngine.getRewards(enemies);
        onVictory(rewards.exp, rewards.gold, []);
      }, 2000);
      return () => clearTimeout(timer);
    } else if (combatState.phase === 'defeat') {
      const timer = setTimeout(() => onDefeat(), 2000);
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

  const getHpBarWidth = (current: number, max: number) => `${Math.max(0, (current / max) * 100)}%`;

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
              <motion.div key={entry.characterId}
                initial={{ x: 0 }}
                animate={{ x: `${idx * 40}px`, scale: idx === combatState.currentActorIndex ? 1.2 : 1 }}
                className={`absolute w-6 h-6 rounded-sm border-2 flex items-center justify-center text-[8px] font-pixel
                  ${entry.isPlayer ? 'border-neon-cyan bg-neon-cyan/20' : 'border-neon-pink bg-neon-pink/20'}
                  ${idx === combatState.currentActorIndex ? 'ring-2 ring-star-gold' : ''}`}>
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
            <motion.div key={char.id}
              initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative p-1 rounded-sm border ${char.stats.hp <= 0 ? 'opacity-50 grayscale' : ''}
                ${targetMode && selectedSkill?.type === 'heal' ? 'cursor-pointer hover:ring-2 ring-green-400' : ''}`}
              onClick={() => { if (targetMode && selectedSkill?.type === 'heal') handleTargetSelect(char.id); }}>
              <div className="w-8 h-8 bg-muted rounded-sm flex items-center justify-center">
                <span className="text-lg">{char.name.charAt(0)}</span>
              </div>
              <div className="text-[6px] font-pixel text-center mt-0.5 truncate w-10">{char.name}</div>
              <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden mt-0.5">
                <motion.div className="h-full bg-green-500" initial={false}
                  animate={{ width: getHpBarWidth(char.stats.hp, char.stats.maxHp) }} />
              </div>
              <div className="text-[5px] text-center text-muted-foreground">{char.stats.hp}/{char.stats.maxHp}</div>
              {char.isDefending && <div className="absolute -top-1 -right-1"><Shield size={10} className="text-neon-cyan" /></div>}
            </motion.div>
          ))}
        </div>

        {/* Enemy Party */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 space-y-2">
          {combatState.enemyParty.map((enemy, idx) => (
            <motion.div key={enemy.id}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1, scale: enemy.stats.hp <= 0 ? 0.5 : 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative p-1 rounded-sm border ${enemy.stats.hp <= 0 ? 'opacity-30' : ''}
                ${targetMode && selectedSkill?.type !== 'heal' ? 'cursor-pointer hover:ring-2 ring-neon-pink' : ''}`}
              onClick={() => { if (targetMode && selectedSkill?.type !== 'heal' && enemy.stats.hp > 0) handleTargetSelect(enemy.id); }}>
              <div className="w-10 h-10"><SpriteRenderer sprite={enemy.sprite} size={5} /></div>
              <div className="text-[6px] font-pixel text-center mt-0.5 truncate w-12 text-neon-pink">{enemy.name}</div>
              <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden mt-0.5">
                <motion.div className="h-full bg-red-500" initial={false}
                  animate={{ width: getHpBarWidth(enemy.stats.hp, enemy.stats.maxHp) }} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Center Victory/Defeat */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <AnimatePresence>
            {combatState.phase === 'victory' && (
              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="text-center">
                <div className="font-pixel text-2xl text-star-gold mb-2">{isSpanish ? '¡VICTORIA!' : 'VICTORY!'}</div>
                <Sparkles className="w-12 h-12 text-star-gold mx-auto animate-pulse" />
              </motion.div>
            )}
            {combatState.phase === 'defeat' && (
              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="text-center">
                <div className="font-pixel text-2xl text-neon-pink mb-2">{isSpanish ? 'DERROTA...' : 'DEFEAT...'}</div>
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
              <button onClick={() => handleSkillSelect(defaultSkills.basic_attack)}
                className="flex flex-col items-center p-1.5 bg-muted hover:bg-neon-pink/20 rounded-sm border border-border hover:border-neon-pink transition-colors">
                <Sword size={16} className="text-neon-pink mb-0.5" />
                <span className="text-[7px] font-pixel">{isSpanish ? 'Atacar' : 'Attack'}</span>
              </button>
              <button onClick={() => dispatchAction({ type: 'defend', actorId: currentActor.id })}
                className="flex flex-col items-center p-1.5 bg-muted hover:bg-neon-cyan/20 rounded-sm border border-border hover:border-neon-cyan transition-colors">
                <Shield size={16} className="text-neon-cyan mb-0.5" />
                <span className="text-[7px] font-pixel">{isSpanish ? 'Defender' : 'Defend'}</span>
              </button>
              <button onClick={() => handleSkillSelect(defaultSkills.heal)}
                className="flex flex-col items-center p-1.5 bg-muted hover:bg-green-500/20 rounded-sm border border-border hover:border-green-500 transition-colors">
                <Heart size={16} className="text-green-500 mb-0.5" />
                <span className="text-[7px] font-pixel">{isSpanish ? 'Curar' : 'Heal'}</span>
              </button>
              <button onClick={() => handleSkillSelect(defaultSkills.fire_bolt)}
                className="flex flex-col items-center p-1.5 bg-muted hover:bg-orange-500/20 rounded-sm border border-border hover:border-orange-500 transition-colors">
                <Zap size={16} className="text-orange-500 mb-0.5" />
                <span className="text-[7px] font-pixel">{isSpanish ? 'Magia' : 'Magic'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-[8px] font-pixel text-star-gold">{isSpanish ? 'Selecciona un objetivo...' : 'Select a target...'}</div>
              <button onClick={() => { setTargetMode(false); setSelectedSkill(null); }}
                className="text-[7px] font-pixel text-neon-pink hover:underline">{isSpanish ? 'Cancelar' : 'Cancel'}</button>
            </div>
          )}
          {!targetMode && (
            <button onClick={() => dispatchAction({ type: 'flee', actorId: currentActor.id })}
              className="mt-1 w-full text-[7px] font-pixel text-muted-foreground hover:text-foreground">
              {isSpanish ? '🏃 Huir' : '🏃 Flee'}
            </button>
          )}
        </div>
      )}

      {/* Enemy Turn */}
      {!isPlayerTurn && combatState.phase === 'enemy_select' && (
        <div className="h-28 bg-card border-t-2 border-pixel-border p-2 flex items-center justify-center">
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }}
            className="font-pixel text-neon-pink">
            {currentActor?.name} {isSpanish ? 'está pensando...' : 'is thinking...'}
          </motion.div>
        </div>
      )}
    </div>
  );
};
