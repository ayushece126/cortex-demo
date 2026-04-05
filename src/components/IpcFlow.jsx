import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Pause } from 'lucide-react';
import './IpcFlow.css';

/*
 * Models the REAL IPC flow from the Krill codebase:
 *
 * 1. User types `krill up` in terminal
 * 2. CLI reads config (config_discovery.rs)
 * 3. CLI creates an os_pipe::pipe() for startup communication (daemon_manager.rs:41)
 * 4. CLI spawns daemon as background process with --startup-pipe-fd (daemon_manager.rs:49-56)
 * 5. Daemon loads config, validates it (KrillConfig::from_file + validate)
 * 6. Daemon opens Unix Domain Socket at /tmp/krill.sock (ipc_server.rs)
 * 7. Daemon sends StartupMessage::Success via the pipe (daemon main.rs)
 * 8. CLI reads pipe, gets success confirmation (daemon_manager.rs:101-109)
 * 9. CLI connects to UDS for ongoing communication
 * 10. Messages flow as JSON-serialized ClientMessage / ServerMessage over UDS
 */

const IPC_STEPS = [
  { text: 'User types krill up in terminal', code: 'cli/main.rs', actor: 'cli' },
  { text: 'CLI discovers & reads robot.yaml config', code: 'config_discovery.rs', actor: 'cli' },
  { text: 'CLI creates OS pipe for startup IPC', code: 'os_pipe::pipe()', actor: 'cli' },
  { text: 'CLI spawns daemon as background process', code: 'tokio::process::Command', actor: 'both' },
  { text: 'Daemon loads config, builds DependencyGraph', code: 'DependencyGraph::new()', actor: 'daemon' },
  { text: 'Daemon opens Unix Domain Socket', code: '/tmp/krill.sock', actor: 'daemon' },
  { text: 'Daemon writes StartupMessage::Success to pipe', code: 'serde_json → pipe fd', actor: 'daemon' },
  { text: 'CLI reads pipe confirmation — daemon is ready', code: 'read_startup_result()', actor: 'cli' },
  { text: 'CLI connects to UDS for ongoing commands', code: 'UnixStream::connect()', actor: 'cli' },
  { text: 'JSON messages flow: ClientMessage ↔ ServerMessage', code: 'Heartbeat / Command / Snapshot', actor: 'both' },
];

export default function IpcFlow() {
  const [stepStates, setStepStates] = useState(IPC_STEPS.map(() => 'idle'));
  const [packetPos, setPacketPos] = useState(null); // null | { dir: 'right'|'left', progress: 0-100 }
  const [commandText, setCommandText] = useState('');
  const [phase, setPhase] = useState('idle');
  const [paused, setPaused] = useState(false);
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

  // Animate typing the command
  const typeCommand = useCallback(async (text) => {
    for (let i = 0; i <= text.length; i++) {
      if (cancelRef.current) return;
      setCommandText(text.substring(0, i));
      await wait(60);
    }
  }, [wait]);

  // Animate a packet moving across
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

    // Type the command
    await typeCommand('krill up');
    await wait(400);

    // Step through IPC flow
    for (let i = 0; i < IPC_STEPS.length; i++) {
      if (cancelRef.current) return;
      setStep(i, 'active');

      // Send packet animation for cross-component steps
      if (i === 3) await sendPacket('right');  // CLI spawns daemon
      if (i === 6) await sendPacket('left');   // Daemon sends success back
      if (i === 8) await sendPacket('right');  // CLI connects to UDS
      if (i === 9) {
        await sendPacket('right');
        await sendPacket('left');
      }

      await wait(i === 9 ? 800 : 1200);
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
  };

  return (
    <section className="section ipc-section" id="ipc-flow">
      <motion.div className="section-badge" initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        04 — INTER-PROCESS COMMUNICATION
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
        How CLI Talks to the Daemon
      </motion.h2>
      <motion.p className="section-sub" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
        Krill uses a <strong>two-stage IPC architecture</strong>: an OS pipe for zero-downtime daemon spawning,
        then a persistent Unix Domain Socket for all runtime communication. Watch the exact data flow.
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
          <div className="ipc-actor actor-cli">
            <span className="ipc-actor-icon">💻</span>
            <div className="ipc-actor-name">krill-cli</div>
            <div className="ipc-actor-sub">User-facing binary</div>
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
            <div className="ipc-tube-label">Unix Domain Socket / OS Pipe</div>
          </div>

          <div className="ipc-actor actor-daemon">
            <span className="ipc-actor-icon">⚙️</span>
            <div className="ipc-actor-name">krill-daemon</div>
            <div className="ipc-actor-sub">Background orchestrator</div>
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
          <Play size={14} /> Trace IPC Flow
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
