import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { characterClassMap } from '../data/heroClasses';

interface UndertaleBoxProps {
  /** The player character ID whose class determines the mini-game */
  activeCharacterId: string;
  /** Duration of dodge phase in ms */
  duration?: number;
  /** Difficulty multiplier (enemy attack power) */
  difficulty?: number;
  /** Called when dodge phase ends. damage = total damage taken */
  onComplete: (damageTaken: number, bonusCharge: number) => void;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  type?: string;
}

const BOX_W = 200;
const BOX_H = 160;
const SOUL_SIZE = 10;
const TICK = 1000 / 30; // 30fps for mobile compat

export const UndertaleBox: React.FC<UndertaleBoxProps> = ({
  activeCharacterId,
  duration = 4000,
  difficulty = 1,
  onComplete,
}) => {
  const classId = characterClassMap[activeCharacterId] || 'squire';
  const soulRef = useRef({ x: BOX_W / 2, y: BOX_H / 2 });
  const [soulPos, setSoulPos] = useState({ x: BOX_W / 2, y: BOX_H / 2 });
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [damageTaken, setDamageTaken] = useState(0);
  const [bonusCharge, setBonusCharge] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(true);
  const keysRef = useRef<Set<string>>(new Set());
  const projIdRef = useRef(0);
  const frameRef = useRef(0);
  const startTimeRef = useRef(Date.now());

  // Class-specific config
  const config = useMemo(() => {
    switch (classId) {
      case 'archer': return { soulColor: '#22c55e', boxBorder: '#22c55e', label: 'PRECISION FOCUS', speed: 3.5, spawnRate: 6 };
      case 'squire': return { soulColor: '#3b82f6', boxBorder: '#3b82f6', label: 'COVERAGE ZONE', speed: 2.5, spawnRate: 5 };
      case 'warrior': return { soulColor: '#ef4444', boxBorder: '#ef4444', label: 'FURY IMPULSE', speed: 3, spawnRate: 8 };
      case 'healer': return { soulColor: '#10b981', boxBorder: '#10b981', label: 'SOUL SYMPHONY', speed: 3, spawnRate: 5 };
      case 'shadow_blade': return { soulColor: '#8b5cf6', boxBorder: '#8b5cf6', label: 'BLIND SPOT', speed: 4, spawnRate: 7 };
      case 'brawler': return { soulColor: '#f97316', boxBorder: '#f97316', label: 'GUARD DUEL', speed: 2.5, spawnRate: 4 };
      default: return { soulColor: '#fff', boxBorder: '#fff', label: 'DODGE', speed: 3, spawnRate: 5 };
    }
  }, [classId]);

  // Keyboard input
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      e.preventDefault();
      e.stopPropagation();
    };
    const up = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);
    return () => {
      window.removeEventListener('keydown', down, true);
      window.removeEventListener('keyup', up, true);
    };
  }, []);

  // Touch controls for mobile
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    soulRef.current.x = Math.max(SOUL_SIZE / 2, Math.min(BOX_W - SOUL_SIZE / 2, soulRef.current.x + dx * 0.8));
    soulRef.current.y = Math.max(SOUL_SIZE / 2, Math.min(BOX_H - SOUL_SIZE / 2, soulRef.current.y + dy * 0.8));
  }, []);

  // Game loop
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      frameRef.current++;
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        setIsActive(false);
        clearInterval(interval);
        return;
      }

      // Move soul based on keys
      const keys = keysRef.current;
      const spd = config.speed;
      let dx = 0, dy = 0;
      if (keys.has('arrowup') || keys.has('w')) dy -= spd;
      if (keys.has('arrowdown') || keys.has('s')) dy += spd;
      if (keys.has('arrowleft') || keys.has('a')) dx -= spd;
      if (keys.has('arrowright') || keys.has('d')) dx += spd;
      
      soulRef.current.x = Math.max(SOUL_SIZE / 2, Math.min(BOX_W - SOUL_SIZE / 2, soulRef.current.x + dx));
      soulRef.current.y = Math.max(SOUL_SIZE / 2, Math.min(BOX_H - SOUL_SIZE / 2, soulRef.current.y + dy));
      setSoulPos({ ...soulRef.current });

      // Spawn projectiles
      if (frameRef.current % Math.max(2, Math.floor(10 / difficulty / config.spawnRate * 5)) === 0) {
        const newProj = spawnProjectile(classId, difficulty);
        setProjectiles(prev => [...prev, newProj]);
      }

      // Update projectiles
      setProjectiles(prev => {
        const updated = prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
        })).filter(p => p.x > -20 && p.x < BOX_W + 20 && p.y > -20 && p.y < BOX_H + 20);

        // Collision check
        const soul = soulRef.current;
        for (const p of updated) {
          const dist = Math.sqrt((p.x - soul.x) ** 2 + (p.y - soul.y) ** 2);
          if (dist < (SOUL_SIZE / 2 + p.size / 2)) {
            if (p.type === 'heal') {
              setBonusCharge(b => b + 5);
            } else {
              setDamageTaken(d => d + Math.ceil(3 * difficulty));
            }
            p.x = -100; // Remove
          }

          // Warrior fury: proximity bonus
          if (classId === 'warrior' && dist < SOUL_SIZE * 2 && dist > SOUL_SIZE / 2 + p.size / 2) {
            setBonusCharge(b => b + 0.5);
          }
        }

        return updated.filter(p => p.x > -50);
      });
    }, TICK);

    return () => clearInterval(interval);
  }, [isActive, config, classId, difficulty, duration]);

  // End callback
  useEffect(() => {
    if (!isActive && timeLeft <= 0) {
      const timer = setTimeout(() => onComplete(damageTaken, bonusCharge), 500);
      return () => clearTimeout(timer);
    }
  }, [isActive, timeLeft, damageTaken, bonusCharge, onComplete]);

  const timerPercent = (timeLeft / duration) * 100;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Label */}
      <div className="font-pixel text-[8px] text-center" style={{ color: config.soulColor }}>
        {config.label}
      </div>

      {/* Timer bar */}
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden" style={{ width: BOX_W }}>
        <div className="h-full transition-all" style={{
          width: `${timerPercent}%`,
          backgroundColor: config.soulColor,
        }} />
      </div>

      {/* The box */}
      <div
        className="relative overflow-hidden"
        style={{
          width: BOX_W,
          height: BOX_H,
          border: `3px solid ${config.boxBorder}`,
          backgroundColor: '#000',
          touchAction: 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {/* Class-specific background effects */}
        {classId === 'shadow_blade' && (
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `radial-gradient(circle ${40}px at ${soulPos.x}px ${soulPos.y}px, transparent 0%, rgba(0,0,0,0.85) 100%)`,
          }} />
        )}
        {classId === 'warrior' && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="rounded-full border border-red-500/30" style={{
              width: BOX_W * 0.6,
              height: BOX_H * 0.6,
              animation: 'pulse 2s ease-in-out infinite',
            }} />
          </div>
        )}
        {classId === 'healer' && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-around" style={{ height: '60%' }}>
            {[0, 1, 2].map(i => (
              <div key={i} className="w-0.5 h-full opacity-20" style={{
                backgroundColor: ['#ef4444', '#22c55e', '#3b82f6'][i],
              }} />
            ))}
          </div>
        )}
        {classId === 'squire' && (
          <div className="absolute flex items-center justify-center" style={{
            left: BOX_W / 2 - 10,
            top: BOX_H / 2 - 10,
            width: 20, height: 20,
          }}>
            <div className="w-3 h-3 rounded-full bg-yellow-400/30 animate-pulse" />
          </div>
        )}

        {/* Projectiles */}
        {projectiles.map(p => (
          <div key={p.id} className="absolute rounded-full" style={{
            left: p.x - p.size / 2,
            top: p.y - p.size / 2,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 4px ${p.color}`,
          }} />
        ))}

        {/* Soul */}
        <div className="absolute" style={{
          left: soulPos.x - SOUL_SIZE / 2,
          top: soulPos.y - SOUL_SIZE / 2,
          width: SOUL_SIZE,
          height: SOUL_SIZE,
          zIndex: 10,
        }}>
          {/* Heart shape using CSS */}
          <div style={{
            width: '100%', height: '100%',
            backgroundColor: config.soulColor,
            transform: 'rotate(45deg)',
            boxShadow: `0 0 6px ${config.soulColor}`,
          }}>
            <div className="absolute rounded-full" style={{
              width: SOUL_SIZE, height: SOUL_SIZE,
              backgroundColor: config.soulColor,
              top: -SOUL_SIZE / 2, left: 0,
            }} />
            <div className="absolute rounded-full" style={{
              width: SOUL_SIZE, height: SOUL_SIZE,
              backgroundColor: config.soulColor,
              top: 0, left: -SOUL_SIZE / 2,
            }} />
          </div>
        </div>

        {/* Finished overlay */}
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="font-pixel text-[10px] text-white animate-pulse">
              {damageTaken > 0 ? `💔 -${damageTaken} HP` : '✨ PERFECT!'}
            </span>
          </div>
        )}
      </div>

      {/* Damage counter */}
      <div className="flex items-center gap-4">
        <span className="font-pixel text-[7px] text-red-400">DMG: {damageTaken}</span>
        {classId === 'warrior' && (
          <span className="font-pixel text-[7px] text-orange-400">FURY: {Math.floor(bonusCharge)}%</span>
        )}
      </div>
    </div>
  );
};

// Projectile spawning per class
function spawnProjectile(classId: string, difficulty: number): Projectile {
  const id = ++spawnCounter;
  const speed = 1.5 + difficulty * 0.5;

  switch (classId) {
    case 'archer': {
      // Interference blobs from random edges
      const side = Math.floor(Math.random() * 4);
      const [x, y, vx, vy] = getEdgeSpawn(side, speed);
      return { id, x, y, vx, vy, size: 8, color: '#ff4444' };
    }
    case 'squire': {
      // Attacks aimed at center (VIP)
      const angle = Math.random() * Math.PI * 2;
      const sx = BOX_W / 2 + Math.cos(angle) * BOX_W * 0.6;
      const sy = BOX_H / 2 + Math.sin(angle) * BOX_H * 0.6;
      const a = Math.atan2(BOX_H / 2 - sy, BOX_W / 2 - sx);
      return { id, x: sx, y: sy, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, size: 7, color: '#ff6600' };
    }
    case 'warrior': {
      // Projectiles from edges, spiraling
      const angle = (id * 0.5) % (Math.PI * 2);
      const sx = BOX_W / 2 + Math.cos(angle) * BOX_W * 0.55;
      const sy = BOX_H / 2 + Math.sin(angle) * BOX_H * 0.55;
      const a = Math.atan2(BOX_H / 2 - sy, BOX_W / 2 - sx);
      return { id, x: sx, y: sy, vx: Math.cos(a) * speed * 0.8, vy: Math.sin(a) * speed * 0.8, size: 6, color: '#ff2222' };
    }
    case 'healer': {
      // Notes falling from top
      const isHeal = Math.random() < 0.25;
      return {
        id,
        x: 10 + Math.random() * (BOX_W - 20),
        y: -5,
        vx: (Math.random() - 0.5) * 0.5,
        vy: speed * 0.8,
        size: isHeal ? 6 : 7,
        color: isHeal ? '#22c55e' : '#ff4444',
        type: isHeal ? 'heal' : 'damage',
      };
    }
    case 'shadow_blade': {
      // Random spawn, only visible near soul (handled by bg overlay)
      return {
        id,
        x: Math.random() * BOX_W,
        y: Math.random() * BOX_H,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        size: 7,
        color: '#cc44ff',
      };
    }
    case 'brawler': {
      // Horizontal attacks at 3 heights
      const lane = Math.floor(Math.random() * 3);
      const laneY = 25 + lane * (BOX_H - 50) / 2;
      const fromLeft = Math.random() > 0.5;
      return {
        id,
        x: fromLeft ? -5 : BOX_W + 5,
        y: laneY + (Math.random() - 0.5) * 10,
        vx: (fromLeft ? 1 : -1) * speed * 1.2,
        vy: 0,
        size: 8,
        color: '#ff8800',
      };
    }
    default: {
      const side = Math.floor(Math.random() * 4);
      const [x, y, vx, vy] = getEdgeSpawn(side, speed);
      return { id, x, y, vx, vy, size: 7, color: '#ff4444' };
    }
  }
}

let spawnCounter = 0;

function getEdgeSpawn(side: number, speed: number): [number, number, number, number] {
  switch (side) {
    case 0: return [Math.random() * BOX_W, -5, (Math.random() - 0.5) * speed * 0.5, speed];
    case 1: return [Math.random() * BOX_W, BOX_H + 5, (Math.random() - 0.5) * speed * 0.5, -speed];
    case 2: return [-5, Math.random() * BOX_H, speed, (Math.random() - 0.5) * speed * 0.5];
    case 3: return [BOX_W + 5, Math.random() * BOX_H, -speed, (Math.random() - 0.5) * speed * 0.5];
    default: return [0, 0, 0, speed];
  }
}
