import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radar, Camera, Brain, Navigation, Cog, Gauge, Shield, Cpu,
  Play, RotateCcw, Zap
} from 'lucide-react';
import './DominoBlastDoor.css';

/* ── Service "dominoes" in dependency order ── */
const DOMINOES = [
  { id: 'lidar',      name: 'LIDAR',       icon: Radar },
  { id: 'camera',     name: 'Camera',      icon: Camera },
  { id: 'perception', name: 'Perception',  icon: Brain },
  { id: 'fusion',     name: 'Fusion',      icon: Cpu },
  { id: 'navigation', name: 'Navigation',  icon: Navigation },
  { id: 'planner',    name: 'Planner',     icon: Gauge },
  { id: 'motor',      name: 'Motor',       icon: Cog },
  { id: 'safety',     name: 'Safety',      icon: Shield },
];

// Which domino index is the "crash origin"
const CRASH_INDEX = 0; // LIDAR fails
// Blast door drops after the crash origin
const BLAST_DOOR_AFTER = 0; // Between index 0 and 1

const NARRATIONS = {
  idle: 'Press "Simulate Crash" to see what happens when a critical sensor fails.',
  crashing_without: '💥 LIDAR crashes! Without an orchestrator, the failure propagates unchecked...',
  cascade_without: '😱 Every downstream service topples like dominoes — Perception, Navigation, Motor Control — total system collapse!',
  result_without: '☠️ RESULT: Complete system failure. A 2-ton robot loses all sensor data and crashes into obstacles.',
  crashing_with: '💥 LIDAR crashes! But Cortex is watching...',
  blast_door: '🛡️ CORTEX INTERVENES! Blast doors slam down — isolating the failure instantly.',
  healing: '🔄 Cortex restarts LIDAR while all other services remain safely operational...',
  result_with: '✅ RESULT: LIDAR recovers in 3 seconds. Zero cascade. Zero downtime. Robot continues safely.',
};

