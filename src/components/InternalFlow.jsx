import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './InternalFlow.css'

const steps = [
  { id: 'cmd', title: 'User Types Command', desc: 'You type "cortex up robot.yaml" in your terminal. This is how everything begins.', actor: 'user', highlight: ['terminal'] },
  { id: 'cli', title: 'CLI Reads the Config', desc: 'The CLI program reads robot.yaml — your recipe of services, dependencies, and rules.', actor: 'cli', highlight: ['terminal','cli'] },
  { id: 'pipe', title: 'CLI Creates a Communication Pipe', desc: 'Before launching the daemon, the CLI creates a secret "pipe" — like a walkie-talkie — so the daemon can report back if startup succeeded.', actor: 'cli', highlight: ['cli','pipe'] },
  { id: 'spawn', title: 'CLI Spawns the Daemon', desc: 'The CLI launches a background process called "the Daemon" — this is the actual brain. It runs silently, independent of your terminal.', actor: 'cli', highlight: ['cli','pipe','daemon'] },
  { id: 'config', title: 'Daemon Loads & Validates Config', desc: 'The daemon reads the YAML file, checks for errors (typos, missing deps, unsafe commands), and builds the dependency graph.', actor: 'daemon', highlight: ['daemon','graph'] },
  { id: 'socket', title: 'Daemon Opens a Communication Socket', desc: 'The daemon creates a "socket" — like a phone line. Anyone (TUI, SDKs) can call this number to talk to the daemon.', actor: 'daemon', highlight: ['daemon','socket'] },
  { id: 'report', title: 'Daemon Reports Success via Pipe', desc: 'The daemon sends "I\'m ready!" back through the pipe. The CLI receives this and knows it\'s safe to proceed.', actor: 'daemon', highlight: ['daemon','pipe','cli'] },
  { id: 'tui', title: 'CLI Launches the Dashboard (TUI)', desc: 'The CLI starts a beautiful terminal dashboard that connects to the daemon through the socket. You can see everything in real-time!', actor: 'cli', highlight: ['cli','socket','tui'] },
  { id: 'start', title: 'Daemon Starts Services in Order', desc: 'Using the dependency graph, the daemon starts services layer by layer — hardware first, then AI, then navigation, then motors.', actor: 'daemon', highlight: ['daemon','services'] },
  { id: 'channels', title: 'Internal Channels Keep Everyone in Sync', desc: 'Inside the daemon, 5 internal channels pass messages: events, logs, commands, heartbeats, and status snapshots. Like a busy mail room!', actor: 'daemon', highlight: ['daemon','channels'] },
  { id: 'monitor', title: 'Health Monitoring Begins', desc: 'Every service sends heartbeats through the socket. The daemon watches them — if a heartbeat stops, it triggers a restart or cascade failure.', actor: 'daemon', highlight: ['daemon','socket','services'] },
]

const actorColors = { user: '#f59e0b', cli: '#60a5fa', daemon: '#a78bfa', tui: '#4ade80' }

