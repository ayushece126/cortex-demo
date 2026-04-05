import { useState, useCallback, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Text, RoundedBox, Edges } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radar, Camera, Brain, Navigation, Cog, Gauge, Shield, Cpu,
  Zap, RotateCcw, Play
} from 'lucide-react';
import * as THREE from 'three';
import './RobotVisualizer.css';

/* ── Services mapped to 3D positions on the robot ── */
const ROBOT_SERVICES = [
  { id: 'lidar',      name: 'LIDAR Sensor',   icon: Radar,      pos: [0, 2.2, 0],    color: '#6366f1', desc: 'Spinning laser scanner on top' },
  { id: 'front_cam',  name: 'Front Camera',   icon: Camera,     pos: [0, 0.8, 1.6],   color: '#818cf8', desc: 'Forward-facing vision' },
  { id: 'rear_cam',   name: 'Rear Camera',    icon: Camera,     pos: [0, 0.8, -1.6],  color: '#a78bfa', desc: 'Rearward-facing vision' },
  { id: 'imu',        name: 'IMU Sensor',     icon: Gauge,      pos: [0, 0.2, 0],     color: '#c084fc', desc: 'Inertial measurement unit' },
  { id: 'perception', name: 'Perception AI',  icon: Brain,      pos: [1.2, 1.2, 0],   color: '#f472b6', desc: 'Object detection neural net' },
  { id: 'navigation', name: 'Navigation',     icon: Navigation, pos: [-1.2, 1.2, 0],  color: '#34d399', desc: 'Path planning engine' },
  { id: 'motor',      name: 'Motor Control',  icon: Cog,        pos: [0, -0.6, 0],    color: '#fbbf24', desc: 'Drive system controller' },
  { id: 'safety',     name: 'Safety System',  icon: Shield,     pos: [0, 1.6, 0],     color: '#f87171', desc: 'Emergency stop guardian' },
];

/* ── 3D Sensor Component ── */
function SensorNode({ position, color, status, label }) {
  const meshRef = useRef();
  const glowRef = useRef();
  const baseColor = useMemo(() => new THREE.Color(color), [color]);

  const statusColor = useMemo(() => {
    if (status === 'healthy') return new THREE.Color('#4ade80');
    if (status === 'failed') return new THREE.Color('#f87171');
    if (status === 'restarting') return new THREE.Color('#60a5fa');
    return new THREE.Color('#374151');
  }, [status]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    if (status === 'healthy') {
      meshRef.current.material.emissiveIntensity = 0.3 + Math.sin(t * 2) * 0.15;
      if (glowRef.current) glowRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.1);
    } else if (status === 'failed') {
      meshRef.current.material.emissiveIntensity = 0.2 + Math.sin(t * 8) * 0.4;
      meshRef.current.rotation.z = Math.sin(t * 15) * 0.05;
      if (glowRef.current) glowRef.current.scale.setScalar(1 + Math.sin(t * 4) * 0.3);
    } else if (status === 'restarting') {
      meshRef.current.material.emissiveIntensity = 0.2 + Math.sin(t * 4) * 0.2;
      meshRef.current.rotation.y = t * 2;
    } else {
      meshRef.current.material.emissiveIntensity = 0.05;
    }
  });

  return (
    <group position={position}>
      <Float speed={status === 'healthy' ? 2 : 0} rotationIntensity={0} floatIntensity={status === 'healthy' ? 0.15 : 0}>
        <RoundedBox ref={meshRef} args={[0.5, 0.5, 0.5]} radius={0.08} smoothness={4}>
          <meshStandardMaterial
            color={statusColor}
            emissive={statusColor}
            emissiveIntensity={0.3}
            metalness={0.6}
            roughness={0.3}
          />
        </RoundedBox>

        {/* Glow sphere */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshBasicMaterial
            color={statusColor}
            transparent
            opacity={status === 'failed' ? 0.15 : status === 'healthy' ? 0.06 : 0.02}
          />
        </mesh>

        {/* Label */}
        <Text
          position={[0, -0.45, 0]}
          fontSize={0.14}
          color={status === 'idle' ? '#4b5563' : '#e0e6f0'}
          anchorX="center"
          anchorY="top"
        >
          {label}
        </Text>
      </Float>

      {/* Connection line to center */}
      {position[0] !== 0 || position[2] !== 0 ? (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([0, 0, 0, -position[0], -position[1] + 0.8, -position[2]])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color={status === 'healthy' ? '#4ade80' : status === 'failed' ? '#f87171' : '#1e1b3a'} transparent opacity={0.3} />
        </line>
      ) : null}
    </group>
  );
}

