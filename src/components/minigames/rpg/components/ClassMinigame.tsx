import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

interface ClassMinigameProps {
  classId: string;
  characterName: string;
  difficulty: number;
  onComplete: (success: boolean, score: number) => void;
}

const BOX_W = 220;
const BOX_H = 180;
const TICK = 1000 / 30;

export const ClassMinigame: React.FC<ClassMinigameProps> = ({ classId, characterName, difficulty, onComplete }) => {
  const DURATION = 3500 + difficulty * 200;

  const handleEnd = useCallback((score: number) => {
    // Score >= 25 = success (more forgiving), damage scales with score
    const success = score >= 25;
    setTimeout(() => onComplete(success, score), 800);
  }, [onComplete]);

  const GameComponent = useMemo(() => {
    switch (classId) {
      case 'archer': return ArcherGame;
      case 'squire': return SquireGame;
      case 'warrior': return WarriorGame;
      case 'healer': return HealerGame;
      case 'shadow_blade': return ShadowBladeGame;
      case 'brawler': return BrawlerGame;
      default: return ArcherGame;
    }
  }, [classId]);

  return <GameComponent duration={DURATION} difficulty={difficulty} onEnd={handleEnd} />;
};

// ============ Shared types ============
interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

// ============ ARCHER: Precision Focus ============
const ArcherGame: React.FC<{ duration: number; difficulty: number; onEnd: (score: number) => void }> = ({ duration, difficulty, onEnd }) => {
  const reticleRef = useRef({ x: 110, y: 90 });
  const targetRef = useRef({ x: 110, y: 90 });
  const projectilesRef = useRef<Projectile[]>([]);
  const scoreRef = useRef(0);
  const angleRef = useRef(0);
  const frameRef = useRef(0);
  const startRef = useRef(Date.now());
  const resultSent = useRef(false);
  const keysRef = useRef<Set<string>>(new Set());

  const [renderTick, setRenderTick] = useState(0);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { keysRef.current.add(e.key.toLowerCase()); e.preventDefault(); e.stopPropagation(); };
    const up = (e: KeyboardEvent) => { keysRef.current.delete(e.key.toLowerCase()); };
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);
    return () => { window.removeEventListener('keydown', down, true); window.removeEventListener('keyup', up, true); };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      frameRef.current++;
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);

      if (remaining <= 0 && !resultSent.current) {
        resultSent.current = true;
        clearInterval(interval);
        onEnd(Math.min(100, Math.floor(scoreRef.current)));
        return;
      }

      // Move reticle
      const keys = keysRef.current;
      const spd = 4;
      if (keys.has('arrowup') || keys.has('w')) reticleRef.current.y = Math.max(10, reticleRef.current.y - spd);
      if (keys.has('arrowdown') || keys.has('s')) reticleRef.current.y = Math.min(170, reticleRef.current.y + spd);
      if (keys.has('arrowleft') || keys.has('a')) reticleRef.current.x = Math.max(10, reticleRef.current.x - spd);
      if (keys.has('arrowright') || keys.has('d')) reticleRef.current.x = Math.min(210, reticleRef.current.x + spd);

      // Move target in figure-8
      angleRef.current += 0.03 * difficulty;
      const t = angleRef.current;
      targetRef.current = { x: 110 + Math.sin(t) * 60, y: 90 + Math.sin(t * 2) * 40 };

      // Spawn obstacles
      if (frameRef.current % Math.max(8, Math.floor(20 / difficulty)) === 0) {
        const side = Math.floor(Math.random() * 4);
        let ox: number, oy: number, ovx: number, ovy: number;
        if (side === 0) { ox = Math.random() * 220; oy = -5; ovx = (Math.random() - 0.5) * 2; ovy = 2 + difficulty; }
        else if (side === 1) { ox = Math.random() * 220; oy = 185; ovx = (Math.random() - 0.5) * 2; ovy = -(2 + difficulty); }
        else if (side === 2) { ox = -5; oy = Math.random() * 180; ovx = 2 + difficulty; ovy = (Math.random() - 0.5) * 2; }
        else { ox = 225; oy = Math.random() * 180; ovx = -(2 + difficulty); ovy = (Math.random() - 0.5) * 2; }
        projectilesRef.current.push({ id: frameRef.current, x: ox, y: oy, vx: ovx, vy: ovy });
      }

      // Update obstacles & check collisions
      const r = reticleRef.current;
      const tgt = targetRef.current;
      const surviving: Projectile[] = [];
      for (const o of projectilesRef.current) {
        o.x += o.vx;
        o.y += o.vy;
        if (o.x < -20 || o.x > 240 || o.y < -20 || o.y > 200) continue;
        // Obstacle hits reticle
        if (Math.sqrt((o.x - r.x) ** 2 + (o.y - r.y) ** 2) < 14) {
          scoreRef.current = Math.max(0, scoreRef.current - 5);
          continue; // remove obstacle
        }
        surviving.push(o);
      }
      projectilesRef.current = surviving;

      // Check tracking
      const dist = Math.sqrt((r.x - tgt.x) ** 2 + (r.y - tgt.y) ** 2);
      if (dist < 25) {
        scoreRef.current = Math.min(100, scoreRef.current + 0.9);
      }

      setRenderTick(t => t + 1);
    }, TICK);
    return () => clearInterval(interval);
  }, [duration, difficulty, onEnd]);

  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const r = reticleRef.current;
  const tgt = targetRef.current;
  const hit = Math.sqrt((r.x - tgt.x) ** 2 + (r.y - tgt.y) ** 2) < 25;
  const timeLeft = Math.max(0, 100 - ((Date.now() - startRef.current) / duration) * 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="font-pixel text-[8px] text-green-400">🏹 {scoreRef.current >= 25 ? 'LOCKED ON' : 'AIM'} — {Math.floor(scoreRef.current)}%</div>
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden" style={{ width: 220 }}>
        <div className="h-full bg-green-400 transition-all" style={{ width: `${timeLeft}%` }} />
      </div>
      <div className="relative overflow-hidden" style={{ width: 220, height: 180, border: '2px solid #22c55e', backgroundColor: '#0a0a0a', touchAction: 'none' }}
        onTouchStart={(e) => { touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
        onTouchMove={(e) => {
          if (!touchRef.current) return;
          const dx = e.touches[0].clientX - touchRef.current.x;
          const dy = e.touches[0].clientY - touchRef.current.y;
          touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          reticleRef.current.x = Math.max(10, Math.min(210, reticleRef.current.x + dx * 0.7));
          reticleRef.current.y = Math.max(10, Math.min(170, reticleRef.current.y + dy * 0.7));
        }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `linear-gradient(transparent 49%, rgba(34,197,94,0.1) 50%, transparent 51%), linear-gradient(90deg, transparent 49%, rgba(34,197,94,0.1) 50%, transparent 51%)`,
          backgroundSize: '100% 100%',
          backgroundPosition: `${r.x}px ${r.y}px`,
        }} />
        <motion.div className="absolute" animate={{ scale: hit ? [1, 1.3, 1] : 1 }} transition={{ duration: 0.2 }}
          style={{ left: tgt.x - 10, top: tgt.y - 10, width: 20, height: 20, borderRadius: '50%',
            border: hit ? '2px solid #22c55e' : '2px solid #ef4444',
            backgroundColor: hit ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.2)',
          }} />
        {projectilesRef.current.map(o => (
          <div key={o.id} className="absolute rounded-full" style={{
            left: o.x - 4, top: o.y - 4, width: 8, height: 8,
            backgroundColor: '#ff4444', boxShadow: '0 0 4px #ff4444',
          }} />
        ))}
        <div className="absolute pointer-events-none" style={{ left: r.x - 12, top: r.y - 12, width: 24, height: 24 }}>
          <div className="absolute top-0 left-1/2 w-0.5 h-2" style={{ backgroundColor: '#22c55e', transform: 'translateX(-50%)' }} />
          <div className="absolute bottom-0 left-1/2 w-0.5 h-2" style={{ backgroundColor: '#22c55e', transform: 'translateX(-50%)' }} />
          <div className="absolute left-0 top-1/2 h-0.5 w-2" style={{ backgroundColor: '#22c55e', transform: 'translateY(-50%)' }} />
          <div className="absolute right-0 top-1/2 h-0.5 w-2" style={{ backgroundColor: '#22c55e', transform: 'translateY(-50%)' }} />
          <div className="absolute inset-[6px] border border-green-400/50 rounded-full" />
        </div>
      </div>
    </div>
  );
};

