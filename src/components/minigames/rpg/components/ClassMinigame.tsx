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
    const success = score >= 50;
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

// ============ ARCHER: Precision Focus ============
// Keep reticle over moving target while dodging interference
const ArcherGame: React.FC<{ duration: number; difficulty: number; onEnd: (score: number) => void }> = ({ duration, difficulty, onEnd }) => {
  const [reticle, setReticle] = useState({ x: 110, y: 90 });
  const [target, setTarget] = useState({ x: 110, y: 90 });
  const [obstacles, setObstacles] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number }>>([]);
  const [timeLeft, setTimeLeft] = useState(100);
  const [trackScore, setTrackScore] = useState(0);
  const [hit, setHit] = useState(false);
  const keysRef = useRef<Set<string>>(new Set());
  const frameRef = useRef(0);
  const startRef = useRef(Date.now());
  const targetAngleRef = useRef(0);
  const resultSent = useRef(false);

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
      setTimeLeft(remaining);

      if (remaining <= 0 && !resultSent.current) {
        resultSent.current = true;
        clearInterval(interval);
        onEnd(Math.min(100, Math.floor(trackScore)));
        return;
      }

      // Move reticle
      const keys = keysRef.current;
      const spd = 4;
      let dx = 0, dy = 0;
      if (keys.has('arrowup') || keys.has('w')) dy -= spd;
      if (keys.has('arrowdown') || keys.has('s')) dy += spd;
      if (keys.has('arrowleft') || keys.has('a')) dx -= spd;
      if (keys.has('arrowright') || keys.has('d')) dx += spd;
      setReticle(prev => ({
        x: Math.max(10, Math.min(210, prev.x + dx)),
        y: Math.max(10, Math.min(170, prev.y + dy)),
      }));

      // Move target in figure-8 pattern
      targetAngleRef.current += 0.03 * difficulty;
      const t = targetAngleRef.current;
      setTarget({
        x: 110 + Math.sin(t) * 60,
        y: 90 + Math.sin(t * 2) * 40,
      });

      // Spawn obstacles
      if (frameRef.current % Math.max(8, Math.floor(20 / difficulty)) === 0) {
        const side = Math.floor(Math.random() * 4);
        let ox, oy, ovx, ovy;
        if (side === 0) { ox = Math.random() * 220; oy = -5; ovx = (Math.random() - 0.5) * 2; ovy = 2 + difficulty; }
        else if (side === 1) { ox = Math.random() * 220; oy = 185; ovx = (Math.random() - 0.5) * 2; ovy = -(2 + difficulty); }
        else if (side === 2) { ox = -5; oy = Math.random() * 180; ovx = 2 + difficulty; ovy = (Math.random() - 0.5) * 2; }
        else { ox = 225; oy = Math.random() * 180; ovx = -(2 + difficulty); ovy = (Math.random() - 0.5) * 2; }
        setObstacles(prev => [...prev, { id: frameRef.current, x: ox!, y: oy!, vx: ovx!, vy: ovy! }]);
      }

      // Update obstacles
      setObstacles(prev =>
        prev
          .map(o => ({ ...o, x: o.x + o.vx, y: o.y + o.vy }))
          .filter(o => o.x > -20 && o.x < 240 && o.y > -20 && o.y < 200)
      );

      // Check tracking (reticle on target)
      setReticle(r => {
        setTarget(tgt => {
          const dist = Math.sqrt((r.x - tgt.x) ** 2 + (r.y - tgt.y) ** 2);
          if (dist < 20) {
            setTrackScore(s => Math.min(100, s + 0.8));
            setHit(true);
          } else {
            setHit(false);
          }
          return tgt;
        });
        return r;
      });

      // Check obstacle collision with reticle
      setObstacles(prev => {
        setReticle(r => {
          for (const o of prev) {
            if (Math.sqrt((o.x - r.x) ** 2 + (o.y - r.y) ** 2) < 12) {
              setTrackScore(s => Math.max(0, s - 8));
            }
          }
          return r;
        });
        return prev;
      });
    }, TICK);
    return () => clearInterval(interval);
  }, [duration, difficulty, onEnd, trackScore]);

  // Touch
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => { touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const dx = e.touches[0].clientX - touchRef.current.x;
    const dy = e.touches[0].clientY - touchRef.current.y;
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setReticle(prev => ({
      x: Math.max(10, Math.min(210, prev.x + dx * 0.7)),
      y: Math.max(10, Math.min(170, prev.y + dy * 0.7)),
    }));
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="font-pixel text-[8px] text-green-400">🏹 {trackScore >= 50 ? 'LOCKED ON' : 'AIM'} — {Math.floor(trackScore)}%</div>
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden" style={{ width: 220 }}>
        <div className="h-full bg-green-400 transition-all" style={{ width: `${timeLeft}%` }} />
      </div>
      <div className="relative overflow-hidden" style={{ width: 220, height: 180, border: '2px solid #22c55e', backgroundColor: '#0a0a0a', touchAction: 'none' }}
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}>

        {/* Scope lines */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `linear-gradient(transparent 49%, rgba(34,197,94,0.1) 50%, transparent 51%), linear-gradient(90deg, transparent 49%, rgba(34,197,94,0.1) 50%, transparent 51%)`,
          backgroundSize: '100% 100%',
          backgroundPosition: `${reticle.x}px ${reticle.y}px`,
        }} />

        {/* Target (weak point) */}
        <motion.div className="absolute" animate={{ scale: hit ? [1, 1.3, 1] : 1 }} transition={{ duration: 0.2 }}
          style={{ left: target.x - 8, top: target.y - 8, width: 16, height: 16, borderRadius: '50%',
            border: hit ? '2px solid #22c55e' : '2px solid #ef4444',
            backgroundColor: hit ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.2)',
          }} />

        {/* Obstacles */}
        {obstacles.map(o => (
          <div key={o.id} className="absolute rounded-full" style={{
            left: o.x - 4, top: o.y - 4, width: 8, height: 8,
            backgroundColor: '#ff4444', boxShadow: '0 0 4px #ff4444',
          }} />
        ))}

        {/* Reticle (crosshair) */}
        <div className="absolute pointer-events-none" style={{ left: reticle.x - 12, top: reticle.y - 12, width: 24, height: 24 }}>
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
// Protect VIP by moving shield wall to block incoming projectiles
const SquireGame: React.FC<{ duration: number; difficulty: number; onEnd: (score: number) => void }> = ({ duration, difficulty, onEnd }) => {
  const [shieldX, setShieldX] = useState(110);
  const [shieldWide, setShieldWide] = useState(true); // true = wide+short, false = tall+narrow
  const [projectiles, setProjectiles] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number }>>([]);
  const [vipHp, setVipHp] = useState(100);
  const [blocked, setBlocked] = useState(0);
  const keysRef = useRef<Set<string>>(new Set());
  const frameRef = useRef(0);
  const startRef = useRef(Date.now());
  const resultSent = useRef(false);

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
        onEnd(Math.min(100, Math.floor(vipHp)));
        return;
      }

      // Move shield
      const keys = keysRef.current;
      if (keys.has('arrowleft') || keys.has('a')) setShieldX(x => Math.max(20, x - 4));
      if (keys.has('arrowright') || keys.has('d')) setShieldX(x => Math.min(200, x + 4));
      if (keys.has(' ') || keys.has('arrowup') || keys.has('w')) setShieldWide(false);
      else setShieldWide(true);

      // Spawn projectiles aimed at center VIP
      if (frameRef.current % Math.max(5, Math.floor(15 / difficulty)) === 0) {
        const angle = Math.random() * Math.PI * 2;
        const sx = 110 + Math.cos(angle) * 130;
        const sy = 90 + Math.sin(angle) * 110;
        const a = Math.atan2(90 - sy, 110 - sx);
        const spd = 2 + difficulty * 0.5;
        setProjectiles(prev => [...prev, { id: frameRef.current, x: sx, y: sy, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd }]);
      }

      // Update projectiles
      setProjectiles(prev => {
        const updated = prev.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy }));
        const remaining: typeof updated = [];

        for (const p of updated) {
          if (p.x < -10 || p.x > 230 || p.y < -10 || p.y > 190) continue;

          // Check shield collision
          setShieldX(sx => {
            const sw = shieldWide ? 40 : 16;
            const sh = shieldWide ? 12 : 35;
            const sy = 60;
            if (p.x > sx - sw / 2 && p.x < sx + sw / 2 && p.y > sy && p.y < sy + sh) {
              setBlocked(b => b + 1);
              return sx;
            }
            return sx;
          });

          // Check VIP hit (center area)
          if (Math.abs(p.x - 110) < 8 && Math.abs(p.y - 90) < 8) {
            setVipHp(h => Math.max(0, h - 5));
            continue;
          }

          remaining.push(p);
        }
        return remaining;
      });
    }, TICK);
    return () => clearInterval(interval);
  }, [duration, difficulty, onEnd, shieldWide, vipHp]);

  const timeLeft = Math.max(0, 100 - ((Date.now() - startRef.current) / duration) * 100);

  const touchRef = useRef<{ x: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => { touchRef.current = { x: e.touches[0].clientX }; };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const dx = e.touches[0].clientX - touchRef.current.x;
    touchRef.current = { x: e.touches[0].clientX };
    setShieldX(x => Math.max(20, Math.min(200, x + dx * 0.7)));
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="font-pixel text-[8px] text-blue-400">🛡️ PROTECT VIP — HP: {Math.floor(vipHp)}%</div>
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden" style={{ width: 220 }}>
        <div className="h-full bg-blue-400 transition-all" style={{ width: `${timeLeft}%` }} />
      </div>
      <div className="relative overflow-hidden" style={{ width: 220, height: 180, border: '2px solid #3b82f6', backgroundColor: '#0a0a0a', touchAction: 'none' }}
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}>

        {/* VIP in center */}
        <div className="absolute" style={{ left: 102, top: 82, width: 16, height: 16 }}>
          <div className="w-full h-full bg-yellow-400/30 rounded-full border border-yellow-400 animate-pulse" />
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 font-pixel text-[6px] text-yellow-400">VIP</div>
        </div>

        {/* Shield */}
        <motion.div className="absolute" animate={{ x: shieldX - (shieldWide ? 20 : 8) }}
          style={{
            top: 60,
            width: shieldWide ? 40 : 16,
            height: shieldWide ? 12 : 35,
            backgroundColor: '#3b82f6',
            border: '2px solid #60a5fa',
            borderRadius: 2,
            boxShadow: '0 0 8px rgba(59,130,246,0.5)',
          }} />

        {/* Projectiles */}
        {projectiles.map(p => (
          <div key={p.id} className="absolute rounded-full" style={{
            left: p.x - 3, top: p.y - 3, width: 6, height: 6,
            backgroundColor: '#ff4444', boxShadow: '0 0 3px #ff4444',
          }} />
        ))}
      </div>
      <div className="font-pixel text-[7px] text-white/40">SPACE: Cambiar forma del escudo</div>
    </div>
  );
};

