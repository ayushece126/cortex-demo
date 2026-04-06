import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Pause, FileCode, CheckCircle, Network, Layers } from 'lucide-react';
import './IpcFlow.css';

const IPC_STEPS = [
  { text: 'User types `krill up` in terminal', code: 'cli/main.rs', actor: 'cli' },
  { text: 'CLI parses command and reads robot.yaml', code: 'config_discovery.rs', actor: 'cli', action: 'show_yaml' },
  { text: 'CLI fires up daemon in background & builds OS pipe', code: 'tokio::process', actor: 'both', action: 'spawn_daemon' },
  { text: 'Daemon builds graph & guarantees safety', code: 'DependencyGraph::new()', actor: 'daemon', action: 'build_dag' },
  { text: 'Daemon sends ready confirmation via pipe', code: 'StartupMessage::Success', actor: 'daemon', packet: 'left' },
  { text: 'CLI reads confirmation & drops pipe', code: 'read_startup_result()', actor: 'cli', action: 'cli_ready' },
  { text: 'Daemon fires up Tokio tasks for each service', code: 'tokio::spawn(ServiceRunner)', actor: 'daemon', action: 'spawn_tasks' },
  { text: 'Tasks stream health/logs over UDS channels', code: 'UnixStream::connect()', actor: 'both', packet: 'bi' },
];

