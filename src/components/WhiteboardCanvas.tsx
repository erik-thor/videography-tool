import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Pencil, Highlighter, Eraser, Trash2, Undo, Sparkles, ZoomIn, ZoomOut } from 'lucide-react';
import { BulletJournalView } from './BulletJournalView';

interface WhiteboardCanvasProps {
  isActive: boolean;
  drawOnTop: boolean;
  theme: 'light' | 'dark';
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  brushType: 'pencil' | 'highlighter' | 'eraser' | 'text';
  setBrushType: (type: 'pencil' | 'highlighter' | 'eraser' | 'text') => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  clearTrigger: number;
  undoTrigger?: number;
  restoreDataUrl?: string;
  showToolbar?: boolean;
  template?: 'blank' | 'bullet';
  bulletJournalData?: any;
  onBulletJournalDataChange?: (data: any) => void;
}

interface AiDrawCommand {
  type: 'circle' | 'rect' | 'line' | 'text';
  x: number;
  y: number;
  x2?: number;
  y2?: number;
  radius?: number;
  width?: number;
  height?: number;
  text?: string;
  color?: string;
  lineWidth?: number;
}

const drawSpline = (ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[]) => {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  if (pts.length === 2) {
    ctx.lineTo(pts[1].x, pts[1].y);
  } else {
    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  }
  ctx.stroke();
};

interface DetectedShape {
  type: 'line' | 'circle' | 'rect';
  points: { x: number; y: number }[];
  finalCmd: {
    type: 'line' | 'circle' | 'rect';
    x: number;
    y: number;
    x2?: number;
    y2?: number;
    radius?: number;
    width?: number;
    height?: number;
  };
}