// ============ WARRIOR: Fury Impulse ============
// Stay close to projectiles without touching to charge fury bar
const WarriorGame: React.FC<{ duration: number; difficulty: number; onEnd: (score: number) => void }> = ({ duration, difficulty, onEnd }) => {
  const posRef = useRef({ x: 110, y: 90 });
  const [pos, setPos] = useState({ x: 110, y: 90 });
  const [fury, setFury] = useState(0);
  const [projectiles, setProjectiles] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number }>>([]);
  const [dmg, setDmg] = useState(0);
  const keysRef = useRef<Set<string>>(new Set());
  const frameRef = useRef(0);
  const startRef = useRef(Date.now());
  const resultSent = useRef(false);

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
        onEnd(Math.min(100, Math.floor(fury)));
        return;
      }

      const keys = keysRef.current;
      const spd = 3.5;
      let dx = 0, dy = 0;
      if (keys.has('arrowup') || keys.has('w')) dy -= spd;
      if (keys.has('arrowdown') || keys.has('s')) dy += spd;
      if (keys.has('arrowleft') || keys.has('a')) dx -= spd;
      if (keys.has('arrowright') || keys.has('d')) dx += spd;
      posRef.current.x = Math.max(8, Math.min(212, posRef.current.x + dx));
      posRef.current.y = Math.max(8, Math.min(172, posRef.current.y + dy));
      setPos({ ...posRef.current });

      // Spawn
      if (frameRef.current % Math.max(4, Math.floor(12 / difficulty)) === 0) {
        const angle = (frameRef.current * 0.3) % (Math.PI * 2);
        const sx = 110 + Math.cos(angle) * 120;
        const sy = 90 + Math.sin(angle) * 100;
        const a = Math.atan2(90 - sy, 110 - sx);
        const s = 1.5 + difficulty * 0.4;
        setProjectiles(prev => [...prev, { id: frameRef.current, x: sx, y: sy, vx: Math.cos(a) * s, vy: Math.sin(a) * s }]);
      }

      setProjectiles(prev => {
        const updated = prev.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy }))
          .filter(p => p.x > -10 && p.x < 230 && p.y > -10 && p.y < 190);

        const soul = posRef.current;
        for (const p of updated) {
          const dist = Math.sqrt((p.x - soul.x) ** 2 + (p.y - soul.y) ** 2);
          if (dist < 8) {
            setDmg(d => d + 5);
            setFury(f => Math.max(0, f - 10));
            p.x = -100;
          } else if (dist < 25) {
            setFury(f => Math.min(100, f + 0.6));
          }
        }
        return updated.filter(p => p.x > -50);
      });
    }, TICK);
    return () => clearInterval(interval);
  }, [duration, difficulty, onEnd, fury]);

  const timeLeft = Math.max(0, 100 - ((Date.now() - startRef.current) / duration) * 100);

  const touchRef = useRef<{ x: number; y: number } | null>(null);

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

        {/* Fury circle (shrinking) */}
        <div className="absolute rounded-full border pointer-events-none" style={{
          left: 110 - 60 + fury * 0.3, top: 90 - 50 + fury * 0.25,
          width: 120 - fury * 0.6, height: 100 - fury * 0.5,
          borderColor: fury > 70 ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)',
        }} />

        {projectiles.map(p => (
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
// Intercept falling notes before they hit ally strings
const HealerGame: React.FC<{ duration: number; difficulty: number; onEnd: (score: number) => void }> = ({ duration, difficulty, onEnd }) => {
  const posRef = useRef({ x: 110, y: 90 });
  const [pos, setPos] = useState({ x: 110, y: 90 });
  const [notes, setNotes] = useState<Array<{ id: number; x: number; y: number; vy: number; color: string; lane: number }>>([]);
  const [healed, setHealed] = useState(0);
  const [missed, setMissed] = useState(0);
  const keysRef = useRef<Set<string>>(new Set());
  const frameRef = useRef(0);
  const startRef = useRef(Date.now());
  const resultSent = useRef(false);

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
        const total = healed + missed;
        onEnd(total > 0 ? Math.min(100, Math.floor((healed / Math.max(1, total)) * 100)) : 50);
        return;
      }

      const keys = keysRef.current;
      const spd = 4;
      let dx = 0, dy = 0;
      if (keys.has('arrowup') || keys.has('w')) dy -= spd;
      if (keys.has('arrowdown') || keys.has('s')) dy += spd;
      if (keys.has('arrowleft') || keys.has('a')) dx -= spd;
      if (keys.has('arrowright') || keys.has('d')) dx += spd;
      posRef.current.x = Math.max(8, Math.min(212, posRef.current.x + dx));
      posRef.current.y = Math.max(8, Math.min(172, posRef.current.y + dy));
      setPos({ ...posRef.current });

      // Spawn notes
      if (frameRef.current % Math.max(6, Math.floor(16 / difficulty)) === 0) {
        const lane = Math.floor(Math.random() * 5);
        const colors = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7'];
        setNotes(prev => [...prev, {
          id: frameRef.current,
          x: 22 + lane * 44,
          y: -5,
          vy: 1.5 + difficulty * 0.3,
          color: colors[lane],
          lane,
        }]);
      }

      // Update notes
      setNotes(prev => {
        const updated = prev.map(n => ({ ...n, y: n.y + n.vy }));
        const remaining: typeof updated = [];
        const soul = posRef.current;

        for (const n of updated) {
          // Check soul intercept
          if (Math.sqrt((n.x - soul.x) ** 2 + (n.y - soul.y) ** 2) < 12) {
            setHealed(h => h + 1);
            continue;
          }
          // Hit the bottom (ally strings)
          if (n.y > 165) {
            setMissed(m => m + 1);
            continue;
          }
          remaining.push(n);
        }
        return remaining;
      });
    }, TICK);
    return () => clearInterval(interval);
  }, [duration, difficulty, onEnd, healed, missed]);

  const timeLeft = Math.max(0, 100 - ((Date.now() - startRef.current) / duration) * 100);
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="font-pixel text-[8px] text-emerald-400">💚 INTERCEPTED: {healed} | MISSED: {missed}</div>
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

        {/* Notes */}
        {notes.map(n => (
          <motion.div key={n.id} className="absolute rounded-full" style={{
            left: n.x - 5, top: n.y - 5, width: 10, height: 10,
            backgroundColor: n.color, boxShadow: `0 0 6px ${n.color}`,
          }} />
        ))}

        {/* Soul */}
        <div className="absolute" style={{ left: pos.x - 5, top: pos.y - 5, width: 10, height: 10, zIndex: 10 }}>
          <div style={{ width: '100%', height: '100%', backgroundColor: '#10b981', transform: 'rotate(45deg)', borderRadius: 1,
            boxShadow: '0 0 8px rgba(16,185,129,0.6)' }} />
        </div>
      </div>
    </div>
  );
};

