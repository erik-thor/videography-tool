import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Plus, Trash2, GripHorizontal, EyeOff, CheckSquare, Square, Upload, Globe, Image as ImageIcon, Youtube } from 'lucide-react';

interface DragProps {
  title: string;
  defaultX: number;
  defaultY: number;
  scale: number;
  onClose: () => void;
  children: React.ReactNode;
  theme: 'light' | 'dark';
  width?: number;
}

export const DraggableWidget: React.FC<DragProps> = ({
  title,
  defaultX,
  defaultY,
  scale,
  onClose,
  children,
  theme,
  width,
}) => {
  const [pos, setPos] = useState({ x: defaultX, y: defaultY });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, widgetX: 0, widgetY: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag from the header grip or header bar
    const target = e.target as HTMLElement;
    if (target.closest('.close-btn')) return; // ignore close clicks

    setIsDragging(true);
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      widgetX: pos.x,
      widgetY: pos.y,
    };
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.mouseX;
      const dy = e.clientY - dragStart.current.mouseY;
      
      // Compensate for CSS scale transform
      setPos({
        x: dragStart.current.widgetX + dx / scale,
        y: dragStart.current.widgetY + dy / scale,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, scale]);

  return (
    <div
      className="editorial-panel"
      style={{
        position: 'absolute',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: width ? `${width}px` : '400px',
        // When dragging, elevate above the sidebar (z-index 200) so the widget is always visible
        zIndex: isDragging ? 9999 : 1000,
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius)',
        overflow: 'hidden',
        pointerEvents: 'auto',
      }}
    >
      {/* Header bar */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid var(--border-color)',
          cursor: isDragging ? 'grabbing' : 'grab',
          backgroundColor: theme === 'dark' ? 'rgba(44, 31, 21, 0.5)' : 'rgba(244, 234, 213, 0.5)',
          fontFamily: 'Inter, sans-serif',
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--warm-ink)',
          textTransform: 'lowercase',
          letterSpacing: '0.5px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <GripHorizontal size={14} style={{ opacity: 0.5 }} />
          <span>{title}</span>
        </div>
        <button
          className="close-btn"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--warm-ink)',
            opacity: 0.5,
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
          }}
        >
          <EyeOff size={14} />
        </button>
      </div>

      {/* Widget Content */}
      <div style={{ padding: '16px', color: 'var(--warm-ink)' }}>{children}</div>
    </div>
  );
};

