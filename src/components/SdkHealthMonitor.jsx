import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, XCircle } from 'lucide-react';
import './SdkHealthMonitor.css';

/*
 * Models the REAL Krill health monitoring pipeline:
 *
 * 1. Service uses krill-sdk-rust (or krill-python) to connect to /tmp/krill.sock
 * 2. Service calls client.heartbeat() which sends ClientMessage::Heartbeat { service, status, metadata }
 * 3. JSON message travels over Unix Domain Socket to krill-daemon
 * 4. Daemon's ipc_server.rs receives it, calls orchestrator.process_heartbeat()
 * 5. orchestrator.rs updates runner health state via runner.update_health(is_healthy)
 * 6. HealthChecker::Heartbeat tracks last_seen timestamp + timeout duration
 * 7. If heartbeat stops: is_timed_out() returns true → service marked Failed
 * 8. Orchestrator triggers cascade_failure() + restart protocol
 */

const SERVICES = [
  { id: 'lidar', name: 'lidar_driver', sdk: 'Rust' },
  { id: 'camera', name: 'camera_node', sdk: 'Python' },
  { id: 'perception', name: 'perception_ai', sdk: 'Python' },
  { id: 'navigation', name: 'nav_planner', sdk: 'Rust' },
];

const PYTHON_CODE = [
  { text: '# perception_ai/main.py', cls: 'cm' },
  { text: 'import krill', cls: 'kw' },
  { text: '' },
  { text: '# Connect to the Krill daemon via UDS', cls: 'cm' },
  { text: 'client = krill.Client("perception_ai")', cls: 'var', highlight: true },
  { text: '' },
  { text: 'while running:', cls: 'kw' },
  { text: '    frame = camera.read()', cls: 'var' },
  { text: '    objects = model.detect(frame)', cls: 'var' },
  { text: '' },
  { text: '    # Send heartbeat every iteration', cls: 'cm' },
  { text: '    client.heartbeat(status="HEALTHY")', cls: 'fn', highlight: true },
  { text: '' },
  { text: '    # Or report degraded with metadata', cls: 'cm' },
  { text: '    if fps < 10:', cls: 'kw' },
  { text: '        client.report_degraded("low fps")', cls: 'fn', highlight: true },
];

const RUST_CODE = [
  { text: '// lidar_driver/src/main.rs', cls: 'cm' },
  { text: 'use krill_sdk::KrillClient;', cls: 'kw' },
  { text: '' },
  { text: '// Connect to daemon via /tmp/krill.sock', cls: 'cm' },
  { text: 'let client = KrillClient::new("lidar")', cls: 'var', highlight: true },
  { text: '    .await?;', cls: 'op' },
  { text: '' },
  { text: 'loop {', cls: 'kw' },
  { text: '    let scan = lidar.read_scan();', cls: 'var' },
  { text: '    publish(scan);', cls: 'fn' },
  { text: '' },
  { text: '    // Send heartbeat to orchestrator', cls: 'cm' },
  { text: '    client.heartbeat().await?;', cls: 'fn', highlight: true },
  { text: '' },
  { text: '    // SDK serializes to JSON:', cls: 'cm' },
  { text: '    // ClientMessage::Heartbeat {', cls: 'cm' },
  { text: '    //   service: "lidar",', cls: 'cm' },
  { text: '    //   status: ServiceStatus::Healthy,', cls: 'cm' },
  { text: '    // }', cls: 'cm' },
  { text: '}', cls: 'kw' },
];