// ============ SHADOW BLADE: Blind Spot ============
// Dark room, limited visibility, use stealth to avoid hits
const ShadowBladeGame: React.FC<{ duration: number; difficulty: number; onEnd: (score: number) => void }> = ({ duration, difficulty, onEnd }) => {
  const posRef = useRef({ x: 110, y: 90 });
  const [pos, setPos] = useState({ x: 110, y: 90 });
  const [projectiles, setProjectiles] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number }>>([]);
  const [invisible, setInvisible] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [hits, setHits] = useState(0);
  const [dodged, setDodged] = useState(0);
  const keysRef = useRef<Set<string>>(new Set());
  const frameRef = useRef(0);
  const startRef = useRef(Date.now());
  const resultSent = useRef(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if ((e.key === ' ' || e.key === 'Shift') && cooldown <= 0 && !invisible) {
        setInvisible(true);
        setCooldown(90); // 3 seconds cooldown
        setTimeout(() => setInvisible(false), 1500);
      }
      e.preventDefault(); e.stopPropagation();
    };
    const up = (e: KeyboardEvent) => { keysRef.current.delete(e.key.toLowerCase()); };
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);
    return () => { window.removeEventListener('keydown', down, true); window.removeEventListener('keyup', up, true); };
  }, [cooldown, invisible]);

  useEffect(() => {
    const interval = setInterval(() => {
      frameRef.current++;
      setCooldown(c => Math.max(0, c - 1));
      const elapsed = Date.now() - startRef.current;
      if (elapsed >= duration && !resultSent.current) {
        resultSent.current = true;
        clearInterval(interval);
        const total = hits + dodged;
        onEnd(total > 0 ? Math.min(100, Math.floor(((total - hits) / Math.max(1, total)) * 100)) : 70);
        return;
      }

      const keys = keysRef.current;
      const spd = 4.5;
      let dx = 0, dy = 0;
      if (keys.has('arrowup') || keys.has('w')) dy -= spd;
      if (keys.has('arrowdown') || keys.has('s')) dy += spd;
      if (keys.has('arrowleft') || keys.has('a')) dx -= spd;
      if (keys.has('arrowright') || keys.has('d')) dx += spd;
      posRef.current.x = Math.max(8, Math.min(212, posRef.current.x + dx));
      posRef.current.y = Math.max(8, Math.min(172, posRef.current.y + dy));
      setPos({ ...posRef.current });

      // Spawn
      if (frameRef.current % Math.max(5, Math.floor(14 / difficulty)) === 0) {
        const side = Math.floor(Math.random() * 4);
        let sx: number, sy: number, svx: number, svy: number;
        const spd2 = 2 + difficulty * 0.5;
        if (side === 0) { sx = Math.random() * 220; sy = -5; svx = (Math.random() - 0.5) * 2; svy = spd2; }
        else if (side === 1) { sx = Math.random() * 220; sy = 185; svx = (Math.random() - 0.5) * 2; svy = -spd2; }
        else if (side === 2) { sx = -5; sy = Math.random() * 180; svx = spd2; svy = (Math.random() - 0.5) * 2; }
        else { sx = 225; sy = Math.random() * 180; svx = -spd2; svy = (Math.random() - 0.5) * 2; }
        setProjectiles(prev => [...prev, { id: frameRef.current, x: sx!, y: sy!, vx: svx!, vy: svy! }]);
      }

      setProjectiles(prev => {
        const updated = prev.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy }))
          .filter(p => p.x > -15 && p.x < 235 && p.y > -15 && p.y < 195);
        const soul = posRef.current;
        for (const p of updated) {
          const dist = Math.sqrt((p.x - soul.x) ** 2 + (p.y - soul.y) ** 2);
          if (dist < 9) {
            if (!invisible) {
              setHits(h => h + 1);
            } else {
              setDodged(d => d + 1);
            }
            p.x = -100;
          }
        }
        return updated.filter(p => p.x > -50);
      });

      setDodged(d => d); // track dodges over time
    }, TICK);
    return () => clearInterval(interval);
  }, [duration, difficulty, onEnd, invisible, hits, dodged]);

  const timeLeft = Math.max(0, 100 - ((Date.now() - startRef.current) / duration) * 100);

  const touchRef = useRef<{ x: number; y: number } | null>(null);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="font-pixel text-[8px] text-purple-400">🗡️ STEALTH {invisible ? '(INVISIBLE!)' : cooldown > 0 ? `(CD: ${Math.ceil(cooldown / 30)}s)` : '(SPACE)'}</div>
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden" style={{ width: 220 }}>
        <div className="h-full bg-purple-400 transition-all" style={{ width: `${timeLeft}%` }} />
      </div>
      <div className="relative overflow-hidden"
        style={{ width: 220, height: 180, border: '2px solid #8b5cf6', backgroundColor: '#050510', touchAction: 'none' }}
        onTouchStart={(e) => { touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
        onTouchMove={(e) => {
          if (!touchRef.current) return;
          const dx = e.touches[0].clientX - touchRef.current.x;
          const dy = e.touches[0].clientY - touchRef.current.y;
          touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          posRef.current.x = Math.max(8, Math.min(212, posRef.current.x + dx * 0.7));
          posRef.current.y = Math.max(8, Math.min(172, posRef.current.y + dy * 0.7));
        }}>

        {/* Darkness overlay with light radius */}
        <div className="absolute inset-0 pointer-events-none z-10" style={{
          background: `radial-gradient(circle ${invisible ? 15 : 45}px at ${pos.x}px ${pos.y}px, transparent 0%, rgba(0,0,0,0.92) 100%)`,
        }} />

        {/* Projectiles */}
        {projectiles.map(p => (
          <div key={p.id} className="absolute rounded-full" style={{
            left: p.x - 4, top: p.y - 4, width: 8, height: 8,
            backgroundColor: '#cc44ff', boxShadow: '0 0 4px #cc44ff',
          }} />
        ))}

        {/* Soul */}
        {!invisible && (
          <div className="absolute z-20" style={{ left: pos.x - 5, top: pos.y - 5, width: 10, height: 10 }}>
            <div style={{ width: '100%', height: '100%', backgroundColor: '#8b5cf6', transform: 'rotate(45deg)', borderRadius: 1,
              boxShadow: '0 0 8px rgba(139,92,246,0.6)' }} />
          </div>
        )}
      </div>
    </div>
  );
};

