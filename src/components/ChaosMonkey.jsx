import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Radio, Camera, Cpu, Navigation, Gauge, Eye, MapPin,
  Layers, Box, Route, Brain, Shield, Radar, TriangleAlert,
  Cog, CircleDot, Crosshair, ScanLine, ActivitySquare, Waypoints,
  MonitorSpeaker, Wifi, RefreshCw
} from 'lucide-react';
import './ChaosMonkey.css';

/* ── Autonomous Vehicle Service Definitions (32 nodes) ── */
const ICON_MAP = {
  front_lidar: Radar, rear_lidar: Radar, left_camera: Camera, right_camera: Camera,
  stereo_camera: Eye, imu_sensor: Gauge, gps_receiver: MapPin, wheel_encoder: Cog,
  lidar_fusion: Layers, camera_stitcher: ScanLine, inertial_nav: Navigation, odometry: CircleDot,
  point_cloud: Cpu, object_detector: Box, lane_detector: Route, traffic_sign: TriangleAlert,
  depth_estimator: Crosshair, semantic_seg: Brain,
  sensor_fusion: ActivitySquare, hd_map_loc: MapPin, slam_engine: Waypoints,
  route_planner: Route, behavior_planner: Brain, motion_planner: Navigation, trajectory_opt: Crosshair,
  steering_ctrl: Cog, throttle_ctrl: Gauge, brake_ctrl: Shield,
  collision_avoid: Shield, emergency_brake: Zap,
  telemetry: MonitorSpeaker, v2x_comm: Wifi,
};

const SERVICES = [
  // Layer 0: Hardware (y=0)
  { id: 'front_lidar',    label: 'Front LIDAR',       layer: 'Hardware',    x: 0,   y: 0,   deps: [] },
  { id: 'rear_lidar',     label: 'Rear LIDAR',        layer: 'Hardware',    x: 160, y: 0,   deps: [] },
  { id: 'left_camera',    label: 'Left Camera',       layer: 'Hardware',    x: 320, y: 0,   deps: [] },
  { id: 'right_camera',   label: 'Right Camera',      layer: 'Hardware',    x: 480, y: 0,   deps: [] },
  { id: 'stereo_camera',  label: 'Stereo Camera',     layer: 'Hardware',    x: 640, y: 0,   deps: [] },
  { id: 'imu_sensor',     label: 'IMU Sensor',        layer: 'Hardware',    x: 800, y: 0,   deps: [] },
  { id: 'gps_receiver',   label: 'GPS Receiver',      layer: 'Hardware',    x: 960, y: 0,   deps: [] },
  { id: 'wheel_encoder',  label: 'Wheel Encoder',     layer: 'Hardware',    x: 1120,y: 0,   deps: [] },
  // Layer 1: HAL (y=110)
  { id: 'lidar_fusion',   label: 'LIDAR Fusion',      layer: 'HAL',         x: 80,  y: 110, deps: ['front_lidar','rear_lidar'] },
  { id: 'camera_stitcher',label: 'Camera Stitcher',   layer: 'HAL',         x: 400, y: 110, deps: ['left_camera','right_camera','stereo_camera'] },
  { id: 'inertial_nav',   label: 'Inertial Nav',      layer: 'HAL',         x: 720, y: 110, deps: ['imu_sensor'] },
  { id: 'odometry',       label: 'Odometry',           layer: 'HAL',         x: 1040,y: 110, deps: ['wheel_encoder'] },
  // Layer 2: Perception (y=220)
  { id: 'point_cloud',    label: 'Point Cloud',       layer: 'Perception',  x: 0,   y: 220, deps: ['lidar_fusion'] },
  { id: 'object_detector',label: 'Object Detector',   layer: 'Perception',  x: 200, y: 220, deps: ['camera_stitcher','lidar_fusion'] },
  { id: 'lane_detector',  label: 'Lane Detector',     layer: 'Perception',  x: 400, y: 220, deps: ['camera_stitcher'] },
  { id: 'traffic_sign',   label: 'Traffic Signs',     layer: 'Perception',  x: 600, y: 220, deps: ['camera_stitcher'] },
  { id: 'depth_estimator',label: 'Depth Estimator',   layer: 'Perception',  x: 800, y: 220, deps: ['camera_stitcher','lidar_fusion'] },
  { id: 'semantic_seg',   label: 'Semantic Seg',      layer: 'Perception',  x: 1000,y: 220, deps: ['camera_stitcher'] },
  // Layer 3: Fusion (y=330)
  { id: 'sensor_fusion',  label: 'Sensor Fusion',     layer: 'Fusion',      x: 200, y: 330, deps: ['point_cloud','object_detector','depth_estimator','inertial_nav','odometry'] },
  { id: 'hd_map_loc',     label: 'HD Map Loc',        layer: 'Fusion',      x: 560, y: 330, deps: ['point_cloud','lane_detector','inertial_nav'] },
  { id: 'slam_engine',    label: 'SLAM Engine',       layer: 'Fusion',      x: 900, y: 330, deps: ['lidar_fusion','inertial_nav','odometry'] },
  // Layer 4: Planning (y=440)
  { id: 'route_planner',  label: 'Route Planner',     layer: 'Planning',    x: 120, y: 440, deps: ['hd_map_loc'] },
  { id: 'behavior_planner',label:'Behavior Planner',  layer: 'Planning',    x: 400, y: 440, deps: ['sensor_fusion','hd_map_loc','traffic_sign','lane_detector'] },
  { id: 'motion_planner', label: 'Motion Planner',    layer: 'Planning',    x: 700, y: 440, deps: ['behavior_planner','sensor_fusion','slam_engine'] },
  { id: 'trajectory_opt', label: 'Trajectory Opt',    layer: 'Planning',    x: 1000,y: 440, deps: ['motion_planner'] },
  // Layer 5: Control (y=550)
  { id: 'steering_ctrl',  label: 'Steering Ctrl',     layer: 'Control',     x: 260, y: 550, deps: ['trajectory_opt'] },
  { id: 'throttle_ctrl',  label: 'Throttle Ctrl',     layer: 'Control',     x: 560, y: 550, deps: ['trajectory_opt'] },
  { id: 'brake_ctrl',     label: 'Brake Ctrl',        layer: 'Control',     x: 860, y: 550, deps: ['trajectory_opt','collision_avoid'] },
  // Layer 6: Safety (y=660)
  { id: 'collision_avoid',label: 'Collision Avoid',   layer: 'Safety',      x: 400, y: 660, deps: ['sensor_fusion','object_detector'] },
  { id: 'emergency_brake',label: 'Emergency Brake',   layer: 'Safety',      x: 750, y: 660, deps: ['collision_avoid'] },
  // Layer 7: System (y=770)
  { id: 'telemetry',      label: 'Telemetry',         layer: 'System',      x: 300, y: 770, deps: ['sensor_fusion'] },
  { id: 'v2x_comm',       label: 'V2X Comms',         layer: 'System',      x: 700, y: 770, deps: ['hd_map_loc','route_planner'] },
];