// ============ SQUIRE: Coverage Zone ============
// FIXED: Shield actually blocks projectiles using refs, not nested setState
const SquireGame: React.FC<{ duration: number; difficulty: number; onEnd: (score: number) => void }> = ({ duration, difficulty, onEnd }) => {
  const shieldXRef = useRef(110);
  const shieldWideRef = useRef(true);
  const projectilesRef = useRef<Projectile[]>([]);
  const vipHpRef = useRef(100);
  const blockedRef = useRef(0);
  const frameRef = useRef(0);
  const startRef = useRef(Date.now());
  const resultSent = useRef(false);
  const keysRef = useRef<Set<string>>(new Set());

  const [renderTick, setRenderTick] = useState(0);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { keysRef.current.add(e.key.toLowerCase()); e.preventDefault(); e.stopPropagation(); };
    const up = (e: KeyboardEvent) => { keysRef.current.delete(e.key.toLowerCase()); };
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);
    return () => { window.removeEventListener('keydown', down, true); window.removeEventListener('keyup', up, true); };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      frameRef.current++;
      const elapsed = Date.now() - startRef.current;
      if (elapsed >= duration && !resultSent.current) {
        resultSent.current = true;
        clearInterval(interval);
        onEnd(Math.min(100, Math.floor(vipHpRef.current)));
        return;
      }

      // Move shield
      const keys = keysRef.current;
      if (keys.has('arrowleft') || keys.has('a')) shieldXRef.current = Math.max(20, shieldXRef.current - 5);
      if (keys.has('arrowright') || keys.has('d')) shieldXRef.current = Math.min(200, shieldXRef.current + 5);
      shieldWideRef.current = !(keys.has(' ') || keys.has('arrowup') || keys.has('w'));

      // Spawn projectiles aimed at VIP (center)
      if (frameRef.current % Math.max(5, Math.floor(15 / difficulty)) === 0) {
        const angle = Math.random() * Math.PI * 2;
        const sx = 110 + Math.cos(angle) * 130;
        const sy = 90 + Math.sin(angle) * 110;
        const a = Math.atan2(90 - sy, 110 - sx);
        const spd = 2 + difficulty * 0.5;
        projectilesRef.current.push({ id: frameRef.current, x: sx, y: sy, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd });
      }

      // Update projectiles with REAL collision detection
      const sx = shieldXRef.current;
      const wide = shieldWideRef.current;
      const sw = wide ? 50 : 20;  // wider shield for better blocking
      const sh = wide ? 16 : 40;
      const shieldTop = 55;
      const shieldLeft = sx - sw / 2;
      const shieldRight = sx + sw / 2;
      const shieldBottom = shieldTop + sh;

      const surviving: Projectile[] = [];
      for (const p of projectilesRef.current) {
        p.x += p.vx;
        p.y += p.vy;

        // Out of bounds
        if (p.x < -10 || p.x > 230 || p.y < -10 || p.y > 190) continue;

        // Shield collision - AABB with generous hitbox
        if (p.x > shieldLeft - 4 && p.x < shieldRight + 4 && p.y > shieldTop - 4 && p.y < shieldBottom + 4) {
          blockedRef.current++;
          continue; // projectile destroyed by shield
        }

        // VIP hit (center area)
        if (Math.abs(p.x - 110) < 10 && Math.abs(p.y - 90) < 10) {
          vipHpRef.current = Math.max(0, vipHpRef.current - 4);
          continue;
        }

        surviving.push(p);
      }
      projectilesRef.current = surviving;

      setRenderTick(t => t + 1);
    }, TICK);
    return () => clearInterval(interval);
  }, [duration, difficulty, onEnd]);

  const touchRef = useRef<{ x: number } | null>(null);
  const timeLeft = Math.max(0, 100 - ((Date.now() - startRef.current) / duration) * 100);
  const sx = shieldXRef.current;
  const wide = shieldWideRef.current;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="font-pixel text-[8px] text-blue-400">🛡️ PROTECT VIP — HP: {Math.floor(vipHpRef.current)}% | Blocked: {blockedRef.current}</div>
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden" style={{ width: 220 }}>
        <div className="h-full bg-blue-400 transition-all" style={{ width: `${timeLeft}%` }} />
      </div>
      <div className="relative overflow-hidden" style={{ width: 220, height: 180, border: '2px solid #3b82f6', backgroundColor: '#0a0a0a', touchAction: 'none' }}
        onTouchStart={(e) => { touchRef.current = { x: e.touches[0].clientX }; }}
        onTouchMove={(e) => {
          if (!touchRef.current) return;
          const dx = e.touches[0].clientX - touchRef.current.x;
          touchRef.current = { x: e.touches[0].clientX };
          shieldXRef.current = Math.max(20, Math.min(200, shieldXRef.current + dx * 0.8));
        }}>

        {/* VIP in center */}
        <div className="absolute" style={{ left: 102, top: 82, width: 16, height: 16 }}>
          <div className="w-full h-full bg-yellow-400/30 rounded-full border border-yellow-400 animate-pulse" />
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 font-pixel text-[6px] text-yellow-400">VIP</div>
        </div>

        {/* Shield - uses refs directly */}
        <div className="absolute" style={{
          left: sx - (wide ? 25 : 10),
          top: 55,
          width: wide ? 50 : 20,
          height: wide ? 16 : 40,
          backgroundColor: '#3b82f6',
          border: '2px solid #60a5fa',
          borderRadius: 2,
          boxShadow: '0 0 10px rgba(59,130,246,0.6)',
          transition: 'left 0.05s, width 0.1s, height 0.1s',
        }} />

        {/* Shield hitbox visualization (debug helper, subtle) */}
        <div className="absolute pointer-events-none" style={{
          left: sx - (wide ? 29 : 14),
          top: 51,
          width: (wide ? 50 : 20) + 8,
          height: (wide ? 16 : 40) + 8,
          border: '1px dashed rgba(59,130,246,0.15)',
          borderRadius: 2,
        }} />

        {/* Projectiles */}
        {projectilesRef.current.map(p => (
          <div key={p.id} className="absolute rounded-full" style={{
            left: p.x - 3, top: p.y - 3, width: 6, height: 6,
            backgroundColor: '#ff4444', boxShadow: '0 0 3px #ff4444',
          }} />
        ))}
      </div>
      <div className="font-pixel text-[7px] text-white/40">←→ Mover | SPACE/↑: Escudo vertical</div>
    </div>
  );
};