// ============ BRAWLER: Guard Duel ============
// 3 lanes, block attacks with correct guard position, parry for bonus
const BrawlerGame: React.FC<{ duration: number; difficulty: number; onEnd: (score: number) => void }> = ({ duration, difficulty, onEnd }) => {
  const [guardLane, setGuardLane] = useState(1); // 0=top, 1=mid, 2=bottom
  const [attacks, setAttacks] = useState<Array<{ id: number; x: number; lane: number; speed: number }>>([]);
  const [parries, setParries] = useState(0);
  const [hits, setHits] = useState(0);
  const [advance, setAdvance] = useState(0); // 0-100, advance toward enemy
  const keysRef = useRef<Set<string>>(new Set());
  const frameRef = useRef(0);
  const startRef = useRef(Date.now());
  const resultSent = useRef(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key === 'ArrowUp' || e.key === 'w') setGuardLane(0);
      if (e.key === 'ArrowDown' || e.key === 's') setGuardLane(2);
      if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'ArrowRight' || e.key === 'd') && !e.key.startsWith('Arrow')) setGuardLane(1);
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
        onEnd(Math.min(100, Math.floor(advance)));
        return;
      }

      // Default to middle guard
      const keys = keysRef.current;
      if (keys.has('arrowup') || keys.has('w')) setGuardLane(0);
      else if (keys.has('arrowdown') || keys.has('s')) setGuardLane(2);
      else setGuardLane(1);

      // Spawn attacks from right
      if (frameRef.current % Math.max(6, Math.floor(18 / difficulty)) === 0) {
        const lane = Math.floor(Math.random() * 3);
        setAttacks(prev => [...prev, { id: frameRef.current, x: 220, lane, speed: 3 + difficulty * 0.5 }]);
      }

      // Update attacks
      setAttacks(prev => {
        const updated = prev.map(a => ({ ...a, x: a.x - a.speed }));
        const remaining: typeof updated = [];

        for (const a of updated) {
          // Parry zone (x: 25-40)
          if (a.x <= 40 && a.x > 25) {
            setGuardLane(gl => {
              if (a.lane === gl) {
                setParries(p => p + 1);
                setAdvance(ad => Math.min(100, ad + 8));
                return gl;
              }
              return gl;
            });
            continue;
          }
          // Hit zone
          if (a.x <= 25) {
            setGuardLane(gl => {
              if (a.lane !== gl) {
                setHits(h => h + 1);
                setAdvance(ad => Math.max(0, ad - 5));
              }
              return gl;
            });
            continue;
          }
          remaining.push(a);
        }
        return remaining;
      });
    }, TICK);
    return () => clearInterval(interval);
  }, [duration, difficulty, onEnd, advance]);

  const timeLeft = Math.max(0, 100 - ((Date.now() - startRef.current) / duration) * 100);
  const laneLabels = ['HIGH', 'MID', 'LOW'];
  const laneY = [25, 80, 135];

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="font-pixel text-[8px] text-orange-400">👊 PARRIES: {parries} | ADVANCE: {Math.floor(advance)}%</div>
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden" style={{ width: 220 }}>
        <div className="h-full bg-orange-400 transition-all" style={{ width: `${timeLeft}%` }} />
      </div>
      <div className="relative overflow-hidden"
        style={{ width: 220, height: 180, border: '2px solid #f97316', backgroundColor: '#0a0a0a', touchAction: 'none' }}
        onTouchStart={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const y = e.touches[0].clientY - rect.top;
          if (y < 60) setGuardLane(0);
          else if (y < 120) setGuardLane(1);
          else setGuardLane(2);
        }}>

        {/* Lane lines */}
        {[60, 120].map(y => (
          <div key={y} className="absolute left-0 right-0 h-px bg-white/10" style={{ top: y }} />
        ))}

        {/* Lane labels */}
        {laneLabels.map((label, i) => (
          <div key={label} className="absolute font-pixel text-[6px] text-white/20" style={{ left: 2, top: laneY[i] - 5 }}>{label}</div>
        ))}

        {/* Guard position */}
        <motion.div className="absolute" animate={{ top: laneY[guardLane] - 12 }} transition={{ duration: 0.05 }}
          style={{ left: 25, width: 20, height: 24, backgroundColor: '#f97316', border: '2px solid #fb923c', borderRadius: 2,
            boxShadow: '0 0 8px rgba(249,115,22,0.5)' }}>
          <div className="w-full h-full flex items-center justify-center font-pixel text-[6px] text-white">🛡</div>
        </motion.div>

        {/* Parry zone indicator */}
        <div className="absolute top-0 bottom-0" style={{ left: 25, width: 15, backgroundColor: 'rgba(249,115,22,0.05)', borderLeft: '1px solid rgba(249,115,22,0.2)' }} />

        {/* Incoming attacks */}
        {attacks.map(a => (
          <motion.div key={a.id} className="absolute" style={{
            left: a.x - 8, top: laneY[a.lane] - 8, width: 16, height: 16,
          }}>
            <div className="w-full h-full rounded bg-red-500" style={{ boxShadow: '0 0 6px rgba(239,68,68,0.6)' }}>
              <div className="w-full h-full flex items-center justify-center font-pixel text-[8px]">⚡</div>
            </div>
          </motion.div>
        ))}

        {/* Advance bar at bottom */}
        <div className="absolute bottom-1 left-2 right-2 h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-orange-400 transition-all rounded-full" style={{ width: `${advance}%` }} />
        </div>
      </div>
      <div className="font-pixel text-[6px] text-white/30">↑↓ Cambiar guardia | Parry en el momento justo</div>
    </div>
  );
};