// TIMER / STOPWATCH WIDGET
export const TimerWidget: React.FC<{ theme: 'light' | 'dark' }> = ({ theme: _theme }) => {
  const [mode, setMode] = useState<'stopwatch' | 'timer'>('stopwatch');
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0); // in seconds
  const [timerStart, setTimerStart] = useState(300); // 5 minutes default (300 seconds)
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTime((prev) => {
          if (mode === 'timer') {
            if (prev <= 1) {
              setIsRunning(false);
              if (timerRef.current) clearInterval(timerRef.current);
              return 0;
            }
            return prev - 1;
          } else {
            return prev + 1;
          }
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  const toggleRun = () => setIsRunning(!isRunning);

  const handleReset = () => {
    setIsRunning(false);
    setTime(mode === 'timer' ? timerStart : 0);
  };

  const handleModeChange = (newMode: 'stopwatch' | 'timer') => {
    setIsRunning(false);
    setMode(newMode);
    setTime(newMode === 'timer' ? timerStart : 0);
  };

  const handleQuickTimer = (seconds: number) => {
    setIsRunning(false);
    setTimerStart(seconds);
    setTime(seconds);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: 'Inter' }}>
      {/* Mode selectors */}
      <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
        <button
          onClick={() => handleModeChange('stopwatch')}
          style={{
            flex: 1,
            padding: '4px',
            border: 'none',
            background: mode === 'stopwatch' ? 'var(--terracotta)' : 'rgba(44, 31, 21, 0.08)',
            color: mode === 'stopwatch' ? 'var(--warm-ivory)' : 'var(--warm-ink)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Stopwatch
        </button>
        <button
          onClick={() => handleModeChange('timer')}
          style={{
            flex: 1,
            padding: '4px',
            border: 'none',
            background: mode === 'timer' ? 'var(--terracotta)' : 'rgba(44, 31, 21, 0.08)',
            color: mode === 'timer' ? 'var(--warm-ivory)' : 'var(--warm-ink)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Countdown
        </button>
      </div>

      {/* Orbitron-replaced clean editorial time display */}
      <div
        style={{
          fontFamily: 'Lora, serif',
          fontSize: '54px',
          fontWeight: 500,
          textAlign: 'center',
          padding: '10px 0',
          color: isRunning && mode === 'timer' && time < 30 ? 'var(--terracotta)' : 'var(--warm-ink)',
          letterSpacing: '1px',
        }}
      >
        {formatTime(time)}
      </div>

      {/* Timer Controls */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <button
          onClick={toggleRun}
          style={{
            background: 'none',
            border: '1.2px solid var(--warm-ink)',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: 'var(--warm-ink)',
          }}
        >
          {isRunning ? <Pause size={14} /> : <Play size={14} />}
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={handleReset}
          style={{
            background: 'none',
            border: '1.2px solid var(--warm-ink)',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: 'var(--warm-ink)',
          }}
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      {/* Quick Timer presets */}
      {mode === 'timer' && (
        <div style={{ display: 'flex', gap: '4px', fontSize: '11px', justifySelf: 'center' }}>
          {[60, 180, 300, 600].map((t) => (
            <button
              key={t}
              onClick={() => handleQuickTimer(t)}
              style={{
                flex: 1,
                padding: '4px 6px',
                border: 'none',
                backgroundColor: 'rgba(44, 31, 21, 0.06)',
                borderRadius: '4px',
                cursor: 'pointer',
                color: 'var(--warm-ink)',
              }}
            >
              {t / 60}m
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// CHECKLIST / AGENDA WIDGET
export const ChecklistWidget: React.FC = () => {
  const [items, setItems] = useState([
    { id: 1, text: 'Introduce the Core Conflict', done: true },
    { id: 2, text: 'Map the 8 Virtues of Self', done: false },
    { id: 3, text: 'Examine Cognitive Appraisals', done: false },
    { id: 4, text: 'Self Inquiry & Integration', done: false },
  ]);
  const [newItemText, setNewItemText] = useState('');

  const toggleDone = (id: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    setItems((prev) => [
      ...prev,
      { id: Date.now(), text: newItemText.trim(), done: false },
    ]);
    setNewItemText('');
  };

  const deleteItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: 'Inter' }}>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
        {items.map((item) => (
          <li
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '16px',
              opacity: item.done ? 0.5 : 1,
            }}
          >
            <div
              onClick={() => toggleDone(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              {item.done ? (
                <CheckSquare size={16} style={{ color: 'var(--terracotta)' }} />
              ) : (
                <Square size={16} />
              )}
              <span style={{ textDecoration: item.done ? 'line-through' : 'none' }}>
                {item.text}
              </span>
            </div>
            <button
              onClick={() => deleteItem(item.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--terracotta)',
                opacity: 0.6,
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
              }}
            >
              <Trash2 size={12} />
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="New talking point..."
          style={{
            flex: 1,
            padding: '6px 10px',
            fontSize: '13px',
            border: '1.2px solid var(--border-color)',
            borderRadius: '4px',
            outline: 'none',
            backgroundColor: 'transparent',
            color: 'var(--warm-ink)',
          }}
        />
        <button
          type="submit"
          style={{
            background: 'var(--terracotta)',
            border: 'none',
            color: 'var(--warm-ivory)',
            padding: '6px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
          }}
        >
          <Plus size={16} />
        </button>
      </form>
    </div>
  );
};

// MONOLOGUE TEXT SCRATCHPAD
export const ScratchpadWidget: React.FC = () => {
  const [text, setText] = useState(
    "JOURNAL OUTLINE\n----------------\n- Virtue is the capability of psychological regulation.\n- Adventure challenges safety to force evolution.\n- Compassion holds the tension of self/other.\n\nDouble click values in the circle graph to expand."
  );

  return (
    <div style={{ fontFamily: 'Lora, serif' }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        style={{
          width: '100%',
          border: 'none',
          outline: 'none',
          resize: 'vertical',
          backgroundColor: 'transparent',
          fontFamily: 'inherit',
          fontSize: '16px',
          lineHeight: '1.6',
          color: 'var(--warm-ink)',
        }}
      />
    </div>
  );
};

// AUDIO VISUALIZER GRAPHICS
export const VisualizerWidget: React.FC<{ theme: 'light' | 'dark' }> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const phase = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set size
    canvas.width = 368; // 400 minus padding
    canvas.height = 80;

    let animId: number;

    const render = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw subtle background grid
      ctx.strokeStyle = theme === 'dark' ? 'rgba(244, 234, 213, 0.05)' : 'rgba(44, 31, 21, 0.05)';
      ctx.lineWidth = 1;
      
      // vertical grid
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      // horizontal grid
      for (let i = 0; i < canvas.height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Draw waves
      const drawSineWave = (amplitude: number, freq: number, phaseShift: number, color: string, strokeWidth: number) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        
        for (let x = 0; x < canvas.width; x++) {
          const y = canvas.height / 2 + Math.sin(x * freq + phaseShift) * amplitude;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      };

      if (isRunning) {
        phase.current += 0.05;
      }

      // Layer multiple waves in brand colors
      // Wave 1: Sage
      drawSineWave(12, 0.03, phase.current, 'var(--sage)', 1.5);
      // Wave 2: Slate Blue
      drawSineWave(8, 0.05, -phase.current * 1.5, 'var(--slate-blue)', 1.2);
      // Wave 3: Terracotta
      drawSineWave(16, 0.02, phase.current * 0.7, 'var(--terracotta)', 1.0);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isRunning, theme]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
      <canvas
        ref={canvasRef}
        style={{
          border: '1.2px solid var(--border-color)',
          borderRadius: '4px',
          backgroundColor: theme === 'dark' ? 'rgba(44, 31, 21, 0.2)' : 'rgba(244, 234, 213, 0.2)',
        }}
      />
      <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: 'var(--warm-ink)' }}>
        <button
          onClick={() => setIsRunning(!isRunning)}
          style={{
            background: 'none',
            border: 'none',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontSize: '11px',
            color: 'inherit',
          }}
        >
          {isRunning ? 'Pause Wave' : 'Resume Wave'}
        </button>
        <span>Mock Audio Inputs Active</span>
      </div>
    </div>
  );
};

// MEDIA OVERLAY WIDGET (Images, URL, Youtube)
interface MediaWidgetProps {
  width: number;
  setWidth: (w: number) => void;
}

export const MediaWidget: React.FC<MediaWidgetProps> = ({ width, setWidth }) => {
  const [activeTab, setActiveTab] = useState<'image' | 'web'>('image');
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [webUrlInput, setWebUrlInput] = useState<string>('');
  const [loadedWebUrl, setLoadedWebUrl] = useState<string>('');
  const [youtubeId, setYoutubeId] = useState<string | null>(null);

  // Extract youtube video ID
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
    }
  };

  const handleLoadImageUrl = () => {
    if (imageUrlInput.trim()) {
      setImageSrc(imageUrlInput.trim());
    }
  };

  const handleLoadWebUrl = () => {
    const url = webUrlInput.trim();
    if (!url) return;
    
    setLoadedWebUrl(url);
    const ytId = getYoutubeId(url);
    setYoutubeId(ytId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Tabs Headers */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveTab('image')}
          style={{
            flex: 1,
            padding: '6px 10px',
            border: 'none',
            background: activeTab === 'image' ? 'var(--terracotta)' : 'rgba(44, 31, 21, 0.06)',
            color: activeTab === 'image' ? 'var(--warm-ivory)' : 'var(--warm-ink)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <ImageIcon size={13} />
          Image Overlay
        </button>
        <button
          onClick={() => setActiveTab('web')}
          style={{
            flex: 1,
            padding: '6px 10px',
            border: 'none',
            background: activeTab === 'web' ? 'var(--terracotta)' : 'rgba(44, 31, 21, 0.06)',
            color: activeTab === 'web' ? 'var(--warm-ivory)' : 'var(--warm-ink)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Globe size={13} />
          Browser / Video
        </button>
      </div>

      {/* Tab Panel: Image */}
      {activeTab === 'image' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* File Upload picker */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              border: '1px dashed var(--border-color)',
              borderRadius: '6px',
              padding: '12px',
              cursor: 'pointer',
              fontSize: '13px',
              color: 'var(--warm-ink)',
            }}
          >
            <Upload size={14} style={{ color: 'var(--terracotta)' }} />
            <span>Select screenshot / photo</span>
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
          </label>

          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', fontSize: '11px', opacity: 0.5, justifyContent: 'center' }}>
            <span>— or paste direct image link —</span>
          </div>

          {/* URL Input */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="Paste image link here..."
              style={{
                flex: 1,
                padding: '6px 10px',
                fontSize: '12px',
                border: '1.2px solid var(--border-color)',
                borderRadius: '4px',
                outline: 'none',
                backgroundColor: 'transparent',
                color: 'var(--warm-ink)',
              }}
            />
            <button
              onClick={handleLoadImageUrl}
              style={{
                background: 'none',
                border: '1.2px solid var(--warm-ink)',
                color: 'var(--warm-ink)',
                padding: '4px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              Load
            </button>
          </div>

          {/* Image preview rendering */}
          {imageSrc ? (
            <div style={{ position: 'relative', marginTop: '6px', border: '1.2px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
              <img
                src={imageSrc}
                alt="Overlay screenshot"
                style={{ width: '100%', maxHeight: '350px', objectFit: 'contain', display: 'block' }}
              />
              <button
                onClick={() => setImageSrc('')}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'rgba(44, 31, 21, 0.8)',
                  color: 'var(--warm-ivory)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                Clear
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '140px', border: '1.2px dashed var(--border-color)', borderRadius: '4px', opacity: 0.4 }}>
              <ImageIcon size={28} style={{ marginBottom: '6px' }} />
              <span style={{ fontSize: '11px' }}>No image loaded</span>
            </div>
          )}
        </div>
      )}

      {/* Tab Panel: Web */}
      {activeTab === 'web' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* Web URL input */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              value={webUrlInput}
              onChange={(e) => setWebUrlInput(e.target.value)}
              placeholder="Paste Youtube or blog URL..."
              style={{
                flex: 1,
                padding: '6px 10px',
                fontSize: '12px',
                border: '1.2px solid var(--border-color)',
                borderRadius: '4px',
                outline: 'none',
                backgroundColor: 'transparent',
                color: 'var(--warm-ink)',
              }}
            />
            <button
              onClick={handleLoadWebUrl}
              style={{
                background: 'none',
                border: '1.2px solid var(--warm-ink)',
                color: 'var(--warm-ink)',
                padding: '4px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              Embed
            </button>
          </div>

          {/* Render Web Frame / Video */}
          {loadedWebUrl ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              
              {youtubeId ? (
                // Youtube Embed
                <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '4px', border: '1.2px solid var(--border-color)' }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  />
                </div>
              ) : (
                // Generic Web iFrame
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <iframe
                    src={loadedWebUrl}
                    title="Web Browser Frame"
                    style={{
                      width: '100%',
                      height: '350px',
                      border: '1.2px solid var(--border-color)',
                      borderRadius: '4px',
                      backgroundColor: '#fff',
                    }}
                  />
                  <span style={{ fontSize: '10px', opacity: 0.5, fontStyle: 'italic', textAlign: 'center' }}>
                    Note: IFrame block restrictions may apply to certain sites (e.g. google, wikipedia).
                  </span>
                </div>
              )}

              <button
                onClick={() => {
                  setLoadedWebUrl('');
                  setYoutubeId(null);
                }}
                style={{
                  alignSelf: 'center',
                  background: 'none',
                  border: 'none',
                  textDecoration: 'underline',
                  color: 'var(--terracotta)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 500,
                }}
              >
                Remove Frame
              </button>

            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '140px', border: '1.2px dashed var(--border-color)', borderRadius: '4px', opacity: 0.4 }}>
              <Youtube size={28} style={{ marginBottom: '6px' }} />
              <span style={{ fontSize: '11px' }}>Paste link and click embed to display</span>
            </div>
          )}
        </div>
      )}

      <div style={{ height: '1px', backgroundColor: 'rgba(44, 31, 21, 0.1)', margin: '4px 0' }} />

      {/* Widget Width Control Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
        <span style={{ color: 'var(--warm-ink)', opacity: 0.7 }}>Panel Width:</span>
        <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
          {[320, 480, 640, 800].map((w) => (
            <button
              key={w}
              onClick={() => setWidth(w)}
              style={{
                flex: 1,
                padding: '4px',
                border: 'none',
                backgroundColor: width === w ? 'var(--terracotta)' : 'rgba(44, 31, 21, 0.08)',
                color: width === w ? 'var(--warm-ivory)' : 'var(--warm-ink)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '10px',
              }}
            >
              {w}px
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

