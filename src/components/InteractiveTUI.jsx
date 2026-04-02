import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radar, Camera, Navigation, Cog, Gauge, Brain, Shield, Cpu,
  Terminal as TermIcon
} from 'lucide-react';
import './InteractiveTUI.css';

/* ── Service definitions for the dashboard ── */
const INITIAL_SERVICES = [
  { id: 'lidar',      name: 'LIDAR',      icon: Radar,      status: 'running' },
  { id: 'camera',     name: 'Camera',     icon: Camera,     status: 'running' },
  { id: 'perception', name: 'Perception', icon: Brain,      status: 'running' },
  { id: 'navigation', name: 'Navigation', icon: Navigation, status: 'running' },
  { id: 'motor',      name: 'Motor',      icon: Cog,        status: 'running' },
  { id: 'imu',        name: 'IMU',        icon: Gauge,      status: 'running' },
  { id: 'planner',    name: 'Planner',    icon: Cpu,        status: 'running' },
  { id: 'safety',     name: 'Safety',     icon: Shield,     status: 'running' },
];

/* ── Dependency map for cascade logic ── */
const DEPS = {
  lidar: [],
  camera: [],
  imu: [],
  perception: ['lidar', 'camera'],
  navigation: ['perception', 'imu'],
  planner: ['navigation'],
  motor: ['planner'],
  safety: ['perception', 'navigation'],
};

function getDependents(id) {
  const result = new Set();
  const queue = [id];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const [svc, deps] of Object.entries(DEPS)) {
      if (deps.includes(current) && !result.has(svc)) {
        result.add(svc);
        queue.push(svc);
      }
    }
  }
  return result;
}

/* ── Fake log generators ── */
function fakeLogs(svcName) {
  const lines = [
    `[${svcName}] INFO  Publishing at 30Hz`,
    `[${svcName}] INFO  Heartbeat OK — latency 2.1ms`,
    `[${svcName}] DEBUG Buffer utilization: 34%`,
    `[${svcName}] INFO  Frame #${Math.floor(Math.random() * 10000)} processed`,
  ];
  return lines[Math.floor(Math.random() * lines.length)];
}

