import ResearchGaps from './components/ResearchGaps'
import Hero from './components/Hero'
import SelfHealingTree from './components/SelfHealingTree'
import RobotVisualizer from './components/RobotVisualizer'
import YamlDagKahn from './components/YamlDagKahn'
import IpcFlow from './components/IpcFlow'
import ChaosMonkey from './components/ChaosMonkey'
import SdkHealthMonitor from './components/SdkHealthMonitor'
import EmergencyStop from './components/EmergencyStop'
import ComparisonTable from './components/ComparisonTable'

export default function App() {
  return (
    <div className="app">
      {/* ACT 0: The Problem — Why Krill Exists */}
      <ResearchGaps />

      {/* ACT 1: Hook — What is Krill and why does it matter? */}
      <Hero />
      <SelfHealingTree />
      {/* <RobotVisualizer /> */}

      {/* ACT 2: How — Technical Deep Dive */}
      <YamlDagKahn />
      <IpcFlow />

      {/* ACT 3: Proof — Stress Testing & Resilience */}
      <ChaosMonkey />
      {/* <SdkHealthMonitor /> */}
      <EmergencyStop />

      {/* ACT 4: Compare */}
      <ComparisonTable />

      <footer className="footer">
        <div className="footer-brand">🧠 Cortex</div>
        <p>Professional-grade process orchestrator for robotics systems. Built in Rust.</p>
      </footer>
    </div>
  )
}