/* ── Custom Node Component ── */
function ChaosNodeComponent({ data }) {
  const IconComp = ICON_MAP[data.serviceId] || Cpu;
  const status = data.status || 'idle';
  return (
    <div className={`chaos-node status-${status}`}>
      <Handle type="target" position={Position.Top} style={{ background: '#374151', border: '1px solid #4b5563', width: 6, height: 6 }} />
      <IconComp className="chaos-node-icon" size={16} />
      <div className="chaos-node-header">
        <div className="chaos-node-dot" />
        <div className="chaos-node-name">{data.label}</div>
      </div>
      <div className="chaos-node-layer">{data.layer}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#374151', border: '1px solid #4b5563', width: 6, height: 6 }} />
    </div>
  );
}

const nodeTypes = { chaosNode: ChaosNodeComponent };

/* ── Build ReactFlow nodes & edges ── */
function buildInitialNodes() {
  return SERVICES.map(s => ({
    id: s.id,
    type: 'chaosNode',
    position: { x: s.x, y: s.y },
    data: { label: s.label, layer: s.layer, serviceId: s.id, status: 'idle' },
  }));
}

function buildEdges() {
  const edges = [];
  for (const s of SERVICES) {
    for (const dep of s.deps) {
      edges.push({
        id: `${dep}->${s.id}`,
        source: dep,
        target: s.id,
        animated: false,
        style: { stroke: '#312e5a', strokeWidth: 1.2 },
      });
    }
  }
  return edges;
}

