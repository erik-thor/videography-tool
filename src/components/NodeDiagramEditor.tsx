import React, { useState, useRef } from 'react';
import { Plus, Trash2, Link2, HelpCircle, RefreshCw } from 'lucide-react';

interface DiagramNode {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
}

interface Connection {
  fromId: string;
  toId: string;
}

export const NodeDiagramEditor: React.FC = () => {
  const [nodes, setNodes] = useState<DiagramNode[]>([
    { id: '1', label: 'Stimulus', x: 250, y: 300, color: 'var(--slate-blue)' },
    { id: '2', label: 'Cognitive Appraisal', x: 500, y: 300, color: 'var(--warm-gold)' },
    { id: '3', label: 'Emotional Response', x: 750, y: 200, color: 'var(--terracotta)' },
    { id: '4', label: 'Behavioral Action', x: 750, y: 400, color: 'var(--sage)' },
  ]);
  const [connections, setConnections] = useState<Connection[]>([
    { fromId: '1', toId: '2' },
    { fromId: '2', toId: '3' },
    { fromId: '2', toId: '4' },
  ]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Colors available for nodes
  const nodeColors = [
    { name: 'Slate Blue', value: 'var(--slate-blue)' },
    { name: 'Warm Gold', value: 'var(--warm-gold)' },
    { name: 'Terracotta', value: 'var(--terracotta)' },
    { name: 'Sage', value: 'var(--sage)' },
    { name: 'Blush Rose', value: 'var(--blush-rose)' },
  ];

  // Double click background to add node
  const handleBgDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== containerRef.current && e.target !== containerRef.current?.querySelector('svg')) return;
    
    // Account for transform scaling of 1920x1080 container
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) * (1920 / rect.width);
    const y = (e.clientY - rect.top) * (1080 / rect.height);

    const newNode: DiagramNode = {
      id: Date.now().toString(),
      label: 'New Concept',
      x: Math.round(x),
      y: Math.round(y),
      color: 'var(--slate-blue)',
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    setEditingNodeId(newNode.id);
  };

  const addNodeAtCenter = () => {
    const newNode: DiagramNode = {
      id: Date.now().toString(),
      label: 'Concept',
      x: 960 / 2, // middle-ish
      y: 540 / 2,
      color: 'var(--slate-blue)',
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    setEditingNodeId(newNode.id);
  };

  // Node drag events
  const handleNodeMouseDown = (e: React.MouseEvent, node: DiagramNode) => {
    if (editingNodeId) return; // ignore dragging when renaming
    e.stopPropagation();
    setSelectedNodeId(node.id);
    setIsDragging(true);

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = (e.clientX - rect.left) * (1920 / rect.width);
    const clientY = (e.clientY - rect.top) * (1080 / rect.height);

    dragOffset.current = {
      x: clientX - node.x,
      y: clientY - node.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedNodeId || editingNodeId) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Compensate coordinates for transform scale
    const clientX = (e.clientX - rect.left) * (1920 / rect.width);
    const clientY = (e.clientY - rect.top) * (1080 / rect.height);

    setNodes((prev) =>
      prev.map((node) => {
        if (node.id === selectedNodeId) {
          return {
            ...node,
            x: Math.max(80, Math.min(1840, Math.round(clientX - dragOffset.current.x))),
            y: Math.max(80, Math.min(1000, Math.round(clientY - dragOffset.current.y))),
          };
        }
        return node;
      })
    );
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Link two nodes
  const handleLinkNode = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (!connectSourceId) {
      setConnectSourceId(nodeId);
    } else {
      if (connectSourceId !== nodeId) {
        // Create connection if it doesn't exist
        const exists = connections.some(
          (c) => c.fromId === connectSourceId && c.toId === nodeId
        );
        if (!exists) {
          setConnections((prev) => [...prev, { fromId: connectSourceId, toId: nodeId }]);
        }
      }
      setConnectSourceId(null);
    }
  };

  // Delete node and its connections
  const handleDeleteNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setConnections((prev) => prev.filter((c) => c.fromId !== nodeId && c.toId !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
    if (editingNodeId === nodeId) setEditingNodeId(null);
    if (connectSourceId === nodeId) setConnectSourceId(null);
  };

  // Delete connection
  const handleDeleteConnection = (fromId: string, toId: string) => {
    setConnections((prev) => prev.filter((c) => !(c.fromId === fromId && c.toId === toId)));
  };

  // Clean all
  const handleClearAll = () => {
    setNodes([]);
    setConnections([]);
    setSelectedNodeId(null);
    setEditingNodeId(null);
    setConnectSourceId(null);
  };

  // Calculate coordinates for connection arrow lines
  const getConnectionCoords = (from: DiagramNode, to: DiagramNode) => {
    // Let's assume nodes are rounded-rects of width 160, height 60
    const w = 160;
    const h = 60;
    
    // Vector between centers
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return { x1: from.x, y1: from.y, x2: to.x, y2: to.y };
    
    // We clip to the edge of the boxes
    // For simplicity and circular appearance, clip using node radius representation (approx 80px width base)
    const clipX = (dx / distance);
    const clipY = (dy / distance);
    
    // We compute boundary overlap based on angle to rectangular borders
    const angle = Math.abs(Math.atan2(dy, dx));
    const borderAngle = Math.atan2(h / 2, w / 2);
    
    let scale = 0;
    if (angle < borderAngle) {
      // Hits left/right borders
      scale = (w / 2) / Math.cos(angle);
    } else {
      // Hits top/bottom borders
      scale = (h / 2) / Math.sin(angle);
    }

    // Shrink the scale slightly to avoid touching text/border directly
    const buffer = 8;
    const fromBorder = scale + buffer;
    const toBorder = scale + buffer + 6; // extra buffer for arrowhead

    return {
      x1: from.x + clipX * fromBorder,
      y1: from.y + clipY * fromBorder,
      x2: to.x - clipX * toBorder,
      y2: to.y - clipY * toBorder,
    };
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleBgDoubleClick}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Editor Controls Toolbar */}
      <div
        className="editorial-panel"
        style={{
          position: 'absolute',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '8px 16px',
          zIndex: 20,
          border: '1px solid var(--border-color)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <button
          onClick={addNodeAtCenter}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--warm-ink)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          <Plus size={16} />
          Add Concept
        </button>

        <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(44, 31, 21, 0.2)' }} />

        <span style={{ fontSize: '12px', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <HelpCircle size={14} />
          Double-click background to create • Double-click node to rename • Drag to reposition
        </span>

        <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(44, 31, 21, 0.2)' }} />

        <button
          onClick={handleClearAll}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--terracotta)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          <RefreshCw size={14} />
          Reset Map
        </button>
      </div>

      {/* SVG Layer for Connections */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 5,
          pointerEvents: 'none',
        }}
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--warm-ink)" />
          </marker>
          <marker
            id="arrow-selected"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--terracotta)" />
          </marker>
        </defs>

        {connections.map((conn, idx) => {
          const fromNode = nodes.find((n) => n.id === conn.fromId);
          const toNode = nodes.find((n) => n.id === conn.toId);
          if (!fromNode || !toNode) return null;

          const { x1, y1, x2, y2 } = getConnectionCoords(fromNode, toNode);
          const isSelected = selectedNodeId === conn.fromId || selectedNodeId === conn.toId;

          return (
            <g key={`conn-${idx}`} style={{ pointerEvents: 'auto', cursor: 'pointer' }}>
          {/* Thick transparent interactive line overlay for easy deletion */}
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="transparent"
            strokeWidth="10"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteConnection(conn.fromId, conn.toId);
            }}
          />
              
              {/* Actual line */}
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isSelected ? 'var(--terracotta)' : 'var(--warm-ink)'}
                strokeWidth={isSelected ? '2' : '1.5'}
                markerEnd={isSelected ? 'url(#arrow-selected)' : 'url(#arrow)'}
                style={{
                  opacity: isSelected ? 1.0 : 0.6,
                  transition: 'stroke 0.2s ease, stroke-width 0.2s ease',
                }}
              />
            </g>
          );
        })}
      </svg>

      {/* Nodes Container */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none' }}>
        {nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isEditing = editingNodeId === node.id;
          const isLinkingSource = connectSourceId === node.id;

          return (
            <div
              key={node.id}
              onMouseDown={(e) => handleNodeMouseDown(e, node)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingNodeId(node.id);
              }}
              style={{
                position: 'absolute',
                left: `${node.x}px`,
                top: `${node.y}px`,
                transform: 'translate(-50%, -50%)',
                width: '160px',
                height: '60px',
                pointerEvents: 'auto',
                cursor: isDragging ? 'grabbing' : 'grab',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px',
                border: isSelected
                  ? '2px solid var(--terracotta)'
                  : isLinkingSource
                  ? '2px solid var(--warm-gold)'
                  : '1.2px solid var(--warm-ink)',
                borderRadius: '8px',
                backgroundColor: 'var(--warm-ivory)',
                zIndex: isSelected ? 15 : 11,
                boxShadow: 'none',
              }}
            >
              {/* Concept Dot Color Pill */}
              <div
                style={{
                  position: 'absolute',
                  top: '-7px',
                  left: '12px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  backgroundColor: node.color,
                  border: '1px solid var(--warm-ink)',
                }}
              />

              {isEditing ? (
                <input
                  type="text"
                  value={node.label}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNodes((prev) =>
                      prev.map((n) => (n.id === node.id ? { ...n, label: val } : n))
                    );
                  }}
                  onBlur={() => setEditingNodeId(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setEditingNodeId(null);
                  }}
                  autoFocus
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'center',
                    fontFamily: 'Lora, serif',
                    fontSize: '14px',
                    fontWeight: 500,
                    outline: 'none',
                    color: 'var(--warm-ink)',
                  }}
                />
              ) : (
                <div
                  style={{
                    fontFamily: 'Lora, serif',
                    fontSize: '14px',
                    fontWeight: 500,
                    textAlign: 'center',
                    color: 'var(--warm-ink)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: '100%',
                  }}
                >
                  {node.label}
                </div>
              )}

              {/* Node Controls Panel Overlay (Shown when selected and not editing) */}
              {isSelected && !isEditing && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-42px',
                    display: 'flex',
                    gap: '6px',
                    backgroundColor: 'var(--warm-ink)',
                    padding: '4px',
                    borderRadius: '6px',
                    zIndex: 25,
                  }}
                  onMouseDown={(e) => e.stopPropagation()} // stop dragging triggers when clicking buttons
                >
                  {/* Link action */}
                  <button
                    onClick={(e) => handleLinkNode(e, node.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isLinkingSource ? 'var(--warm-gold)' : 'var(--warm-ivory)',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      display: 'flex',
                    }}
                    title="Click here, then click another node to draw link"
                  >
                    <Link2 size={13} />
                  </button>

                  {/* Colors pick */}
                  {nodeColors.map((c) => (
                    <button
                      key={c.value}
                      onClick={() =>
                        setNodes((prev) =>
                          prev.map((n) => (n.id === node.id ? { ...n, color: c.value } : n))
                        )
                      }
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: c.value,
                        border: '1px solid rgba(244, 234, 213, 0.4)',
                        cursor: 'pointer',
                        padding: 0,
                        alignSelf: 'center',
                      }}
                    />
                  ))}

                  {/* Delete action */}
                  <button
                    onClick={() => handleDeleteNode(node.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--blush-rose)',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      display: 'flex',
                    }}
                    title="Delete Node"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
