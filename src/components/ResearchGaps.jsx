import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useRef, useState, useEffect, useCallback } from 'react'

/* ═══════════════════════════════════════════════════════
   FRONT PAGE — Cinematic intro before research gaps
   ═══════════════════════════════════════════════════════ */
function FrontPage() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  const stats = [
    { value: '5', label: 'Research Gaps Identified' },
    { value: '12+', label: 'Papers Reviewed' },
    { value: '0', label: 'Existing Solutions' },
  ]

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 overflow-hidden"
    >
      {/* Animated background grid */}
      <div className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.08) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />
      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,_rgba(99,102,241,0.12)_0%,_transparent_60%)]" />

      {/* Floating accent orbs */}
      <motion.div
        animate={{ y: [-20, 20, -20], x: [-10, 10, -10], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[20%] left-[15%] w-48 h-48 sm:w-72 sm:h-72 rounded-full bg-indigo-500/10 blur-3xl"
      />
      <motion.div
        animate={{ y: [15, -15, 15], x: [10, -10, 10], opacity: [0.1, 0.25, 0.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-[20%] right-[15%] w-56 h-56 sm:w-80 sm:h-80 rounded-full bg-violet-500/10 blur-3xl"
      />

      <div className="relative z-10 text-center max-w-4xl">
        {/* Top badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6 sm:mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-[0.65rem] sm:text-xs font-semibold tracking-[3px] uppercase text-indigo-300">
            Systematic Literature Review
          </span>
        </motion.div>

        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.1] mb-4 sm:mb-6"
        >
          <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            The Research Gaps
          </span>
          <br />
          <span className="bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
            That Led to Cortex
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="text-sm sm:text-base lg:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10 sm:mb-14"
        >
          Through systematic review of recent literature in fault-tolerant scheduling,
          cyber-physical systems, and edge computing, we identified <strong className="text-slate-200">five critical unsolved problems</strong> that
          no existing framework addresses.
        </motion.p>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-10 mb-12 sm:mb-16"
        >
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 1 + i * 0.15, duration: 0.4 }}
              className="flex flex-col items-center px-4 sm:px-6 py-3 sm:py-4 rounded-2xl bg-slate-800/30 border border-slate-700/30 backdrop-blur-sm min-w-[100px] sm:min-w-[140px]"
            >
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
                {s.value}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 mt-1 font-medium">{s.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Scroll prompt */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.8 }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-xs sm:text-sm text-slate-500 font-medium">Scroll to explore each gap</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-5 h-8 sm:w-6 sm:h-9 rounded-full border-2 border-slate-600 flex items-start justify-center pt-1.5"
          >
            <motion.div
              animate={{ opacity: [1, 0.3, 1], y: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-1.5 sm:w-1.5 sm:h-2 rounded-full bg-slate-400"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

/* ─── Shared Gap Section Wrapper ─── */
function GapSection({ children, index, title, subtitle, id, paper }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, amount: 0.3 })
  const [replayKey, setReplayKey] = useState(0)

  const handleReplay = useCallback(() => {
    setReplayKey(prev => prev + 1)
  }, [])

  return (
    <section
      ref={ref}
      id={id}
      className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-[6vw] py-16 sm:py-20 overflow-hidden"
    >
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 w-full max-w-6xl"
      >
        {/* Gap number badge + Replay button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 text-red-400 font-mono font-bold text-xs sm:text-sm">
              {String(index).padStart(2, '0')}
            </span>
            <span className="uppercase text-[0.6rem] sm:text-[0.65rem] tracking-[4px] text-red-400/80 font-semibold">Research Gap</span>
          </div>
          <motion.button
            onClick={handleReplay}
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9, rotate: 360 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-800/50 border border-slate-700/40 text-slate-400 hover:text-indigo-300 hover:border-indigo-500/30 hover:bg-indigo-500/10 transition-colors duration-200 cursor-pointer"
            title="Replay animation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-4 sm:h-4">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
            <span className="text-[10px] sm:text-xs font-medium hidden sm:inline">Replay</span>
          </motion.button>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold mb-3 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent leading-tight text-center sm:text-left">
          {title}
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-400 max-w-2xl mb-4 sm:mb-5 leading-relaxed text-center sm:text-left">
          {subtitle}
        </p>

        {/* Paper citation */}
        {paper && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex items-start gap-2.5 sm:gap-3 mb-8 sm:mb-12 max-w-3xl px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-800/40 border border-slate-700/30 backdrop-blur-sm"
          >
            <span className="text-base sm:text-lg mt-0.5 shrink-0">{'\ud83d\udcd1'}</span>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-indigo-300 tracking-wide uppercase mb-1">
                Reference [{paper.ref}]
              </p>
              <p className="text-[11px] sm:text-sm text-slate-300 leading-relaxed">
                {paper.authors}, {'\u201c'}{paper.title},{'\u201d'}{' '}
                <span className="italic text-slate-400">{paper.journal}</span>,{' '}
                {paper.volume && <span>{paper.volume}, </span>}
                {paper.pages && <span>pp. {paper.pages}, </span>}
                {paper.year}.
              </p>
            </div>
          </motion.div>
        )}

        {/* Animation content — keyed for replay */}
        <AnimatePresence mode="wait">
          {isInView && (
            <motion.div
              key={replayKey}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  )
}

/* ─── Terminal Line Component ─── */
function TermLine({ prefix = '$', text, color = 'text-slate-300', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="font-mono text-xs sm:text-sm flex gap-2"
    >
      <span className="text-krill-green select-none">{prefix}</span>
      <span className={color}>{text}</span>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   GAP 1: Theory-to-Deployment Gap
   Elegant math equations dissolve → terminal ERROR
   ═══════════════════════════════════════════════════════ */
function Gap1Animation() {
  const [phase, setPhase] = useState('math')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('dissolve'), 3000)
    const t2 = setTimeout(() => setPhase('error'), 4500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const equations = [
    'G = (V, E) where V = {v₁, v₂, ..., vₙ}',
    'A[i][j] = 1 iff (vᵢ, vⱼ) ∈ E',
    'FT(G) = ∏ᵢ P(survive(vᵢ)) · ∑ₖ R(pathₖ)',
    'τ_recovery ≤ δ_max ∀ vᵢ ∈ critical(G)',
    'Theorem 3.2: ∀ DAG G, ∃ schedule S s.t. FT(S) ≥ 1-ε',
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Left: Academic paper / Math */}
      <div className={`relative rounded-2xl border p-5 sm:p-8 transition-all duration-1000 ${
        phase === 'math' ? 'bg-gradient-to-br from-indigo-950/50 to-violet-950/30 border-indigo-500/20' :
        'bg-gradient-to-br from-red-950/20 to-slate-950/50 border-red-500/20'
      }`}>
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <span className="text-lg sm:text-xl">📄</span>
          <span className="text-xs sm:text-sm font-semibold text-indigo-300">Academic Paper — Theorem & Proofs</span>
        </div>
        <div className="space-y-3 sm:space-y-4">
          {equations.map((eq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: phase === 'dissolve' || phase === 'error' ? 0 : 1,
                x: phase === 'dissolve' ? 40 : 0,
                filter: phase === 'dissolve' ? 'blur(8px)' : 'blur(0px)',
              }}
              transition={{ delay: phase === 'math' ? i * 0.2 : i * 0.08, duration: 0.6 }}
              className="font-mono text-xs sm:text-sm text-indigo-200/80 bg-indigo-500/5 px-3 sm:px-4 py-2 rounded-lg border border-indigo-500/10"
            >
              {eq}
            </motion.div>
          ))}
        </div>
        {phase !== 'math' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="text-5xl sm:text-7xl opacity-20">🚫</span>
          </motion.div>
        )}
      </div>

      {/* Right: Terminal */}
      <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900 to-slate-950 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 border-b border-slate-700/30">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500/70" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500/70" />
          </div>
          <span className="text-[10px] sm:text-xs text-slate-500 font-mono ml-2">deployment-attempt</span>
        </div>
        <div className="p-4 sm:p-5 space-y-2 min-h-[220px] sm:min-h-[260px]">
          <TermLine text="cat fault_tolerant_dag_scheduler.pdf" delay={0.5} />
          <TermLine prefix="→" text="✓ 47 pages, 12 theorems, 3 proofs" color="text-slate-500" delay={1.0} />
          <TermLine text="./deploy --target edge-device" delay={1.8} />
          {phase === 'error' && (
            <>
              <TermLine prefix="✗" text="ERROR: No deployable binary found" color="text-red-400" delay={0.1} />
              <TermLine prefix="✗" text="ERROR: Mathematical model ≠ runtime system" color="text-red-400" delay={0.3} />
              <TermLine prefix="✗" text='FATAL: "Theorem 3.2" cannot be executed' color="text-red-400" delay={0.5} />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-4 px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs sm:text-sm text-red-300 font-mono"
              >
                💀 Theory exists. Deployable code does not.
              </motion.div>
            </>
          )}
          {phase === 'math' && (
            <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-2 h-4 bg-krill-green ml-1" />
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   GAP 2: Blind Actuation
   Software crashes but robot arm keeps swinging
   ═══════════════════════════════════════════════════════ */
function Gap2Animation() {
  const [phase, setPhase] = useState('running')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('crash'), 3000)
    return () => clearTimeout(t1)
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Left: Software Monitor */}
      <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900 to-slate-950 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <span className="text-base sm:text-lg">🖥️</span>
          <span className="text-xs sm:text-sm font-semibold text-slate-300">Software Monitoring Panel</span>
        </div>

        {/* Heartbeat line */}
        <div className="relative h-16 sm:h-20 mb-4 sm:mb-5 rounded-xl bg-slate-800/50 border border-slate-700/30 overflow-hidden">
          <svg viewBox="0 0 400 80" className="w-full h-full" preserveAspectRatio="none">
            {phase === 'running' ? (
              <motion.path
                d="M0,40 L60,40 L75,15 L90,65 L105,20 L120,55 L135,40 L200,40 L215,15 L230,65 L245,20 L260,55 L275,40 L400,40"
                fill="none"
                stroke="#4ade80"
                strokeWidth="2.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            ) : (
              <motion.path
                d="M0,40 L60,40 L75,15 L90,65 L95,40 L400,40"
                fill="none"
                stroke="#f87171"
                strokeWidth="2.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5 }}
              />
            )}
          </svg>
          {phase === 'crash' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-red-500/10"
            >
              <span className="text-red-400 font-mono text-xs sm:text-sm font-bold tracking-wider">■ FLATLINED</span>
            </motion.div>
          )}
        </div>

        {/* Process list */}
        {['nav_controller', 'perception_ai', 'motor_driver'].map((proc, i) => (
          <motion.div
            key={proc}
            animate={phase === 'crash' ? { opacity: [1, 0.3], x: [0, 2, -2, 0] } : {}}
            transition={phase === 'crash' ? { delay: i * 0.15, duration: 0.3 } : {}}
            className={`flex items-center justify-between py-2 px-3 rounded-lg mb-1.5 text-xs sm:text-sm font-mono ${
              phase === 'crash' ? 'bg-red-500/10 border border-red-500/20' : 'bg-slate-800/30'
            }`}
          >
            <span className="text-slate-300">{proc}</span>
            <span className={phase === 'crash' ? 'text-red-400' : 'text-krill-green'}>
              {phase === 'crash' ? '✗ CRASHED' : '● RUNNING'}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Right: Robot Arm still moving */}
      <div className={`rounded-2xl border p-5 sm:p-6 relative overflow-hidden transition-all duration-500 ${
        phase === 'crash'
          ? 'bg-gradient-to-br from-red-950/30 to-orange-950/20 border-red-500/30'
          : 'bg-gradient-to-br from-slate-900 to-slate-950 border-slate-700/50'
      }`}>
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg">🦾</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-300">Physical Actuator</span>
          </div>
          {phase === 'crash' && (
            <motion.span
              animate={{ opacity: [1, 0.3] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="text-[10px] sm:text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20"
            >
              ⚠ UNCONTROLLED
            </motion.span>
          )}
        </div>

        {/* Animated robot arm */}
        <div className="flex items-center justify-center h-36 sm:h-48 relative">
          <div className="relative w-24 sm:w-32">
            {/* Base */}
            <div className="w-full h-4 bg-slate-600 rounded-md" />
            {/* Arm segment */}
            <motion.div
              className="absolute bottom-3 left-1/2 -ml-1.5 w-3 h-20 sm:h-28 bg-gradient-to-t from-slate-500 to-slate-400 rounded-sm origin-bottom"
              animate={phase === 'crash'
                ? { rotate: [-30, 45, -50, 60, -40, 55] }
                : { rotate: [-15, 15] }
              }
              transition={phase === 'crash'
                ? { repeat: Infinity, duration: 0.6, ease: 'easeInOut' }
                : { repeat: Infinity, duration: 3, ease: 'easeInOut' }
              }
            >
              {/* Claw */}
              <div className="absolute -top-1 left-1/2 -ml-2.5 w-5 h-5 border-2 border-slate-400 rounded-sm" />
              {phase === 'crash' && (
                <motion.div
                  animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                  transition={{ repeat: Infinity, duration: 0.3 }}
                  className="absolute -top-3 left-1/2 -ml-3 w-6 h-6 text-center text-orange-400 text-xs"
                >
                  ⚡
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>

        {phase === 'crash' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 sm:mt-4 px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs sm:text-sm text-red-300 text-center"
          >
            Software is dead. The arm doesn't know — it keeps moving.
          </motion.div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   GAP 3: AI Overhead on Edge Devices
   Heavy ML model crushes tiny device vs instant topo sort
   ═══════════════════════════════════════════════════════ */
function Gap3Animation() {
  const [phase, setPhase] = useState('loading')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 73) {
          clearInterval(interval)
          setTimeout(() => setPhase('dead'), 800)
          return 73
        }
        return prev + 1
      })
    }, 60)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Left: Heavy ML approach */}
      <div className={`rounded-2xl border p-5 sm:p-6 transition-all duration-700 ${
        phase === 'dead'
          ? 'bg-gradient-to-br from-red-950/30 to-slate-950 border-red-500/30'
          : 'bg-gradient-to-br from-violet-950/30 to-slate-950 border-violet-500/20'
      }`}>
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <span className="text-base sm:text-lg">🧠</span>
          <span className="text-xs sm:text-sm font-semibold text-violet-300">GNN-Based Task Scheduler (GART)</span>
        </div>

        {/* Device */}
        <div className={`rounded-xl border p-3 sm:p-4 mb-3 sm:mb-4 transition-all duration-500 ${
          phase === 'dead' ? 'bg-red-500/5 border-red-500/20' : 'bg-slate-800/30 border-slate-700/30'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs text-slate-400 font-mono">Edge Device — ARM Cortex-A53 (1GB RAM)</span>
            {phase === 'dead' && (
              <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.4 }}
                className="text-[10px] sm:text-xs text-red-400 font-bold">OOM KILL</motion.span>
            )}
          </div>
          {/* Memory bar */}
          <div className="h-5 sm:h-6 rounded-full bg-slate-800 overflow-hidden mb-2 border border-slate-700/30">
            <motion.div
              className={`h-full rounded-full transition-colors duration-300 ${
                progress > 60 ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                progress > 40 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                'bg-gradient-to-r from-violet-500 to-indigo-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] sm:text-xs text-slate-500 font-mono">
            <span>RAM: {Math.floor(progress * 10.24)}MB / 1024MB</span>
            <span className={progress > 60 ? 'text-red-400' : ''}>{progress}%</span>
          </div>
        </div>

        {/* Loading neural network */}
        <div className="space-y-1.5 sm:space-y-2 font-mono text-[10px] sm:text-xs">
          <div className="text-slate-500">Loading model layers...</div>
          {['attention_layer_1 [128×128]', 'graph_conv_2 [256×256]', 'pooling_3 [512×512]'].map((layer, i) => (
            <div key={i} className={`flex justify-between px-2 py-1 rounded ${
              progress > 30 + i * 15 ? 'text-slate-300' : 'text-slate-600'
            }`}>
              <span>{layer}</span>
              <span>{progress > 30 + i * 15 ? '✓' : '...'}</span>
            </div>
          ))}
        </div>

        {phase === 'dead' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-red-400 font-semibold">
            Device killed the process. Too heavy for edge.
          </motion.div>
        )}

        <div className="mt-3 sm:mt-4 text-center">
          <span className="text-[10px] sm:text-xs text-slate-500 font-mono">Latency: ~340ms per scheduling decision</span>
        </div>
      </div>

      {/* Right: O(V+E) Topological Sort */}
      <div className="rounded-2xl border border-krill-green/20 bg-gradient-to-br from-emerald-950/20 to-slate-950 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <span className="text-base sm:text-lg">⚡</span>
          <span className="text-xs sm:text-sm font-semibold text-krill-green">Krill — Deterministic Topo Sort</span>
        </div>

        <div className="rounded-xl bg-slate-800/30 border border-slate-700/30 p-3 sm:p-4 mb-3 sm:mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs text-slate-400 font-mono">Same Edge Device — ARM Cortex-A53</span>
          </div>
          <div className="h-5 sm:h-6 rounded-full bg-slate-800 overflow-hidden mb-2 border border-slate-700/30">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400"
              initial={{ width: '0%' }}
              animate={{ width: '3%' }}
              transition={{ delay: 1, duration: 0.1 }}
            />
          </div>
          <div className="flex justify-between text-[10px] sm:text-xs text-slate-500 font-mono">
            <span>RAM: 2MB / 1024MB</span>
            <span className="text-krill-green">0.2%</span>
          </div>
        </div>

        {/* Instant sort visualization */}
        <div className="space-y-2">
          {phase === 'dead' && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.15 }}
              className="origin-left"
            >
              {['sensor_init → lidar_driver → nav_stack → motor_ctrl', 'Resolved 4 nodes, 3 edges'].map((line, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="font-mono text-[10px] sm:text-xs text-krill-green/80 py-1">{line}</motion.div>
              ))}
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'dead' ? 1 : 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 sm:mt-5 py-2 sm:py-3 px-3 sm:px-4 rounded-lg bg-krill-green/10 border border-krill-green/20 text-center"
        >
          <span className="text-xl sm:text-2xl font-bold text-krill-green font-mono">47μs</span>
          <span className="text-[10px] sm:text-xs text-krill-green/60 block">vs 340,000μs for GNN</span>
        </motion.div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   GAP 4: Cloud Dependency
   Wi-Fi signal dies → all devices go dark
   ═══════════════════════════════════════════════════════ */
function Gap4Animation() {
  const [phase, setPhase] = useState('connected')
  const [signalBars, setSignalBars] = useState(4)

  useEffect(() => {
    const t1 = setTimeout(() => setSignalBars(3), 1500)
    const t2 = setTimeout(() => setSignalBars(2), 2500)
    const t3 = setTimeout(() => setSignalBars(1), 3200)
    const t4 = setTimeout(() => { setSignalBars(0); setPhase('disconnected') }, 4000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [])

  const devices = [
    { name: 'Rover-01', icon: '🤖', x: 15, y: 25 },
    { name: 'Drone-02', icon: '🛸', x: 75, y: 20 },
    { name: 'Arm-03', icon: '🦾', x: 25, y: 70 },
    { name: 'Sensor-04', icon: '📡', x: 70, y: 75 },
  ]

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900 to-slate-950 p-5 sm:p-8 relative overflow-hidden">
      {/* Signal indicator */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <span className="text-base sm:text-lg">📶</span>
          <span className="text-xs sm:text-sm font-semibold text-slate-300">Network Status</span>
        </div>
        <div className="flex items-end gap-0.5 h-4 sm:h-5">
          {[1, 2, 3, 4].map(bar => (
            <div
              key={bar}
              className={`w-1 sm:w-1.5 rounded-sm transition-all duration-300 ${
                bar <= signalBars
                  ? signalBars <= 1 ? 'bg-red-400' : signalBars <= 2 ? 'bg-amber-400' : 'bg-krill-green'
                  : 'bg-slate-700'
              }`}
              style={{ height: `${bar * 25}%` }}
            />
          ))}
          {signalBars === 0 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="text-red-400 font-bold text-xs sm:text-sm ml-2">✕</motion.span>
          )}
        </div>
      </div>

      {/* Cloud + devices visual */}
      <div className="relative h-48 sm:h-64 lg:h-72">
        {/* Cloud */}
        <motion.div
          animate={phase === 'disconnected' ? { opacity: 0.2, scale: 0.9 } : { opacity: 1 }}
          className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center"
        >
          <div className="text-3xl sm:text-4xl lg:text-5xl mb-1">☁️</div>
          <span className={`text-[10px] sm:text-xs font-mono ${
            phase === 'disconnected' ? 'text-red-400' : 'text-krill-green'
          }`}>
            {phase === 'disconnected' ? 'UNREACHABLE' : 'CLOUD SERVER'}
          </span>
        </motion.div>

        {/* Connection lines + Devices */}
        {devices.map((d, i) => (
          <motion.div
            key={d.name}
            className="absolute flex flex-col items-center"
            style={{ left: `${d.x}%`, top: `${d.y}%` }}
            animate={phase === 'disconnected'
              ? { opacity: [1, 0.15], transition: { delay: i * 0.2, duration: 0.5 } }
              : { opacity: 1 }
            }
          >
            <span className="text-xl sm:text-2xl lg:text-3xl">{d.icon}</span>
            <span className={`text-[9px] sm:text-[10px] font-mono mt-1 ${
              phase === 'disconnected' ? 'text-red-400' : 'text-slate-400'
            }`}>
              {d.name}
            </span>
            {phase === 'disconnected' && (
              <motion.span
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.2 }}
                className="text-[9px] sm:text-[10px] text-red-400 font-bold mt-0.5"
              >OFFLINE</motion.span>
            )}
          </motion.div>
        ))}

        {/* Data particles flowing to cloud (when connected) */}
        {phase === 'connected' && devices.map((d, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-indigo-400"
            initial={{ left: `${d.x}%`, top: `${d.y}%`, opacity: 0 }}
            animate={{ left: '50%', top: '5%', opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
      </div>

      {phase === 'disconnected' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="text-center py-3 sm:py-4 px-4 rounded-xl bg-red-500/10 border border-red-500/20"
        >
          <p className="text-xs sm:text-sm text-red-300 font-medium">
            No signal → No fault tolerance. Every device is now unmanaged.
          </p>
          <p className="text-[10px] sm:text-xs text-red-400/50 mt-1 font-mono">
            Scenario: Underground tunnel, ocean floor, air-gapped facility
          </p>
        </motion.div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   GAP 5: Centralized Single Point of Failure
   Star topology — center crashes → all spokes die
   ═══════════════════════════════════════════════════════ */
function Gap5Animation() {
  const [phase, setPhase] = useState('running')
  const [overload, setOverload] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setOverload(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => setPhase('crashed'), 300)
          return 100
        }
        return prev + 2
      })
    }, 60)
    return () => clearInterval(interval)
  }, [])

  const nodes = [
    { label: 'Machine A', angle: 0 },
    { label: 'Machine B', angle: 60 },
    { label: 'Machine C', angle: 120 },
    { label: 'Machine D', angle: 180 },
    { label: 'Machine E', angle: 240 },
    { label: 'Machine F', angle: 300 },
  ]

  const radius = typeof window !== 'undefined' && window.innerWidth < 640 ? 90 : 130

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900 to-slate-950 p-5 sm:p-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg">🌐</span>
          <span className="text-xs sm:text-sm font-semibold text-slate-300">Centralized Fog Architecture</span>
        </div>
        <div className="text-[10px] sm:text-xs font-mono text-slate-500">
          Load: <span className={overload > 70 ? 'text-red-400' : overload > 40 ? 'text-amber-400' : 'text-krill-green'}>
            {overload}%
          </span>
        </div>
      </div>

      {/* Topology visualization */}
      <div className="relative mx-auto" style={{ width: radius * 2 + 80, height: radius * 2 + 80, maxWidth: '100%', aspectRatio: '1' }}>
        {/* Connection lines (SVG) */}
        <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${radius * 2 + 80} ${radius * 2 + 80}`}>
          {nodes.map((node, i) => {
            const cx = radius + 40
            const cy = radius + 40
            const nx = cx + Math.cos((node.angle * Math.PI) / 180) * radius
            const ny = cy + Math.sin((node.angle * Math.PI) / 180) * radius
            return (
              <motion.line
                key={i}
                x1={cx} y1={cy} x2={nx} y2={ny}
                stroke={phase === 'crashed' ? '#f8717144' : overload > 70 ? '#fbbf2444' : '#6366f144'}
                strokeWidth="1.5"
                strokeDasharray={phase === 'crashed' ? '4,6' : 'none'}
                animate={phase === 'crashed' ? { opacity: [0.3, 0] } : {}}
                transition={phase === 'crashed' ? { delay: i * 0.1, duration: 0.5 } : {}}
              />
            )
          })}
        </svg>

        {/* Center fog server */}
        <motion.div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center border-2 z-10 transition-colors duration-300 ${
            phase === 'crashed'
              ? 'bg-red-500/20 border-red-500/50'
              : overload > 70
              ? 'bg-amber-500/20 border-amber-500/40'
              : 'bg-indigo-500/20 border-indigo-500/30'
          }`}
          animate={phase === 'crashed'
            ? { scale: [1, 0.8], opacity: [1, 0.3] }
            : overload > 70
            ? { scale: [1, 1.05, 1] }
            : {}
          }
          transition={phase === 'crashed'
            ? { duration: 0.4 }
            : { repeat: Infinity, duration: 0.5 }
          }
        >
          <span className="text-lg sm:text-xl">{phase === 'crashed' ? '💥' : '🖥️'}</span>
          <span className="text-[8px] sm:text-[10px] font-mono text-slate-400 mt-0.5">FOG</span>
          {phase === 'crashed' && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 rounded-2xl border-2 border-red-500"
            />
          )}
        </motion.div>

        {/* Spoke nodes */}
        {nodes.map((node, i) => {
          const cx = radius + 40
          const cy = radius + 40
          const nx = cx + Math.cos((node.angle * Math.PI) / 180) * radius
          const ny = cy + Math.sin((node.angle * Math.PI) / 180) * radius
          return (
            <motion.div
              key={i}
              className={`absolute w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex flex-col items-center justify-center border text-center transition-colors duration-300 ${
                phase === 'crashed'
                  ? 'bg-slate-900/80 border-red-500/20'
                  : 'bg-slate-800/50 border-slate-600/30'
              }`}
              style={{ left: nx, top: ny, transform: 'translate(-50%, -50%)' }}
              animate={phase === 'crashed' ? { opacity: [1, 0.2] } : {}}
              transition={{ delay: 0.3 + i * 0.15, duration: 0.4 }}
            >
              <span className="text-xs sm:text-sm">{phase === 'crashed' ? '⬛' : '🟢'}</span>
              <span className="text-[7px] sm:text-[8px] font-mono text-slate-500 leading-tight">{node.label}</span>
            </motion.div>
          )
        })}
      </div>

      {phase === 'crashed' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="mt-4 sm:mt-6 text-center py-3 sm:py-4 px-4 rounded-xl bg-red-500/10 border border-red-500/20"
        >
          <p className="text-xs sm:text-sm text-red-300 font-medium">
            One server down → Entire fleet dark. Single point of failure.
          </p>
        </motion.div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   CONVERGENCE — "What if one framework solved all of this?"
   ═══════════════════════════════════════════════════════ */
function Convergence() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, amount: 0.5 })

  const problems = [
    'Theory without code',
    'Blind hardware actuation',
    'ML overhead on edge',
    'Cloud dependency',
    'Centralized bottleneck',
  ]

  return (
    <section
      ref={ref}
      className="relative min-h-[70vh] sm:min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-16 sm:py-20 overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 30% 40%, #0f0c28 0%, #06080f 70%)',
      }}
    >
      {/* Fade-in from previous section at top */}
      <div className="absolute top-0 left-0 right-0 h-40 sm:h-56 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, #06080f, transparent)' }}
      />
      {/* Radial accent glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.08)_0%,_transparent_70%)]" />

      <AnimatePresence>
        {isInView && (
          <motion.div className="relative z-10 text-center max-w-3xl"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            {/* Problems collapsing */}
            <div className="space-y-2 sm:space-y-3 mb-8 sm:mb-12">
              {problems.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -60 : 60, y: 20 }}
                  animate={{ opacity: [0, 1, 1, 0.3], x: 0, y: [20, 0, 0, 0], scale: [1, 1, 1, 0.85] }}
                  transition={{ delay: i * 0.25, duration: 2, times: [0, 0.2, 0.6, 1] }}
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-red-500/10 border border-red-500/20 text-xs sm:text-sm text-red-300 font-mono"
                >
                  <span className="text-red-400">✗</span> {p}
                </motion.div>
              ))}
            </div>

            {/* The question */}
            <motion.h2
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 2, duration: 0.8, ease: 'easeOut' }}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black leading-tight"
            >
              <span className="bg-gradient-to-r from-slate-200 via-white to-slate-300 bg-clip-text text-transparent">
                What if one framework
              </span>
              <br />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.8, duration: 0.6 }}
                className="bg-gradient-to-r from-krill-indigo via-krill-violet to-krill-cyan bg-clip-text text-transparent"
              >
                solved all of this?
              </motion.span>
            </motion.h2>

            {/* Arrow down */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, y: [0, 10, 0] }}
              transition={{ delay: 3.5, duration: 1.5, repeat: Infinity }}
              className="mt-8 sm:mt-12 text-2xl sm:text-3xl text-krill-indigo"
            >
              ↓
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════ */
export default function ResearchGaps() {
  return (
    <div className="relative bg-krill-bg">
      {/* Front Page */}
      <FrontPage />

      {/* Vertical progress line */}
      <div className="absolute left-4 sm:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-red-500/20 to-transparent hidden lg:block" />

      <GapSection
        index={1}
        id="gap-theory"
        title="Theory Without Deployment"
        subtitle="Fault-tolerant DAG scheduling exists in papers with 47 pages of proofs — but zero deployable binaries. Mathematical theorems can't be executed on real hardware."
        paper={{
          ref: '1',
          authors: 'M. A. Khan, S. Ahmad, and R. Buyya',
          title: 'Fault-Tolerant Cost-Efficient Scheduling for IoT Workflows Using Directed Acyclic Graphs',
          journal: 'IEEE Internet of Things Journal',
          volume: 'vol. 12, no. 3',
          pages: '2145\u20132158',
          year: '2025'
        }}
      >
        <Gap1Animation />
      </GapSection>

      <GapSection
        index={2}
        id="gap-blind"
        title="Blind Actuation"
        subtitle="When software crashes, physical actuators continue operating in undefined states. No existing tool intercepts and halts dependents when upstream nodes fail."
        paper={{
          ref: '2',
          authors: 'F. Becker, H. Giese, and S. Dziwok',
          title: 'Time- and Behaviour-Preserving Execution in Cyber-Physical Systems Under Software Faults',
          journal: 'ACM Transactions on Cyber-Physical Systems',
          volume: 'vol. 10, no. 1',
          pages: '1\u201328',
          year: '2026'
        }}
      >
        <Gap2Animation />
      </GapSection>

      <GapSection
        index={3}
        id="gap-overhead"
        title="AI Overhead on Edge"
        subtitle="Graph neural network schedulers use computationally expensive ML models unsuitable for edge devices with limited compute budgets."
        paper={{
          ref: '3',
          authors: 'L. Chen, Y. Wang, and X. Liu',
          title: 'GART: Graph Neural Network-Based Task Scheduler for DAG Workloads',
          journal: 'IEEE Transactions on Parallel and Distributed Systems',
          volume: 'vol. 36, no. 5',
          pages: '1123\u20131136',
          year: '2025'
        }}
      >
        <Gap3Animation />
      </GapSection>

      <GapSection
        index={4}
        id="gap-cloud"
        title="Cloud Dependency"
        subtitle="Robust fault management requires continuous cloud connectivity — fundamentally incompatible with air-gapped robotic deployments."
        paper={{
          ref: '4',
          authors: 'A. Sampaio, J. Barbosa, and F. Brasileiro',
          title: 'Fault Tolerance in Real-Time Cloud Computing Using DAG-Based Task Topologies',
          journal: 'Proc. IEEE International Symposium on Real-Time Computing (ISORC)',
          pages: '45\u201354',
          year: '2023'
        }}
      >
        <Gap4Animation />
      </GapSection>

      <GapSection
        index={5}
        id="gap-centralized"
        title="Centralized Single Point of Failure"
        subtitle="Industrial IoT coordination relies on centralized fog servers. When the center goes down, every connected device follows."
        paper={{
          ref: '5',
          authors: 'T. Pflanzner, A. Kertesz, and B. Spinnewyn',
          title: 'Cloud-Fog Automation for Deterministic Machine-to-Machine Communication in Industrial IoT',
          journal: 'IEEE Access',
          volume: 'vol. 13',
          pages: '34521\u201334535',
          year: '2025'
        }}
      >
        <Gap5Animation />
      </GapSection>

      <Convergence />
    </div>
  )
}