/* ── Dependency helpers ── */
function getDependentsOf(serviceId) {
  const result = new Set();
  const queue = [serviceId];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const s of SERVICES) {
      if (s.deps.includes(current) && !result.has(s.id)) {
        result.add(s.id);
        queue.push(s.id);
      }
    }
  }
  return result;
}

/* ── Main Component ── */
export default function ChaosMonkey() {
  const [nodes, setNodes, onNodesChange] = useNodesState(buildInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildEdges());
  const [phase, setPhase] = useState('idle'); // idle | booting | running | chaos | healing | done
  const [logs, setLogs] = useState([]);
  const [speed, setSpeed] = useState(1);
  const cancelRef = useRef(false);
  const logEndRef = useRef(null);
  const logContainerRef = useRef(null);

  // Stats
  const stats = useMemo(() => {
    const counts = { running: 0, crashed: 0, halted: 0, restarting: 0, recovered: 0, idle: 0 };
    nodes.forEach(n => { counts[n.data.status] = (counts[n.data.status] || 0) + 1; });
    return counts;
  }, [nodes]);

  // Auto-scroll logs without jumping the whole page
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = useCallback((msg, type = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev.slice(-80), { time, msg, type }]);
  }, []);

  const updateNodeStatus = useCallback((id, status) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, status } } : n));
  }, [setNodes]);

  const updateEdgeStyle = useCallback((sourceId, targetId, color, animated) => {
    setEdges(eds => eds.map(e => {
      if (e.source === sourceId && e.target === targetId) {
        return { ...e, animated, style: { ...e.style, stroke: color, strokeWidth: animated ? 2 : 1.2 } };
      }
      return e;
    }));
  }, [setEdges]);

  const wait = useCallback((ms) => new Promise(resolve => {
    setTimeout(resolve, ms / speed);
  }), [speed]);

  /* ── Boot Sequence ── */
  const bootSystem = useCallback(async () => {
    cancelRef.current = false;
    setPhase('booting');
    setLogs([]);
    addLog('Cortex daemon initializing...', 'info');
    addLog('Building dependency graph for 32 services...', 'info');
    await wait(600);
    addLog('✓ DAG validated — no circular dependencies', 'info');
    await wait(400);
    addLog('Topological sort complete. Starting services in order...', 'info');
    await wait(300);

    // Boot layer by layer
    const layers = ['Hardware', 'HAL', 'Perception', 'Fusion', 'Planning', 'Control', 'Safety', 'System'];
    for (const layer of layers) {
      if (cancelRef.current) return;
      const layerServices = SERVICES.filter(s => s.layer === layer);
      addLog(`Starting ${layer} layer (${layerServices.length} services)...`, 'info');

      // Start all in this layer concurrently
      for (const s of layerServices) {
        updateNodeStatus(s.id, 'running');
        // Light up incoming edges
        for (const dep of s.deps) {
          updateEdgeStyle(dep, s.id, '#4ade80', true);
        }
      }
      await wait(350);
      for (const s of layerServices) {
        addLog(`  ✓ ${s.label} online`, 'recover');
      }
      await wait(200);
    }

    addLog('All 32 services running. System operational.', 'recover');
    setPhase('running');
  }, [addLog, updateNodeStatus, updateEdgeStyle, wait]);

  /* ── Chaos Sequence ── */
  const unleashChaos = useCallback(async () => {
    if (phase !== 'running') return;
    cancelRef.current = false;
    setPhase('chaos');

    // Pick 3-5 random root-ish services to crash
    const crashCandidates = ['front_lidar', 'left_camera', 'imu_sensor', 'stereo_camera', 'gps_receiver', 'wheel_encoder', 'rear_lidar', 'right_camera'];
    const shuffled = [...crashCandidates].sort(() => Math.random() - 0.5);
    const crashTargets = shuffled.slice(0, 3 + Math.floor(Math.random() * 3)); // 3-5 crashes

    addLog('⚡ CHAOS INJECTED — Random failures incoming!', 'fail');
    await wait(500);

    const allHalted = new Set();

    // Crash services one by one with dramatic timing
    for (let i = 0; i < crashTargets.length; i++) {
      if (cancelRef.current) return;
      const target = crashTargets[i];
      const svc = SERVICES.find(s => s.id === target);

      // CRASH!
      addLog(`✖ ${svc.label} CRASHED — hardware fault detected`, 'fail');
      updateNodeStatus(target, 'crashed');

      // Flash edges red
      for (const s of SERVICES) {
        if (s.deps.includes(target)) {
          updateEdgeStyle(target, s.id, '#f87171', true);
        }
      }

      await wait(300);

      // Cortex detects and halts dependents
      const dependents = getDependentsOf(target);
      if (dependents.size > 0) {
        addLog(`⚠ Cortex detected failure cascade from ${svc.label} — halting ${dependents.size} dependent services`, 'halt');

        for (const depId of dependents) {
          if (cancelRef.current) return;
          if (!crashTargets.includes(depId) && !allHalted.has(depId)) {
            const depSvc = SERVICES.find(s => s.id === depId);
            updateNodeStatus(depId, 'halted');
            allHalted.add(depId);
            addLog(`  ⏸ ${depSvc.label} safely halted`, 'halt');

            // Update edges to yellow
            for (const dep of depSvc.deps) {
              updateEdgeStyle(dep, depId, '#fbbf24', false);
            }
          }
          await wait(80);
        }
      }

      await wait(600);
    }

    addLog(`Damage assessment: ${crashTargets.length} crashed, ${allHalted.size} halted, ${32 - crashTargets.length - allHalted.size} unaffected`, 'info');
    await wait(800);

    // ── HEALING PHASE ──
    setPhase('healing');
    addLog('🔄 Cortex initiating auto-recovery protocol...', 'restart');
    await wait(600);

    // Restart crashed services
    for (const target of crashTargets) {
      if (cancelRef.current) return;
      const svc = SERVICES.find(s => s.id === target);
      addLog(`↻ Restarting ${svc.label}...`, 'restart');
      updateNodeStatus(target, 'restarting');
      await wait(800);
      updateNodeStatus(target, 'recovered');
      addLog(`✓ ${svc.label} recovered and healthy`, 'recover');

      // Restore edges
      for (const s of SERVICES) {
        if (s.deps.includes(target)) {
          updateEdgeStyle(target, s.id, '#34d399', true);
        }
      }
      await wait(300);
    }

    await wait(400);
    addLog('Restarting halted dependent services in DAG order...', 'restart');
    await wait(300);

    // Restart halted services in dependency order
    const haltedArray = [...allHalted];
    const ordered = SERVICES.filter(s => haltedArray.includes(s.id));

    for (const svc of ordered) {
      if (cancelRef.current) return;
      updateNodeStatus(svc.id, 'restarting');
      addLog(`↻ Restarting ${svc.label}...`, 'restart');
      await wait(200);
      updateNodeStatus(svc.id, 'recovered');

      // Restore edges
      for (const dep of svc.deps) {
        updateEdgeStyle(dep, svc.id, '#34d399', true);
      }
      await wait(100);
    }

    await wait(500);
    addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
    addLog('✅ FULL RECOVERY COMPLETE — All 32 services operational', 'recover');
    addLog(`Total downtime: ${((crashTargets.length * 1.1 + ordered.length * 0.3) / speed).toFixed(1)}s — Zero data loss`, 'recover');
    addLog('Cortex maintained system integrity throughout the entire event.', 'info');
    setPhase('done');
  }, [phase, addLog, updateNodeStatus, updateEdgeStyle, wait, speed]);

  /* ── Reset ── */
  const reset = useCallback(() => {
    cancelRef.current = true;
    setPhase('idle');
    setLogs([]);
    setNodes(buildInitialNodes());
    setEdges(buildEdges());
  }, [setNodes, setEdges]);

  const minimapColor = useCallback((node) => {
    const s = node.data?.status;
    if (s === 'running' || s === 'recovered') return '#4ade80';
    if (s === 'crashed') return '#f87171';
    if (s === 'halted') return '#fbbf24';
    if (s === 'restarting') return '#60a5fa';
    return '#312e5a';
  }, []);

  return (
    <section className="section chaos-section" id="chaos-test">
      <motion.div className="section-badge" initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        04 — STRESS TEST
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
        Chaos Engineering at Scale
      </motion.h2>
      <motion.p className="section-sub" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
        32 services. Unpredictable failures. Watch Cortex's nervous system detect, isolate,
        and self-heal in real-time — preserving every unaffected subsystem.
      </motion.p>

      {/* Stats Bar */}
      <motion.div className="chaos-stats" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
        <div className="chaos-stat"><div className="chaos-stat-dot green" /><span className="chaos-stat-count">{stats.running + stats.recovered}</span><span className="chaos-stat-label">Healthy</span></div>
        <div className="chaos-stat"><div className="chaos-stat-dot red" /><span className="chaos-stat-count">{stats.crashed}</span><span className="chaos-stat-label">Crashed</span></div>
        <div className="chaos-stat"><div className="chaos-stat-dot yellow" /><span className="chaos-stat-count">{stats.halted}</span><span className="chaos-stat-label">Halted</span></div>
        <div className="chaos-stat"><div className="chaos-stat-dot blue" /><span className="chaos-stat-count">{stats.restarting}</span><span className="chaos-stat-label">Restarting</span></div>
        <div className="chaos-stat"><div className="chaos-stat-dot teal" /><span className="chaos-stat-count">{stats.recovered}</span><span className="chaos-stat-label">Recovered</span></div>
      </motion.div>

      {/* ReactFlow DAG */}
      <motion.div className="chaos-stage" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
        <div className={`chaos-overlay ${phase === 'chaos' ? 'active' : ''}`} />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.3}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
        >
          <Background color="#1e1b3a" gap={24} size={1} />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={minimapColor}
            maskColor="rgba(6,8,15,0.7)"
            style={{ width: 160, height: 100 }}
          />
        </ReactFlow>
      </motion.div>

      {/* Controls */}
      <div className="chaos-controls">
        <button
          className="group relative inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-semibold text-sm tracking-wide text-white overflow-hidden transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none hover:translate-y-[-2px] hover:shadow-[0_8px_40px_rgba(99,102,241,0.4)]"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #4f46e5, #4338ca)',
            boxShadow: '0 4px 25px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
          onClick={bootSystem}
          disabled={phase !== 'idle'}
        >
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Cpu size={16} className="relative z-10" />
          <span className="relative z-10">Initialize System</span>
        </button>

        <button
          className={`group relative inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-bold text-sm tracking-[1.5px] uppercase text-white overflow-hidden transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none hover:translate-y-[-2px] ${phase === 'chaos' ? 'animate-pulse' : ''}`}
          style={{
            background: phase === 'running' ? 'linear-gradient(135deg, #ef4444, #dc2626, #b91c1c)' : 'linear-gradient(135deg, #7f1d1d, #991b1b, #7f1d1d)',
            boxShadow: phase === 'running' ? '0 4px 30px rgba(239,68,68,0.35), inset 0 1px 0 rgba(255,255,255,0.1)' : '0 2px 10px rgba(0,0,0,0.3)',
          }}
          onClick={unleashChaos}
          disabled={phase !== 'running'}
        >
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {phase === 'running' && (
            <span className="absolute inset-0 rounded-2xl border border-red-400/30 animate-ping opacity-20" />
          )}
          <Zap size={16} className="relative z-10" />
          <span className="relative z-10">Unleash Chaos</span>
        </button>

        <button
          className="group inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-indigo-300 border border-slate-700/40 bg-slate-800/40 hover:bg-indigo-500/10 hover:border-indigo-500/30 backdrop-blur-sm transition-all duration-200"
          onClick={reset}
        >
          <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
          <span>Reset</span>
        </button>

        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/30 backdrop-blur-sm">
          <span className="text-[0.65rem] text-slate-500 uppercase tracking-[1.5px] font-semibold">Speed</span>
          {[1, 2, 4].map(s => (
            <button
              key={s}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                speed === s
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                  : 'bg-transparent border-slate-700/30 text-slate-500 hover:text-slate-300 hover:bg-slate-700/30'
              }`}
              onClick={() => setSpeed(s)}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Event Log — always visible, fixed height to prevent layout shifts */}
      <div className="chaos-log" ref={logContainerRef} style={{ opacity: logs.length > 0 ? 1 : 0.3 }}>
        {logs.length > 0 ? (
          logs.map((log, i) => (
            <div key={i} className="chaos-log-entry">
              <span className="chaos-log-time">{log.time}</span>
              <span className={`chaos-log-msg ${log.type}`}>{log.msg}</span>
            </div>
          ))
        ) : (
          <div className="chaos-log-entry">
            <span className="chaos-log-msg info">Event log will appear here when system initializes...</span>
          </div>
        )}
      </div>
    </section>
  );
}
