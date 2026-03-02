import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

interface MonsterDodgeBoxProps {
  monsterId: string;
  monsterName: string;
  attackPower: number;
  duration: number;
  onComplete: (damageTaken: number) => void;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  shape?: 'circle' | 'claw' | 'wave' | 'spike' | 'spore' | 'crystal';
}

const BOX_W = 220;
const BOX_H = 170;
const SOUL_SIZE = 10;
const TICK = 1000 / 30;

export const MonsterDodgeBox: React.FC<MonsterDodgeBoxProps> = ({
  monsterId, monsterName, attackPower, duration, onComplete,
}) => {
  const posRef = useRef({ x: BOX_W / 2, y: BOX_H / 2 });
  const [pos, setPos] = useState({ x: BOX_W / 2, y: BOX_H / 2 });
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [damage, setDamage] = useState(0);
  const [timeLeft, setTimeLeft] = useState(100);
  const [active, setActive] = useState(true);
  const keysRef = useRef<Set<string>>(new Set());
  const frameRef = useRef(0);
  const startRef = useRef(Date.now());
  const projIdRef = useRef(0);
  const resultSent = useRef(false);

  const monsterConfig = useMemo(() => getMonsterAttackConfig(monsterId, attackPower), [monsterId, attackPower]);

  // Keys
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keysRef.current.add(e.key.toLowerCase()); e.preventDefault(); e.stopPropagation(); };
    const up = (e: KeyboardEvent) => { keysRef.current.delete(e.key.toLowerCase()); };
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);
    return () => { window.removeEventListener('keydown', down, true); window.removeEventListener('keyup', up, true); };
  }, []);

  // Touch
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => { touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const dx = e.touches[0].clientX - touchRef.current.x;
    const dy = e.touches[0].clientY - touchRef.current.y;
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    posRef.current.x = Math.max(SOUL_SIZE / 2, Math.min(BOX_W - SOUL_SIZE / 2, posRef.current.x + dx * 0.7));
    posRef.current.y = Math.max(SOUL_SIZE / 2, Math.min(BOX_H - SOUL_SIZE / 2, posRef.current.y + dy * 0.7));
  };

  // Game loop
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      frameRef.current++;
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setTimeLeft(remaining);

      if (remaining <= 0 && !resultSent.current) {
        resultSent.current = true;
        setActive(false);
        clearInterval(interval);
        return;
      }

      // Move soul
      const keys = keysRef.current;
      const spd = 3.5;
      let dx = 0, dy = 0;
      if (keys.has('arrowup') || keys.has('w')) dy -= spd;
      if (keys.has('arrowdown') || keys.has('s')) dy += spd;
      if (keys.has('arrowleft') || keys.has('a')) dx -= spd;
      if (keys.has('arrowright') || keys.has('d')) dx += spd;
      posRef.current.x = Math.max(SOUL_SIZE / 2, Math.min(BOX_W - SOUL_SIZE / 2, posRef.current.x + dx));
      posRef.current.y = Math.max(SOUL_SIZE / 2, Math.min(BOX_H - SOUL_SIZE / 2, posRef.current.y + dy));
      setPos({ ...posRef.current });

      // Spawn projectiles using monster-specific pattern
      monsterConfig.spawnPattern(frameRef.current, projIdRef, setProjectiles);

      // Update & collide
      setProjectiles(prev => {
        const updated = prev.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy }))
          .filter(p => p.x > -30 && p.x < BOX_W + 30 && p.y > -30 && p.y < BOX_H + 30);

        const soul = posRef.current;
        for (const p of updated) {
          const dist = Math.sqrt((p.x - soul.x) ** 2 + (p.y - soul.y) ** 2);
          if (dist < (SOUL_SIZE / 2 + p.size / 2)) {
            setDamage(d => d + monsterConfig.damagePerHit);
            p.x = -200;
          }
        }
        return updated.filter(p => p.x > -100);
      });
    }, TICK);
    return () => clearInterval(interval);
  }, [active, duration, monsterConfig]);

  // End callback
  useEffect(() => {
    if (!active && !resultSent.current) return;
    if (!active) {
      const timer = setTimeout(() => onComplete(damage), 500);
      return () => clearTimeout(timer);
    }
  }, [active, damage, onComplete]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="font-pixel text-[8px]" style={{ color: monsterConfig.color }}>
        {monsterConfig.icon} {monsterName} — {monsterConfig.label}
      </div>
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden" style={{ width: BOX_W }}>
        <div className="h-full transition-all" style={{ width: `${timeLeft}%`, backgroundColor: monsterConfig.color }} />
      </div>
      <div className="relative overflow-hidden"
        style={{ width: BOX_W, height: BOX_H, border: `2px solid ${monsterConfig.color}`, backgroundColor: monsterConfig.bgColor, touchAction: 'none' }}
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}>

        {/* Monster-specific background effect */}
        {monsterConfig.bgEffect}

        {/* Projectiles */}
        {projectiles.map(p => (
          <div key={p.id} className="absolute" style={{
            left: p.x - p.size / 2,
            top: p.y - p.size / 2,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' || p.shape === 'spore' ? '50%' : p.shape === 'spike' ? '0' : '2px',
            boxShadow: `0 0 4px ${p.color}`,
            transform: p.shape === 'claw' ? 'rotate(45deg)' : p.shape === 'crystal' ? 'rotate(45deg)' : undefined,
          }} />
        ))}

        {/* Soul (heart) */}
        <div className="absolute" style={{ left: pos.x - SOUL_SIZE / 2, top: pos.y - SOUL_SIZE / 2, width: SOUL_SIZE, height: SOUL_SIZE, zIndex: 10 }}>
          <div style={{
            width: '100%', height: '100%', backgroundColor: '#ef4444', transform: 'rotate(45deg)',
            boxShadow: '0 0 6px rgba(239,68,68,0.6)', borderRadius: 1,
          }}>
            <div className="absolute rounded-full" style={{ width: SOUL_SIZE, height: SOUL_SIZE, backgroundColor: '#ef4444', top: -SOUL_SIZE / 2, left: 0 }} />
            <div className="absolute rounded-full" style={{ width: SOUL_SIZE, height: SOUL_SIZE, backgroundColor: '#ef4444', top: 0, left: -SOUL_SIZE / 2 }} />
          </div>
        </div>

        {/* Finish overlay */}
        {!active && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
            <span className="font-pixel text-[10px] text-white animate-pulse">
              {damage > 0 ? `💔 -${damage} HP` : '✨ PERFECT DODGE!'}
            </span>
          </div>
        )}
      </div>
      <div className="font-pixel text-[7px] text-red-400">DMG: {damage}</div>
    </div>
  );
};

