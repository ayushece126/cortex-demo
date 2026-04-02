import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './KitchenAnalogy.css'

const stations = [
  { icon: '🥬', name: 'Wash Vegetables', dur: 2000 },
  { icon: '🔪', name: 'Chop Ingredients', dur: 1800 },
  { icon: '🫕', name: 'Boil Water', dur: 2200 },
  { icon: '🍳', name: 'Cook on Stove', dur: 2500 },
  { icon: '🍽️', name: 'Plate & Serve', dur: 1200 },
]
const narrations = [
  'Cortex checks the recipe — "What must happen first?"',
  '🥬 Step 1: Washing vegetables — the foundation. Nothing else can start yet.',
  '🔪 Step 2: Chopping depends on washing. Cortex waited automatically.',
  '🫕 Step 3: Boiling water — but cooking needs this AND chopping done.',
  '🍳 Step 4: Cooking begins. Cortex verified BOTH chopping and boiling are done.',
  '🍽️ Final step: Plating! Only possible after cooking. Dinner is served! 🎉',
]

export default function KitchenAnalogy() {
  const [states, setStates] = useState(stations.map(() => 'idle'))
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [narration, setNarration] = useState('Press ▶ to watch Cortex orchestrate the kitchen — each station starts only when its prerequisite is done.')
  const pauseRef = useRef(false)
  const abortRef = useRef(false)

  const waitWithPause = useCallback((ms) => {
    return new Promise(resolve => {
      let elapsed = 0
      const step = 50
      const tick = () => {
        if (abortRef.current) return resolve()
        if (!pauseRef.current) elapsed += step
        if (elapsed >= ms) return resolve()
        setTimeout(tick, step)
      }
      tick()
    })
  }, [])

  const run = useCallback(async () => {
    abortRef.current = false
    setRunning(true)
    setPaused(false)
    setStates(stations.map(() => 'idle'))

    setNarration(narrations[0])
    await waitWithPause(2000)

    for (let i = 0; i < stations.length; i++) {
      if (abortRef.current) break
      setNarration(narrations[i + 1])
      setStates(prev => prev.map((s, j) => j === i ? 'active' : s))
      await waitWithPause(stations[i].dur)
      if (abortRef.current) break
      setStates(prev => prev.map((s, j) => j === i ? 'done' : s))
      await waitWithPause(500)
    }
    setRunning(false)
  }, [waitWithPause])

  const togglePause = () => { pauseRef.current = !pauseRef.current; setPaused(p => !p) }
  const reset = () => { abortRef.current = true; setRunning(false); setPaused(false); pauseRef.current = false; setStates(stations.map(() => 'idle')); setNarration('Press ▶ to watch Cortex orchestrate the kitchen — each station starts only when its prerequisite is done.') }

  return (
    <section className="section kitchen-section" id="kitchen">
      <div className="section-badge">01 — THE CONCEPT</div>
      <h2>Think of It Like a Kitchen</h2>
      <p className="section-sub">A robot is like a restaurant kitchen. Every dish needs ingredients prepared in the right order. Cortex is the head chef who knows the recipe.</p>

      <div className="stage glass kitchen-stage">
        <div className="kitchen-chef">
          <motion.div className="chef-avatar"
            animate={running && !paused ? { rotate: [0, -5, 5, 0] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}>
            👨‍🍳
          </motion.div>
          <div className="chef-label">Cortex<br/><small>Head Chef</small></div>
        </div>
        <div className="kitchen-line">
          {stations.map((s, i) => (
            <div key={i} className="kitchen-connector">
              {i > 0 && <div className={`conn-line ${states[i] !== 'idle' ? 'conn-active' : ''}`}><div className="conn-arrow">→</div></div>}
              <motion.div className={`kitchen-card ${states[i]}`}
                layout
                animate={states[i] === 'active' ? { scale: [1, 1.04, 1], borderColor: '#a78bfa' } : {}}
                transition={{ duration: 0.8, repeat: states[i] === 'active' ? Infinity : 0 }}>
                <span className="kcard-icon">{s.icon}</span>
                <span className="kcard-name">{s.name}</span>
                <span className={`kcard-status ${states[i]}`}>
                  {states[i] === 'idle' ? 'WAITING' : states[i] === 'active' ? 'WORKING...' : 'DONE ✓'}
                </span>
                {states[i] === 'active' && <motion.div className="kcard-progress"
                  initial={{ width: '0%' }} animate={{ width: '100%' }}
                  transition={{ duration: stations[i].dur / 1000, ease: 'linear' }} />}
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      <div className="controls">
        <button className="btn btn-primary" onClick={run} disabled={running}>▶ Start</button>
        <button className="btn btn-warning" onClick={togglePause} disabled={!running}>
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button className="btn btn-ghost" onClick={reset}>↺ Reset</button>
        <div className="narration">{narration}</div>
      </div>
    </section>
  )
}
