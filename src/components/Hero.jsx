import { motion } from 'framer-motion'
import './Hero.css'

const services = [
  { label: 'LIDAR', icon: '📡' }, { label: 'Camera', icon: '📷' },
  { label: 'IMU', icon: '🧭' }, { label: 'Navigation', icon: '🗺️' },
  { label: 'Motor', icon: '⚙️' }, { label: 'AI', icon: '🧠' },
]

export default function Hero() {
  return (
    <section className="section hero-section" id="hero">
      <div className="hero-grid" />
      <motion.div className="hero-left"
        initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9 }}>
        <div className="section-badge">PROCESS ORCHESTRATOR FOR ROBOTICS</div>
        <h1 className="hero-title">
          <span className="hero-brand">Cortex</span>
          <span className="hero-tagline">The brain that keeps your robot alive.</span>
        </h1>
        <p className="hero-desc">
          Imagine a robot with dozens of software programs running simultaneously — cameras, sensors, navigation, AI.
          <strong> Cortex</strong> is the intelligent conductor that starts them in the right order, watches over them,
          and reacts instantly when something goes wrong.
        </p>
        <motion.button className="btn btn-primary hero-cta"
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
          onClick={() => document.getElementById('kitchen').scrollIntoView({ behavior: 'smooth' })}>
          See How It Works ↓
        </motion.button>
      </motion.div>

      <motion.div className="hero-right"
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.3 }}>
        <div className="hero-orb">
          <motion.div className="orb-core"
            animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
            <span className="orb-label">Cortex</span>
            <span className="orb-sub">Engine</span>
          </motion.div>
          <div className="orb-ring" />
          <div className="orb-ring ring2" />
          {services.map((s, i) => {
            const angle = (i / services.length) * Math.PI * 2 - Math.PI / 2
            const r = 140
            return (
              <motion.div key={s.label} className="orb-service"
                style={{ left: `calc(50% + ${Math.cos(angle) * r}px)`, top: `calc(50% + ${Math.sin(angle) * r}px)` }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + i * 0.15 }}>
                <motion.div className="orb-svc-inner"
                  animate={{ boxShadow: ['0 0 0px #4ade80', '0 0 18px #4ade8055', '0 0 0px #4ade80'] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}>
                  <span>{s.icon}</span>
                  <span className="orb-svc-label">{s.label}</span>
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </section>
  )
}
