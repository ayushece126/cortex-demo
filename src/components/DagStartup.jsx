import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import './DagStartup.css'

const layers = [
  [{ id: 'lidar', icon: '📡', name: 'LIDAR Sensor', type: 'Hardware Driver' },
   { id: 'camera', icon: '📷', name: 'Camera', type: 'Hardware Driver' },
   { id: 'imu', icon: '🧭', name: 'IMU Sensor', type: 'Hardware Driver' }],
  [{ id: 'perception', icon: '🧠', name: 'Perception AI', type: 'Neural Network' },
   { id: 'localization', icon: '📍', name: 'Localization', type: 'Algorithm' }],
  [{ id: 'navigation', icon: '🗺️', name: 'Navigation', type: 'Path Planner' }],
  [{ id: 'motor', icon: '⚙️', name: 'Motor Control', type: 'Actuator' }],
]
const edges = [
  ['lidar','perception'],['camera','perception'],['imu','localization'],['lidar','localization'],
  ['perception','navigation'],['localization','navigation'],['navigation','motor']
]
const narrations = [
  '🔍 Cortex scans the config file and builds a dependency graph — mapping who needs whom.',
  '⚡ Layer 1: Starting hardware drivers (LIDAR, Camera, IMU). These have NO dependencies — they go first.',
  '🧠 Layer 2: Perception needs LIDAR + Camera. Localization needs IMU + LIDAR. Cortex waited until Layer 1 was healthy.',
  '🗺️ Layer 3: Navigation needs BOTH perception and localization. Cortex verified both are healthy before starting.',
  '⚙️ Layer 4: Motor Control — the final piece. Now the robot can move safely.',
  '🎉 All 7 services started in the mathematically correct order — in just seconds!'
]

export default function DagStartup() {
  const [nodeStates, setNodeStates] = useState({})
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [narration, setNarration] = useState('Press ▶ to watch Cortex calculate the startup order.')
  const pauseRef = useRef(false)
  const abortRef = useRef(false)
  const stageRef = useRef(null)
  const nodeRefs = useRef({})
  const [edgeLines, setEdgeLines] = useState([])
  const [svgSize, setSvgSize] = useState({ w: 800, h: 450 })

  // Compute edge positions from actual DOM positions
  const computeEdges = useCallback(() => {
    if (!stageRef.current) return
    const stageRect = stageRef.current.getBoundingClientRect()
    setSvgSize({ w: stageRect.width || 800, h: stageRect.height || 450 })

    const lines = []
    for (const [fromId, toId] of edges) {
      const fromEl = nodeRefs.current[fromId]
      const toEl = nodeRefs.current[toId]
      if (!fromEl || !toEl) continue
      const fromRect = fromEl.getBoundingClientRect()
      const toRect = toEl.getBoundingClientRect()
      lines.push({
        x1: fromRect.left + fromRect.width / 2 - stageRect.left,
        y1: fromRect.top + fromRect.height - stageRect.top,
        x2: toRect.left + toRect.width / 2 - stageRect.left,
        y2: toRect.top - stageRect.top,
        from: fromId,
        to: toId,
      })
    }
    setEdgeLines(lines)
  }, [])

  // Recompute edges on mount and window resize
  useEffect(() => {
    computeEdges()
    window.addEventListener('resize', computeEdges)
    
    // Setup ResizeObserver to watch for any layout shifts within the container
    let ro = null;
    if ("ResizeObserver" in window && stageRef.current) {
      ro = new ResizeObserver(() => computeEdges());
      ro.observe(stageRef.current);
    }
    
    // also recompute after a short delay for layout settle
    const timer = setTimeout(computeEdges, 300)
    return () => {
      window.removeEventListener('resize', computeEdges)
      clearTimeout(timer)
      if (ro) ro.disconnect();
    }
  }, [computeEdges])

  const wait = useCallback((ms) => {
    return new Promise(resolve => {
      let e = 0; const s = 50;
      const t = () => { if (abortRef.current) return resolve(); if (!pauseRef.current) e += s; if (e >= ms) return resolve(); setTimeout(t, s) }; t()
    })
  }, [])

  const run = useCallback(async () => {
    abortRef.current = false; setRunning(true); setPaused(false)
    setNodeStates({}); setNarration(narrations[0]); await wait(2200)

    for (let li = 0; li < layers.length; li++) {
      if (abortRef.current) break
      setNarration(narrations[li + 1])
      layers[li].forEach(n => setNodeStates(p => ({ ...p, [n.id]: 'starting' })))
      await wait(1400)
      if (abortRef.current) break
      layers[li].forEach(n => setNodeStates(p => ({ ...p, [n.id]: 'running' })))
      await wait(800)
      if (abortRef.current) break
      layers[li].forEach(n => setNodeStates(p => ({ ...p, [n.id]: 'healthy' })))
      await wait(800)
    }
    if (!abortRef.current) setNarration(narrations[5])
    setRunning(false)
  }, [wait])

  const togglePause = () => { pauseRef.current = !pauseRef.current; setPaused(p => !p) }
  const reset = () => { abortRef.current = true; setRunning(false); setPaused(false); pauseRef.current = false; setNodeStates({}); setNarration('Press ▶ to watch Cortex calculate the startup order.') }

  const statusLabel = (s) => !s ? 'PENDING' : s === 'starting' ? 'STARTING...' : s === 'running' ? 'RUNNING' : 'HEALTHY ✓'
  const statusColor = (s) => !s ? '#4b5563' : s === 'starting' ? '#60a5fa' : s === 'running' ? '#fbbf24' : '#4ade80'

  return (
    <section className="section dag-section" id="dag">
      <div className="section-badge">02 — DEPENDENCY GRAPH</div>
      <h2>Smart Startup Order</h2>
      <p className="section-sub">Cortex uses a mathematical graph to figure out the perfect startup sequence. No guessing — it's computed.</p>

      <div className="stage glass dag-stage" ref={stageRef}>
        <svg className="dag-svg" viewBox={`0 0 ${svgSize.w} ${svgSize.h}`}>
          {edgeLines.map((line, i) => {
            const active = nodeStates[line.from] === 'healthy'
            return <line key={i} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
              stroke={active ? '#6366f1' : '#2a2650'} strokeWidth={active ? 2.5 : 1.5}
              strokeDasharray={active ? 'none' : '6 4'} style={{ transition: 'all 0.6s' }} />
          })}
        </svg>
        <div className="dag-layers">
          {layers.map((layer, li) => (
            <div className="dag-layer" key={li}>
              <div className="dag-layer-label">Layer {li + 1}</div>
              <div className="dag-layer-nodes">
                {layer.map(n => {
                  const st = nodeStates[n.id]
                  return (
                    <motion.div key={n.id} className={`dag-node ${st || ''}`}
                      ref={el => { nodeRefs.current[n.id] = el }}
                      animate={st === 'starting' ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 0.6, repeat: st === 'starting' ? Infinity : 0 }}>
                      <span className="dnode-icon">{n.icon}</span>
                      <span className="dnode-name">{n.name}</span>
                      <span className="dnode-type">{n.type}</span>
                      <span className="dnode-status" style={{ color: statusColor(st), borderColor: statusColor(st) + '44' }}>
                        {statusLabel(st)}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="controls">
        <button className="btn btn-primary" onClick={run} disabled={running}>▶ Start Robot</button>
        <button className="btn btn-warning" onClick={togglePause} disabled={!running}>{paused ? '▶ Resume' : '⏸ Pause'}</button>
        <button className="btn btn-ghost" onClick={reset}>↺ Reset</button>
        <div className="narration">{narration}</div>
      </div>
    </section>
  )
}
