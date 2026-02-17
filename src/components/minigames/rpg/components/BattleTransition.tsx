import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BattleTransitionProps {
  active: boolean;
  onComplete: () => void;
}

/**
 * Pokemon-style battle transition with screen flashes, diagonal wipes, and spiral effects
 */
export const BattleTransition: React.FC<BattleTransitionProps> = ({ active, onComplete }) => {
  const [phase, setPhase] = useState<'idle' | 'flash' | 'wipe' | 'spiral' | 'done'>('idle');

  useEffect(() => {
    if (!active) {
      setPhase('idle');
      return;
    }

    setPhase('flash');
    const t1 = setTimeout(() => setPhase('wipe'), 300);
    const t2 = setTimeout(() => setPhase('spiral'), 900);
    const t3 = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [active, onComplete]);

  if (phase === 'idle' || phase === 'done') return null;

  return (
    <div className="fixed inset-0 z-[500] pointer-events-none">
      <AnimatePresence>
        {/* Flash frames (like Pokemon encounter) */}
        {phase === 'flash' && (
          <>
            <motion.div
              className="absolute inset-0 bg-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0, 1, 0, 1, 0] }}
              transition={{ duration: 0.3, times: [0, 0.14, 0.28, 0.42, 0.56, 0.7, 1] }}
            />
            <motion.div
              className="absolute inset-0 bg-red-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 0.5, 0, 0.5, 0, 0] }}
              transition={{ duration: 0.3, times: [0, 0.14, 0.28, 0.42, 0.56, 0.7, 1] }}
            />
          </>
        )}

        {/* Diagonal wipe (like gen 3 Pokemon) */}
        {phase === 'wipe' && (
          <>
            {Array.from({ length: 8 }, (_, i) => (
              <motion.div
                key={i}
                className="absolute bg-black"
                style={{
                  width: '200%',
                  height: `${100 / 8}%`,
                  top: `${(i * 100) / 8}%`,
                  left: i % 2 === 0 ? '-200%' : '100%',
                }}
                animate={{
                  left: i % 2 === 0 ? '0%' : '-100%',
                }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.05,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </>
        )}

        {/* Spiral close */}
        {phase === 'spiral' && (
          <motion.div
            className="absolute inset-0 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="absolute bg-white rounded-full"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ width: '200vmax', height: '200vmax' }}
              animate={{ width: 0, height: 0 }}
              transition={{ duration: 0.5, ease: 'easeIn' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