export default function IpcFlow() {
  const [stepStates, setStepStates] = useState(IPC_STEPS.map(() => 'idle'));
  const [packetPos, setPacketPos] = useState(null); 
  const [commandText, setCommandText] = useState('');
  const [phase, setPhase] = useState('idle');
  const [paused, setPaused] = useState(false);
  
  // Visual states
  const [hasYaml, setHasYaml] = useState(false);
  const [daemonActive, setDaemonActive] = useState(false);
  const [hasDag, setHasDag] = useState(false);
  const [hasTasks, setHasTasks] = useState(false);
  const [cliReady, setCliReady] = useState(false);

  const pauseRef = useRef(false);
  const cancelRef = useRef(false);

  const wait = useCallback((ms) => {
    return new Promise(resolve => {
      let elapsed = 0;
      const step = 40;
      const tick = () => {
        if (cancelRef.current) return resolve();
        if (!pauseRef.current) elapsed += step;
        if (elapsed >= ms) return resolve();
        setTimeout(tick, step);
      };
      tick();
    });
  }, []);

  const setStep = (idx, state) => {
    setStepStates(prev => prev.map((s, i) => {
      if (i === idx) return state;
      if (state === 'active' && s === 'active') return 'done';
      return s;
    }));
  };

  const typeCommand = useCallback(async (text) => {
    for (let i = 0; i <= text.length; i++) {
      if (cancelRef.current) return;
      setCommandText(text.substring(0, i));
      await wait(60);
    }
  }, [wait]);

  const sendPacket = useCallback(async (dir) => {
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      if (cancelRef.current) return;
      setPacketPos({ dir, progress: (i / steps) * 100 });
      await wait(30);
    }
    await wait(200);
    setPacketPos(null);
  }, [wait]);

  const run = useCallback(async () => {
    cancelRef.current = false;
    pauseRef.current = false;
    setPhase('running');
    setPaused(false);
    setStepStates(IPC_STEPS.map(() => 'idle'));
    setCommandText('');
    setPacketPos(null);
    setHasYaml(false); setDaemonActive(false); setHasDag(false); setHasTasks(false); setCliReady(false);

    await typeCommand('krill up');
    await wait(400);

    for (let i = 0; i < IPC_STEPS.length; i++) {
      if (cancelRef.current) return;
      setStep(i, 'active');

      const action = IPC_STEPS[i].action;
      const packet = IPC_STEPS[i].packet;

      if (action === 'show_yaml') setHasYaml(true);
      if (action === 'spawn_daemon') { await sendPacket('right'); setDaemonActive(true); }
      if (action === 'build_dag') setHasDag(true);
      if (packet === 'left') await sendPacket('left');
      if (action === 'cli_ready') setCliReady(true);
      if (action === 'spawn_tasks') setHasTasks(true);
      if (packet === 'bi') {
        await sendPacket('right');
        await sendPacket('left');
      }

      await wait(packet === 'bi' ? 800 : 1200);
      setStep(i, 'done');
    }

    setPhase('done');
  }, [wait, typeCommand, sendPacket]);

  const togglePause = () => { pauseRef.current = !pauseRef.current; setPaused(p => !p); };
  const reset = () => {
    cancelRef.current = true;
    setPhase('idle');
    setPaused(false);
    pauseRef.current = false;
    setStepStates(IPC_STEPS.map(() => 'idle'));
    setCommandText('');
    setPacketPos(null);
    setHasYaml(false); setDaemonActive(false); setHasDag(false); setHasTasks(false); setCliReady(false);
  };

  return (
    <section className="section ipc-section" id="ipc-flow">
      <motion.div className="section-badge" initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        04 — THE DATA FLOW
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
        Inside the Daemon
      </motion.h2>
      <motion.p className="section-sub" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
        Watch exactly what happens when you type `krill up`. From CLI handshakes, dependency graph building, perfectly timed Tokio task spawning, to duplex channel communication.
      </motion.p>

      <motion.div className="ipc-stage" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
        {/* Command display */}
        <div className="ipc-command">
          <span className="prompt">$ </span>
          <span className="cmd">krill </span>
          <span className="arg">{commandText.replace('krill ', '')}</span>
          {phase === 'idle' || commandText.length < 8 ? <span className="cursor" /> : null}
        </div>

        {/* Actor boxes */}
        <div className="ipc-actors" style={{ marginTop: 20 }}>
          
          {/* CLI Actor */}
          <div className="ipc-actor actor-cli">
            <span className="ipc-actor-icon">💻</span>
            <div className="ipc-actor-name">cortex-cli</div>
            <div className="ipc-actor-sub">User terminal</div>
            <div className="ipc-actor-internals">
               <AnimatePresence>
                 {hasYaml && (
                   <motion.div className="ipc-box" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                     <FileCode size={14} className="ipc-box-icon" /> robot.yaml
                   </motion.div>
                 )}
                 {cliReady && (
                   <motion.div className="ipc-box success-box" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                     <CheckCircle size={14} className="ipc-box-icon" /> Pipeline Ready
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </div>

          <div className="ipc-tube">
            <div className="ipc-tube-line">
              <AnimatePresence>
                {packetPos && (
                  <motion.div
                    className={`ipc-packet ${packetPos.dir === 'right' ? 'command' : 'response'}`}
                    style={{
                      left: packetPos.dir === 'right' ? `${packetPos.progress}%` : `${100 - packetPos.progress}%`,
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    {packetPos.dir === 'right' ? '→' : '←'}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="ipc-tube-label">OS PIPE / CHANNELS</div>
          </div>

          {/* Daemon Actor */}
          <div className={`ipc-actor actor-daemon ${daemonActive ? 'active' : 'dormant'}`}>
            <span className="ipc-actor-icon">⚙️</span>
            <div className="ipc-actor-name">cortex-daemon</div>
            <div className="ipc-actor-sub">Background Orchestrator</div>
            <div className="ipc-actor-internals">
               <AnimatePresence>
                 {hasDag && (
                   <motion.div className="ipc-box" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                     <Network size={14} className="ipc-box-icon" /> DAG Engine
                   </motion.div>
                 )}
                 {hasTasks && (
                   <motion.div className="ipc-tasks-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div className="ipc-task"><Layers size={10} /> Tokio Task (LiDAR)</div>
                      <div className="ipc-task"><Layers size={10} /> Tokio Task (SLAM)</div>
                      <div className="ipc-task"><Layers size={10} /> Tokio Task (Motor)</div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Internal steps */}
        <div className="ipc-internals">
          {IPC_STEPS.map((step, i) => (
            <motion.div
              key={i}
              className={`ipc-internal-step ${stepStates[i]}`}
              animate={stepStates[i] === 'active' ? { x: [0, 3, 0] } : {}}
              transition={{ duration: 0.3 }}
            >
              <span className="ipc-step-num">{i + 1}</span>
              <span className="ipc-step-text">{step.text}</span>
              <span className="ipc-step-code">{step.code}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Controls */}
      <div className="controls" style={{ marginTop: 20 }}>
        <button className="btn btn-primary" onClick={run} disabled={phase === 'running'}>
          <Play size={14} /> Simulate Data Flow
        </button>
        <button className="btn btn-warning" onClick={togglePause} disabled={phase !== 'running'}>
          {paused ? <><Play size={14} /> Resume</> : <><Pause size={14} /> Pause</>}
        </button>
        <button className="btn btn-ghost" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </section>
  );
}