/* ── Robot Body — Holographic Wireframe ── */
function RobotBody() {
  const bodyRef = useRef();
  const pulseRef = useRef();

  useFrame(({ clock }) => {
    if (bodyRef.current) {
      bodyRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.3) * 0.05;
    }
    if (pulseRef.current) {
      pulseRef.current.material.opacity = 0.4 + Math.sin(clock.getElapsedTime() * 2) * 0.2;
      pulseRef.current.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 2) * 0.08);
    }
  });

  return (
    <group ref={bodyRef}>
      {/* Main chassis — transparent with glowing edges */}
      <RoundedBox args={[2.4, 0.6, 3.2]} radius={0.15} smoothness={4} position={[0, 0.3, 0]}>
        <meshStandardMaterial
          color="#1e1b3a"
          transparent
          opacity={0.08}
          metalness={0.9}
          roughness={0.1}
          emissive="#6366f1"
          emissiveIntensity={0.15}
        />
        <Edges threshold={15} color="#6366f1" linewidth={1} />
      </RoundedBox>

      {/* Top platform — transparent with edges */}
      <RoundedBox args={[1.8, 0.3, 2.4]} radius={0.1} smoothness={4} position={[0, 0.8, 0]}>
        <meshStandardMaterial
          color="#252240"
          transparent
          opacity={0.06}
          metalness={0.9}
          roughness={0.1}
          emissive="#818cf8"
          emissiveIntensity={0.1}
        />
        <Edges threshold={15} color="#818cf8" linewidth={1} />
      </RoundedBox>

      {/* Wheels — slightly transparent with glow */}
      {[[-1.1, -0.1, 1.2], [1.1, -0.1, 1.2], [-1.1, -0.1, -1.2], [1.1, -0.1, -1.2]].map((pos, i) => (
        <mesh key={i} position={pos} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
          <meshStandardMaterial
            color="#4ade80"
            transparent
            opacity={0.15}
            emissive="#4ade80"
            emissiveIntensity={0.3}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      ))}

      {/* Central processing core — pulsing glow */}
      <mesh ref={pulseRef} position={[0, 1.0, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.5} />
      </mesh>
      {/* Processing core outer ring */}
      <mesh position={[0, 1.0, 0]}>
        <torusGeometry args={[0.35, 0.02, 8, 32]} />
        <meshBasicMaterial color="#a5b4fc" transparent opacity={0.4} />
      </mesh>

      {/* Scanline bands across chassis */}
      {[-0.8, 0, 0.8].map((z, i) => (
        <mesh key={`scan-${i}`} position={[0, 0.61, z]}>
          <boxGeometry args={[2.3, 0.01, 0.02]} />
          <meshBasicMaterial color="#4ade80" transparent opacity={0.25} />
        </mesh>
      ))}
    </group>
  );
}

