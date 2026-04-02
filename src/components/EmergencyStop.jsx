import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './EmergencyStop.css'

const svcs = [
  { icon: '📡', name: 'LIDAR', critical: false },
  { icon: '📷', name: 'Camera', critical: false },
  { icon: '🧠', name: 'Perception', critical: false },
  { icon: '🗺️', name: 'Navigation', critical: true },
  { icon: '⚙️', name: 'Motor', critical: false },
]

export default function EmergencyStop() {
  const [states, setStates] = useState(svcs.map(() => 'pending'))
  const [overlay, setOverlay] = useState(false)
  const [started, setStarted] = useState(false)

  const start = useCallback(async () => {
    setOverlay(false); setStarted(true)
    for (let i = 0; i < svcs.length; i++) {
      await new Promise(r => setTimeout(r, 400))
      setStates(p => p.map((s, j) => j === i ? 'running' : s))
    }
  }, [])

  const trigger = useCallback(async () => {
    // Crash navigation (critical)
    setStates(p => p.map((s, j) => j === 3 ? 'failed' : s))
    await new Promise(r => setTimeout(r, 700))
    setOverlay(true)
    await new Promise(r => setTimeout(r, 1200))
    // Stop all
    for (let i = 0; i < svcs.length; i++) {
      if (i === 3) continue
      await new Promise(r => setTimeout(r, 250))
      setStates(p => p.map((s, j) => j === i ? 'stopped' : s))
    }
  }, [])

  const reset = () => { setStates(svcs.map(() => 'pending')); setOverlay(false); setStarted(false) }

  return (
    <section className="section emg-section" id="emergency">
      <div className="section-badge">06 — SAFETY</div>
      <h2>Emergency Stop — The Safety Net</h2>
      <p className="section-sub">When a <strong>critical</strong> system fails, Cortex instantly shuts EVERYTHING down — like pulling the emergency brake on a train.</p>

      <div className="stage glass emg-stage">
        <div className="emg-services">
          {svcs.map((s, i) => (
            <motion.div key={s.name} className={`emg-svc ${states[i]} ${s.critical ? 'critical' : ''}`}
              animate={states[i] === 'failed' ? { rotate: [0, -3, 3, -3, 0] } : {}}
              transition={{ duration: 0.3 }}>
              <span className="emg-icon">{s.icon}</span>
              <span className="emg-name">{s.name}{s.critical ? ' ⚠️' : ''}</span>
              <span className={`emg-status ${states[i]}`}>
                {{ pending: 'PENDING', running: 'RUNNING', failed: 'CRASHED', stopped: 'STOPPED' }[states[i]]}
              </span>
              {s.critical && <span className="emg-badge">CRITICAL</span>}
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {overlay && (
            <motion.div className="emg-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="emg-overlay-icon"
                animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>🛑</motion.div>
              <div className="emg-overlay-title">EMERGENCY STOP</div>
              <div className="emg-overlay-sub">Critical service failed — all systems halted safely</div>
              <div className="emg-overlay-detail">Navigation (marked critical) crashed. Cortex immediately shuts down every service to prevent unsafe robot behavior.</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="controls">
        <button className="btn btn-primary" onClick={start} disabled={started}>▶ Start All Systems</button>
        <button className="btn btn-danger" onClick={trigger} disabled={!started || overlay}>🚨 Crash Navigation (Critical)</button>
        <button className="btn btn-ghost" onClick={reset}>↺ Reset</button>
      </div>
    </section>
  )
}