// ============ MONSTER-SPECIFIC ATTACK PATTERNS ============

interface MonsterAttackConfig {
  color: string;
  icon: string;
  label: string;
  bgColor: string;
  damagePerHit: number;
  bgEffect: React.ReactNode;
  spawnPattern: (
    frame: number,
    idRef: React.MutableRefObject<number>,
    setProjectiles: React.Dispatch<React.SetStateAction<Projectile[]>>
  ) => void;
}

function getMonsterAttackConfig(monsterId: string, attackPower: number): MonsterAttackConfig {
  const dmg = Math.max(2, Math.floor(attackPower * 0.4));

  switch (monsterId) {
    // ===== WOLF: Claw swipes + tail whip =====
    case 'wolf':
      return {
        color: '#9ca3af', icon: '🐺', label: 'CLAW FURY', bgColor: '#0a0808',
        damagePerHit: dmg,
        bgEffect: null,
        spawnPattern: (frame, idRef, set) => {
          // Claw pattern: 3 parallel lines from alternating sides
          if (frame % 12 === 0) {
            const fromLeft = frame % 24 === 0;
            const baseY = 30 + Math.random() * 110;
            for (let i = -1; i <= 1; i++) {
              set(prev => [...prev, {
                id: ++idRef.current, x: fromLeft ? -5 : BOX_W + 5, y: baseY + i * 15,
                vx: (fromLeft ? 1 : -1) * 3.5, vy: 0, size: 10, color: '#9ca3af', shape: 'claw',
              }]);
            }
          }
          // Tail whip: sweeping arc from bottom
          if (frame % 25 === 0) {
            for (let i = 0; i < 5; i++) {
              const angle = (Math.PI * 0.2) + (Math.PI * 0.6 / 5) * i;
              set(prev => [...prev, {
                id: ++idRef.current, x: BOX_W / 2, y: BOX_H + 5,
                vx: Math.cos(angle) * 2.5, vy: -Math.sin(angle) * 3,
                size: 7, color: '#6b7280', shape: 'circle',
              }]);
            }
          }
        },
      };

    // ===== SLIME: Bouncing blobs + splash =====
    case 'slime':
    case 'shadow_slime':
      return {
        color: monsterId === 'shadow_slime' ? '#6b21a8' : '#22c55e',
        icon: '🟢', label: 'SLIME BOUNCE', bgColor: '#050a05',
        damagePerHit: dmg,
        bgEffect: <div className="absolute bottom-0 left-0 right-0 h-4" style={{
          background: `linear-gradient(transparent, ${monsterId === 'shadow_slime' ? 'rgba(107,33,168,0.2)' : 'rgba(34,197,94,0.15)'})`,
        }} />,
        spawnPattern: (frame, idRef, set) => {
          if (frame % 10 === 0) {
            // Random bouncing blob
            set(prev => [...prev, {
              id: ++idRef.current,
              x: Math.random() * BOX_W, y: -5,
              vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 2,
              size: 8 + Math.random() * 6,
              color: monsterId === 'shadow_slime' ? '#9333ea' : '#4ade80',
              shape: 'circle',
            }]);
          }
          // Splash burst every 30 frames
          if (frame % 30 === 0) {
            const cx = Math.random() * BOX_W;
            const cy = Math.random() * BOX_H;
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI * 2 / 6) * i;
              set(prev => [...prev, {
                id: ++idRef.current, x: cx, y: cy,
                vx: Math.cos(angle) * 2, vy: Math.sin(angle) * 2,
                size: 5, color: monsterId === 'shadow_slime' ? '#a855f7' : '#86efac', shape: 'circle',
              }]);
            }
          }
        },
      };

    // ===== BAT: Sonic waves + dive bombs =====
    case 'bat':
      return {
        color: '#7c3aed', icon: '🦇', label: 'SONIC ASSAULT', bgColor: '#08050f',
        damagePerHit: dmg,
        bgEffect: null,
        spawnPattern: (frame, idRef, set) => {
          // Sonic wave rings from center top
          if (frame % 15 === 0) {
            for (let i = 0; i < 8; i++) {
              const angle = (Math.PI * 2 / 8) * i;
              set(prev => [...prev, {
                id: ++idRef.current, x: BOX_W / 2, y: 15,
                vx: Math.cos(angle) * 2, vy: Math.sin(angle) * 2 + 0.5,
                size: 6, color: '#a78bfa', shape: 'wave',
              }]);
            }
          }
          // Dive bomb (fast vertical from random x)
          if (frame % 20 === 0) {
            set(prev => [...prev, {
              id: ++idRef.current,
              x: 20 + Math.random() * (BOX_W - 40), y: -10,
              vx: 0, vy: 5,
              size: 10, color: '#581c87', shape: 'spike',
            }]);
          }
        },
      };

    // ===== MUSHROOM: Spore clouds + poison trails =====
    case 'mushroom':
      return {
        color: '#dc2626', icon: '🍄', label: 'SPORE STORM', bgColor: '#0a0805',
        damagePerHit: dmg,
        bgEffect: <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(circle at 50% 30%, rgba(220,38,38,0.05) 0%, transparent 60%)',
        }} />,
        spawnPattern: (frame, idRef, set) => {
          // Drifting spores (slow, many)
          if (frame % 8 === 0) {
            set(prev => [...prev, {
              id: ++idRef.current,
              x: Math.random() * BOX_W, y: -5,
              vx: (Math.random() - 0.5) * 1.5, vy: 1 + Math.random(),
              size: 6, color: '#86efac', shape: 'spore',
            }]);
          }
          // Poison burst from sides
          if (frame % 22 === 0) {
            const fromLeft = Math.random() > 0.5;
            for (let i = 0; i < 3; i++) {
              set(prev => [...prev, {
                id: ++idRef.current,
                x: fromLeft ? -5 : BOX_W + 5, y: 30 + i * 50,
                vx: (fromLeft ? 1 : -1) * (2 + Math.random()), vy: (Math.random() - 0.5) * 1.5,
                size: 8, color: '#a855f7', shape: 'spore',
              }]);
            }
          }
        },
      };

    // ===== GOLEM: Boulders + earthquake waves =====
    case 'golem':
      return {
        color: '#78716c', icon: '🪨', label: 'EARTHQUAKE', bgColor: '#0a0a08',
        damagePerHit: dmg + 2,
        bgEffect: null,
        spawnPattern: (frame, idRef, set) => {
          // Falling boulders
          if (frame % 14 === 0) {
            set(prev => [...prev, {
              id: ++idRef.current,
              x: 15 + Math.random() * (BOX_W - 30), y: -10,
              vx: 0, vy: 2.5,
              size: 14, color: '#a8a29e', shape: 'circle',
            }]);
          }
          // Earthquake waves from bottom
          if (frame % 20 === 0) {
            for (let i = 0; i < BOX_W; i += 25) {
              set(prev => [...prev, {
                id: ++idRef.current, x: i, y: BOX_H + 5,
                vx: 0, vy: -3,
                size: 20, color: '#57534e', shape: 'spike',
              }]);
            }
          }
        },
      };

    // ===== GHOST: Phasing orbs + vanishing attacks =====
    case 'ghost':
      return {
        color: '#c7d2fe', icon: '👻', label: 'PHANTOM WAIL', bgColor: '#080810',
        damagePerHit: dmg,
        bgEffect: <div className="absolute inset-0 pointer-events-none animate-pulse" style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(199,210,254,0.03) 0%, transparent 70%)',
        }} />,
        spawnPattern: (frame, idRef, set) => {
          // Phasing orbs that appear/disappear
          if (frame % 12 === 0) {
            const angle = Math.random() * Math.PI * 2;
            set(prev => [...prev, {
              id: ++idRef.current,
              x: BOX_W / 2 + Math.cos(angle) * 100, y: BOX_H / 2 + Math.sin(angle) * 80,
              vx: -Math.cos(angle) * 1.5, vy: -Math.sin(angle) * 1.5,
              size: 8, color: '#818cf8', shape: 'circle',
            }]);
          }
          // Sudden teleport projectiles
          if (frame % 18 === 0) {
            set(prev => [...prev, {
              id: ++idRef.current,
              x: Math.random() * BOX_W, y: Math.random() * BOX_H,
              vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
              size: 6, color: '#00ffff', shape: 'crystal',
            }]);
          }
        },
      };

    // ===== SPRITE (DARK FAIRY): Magical spirals =====
    case 'sprite':
      return {
        color: '#c084fc', icon: '🧚', label: 'FAIRY CHAOS', bgColor: '#0a050f',
        damagePerHit: dmg,
        bgEffect: null,
        spawnPattern: (frame, idRef, set) => {
          // Spiral pattern
          if (frame % 6 === 0) {
            const angle = frame * 0.15;
            const r = 50 + Math.sin(frame * 0.05) * 30;
            set(prev => [...prev, {
              id: ++idRef.current,
              x: BOX_W / 2 + Math.cos(angle) * r, y: BOX_H / 2 + Math.sin(angle) * r * 0.7,
              vx: Math.cos(angle + Math.PI / 2) * 1.5, vy: Math.sin(angle + Math.PI / 2) * 1.5,
              size: 6, color: '#e9d5ff', shape: 'crystal',
            }]);
          }
          // Random fairy dust bursts
          if (frame % 25 === 0) {
            for (let i = 0; i < 8; i++) {
              const a = (Math.PI * 2 / 8) * i;
              set(prev => [...prev, {
                id: ++idRef.current,
                x: Math.random() * BOX_W, y: Math.random() * BOX_H,
                vx: Math.cos(a) * 2.5, vy: Math.sin(a) * 2.5,
                size: 5, color: '#a855f7', shape: 'circle',
              }]);
            }
          }
        },
      };

    // ===== MEMORY WRAITH: Multi-element chaos =====
    case 'memory_wraith':
      return {
        color: '#00ffff', icon: '👁', label: 'MEMORY STORM', bgColor: '#050510',
        damagePerHit: dmg + 3,
        bgEffect: <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(circle at 50% 30%, rgba(0,255,255,0.04) 0%, transparent 50%)',
        }} />,
        spawnPattern: (frame, idRef, set) => {
          // Fire + lightning combined
          if (frame % 8 === 0) {
            const side = Math.floor(Math.random() * 4);
            let x, y, vx, vy;
            const spd = 3;
            if (side === 0) { x = Math.random() * BOX_W; y = -5; vx = (Math.random() - 0.5) * 2; vy = spd; }
            else if (side === 1) { x = Math.random() * BOX_W; y = BOX_H + 5; vx = (Math.random() - 0.5) * 2; vy = -spd; }
            else if (side === 2) { x = -5; y = Math.random() * BOX_H; vx = spd; vy = (Math.random() - 0.5) * 2; }
            else { x = BOX_W + 5; y = Math.random() * BOX_H; vx = -spd; vy = (Math.random() - 0.5) * 2; }
            set(prev => [...prev, {
              id: ++idRef.current, x: x!, y: y!, vx: vx!, vy: vy!,
              size: 7, color: frame % 16 === 0 ? '#ff4444' : '#00ffff', shape: 'crystal',
            }]);
          }
          // Expanding ring
          if (frame % 30 === 0) {
            for (let i = 0; i < 12; i++) {
              const a = (Math.PI * 2 / 12) * i;
              set(prev => [...prev, {
                id: ++idRef.current, x: BOX_W / 2, y: BOX_H / 2,
                vx: Math.cos(a) * 2.5, vy: Math.sin(a) * 2.5,
                size: 5, color: '#00ffff', shape: 'circle',
              }]);
            }
          }
        },
      };

    // ===== VOID GUARDIAN: Dense bullet hell =====
    case 'void_guardian':
      return {
        color: '#ff00ff', icon: '🌀', label: 'VOID ANNIHILATION', bgColor: '#050005',
        damagePerHit: dmg + 5,
        bgEffect: <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(255,0,255,0.05) 0%, transparent 60%)',
        }} />,
        spawnPattern: (frame, idRef, set) => {
          // Double spiral
          if (frame % 4 === 0) {
            const angle = frame * 0.1;
            for (let j = 0; j < 2; j++) {
              const a = angle + j * Math.PI;
              set(prev => [...prev, {
                id: ++idRef.current,
                x: BOX_W / 2 + Math.cos(a) * 10, y: BOX_H / 2 + Math.sin(a) * 10,
                vx: Math.cos(a) * 2.5, vy: Math.sin(a) * 2.5,
                size: 6, color: j === 0 ? '#ff00ff' : '#ff0000', shape: 'circle',
              }]);
            }
          }
          // Cross laser
          if (frame % 35 === 0) {
            for (let i = 0; i < BOX_W; i += 15) {
              set(prev => [...prev, {
                id: ++idRef.current, x: i, y: -5,
                vx: 0, vy: 4,
                size: 4, color: '#ff00ff', shape: 'spike',
              }]);
            }
          }
        },
      };

    // Default generic pattern
    default:
      return {
        color: '#ff4444', icon: '⚠', label: 'ATTACK', bgColor: '#0a0a0a',
        damagePerHit: dmg,
        bgEffect: null,
        spawnPattern: (frame, idRef, set) => {
          if (frame % 10 === 0) {
            const side = Math.floor(Math.random() * 4);
            let x, y, vx, vy;
            const spd = 2.5;
            if (side === 0) { x = Math.random() * BOX_W; y = -5; vx = (Math.random() - 0.5) * 2; vy = spd; }
            else if (side === 1) { x = Math.random() * BOX_W; y = BOX_H + 5; vx = (Math.random() - 0.5) * 2; vy = -spd; }
            else if (side === 2) { x = -5; y = Math.random() * BOX_H; vx = spd; vy = (Math.random() - 0.5) * 2; }
            else { x = BOX_W + 5; y = Math.random() * BOX_H; vx = -spd; vy = (Math.random() - 0.5) * 2; }
            set(prev => [...prev, { id: ++idRef.current, x: x!, y: y!, vx: vx!, vy: vy!, size: 7, color: '#ff4444', shape: 'circle' }]);
          }
        },
      };
  }
}
