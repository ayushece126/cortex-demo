import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Terminal, Server, Unplug, MonitorSpeaker, Layers, Activity,
  Play, Pause, RotateCcw, FileCode2
} from 'lucide-react';
import './CodebaseXray.css';

/* ── Architecture Steps with REAL Rust Code ── */
const STEPS = [
  {
    id: 'cli_parse',
    title: 'CLI Parses Command',
    desc: 'User runs "cortex up" — CLI discovers config file',
    icon: Terminal,
    file: 'krill-cli/src/commands/up.rs',
    code: `// krill up - Start daemon and optionally attach TUI

pub async fn execute(args: UpArgs) -> Result<()> {
    // Discover config file
    let config_path = config_discovery::discover_config(
        args.config
    )?;
    info!("Using configuration: {:?}", config_path);

    // Check if daemon is already running
    let daemon_running = daemon_manager::is_daemon_running(
        &args.socket
    ).await;

    if !daemon_running {
        info!("Starting daemon...");
        // Start daemon in background ──────────►
        daemon_manager::start_daemon_background(
            &config_path, &args.socket, None
        ).await?;`,
  },
  {
    id: 'pipe_create',
    title: 'IPC Pipe Created',
    desc: 'CLI creates a Unix pipe for daemon startup handshake',
    icon: Unplug,
    file: 'krill-cli/src/daemon_manager.rs',
    code: `// Start daemon in background
pub async fn start_daemon_background(
    config_path: &Path,
    socket_path: &Path,
    log_dir: Option<&Path>,
) -> Result<()> {
    // Create pipe for startup communication
    let (read_fd, write_fd) = os_pipe::pipe()
        .context("Failed to create pipe")?;

    let write_fd_raw = write_fd.as_raw_fd();

    // Build daemon command
    let mut cmd = tokio::process::Command::new(&current_exe);
    cmd.arg("daemon")
        .arg("--config").arg(config_path)
        .arg("--socket").arg(socket_path)
        .arg("--startup-pipe-fd")
        .arg(write_fd_raw.to_string());

    // CRITICAL: Preserve the write FD across exec
    unsafe {
        cmd.pre_exec(move || {
            fcntl(write_fd_raw,
                  FcntlArg::F_SETFD(FdFlag::empty()))
                .map_err(std::io::Error::other)?;
            Ok(())
        });
    }`,
  },
  {
    id: 'daemon_start',
    title: 'Daemon Spawns',
    desc: 'Background daemon process initializes orchestrator',
    icon: Server,
    file: 'krill-daemon/src/main.rs',
    code: `// Krill Daemon — Main entry point
#[tokio::main]
async fn main() -> Result<()> {
    info!("Starting krill-daemon");

    // Load configuration
    let config = KrillConfig::from_file(&args.config)
        .context("Failed to load configuration")?;
    info!("Services: {}", config.services.len());

    // Create event channels
    let (event_tx, mut event_rx) =
        mpsc::unbounded_channel();
    let (command_tx, mut command_rx) =
        mpsc::unbounded_channel();
    let (heartbeat_tx, mut heartbeat_rx) =
        mpsc::unbounded_channel();

    // Create orchestrator with DAG
    let orchestrator = Arc::new(
        Orchestrator::new(config, event_tx.clone())
            .context("Failed to create orchestrator")?
    );`,
  },
  {
    id: 'socket_bind',
    title: 'Unix Socket Opens',
    desc: 'Daemon binds /tmp/krill.sock for client connections',
    icon: Unplug,
    file: 'krill-daemon/src/ipc_server.rs',
    code: `// IPC Server — Unix socket server for clients
pub async fn start(&self) -> Result<(), IpcError> {
    info!("Starting IPC server on {:?}",
          self.socket_path);

    let listener = UnixListener::bind(
        &self.socket_path
    )?;

    // Set permissions to 0600 (owner only)
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let metadata = std::fs::metadata(
            &self.socket_path
        )?;
        let mut permissions = metadata.permissions();
        permissions.set_mode(0o600);
        std::fs::set_permissions(
            &self.socket_path, permissions
        )?;
    }

    info!("IPC server listening on {:?}",
          self.socket_path);`,
  },
  {
    id: 'dag_build',
    title: 'DAG Built & Validated',
    desc: 'Topological sort determines safe startup order',
    icon: Layers,
    file: 'krill-common/src/dag.rs',
    code: `// Dependency Graph — Topological Sort
pub fn startup_order(&self) -> Result<Vec<String>> {
    let mut in_degree: HashMap<String, usize> =
        HashMap::new();
    let mut queue = VecDeque::new();
    let mut order = Vec::new();

    // Calculate in-degrees (Kahn's algorithm)
    for service in &self.services {
        let degree = self.reverse_edges
            .get(service)
            .map_or(0, |deps| deps.len());
        in_degree.insert(service.clone(), degree);
        if degree == 0 {
            queue.push_back(service.clone());
        }
    }

    // Process queue — BFS topological sort
    while let Some(service) = queue.pop_front() {
        order.push(service.clone());
        if let Some(dependents) =
            self.edges.get(&service) {
            for dependent in dependents {
                let degree =
                    in_degree.get_mut(dependent).unwrap();
                *degree -= 1;
                if *degree == 0 {
                    queue.push_back(dependent.clone());
                }
            }
        }
    }`,
  },
  {
    id: 'cascade',
    title: 'Cascade Failure Logic',
    desc: 'BFS traversal finds all dependents to halt safely',
    icon: Activity,
    file: 'krill-common/src/dag.rs',
    code: `// Cascade failure — BFS dependent discovery
pub fn cascade_failure(
    &self, failed_service: &str
) -> HashSet<String> {
    let mut to_stop = HashSet::new();
    let mut queue = VecDeque::new();
    queue.push_back(failed_service.to_string());

    while let Some(service) = queue.pop_front() {
        if let Some(dependents) =
            self.edges.get(&service) {
            for dependent in dependents {
                if !to_stop.contains(dependent) {
                    to_stop.insert(dependent.clone());
                    queue.push_back(dependent.clone());
                }
            }
        }
    }
    to_stop
}

// Orchestrator calls this on failure:
// let dependents = self.dag
//     .cascade_failure(failed_service);
// for dep in dependents {
//     runner.stop().await?;
// }`,
  },
  {
    id: 'tui_launch',
    title: 'Dashboard (TUI) Launches',
    desc: 'Real-time monitoring connects via Unix socket',
    icon: MonitorSpeaker,
    file: 'krill-cli/src/commands/up.rs',
    code: `    // Wait for daemon to be ready
    daemon_manager::wait_for_socket(
        &args.socket,
        Duration::from_secs(10)
    ).await?;

    println!("Daemon started successfully");
}

// Launch TUI unless detached mode
if !args.detached {
    info!("Launching TUI...");
    let tui_config = krill_tui::TuiConfig {
        socket: args.socket,
    };

    // TUI connects to daemon via Unix socket
    // and receives real-time status broadcasts
    krill_tui::run(tui_config).await?;
} else {
    println!(
        "Running in detached mode. \\
         Use 'krill ps' to attach TUI."
    );
}`,
  },
];