// ============ WARRIOR: Fury Impulse ============
// FIXED: Better collision radii, less harsh penalties, ref-based physics
const WarriorGame: React.FC<{ duration: number; difficulty: number; onEnd: (score: number) => void }> = ({ duration, difficulty, onEnd }) => {
  const posRef = useRef({ x: 110, y: 90 });
  const furyRef = useRef(0);
  const projectilesRef = useRef<Projectile[]>([]);
  const frameRef = useRef(0);
  const startRef = useRef(Date.now());
  const resultSent = useRef(false);
  const keysRef = useRef<Set<string>>(new Set());

  const [renderTick, setRenderTick] = useState(0);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { keysRef.current.add(e.key.toLowerCase()); e.preventDefault(); e.stopPropagation(); };
    const up = (e: KeyboardEvent) => { keysRef.current.delete(e.key.toLowerCase()); };
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);
    return () => { window.removeEventListener('keydown', down, true); window.removeEventListener('keyup', up, true); };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      frameRef.current++;
      const elapsed = Date.now() - startRef.current;
      if (elapsed >= duration && !resultSent.current) {
        resultSent.current = true;
        clearInterval(interval);
        onEnd(Math.min(100, Math.floor(furyRef.current)));
        return;
      }

      const keys = keysRef.current;
      const spd = 3.5;
      if (keys.has('arrowup') || keys.has('w')) posRef.current.y = Math.max(8, posRef.current.y - spd);
      if (keys.has('arrowdown') || keys.has('s')) posRef.current.y = Math.min(172, posRef.current.y + spd);
      if (keys.has('arrowleft') || keys.has('a')) posRef.current.x = Math.max(8, posRef.current.x - spd);
      if (keys.has('arrowright') || keys.has('d')) posRef.current.x = Math.min(212, posRef.current.x + spd);

      // Spawn
      if (frameRef.current % Math.max(4, Math.floor(12 / difficulty)) === 0) {
        const angle = (frameRef.current * 0.3) % (Math.PI * 2);
        const sx = 110 + Math.cos(angle) * 120;
        const sy = 90 + Math.sin(angle) * 100;
        const a = Math.atan2(90 - sy, 110 - sx);
        const s = 1.5 + difficulty * 0.4;
        projectilesRef.current.push({ id: frameRef.current, x: sx, y: sy, vx: Math.cos(a) * s, vy: Math.sin(a) * s });
      }

      // Update projectiles
      const soul = posRef.current;
      const surviving: Projectile[] = [];
      for (const p of projectilesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10 || p.x > 230 || p.y < -10 || p.y > 190) continue;

        const dist = Math.sqrt((p.x - soul.x) ** 2 + (p.y - soul.y) ** 2);
        if (dist < 10) {
          // HIT - smaller penalty
          furyRef.current = Math.max(0, furyRef.current - 6);
          continue;
        } else if (dist < 30) {
          // PROXIMITY - charge fury (bigger radius = easier to charge)
          furyRef.current = Math.min(100, furyRef.current + 0.8);
        }
        surviving.push(p);
      }
      projectilesRef.current = surviving;

      setRenderTick(t => t + 1);
    }, TICK);
    return () => clearInterval(interval);
  }, [duration, difficulty, onEnd]);

  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const timeLeft = Math.max(0, 100 - ((Date.now() - startRef.current) / duration) * 100);
  const pos = posRef.current;
  const fury = furyRef.current;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="font-pixel text-[8px] text-red-400">⚔️ FURY: {Math.floor(fury)}%</div>
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden" style={{ width: 220 }}>
        <div className="h-full transition-all" style={{ width: `${fury}%`, backgroundColor: fury > 70 ? '#ef4444' : fury > 40 ? '#f97316' : '#666' }} />
      </div>
      <div className="relative overflow-hidden"
        style={{ width: 220, height: 180, border: `2px solid ${fury > 70 ? '#ef4444' : '#666'}`, backgroundColor: '#0a0a0a', touchAction: 'none' }}
        onTouchStart={(e) => { touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
        onTouchMove={(e) => {
          if (!touchRef.current) return;
          const dx = e.touches[0].clientX - touchRef.current.x;
          const dy = e.touches[0].clientY - touchRef.current.y;
          touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          posRef.current.x = Math.max(8, Math.min(212, posRef.current.x + dx * 0.7));
          posRef.current.y = Math.max(8, Math.min(172, posRef.current.y + dy * 0.7));
        }}>

        {/* Proximity circle */}
        <div className="absolute rounded-full border pointer-events-none" style={{
          left: pos.x - 30, top: pos.y - 30, width: 60, height: 60,
          borderColor: fury > 70 ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)',
          borderStyle: 'dashed',
        }} />

        {/* Danger zone circle */}
        <div className="absolute rounded-full pointer-events-none" style={{
          left: pos.x - 10, top: pos.y - 10, width: 20, height: 20,
          backgroundColor: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '50%',
        }} />

        {projectilesRef.current.map(p => (
          <div key={p.id} className="absolute rounded-full" style={{
            left: p.x - 4, top: p.y - 4, width: 8, height: 8,
            backgroundColor: '#ff2222', boxShadow: '0 0 4px #ff2222',
          }} />
        ))}

        {/* Soul */}
        <div className="absolute" style={{ left: pos.x - 5, top: pos.y - 5, width: 10, height: 10, zIndex: 10 }}>
          <div style={{ width: '100%', height: '100%', backgroundColor: '#ef4444', transform: 'rotate(45deg)', borderRadius: 1,
            boxShadow: fury > 70 ? '0 0 12px rgba(239,68,68,0.8)' : '0 0 4px rgba(239,68,68,0.4)' }} />
        </div>
      </div>
      <div className="font-pixel text-[6px] text-white/30">Acércate sin tocar para cargar FURIA</div>
    </div>
  );
};