const detectShape = (pts: { x: number; y: number }[]): DetectedShape | null => {
  if (pts.length < 10) return null;
  const p0 = pts[0];
  const pn = pts[pts.length - 1];
  
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const w = maxX - minX;
  const h = maxY - minY;
  if (w < 20 || h < 20) return null;

  const dx = pn.x - p0.x;
  const dy = pn.y - p0.y;
  const startEndDist = Math.sqrt(dx * dx + dy * dy);
  
  let pathLen = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const dX = pts[i+1].x - pts[i].x;
    const dY = pts[i+1].y - pts[i].y;
    pathLen += Math.sqrt(dX * dX + dY * dY);
  }

  // 1. Line check
  if (startEndDist > 40) {
    let maxDev = 0;
    for (const p of pts) {
      const num = Math.abs((pn.y - p0.y) * p.x - (pn.x - p0.x) * p.y + pn.x * p0.y - pn.y * p0.x);
      const den = startEndDist;
      const dev = num / den;
      if (dev > maxDev) maxDev = dev;
    }
    if (maxDev < 20 || maxDev / startEndDist < 0.15) {
      const targets: { x: number; y: number }[] = [];
      const N = pts.length;
      for (let i = 0; i < N; i++) {
        const ratio = i / (N - 1);
        targets.push({
          x: p0.x + (pn.x - p0.x) * ratio,
          y: p0.y + (pn.y - p0.y) * ratio
        });
      }
      return {
        type: 'line',
        points: targets,
        finalCmd: { type: 'line', x: p0.x, y: p0.y, x2: pn.x, y2: pn.y }
      };
    }
  }

  // 2. Loop check (Circle or Rectangle)
  const isClosed = startEndDist < 100 || startEndDist / pathLen < 0.3;
  if (isClosed) {
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    let distSum = 0;

    const dists = pts.map(p => {
      const d = Math.sqrt((p.x - cx) * (p.x - cx) + (p.y - cy) * (p.y - cy));
      distSum += d;
      return d;
    });
    const avgR = distSum / pts.length;
    let variance = 0;
    for (const d of dists) {
      variance += (d - avgR) * (d - avgR);
    }
    const stdDev = Math.sqrt(variance / pts.length);
    const circularity = stdDev / avgR;

    if (circularity < 0.18) {
      const targets = pts.map(p => {
        const angle = Math.atan2(p.y - cy, p.x - cx);
        return {
          x: cx + avgR * Math.cos(angle),
          y: cy + avgR * Math.sin(angle)
        };
      });
      return {
        type: 'circle',
        points: targets,
        finalCmd: { type: 'circle', x: cx, y: cy, radius: avgR }
      };
    }

    // Rectangle check
    let devSum = 0;
    for (const p of pts) {
      const dLeft = Math.abs(p.x - minX);
      const dRight = Math.abs(p.x - maxX);
      const dTop = Math.abs(p.y - minY);
      const dBottom = Math.abs(p.y - maxY);
      devSum += Math.min(dLeft, dRight, dTop, dBottom);
    }
    const avgRectDev = devSum / pts.length;
    if (avgRectDev > Math.min(w, h) * 0.12) {
      return null;
    }

    const targets = pts.map(p => {
      const dLeft = Math.abs(p.x - minX);
      const dRight = Math.abs(p.x - maxX);
      const dTop = Math.abs(p.y - minY);
      const dBottom = Math.abs(p.y - maxY);
      const minDist = Math.min(dLeft, dRight, dTop, dBottom);
      if (minDist === dLeft) return { x: minX, y: p.y };
      if (minDist === dRight) return { x: maxX, y: p.y };
      if (minDist === dTop) return { x: p.x, y: minY };
      return { x: p.x, y: maxY };
    });
    return {
      type: 'rect',
      points: targets,
      finalCmd: { type: 'rect', x: cx, y: cy, width: w, height: h }
    };
  }

  return null;
};

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
  template = 'blank',
  bulletJournalData,
  onBulletJournalDataChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textInputRef = useRef<HTMLInputElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const isDrawingRef = useRef(false); // Mirror for event handler access without re-registration
  const [history, setHistory] = useState<string[]>([]);
  const [textInput, setTextInput] = useState<{ x: number; y: number; val: string } | null>(null);
  const historyRef = useRef<string[]>([]);
  historyRef.current = history;

  // Point buffer for smooth quadratic curve drawing
  const pointsRef = useRef<{ x: number; y: number }[]>([]);

  // Queue for AI draw commands received while user is actively drawing
  const drawingQueueRef = useRef<AiDrawCommand[]>([]);

  const [zenAssistEnabled, setZenAssistEnabled] = useState<boolean>(true);
  const activeStrokeSaveRef = useRef<ImageData | null>(null);

  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const zoomRef = useRef(1.0);
  const panRef = useRef({ x: 0, y: 0 });
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);

  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const spacePressedRef = useRef(false);
  
  const panStartRef = useRef<{ mouseX: number; mouseY: number; panX: number; panY: number } | null>(null);

  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsSpacePressed(true);
        spacePressedRef.current = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setIsSpacePressed(false);
        spacePressedRef.current = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isActive]);

  // Intercept trackpad pinch-to-zoom (wheel + ctrlKey) on the container to prevent standard page zoom and apply canvas zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isActive) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const rect = container.getBoundingClientRect();
        // Mouse client position converted to scaled 1920x1080 coords
        const lx = (e.clientX - rect.left) * (1920 / rect.width);
        const ly = (e.clientY - rect.top) * (1080 / rect.height);
        
        const zoomFactor = 1.05;
        let newZoom = zoomRef.current;
        if (e.deltaY < 0) {
          // Zoom in
          newZoom = Math.min(3.0, zoomRef.current * zoomFactor);
        } else {
          // Zoom out
          newZoom = Math.max(0.5, zoomRef.current / zoomFactor);
        }
        
        newZoom = Math.round(newZoom * 1000) / 1000;
        
        if (newZoom !== zoomRef.current) {
          const currentPan = panRef.current;
          // Calculate new pan to zoom towards the mouse cursor
          const newPanX = lx / newZoom - (lx / zoomRef.current - currentPan.x);
          const newPanY = ly / newZoom - (ly / zoomRef.current - currentPan.y);
          
          setZoom(newZoom);
          setPan({ x: newPanX, y: newPanY });
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [isActive]);

  const colors = [
    { name: 'Ink', value: '#2C1F15' },
    { name: 'Ivory', value: '#F4EAD5' },
    { name: 'Rose', value: '#E8B09A' },
    { name: 'Terracotta', value: '#B8674A' },
    { name: 'Gold', value: '#C9A563' },
    { name: 'Sage', value: '#8AA68E' },
    { name: 'Slate', value: '#7B91B8' },
  ];

  // ─── Canvas Setup ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 1920;
    canvas.height = 1080;
    if (!drawOnTop) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = theme === 'dark' ? '#2C1F15' : '#F4EAD5';
        ctx.fillRect(0, 0, 1920, 1080);
      }
    }
  }, [drawOnTop, theme]);

  // ─── Save history snapshot ────────────────────────────────────────────────
  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL();
    setHistory(prev => [...prev.slice(-19), url]);
  }, []);

  // ─── Fill canvas background ───────────────────────────────────────────────
  const fillBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!drawOnTop) {
      ctx.fillStyle = theme === 'dark' ? '#2C1F15' : '#F4EAD5';
      ctx.fillRect(0, 0, 1920, 1080);
    }
  }, [drawOnTop, theme]);

  // ─── Undo ────────────────────────────────────────────────────────────────
  const performUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || historyRef.current.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    setHistory(h => h.slice(0, -1));
    const img = new Image();
    img.src = prev;
    img.onload = () => {
      ctx.clearRect(0, 0, 1920, 1080);
      fillBackground(ctx);
      ctx.drawImage(img, 0, 0);
    };
  }, [fillBackground]);

  // ─── Clear canvas ─────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    saveHistory();
    ctx.clearRect(0, 0, 1920, 1080);
    fillBackground(ctx);
  }, [fillBackground, saveHistory]);

  // ─── External triggers ───────────────────────────────────────────────────
  useEffect(() => { if (clearTrigger > 0) handleClear(); }, [clearTrigger]);
  useEffect(() => { if (undoTrigger > 0) performUndo(); }, [undoTrigger]);

  // ─── Scene restoration ───────────────────────────────────────────────────
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
        fillBackground(ctx);
        ctx.drawImage(img, 0, 0);
      };
    } else {
      ctx.clearRect(0, 0, 1920, 1080);
      fillBackground(ctx);
    }
  }, [restoreDataUrl, fillBackground]);

  // ─── Ctrl+Z keyboard shortcut ────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive) return;
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        performUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, performUndo]);

  // ─── Auto-focus text input when it mounts ───────────────────────────────
  useEffect(() => {
    if (textInput && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [textInput]);

  // ─── Commit text to canvas ───────────────────────────────────────────────
  const commitText = useCallback(() => {
    if (!textInput) return;
    const { x, y, val } = textInput;
    setTextInput(null);
    if (!val.trim()) return;
    saveHistory();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const fontSize = Math.max(24, brushSize * 4);
    ctx.imageSmoothingEnabled = true;
    ctx.textBaseline = 'top';
    ctx.font = `700 ${fontSize}px 'Caveat', 'Architects Daughter', cursive`;
    ctx.fillStyle = strokeColor;
    ctx.fillText(val, x, y);
  }, [textInput, saveHistory, strokeColor, brushSize]);

  // ─── Apply an AI draw command directly to canvas ─────────────────────────
  const applyAiCommand = useCallback((cmd: AiDrawCommand) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.strokeStyle = cmd.color || '#B8674A';
    ctx.fillStyle = cmd.color || '#B8674A';
    ctx.lineWidth = cmd.lineWidth || 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.85;
    if (cmd.type === 'circle') {
      const r = cmd.radius || 60;
      ctx.beginPath();
      ctx.arc(cmd.x, cmd.y, r, 0, Math.PI * 2);
      ctx.stroke();
    } else if (cmd.type === 'rect') {
      const w = cmd.width || 160;
      const h = cmd.height || 90;
      ctx.strokeRect(cmd.x - w / 2, cmd.y - h / 2, w, h);
    } else if (cmd.type === 'line' && cmd.x2 !== undefined && cmd.y2 !== undefined) {
      ctx.beginPath();
      ctx.moveTo(cmd.x, cmd.y);
      ctx.lineTo(cmd.x2, cmd.y2);
      ctx.stroke();
    } else if (cmd.type === 'text' && cmd.text) {
      ctx.imageSmoothingEnabled = true;
      ctx.textBaseline = 'top';
      ctx.font = `700 32px 'Caveat', 'Architects Daughter', cursive`;
      ctx.globalAlpha = 1;
      ctx.fillText(cmd.text, cmd.x, cmd.y);
    }
    ctx.restore();
  }, []);

  // ─── Animate AI drawing sequential strokes ────────────────────────────────
  const animateAiDraw = useCallback((commands: AiDrawCommand[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save history BEFORE starting animation so users can undo the entire AI draw block
    saveHistory();

    const baseImg = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let currentCmdIndex = 0;
    let startTime = 0;
    const durationPerCommand = 400; // ms
    const completedCommands: AiDrawCommand[] = [];

    const drawCommandPartial = (cmd: AiDrawCommand, t: number) => {
      ctx.save();
      ctx.strokeStyle = cmd.color || '#B8674A';
      ctx.fillStyle = cmd.color || '#B8674A';
      ctx.lineWidth = cmd.lineWidth || 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.85;

      if (cmd.type === 'circle') {
        const r = cmd.radius || 60;
        ctx.beginPath();
        ctx.arc(cmd.x, cmd.y, r, 0, Math.PI * 2 * t);
        ctx.stroke();
      } else if (cmd.type === 'rect') {
        const w = cmd.width || 160;
        const h = cmd.height || 90;
        const x1 = cmd.x - w / 2;
        const y1 = cmd.y - h / 2;
        ctx.beginPath();
        const perimeter = 2 * w + 2 * h;
        const targetLen = perimeter * t;
        let drawn = 0;
        ctx.moveTo(x1, y1);
        // Top edge
        if (drawn < targetLen) {
          const seg = Math.min(w, targetLen - drawn);
          ctx.lineTo(x1 + seg, y1);
          drawn += seg;
        }
        // Right edge
        if (drawn < targetLen) {
          const seg = Math.min(h, targetLen - drawn);
          ctx.lineTo(x1 + w, y1 + seg);
          drawn += seg;
        }
        // Bottom edge
        if (drawn < targetLen) {
          const seg = Math.min(w, targetLen - drawn);
          ctx.lineTo(x1 + w - seg, y1 + h);
          drawn += seg;
        }
        // Left edge
        if (drawn < targetLen) {
          const seg = Math.min(h, targetLen - drawn);
          ctx.lineTo(x1, y1 + h - seg);
          drawn += seg;
        }
        ctx.stroke();
      } else if (cmd.type === 'line' && cmd.x2 !== undefined && cmd.y2 !== undefined) {
        ctx.beginPath();
        ctx.moveTo(cmd.x, cmd.y);
        ctx.lineTo(cmd.x + (cmd.x2 - cmd.x) * t, cmd.y + (cmd.y2 - cmd.y) * t);
        ctx.stroke();
      } else if (cmd.type === 'text' && cmd.text) {
        ctx.imageSmoothingEnabled = true;
        ctx.textBaseline = 'top';
        ctx.font = `700 32px 'Caveat', 'Architects Daughter', cursive`;
        ctx.globalAlpha = 1;
        const charCount = Math.ceil(cmd.text.length * t);
        ctx.fillText(cmd.text.substring(0, charCount), cmd.x, cmd.y);
      }
      ctx.restore();
    };

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      // Clear to original state
      ctx.putImageData(baseImg, 0, 0);
      
      // Draw completed commands fully
      completedCommands.forEach(applyAiCommand);
      
      if (currentCmdIndex < commands.length) {
        const cmd = commands[currentCmdIndex];
        const t = Math.min(1, elapsed / durationPerCommand);
        drawCommandPartial(cmd, t);
        
        if (t >= 1) {
          completedCommands.push(cmd);
          currentCmdIndex++;
          startTime = 0;
        }
        requestAnimationFrame(animate);
      } else {
        // Redraw all in final form on canvas permanently
        completedCommands.forEach(applyAiCommand);
      }
    };

    requestAnimationFrame(animate);
  }, [applyAiCommand, saveHistory]);

  // ─── AI draw event listener ──────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) return;
    const handleAiDraw = (e: Event) => {
      const commands: AiDrawCommand[] = (e as CustomEvent).detail;
      if (!Array.isArray(commands)) return;
      if (isDrawingRef.current) {
        drawingQueueRef.current.push(...commands);
      } else {
        animateAiDraw(commands);
      }
    };
    window.addEventListener('ai-draw', handleAiDraw);
    return () => window.removeEventListener('ai-draw', handleAiDraw);
  }, [isActive, animateAiDraw]);

  // ─── Coord mapping (1920×1080) ───────────────────────────────────────────
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const lx = (e.clientX - rect.left) * (1920 / rect.width);
    const ly = (e.clientY - rect.top) * (1080 / rect.height);
    return {
      x: Math.round(lx / zoomRef.current - panRef.current.x),
      y: Math.round(ly / zoomRef.current - panRef.current.y),
    };
  };

  // ─── Start drawing ────────────────────────────────────────────────────────
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isActive) return;

    // Check if middle click or Space is held down
    const isPanningMode = e.button === 1 || spacePressedRef.current;
    if (isPanningMode) {
      e.preventDefault();
      panStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        panX: panRef.current.x,
        panY: panRef.current.y
      };
      return;
    }

    if (brushType === 'text') {
      e.preventDefault(); // Don't let the click blur the text input
      if (textInput) {
        commitText();
      }
      const { x, y } = getCanvasCoords(e);
      setTextInput({ x, y, val: '' });
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    saveHistory();
    const { x, y } = getCanvasCoords(e);
    pointsRef.current = [{ x, y }];
    activeStrokeSaveRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    isDrawingRef.current = true;
  };

  // ─── Draw (smooth quadratic curves) ──────────────────────────────────────
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isActive) return;

    if (panStartRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dx = e.clientX - panStartRef.current.mouseX;
      const dy = e.clientY - panStartRef.current.mouseY;
      const appScale = rect.width / 1920;
      const dx_canvas = dx / appScale;
      const dy_canvas = dy / appScale;
      setPan({
        x: panStartRef.current.panX + dx_canvas / zoomRef.current,
        y: panStartRef.current.panY + dy_canvas / zoomRef.current
      });
      return;
    }

    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    const pts = pointsRef.current;
    pts.push({ x, y });

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'source-over';

    if (brushType === 'eraser') {
      if (drawOnTop) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = brushSize * 3;
      } else {
        ctx.strokeStyle = theme === 'dark' ? '#2C1F15' : '#F4EAD5';
        ctx.lineWidth = brushSize * 3;
      }
      if (pts.length >= 3) {
        const last = pts[pts.length - 1];
        const prev = pts[pts.length - 2];
        const mid = { x: (prev.x + last.x) / 2, y: (prev.y + last.y) / 2 };
        const prevMid = { x: (pts[pts.length - 3].x + prev.x) / 2, y: (pts[pts.length - 3].y + prev.y) / 2 };
        ctx.beginPath();
        ctx.moveTo(prevMid.x, prevMid.y);
        ctx.quadraticCurveTo(prev.x, prev.y, mid.x, mid.y);
        ctx.stroke();
      } else if (pts.length === 2) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.stroke();
      }
    } else if (brushType === 'highlighter') {
      if (activeStrokeSaveRef.current) {
        ctx.putImageData(activeStrokeSaveRef.current, 0, 0);
      }
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = brushSize * 3;
      drawSpline(ctx, pts);
      ctx.restore();
    } else {
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = brushSize;
      if (pts.length >= 3) {
        const last = pts[pts.length - 1];
        const prev = pts[pts.length - 2];
        const mid = { x: (prev.x + last.x) / 2, y: (prev.y + last.y) / 2 };
        const prevMid = { x: (pts[pts.length - 3].x + prev.x) / 2, y: (pts[pts.length - 3].y + prev.y) / 2 };
        ctx.beginPath();
        ctx.moveTo(prevMid.x, prevMid.y);
        ctx.quadraticCurveTo(prev.x, prev.y, mid.x, mid.y);
        ctx.stroke();
      } else if (pts.length === 2) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
  };

  // ─── Stop drawing ─────────────────────────────────────────────────────────
  const stopDrawing = () => {
    if (panStartRef.current) {
      panStartRef.current = null;
      return;
    }
    if (!isDrawing) return;

    const pts = pointsRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (pts.length >= 2 && ctx && brushType !== 'highlighter') {
      const last = pts[pts.length - 1];
      const prev = pts[pts.length - 2];
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (brushType === 'eraser') {
        if (drawOnTop) {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.lineWidth = brushSize * 3;
        } else {
          ctx.strokeStyle = theme === 'dark' ? '#2C1F15' : '#F4EAD5';
          ctx.lineWidth = brushSize * 3;
        }
      } else {
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = brushSize;
      }
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
      ctx.restore();
    }

    if (pts.length >= 2 && ctx && brushType === 'highlighter' && activeStrokeSaveRef.current) {
      ctx.putImageData(activeStrokeSaveRef.current, 0, 0);
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = brushSize * 3;
      drawSpline(ctx, pts);
      ctx.restore();
    }

    setIsDrawing(false);
    isDrawingRef.current = false;

    const flushAiQueue = () => {
      if (drawingQueueRef.current.length > 0) {
        const queued = [...drawingQueueRef.current];
        drawingQueueRef.current = [];
        animateAiDraw(queued);
      }
    };

    if (zenAssistEnabled && pts.length >= 10 && ctx && canvas && activeStrokeSaveRef.current && brushType !== 'eraser') {
      const detected = detectShape(pts);
      if (detected) {
        let startT = 0;
        const morphDuration = 180;
        const originalPts = [...pts];
        const targetPts = detected.points;
        const savedImg = activeStrokeSaveRef.current;
        
        const animateMorph = (timestamp: number) => {
          if (!startT) startT = timestamp;
          const elapsed = timestamp - startT;
          const progress = Math.min(1, elapsed / morphDuration);
          const easeProgress = progress * (2 - progress);
          
          ctx.putImageData(savedImg, 0, 0);
          
          const interpolatedPts = originalPts.map((p, idx) => {
            const tP = targetPts[idx] || targetPts[targetPts.length - 1];
            return {
              x: p.x + (tP.x - p.x) * easeProgress,
              y: p.y + (tP.y - p.y) * easeProgress
            };
          });
          
          ctx.save();
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          if (brushType === 'highlighter') {
            ctx.globalAlpha = 0.35;
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = brushSize * 3;
          } else {
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = brushSize;
          }
          drawSpline(ctx, interpolatedPts);
          ctx.restore();
          
          if (progress < 1) {
            requestAnimationFrame(animateMorph);
          } else {
            ctx.putImageData(savedImg, 0, 0);
            ctx.save();
            ctx.strokeStyle = strokeColor;
            ctx.fillStyle = strokeColor;
            ctx.lineWidth = brushType === 'highlighter' ? brushSize * 3 : brushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalAlpha = brushType === 'highlighter' ? 0.35 : 1.0;

            const cmd = detected.finalCmd;
            if (cmd.type === 'circle' && cmd.radius !== undefined) {
              ctx.beginPath();
              ctx.arc(cmd.x, cmd.y, cmd.radius, 0, Math.PI * 2);
              ctx.stroke();
            } else if (cmd.type === 'rect' && cmd.width !== undefined && cmd.height !== undefined) {
              ctx.strokeRect(cmd.x - cmd.width / 2, cmd.y - cmd.height / 2, cmd.width, cmd.height);
            } else if (cmd.type === 'line' && cmd.x2 !== undefined && cmd.y2 !== undefined) {
              ctx.beginPath();
              ctx.moveTo(cmd.x, cmd.y);
              ctx.lineTo(cmd.x2, cmd.y2);
              ctx.stroke();
            }
            ctx.restore();
            
            saveHistory();
            activeStrokeSaveRef.current = null;
            flushAiQueue();
          }
        };
        requestAnimationFrame(animateMorph);
        pointsRef.current = [];
        return;
      }
    }

    activeStrokeSaveRef.current = null;
    pointsRef.current = [];
    saveHistory();
    flushAiQueue();
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: isActive ? 'auto' : 'none',
        zIndex: 30,
        overflow: 'hidden',
      }}
    >
      {/* Zoomable & Pannable Inner Container */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '1920px',
          height: '1080px',
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: '0 0',
        }}
      >
        {template === 'bullet' && (
          <BulletJournalView
            theme={theme}
            data={bulletJournalData}
            onChange={onBulletJournalDataChange}
          />
        )}
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className={`w-full h-full ${isActive ? 'canvas-interactive' : ''}`}
          style={{
            cursor: isSpacePressed
              ? (panStartRef.current ? 'grabbing' : 'grab')
              : (brushType === 'text' ? 'text' : 'crosshair'),
            pointerEvents: isActive ? 'auto' : 'none',
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            backgroundColor: template === 'bullet' ? 'transparent' : undefined,
          }}
        />

        {textInput && (
          <input
            ref={textInputRef}
            type="text"
            value={textInput.val}
            onChange={e => setTextInput(prev => prev ? { ...prev, val: e.target.value } : null)}
            onKeyDown={e => {
              e.stopPropagation();
              if (e.key === 'Enter') { commitText(); }
              else if (e.key === 'Escape') { setTextInput(null); }
            }}
            onBlur={commitText}
            style={{
              position: 'absolute',
              left: `${textInput.x}px`,
              top: `${textInput.y}px`,
              transform: 'translateY(0)',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: strokeColor,
              fontFamily: "'Caveat', 'Architects Daughter', cursive",
              fontSize: `${Math.max(24, brushSize * 4)}px`,
              fontWeight: 700,
              zIndex: 100,
              width: '700px',
              caretColor: strokeColor,
              pointerEvents: 'auto',
            }}
          />
        )}
      </div>

      {/* Floating Canvas Brush Controls */}
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
            {[
              { type: 'pencil' as const, icon: <Pencil size={15} />, label: 'Pencil' },
              { type: 'highlighter' as const, icon: <Highlighter size={15} />, label: 'Marker' },
              { type: 'eraser' as const, icon: <Eraser size={15} />, label: 'Eraser' },
            ].map(({ type, icon, label }) => (
              <button
                key={type}
                onClick={() => setBrushType(type)}
                style={{
                  background: brushType === type ? 'var(--terracotta)' : 'transparent',
                  color: brushType === type ? 'var(--warm-ivory)' : 'var(--warm-ink)',
                  border: 'none', padding: '6px 10px', borderRadius: '6px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px',
                }}
              >{icon} {label}</button>
            ))}
          </div>

          <div style={{ height: '20px', width: '1px', backgroundColor: 'rgba(44, 31, 21, 0.2)' }} />

          {brushType !== 'eraser' && (
            <div style={{ display: 'flex', gap: '6px' }}>
              {colors.map(c => (
                <button
                  key={c.value}
                  onClick={() => setStrokeColor(c.value)}
                  title={c.name}
                  style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    backgroundColor: c.value,
                    border: strokeColor === c.value
                      ? `2px solid ${theme === 'dark' ? 'var(--warm-ivory)' : 'var(--warm-ink)'}`
                      : '1px solid rgba(44, 31, 21, 0.3)',
                    cursor: 'pointer',
                    transform: strokeColor === c.value ? 'scale(1.2)' : 'none',
                    transition: 'transform 0.1s ease',
                  }}
                />
              ))}
            </div>
          )}

          <div style={{ height: '20px', width: '1px', backgroundColor: 'rgba(44, 31, 21, 0.2)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--warm-ink)' }}>Size:</span>
            {[3, 6, 12, 24].map(size => (
              <button
                key={size}
                onClick={() => setBrushSize(size)}
                style={{
                  width: `${size / 2 + 12}px`, height: `${size / 2 + 12}px`,
                  borderRadius: '50%', backgroundColor: 'var(--warm-ink)',
                  border: brushSize === size ? '2px solid var(--terracotta)' : 'none',
                  cursor: 'pointer', opacity: brushSize === size ? 1.0 : 0.4,
                }}
                title={`${size}px`}
              />
            ))}
          </div>

          <div style={{ height: '20px', width: '1px', backgroundColor: 'rgba(44, 31, 21, 0.2)' }} />

          {/* Zoom Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                setZoom(prev => Math.max(0.5, Math.round((prev - 0.1) * 10) / 10));
              }}
              disabled={zoom <= 0.5}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                opacity: zoom <= 0.5 ? 0.3 : 0.8, padding: '4px', color: 'var(--warm-ink)',
                display: 'flex', alignItems: 'center'
              }}
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <span
              onClick={() => {
                setZoom(1.0);
                setPan({ x: 0, y: 0 });
              }}
              style={{
                fontSize: '12px', color: 'var(--warm-ink)', cursor: 'pointer',
                width: '36px', textAlign: 'center', fontWeight: 600,
                opacity: 0.8, userSelect: 'none'
              }}
              title="Reset Zoom & Pan"
            >
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => {
                setZoom(prev => Math.min(3.0, Math.round((prev + 0.1) * 10) / 10));
              }}
              disabled={zoom >= 3.0}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                opacity: zoom >= 3.0 ? 0.3 : 0.8, padding: '4px', color: 'var(--warm-ink)',
                display: 'flex', alignItems: 'center'
              }}
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
          </div>

          <div style={{ height: '20px', width: '1px', backgroundColor: 'rgba(44, 31, 21, 0.2)' }} />

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setZenAssistEnabled(!zenAssistEnabled)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                opacity: zenAssistEnabled ? 1.0 : 0.4, padding: '4px',
                color: zenAssistEnabled ? 'var(--terracotta)' : 'var(--warm-ink)',
                display: 'flex', alignItems: 'center'
              }}
              title="Zen Assist (Auto-smooth shapes)"
            ><Sparkles size={16} /></button>
            <button
              onClick={performUndo}
              disabled={history.length === 0}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                opacity: history.length === 0 ? 0.3 : 0.8, padding: '4px', color: 'var(--warm-ink)',
              }}
              title="Undo"
            ><Undo size={16} /></button>
            <button
              onClick={handleClear}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.8, padding: '4px', color: 'var(--warm-ink)' }}
              title="Clear Canvas"
            ><Trash2 size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
};
