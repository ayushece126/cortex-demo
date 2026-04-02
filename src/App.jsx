import Hero from './components/Hero'
import DominoBlastDoor from './components/DominoBlastDoor'
import RobotVisualizer from './components/RobotVisualizer'
import DagStartup from './components/DagStartup'
import InternalFlow from './components/InternalFlow'
import ChaosMonkey from './components/ChaosMonkey'
import CodebaseXray from './components/CodebaseXray'
import InteractiveTUI from './components/InteractiveTUI'
import FailureComparison from './components/FailureComparison'
import HealthMonitor from './components/HealthMonitor'
import EmergencyStop from './components/EmergencyStop'
import ComparisonTable from './components/ComparisonTable'

export default function App() {
  return (
    <div className="app">
      {/* ACT 1: Hook — What is Cortex and why does it matter? */}
      <Hero />
      <DominoBlastDoor />
      <RobotVisualizer />

      {/* ACT 2: How — Technical Deep Dive */}
      <DagStartup />
      <InternalFlow />
      <CodebaseXray />

      {/* ACT 3: Proof — Stress Testing & Resilience */}
      <ChaosMonkey />
      <FailureComparison />
      <HealthMonitor />
      <EmergencyStop />

      {/* ACT 4: Interact & Compare */}
      <InteractiveTUI />
      <ComparisonTable />

      <footer className="footer">
        <div className="footer-brand">🧠 Cortex</div>
        <p>Professional-grade process orchestrator for robotics systems. Built in Rust.</p>
        <p className="footer-copy">Apache-2.0 License · Zero Robotics © 2026</p>
      </footer>
    </div>
  )
}
