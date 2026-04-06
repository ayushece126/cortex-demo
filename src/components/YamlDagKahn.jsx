import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Pause } from 'lucide-react';
import './YamlDagKahn.css';

/*
 * Mirrors the REAL cortex-shell.yaml and cortex-common/src/dag.rs
 *
 * The YAML config defines services + dependencies.
 * DependencyGraph::new() builds edges + reverse_edges.
 * DependencyGraph::startup_order() runs Kahn's topological sort.
 */

// The YAML lines to type out (based on real examples/cortex-shell.yaml)
const YAML_LINES = [
  { text: '# robot.yaml — Cortex Workspace Config', cls: 'comment' },
  { text: 'version: "1"', key: 'version', val: '"1"' },
  { text: 'name: autonomous-robot', key: 'name', val: 'autonomous-robot' },
  { text: '' },
  { text: 'services:', key: 'services', val: '' },
  { text: '  lidar_driver:', key: '  lidar_driver', val: '', svc: 'lidar' },
  { text: '    execute:', key: '    execute', val: '' },
  { text: '      type: shell', key: '      type', val: 'shell' },
  { text: '      command: "roslaunch lidar"', key: '      command', val: '"roslaunch lidar"' },
  { text: '    critical: true', key: '    critical', val: 'true' },
  { text: '' },
  { text: '  camera_node:', key: '  camera_node', val: '', svc: 'camera' },
  { text: '    execute:', key: '    execute', val: '' },
  { text: '      type: shell', key: '      command', val: '"cam_driver"' },
  { text: '' },
  { text: '  perception_ai:', key: '  perception_ai', val: '', svc: 'perception' },
  { text: '    execute:', key: '    execute', val: '' },
  { text: '      type: pixi', key: '      type', val: 'pixi' },
  { text: '      task: run-perception', key: '      task', val: 'run-perception' },
  { text: '    dependencies:', key: '    dependencies', val: '', highlight: true },
  { text: '      - lidar_driver', dep: true },
  { text: '      - camera_node', dep: true },
  { text: '    health_check:', key: '    health_check', val: '' },
  { text: '      type: heartbeat', key: '      type', val: 'heartbeat' },
  { text: '      timeout: 5s', key: '      timeout', val: '5s' },
  { text: '' },
  { text: '  nav_planner:', key: '  nav_planner', val: '', svc: 'navigation' },
  { text: '    execute:', key: '    execute', val: '' },
  { text: '      type: shell', key: '      type', val: 'shell' },
  { text: '      command: "nav_node"', key: '      command', val: '"nav_node"' },
  { text: '    dependencies:', key: '    dependencies', val: '', highlight: true },
  { text: '      - perception_ai', dep: true },
  { text: '' },
  { text: '  motor_control:', key: '  motor_control', val: '', svc: 'motor' },
  { text: '    execute:', key: '    execute', val: '' },
  { text: '      type: docker', key: '      type', val: 'docker' },
  { text: '      image: "motor:v2"', key: '      image', val: '"motor:v2"' },
  { text: '    dependencies:', key: '    dependencies', val: '', highlight: true },
  { text: '      - nav_planner', dep: true },
  { text: '    policy:', key: '    policy', val: '' },
  { text: '      restart: always', key: '      restart', val: 'always' },
  { text: '      max_restarts: 5', key: '      max_restarts', val: '5' },
];

// DAG layers for visualization (matches the YAML above)
const DAG_LAYERS = [
  [{ id: 'lidar', name: 'lidar_driver', icon: '📡', indegree: 0 },
   { id: 'camera', name: 'camera_node', icon: '📷', indegree: 0 }],
  [{ id: 'perception', name: 'perception_ai', icon: '🧠', indegree: 2 }],
  [{ id: 'navigation', name: 'nav_planner', icon: '🗺️', indegree: 1 }],
  [{ id: 'motor', name: 'motor_control', icon: '⚙️', indegree: 1 }],
];