/* ── Main Component ── */
export default function CodebaseXray() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [typedCode, setTypedCode] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const cancelRef = useRef(false);
  const codeAreaRef = useRef(null);

  const typeCode = useCallback(async (code, speedFactor = 1) => {
    const chars = code.split('');
    let typed = '';
    for (let i = 0; i < chars.length; i++) {
      if (cancelRef.current) return;
      typed += chars[i];
      setTypedCode(typed);

      // Variable typing speed for realism
      const char = chars[i];
      let delay = 12 / speedFactor;
      if (char === '\n') delay = 80 / speedFactor;
      else if (char === ' ') delay = 8 / speedFactor;
      else if (char === '{' || char === '}') delay = 30 / speedFactor;
      else if ('()[]<>'.includes(char)) delay = 15 / speedFactor;

      await new Promise(r => setTimeout(r, delay));
    }
  }, []);

  // Auto-scroll code area
  useEffect(() => {
    if (codeAreaRef.current) {
      codeAreaRef.current.scrollTop = codeAreaRef.current.scrollHeight;
    }
  }, [typedCode]);

  const playFlow = useCallback(async () => {
    cancelRef.current = false;
    setIsPlaying(true);
    setCurrentStep(-1);
    setTypedCode('');

    for (let i = 0; i < STEPS.length; i++) {
      if (cancelRef.current) break;
      setCurrentStep(i);
      setTypedCode('');
      await new Promise(r => setTimeout(r, 400));
      if (cancelRef.current) break;
      await typeCode(STEPS[i].code);
      if (cancelRef.current) break;
      await new Promise(r => setTimeout(r, 1200));
    }

    setIsPlaying(false);
  }, [typeCode]);

  const pause = useCallback(() => {
    cancelRef.current = true;
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    cancelRef.current = true;
    setIsPlaying(false);
    setCurrentStep(-1);
    setTypedCode('');
  }, []);

  const activeStep = currentStep >= 0 ? STEPS[currentStep] : null;

  return (
    <section className="section xray-section" id="xray">
      <motion.div className="section-badge" initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        05 — CODEBASE X-RAY
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
        Theory Meets Implementation
      </motion.h2>
      <motion.p className="section-sub" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
        Every architecture diagram maps directly to real Rust code. Watch the data flow
        step-by-step — from CLI command to live dashboard — with the exact source code
        that makes it happen.
      </motion.p>

      <motion.div className="xray-stage" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
        {/* Left: Architecture Flow */}
        <div className="xray-arch">
          <div className="xray-arch-title">Architecture Flow</div>
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const status = i < currentStep ? 'completed' : i === currentStep ? 'active' : 'inactive';
            return (
              <div key={step.id}>
                <motion.div
                  className={`xray-block ${status}`}
                  initial={false}
                  animate={{
                    scale: status === 'active' ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  onClick={() => {
                    if (!isPlaying) {
                      setCurrentStep(i);
                      setTypedCode(step.code);
                    }
                  }}
                  style={{ cursor: isPlaying ? 'default' : 'pointer' }}
                >
                  <div className="xray-block-icon">
                    <Icon size={18} />
                  </div>
                  <div className="xray-block-info">
                    <h4>{step.title}</h4>
                    <p>{step.desc}</p>
                  </div>
                </motion.div>
                {i < STEPS.length - 1 && (
                  <div className={`xray-connector ${status}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Code Editor */}
        <div className="xray-editor">
          <div className="xray-editor-bar">
            <div className="xray-editor-dots">
              <div className="xray-editor-dot red" />
              <div className="xray-editor-dot yellow" />
              <div className="xray-editor-dot green" />
            </div>
            <div className={`xray-editor-tab ${activeStep ? 'active' : ''}`}>
              <FileCode2 className="xray-editor-tab-icon" size={12} />
              {activeStep ? activeStep.file.split('/').pop() : 'cortex'}
            </div>
            <div className="xray-file-path">
              {activeStep ? `crates/${activeStep.file}` : 'Select a step to view code'}
            </div>
          </div>
          <div className="xray-code-area" ref={codeAreaRef}>
            {typedCode ? (
              <>
                <SyntaxHighlighter
                  language="rust"
                  style={vscDarkPlus}
                  showLineNumbers
                  wrapLines
                  customStyle={{
                    background: 'transparent',
                    padding: '0 16px',
                    margin: 0,
                    fontSize: '0.72rem',
                  }}
                  lineNumberStyle={{
                    color: '#484f58',
                    fontSize: '0.65rem',
                    paddingRight: '16px',
                    minWidth: '2.5em',
                  }}
                >
                  {typedCode}
                </SyntaxHighlighter>
                {isPlaying && <span className="xray-cursor" />}
              </>
            ) : (
              <div style={{ padding: '40px', color: '#484f58', textAlign: 'center', fontSize: '0.8rem' }}>
                {currentStep === -1
                  ? '▶ Press Play to watch the code flow, or click any architecture step'
                  : 'Loading...'}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Controls */}
      <div className="xray-controls">
        <button className="btn btn-primary" onClick={playFlow} disabled={isPlaying}>
          <Play size={14} /> Play Flow
        </button>
        <button className="btn btn-warning" onClick={pause} disabled={!isPlaying}>
          <Pause size={14} /> Pause
        </button>
        <button className="btn btn-ghost" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </section>
  );
}