// ============ HEALER: Soul Symphony ============
// FIXED: Ref-based physics, generous hitbox
const HealerGame: React.FC<{ duration: number; difficulty: number; onEnd: (score: number) => void }> = ({ duration, difficulty, onEnd }) => {
  const posRef = useRef({ x: 110, y: 90 });
  interface Note { id: number; x: number; y: number; vy: number; color: string; lane: number; }
  const notesRef = useRef<Note[]>([]);
  const healedRef = useRef(0);
  const missedRef = useRef(0);
  const frameRef = useRef(0);
  const startRef = useRef(Date.now());
  const resultSent = useRef(false);
  const keysRef = useRef<Set<string>>(new Set());

  const [renderTick, setRenderTick] = useState(0);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { keysRef.current.add(e.key.toLowerCase()); e.preventDefault(); e.stopPropagation(); };
    const up = (e: KeyboardEvent) => { keysRef.current.delete(e.key.toLowerCase()); };
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);
    return () => { window.removeEventListener('keydown', down, true); window.removeEventListener('keyup', up, true); };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      frameRef.current++;
      const elapsed = Date.now() - startRef.current;
      if (elapsed >= duration && !resultSent.current) {
        resultSent.current = true;
        clearInterval(interval);
        const total = healedRef.current + missedRef.current;
        onEnd(total > 0 ? Math.min(100, Math.floor((healedRef.current / Math.max(1, total)) * 100)) : 50);
        return;
      }

      const keys = keysRef.current;
      const spd = 4.5;
      if (keys.has('arrowup') || keys.has('w')) posRef.current.y = Math.max(8, posRef.current.y - spd);
      if (keys.has('arrowdown') || keys.has('s')) posRef.current.y = Math.min(172, posRef.current.y + spd);
      if (keys.has('arrowleft') || keys.has('a')) posRef.current.x = Math.max(8, posRef.current.x - spd);
      if (keys.has('arrowright') || keys.has('d')) posRef.current.x = Math.min(212, posRef.current.x + spd);

      // Spawn notes
      if (frameRef.current % Math.max(6, Math.floor(16 / difficulty)) === 0) {
        const lane = Math.floor(Math.random() * 5);
        const colors = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7'];
        notesRef.current.push({ id: frameRef.current, x: 22 + lane * 44, y: -5, vy: 1.5 + difficulty * 0.3, color: colors[lane], lane });
      }

      // Update notes
      const soul = posRef.current;
      const surviving: Note[] = [];
      for (const n of notesRef.current) {
        n.y += n.vy;
        // Soul intercept - generous 16px radius
        if (Math.sqrt((n.x - soul.x) ** 2 + (n.y - soul.y) ** 2) < 16) {
          healedRef.current++;
          continue;
        }
        if (n.y > 165) {
          missedRef.current++;
          continue;
        }
        surviving.push(n);
      }
      notesRef.current = surviving;

      setRenderTick(t => t + 1);
    }, TICK);
    return () => clearInterval(interval);
  }, [duration, difficulty, onEnd]);

  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const timeLeft = Math.max(0, 100 - ((Date.now() - startRef.current) / duration) * 100);
  const pos = posRef.current;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="font-pixel text-[8px] text-emerald-400">💚 INTERCEPTED: {healedRef.current} | MISSED: {missedRef.current}</div>
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden" style={{ width: 220 }}>
        <div className="h-full bg-emerald-400 transition-all" style={{ width: `${timeLeft}%` }} />
      </div>
      <div className="relative overflow-hidden"
        style={{ width: 220, height: 180, border: '2px solid #10b981', backgroundColor: '#0a0a0a', touchAction: 'none' }}
        onTouchStart={(e) => { touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
        onTouchMove={(e) => {
          if (!touchRef.current) return;
          const dx = e.touches[0].clientX - touchRef.current.x;
          const dy = e.touches[0].clientY - touchRef.current.y;
          touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          posRef.current.x = Math.max(8, Math.min(212, posRef.current.x + dx * 0.7));
          posRef.current.y = Math.max(8, Math.min(172, posRef.current.y + dy * 0.7));
        }}>

        {/* Ally strings at bottom */}
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="absolute" style={{
            left: 22 + i * 44 - 0.5, top: 0, width: 1, height: 180,
            backgroundColor: ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7'][i],
            opacity: 0.15,
          }} />
        ))}
        <div className="absolute bottom-0 left-0 right-0 h-3" style={{ background: 'linear-gradient(transparent, rgba(16,185,129,0.2))' }} />

        {notesRef.current.map(n => (
          <div key={n.id} className="absolute rounded-full" style={{
            left: n.x - 5, top: n.y - 5, width: 10, height: 10,
            backgroundColor: n.color, boxShadow: `0 0 6px ${n.color}`,
          }} />
        ))}

        {/* Soul with collection radius indicator */}
        <div className="absolute rounded-full pointer-events-none" style={{
          left: pos.x - 16, top: pos.y - 16, width: 32, height: 32,
          border: '1px solid rgba(16,185,129,0.15)',
        }} />
        <div className="absolute" style={{ left: pos.x - 5, top: pos.y - 5, width: 10, height: 10, zIndex: 10 }}>
          <div style={{ width: '100%', height: '100%', backgroundColor: '#10b981', transform: 'rotate(45deg)', borderRadius: 1,
            boxShadow: '0 0 8px rgba(16,185,129,0.6)' }} />
        </div>
      </div>
    </div>
  );
};

