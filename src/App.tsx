import { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Cpu, 
  Database, 
  CheckCircle, 
  Clock, 
  Play, 
  Pause, 
  RefreshCw, 
  Trash2, 
  Download, 
  Terminal, 
  Server, 
  Zap, 
  Layers
} from 'lucide-react';

interface MetricSnapshot {
  time: string;
  cpu: number;
  memory: number;
  latency: number;
  rps: number;
}

interface LogEntry {
  id: string;
  time: string;
  type: 'info' | 'warn' | 'error';
  message: string;
}

const SERVER_NODES = [
  { id: 'us-east-apm-01', name: 'US East (Virginia)' },
  { id: 'us-west-apm-02', name: 'US West (Oregon)' },
  { id: 'eu-central-apm-01', name: 'EU Central (Frankfurt)' },
  { id: 'ap-south-apm-01', name: 'Asia Pacific (Mumbai)' }
];

export default function App() {
  // App States
  const [selectedNode, setSelectedNode] = useState(SERVER_NODES[0].id);
  const [isSimulating, setIsSimulating] = useState(true);
  const [loadLevel, setLoadLevel] = useState<number>(2); // 1 = Low, 2 = Medium, 3 = High, 4 = Critical
  const [autoScale, setAutoScale] = useState(true);
  
  // Real-time Metric States
  const [cpu, setCpu] = useState(24);
  const [memory, setMemory] = useState(4.8); // GB
  const maxMemory = 16.0; // GB
  const [latency, setLatency] = useState(128); // ms
  const [rps, setRps] = useState(450);
  const [errorRate, setErrorRate] = useState(0.04); // %

  // Historical state for charts
  const [history, setHistory] = useState<MetricSnapshot[]>([]);
  
  // Logs console state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Generate initial history
  useEffect(() => {
    const initialHistory: MetricSnapshot[] = [];
    const now = new Date();
    for (let i = 14; i >= 0; i--) {
      const timeStr = new Date(now.getTime() - i * 5000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      initialHistory.push({
        time: timeStr,
        cpu: Math.round(15 + Math.random() * 20),
        memory: parseFloat((4.0 + Math.random() * 1.5).toFixed(1)),
        latency: Math.round(100 + Math.random() * 50),
        rps: Math.round(300 + Math.random() * 100)
      });
    }
    setHistory(initialHistory);

    // Initial Logs
    setLogs([
      { id: '1', time: new Date(now.getTime() - 30000).toLocaleTimeString(), type: 'info', message: 'Hyperion APM Node initialization successful.' },
      { id: '2', time: new Date(now.getTime() - 25000).toLocaleTimeString(), type: 'info', message: `Connected to telemetry hub: node-agent@${selectedNode}` },
      { id: '3', time: new Date(now.getTime() - 20000).toLocaleTimeString(), type: 'info', message: 'Ready to receive traffic. Port 443 active.' },
      { id: '4', time: new Date().toLocaleTimeString(), type: 'info', message: 'Telemetry logging stream active.' }
    ]);
  }, []);

  // Log Auto Scroll
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Simulation engine
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      // Determine ranges based on load level
      let targetCpuMin = 10, targetCpuMax = 30;
      let targetRpsMin = 100, targetRpsMax = 300;
      let targetLatencyMin = 60, targetLatencyMax = 140;
      let targetErrorMin = 0.0, targetErrorMax = 0.5;

      switch(loadLevel) {
        case 1: // Low Load
          targetCpuMin = 8; targetCpuMax = 18;
          targetRpsMin = 80; targetRpsMax = 180;
          targetLatencyMin = 50; targetLatencyMax = 95;
          targetErrorMin = 0.0; targetErrorMax = 0.1;
          break;
        case 2: // Medium Load
          targetCpuMin = 20; targetCpuMax = 45;
          targetRpsMin = 350; targetRpsMax = 580;
          targetLatencyMin = 100; targetLatencyMax = 170;
          targetErrorMin = 0.01; targetErrorMax = 0.8;
          break;
        case 3: // High Load
          targetCpuMin = 60; targetCpuMax = 82;
          targetRpsMin = 800; targetRpsMax = 1200;
          targetLatencyMin = 240; targetLatencyMax = 480;
          targetErrorMin = 0.8; targetErrorMax = 3.2;
          break;
        case 4: // Critical Load
          targetCpuMin = 85; targetCpuMax = 99;
          targetRpsMin = 1800; targetRpsMax = 2600;
          targetLatencyMin = 650; targetLatencyMax = 1200;
          targetErrorMin = 3.5; targetErrorMax = 11.8;
          break;
      }

      // Calculate state changes
      const nextCpu = Math.round(targetCpuMin + Math.random() * (targetCpuMax - targetCpuMin));
      const nextRps = Math.round(targetRpsMin + Math.random() * (targetRpsMax - targetRpsMin));
      const nextLatency = Math.round(targetLatencyMin + Math.random() * (targetLatencyMax - targetLatencyMin));
      const nextError = parseFloat((targetErrorMin + Math.random() * (targetErrorMax - targetErrorMin)).toFixed(2));
      
      // Memory moves slowly towards targets
      let targetMem = 4.2 + (loadLevel * 1.8) + (nextCpu / 30);
      if (targetMem > maxMemory) targetMem = maxMemory - 0.5;
      const nextMemory = parseFloat((memory + (targetMem - memory) * 0.25).toFixed(2));

      setCpu(nextCpu);
      setRps(nextRps);
      setLatency(nextLatency);
      setErrorRate(nextError);
      setMemory(nextMemory);

      // Add to history
      setHistory(prev => {
        const updated = [...prev, { time: timestamp, cpu: nextCpu, memory: nextMemory, latency: nextLatency, rps: nextRps }];
        if (updated.length > 15) updated.shift();
        return updated;
      });

      // Periodic logs generator
      const rand = Math.random();
      if (rand > 0.4) {
        let logType: 'info' | 'warn' | 'error' = 'info';
        let message = '';

        if (loadLevel === 4) {
          if (rand > 0.75) {
            logType = 'error';
            message = `Critical alert: API throughput limits exceeded (RPS: ${nextRps}). Connections dropped.`;
          } else if (rand > 0.5) {
            logType = 'warn';
            message = `Database query latency spike detected. Avg latency: ${nextLatency}ms.`;
          } else {
            logType = 'info';
            message = `Garbage collection run forced automatically by scaling engine.`;
          }
        } else if (loadLevel === 3) {
          if (rand > 0.8) {
            logType = 'warn';
            message = `Node CPU load threshold exceeded. Current: ${nextCpu}%.`;
          } else {
            logType = 'info';
            message = `Completed sync cycle with gateway. Latency: ${nextLatency}ms.`;
          }
        } else {
          if (rand > 0.9) {
            logType = 'info';
            message = `Health check report sent to region controller: Code 200 OK.`;
          } else if (rand > 0.8) {
            logType = 'info';
            message = `Processed telemetry data batch. System healthy.`;
          }
        }

        if (message) {
          setLogs(prev => [...prev, {
            id: Date.now().toString(),
            time: new Date().toLocaleTimeString(),
            type: logType,
            message
          }]);
        }
      }

    }, 2000);

    return () => clearInterval(interval);
  }, [isSimulating, loadLevel, cpu, memory, latency, rps, errorRate]);

  // Actions
  const handleForceGC = () => {
    // Animate memory drop
    setMemory(prev => parseFloat(Math.max(3.2, prev - 1.8).toFixed(2)));
    setLogs(prev => [...prev, {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString(),
      type: 'info',
      message: 'Manual garbage collection initiated. Freed memory heap blocks.'
    }]);
  };

  const handleRestart = () => {
    setCpu(5);
    setMemory(3.0);
    setLatency(45);
    setRps(0);
    setErrorRate(0.0);
    setLogs(prev => [
      ...prev,
      { id: Date.now().toString(), time: new Date().toLocaleTimeString(), type: 'warn', message: 'Operator triggered container restart sequence.' },
      { id: (Date.now()+1).toString(), time: new Date().toLocaleTimeString(), type: 'info', message: 'Hyperion engine restarted. Loading libraries...' },
      { id: (Date.now()+2).toString(), time: new Date().toLocaleTimeString(), type: 'info', message: 'Config mapping reload OK. Reconnecting Telemetry API.' }
    ]);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      node: selectedNode,
      timestamp: new Date().toISOString(),
      currentMetrics: { cpu, memory, latency, rps, errorRate },
      history: history
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `apm_report_${selectedNode}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Status computation
  const getSystemStatus = () => {
    if (cpu > 90 || errorRate > 5) return { text: 'Critical', colorClass: 'badge-danger', indicator: 'danger' };
    if (cpu > 70 || errorRate > 1.5 || latency > 300) return { text: 'Degraded', colorClass: 'badge-warning', indicator: 'danger' };
    return { text: 'Healthy', colorClass: 'badge-success', indicator: 'success' };
  };

  const status = getSystemStatus();

  // SVG Chart path calculators
  const generateSvgPath = (dataKey: 'cpu' | 'memory' | 'latency' | 'rps', maxVal: number) => {
    if (history.length === 0) return '';
    const width = 280;
    const height = 60;
    const padding = 5;
    
    return history.map((snapshot, index) => {
      const val = snapshot[dataKey];
      const x = padding + (index / (history.length - 1)) * (width - 2 * padding);
      // Invert Y because SVG origin is top-left
      const y = height - padding - (val / maxVal) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' L ');
  };

  return (
    <div className="dashboard-container">
      {/* Header Panel */}
      <header className="glass-panel" style={{ padding: '1.25rem 2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'var(--accent-purple-gradient)', borderRadius: '8px', padding: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Activity className="glow-text-purple" size={24} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, letterSpacing: '-0.03em', background: 'linear-gradient(to right, #ffffff, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              HYPERION
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>APM REAL-TIME ENGINE</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          {/* Status Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={`pulse-indicator ${status.indicator}`}></span>
            <span className={`badge ${status.colorClass}`}>{status.text}</span>
          </div>

          {/* Node Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '0.25rem 0.5rem' }}>
            <Server size={14} color="var(--text-secondary)" />
            <select 
              value={selectedNode} 
              onChange={(e) => setSelectedNode(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
            >
              {SERVER_NODES.map(node => (
                <option key={node.id} value={node.id} style={{ background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
                  {node.name}
                </option>
              ))}
            </select>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setIsSimulating(!isSimulating)}
              className="btn-secondary"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
              title={isSimulating ? 'Pause Stream' : 'Resume Stream'}
            >
              {isSimulating ? <Pause size={14} /> : <Play size={14} />}
              <span>{isSimulating ? 'Pause' : 'Resume'}</span>
            </button>
            <button 
              onClick={handleExportData}
              className="btn-secondary" 
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
              title="Download Snapshot Report"
            >
              <Download size={14} />
              <span>Report</span>
            </button>
          </div>
        </div>
      </header>

      {/* Grid: 4 Metric Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        {/* CPU Card */}
        <div className="glass-panel" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>CPU Usage</span>
            <Cpu size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: cpu > 80 ? 'var(--color-danger)' : 'var(--text-primary)' }}>
              {cpu}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>%</span>
          </div>

          {/* Custom animated progress bar */}
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '1.25rem' }}>
            <div style={{ 
              width: `${cpu}%`, 
              height: '100%', 
              background: cpu > 80 ? 'var(--color-danger)' : 'var(--accent-purple-gradient)',
              boxShadow: cpu > 80 ? '0 0 10px var(--color-danger)' : '0 0 10px var(--accent-purple-glow)',
              transition: 'width 0.5s ease-out'
            }}></div>
          </div>

          {/* SVG Sparkline */}
          <div style={{ height: '60px', width: '100%' }}>
            <svg style={{ width: '100%', height: '100%' }}>
              <path 
                d={history.length > 0 ? `M ${generateSvgPath('cpu', 100)}` : ''} 
                fill="none" 
                stroke={cpu > 80 ? 'var(--color-danger)' : 'var(--accent-purple)'} 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
          </div>
        </div>

        {/* Memory Card */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Memory Heap</span>
            <Database size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {memory}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/ {maxMemory} GB</span>
          </div>

          {/* Progress bar */}
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '1.25rem' }}>
            <div style={{ 
              width: `${(memory / maxMemory) * 100}%`, 
              height: '100%', 
              background: 'var(--accent-cyan-gradient)', 
              boxShadow: '0 0 10px var(--accent-cyan-glow)',
              transition: 'width 0.5s ease-out' 
            }}></div>
          </div>

          {/* SVG Sparkline */}
          <div style={{ height: '60px', width: '100%' }}>
            <svg style={{ width: '100%', height: '100%' }}>
              <path 
                d={history.length > 0 ? `M ${generateSvgPath('memory', maxMemory)}` : ''} 
                fill="none" 
                stroke="var(--accent-cyan)" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
          </div>
        </div>

        {/* API Latency Card */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Response Latency</span>
            <Clock size={18} color="var(--color-warning)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: latency > 400 ? 'var(--color-warning)' : 'var(--text-primary)' }}>
              {latency}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>ms</span>
          </div>

          {/* Progress bar */}
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '1.25rem' }}>
            <div style={{ 
              width: `${Math.min(100, (latency / 1200) * 100)}%`, 
              height: '100%', 
              background: latency > 400 ? 'var(--color-warning)' : 'linear-gradient(90deg, var(--accent-cyan), var(--color-warning))', 
              transition: 'width 0.5s ease-out' 
            }}></div>
          </div>

          {/* SVG Sparkline */}
          <div style={{ height: '60px', width: '100%' }}>
            <svg style={{ width: '100%', height: '100%' }}>
              <path 
                d={history.length > 0 ? `M ${generateSvgPath('latency', 1200)}` : ''} 
                fill="none" 
                stroke="var(--color-warning)" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
          </div>
        </div>

        {/* Requests Rate / Error Card */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Throughput & Errors</span>
            <Zap size={18} color="var(--color-danger)" />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.15rem' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{rps}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>RPS</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.15rem', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: errorRate > 2.0 ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                  {errorRate}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>% ERR</span>
              </div>
            </div>
          </div>

          {/* Progress bar (Error rate representation) */}
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '1.25rem' }}>
            <div style={{ 
              width: `${Math.min(100, (errorRate / 12) * 100)}%`, 
              height: '100%', 
              background: 'var(--color-danger)', 
              boxShadow: '0 0 10px var(--color-danger-glow)',
              transition: 'width 0.5s ease-out' 
            }}></div>
          </div>

          {/* SVG Sparkline */}
          <div style={{ height: '60px', width: '100%' }}>
            <svg style={{ width: '100%', height: '100%' }}>
              <path 
                d={history.length > 0 ? `M ${generateSvgPath('rps', 3000)}` : ''} 
                fill="none" 
                stroke="var(--color-danger)" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
          </div>
        </div>
      </section>

      {/* Main Grid: Load Sim Controls (Left) & Real-time Logs Terminal (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        
        {/* Controls & Simulators */}
        <section className="glass-panel glass-panel-cyan" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Layers size={18} color="var(--accent-cyan)" />
              Telemetry Simulator Controls
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Simulate high concurrency patterns, synthetic request triggers, and cluster pressure spikes to test auto-scaling thresholds.
            </p>
          </div>

          {/* Load Level Slider */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid var(--border-light)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>Traffic Concurrency Load</span>
              <span style={{ 
                fontSize: '0.8rem', 
                fontWeight: 600, 
                padding: '0.15rem 0.5rem', 
                borderRadius: '4px',
                color: loadLevel === 4 ? '#ffffff' : 'inherit',
                backgroundColor: 
                  loadLevel === 1 ? 'rgba(16, 185, 129, 0.15)' :
                  loadLevel === 2 ? 'rgba(6, 182, 212, 0.15)' :
                  loadLevel === 3 ? 'rgba(245, 158, 11, 0.15)' :
                  'var(--color-danger)'
              }}>
                {loadLevel === 1 && 'Low (Idle)'}
                {loadLevel === 2 && 'Medium (Optimal)'}
                {loadLevel === 3 && 'High (Peak)'}
                {loadLevel === 4 && 'Critical (Failures)'}
              </span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="4" 
              value={loadLevel} 
              onChange={(e) => setLoadLevel(parseInt(e.target.value))}
              style={{ width: '100%', height: '6px', background: '#1e293b', outline: 'none', cursor: 'pointer', accentColor: 'var(--accent-cyan)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              <span>Low</span>
              <span>Med</span>
              <span>High</span>
              <span>Crit</span>
            </div>
          </div>

          {/* Auto Scaling & Node options */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input 
                type="checkbox" 
                id="autoscale" 
                checked={autoScale}
                onChange={(e) => setAutoScale(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
              />
              <label htmlFor="autoscale" style={{ fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                Enable Replica Auto-scaling
              </label>
            </div>
            {autoScale && (
              <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                Engine Ready
              </span>
            )}
          </div>

          <hr style={{ border: 'none', height: '1px', background: 'var(--border-light)' }} />

          {/* Operational Actions */}
          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.75rem', fontWeight: 600 }}>Emergency Run Operations</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <button 
                onClick={handleForceGC}
                className="btn-primary"
                style={{ flex: '1 1 120px', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
              >
                <Zap size={14} />
                Force GC
              </button>
              <button 
                onClick={handleRestart}
                className="btn-secondary"
                style={{ flex: '1 1 120px', fontSize: '0.8rem', padding: '0.5rem 1rem', borderColor: 'var(--color-danger-glow)', color: '#fecdd3' }}
              >
                <RefreshCw size={14} color="var(--color-danger)" />
                Restart Container
              </button>
            </div>
          </div>
        </section>

        {/* Real-time Logs Console */}
        <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '380px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Terminal size={18} color="var(--accent-purple)" />
              Active Server Container Logs
            </h3>
            <button 
              onClick={handleClearLogs}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
              title="Clear Console"
            >
              <Trash2 size={12} />
              Clear
            </button>
          </div>

          {/* Terminal Box */}
          <div style={{ 
            background: 'rgba(0,0,0,0.65)', 
            border: '1px solid var(--border-light)', 
            borderRadius: '8px', 
            padding: '0.75rem', 
            flexGrow: 1, 
            overflowY: 'auto', 
            boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {logs.length === 0 ? (
              <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                Console idle. No telemetry output.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className={`log-line ${log.type}`}>
                  <span className="log-time">[{log.time}]</span>
                  <span style={{ textTransform: 'uppercase', fontWeight: 700, marginRight: '0.5rem', fontSize: '0.7rem' }}>
                    {log.type === 'info' && 'INFO'}
                    {log.type === 'warn' && 'WARN'}
                    {log.type === 'error' && 'ERR'}
                  </span>
                  <span>{log.message}</span>
                </div>
              ))
            )}
            <div ref={consoleEndRef} />
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer style={{ marginTop: '2rem', borderTop: '1px solid var(--border-light)', padding: '1.25rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          &copy; {new Date().getFullYear()} Hyperion Telemetry Inc. Dockerized static client deployment.
        </p>
        <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.75rem' }}>
          <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Cluster Specs</a>
          <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <CheckCircle size={12} /> ACR PUSH-READY
          </span>
        </div>
      </footer>
    </div>
  );
}