export default function DominoBlastDoor() {
  // States for each panel's dominoes
  const [withoutStates, setWithoutStates] = useState(DOMINOES.map(() => 'standing'));
  const [withStates, setWithStates] = useState(DOMINOES.map(() => 'standing'));
  const [phase, setPhase] = useState('idle');
  const [narration, setNarration] = useState(NARRATIONS.idle);
  const [showBlastDoor, setShowBlastDoor] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [showFlashLeft, setShowFlashLeft] = useState(false);
  const [showFlashRight, setShowFlashRight] = useState(false);
  const [resultLeft, setResultLeft] = useState(null);
  const [resultRight, setResultRight] = useState(null);
  const cancelRef = useRef(false);

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  const triggerShake = useCallback(() => {
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
  }, []);

  const simulate = useCallback(async () => {
    cancelRef.current = false;
    setPhase('running');
    setWithoutStates(DOMINOES.map(() => 'standing'));
    setWithStates(DOMINOES.map(() => 'standing'));
    setShowBlastDoor(false);
    setResultLeft(null);
    setResultRight(null);

    // === PHASE 1: Initial crash on BOTH sides ===
    setNarration(NARRATIONS.crashing_without);
    await wait(800);

    // Crash LIDAR on left panel
    setShowFlashLeft(true);
    triggerShake();
    setWithoutStates(prev => prev.map((s, i) => i === CRASH_INDEX ? 'fallen' : s));
    await wait(300);
    setShowFlashLeft(false);

    // Crash LIDAR on right panel too
    setShowFlashRight(true);
    setWithStates(prev => prev.map((s, i) => i === CRASH_INDEX ? 'fallen' : s));
    await wait(300);
    setShowFlashRight(false);
    setNarration(NARRATIONS.crashing_with);
    await wait(1000);

    if (cancelRef.current) return;

    // === PHASE 2: LEFT side — cascading failure ===
    setNarration(NARRATIONS.cascade_without);
    for (let i = CRASH_INDEX + 1; i < DOMINOES.length; i++) {
      if (cancelRef.current) return;
      await wait(350);
      setWithoutStates(prev => prev.map((s, j) => j === i ? 'fallen' : s));
      triggerShake();
    }

    await wait(500);
    setResultLeft('fail');
    setNarration(NARRATIONS.result_without);

    // === PHASE 3: RIGHT side — Cortex blast door ===
    await wait(1500);
    if (cancelRef.current) return;

    setNarration(NARRATIONS.blast_door);
    setShowBlastDoor(true);

    // Mark all services after crash as "protected"
    await wait(400);
    setWithStates(prev => prev.map((s, i) => {
      if (i === CRASH_INDEX) return 'fallen';
      return 'protected';
    }));

    await wait(1500);
    if (cancelRef.current) return;

    // === PHASE 4: RIGHT side — healing ===
    setNarration(NARRATIONS.healing);
    await wait(600);

    // Restart the crashed service
    setWithStates(prev => prev.map((s, i) => i === CRASH_INDEX ? 'restarted' : s));
    await wait(1200);

    // Remove blast door, all services fully green
    setShowBlastDoor(false);
    await wait(300);
    setWithStates(DOMINOES.map(() => 'protected'));
    setResultRight('success');
    setNarration(NARRATIONS.result_with);

    setPhase('done');
  }, [triggerShake]);

  const reset = useCallback(() => {
    cancelRef.current = true;
    setPhase('idle');
    setWithoutStates(DOMINOES.map(() => 'standing'));
    setWithStates(DOMINOES.map(() => 'standing'));
    setShowBlastDoor(false);
    setNarration(NARRATIONS.idle);
    setResultLeft(null);
    setResultRight(null);
    setShaking(false);
  }, []);

  const renderDomino = (svc, i, state, side) => {
    const Icon = svc.icon;
    const isFallen = state === 'fallen';

    return (
      <motion.div
        key={`${side}-${svc.id}`}
        className={`domino-piece ${state}`}
        animate={{
          rotate: isFallen ? (side === 'left' ? 75 : 75) : 0,
          y: isFallen ? 15 : 0,
          opacity: 1,
        }}
        transition={{
          type: 'spring',
          stiffness: isFallen ? 120 : 300,
          damping: isFallen ? 8 : 20,
        }}
      >
        <Icon className="domino-piece-icon" size={16} />
        <span className="domino-piece-name">{svc.name}</span>
      </motion.div>
    );
  };

  return (
    <section className="section domino-section" id="blast-door">
      <motion.div className="section-badge" initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        01 — THE CORE PROBLEM
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
        When One Part Fails, Everything Falls
      </motion.h2>
      <motion.p className="section-sub" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
        A robot's software is a chain of interdependent services. Without an intelligent
        orchestrator, a single failure cascades through the entire system. With Cortex, 
        blast doors slam down to isolate the damage and self-heal.
      </motion.p>

      <motion.div
        className={`domino-stage ${shaking ? 'shake' : ''}`}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
      >
        {/* LEFT: Without Cortex */}
        <div className="domino-panel panel-without">
          <span className="domino-panel-label">WITHOUT CORTEX</span>
          <div className="panel-without-title">Traditional Approach</div>
          <div className="panel-without-sub">No orchestration — no safety net</div>

          <AnimatePresence>
            {showFlashLeft && (
              <motion.div
                className="domino-flash"
                initial={{ backgroundColor: 'rgba(248,113,113,0)' }}
                animate={{ backgroundColor: 'rgba(248,113,113,0.15)' }}
                exit={{ backgroundColor: 'rgba(248,113,113,0)' }}
                transition={{ duration: 0.3 }}
              />
            )}
          </AnimatePresence>

          <div className="domino-track">
            {DOMINOES.map((svc, i) => renderDomino(svc, i, withoutStates[i], 'left'))}
          </div>

          <AnimatePresence>
            {resultLeft && (
              <motion.div
                className="domino-result fail"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                ☠️ TOTAL SYSTEM FAILURE — Robot crashes
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: With Cortex */}
        <div className="domino-panel panel-with">
          <span className="domino-panel-label">WITH CORTEX</span>
          <div className="panel-with-title">Cortex Orchestration</div>
          <div className="panel-with-sub">Intelligent failure isolation + auto-recovery</div>

          <AnimatePresence>
            {showFlashRight && (
              <motion.div
                className="domino-flash"
                initial={{ backgroundColor: 'rgba(248,113,113,0)' }}
                animate={{ backgroundColor: 'rgba(248,113,113,0.15)' }}
                exit={{ backgroundColor: 'rgba(248,113,113,0)' }}
                transition={{ duration: 0.3 }}
              />
            )}
          </AnimatePresence>

          <div className="domino-track" style={{ position: 'relative' }}>
            {DOMINOES.map((svc, i) => renderDomino(svc, i, withStates[i], 'right'))}

            {/* Blast Door */}
            <AnimatePresence>
              {showBlastDoor && (
                <motion.div
                  className="blast-door"
                  style={{
                    position: 'absolute',
                    left: `${((BLAST_DOOR_AFTER + 1) * (36 + 12)) - 6}px`,
                    bottom: 0,
                  }}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 100, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                />
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {resultRight && (
              <motion.div
                className="domino-result success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                ✅ ZERO CASCADE — LIDAR recovered, robot continues safely
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Narration */}
      <motion.div
        className="domino-narration"
        key={narration}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {narration}
      </motion.div>

      {/* Controls */}
      <div className="controls" style={{ marginTop: 16 }}>
        <button className="btn btn-danger" onClick={simulate} disabled={phase === 'running'}>
          <Zap size={14} /> Simulate Crash
        </button>
        <button className="btn btn-ghost" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </section>
  );
}