// ============ SHADOW BLADE: Blind Spot ============
// FIXED: All successful dodges count (not just invisible), better scoring
const ShadowBladeGame: React.FC<{ duration: number; difficulty: number; onEnd: (score: number) => void }> = ({ duration, difficulty, onEnd }) => {
  const posRef = useRef({ x: 110, y: 90 });
  const projectilesRef = useRef<Projectile[]>([]);
  const invisibleRef = useRef(false);
  const cooldownRef = useRef(0);
  const hitsRef = useRef(0);
  const totalProjectilesRef = useRef(0);
  const frameRef = useRef(0);
  const startRef = useRef(Date.now());
  const resultSent = useRef(false);
  const keysRef = useRef<Set<string>>(new Set());

  const [renderTick, setRenderTick] = useState(0);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if ((e.key === ' ' || e.key === 'Shift') && cooldownRef.current <= 0 && !invisibleRef.current) {
        invisibleRef.current = true;
        cooldownRef.current = 90;
        setTimeout(() => { invisibleRef.current = false; }, 1500);
      }
      e.preventDefault(); e.stopPropagation();
    };
    const up = (e: KeyboardEvent) => { keysRef.current.delete(e.key.toLowerCase()); };
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);
    return () => { window.removeEventListener('keydown', down, true); window.removeEventListener('keyup', up, true); };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      frameRef.current++;
      cooldownRef.current = Math.max(0, cooldownRef.current - 1);
      const elapsed = Date.now() - startRef.current;
      if (elapsed >= duration && !resultSent.current) {
        resultSent.current = true;
        clearInterval(interval);
        // Score = percentage of projectiles NOT hit by
        const total = totalProjectilesRef.current;
        const dodged = total - hitsRef.current;
        onEnd(total > 0 ? Math.min(100, Math.floor((dodged / Math.max(1, total)) * 100)) : 70);
        return;
      }

      const keys = keysRef.current;
      const spd = 4.5;
      if (keys.has('arrowup') || keys.has('w')) posRef.current.y = Math.max(8, posRef.current.y - spd);
      if (keys.has('arrowdown') || keys.has('s')) posRef.current.y = Math.min(172, posRef.current.y + spd);
      if (keys.has('arrowleft') || keys.has('a')) posRef.current.x = Math.max(8, posRef.current.x - spd);
      if (keys.has('arrowright') || keys.has('d')) posRef.current.x = Math.min(212, posRef.current.x + spd);

      // Spawn
      if (frameRef.current % Math.max(5, Math.floor(14 / difficulty)) === 0) {
        const side = Math.floor(Math.random() * 4);
        let sx: number, sy: number, svx: number, svy: number;
        const spd2 = 2 + difficulty * 0.5;
        if (side === 0) { sx = Math.random() * 220; sy = -5; svx = (Math.random() - 0.5) * 2; svy = spd2; }
        else if (side === 1) { sx = Math.random() * 220; sy = 185; svx = (Math.random() - 0.5) * 2; svy = -spd2; }
        else if (side === 2) { sx = -5; sy = Math.random() * 180; svx = spd2; svy = (Math.random() - 0.5) * 2; }
        else { sx = 225; sy = Math.random() * 180; svx = -spd2; svy = (Math.random() - 0.5) * 2; }
        projectilesRef.current.push({ id: frameRef.current, x: sx, y: sy, vx: svx, vy: svy });
        totalProjectilesRef.current++;
      }

      // Update projectiles
      const soul = posRef.current;
      const invisible = invisibleRef.current;
      const surviving: Projectile[] = [];
      for (const p of projectilesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -15 || p.x > 235 || p.y < -15 || p.y > 195) continue;

        const dist = Math.sqrt((p.x - soul.x) ** 2 + (p.y - soul.y) ** 2);
        if (dist < 10) {
          if (!invisible) {
            hitsRef.current++;
          }
          // Either way projectile is consumed
          continue;
        }
        surviving.push(p);
      }
      projectilesRef.current = surviving;

      setRenderTick(t => t + 1);
    }, TICK);
    return () => clearInterval(interval);
  }, [duration, difficulty, onEnd]);

  const timeLeft = Math.max(0, 100 - ((Date.now() - startRef.current) / duration) * 100);
  const pos = posRef.current;
  const invisible = invisibleRef.current;
  const cd = cooldownRef.current;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="font-pixel text-[8px] text-purple-400">🗡️ STEALTH {invisible ? '(INVISIBLE!)' : cd > 0 ? `(CD: ${Math.ceil(cd / 30)}s)` : '(SPACE)'} | Hits: {hitsRef.current}</div>
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden" style={{ width: 220 }}>
        <div className="h-full bg-purple-400 transition-all" style={{ width: `${timeLeft}%` }} />
      </div>
      <div className="relative overflow-hidden"
        style={{ width: 220, height: 180, border: '2px solid #8b5cf6', backgroundColor: '#050510', touchAction: 'none' }}
        onTouchStart={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          // Double tap to activate stealth
          if (cd <= 0 && !invisible) {
            invisibleRef.current = true;
            cooldownRef.current = 90;
            setTimeout(() => { invisibleRef.current = false; }, 1500);
          }
        }}
        onTouchMove={(e) => {
          posRef.current.x = Math.max(8, Math.min(212, 
            (e.touches[0].clientX - e.currentTarget.getBoundingClientRect().left) * (220 / e.currentTarget.getBoundingClientRect().width)));
          posRef.current.y = Math.max(8, Math.min(172,
            (e.touches[0].clientY - e.currentTarget.getBoundingClientRect().top) * (180 / e.currentTarget.getBoundingClientRect().height)));
        }}>

        {/* Darkness overlay with light radius */}
        <div className="absolute inset-0 pointer-events-none z-10" style={{
          background: `radial-gradient(circle ${invisible ? 15 : 50}px at ${pos.x}px ${pos.y}px, transparent 0%, rgba(0,0,0,0.92) 100%)`,
        }} />

        {projectilesRef.current.map(p => (
          <div key={p.id} className="absolute rounded-full" style={{
            left: p.x - 4, top: p.y - 4, width: 8, height: 8,
            backgroundColor: '#cc44ff', boxShadow: '0 0 4px #cc44ff',
          }} />
        ))}

        {!invisible && (
          <div className="absolute z-20" style={{ left: pos.x - 5, top: pos.y - 5, width: 10, height: 10 }}>
            <div style={{ width: '100%', height: '100%', backgroundColor: '#8b5cf6', transform: 'rotate(45deg)', borderRadius: 1,
              boxShadow: '0 0 8px rgba(139,92,246,0.6)' }} />
          </div>
        )}
      </div>
      <div className="font-pixel text-[6px] text-white/30">Esquiva en la oscuridad | SPACE: Invisibilidad</div>
    </div>
  );
};

