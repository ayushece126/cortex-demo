import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import './FailureComparison.css'

const svcs = [
  { icon: '📡', name: 'LIDAR' }, { icon: '📷', name: 'Camera' },
  { icon: '🧠', name: 'Perception' }, { icon: '🗺️', name: 'Navigation' }, { icon: '⚙️', name: 'Motor' },
]

export default function FailureComparison() {
  const [withoutStates, setWithoutStates] = useState(svcs.map(() => 'running'))
  const [withStates, setWithStates] = useState(svcs.map(() => 'running'))
  const [withoutMsg, setWithoutMsg] = useState('Programs running independently — no awareness of each other')
  const [withMsg, setWithMsg] = useState('Services monitored by Cortex — dependencies tracked')
  const [withoutDone, setWithoutDone] = useState(false)
  const [withDone, setWithDone] = useState(false)

  const st = (arr, i, v) => arr.map((s, j) => j === i ? v : s)

  const triggerWithout = useCallback(async () => {
    setWithoutDone(true)
    setWithoutStates(p => st(p, 0, 'failed')); setWithoutMsg('💥 LIDAR crashed! But nobody knows...')
    await new Promise(r => setTimeout(r, 1500))
    setWithoutStates(p => st(p, 2, 'corrupted')); setWithoutMsg('⚠️ Perception using STALE data — making wrong decisions!')
    await new Promise(r => setTimeout(r, 1500))
    setWithoutStates(p => st(p, 3, 'corrupted')); setWithoutMsg('🚨 Navigation following a wrong path — DANGER!')
    await new Promise(r => setTimeout(r, 1500))
    setWithoutStates(p => st(p, 4, 'failed')); setWithoutMsg('💀 Robot COLLIDED — $50,000 in damage. Nobody stopped it.')
  }, [])

  const triggerWith = useCallback(async () => {
    setWithDone(true)
    setWithStates(p => st(p, 0, 'failed')); setWithMsg('💥 LIDAR crashed! Cortex detected it in < 1 second.')
    await new Promise(r => setTimeout(r, 1200))
    setWithMsg('🛡️ Cortex stopping dependent services safely...')
    for (const i of [2, 3, 4]) { await new Promise(r => setTimeout(r, 400)); setWithStates(p => st(p, i, 'stopped')) }
    await new Promise(r => setTimeout(r, 800))
    setWithMsg('🔄 Cortex restarting LIDAR...'); setWithStates(p => st(p, 0, 'restarting'))
    await new Promise(r => setTimeout(r, 2000))
    setWithStates(p => st(p, 0, 'running')); setWithMsg('⚡ LIDAR recovered! Restarting dependents in order...')
    for (const i of [2, 3, 4]) { await new Promise(r => setTimeout(r, 600)); setWithStates(p => st(p, i, 'running')) }
    await new Promise(r => setTimeout(r, 400))
    setWithMsg('✅ Full recovery in 6 seconds. Zero damage. Robot is safe.')
  }, [])

  const statusLabel = s => ({ running: 'RUNNING', failed: 'CRASHED', corrupted: 'BAD DATA', stopped: 'STOPPED', restarting: 'RESTARTING' }[s])
  const statusClass = s => ({ running: 'svc-running', failed: 'svc-failed', corrupted: 'svc-corrupted', stopped: 'svc-stopped', restarting: 'svc-restarting' }[s])

  const renderPanel = (title, titleCls, states, msg, btnLabel, btnCls, onClick, done) => (
    <div className="comp-panel glass">
      <h3 className={`panel-title ${titleCls}`}>{title}</h3>
      <div className="panel-services">
        {svcs.map((s, i) => (
          <motion.div key={s.name} className={`panel-svc ${statusClass(states[i])}`}
            animate={states[i] === 'failed' ? { x: [0,-4,4,-4,0] } : states[i] === 'restarting' ? { opacity: [1,0.5,1] } : {}}
            transition={{ duration: 0.4, repeat: states[i] === 'restarting' ? Infinity : 0 }}>
            <span className="psvc-icon">{s.icon}</span>
            <span className="psvc-name">{s.name}</span>
            <span className={`psvc-status ${statusClass(states[i])}`}>{statusLabel(states[i])}</span>
          </motion.div>
        ))}
      </div>
      <p className="panel-msg">{msg}</p>
      <button className={`btn ${btnCls}`} onClick={onClick} disabled={done}>{btnLabel}</button>
    </div>
  )

  return (
    <section className="section failure-section" id="failure">
      <div className="section-badge">04 — FAILURE HANDLING</div>
      <h2>When Things Go Wrong</h2>
      <p className="section-sub">In robotics, crashes happen. The question is: does your robot drive into a wall, or heal itself?</p>
      <div className="comp-row">
        {renderPanel('❌ Without Cortex', 'title-danger', withoutStates, withoutMsg, '💥 Simulate Crash', 'btn-danger', triggerWithout, withoutDone)}
        {renderPanel('✅ With Cortex', 'title-success', withStates, withMsg, '💥 Simulate Crash', 'btn-success', triggerWith, withDone)}
      </div>
    </section>
  )
}