/* ── Main Component ── */
export default function InteractiveTUI() {
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [lines, setLines] = useState([
    { type: 'output', text: 'Cortex Interactive Console v1.0.0', cls: 'info' },
    { type: 'output', text: 'Type "help" for available commands. All services are running.', cls: '' },
    { type: 'output', text: '', cls: '' },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef(null);
  const bodyRef = useRef(null);

  // Auto scroll
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [lines]);

  // Focus input
  const focusInput = useCallback(() => inputRef.current?.focus(), []);

  const addOutput = useCallback((text, cls = '') => {
    setLines(prev => [...prev, { type: 'output', text, cls }]);
  }, []);

  const addCmd = useCallback((text) => {
    setLines(prev => [...prev, { type: 'cmd', text }]);
  }, []);

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  const updateService = useCallback((id, status) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  }, []);

  /* ── Command handlers ── */
  const handleCommand = useCallback(async (cmd) => {
    const trimmed = cmd.trim().toLowerCase();
    addCmd(trimmed);
    setIsProcessing(true);

    await wait(150);

    if (trimmed === 'help') {
      addOutput('Available commands:', 'info');
      addOutput('  cortex ps           — Show all service statuses');
      addOutput('  cortex stop <svc>   — Stop a service (cascades to dependents)');
      addOutput('  cortex start <svc>  — Start a stopped service');
      addOutput('  cortex restart <svc>— Restart a service');
      addOutput('  cortex logs <svc>   — View recent logs');
      addOutput('  cortex down         — Graceful shutdown of all services');
      addOutput('  cortex up           — Start all services');
      addOutput('  clear               — Clear terminal');
      addOutput('');
    } else if (trimmed === 'cortex ps' || trimmed === 'ps') {
      addOutput('┌──────────────┬────────────┬────────┐', 'info');
      addOutput('│ SERVICE      │ STATUS     │ PID    │', 'info');
      addOutput('├──────────────┼────────────┼────────┤', 'info');
      for (const svc of services) {
        const statusColor = svc.status === 'running' ? 'success' : svc.status === 'stopped' ? '' : 'error';
        const pid = svc.status === 'running' ? (10000 + Math.floor(Math.random() * 50000)).toString() : '—';
        addOutput(`│ ${svc.name.padEnd(12)} │ ${svc.status.toUpperCase().padEnd(10)} │ ${pid.padEnd(6)} │`, statusColor);
      }
      addOutput('└──────────────┴────────────┴────────┘', 'info');
      addOutput('');
    } else if (trimmed.startsWith('cortex stop ')) {
      const target = trimmed.replace('cortex stop ', '').trim();
      const svc = services.find(s => s.id === target || s.name.toLowerCase() === target);
      if (!svc) {
        addOutput(`Error: unknown service "${target}"`, 'error');
      } else if (svc.status === 'stopped') {
        addOutput(`Service "${svc.name}" is already stopped`, 'warning');
      } else {
        addOutput(`Stopping ${svc.name}...`, 'warning');
        await wait(300);
        updateService(svc.id, 'stopped');
        addOutput(`✓ ${svc.name} stopped (SIGTERM sent, PID reaped)`, 'success');

        // Cascade
        const deps = getDependents(svc.id);
        if (deps.size > 0) {
          await wait(200);
          addOutput(`⚠ Cascading stop to ${deps.size} dependent service(s):`, 'warning');
          for (const depId of deps) {
            const depSvc = services.find(s => s.id === depId);
            if (depSvc && depSvc.status === 'running') {
              updateService(depId, 'stopped');
              addOutput(`  ⏸ ${depSvc.name} stopped (dependency "${svc.name}" unavailable)`, 'warning');
              await wait(200);
            }
          }
        }
      }
      addOutput('');
    } else if (trimmed.startsWith('cortex start ')) {
      const target = trimmed.replace('cortex start ', '').trim();
      const svc = services.find(s => s.id === target || s.name.toLowerCase() === target);
      if (!svc) {
        addOutput(`Error: unknown service "${target}"`, 'error');
      } else if (svc.status === 'running') {
        addOutput(`Service "${svc.name}" is already running`, 'warning');
      } else {
        // Check dependencies
        const deps = DEPS[svc.id] || [];
        const unmetDeps = deps.filter(d => {
          const depSvc = services.find(s => s.id === d);
          return !depSvc || depSvc.status !== 'running';
        });
        if (unmetDeps.length > 0) {
          addOutput(`⚠ Unmet dependencies: ${unmetDeps.join(', ')} — starting them first`, 'warning');
          for (const depId of unmetDeps) {
            await wait(300);
            updateService(depId, 'running');
            const depSvc = services.find(s => s.id === depId);
            addOutput(`  ✓ ${depSvc?.name || depId} started`, 'success');
          }
          await wait(200);
        }
        addOutput(`Starting ${svc.name}...`, 'info');
        updateService(svc.id, 'restarting');
        await wait(600);
        updateService(svc.id, 'running');
        addOutput(`✓ ${svc.name} running (PID ${10000 + Math.floor(Math.random() * 50000)})`, 'success');
      }
      addOutput('');
    } else if (trimmed.startsWith('cortex restart ')) {
      const target = trimmed.replace('cortex restart ', '').trim();
      const svc = services.find(s => s.id === target || s.name.toLowerCase() === target);
      if (!svc) {
        addOutput(`Error: unknown service "${target}"`, 'error');
      } else {
        addOutput(`Restarting ${svc.name}...`, 'info');
        updateService(svc.id, 'restarting');
        await wait(400);
        updateService(svc.id, 'stopped');
        addOutput(`  Stopped ${svc.name}`, 'warning');
        await wait(400);
        updateService(svc.id, 'restarting');
        addOutput(`  Starting ${svc.name}...`, 'info');
        await wait(500);
        updateService(svc.id, 'running');
        addOutput(`✓ ${svc.name} restarted successfully`, 'success');
      }
      addOutput('');
    } else if (trimmed.startsWith('cortex logs ')) {
      const target = trimmed.replace('cortex logs ', '').trim();
      const svc = services.find(s => s.id === target || s.name.toLowerCase() === target);
      if (!svc) {
        addOutput(`Error: unknown service "${target}"`, 'error');
      } else {
        addOutput(`--- Recent logs for ${svc.name} ---`, 'info');
        for (let i = 0; i < 5; i++) {
          addOutput(fakeLogs(svc.name));
          await wait(100);
        }
        addOutput(`--- End of logs ---`, 'info');
      }
      addOutput('');
    } else if (trimmed === 'cortex down') {
      addOutput('Initiating graceful shutdown...', 'warning');
      const shutdownOrder = [...services].reverse();
      for (const svc of shutdownOrder) {
        if (svc.status === 'running') {
          await wait(250);
          updateService(svc.id, 'stopped');
          addOutput(`  ✓ ${svc.name} stopped`, '');
        }
      }
      await wait(300);
      addOutput('All services stopped. Daemon shutting down.', 'success');
      addOutput('');
    } else if (trimmed === 'cortex up') {
      addOutput('Starting all services in DAG order...', 'info');
      const startOrder = ['lidar', 'camera', 'imu', 'perception', 'navigation', 'planner', 'motor', 'safety'];
      for (const id of startOrder) {
        const svc = services.find(s => s.id === id);
        if (svc) {
          updateService(id, 'restarting');
          await wait(200);
          updateService(id, 'running');
          addOutput(`  ✓ ${svc.name} online`, 'success');
        }
      }
      await wait(200);
      addOutput('All 8 services running. System operational.', 'success');
      addOutput('');
    } else if (trimmed === 'clear') {
      setLines([]);
    } else if (trimmed === '') {
      // empty
    } else {
      addOutput(`cortex: command not found: "${trimmed}"`, 'error');
      addOutput('Type "help" for available commands', '');
      addOutput('');
    }

    setIsProcessing(false);
  }, [services, addOutput, addCmd, updateService]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !isProcessing) {
      handleCommand(input);
      setInput('');
    }
  }, [input, isProcessing, handleCommand]);

  return (
    <section className="section tui-section" id="tui-console">
      <motion.div className="section-badge" initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        06 — LIVE CONSOLE
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
        Take the Wheel
      </motion.h2>
      <motion.p className="section-sub" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
        This isn't a recording — it's a live simulation. Type real Cortex commands and
        watch the system respond in real-time. Stop services, watch cascading halts,
        restart them, and see the DAG-aware recovery.
      </motion.p>

      <motion.div className="tui-stage" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
        {/* Service Dashboard */}
        <div className="tui-dashboard">
          {services.map(svc => {
            const Icon = svc.icon;
            return (
              <motion.div
                key={svc.id}
                className={`tui-svc-card ${svc.status}`}
                layout
                animate={{
                  scale: svc.status === 'restarting' ? [1, 1.05, 1] : 1,
                }}
                transition={{ duration: 0.5 }}
              >
                <Icon className="tui-svc-icon" size={24} />
                <div className="tui-svc-name">{svc.name}</div>
                <div className="tui-svc-status">{svc.status}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Terminal */}
        <div className="tui-terminal" onClick={focusInput}>
          <div className="tui-terminal-bar">
            <div className="tui-terminal-dots">
              <div className="tui-terminal-dot r" />
              <div className="tui-terminal-dot y" />
              <div className="tui-terminal-dot g" />
            </div>
            <div className="tui-terminal-title">
              <TermIcon size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              cortex — interactive console
            </div>
          </div>
          <div className="tui-terminal-body" ref={bodyRef}>
            {lines.map((line, i) => (
              <div key={i} className="tui-line">
                {line.type === 'cmd' ? (
                  <>
                    <span className="tui-prompt">cortex ❯ </span>
                    <span className="tui-cmd">{line.text}</span>
                  </>
                ) : (
                  <span className={`tui-output ${line.cls}`}>{line.text}</span>
                )}
              </div>
            ))}
            <div className="tui-input-line">
              <span className="tui-prompt">cortex ❯ </span>
              <input
                ref={inputRef}
                className="tui-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isProcessing ? '' : 'Type a command...'}
                disabled={isProcessing}
                autoComplete="off"
                spellCheck="false"
              />
            </div>
          </div>
        </div>

        {/* Help hints */}
        <div className="tui-help">
          <div className="tui-help-cmd"><span className="tui-help-key">cortex ps</span><span className="tui-help-desc">Status</span></div>
          <div className="tui-help-cmd"><span className="tui-help-key">cortex stop lidar</span><span className="tui-help-desc">Stop + cascade</span></div>
          <div className="tui-help-cmd"><span className="tui-help-key">cortex start lidar</span><span className="tui-help-desc">Start + deps</span></div>
          <div className="tui-help-cmd"><span className="tui-help-key">cortex restart motor</span><span className="tui-help-desc">Restart</span></div>
          <div className="tui-help-cmd"><span className="tui-help-key">cortex logs camera</span><span className="tui-help-desc">View logs</span></div>
          <div className="tui-help-cmd"><span className="tui-help-key">cortex down</span><span className="tui-help-desc">Shutdown all</span></div>
          <div className="tui-help-cmd"><span className="tui-help-key">cortex up</span><span className="tui-help-desc">Start all</span></div>
        </div>
      </motion.div>
    </section>
  );
}
