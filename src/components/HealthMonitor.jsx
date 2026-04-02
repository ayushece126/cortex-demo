import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import './HealthMonitor.css'

const services = [
  { id: 'lidar', icon: '📡', name: 'LIDAR' },
  { id: 'camera', icon: '📷', name: 'Camera' },
  { id: 'nav', icon: '🗺️', name: 'Navigation' },
  { id: 'motor', icon: '⚙️', name: 'Motor' },
]

function HeartbeatCanvas({ status, id }) {
  const canvasRef = useRef(null)
  const pointsRef = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    let raf
    const draw = () => {
      const ctx = canvas.getContext('2d')
      const w = canvas.width = canvas.parentElement.clientWidth
      const h = canvas.height = canvas.parentElement.clientHeight
      const pts = pointsRef.current
      // gen point
      if (status === 'healthy') {
        const t = Date.now() / 300; const beat = Math.sin(t) > 0.6 ? 1 : Math.sin(t) > 0 ? 0.3 : 0.05
        pts.push(beat)
      } else if (status === 'degraded') {
        pts.push(Math.random() > 0.4 ? 0.5 : 0.1)
      } else if (status === 'failed') {
        pts.push(0.02)
      } else { pts.push(0) }
      if (pts.length > 80) pts.shift()

      ctx.clearRect(0, 0, w, h)
      const color = status === 'healthy' ? '#4ade80' : status === 'degraded' ? '#fbbf24' : status === 'failed' ? '#f87171' : '#3b3760'
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.shadowColor = color; ctx.shadowBlur = 6
      ctx.beginPath()
      pts.forEach((p, i) => { const x = (i / 80) * w; const y = h - p * h * 0.8 - h * 0.1; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y) })
      ctx.stroke()
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [status])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
}

export default function HealthMonitor() {
  const [states, setStates] = useState(services.reduce((a, s) => ({ ...a, [s.id]: 'idle' }), {}))
  const [monitoring, setMonitoring] = useState(false)
  const [narration, setNarration] = useState('Press ▶ to start monitoring. Each card shows a live heartbeat waveform — like a hospital monitor for your robot.')

  const start = () => {
    setMonitoring(true)
    setStates(services.reduce((a, s) => ({ ...a, [s.id]: 'healthy' }), {}))
    setNarration('💚 All services sending heartbeats. Each green pulse = "I\'m alive and well."')
  }

  const degrade = () => {
    setStates(p => ({ ...p, camera: 'degraded' }))
    setNarration('⚠️ Camera heartbeat is irregular! Cortex marks it DEGRADED and alerts the operator.')
  }

  const fail = () => {
    setStates(p => ({ ...p, lidar: 'failed' }))
    setNarration('🚨 LIDAR stopped sending heartbeats! Cortex triggers auto-restart...')
    setTimeout(() => {
      setStates(p => ({ ...p, lidar: 'healthy' }))
      setNarration('✅ Cortex restarted LIDAR automatically. Heartbeat restored — self-healing!')
    }, 3500)
  }

  const reset = () => {
    setMonitoring(false)
    setStates(services.reduce((a, s) => ({ ...a, [s.id]: 'idle' }), {}))
    setNarration('Press ▶ to start monitoring.')
  }

  return (
    <section className="section health-section" id="health">
      <div className="section-badge">05 — HEALTH MONITORING</div>
      <h2>Real-Time Health Monitoring</h2>
      <p className="section-sub">Like a hospital monitor for every part of the robot — Cortex watches heartbeats and reacts instantly.</p>

      <div className="health-grid">
        {services.map(s => (
          <motion.div key={s.id} className={`health-card glass ${states[s.id]}`}
            animate={states[s.id] === 'failed' ? { x: [0, -3, 3, 0] } : {}}
            transition={{ duration: 0.3, repeat: states[s.id] === 'failed' ? 3 : 0 }}>
            <div className="hc-header">
              <span className="hc-icon">{s.icon}</span>
              <span className="hc-name">{s.name}</span>
            </div>
            <div className="hc-wave"><HeartbeatCanvas status={states[s.id]} id={s.id} /></div>
            <div className="hc-footer">
              <span className={`hc-status-badge ${states[s.id]}`}>
                {states[s.id] === 'idle' ? 'OFFLINE' : states[s.id] === 'healthy' ? '● HEALTHY' : states[s.id] === 'degraded' ? '◐ DEGRADED' : '✕ NO HEARTBEAT'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="controls">
        <button className="btn btn-primary" onClick={start} disabled={monitoring}>▶ Start Monitoring</button>
        <button className="btn btn-warning" onClick={degrade} disabled={!monitoring || states.camera !== 'healthy'}>⚠ Degrade Camera</button>
        <button className="btn btn-danger" onClick={fail} disabled={!monitoring || states.lidar !== 'healthy'}>💥 Fail LIDAR</button>
        <button className="btn btn-ghost" onClick={reset}>↺ Reset</button>
      </div>
      <div className="narration" style={{ maxWidth: 960, marginTop: 16 }}>{narration}</div>
    </section>
  )
}
