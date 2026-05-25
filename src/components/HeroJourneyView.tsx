import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Trash2, MousePointer, GitBranch, RotateCcw } from 'lucide-react';

interface JourneyNode {
  id: string;
  x: number;
  y: number;
  label: string;
  sublabel: string;
  shape: 'circle' | 'rect';
  color: string;
}

interface JourneyPath {
  id: string;
  fromId: string;
  toId: string;
}

const NODE_COLORS = [
  '#4A7C59', // forest green (default)
  '#8B6914', // gold earth
  '#5C3A1E', // dark brown
  '#7B91B8', // slate blue
  '#B8674A', // terracotta
  '#8AA68E', // sage
];

// Default Hero's Journey stages laid out in a meaningful arc
const DEFAULT_NODES: JourneyNode[] = [
  { id: 'n1', x: 140, y: 540, label: 'Ordinary World', sublabel: 'Where you begin', shape: 'circle', color: '#4A7C59' },
  { id: 'n2', x: 380, y: 380, label: 'Call to Adventure', sublabel: 'The challenge arrives', shape: 'circle', color: '#4A7C59' },
  { id: 'n3', x: 620, y: 260, label: 'Refusal', sublabel: 'Fear holds you back', shape: 'circle', color: '#8B6914' },
  { id: 'n4', x: 870, y: 200, label: 'Meeting the Mentor', sublabel: 'Wisdom appears', shape: 'circle', color: '#4A7C59' },
  { id: 'n5', x: 1120, y: 260, label: 'Crossing the Threshold', sublabel: 'The journey begins', shape: 'rect', color: '#5C3A1E' },
  { id: 'n6', x: 1340, y: 420, label: 'Tests & Allies', sublabel: 'The trials of growth', shape: 'circle', color: '#8B6914' },
  { id: 'n7', x: 1480, y: 620, label: 'The Ordeal', sublabel: 'The darkest moment', shape: 'rect', color: '#B8674A' },
  { id: 'n8', x: 1340, y: 820, label: 'The Reward', sublabel: 'What you claim', shape: 'circle', color: '#4A7C59' },
  { id: 'n9', x: 1050, y: 920, label: 'The Road Back', sublabel: 'Returning transformed', shape: 'circle', color: '#4A7C59' },
  { id: 'n10', x: 760, y: 880, label: 'Resurrection', sublabel: 'Final transformation', shape: 'rect', color: '#B8674A' },
  { id: 'n11', x: 480, y: 760, label: 'Return with Elixir', sublabel: 'Sharing the gift', shape: 'circle', color: '#4A7C59' },
];

const DEFAULT_PATHS: JourneyPath[] = [
  { id: 'p1', fromId: 'n1', toId: 'n2' },
  { id: 'p2', fromId: 'n2', toId: 'n3' },
  { id: 'p3', fromId: 'n3', toId: 'n4' },
  { id: 'p4', fromId: 'n4', toId: 'n5' },
  { id: 'p5', fromId: 'n5', toId: 'n6' },
  { id: 'p6', fromId: 'n6', toId: 'n7' },
  { id: 'p7', fromId: 'n7', toId: 'n8' },
  { id: 'p8', fromId: 'n8', toId: 'n9' },
  { id: 'p9', fromId: 'n9', toId: 'n10' },
  { id: 'p10', fromId: 'n10', toId: 'n11' },
];

// Compute a smooth cubic bezier dirt path between two points
function dirtPathD(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  // Perpendicular offset for gentle curve
  const perp = Math.sqrt(dx * dx + dy * dy) * 0.18;
  const nx = -dy / Math.sqrt(dx * dx + dy * dy + 0.001);
  const ny = dx / Math.sqrt(dx * dx + dy * dy + 0.001);
  const cp1x = x1 + dx * 0.33 + nx * perp;
  const cp1y = y1 + dy * 0.33 + ny * perp;
  const cp2x = x1 + dx * 0.66 - nx * perp * 0.5;
  const cp2y = y1 + dy * 0.66 - ny * perp * 0.5;
  return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
}