// ============ BRAWLER: Guard Duel ============
// FIXED: Proper guard detection, attacks don't disappear on wrong guard, parry zone works correctly
const BrawlerGame: React.FC<{ duration: number; difficulty: number; onEnd: (score: number) => void }> = ({ duration, difficulty, onEnd }) => {
  const guardLaneRef = useRef(1);
  interface Attack { id: number; x: number; lane: number; speed: number; processed: boolean; }
  const attacksRef = useRef<Attack[]>([]);
  const advanceRef = useRef(0);
  const parriesRef = useRef(0);
  const hitsRef = useRef(0);
  const frameRef = useRef(0);
  const startRef = useRef(Date.now());
  const resultSent = useRef(false);
  const keysRef = useRef<Set<string>>(new Set());

  const [renderTick, setRenderTick] = useState(0);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      // Guard changes on key press
      if (e.key === 'ArrowUp' || e.key === 'w') guardLaneRef.current = 0;
      else if (e.key === 'ArrowDown' || e.key === 's') guardLaneRef.current = 2;
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'ArrowRight' || e.key === 'd') guardLaneRef.current = 1;
      e.preventDefault(); e.stopPropagation();
    };
    const up = (e: KeyboardEvent) => { keysRef.current.delete(e.key.toLowerCase()); };
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);
    return () => { window.removeEventListener('keydown', down, true); window.removeEventListener('keyup', up, true); };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      frameRef.current++;
      const elapsed = Date.now() - startRef.current;
      if (elapsed >= duration && !resultSent.current) {
        resultSent.current = true;
        clearInterval(interval);
        onEnd(Math.min(100, Math.floor(advanceRef.current)));
        return;
      }

      // Continuous guard from held keys
      const keys = keysRef.current;
      if (keys.has('arrowup') || keys.has('w')) guardLaneRef.current = 0;
      else if (keys.has('arrowdown') || keys.has('s')) guardLaneRef.current = 2;
      // Don't reset to mid if no key held — keep last position

      // Spawn attacks from right
      if (frameRef.current % Math.max(6, Math.floor(18 / difficulty)) === 0) {
        const lane = Math.floor(Math.random() * 3);
        attacksRef.current.push({ id: frameRef.current, x: 220, lane, speed: 3 + difficulty * 0.5, processed: false });
      }

      // Update attacks
      const gl = guardLaneRef.current;
      const surviving: Attack[] = [];
      for (const a of attacksRef.current) {
        a.x -= a.speed;

        // Out of screen left
        if (a.x < -10) continue;

        // Parry zone: x between 20-45 (wider window)
        if (!a.processed && a.x <= 45 && a.x > 20) {
          if (a.lane === gl) {
            // PARRY! Correct guard in parry zone
            parriesRef.current++;
            advanceRef.current = Math.min(100, advanceRef.current + 8);
            a.processed = true;
            continue; // destroy attack
          }
          // Wrong guard - attack passes through to hit zone
        }

        // Hit zone: attack reaches the player (x <= 20)
        if (!a.processed && a.x <= 20) {
          if (a.lane === gl) {
            // Late block - still counts as partial defense
            advanceRef.current = Math.min(100, advanceRef.current + 3);
          } else {
            // HIT - wrong guard
            hitsRef.current++;
            advanceRef.current = Math.max(0, advanceRef.current - 4);
          }
          a.processed = true;
          continue; // destroy
        }

        surviving.push(a);
      }
      attacksRef.current = surviving;

      setRenderTick(t => t + 1);
    }, TICK);
    return () => clearInterval(interval);
  }, [duration, difficulty, onEnd]);

  const timeLeft = Math.max(0, 100 - ((Date.now() - startRef.current) / duration) * 100);
  const laneLabels = ['HIGH', 'MID', 'LOW'];
  const laneY = [25, 80, 135];
  const gl = guardLaneRef.current;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="font-pixel text-[8px] text-orange-400">👊 PARRIES: {parriesRef.current} | ADVANCE: {Math.floor(advanceRef.current)}%</div>
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden" style={{ width: 220 }}>
        <div className="h-full bg-orange-400 transition-all" style={{ width: `${timeLeft}%` }} />
      </div>
      <div className="relative overflow-hidden"
        style={{ width: 220, height: 180, border: '2px solid #f97316', backgroundColor: '#0a0a0a', touchAction: 'none' }}
        onTouchStart={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const y = e.touches[0].clientY - rect.top;
          if (y < 60) guardLaneRef.current = 0;
          else if (y < 120) guardLaneRef.current = 1;
          else guardLaneRef.current = 2;
        }}
        onTouchMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const y = e.touches[0].clientY - rect.top;
          if (y < 60) guardLaneRef.current = 0;
          else if (y < 120) guardLaneRef.current = 1;
          else guardLaneRef.current = 2;
        }}>

        {/* Lane lines */}
        {[60, 120].map(y => (
          <div key={y} className="absolute left-0 right-0 h-px bg-white/10" style={{ top: y }} />
        ))}

        {/* Lane labels */}
        {laneLabels.map((label, i) => (
          <div key={label} className="absolute font-pixel text-[6px] text-white/20" style={{ left: 2, top: laneY[i] - 5 }}>{label}</div>
        ))}

        {/* Parry zone indicator (wider) */}
        <div className="absolute top-0 bottom-0" style={{ left: 20, width: 25, backgroundColor: 'rgba(249,115,22,0.08)', borderLeft: '1px solid rgba(249,115,22,0.3)', borderRight: '1px dashed rgba(249,115,22,0.15)' }} />

        {/* Guard position */}
        <div className="absolute" style={{
          left: 22, top: laneY[gl] - 14, width: 24, height: 28,
          backgroundColor: '#f97316', border: '2px solid #fb923c', borderRadius: 2,
          boxShadow: '0 0 10px rgba(249,115,22,0.5)',
          transition: 'top 0.05s',
        }}>
          <div className="w-full h-full flex items-center justify-center font-pixel text-[8px] text-white">🛡</div>
        </div>

        {/* Incoming attacks */}
        {attacksRef.current.map(a => (
          <div key={a.id} className="absolute" style={{
            left: a.x - 8, top: laneY[a.lane] - 8, width: 16, height: 16,
          }}>
            <div className="w-full h-full rounded bg-red-500" style={{ boxShadow: '0 0 6px rgba(239,68,68,0.6)' }}>
              <div className="w-full h-full flex items-center justify-center font-pixel text-[8px]">⚡</div>
            </div>
          </div>
        ))}

        {/* Advance bar at bottom */}
        <div className="absolute bottom-1 left-2 right-2 h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-orange-400 transition-all rounded-full" style={{ width: `${advanceRef.current}%` }} />
        </div>
      </div>
      <div className="font-pixel text-[6px] text-white/30">↑↓ Cambiar guardia | Bloquea en el momento justo</div>
    </div>
  );
};
