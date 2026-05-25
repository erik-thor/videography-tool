import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Pencil, Highlighter, Eraser, Trash2, Undo } from 'lucide-react';

interface WhiteboardCanvasProps {
  isActive: boolean; // Is writing enabled
  drawOnTop: boolean; // Transparent overlay vs. solid background
  theme: 'light' | 'dark';
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  brushType: 'pencil' | 'highlighter' | 'eraser' | 'text';
  setBrushType: (type: 'pencil' | 'highlighter' | 'eraser' | 'text') => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  clearTrigger: number; // Increment to clear canvas
  undoTrigger?: number; // Increment to undo stroke
  restoreDataUrl?: string; // Loaded image state of active scene
  showToolbar?: boolean; // Whether to render the floating in-canvas toolbar
}

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  isActive,
  drawOnTop,
  theme,
  strokeColor,
  setStrokeColor,
  brushType,
  setBrushType,
  brushSize,
  setBrushSize,
  clearTrigger,
  undoTrigger = 0,
  restoreDataUrl,
  showToolbar = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [textInput, setTextInput] = useState<{ x: number; y: number; val: string } | null>(null);
  // Keep a ref so event listeners always read the latest history without re-registering
  const historyRef = useRef<string[]>([]);
  historyRef.current = history;

  // Palette colors corresponding to brand guidelines
  const colors = [
    { name: 'Ink', value: '#2C1F15' },
    { name: 'Ivory', value: '#F4EAD5' },
    { name: 'Rose', value: '#E8B09A' },
    { name: 'Terracotta', value: '#B8674A' },
    { name: 'Gold', value: '#C9A563' },
    { name: 'Sage', value: '#8AA68E' },
    { name: 'Slate', value: '#7B91B8' },
  ];

  // Set up canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 1920;
    canvas.height = 1080;

    // Draw solid background if not drawing on top
    if (!drawOnTop) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = theme === 'dark' ? '#2C1F15' : '#F4EAD5';
        ctx.fillRect(0, 0, 1920, 1080);
      }
    }
  }, [drawOnTop, theme]);

  // Handle external clear trigger
  useEffect(() => {
    if (clearTrigger > 0) {
      handleClear();
    }
  }, [clearTrigger]);

  // Handle external undo trigger
  useEffect(() => {
    if (undoTrigger > 0) {
      performUndo();
    }
  }, [undoTrigger]);

  // Handle scene restoration
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (restoreDataUrl) {
      const img = new Image();
      img.src = restoreDataUrl;
      img.onload = () => {
        ctx.clearRect(0, 0, 1920, 1080);
        if (!drawOnTop) {
          ctx.fillStyle = theme === 'dark' ? '#2C1F15' : '#F4EAD5';
          ctx.fillRect(0, 0, 1920, 1080);
        }
        ctx.drawImage(img, 0, 0);
      };
    } else {
      ctx.clearRect(0, 0, 1920, 1080);
      if (!drawOnTop) {
        ctx.fillStyle = theme === 'dark' ? '#2C1F15' : '#F4EAD5';
        ctx.fillRect(0, 0, 1920, 1080);
      }
    }
  }, [restoreDataUrl, drawOnTop, theme]);

  // Handle Ctrl+Z keyboard shortcut for undo
  // Uses historyRef so we don't need to re-register on every history change
  const performUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || historyRef.current.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const previousStateUrl = historyRef.current[historyRef.current.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    const img = new Image();
    img.src = previousStateUrl;
    img.onload = () => {
      ctx.clearRect(0, 0, 1920, 1080);
      if (!drawOnTop) {
        ctx.fillStyle = theme === 'dark' ? '#2C1F15' : '#F4EAD5';
        ctx.fillRect(0, 0, 1920, 1080);
      }
      ctx.drawImage(img, 0, 0);
    };
  }, [drawOnTop, theme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive) return; // Only undo when this canvas is active
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return; // Don't interrupt text input undos
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        performUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, performUndo]);

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL();
    setHistory((prev) => [...prev.slice(-19), url]); // Keep last 20 states
  };

  const commitText = () => {
    if (!textInput) return;
    const { x, y, val } = textInput;
    setTextInput(null);
    if (!val.trim()) return;

    saveHistory();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.font = `500 ${brushSize * 3.5}px Lora, Georgia, serif`;
    ctx.fillStyle = strokeColor;
    ctx.textBaseline = 'middle';
    ctx.fillText(val, x, y);
  };

  const handleUndo = performUndo;

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    saveHistory();
    ctx.clearRect(0, 0, 1920, 1080);
    if (!drawOnTop) {
      ctx.fillStyle = theme === 'dark' ? '#2C1F15' : '#F4EAD5';
      ctx.fillRect(0, 0, 1920, 1080);
    }
  };

  // Helper to map mouse event to 1920x1080 resolution
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Account for CSS scale transform
    const x = (e.clientX - rect.left) * (1920 / rect.width);
    const y = (e.clientY - rect.top) * (1080 / rect.height);
    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isActive) return;
    if (brushType === 'text') {
      if (textInput) {
        commitText();
      }
      const { x, y } = getCanvasCoords(e);
      setTextInput({ x, y, val: '' });
      return;
    }
    saveHistory();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);

    // Setup brush strokes based on options
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (brushType === 'eraser') {
      if (drawOnTop) {
        // Eraser in overlay mode: clears the drawing lines back to transparency
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = brushSize * 1.5;
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        // Eraser in solid whiteboard mode: paints back the background color
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = theme === 'dark' ? '#2C1F15' : '#F4EAD5';
        ctx.lineWidth = brushSize * 1.5;
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = strokeColor;
      
      if (brushType === 'highlighter') {
        // Highlight mode uses globalAlpha for translucency
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = brushSize * 3; // Highlighters are broader
      } else {
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = brushSize;
      }
      
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // Reset alpha for safety
    ctx.globalAlpha = 1.0;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: isActive ? 'auto' : 'none',
        zIndex: 30,
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className={`w-full h-full ${isActive ? 'canvas-interactive' : ''}`}
      />

      {textInput && (
        <input
          type="text"
          value={textInput.val}
          onChange={(e) => setTextInput({ ...textInput, val: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              commitText();
            } else if (e.key === 'Escape') {
              setTextInput(null);
            }
          }}
          onBlur={commitText}
          autoFocus
          style={{
            position: 'absolute',
            left: `${textInput.x}px`,
            top: `${textInput.y}px`,
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: strokeColor,
            fontFamily: 'Lora, Georgia, serif',
            fontSize: `${brushSize * 3.5}px`,
            fontWeight: 500,
            zIndex: 100,
            width: '600px',
            caretColor: strokeColor,
            pointerEvents: 'auto',
          }}
        />
      )}

      {/* Floating Canvas Brush Controls (displayed only when whiteboard is active AND showToolbar is true) */}
      {isActive && showToolbar && (
        <div
          className="editorial-panel"
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            padding: '10px 20px',
            zIndex: 50,
            pointerEvents: 'auto',
            border: '1px solid var(--border-color)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {/* Brush Types */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setBrushType('pencil')}
              style={{
                background: brushType === 'pencil' ? 'var(--terracotta)' : 'transparent',
                color: brushType === 'pencil' ? 'var(--warm-ivory)' : 'var(--warm-ink)',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
              }}
            >
              <Pencil size={15} />
              Pencil
            </button>
            <button
              onClick={() => setBrushType('highlighter')}
              style={{
                background: brushType === 'highlighter' ? 'var(--terracotta)' : 'transparent',
                color: brushType === 'highlighter' ? 'var(--warm-ivory)' : 'var(--warm-ink)',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
              }}
            >
              <Highlighter size={15} />
              Marker
            </button>
            <button
              onClick={() => setBrushType('eraser')}
              style={{
                background: brushType === 'eraser' ? 'var(--terracotta)' : 'transparent',
                color: brushType === 'eraser' ? 'var(--warm-ivory)' : 'var(--warm-ink)',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
              }}
            >
              <Eraser size={15} />
              Eraser
            </button>
          </div>

          <div style={{ height: '20px', width: '1px', backgroundColor: 'rgba(44, 31, 21, 0.2)' }} />

          {/* Brand Palette Colors */}
          {brushType !== 'eraser' && (
            <div style={{ display: 'flex', gap: '6px' }}>
              {colors.map((c) => {
                // Ensure text visibility on the select color dot
                const isSelected = strokeColor === c.value;
                return (
                  <button
                    key={c.value}
                    onClick={() => setStrokeColor(c.value)}
                    title={c.name}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: c.value,
                      border: isSelected
                        ? `2px solid ${theme === 'dark' ? 'var(--warm-ivory)' : 'var(--warm-ink)'}`
                        : '1px solid rgba(44, 31, 21, 0.3)',
                      cursor: 'pointer',
                      transform: isSelected ? 'scale(1.2)' : 'none',
                      transition: 'transform 0.1s ease',
                    }}
                  />
                );
              })}
            </div>
          )}

          <div style={{ height: '20px', width: '1px', backgroundColor: 'rgba(44, 31, 21, 0.2)' }} />

          {/* Brush Sizes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--warm-ink)' }}>Size:</span>
            {[3, 6, 12, 24].map((size) => (
              <button
                key={size}
                onClick={() => setBrushSize(size)}
                style={{
                  width: `${size / 2 + 12}px`,
                  height: `${size / 2 + 12}px`,
                  borderRadius: '50%',
                  backgroundColor: 'var(--warm-ink)',
                  border: brushSize === size ? '2px solid var(--terracotta)' : 'none',
                  cursor: 'pointer',
                  opacity: brushSize === size ? 1.0 : 0.4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={`${size}px`}
              />
            ))}
          </div>

          <div style={{ height: '20px', width: '1px', backgroundColor: 'rgba(44, 31, 21, 0.2)' }} />

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                opacity: history.length === 0 ? 0.3 : 0.8,
                padding: '4px',
                color: 'var(--warm-ink)',
              }}
              title="Undo"
            >
              <Undo size={16} />
            </button>
            <button
              onClick={handleClear}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                opacity: 0.8,
                padding: '4px',
                color: 'var(--warm-ink)',
              }}
              title="Clear Canvas"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