/* ── Main Component ── */
export default function RobotVisualizer() {
  const [serviceStates, setServiceStates] = useState(
    Object.fromEntries(ROBOT_SERVICES.map(s => [s.id, 'idle']))
  );
  const [phase, setPhase] = useState('idle');
  const [alert, setAlert] = useState(null);
  const cancelRef = useRef(false);

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  const updateService = useCallback((id, status) => {
    setServiceStates(prev => ({ ...prev, [id]: status }));
  }, []);

  const bootRobot = useCallback(async () => {
    cancelRef.current = false;
    setPhase('booting');
    setAlert({ type: 'info', text: '🔄 Cortex initializing robot systems...' });

    const bootOrder = ['imu', 'lidar', 'front_cam', 'rear_cam', 'perception', 'navigation', 'motor', 'safety'];
    for (const id of bootOrder) {
      if (cancelRef.current) return;
      updateService(id, 'healthy');
      await wait(400);
    }

    setAlert({ type: 'success', text: '✅ All 8 subsystems online. Robot operational.' });
    setPhase('running');
  }, [updateService]);

  const crashAndHeal = useCallback(async () => {
    if (phase !== 'running') return;
    cancelRef.current = false;
    setPhase('chaos');

    // Crash LIDAR
    setAlert({ type: 'danger', text: '⚡ LIDAR hardware fault detected!' });
    updateService('lidar', 'failed');
    await wait(800);

    // Cortex halts dependents
    setAlert({ type: 'danger', text: '🛡️ Cortex isolating failure — halting Perception, Navigation...' });
    updateService('perception', 'failed');
    await wait(300);
    updateService('navigation', 'failed');
    await wait(300);
    updateService('motor', 'failed');
    await wait(500);

    // Wait for dramatic effect
    setAlert({ type: 'info', text: '🔄 Cortex initiating auto-recovery protocol...' });
    await wait(1200);

    // Restart LIDAR
    updateService('lidar', 'restarting');
    await wait(800);
    updateService('lidar', 'healthy');
    setAlert({ type: 'info', text: '✓ LIDAR recovered — restarting dependent systems...' });
    await wait(500);

    // Restart dependents in order
    updateService('perception', 'restarting');
    await wait(400);
    updateService('perception', 'healthy');
    updateService('navigation', 'restarting');
    await wait(400);
    updateService('navigation', 'healthy');
    updateService('motor', 'restarting');
    await wait(400);
    updateService('motor', 'healthy');

    setAlert({ type: 'success', text: '✅ Full recovery! All systems operational. Total downtime: 4.2s' });
    setPhase('running');
  }, [phase, updateService]);

  const reset = useCallback(() => {
    cancelRef.current = true;
    setPhase('idle');
    setServiceStates(Object.fromEntries(ROBOT_SERVICES.map(s => [s.id, 'idle'])));
    setAlert(null);
  }, []);

  return (
    <section className="section robot-section" id="robot-3d">
      <motion.div className="section-badge" initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        02 — HARDWARE MAPPING
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
        A Robot's Nervous System
      </motion.h2>
      <motion.p className="section-sub" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
        Each glowing cube represents a real hardware sensor or software module running on
        the robot. Watch how Cortex boots them in order, monitors their health, and
        surgically handles failures — keeping the robot safe at all times.
      </motion.p>

      <motion.div className="robot-stage" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
        {/* 3D Scene */}
        <div className="robot-canvas">
          <Canvas camera={{ position: [5, 4, 5], fov: 45 }}>
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={0.6} color="#e0e6f0" />
            <pointLight position={[-5, 5, -5]} intensity={0.3} color="#6366f1" />
            <spotLight position={[0, 8, 0]} intensity={0.5} angle={0.6} penumbra={0.5} color="#4ade80" />

            <Suspense fallback={null}>
              <RobotBody />
              {ROBOT_SERVICES.map(svc => (
                <SensorNode
                  key={svc.id}
                  position={svc.pos}
                  color={svc.color}
                  status={serviceStates[svc.id]}
                  label={svc.name}
                />
              ))}
            </Suspense>

            <OrbitControls
              enablePan={false}
              minDistance={4}
              maxDistance={12}
              autoRotate
              autoRotateSpeed={0.5}
            />

            {/* Grid floor */}
            <gridHelper args={[20, 40, '#1e1b3a', '#0f0d20']} position={[0, -0.5, 0]} />
          </Canvas>
        </div>

        {/* Status Panel */}
        <div className="robot-panel">
          {ROBOT_SERVICES.map(svc => {
            const Icon = svc.icon;
            const status = serviceStates[svc.id];
            return (
              <motion.div
                key={svc.id}
                className={`robot-svc ${status}`}
                layout
                animate={{
                  scale: status === 'failed' ? [1, 1.02, 1] : 1,
                }}
                transition={{ duration: 0.8, repeat: status === 'failed' ? Infinity : 0 }}
              >
                <div className="robot-svc-dot" />
                <Icon className="robot-svc-icon" size={18} />
                <div className="robot-svc-info">
                  <div className="robot-svc-name">{svc.name}</div>
                  <div className="robot-svc-status">{status}</div>
                </div>
              </motion.div>
            );
          })}

          <AnimatePresence>
            {alert && (
              <motion.div
                className={`robot-alert ${alert.type}`}
                key={alert.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {alert.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Controls */}
      <div className="robot-controls">
        <button className="btn btn-primary" onClick={bootRobot} disabled={phase !== 'idle'}>
          <Play size={14} /> Boot Robot
        </button>
        <button className="btn btn-danger" onClick={crashAndHeal} disabled={phase !== 'running'}>
          <Zap size={14} /> Simulate Failure
        </button>
        <button className="btn btn-ghost" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </section>
  );
}