export default function InternalFlow() {
  const [currentStep, setCurrentStep] = useState(-1)
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const pauseRef = useRef(false)
  const abortRef = useRef(false)

  const wait = useCallback((ms) => {
    return new Promise(resolve => {
      let e = 0; const s = 50
      const t = () => { if (abortRef.current) return resolve(); if (!pauseRef.current) e += s; if (e >= ms) return resolve(); setTimeout(t, s) }; t()
    })
  }, [])

  const run = useCallback(async () => {
    abortRef.current = false; setRunning(true); setPaused(false); setCurrentStep(-1)
    await wait(800)
    for (let i = 0; i < steps.length; i++) {
      if (abortRef.current) break
      setCurrentStep(i); await wait(4000)
    }
    setRunning(false)
  }, [wait])

  const togglePause = () => { pauseRef.current = !pauseRef.current; setPaused(p => !p) }
  const reset = () => { abortRef.current = true; setRunning(false); setPaused(false); pauseRef.current = false; setCurrentStep(-1) }
  const goTo = (i) => { if (!running) setCurrentStep(i) }

  const step = currentStep >= 0 ? steps[currentStep] : null
  const hl = step ? step.highlight : []

  return (
    <section className="section flow-section" id="flow">
      <div className="section-badge">03 — UNDER THE HOOD</div>
      <h2>How Cortex Actually Works</h2>
      <p className="section-sub">Step-by-step: from typing a command to a fully running robot. This is the complete internal data flow.</p>

      <div className="flow-container">
        {/* Architecture diagram */}
        <div className="flow-diagram glass">
          {/* User Terminal */}
          <motion.div className={`flow-box flow-terminal ${hl.includes('terminal') ? 'glow' : ''}`}
            animate={hl.includes('terminal') ? { scale: [1, 1.03, 1] } : { scale: 1 }}
            transition={{ duration: 1.2, repeat: hl.includes('terminal') ? Infinity : 0 }}>
            <div className="fbox-icon">💻</div>
            <div className="fbox-label">Your Terminal</div>
            <div className="fbox-sub">Where you type commands</div>
          </motion.div>

          {/* Arrow: Terminal → CLI */}
          <div className={`flow-arrow ${hl.includes('cli') ? 'arrow-active' : ''}`}>
            <div className="arrow-label">cortex up</div>
            <svg width="40" height="60"><path d="M20 0 L20 45 L12 37 M20 45 L28 37" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
          </div>

          {/* CLI */}
          <motion.div className={`flow-box flow-cli ${hl.includes('cli') ? 'glow' : ''}`}
            animate={hl.includes('cli') ? { scale: [1, 1.03, 1] } : { scale: 1 }}
            transition={{ duration: 1.2, repeat: hl.includes('cli') ? Infinity : 0 }}>
            <div className="fbox-icon">📋</div>
            <div className="fbox-label">CLI Program</div>
            <div className="fbox-sub">Reads config, manages lifecycle</div>
          </motion.div>

          {/* Pipe between CLI and Daemon */}
          <div className="flow-middle">
            <div className={`flow-arrow-h ${hl.includes('pipe') ? 'arrow-active' : ''}`}>
              <div className="arrow-label-h">Pipe (walkie-talkie)</div>
              <svg width="120" height="24"><path d="M0 12 L105 12 L97 4 M105 12 L97 20" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
            </div>
          </div>

          {/* Daemon */}
          <motion.div className={`flow-box flow-daemon ${hl.includes('daemon') ? 'glow' : ''}`}
            animate={hl.includes('daemon') ? { scale: [1, 1.03, 1] } : { scale: 1 }}
            transition={{ duration: 1.2, repeat: hl.includes('daemon') ? Infinity : 0 }}>
            <div className="fbox-icon">🧠</div>
            <div className="fbox-label">Daemon (Brain)</div>
            <div className="fbox-sub">Background orchestrator</div>
            
            {/* Inner channels */}
            <AnimatePresence>
              {hl.includes('channels') && (
                <motion.div className="daemon-channels"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  {['Events', 'Logs', 'Commands', 'Heartbeats', 'Snapshots'].map((ch, i) => (
                    <motion.div key={ch} className="channel-pill"
                      initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.15 }}>
                      📨 {ch}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dependency graph mini */}
            <AnimatePresence>
              {hl.includes('graph') && (
                <motion.div className="daemon-graph"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="mini-graph-label">Dependency Graph</div>
                  <div className="mini-graph">
                    <span>📡→🧠→🗺️→⚙️</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Socket */}
          <div className={`flow-socket-area ${hl.includes('socket') ? 'glow' : ''}`}>
            <div className="socket-icon">🔌</div>
            <div className="socket-label">Unix Socket</div>
            <div className="socket-sub">/tmp/cortex.sock</div>
            {hl.includes('socket') && (
              <motion.div className="socket-pulses"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {[0,1,2].map(i => (
                  <motion.div key={i} className="socket-pulse"
                    animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }} />
                ))}
              </motion.div>
            )}
          </div>

          {/* TUI */}
          <motion.div className={`flow-box flow-tui ${hl.includes('tui') ? 'glow' : ''}`}
            animate={hl.includes('tui') ? { scale: [1, 1.03, 1] } : { scale: 1 }}
            transition={{ duration: 1.2, repeat: hl.includes('tui') ? Infinity : 0 }}>
            <div className="fbox-icon">📊</div>
            <div className="fbox-label">Dashboard (TUI)</div>
            <div className="fbox-sub">Real-time monitoring UI</div>
          </motion.div>

          {/* Services */}
          <AnimatePresence>
            {hl.includes('services') && (
              <motion.div className="flow-services"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                {['📡 LIDAR','📷 Camera','🧭 IMU','🧠 AI','🗺️ Nav','⚙️ Motor'].map((s, i) => (
                  <motion.div key={s} className="flow-svc-pill"
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1, type: 'spring' }}>
                    {s}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Step narration + timeline */}
        <div className="flow-timeline">
          <div className="timeline-steps">
            {steps.map((s, i) => (
              <div key={s.id}
                className={`timeline-step ${i === currentStep ? 'active' : i < currentStep ? 'done' : ''}`}
                onClick={() => goTo(i)}>
                <div className="ts-dot" style={{ borderColor: i <= currentStep ? actorColors[s.actor] : '#2a2650' }}>
                  {i < currentStep ? '✓' : i + 1}
                </div>
                <div className="ts-content">
                  <div className="ts-title">{s.title}</div>
                  <AnimatePresence>
                    {i === currentStep && (
                      <motion.div className="ts-desc"
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}>
                        {s.desc}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="controls" style={{ maxWidth: 960 }}>
        <button className="btn btn-primary" onClick={run} disabled={running}>▶ Play Flow</button>
        <button className="btn btn-warning" onClick={togglePause} disabled={!running}>{paused ? '▶ Resume' : '⏸ Pause'}</button>
        <button className="btn btn-ghost" onClick={reset}>↺ Reset</button>
      </div>
    </section>
  )
}
