import React from 'react';
import {
  Pencil,
  Highlighter,
  Eraser,
  Type,
  Undo2,
  Trash2,
  Layout,
  PenTool,
  Globe,
  Zap,
  Pin,
  BookOpen,
  Map,
} from 'lucide-react';
import type { ViewMode } from '../App';

interface BottomToolbarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  whiteboardActive: boolean;
  whiteboardOnTop: boolean;
  onToggleDrawOnDiagram: () => void;
  flashlightActive: boolean;
  setFlashlightActive: (v: boolean) => void;
  strokeColor: string;
  setStrokeColor: (c: string) => void;
  brushType: 'pencil' | 'highlighter' | 'eraser' | 'text';
  setBrushType: (t: 'pencil' | 'highlighter' | 'eraser' | 'text') => void;
  brushSize: number;
  setBrushSize: (s: number) => void;
  onClear: () => void;
  onUndo: () => void;
  theme: 'light' | 'dark';
}

const PALETTE_COLORS = [
  { name: 'Ink', value: '#2C1F15' },
  { name: 'Ivory', value: '#F4EAD5' },
  { name: 'Blush', value: '#E8B09A' },
  { name: 'Terracotta', value: '#B8674A' },
  { name: 'Gold', value: '#C9A563' },
  { name: 'Sage', value: '#8AA68E' },
  { name: 'Slate', value: '#7B91B8' },
  { name: 'White', value: '#FFFFFF' },
];

const BRUSH_SIZES = [
  { label: 'XS', value: 3, dotSize: 8 },
  { label: 'S', value: 6, dotSize: 12 },
  { label: 'M', value: 12, dotSize: 17 },
  { label: 'L', value: 24, dotSize: 22 },
];

// Mode groups for the toolbar
const VIEW_MODES = [
  { mode: 'diagram' as ViewMode, icon: <Layout size={14} />, label: 'Diagrams' },
  { mode: 'whiteboard' as ViewMode, icon: <PenTool size={14} />, label: 'Whiteboard' },
  { mode: 'media' as ViewMode, icon: <Globe size={14} />, label: 'Media' },
  { mode: 'corkboard' as ViewMode, icon: <Pin size={14} />, label: 'Corkboard' },
  { mode: 'bullet-journal' as ViewMode, icon: <BookOpen size={14} />, label: 'Journal' },
  { mode: 'hero-journey' as ViewMode, icon: <Map size={14} />, label: "Hero's Journey" },
];

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  viewMode,
  setViewMode,
  whiteboardActive,
  whiteboardOnTop,
  onToggleDrawOnDiagram,
  flashlightActive,
  setFlashlightActive,
  strokeColor,
  setStrokeColor,
  brushType,
  setBrushType,
  brushSize,
  setBrushSize,
  onClear,
  onUndo,
}) => {
  const isDrawingActive = whiteboardActive;

  return (
    <div className="bottom-toolbar">
      {/* ---- View Mode Switchers ---- */}
      {VIEW_MODES.map(({ mode, icon, label }) => (
        <button
          key={mode}
          className={`tb-btn ${viewMode === mode ? 'active' : ''}`}
          onClick={() => setViewMode(mode)}
          title={label}
        >
          {icon}
          <span>{label}</span>
        </button>
      ))}

      <div className="tb-divider" />

      {/* ---- Annotation Toggle (for all views except solid whiteboard) ---- */}
      {viewMode !== 'whiteboard' && (
        <button
          className={`tb-btn ${whiteboardActive ? 'active' : ''}`}
          onClick={onToggleDrawOnDiagram}
          title={`Draw over ${viewMode}`}
        >
          <Pencil size={14} />
          <span>
            {whiteboardActive
              ? 'Stop Drawing'
              : viewMode === 'diagram'
              ? 'Draw on Diagram'
              : viewMode === 'bullet-journal'
              ? 'Annotate Journal'
              : viewMode === 'media'
              ? 'Draw on Media'
              : viewMode === 'corkboard'
              ? 'Draw on Corkboard'
              : 'Draw on Journey'}
          </span>
        </button>
      )}

      {/* ---- Spotlight (available in all view modes) ---- */}
      <button
        className={`tb-btn ${flashlightActive ? 'active' : ''}`}
        onClick={() => setFlashlightActive(!flashlightActive)}
        title="Spotlight / Flashlight"
      >
        <Zap size={14} />
        <span>Spotlight</span>
      </button>

      {/* ---- Drawing Tools (shown when whiteboard is active in any form) ---- */}
      {isDrawingActive && (
        <>
          <div className="tb-divider" />

          <button className={`tb-btn ${brushType === 'pencil' ? 'active' : ''}`} onClick={() => setBrushType('pencil')} title="Pencil">
            <Pencil size={14} /><span>Pencil</span>
          </button>
          <button className={`tb-btn ${brushType === 'highlighter' ? 'active' : ''}`} onClick={() => setBrushType('highlighter')} title="Marker">
            <Highlighter size={14} /><span>Marker</span>
          </button>
          <button className={`tb-btn ${brushType === 'text' ? 'active' : ''}`} onClick={() => setBrushType('text')} title="Text">
            <Type size={14} /><span>Text</span>
          </button>
          <button className={`tb-btn ${brushType === 'eraser' ? 'active' : ''}`} onClick={() => setBrushType('eraser')} title="Eraser">
            <Eraser size={14} /><span>Eraser</span>
          </button>

          <div className="tb-divider" />

          {/* Color palette */}
          {brushType !== 'eraser' && (
            <>
              {PALETTE_COLORS.map((c) => (
                <button
                  key={c.value}
                  className={`color-dot ${strokeColor === c.value ? 'selected' : ''}`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setStrokeColor(c.value)}
                  title={c.name}
                />
              ))}
              <div className="tb-divider" />
            </>
          )}

          {/* Brush sizes */}
          {BRUSH_SIZES.map((s) => (
            <button
              key={s.value}
              className={`size-dot ${brushSize === s.value ? 'selected' : ''}`}
              style={{ width: `${s.dotSize}px`, height: `${s.dotSize}px` }}
              onClick={() => setBrushSize(s.value)}
              title={`${s.label} (${s.value}px)`}
            />
          ))}

          <div className="tb-divider" />

          <button
            className="tb-btn"
            onClick={onUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={14} /><span>Undo</span>
          </button>
          <button className="tb-btn" onClick={onClear} title="Clear canvas" style={{ color: 'rgba(232,176,154,0.9)' }}>
            <Trash2 size={14} /><span>Clear</span>
          </button>
        </>
      )}
    </div>
  );
};
