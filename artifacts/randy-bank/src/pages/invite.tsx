import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { addInviteVisitor } from '@/lib/visitors';

// Fixed secret path — do not link to this from anywhere in the UI.
// Whoever gets sent this URL directly is the only one who'll ever see it.
// Read from an env var so the real token never lands in the git history.
// Falls back to a dev-only default so `pnpm dev` still works without a .env.
export const INVITE_TOKEN = import.meta.env.VITE_INVITE_TOKEN || 'dev-only-change-me';
const USED_KEY = `randy_bank_invite_used_${INVITE_TOKEN}`;

type Stage = 'idle' | 'shaking' | 'breaking' | 'done';

// Total duration from click to the final screen: ~9s (very dramatic).
const SHAKE_MS = 600;
const BREAK_MS = 8400;

const GLITCH_LINES = [
  'ERROR CRÍTICO',
  'ESTABILIDAD: 0%',
  'NÚCLEO COMPROMETIDO',
  'PÉRDIDA DE INTEGRIDAD ESTRUCTURAL',
  'INICIANDO PROTOCOLO DE EMERGENCIA',
  'REGISTRANDO VISITANTE...',
  'SYSTEM FAILURE',
];

// Deterministic-looking but randomized shard rectangles used to simulate the
// UI physically breaking apart and flying off screen. Delays are spread
// across the whole "breaking" phase so pieces keep flying the entire time.
function useShards(count: number) {
  const shardsRef = useRef(
    Array.from({ length: count }).map((_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      w: 40 + Math.random() * 140,
      h: 20 + Math.random() * 90,
      rot: (Math.random() - 0.5) * 40,
      flyX: (Math.random() - 0.5) * 1600,
      flyY: (Math.random() - 0.5) * 1100 + 200,
      flyRot: (Math.random() - 0.5) * 900,
      delay: Math.random() * (BREAK_MS / 1000 - 2),
      duration: 2 + Math.random() * 1.6,
      hue: Math.random() > 0.5 ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.08)',
    }))
  );
  return shardsRef.current;
}

export function InvitePage() {
  const [alreadyUsed, setAlreadyUsed] = useState(false);
  const [stage, setStage] = useState<Stage>('idle');
  const [glitchIndex, setGlitchIndex] = useState(0);
  const shards = useShards(34);

  useEffect(() => {
    if (localStorage.getItem(USED_KEY)) {
      setAlreadyUsed(true);
    }
  }, []);

  useEffect(() => {
    if (stage !== 'breaking') return;
    const interval = setInterval(() => {
      setGlitchIndex(i => (i + 1) % GLITCH_LINES.length);
    }, 550);
    return () => clearInterval(interval);
  }, [stage]);

  const handleClick = () => {
    if (stage !== 'idle' || alreadyUsed) return;

    // Lock immediately so a double-click / re-render can't fire it twice,
    // and mark this device/browser as having used the link.
    localStorage.setItem(USED_KEY, '1');
    setStage('shaking');

    window.setTimeout(() => setStage('breaking'), SHAKE_MS);

    window.setTimeout(() => {
      addInviteVisitor();
      setStage('done');
    }, SHAKE_MS + BREAK_MS);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-black relative overflow-hidden flex items-center justify-center select-none">
      {/* Background grid, subtle, fades once breaking starts */}
      <motion.div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
        animate={{ opacity: stage === 'idle' ? 0.06 : 0 }}
        transition={{ duration: 0.4 }}
      />

      {/* ── Idle / used states ─────────────────────────────────────────── */}
      {alreadyUsed && stage === 'idle' && (
        <p className="text-white/30 text-xs tracking-widest uppercase font-mono">
          Este enlace ya fue utilizado en este dispositivo
        </p>
      )}

      {!alreadyUsed && (
        <motion.div
          className="relative"
          animate={
            stage === 'shaking'
              ? { x: [0, -6, 6, -8, 8, -4, 4, 0], y: [0, 4, -4, 6, -6, 2, -2, 0] }
              : {}
          }
          transition={{ duration: 0.45, repeat: stage === 'shaking' ? Infinity : 0 }}
        >
          <AnimatePresence>
            {(stage === 'idle' || stage === 'shaking') && (
              <motion.button
                data-testid="button-invite-empty"
                onClick={handleClick}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  boxShadow: [
                    '0 0 0px rgba(255,255,255,0.15)',
                    '0 0 40px rgba(255,255,255,0.25)',
                    '0 0 0px rgba(255,255,255,0.15)',
                  ],
                }}
                exit={{ opacity: 0, scale: 1.4 }}
                transition={{
                  boxShadow: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
                  default: { duration: 0.4 },
                }}
                className="h-24 w-24 rounded-full border border-white/15 bg-white/[0.03] backdrop-blur-sm cursor-pointer"
                aria-label="?"
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Breaking apart: flying shards ─────────────────────────────── */}
      <AnimatePresence>
        {stage === 'breaking' &&
          shards.map(s => (
            <motion.div
              key={s.id}
              className="absolute rounded-sm border border-white/10"
              style={{
                top: `${s.top}%`,
                left: `${s.left}%`,
                width: s.w,
                height: s.h,
                background: s.hue,
              }}
              initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
              animate={{
                x: s.flyX,
                y: s.flyY,
                rotate: s.flyRot,
                opacity: 0,
              }}
              transition={{ duration: s.duration, delay: s.delay, ease: 'easeIn' }}
            />
          ))}
      </AnimatePresence>

      {/* ── Smoke puffs ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {stage === 'breaking' &&
          Array.from({ length: 18 }).map((_, i) => (
            <motion.div
              key={`smoke-${i}`}
              className="absolute rounded-full bg-white/10 blur-2xl"
              style={{
                top: `${40 + Math.random() * 30}%`,
                left: `${30 + Math.random() * 40}%`,
                width: 120 + Math.random() * 160,
                height: 120 + Math.random() * 160,
              }}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: [0, 0.5, 0], scale: 2.2, y: -80 }}
              transition={{ duration: 3, delay: (i * (BREAK_MS / 1000 - 3)) / 18, ease: 'easeOut' }}
            />
          ))}
      </AnimatePresence>

      {/* ── Red flash + glitch text ────────────────────────────────────── */}
      <AnimatePresence>
        {stage === 'breaking' && (
          <>
            <motion.div
              className="absolute inset-0 bg-red-600 mix-blend-screen pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.35, 0, 0.2, 0] }}
              transition={{ duration: 1.4, repeat: Math.ceil(BREAK_MS / 1400) }}
            />
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.span
                key={glitchIndex}
                initial={{ opacity: 0, skewX: -15, x: -10 }}
                animate={{ opacity: 1, skewX: 0, x: 0 }}
                className="text-red-500 font-mono font-black tracking-widest text-lg md:text-2xl text-center px-4"
                style={{ textShadow: '2px 0 #00f, -2px 0 #f0f' }}
              >
                {GLITCH_LINES[glitchIndex]}
              </motion.span>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Final state ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {stage === 'done' && (
          <motion.div
            className="flex flex-col items-center space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <span className="h-2 w-2 rounded-full bg-primary" />
            <p className="text-white/40 text-xs tracking-widest uppercase font-mono">
              Visita registrada
            </p>
            <p className="text-white/20 text-[10px] font-mono">Ya puedes cerrar esta ventana</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