function nodeCenter(node: JourneyNode): { x: number; y: number } {
  return { x: node.x, y: node.y };
}

function nodeRadius(node: JourneyNode): number {
  return node.shape === 'circle' ? 52 : 60;
}

type ToolMode = 'select' | 'connect' | 'add';

export const HeroJourneyView: React.FC = () => {
  const [nodes, setNodes] = useState<JourneyNode[]>(DEFAULT_NODES);
  const [paths, setPaths] = useState<JourneyPath[]>(DEFAULT_PATHS);
  const [mode, setMode] = useState<ToolMode>('select');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<{ id: string; startMx: number; startMy: number; startNx: number; startNy: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getSVGCoords = useCallback((e: MouseEvent | React.MouseEvent): { x: number; y: number } => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (1920 / rect.width),
      y: (e.clientY - rect.top) * (1080 / rect.height),
    };
  }, []);

  // Node drag handling
  useEffect(() => {
    if (!draggingNode) return;
    const handleMove = (e: MouseEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleX = 1920 / rect.width;
      const scaleY = 1080 / rect.height;
      const dx = (e.clientX - draggingNode.startMx) * scaleX;
      const dy = (e.clientY - draggingNode.startMy) * scaleY;
      setNodes(prev => prev.map(n => n.id === draggingNode.id
        ? { ...n, x: draggingNode.startNx + dx, y: draggingNode.startNy + dy }
        : n
      ));
    };
    const handleUp = () => setDraggingNode(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [draggingNode]);

  const handleNodeMouseDown = (e: React.MouseEvent, node: JourneyNode) => {
    e.stopPropagation();

    if (mode === 'select') {
      setSelectedNode(node.id);
      setDraggingNode({ id: node.id, startMx: e.clientX, startMy: e.clientY, startNx: node.x, startNy: node.y });
    } else if (mode === 'connect') {
      if (!connectingFrom) {
        setConnectingFrom(node.id);
      } else if (connectingFrom !== node.id) {
        // Check no duplicate
        const exists = paths.find(p => (p.fromId === connectingFrom && p.toId === node.id) || (p.fromId === node.id && p.toId === connectingFrom));
        if (!exists) {
          setPaths(prev => [...prev, { id: `p${Date.now()}`, fromId: connectingFrom, toId: node.id }]);
        }
        setConnectingFrom(null);
      }
    }
  };

  const handleSVGClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode === 'add') {
      const coords = getSVGCoords(e);
      const newNode: JourneyNode = {
        id: `n${Date.now()}`,
        x: coords.x,
        y: coords.y,
        label: 'New Stage',
        sublabel: 'click to edit',
        shape: 'circle',
        color: NODE_COLORS[0],
      };
      setNodes(prev => [...prev, newNode]);
      setMode('select');
      setSelectedNode(newNode.id);
    } else {
      setSelectedNode(null);
      if (mode === 'connect') setConnectingFrom(null);
    }
  };

  const deleteSelected = () => {
    if (!selectedNode) return;
    setNodes(prev => prev.filter(n => n.id !== selectedNode));
    setPaths(prev => prev.filter(p => p.fromId !== selectedNode && p.toId !== selectedNode));
    setSelectedNode(null);
  };

  const reset = () => {
    setNodes(DEFAULT_NODES);
    setPaths(DEFAULT_PATHS);
    setSelectedNode(null);
    setConnectingFrom(null);
    setMode('select');
  };

  const selNode = nodes.find(n => n.id === selectedNode);

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
      {/* === GREEN FIELD BACKGROUND === */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 30%, #5E9B6A 0%, #4A7C55 40%, #3A6347 100%)',
      }} />
      {/* Grass texture via SVG pattern */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12 }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grass" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <line x1="10" y1="40" x2="12" y2="28" stroke="#2A4A30" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="28" y1="40" x2="26" y2="24" stroke="#2A4A30" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="20" y1="40" x2="22" y2="30" stroke="#2A4A30" strokeWidth="1" strokeLinecap="round" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grass)" />
      </svg>

      {/* Title */}
      <div style={{ position: 'absolute', top: '28px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10, pointerEvents: 'none' }}>
        <h2 style={{ fontFamily: 'Lora, serif', fontSize: '26px', color: 'rgba(255,255,255,0.9)', fontWeight: 500, textShadow: '0 2px 8px rgba(0,0,0,0.4)', margin: 0 }}>
          The Hero's Journey
        </h2>
      </div>

      {/* Toolbar */}
      <div style={{
        position: 'absolute', top: '20px', left: '24px',
        display: 'flex', gap: '6px', zIndex: 20,
      }}>
        {([
          { m: 'select' as ToolMode, icon: <MousePointer size={14} />, label: 'Move' },
          { m: 'connect' as ToolMode, icon: <GitBranch size={14} />, label: connectingFrom ? 'Click destination...' : 'Connect' },
          { m: 'add' as ToolMode, icon: <Plus size={14} />, label: 'Add Node' },
        ] as const).map(({ m, icon, label }) => (
          <button
            key={m}
            onClick={() => { setMode(m); setConnectingFrom(null); }}
            style={{
              padding: '7px 13px',
              background: mode === m ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.45)',
              color: mode === m ? '#2C1F15' : 'rgba(255,255,255,0.85)',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontSize: '12px', fontFamily: 'Inter', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: '6px',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            }}
          >
            {icon}{label}
          </button>
        ))}
        {selectedNode && (
          <button onClick={deleteSelected} style={{ padding: '7px 13px', background: 'rgba(184,103,74,0.85)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(8px)' }}>
            <Trash2 size={14} /> Delete
          </button>
        )}
        <button onClick={reset} style={{ padding: '7px 13px', background: 'rgba(0,0,0,0.35)', color: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(8px)' }}>
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      {/* Node editor panel */}
      {selNode && mode === 'select' && (
        <div style={{
          position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)',
          borderRadius: '12px', padding: '16px 20px',
          display: 'flex', gap: '12px', alignItems: 'center', zIndex: 20,
          border: '1px solid rgba(255,255,255,0.15)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <input
              value={selNode.label}
              onChange={e => setNodes(prev => prev.map(n => n.id === selNode.id ? { ...n, label: e.target.value } : n))}
              placeholder="Stage name"
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', fontFamily: 'Lora, serif', width: '200px', outline: 'none' }}
            />
            <input
              value={selNode.sublabel}
              onChange={e => setNodes(prev => prev.map(n => n.id === selNode.id ? { ...n, sublabel: e.target.value } : n))}
              placeholder="Subtitle"
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontFamily: 'Inter', width: '200px', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['circle', 'rect'].map(s => (
              <button key={s} onClick={() => setNodes(prev => prev.map(n => n.id === selNode.id ? { ...n, shape: s as 'circle' | 'rect' } : n))}
                style={{ padding: '6px 10px', background: selNode.shape === s ? 'rgba(255,255,255,0.2)' : 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: '#fff', fontSize: '11px', cursor: 'pointer', fontFamily: 'Inter' }}>
                {s === 'circle' ? '◯' : '▭'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            {NODE_COLORS.map(c => (
              <button key={c} onClick={() => setNodes(prev => prev.map(n => n.id === selNode.id ? { ...n, color: c } : n))}
                style={{ width: '20px', height: '20px', borderRadius: '50%', background: c, border: selNode.color === c ? '2px solid white' : '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }} />
            ))}
          </div>
          <button onClick={() => {
            setPaths(prev => prev.filter(p => !(p.fromId === selNode.id || p.toId === selNode.id)));
            setNodes(prev => prev.filter(n => n.id !== selNode.id));
            setSelectedNode(null);
          }} style={{ padding: '6px 10px', background: 'rgba(184,103,74,0.7)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px', fontFamily: 'Inter' }}>
            Remove
          </button>
        </div>
      )}

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: mode === 'add' ? 'crosshair' : 'default' }}
        viewBox="0 0 1920 1080"
        onClick={handleSVGClick}
      >
        {/* Dirt paths */}
        {paths.map(path => {
          const from = nodes.find(n => n.id === path.fromId);
          const to = nodes.find(n => n.id === path.toId);
          if (!from || !to) return null;
          const d = dirtPathD(from.x, from.y, to.x, to.y);
          return (
            <g key={path.id} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setPaths(prev => prev.filter(p => p.id !== path.id)); }}>
              {/* Outer edge — dark earth */}
              <path d={d} fill="none" stroke="#5C3A1E" strokeWidth="26" strokeLinecap="round" opacity="0.85" />
              {/* Middle — sandy earth */}
              <path d={d} fill="none" stroke="#A0784A" strokeWidth="18" strokeLinecap="round" opacity="0.9" />
              {/* Center highlight — worn path */}
              <path d={d} fill="none" stroke="#C4A07A" strokeWidth="8" strokeLinecap="round" opacity="0.7" strokeDasharray="1 0" />
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const isSelected = selectedNode === node.id;
          const isConnectSource = connectingFrom === node.id;
          const r = node.shape === 'circle' ? 52 : 0;

          return (
            <g
              key={node.id}
              onMouseDown={e => handleNodeMouseDown(e, node)}
              style={{ cursor: mode === 'select' ? 'grab' : 'pointer', userSelect: 'none' }}
            >
              {/* Node shadow */}
              {node.shape === 'circle' ? (
                <circle cx={node.x} cy={node.y} r={r + 4} fill="rgba(0,0,0,0.3)" transform="translate(4,6)" />
              ) : (
                <rect x={node.x - 72} y={node.y - 36} width={144} height={72} rx={10} fill="rgba(0,0,0,0.3)" transform="translate(4,6)" />
              )}

              {/* Node body */}
              {node.shape === 'circle' ? (
                <circle cx={node.x} cy={node.y} r={r}
                  fill={node.color}
                  stroke={isSelected || isConnectSource ? '#FFFFFF' : 'rgba(255,255,255,0.3)'}
                  strokeWidth={isSelected || isConnectSource ? 3 : 1.5}
                />
              ) : (
                <rect x={node.x - 72} y={node.y - 36} width={144} height={72} rx={10}
                  fill={node.color}
                  stroke={isSelected || isConnectSource ? '#FFFFFF' : 'rgba(255,255,255,0.3)'}
                  strokeWidth={isSelected || isConnectSource ? 3 : 1.5}
                />
              )}

              {/* Inner highlight */}
              {node.shape === 'circle' ? (
                <circle cx={node.x - 12} cy={node.y - 12} r={r * 0.35} fill="rgba(255,255,255,0.08)" />
              ) : (
                <rect x={node.x - 62} y={node.y - 28} width={124} height={28} rx={6} fill="rgba(255,255,255,0.06)" />
              )}

              {/* Label */}
              <text x={node.x} y={node.y - 5} textAnchor="middle" fill="white" fontFamily="Lora, serif" fontSize="15" fontWeight="500" style={{ pointerEvents: 'none' }}>
                {node.label}
              </text>
              {node.sublabel && (
                <text x={node.x} y={node.y + 13} textAnchor="middle" fill="rgba(255,255,255,0.65)" fontFamily="Inter, sans-serif" fontSize="11" style={{ pointerEvents: 'none' }}>
                  {node.sublabel}
                </text>
              )}

              {/* Selected ring */}
              {isSelected && node.shape === 'circle' && (
                <circle cx={node.x} cy={node.y} r={r + 10} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeDasharray="6 4" />
              )}
              {isConnectSource && (
                <circle cx={node.x} cy={node.y} r={r + 8} fill="none" stroke="#F39C12" strokeWidth="3" strokeDasharray="5 3">
                  <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="0.8s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