export default function SdkHealthMonitor() {
  const [serviceStates, setServiceStates] = useState(
    Object.fromEntries(SERVICES.map(s => [s.id, { status: 'healthy', lastSeen: 0, timer: 5 }]))
  );
  const [pingPos, setPingPos] = useState(null); // { service, progress }
  const [codeTab, setCodeTab] = useState('python');
  const [phase, setPhase] = useState('idle');
  const [heartbeatKilled, setHeartbeatKilled] = useState(null);
  const [timeoutProgress, setTimeoutProgress] = useState(0);
  const cancelRef = useRef(false);
  const intervalRef = useRef(null);

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  // Send a visual heartbeat ping
  const sendPing = useCallback(async (serviceId) => {
    const steps = 15;
    for (let i = 0; i <= steps; i++) {
      setPingPos({ service: serviceId, progress: (i / steps) * 100 });
      await wait(25);
    }
    setPingPos(null);
    // Update last_seen
    setServiceStates(prev => ({
      ...prev,
      [serviceId]: { ...prev[serviceId], status: 'healthy', lastSeen: Date.now(), timer: 5 }
    }));
  }, []);

  const startMonitoring = useCallback(async () => {
    cancelRef.current = false;
    setPhase('running');
    setHeartbeatKilled(null);
    setTimeoutProgress(0);
    setServiceStates(Object.fromEntries(SERVICES.map(s => [s.id, { status: 'healthy', lastSeen: Date.now(), timer: 5 }])));

    // Start continuous heartbeats
    const heartbeatLoop = async () => {
      while (!cancelRef.current) {
        for (const svc of SERVICES) {
          if (cancelRef.current) return;
          if (svc.id === heartbeatKilled) continue; // skip killed service
          await sendPing(svc.id);
          await wait(300);
        }
        await wait(800);
      }
    };
    heartbeatLoop();
  }, [sendPing, heartbeatKilled]);

  const killHeartbeat = useCallback(async (serviceId) => {
    setHeartbeatKilled(serviceId);

    // Simulate timeout countdown
    for (let i = 0; i <= 100; i += 2) {
      if (cancelRef.current) return;
      setTimeoutProgress(i);
      await wait(100);
    }

    // Timeout expired → mark failed
    setServiceStates(prev => ({
      ...prev,
      [serviceId]: { ...prev[serviceId], status: 'failed', timer: 0 }
    }));
    await wait(1500);

    // Cascade: halt dependents
    if (serviceId === 'lidar' || serviceId === 'camera') {
      setServiceStates(prev => ({
        ...prev,
        perception: { ...prev.perception, status: 'failed' },
        navigation: { ...prev.navigation, status: 'failed' },
      }));
    }
    await wait(1500);

    // Auto-restart
    setServiceStates(prev => ({
      ...prev,
      [serviceId]: { ...prev[serviceId], status: 'restarting' }
    }));
    await wait(1200);
    setServiceStates(prev => ({
      ...prev,
      [serviceId]: { ...prev[serviceId], status: 'healthy', timer: 5 }
    }));
    setHeartbeatKilled(null);
    setTimeoutProgress(0);

    // Recover dependents
    await wait(600);
    setServiceStates(prev => ({
      ...prev,
      perception: { ...prev.perception, status: 'healthy', timer: 5 },
      navigation: { ...prev.navigation, status: 'healthy', timer: 5 },
    }));
  }, []);

  const reset = () => {
    cancelRef.current = true;
    setPhase('idle');
    setHeartbeatKilled(null);
    setPingPos(null);
    setTimeoutProgress(0);
    setServiceStates(Object.fromEntries(SERVICES.map(s => [s.id, { status: 'healthy', lastSeen: 0, timer: 5 }])));
  };

  const codeLines = codeTab === 'python' ? PYTHON_CODE : RUST_CODE;

  return (
    <section className="section sdk-section" id="sdk-health">
      <motion.div className="section-badge" initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        06 — SDK-DRIVEN HEALTH MONITORING
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
        Real-Time Heartbeats via SDKs
      </motion.h2>
      <motion.p className="section-sub" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
        Services use the <strong>krill-sdk</strong> (available in Rust, Python, and C++) to send heartbeats
        through a Unix Domain Socket. If a heartbeat stops, the daemon's <code style={{color:'#c084fc'}}>HealthChecker::Heartbeat</code> times
        out and triggers automatic recovery.
      </motion.p>

      <motion.div className="sdk-stage" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
        {/* Code Panel */}
        <div className="sdk-code-panel">
          <div className="sdk-code-header">
            <span className="dot r" /><span className="dot y" /><span className="dot g" />
            <span className={`sdk-code-tab ${codeTab === 'python' ? 'active' : ''}`} onClick={() => setCodeTab('python')}>
              🐍 Python SDK
            </span>
            <span className={`sdk-code-tab ${codeTab === 'rust' ? 'active' : ''}`} onClick={() => setCodeTab('rust')}>
              🦀 Rust SDK
            </span>
          </div>
          <div className="sdk-code-content">
            {codeLines.map((line, i) => (
              <span key={`${codeTab}-${i}`} className={`sdk-code-line ${line.highlight ? 'highlight' : ''}`}>
                <span className="line-num">{i + 1}</span>
                <span className={line.cls || ''}>{line.text}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Monitor Panel */}
        <div className="sdk-monitor-panel">
          {/* Heartbeat Channel */}
          <div className="sdk-channel">
            <div className="sdk-channel-label">Heartbeat Channel (Unix Domain Socket)</div>
            <div className="sdk-channel-track">
              <AnimatePresence>
                {pingPos && (
                  <motion.div
                    className={`sdk-heartbeat-ping ${heartbeatKilled === pingPos.service ? 'dead' : ''}`}
                    style={{ left: `${pingPos.progress}%` }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  />
                )}
              </AnimatePresence>
            </div>
            <div className="sdk-channel-endpoints">
              <span>Service SDK →</span>
              <span>→ krill-daemon</span>
            </div>
          </div>

          {/* Timeout bar */}
          {heartbeatKilled && (
            <div className="sdk-timeout-bar">
              <div className="sdk-timeout-label">
                ⏱ Heartbeat timeout for {heartbeatKilled} ({Math.round(5 - (timeoutProgress / 100) * 5)}s remaining)
              </div>
              <div className="sdk-timeout-track">
                <div className="sdk-timeout-fill" style={{
                  width: `${timeoutProgress}%`,
                  background: timeoutProgress > 80
                    ? 'linear-gradient(90deg, #fbbf24, #f87171)'
                    : 'linear-gradient(90deg, #4ade80, #fbbf24)'
                }} />
              </div>
            </div>
          )}

          {/* Orchestrator Hub */}
          <div className="sdk-orchestrator">
            <div className="sdk-orchestrator-title">🧠 Orchestrator Health State</div>
            {SERVICES.map(svc => {
              const state = serviceStates[svc.id];
              return (
                <motion.div
                  key={svc.id}
                  className={`sdk-svc-row ${state.status}`}
                  animate={state.status === 'failed' ? { x: [0, -2, 2, -1, 1, 0] } : {}}
                  transition={{ duration: 0.4, repeat: state.status === 'failed' ? Infinity : 0 }}
                >
                  <div className="sdk-svc-dot" />
                  <span className="sdk-svc-name">{svc.name}</span>
                  <span className="sdk-svc-timer">SDK: {svc.sdk}</span>
                  <span className="sdk-svc-badge">{state.status}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Controls */}
      <div className="controls" style={{ marginTop: 20 }}>
        <button className="btn btn-primary" onClick={startMonitoring} disabled={phase === 'running'}>
          <Play size={14} /> Start Heartbeats
        </button>
        <button className="btn btn-danger" onClick={() => killHeartbeat('lidar')} disabled={phase !== 'running' || heartbeatKilled}>
          <XCircle size={14} /> Kill LIDAR Heartbeat
        </button>
        <button className="btn btn-ghost" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </section>
  );
}