const EDGES = [
  ['lidar', 'perception'], ['camera', 'perception'],
  ['perception', 'navigation'], ['navigation', 'motor'],
];

// Kahn's algorithm steps
const ALGO_STEPS = [
  'Calculate in-degree for every node',
  'Find nodes with in-degree = 0 → Queue',
  'Dequeue: Start lidar_driver (in=0)',
  'Dequeue: Start camera_node (in=0)',
  'Decrement dependents\' in-degrees',
  'perception_ai → in-degree drops to 0 → Queue',
  'Dequeue: Start perception_ai',
  'nav_planner → in-degree drops to 0 → Queue',
  'Dequeue: Start nav_planner',
  'motor_control → in-degree drops to 0 → Queue',
  'Dequeue: Start motor_control',
  '✅ All nodes processed — topological order complete',
];

export default function YamlDagKahn() {
  const [yamlVisible, setYamlVisible] = useState(0); // lines typed so far
  const [nodeStates, setNodeStates] = useState({}); // pending/visible/scanning/starting/healthy
  const [algoStepStates, setAlgoStepStates] = useState(ALGO_STEPS.map(() => 'pending'));
  const [queueItems, setQueueItems] = useState([]);
  const [phase, setPhase] = useState('idle');
  const [paused, setPaused] = useState(false);
  const pauseRef = useRef(false);
  const cancelRef = useRef(false);
  const stageRef = useRef(null);
  const nodeRefs = useRef({});
  const [edgeLines, setEdgeLines] = useState([]);

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

  // Compute edge SVG lines from DOM positions
  const computeEdges = useCallback(() => {
    const container = stageRef.current?.querySelector('.dag-canvas');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const lines = [];
    for (const [fromId, toId] of EDGES) {
      const fromEl = nodeRefs.current[fromId];
      const toEl = nodeRefs.current[toId];
      if (!fromEl || !toEl) continue;
      const fr = fromEl.getBoundingClientRect();
      const tr = toEl.getBoundingClientRect();
      lines.push({
        x1: fr.left + fr.width / 2 - rect.left,
        y1: fr.top + fr.height - rect.top,
        x2: tr.left + tr.width / 2 - rect.left,
        y2: tr.top - rect.top,
        from: fromId,
        to: toId,
      });
    }
    setEdgeLines(lines);
  }, []);

  useEffect(() => {
    const timer = setTimeout(computeEdges, 300);
    window.addEventListener('resize', computeEdges);
    return () => { clearTimeout(timer); window.removeEventListener('resize', computeEdges); };
  }, [computeEdges, nodeStates]);

  const setAlgoStep = (idx, state) => {
    setAlgoStepStates(prev => prev.map((s, i) => i === idx ? state : (state === 'active' && s === 'active' ? 'done' : s)));
  };

  const run = useCallback(async () => {
    cancelRef.current = false;
    pauseRef.current = false;
    setPhase('running');
    setPaused(false);
    setYamlVisible(0);
    setNodeStates({});
    setAlgoStepStates(ALGO_STEPS.map(() => 'pending'));
    setQueueItems([]);

    // === PHASE 1: Type YAML ===
    for (let i = 0; i <= YAML_LINES.length; i++) {
      if (cancelRef.current) return;
      setYamlVisible(i);
      // When a service header appears, show the node in DAG
      const line = YAML_LINES[i - 1];
      if (line?.svc) {
        setNodeStates(prev => ({ ...prev, [line.svc]: 'visible' }));
        setTimeout(computeEdges, 100);
      }
      await wait(80);
    }
    await wait(600);

    // === PHASE 2: Kahn's Algorithm ===
    // Step 0: Calculate in-degrees
    setAlgoStep(0, 'active');
    for (const layer of DAG_LAYERS) {
      for (const node of layer) {
        setNodeStates(prev => ({ ...prev, [node.id]: 'scanning' }));
      }
    }
    await wait(1200);
    setAlgoStep(0, 'done');

    // Step 1: Find in-degree=0

    setAlgoStep(1, 'active');
    setQueueItems([
      { id: 'lidar', state: 'ready' },
      { id: 'camera', state: 'ready' },
    ]);
    await wait(1000);
    setAlgoStep(1, 'done');

    // Step 2-3: Start lidar + camera
    setAlgoStep(2, 'active');
    setNodeStates(prev => ({ ...prev, lidar: 'starting' }));
    setQueueItems(prev => prev.filter(q => q.id !== 'lidar'));
    await wait(800);
    setNodeStates(prev => ({ ...prev, lidar: 'healthy' }));
    setAlgoStep(2, 'done');

    setAlgoStep(3, 'active');
    setNodeStates(prev => ({ ...prev, camera: 'starting' }));
    setQueueItems(prev => prev.filter(q => q.id !== 'camera'));
    await wait(800);
    setNodeStates(prev => ({ ...prev, camera: 'healthy' }));
    setAlgoStep(3, 'done');

    // Step 4-5: Decrement, perception goes to 0
    setAlgoStep(4, 'active');
    await wait(600);
    setAlgoStep(4, 'done');
    setAlgoStep(5, 'active');
    setQueueItems([{ id: 'perception', state: 'ready' }]);
    await wait(800);
    setAlgoStep(5, 'done');

    // Step 6: Start perception
    setAlgoStep(6, 'active');
    setNodeStates(prev => ({ ...prev, perception: 'starting' }));
    setQueueItems([]);
    await wait(800);
    setNodeStates(prev => ({ ...prev, perception: 'healthy' }));
    setAlgoStep(6, 'done');

    // Step 7-8: navigation
    setAlgoStep(7, 'active');
    setQueueItems([{ id: 'navigation', state: 'ready' }]);
    await wait(600);
    setAlgoStep(7, 'done');
    setAlgoStep(8, 'active');
    setNodeStates(prev => ({ ...prev, navigation: 'starting' }));
    setQueueItems([]);
    await wait(800);
    setNodeStates(prev => ({ ...prev, navigation: 'healthy' }));
    setAlgoStep(8, 'done');

    // Step 9-10: motor
    setAlgoStep(9, 'active');
    setQueueItems([{ id: 'motor', state: 'ready' }]);
    await wait(600);
    setAlgoStep(9, 'done');
    setAlgoStep(10, 'active');
    setNodeStates(prev => ({ ...prev, motor: 'starting' }));
    setQueueItems([]);
    await wait(800);
    setNodeStates(prev => ({ ...prev, motor: 'healthy' }));
    setAlgoStep(10, 'done');

    // Done
    setAlgoStep(11, 'active');
    await wait(500);
    setAlgoStep(11, 'done');
    setPhase('done');
  }, [wait, computeEdges]);

  const togglePause = () => { pauseRef.current = !pauseRef.current; setPaused(p => !p); };
  const reset = () => {
    cancelRef.current = true;
    setPhase('idle');
    setPaused(false);
    pauseRef.current = false;
    setYamlVisible(0);
    setNodeStates({});
    setAlgoStepStates(ALGO_STEPS.map(() => 'pending'));
    setQueueItems([]);
  };

  const renderYamlLine = (line, idx) => {
    if (idx >= yamlVisible) return null;
    if (!line.text) return <span key={idx} className="yaml-line">&nbsp;</span>;
    if (line.text.startsWith('#')) {
      return <span key={idx} className="yaml-line"><span className="comment">{line.text}</span></span>;
    }
    if (line.dep) {
      return <span key={idx} className={`yaml-line ${line.highlight ? 'highlight' : ''}`}>
        <span className="str">{line.text}</span>
      </span>;
    }
    if (line.key) {
      const parts = line.text.split(':');
      const keyPart = parts[0] + ':';
      const valPart = parts.slice(1).join(':');
      return <span key={idx} className={`yaml-line ${line.highlight ? 'highlight' : ''}`}>
        <span className="key">{keyPart}</span>
        {valPart && <span className={line.val?.startsWith('"') ? 'str' : line.val && !isNaN(line.val) ? 'num' : ''}>{valPart}</span>}
      </span>;
    }
    return <span key={idx} className="yaml-line">{line.text}</span>;
  };

  return (
    <section className="section yaml-dag-section" id="yaml-dag">
      <motion.div className="section-badge" initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        03 — FROM CONFIG TO EXECUTION
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
        YAML → DAG → Kahn's Algorithm
      </motion.h2>
      <motion.p className="section-sub" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
        Watch how Cortex reads your <code style={{color:'#c084fc'}}>robot.yaml</code> config, builds a
        Directed Acyclic Graph of dependencies, then runs <strong>Kahn's topological sort</strong> to
        compute the mathematically optimal startup order.
      </motion.p>

      <motion.div className="yaml-dag-stage" ref={stageRef} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
        {/* Column 1: YAML */}
        <div className="yaml-col">
          <div className="yaml-col-header">
            <span className="dot r" /><span className="dot y" /><span className="dot g" />
            <span className="yaml-col-filename">robot.yaml</span>
          </div>
          <div className="yaml-content">
            {YAML_LINES.map((line, i) => renderYamlLine(line, i))}
          </div>
        </div>

        {/* Column 2: DAG */}
        <div className="dag-col">
          <div className="dag-col-header">Dependency Graph</div>
          <div className="dag-canvas">
            <svg>
              {edgeLines.map((line, i) => {
                const fromState = nodeStates[line.from];
                const active = fromState === 'healthy';
                return <line key={i} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                  stroke={active ? '#4ade80' : fromState ? '#6366f1' : '#1e1b3a'}
                  strokeWidth={active ? 2 : 1.5}
                  strokeDasharray={active ? 'none' : '5 3'}
                  style={{ transition: 'all 0.5s' }}
                />;
              })}
            </svg>
            <div className="dag-nodes-container">
              {DAG_LAYERS.map((layer, li) => (
                <div key={li} className="dag-layer-row">
                  {layer.map(node => (
                    <motion.div
                      key={node.id}
                      ref={el => { nodeRefs.current[node.id] = el; }}
                      className={`dag-node-v2 ${nodeStates[node.id] || 'pending'}`}
                      animate={nodeStates[node.id] === 'starting' ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 0.6, repeat: nodeStates[node.id] === 'starting' ? Infinity : 0 }}
                    >
                      <span className="dag-node-icon">{node.icon}</span>
                      <span className="dag-node-label">{node.name}</span>
                      <span className="dag-node-indegree">in-degree: {node.indegree}</span>
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 3: Algorithm Steps */}
        <div className="algo-col">
          <div className="algo-col-header">Kahn's Algorithm</div>
          <div className="algo-steps">
            {ALGO_STEPS.map((step, i) => (
              <motion.div
                key={i}
                className={`algo-step ${algoStepStates[i]}`}
                animate={algoStepStates[i] === 'active' ? { x: [0, 2, 0] } : {}}
                transition={{ duration: 0.3 }}
              >
                <span className="algo-step-num">{i + 1}</span>
                {step}
              </motion.div>
            ))}
          </div>
          <div className="algo-queue">
            <div className="algo-queue-label">Ready Queue</div>
            <div className="algo-queue-items">
              {queueItems.length > 0 ? queueItems.map(q => (
                <span key={q.id} className={`algo-queue-item ${q.state}`}>{q.id}</span>
              )) : <span style={{ color: '#374151', fontSize: '0.58rem' }}>empty</span>}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Controls */}
      <div className="controls" style={{ marginTop: 20 }}>
        <button className="btn btn-primary" onClick={run} disabled={phase === 'running'}>
          <Play size={14} /> Run Algorithm
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
