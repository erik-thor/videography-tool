import React, { useState, useEffect } from 'react';
import {
  Settings,
  Eye, EyeOff,
  Circle,
  Grid3x3,
  Timer,
  CheckSquare,
  FileText,
  Sun, Moon,
  Palette,
  ChevronLeft, ChevronRight,
  Camera,
  Layout,
  ScrollText,
  Video,
  Play,
  Pause,
  Square,
  AlertTriangle,
  RotateCcw,
  Plus,
  Pencil,
} from 'lucide-react';
import type { WebcamPosition, WebcamStyle } from './WebcamSlot';
import type { ViewMode, Scene } from '../App';
import { Soundboard } from './Soundboard';

interface SidebarControlsProps {
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  backgroundMode: string;
  setBackgroundMode: (m: string) => void;

  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  diagramType: 'circle' | 'flowchart';
  setDiagramType: (t: 'circle' | 'flowchart') => void;
  whiteboardActive: boolean;
  whiteboardOnTop: boolean;
  onToggleDrawOnDiagram: () => void;
  triggerClearWhiteboard: () => void;

  flashlightActive: boolean;
  setFlashlightActive: (v: boolean) => void;

  webcamVisible: boolean;
  setWebcamVisible: (v: boolean) => void;
  webcamPosition: WebcamPosition;
  setWebcamPosition: (p: WebcamPosition) => void;
  webcamStyle: WebcamStyle;
  setWebcamStyle: (s: WebcamStyle) => void;
  webcamWidth: number;
  setWebcamWidth: (w: number) => void;
  webcamHeight: number;
  setWebcamHeight: (h: number) => void;

  widgetsVisible: {
    timer: boolean;
    checklist: boolean;
    scratchpad: boolean;
    question: boolean;
  };
  toggleWidget: (widget: 'timer' | 'checklist' | 'scratchpad' | 'question') => void;

  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;

  // Scene Manager Props
  scenes: Scene[];
  activeSceneId: string;
  onSelectScene: (id: string) => void;
  onSaveCurrentScene: (name: string) => void;
  onRenameScene?: (id: string, name: string) => void;

  // Recording Props
  recordingStatus: 'idle' | 'recording' | 'paused';
  recordingName: string;
  setRecordingName: (name: string) => void;
  selectedMicId: string;
  setSelectedMicId: (id: string) => void;
  selectedCameraId: string;
  setSelectedCameraId: (id: string) => void;
  onStartRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onStopRecording: () => void;
  recordingTime: number;
  hasRecoverableVideo: boolean;
  onRecoverVideo: () => void;
}

const gradientsList = [
  { name: 'Solid Theme', value: 'theme-solid' },
  { name: 'Dawn', value: 'var(--gradient-dawn)' },
  { name: 'Ember', value: 'var(--gradient-ember)' },
  { name: 'Mediterranean', value: 'var(--gradient-mediterranean)' },
  { name: 'Dusk', value: 'var(--gradient-dusk)' },
  { name: 'Forest', value: 'var(--gradient-forest)' },
  { name: 'Ocean', value: 'var(--gradient-ocean)' },
  { name: 'Royal', value: 'var(--gradient-royal)' },
  { name: 'Warm Ivory', value: 'var(--gradient-ivory)' },
];

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid rgba(244,234,213,0.12)',
  borderRadius: '7px',
  background: 'rgba(244,234,213,0.06)',
  color: 'rgba(244,234,213,0.85)',
  outline: 'none',
  fontSize: '13px',
  fontFamily: 'Inter, sans-serif',
  cursor: 'pointer',
};

const inlineSelectStyle: React.CSSProperties = {
  padding: '4px 8px',
  border: '1px solid rgba(244,234,213,0.12)',
  borderRadius: '5px',
  background: 'rgba(244,234,213,0.06)',
  color: 'rgba(244,234,213,0.85)',
  fontSize: '12px',
  fontFamily: 'Inter, sans-serif',
  cursor: 'pointer',
};

// ============================================================
// SCRIPT TAB — Notepad / Teleprompter panel + Ambient loops
// ============================================================
interface ScriptTabProps {
  fontSize: number;
  setFontSize: React.Dispatch<React.SetStateAction<number>>;
  script: string;
  setScript: (s: string) => void;
}

const ScriptTab: React.FC<ScriptTabProps> = ({ fontSize, setFontSize, script, setScript }) => {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '14px', gap: '16px' }}>
      
      {/* Script block */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexShrink: 0 }}>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.2px', color: 'rgba(244,234,213,0.4)', fontFamily: 'Inter' }}>Script & Teleprompter</span>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button
              onClick={() => setFontSize(f => Math.max(10, f - 1))}
              style={{ background: 'rgba(244,234,213,0.08)', border: 'none', color: 'rgba(244,234,213,0.6)', width: '22px', height: '22px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
              −
            </button>
            <span style={{ fontSize: '10px', color: 'rgba(244,234,213,0.4)', fontFamily: 'Inter', minWidth: '22px', textAlign: 'center' }}>{fontSize}px</span>
            <button
              onClick={() => setFontSize(f => Math.min(24, f + 1))}
              style={{ background: 'rgba(244,234,213,0.08)', border: 'none', color: 'rgba(244,234,213,0.6)', width: '22px', height: '22px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
              +
            </button>
          </div>
        </div>

        <textarea
          value={script}
          onChange={e => setScript(e.target.value)}
          spellCheck={false}
          style={{
            flex: 1,
            background: 'rgba(244,234,213,0.04)',
            border: '1px solid rgba(244,234,213,0.1)',
            borderRadius: '8px',
            color: 'rgba(244,234,213,0.88)',
            fontFamily: 'Lora, Georgia, serif',
            fontSize: `${fontSize}px`,
            lineHeight: '1.7',
            padding: '12px',
            resize: 'none',
            outline: 'none',
            width: '100%',
          }}
        />
      </div>

      {/* Divider */}
      <div style={{ height: '1px', backgroundColor: 'rgba(244,234,213,0.08)', flexShrink: 0 }} />

      {/* Soundboard integration */}
      <div style={{ flexShrink: 0 }}>
        <Soundboard />
      </div>
    </div>
  );
};

// ============================================================
// MAIN SIDEBAR
// ============================================================
export const SidebarControls: React.FC<SidebarControlsProps> = ({
  theme,
  setTheme,
  backgroundMode,
  setBackgroundMode,
  viewMode,
  setViewMode,
  setDiagramType,
  diagramType,
  webcamVisible,
  setWebcamVisible,
  webcamPosition,
  setWebcamPosition,
  webcamStyle,
  setWebcamStyle,
  webcamWidth,
  setWebcamWidth,
  setWebcamHeight,
  widgetsVisible,
  toggleWidget,
  isCollapsed,
  setIsCollapsed,
  scenes,
  activeSceneId,
  onSelectScene,
  onSaveCurrentScene,
  onRenameScene,
  recordingStatus,
  recordingName,
  setRecordingName,
  selectedMicId,
  setSelectedMicId,
  selectedCameraId,
  setSelectedCameraId,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
  recordingTime,
  hasRecoverableVideo,
  onRecoverVideo,
}) => {
  const [activeTab, setActiveTab] = useState<'canvas' | 'script' | 'record'>('canvas');
  const [fontSize, setFontSize] = useState(13);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [tempSceneName, setTempSceneName] = useState<string>('');
  const [scriptText, setScriptText] = useState(
    `RECORDING SCRIPT\n────────────────\n\n[INTRO] — 0:00–1:00\nIntroduce the topic.\n"Today I want to talk about..."\n\n[SECTION 1] — 1:00–5:00\nMain first point.\n- Sub-point A\n- Sub-point B\n\n[SECTION 2] — 5:00–9:00\nMain second point.\n- Sub-point A\n- Sub-point B`
  );

  const [newSceneName, setNewSceneName] = useState('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    // Request permission first to ensure names/labels populate correctly
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      .then(() => {
        navigator.mediaDevices.enumerateDevices().then(devs => {
          setDevices(devs);
          
          // Auto select first device if none is selected
          const mics = devs.filter(d => d.kind === 'audioinput');
          const cams = devs.filter(d => d.kind === 'videoinput');
          if (mics.length > 0 && !selectedMicId) setSelectedMicId(mics[0].deviceId);
          if (cams.length > 0 && !selectedCameraId) setSelectedCameraId(cams[0].deviceId);
        });
      })
      .catch(() => {
        // Fallback for permission denial
        navigator.mediaDevices.enumerateDevices().then(devs => setDevices(devs));
      });
  }, [selectedMicId, selectedCameraId, setSelectedMicId, setSelectedCameraId]);

  const micsList = devices.filter(d => d.kind === 'audioinput');
  const camsList = devices.filter(d => d.kind === 'videoinput');

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveScene = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSceneName.trim()) return;
    onSaveCurrentScene(newSceneName.trim());
    setNewSceneName('');
  };

  return (
    <div
      className={`sidebar-panel ${isCollapsed ? 'collapsed' : ''}`}
      style={{ width: isCollapsed ? '52px' : '280px', transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1)' }}
    >
      {/* ---- Header Tabs ---- */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        padding: isCollapsed ? '16px 0' : '10px',
        borderBottom: '1px solid rgba(244,234,213,0.08)',
        flexShrink: 0,
      }}>
        {!isCollapsed && (
          <div style={{ display: 'flex', gap: '3px', flex: 1 }}>
            <button
              onClick={() => setActiveTab('canvas')}
              style={{
                flex: 1, padding: '5px 4px',
                background: activeTab === 'canvas' ? 'rgba(184,103,74,0.25)' : 'transparent',
                border: activeTab === 'canvas' ? '1px solid rgba(184,103,74,0.4)' : '1px solid transparent',
                borderRadius: '5px',
                color: activeTab === 'canvas' ? '#E8B09A' : 'rgba(244,234,213,0.45)',
                cursor: 'pointer', fontSize: '10.5px',
                fontFamily: 'Inter', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'center',
              }}
            >
              <Layout size={11} /> Canvas
            </button>
            <button
              onClick={() => setActiveTab('script')}
              style={{
                flex: 1, padding: '5px 4px',
                background: activeTab === 'script' ? 'rgba(123,145,184,0.25)' : 'transparent',
                border: activeTab === 'script' ? '1px solid rgba(123,145,184,0.4)' : '1px solid transparent',
                borderRadius: '5px',
                color: activeTab === 'script' ? '#7B91B8' : 'rgba(244,234,213,0.45)',
                cursor: 'pointer', fontSize: '10.5px',
                fontFamily: 'Inter', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'center',
              }}
            >
              <ScrollText size={11} /> Script
            </button>
            <button
              onClick={() => setActiveTab('record')}
              style={{
                flex: 1, padding: '5px 4px',
                background: activeTab === 'record' ? 'rgba(138,166,142,0.25)' : 'transparent',
                border: activeTab === 'record' ? '1px solid rgba(138,166,142,0.4)' : '1px solid transparent',
                borderRadius: '5px',
                color: activeTab === 'record' ? '#8AA68E' : 'rgba(244,234,213,0.45)',
                cursor: 'pointer', fontSize: '10.5px',
                fontFamily: 'Inter', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'center',
              }}
            >
              <Video size={11} /> Record
            </button>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            background: 'none', border: 'none',
            color: 'rgba(244,234,213,0.4)',
            cursor: 'pointer', display: 'flex',
            padding: '4px', borderRadius: '6px',
            marginLeft: isCollapsed ? 0 : '4px',
          }}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* ---- Script & Loops Tab ---- */}
      {!isCollapsed && activeTab === 'script' && (
        <ScriptTab fontSize={fontSize} setFontSize={setFontSize} script={scriptText} setScript={setScriptText} />
      )}

      {/* ---- Canvas Controls Tab ---- */}
      {!isCollapsed && activeTab === 'canvas' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Scene Manager Section */}
          <section>
            <p className="sb-section-title">Scene Manager</p>
            
            {/* Quick Scenes List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' }}>
              {scenes.map(s => {
                const isActive = activeSceneId === s.id;
                const isEditing = editingSceneId === s.id;
                return (
                  <div
                    key={s.id}
                    className={`sb-btn ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      if (!isEditing) {
                        onSelectScene(s.id);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      padding: '6px 10px',
                      cursor: isEditing ? 'default' : 'pointer',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    {isEditing ? (
                      <input
                        type="text"
                        value={tempSceneName}
                        onChange={(e) => setTempSceneName(e.target.value)}
                        onBlur={() => {
                          if (tempSceneName.trim()) {
                            onRenameScene?.(s.id, tempSceneName.trim());
                          }
                          setEditingSceneId(null);
                        }}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === 'Enter') {
                            if (tempSceneName.trim()) {
                              onRenameScene?.(s.id, tempSceneName.trim());
                            }
                            setEditingSceneId(null);
                          } else if (e.key === 'Escape') {
                            setEditingSceneId(null);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        style={{
                          flex: 1,
                          fontSize: '12px',
                          background: 'rgba(0, 0, 0, 0.25)',
                          border: '1px solid var(--terracotta)',
                          borderRadius: '4px',
                          color: '#F4EAD5',
                          padding: '2px 6px',
                          outline: 'none',
                          marginRight: '8px',
                          minWidth: '50px',
                        }}
                      />
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '4px' }}>
                        <span>🎬</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                      </span>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      {!isEditing && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSceneId(s.id);
                            setTempSceneName(s.name);
                          }}
                          title="Rename scene"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#F4EAD5',
                            opacity: 0.5,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '2px',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
                        >
                          <Pencil size={11} />
                        </button>
                      )}
                      <span style={{ fontSize: '9px', opacity: 0.5 }}>
                        {s.viewMode === 'fullscreen-camera' ? 'camera' : s.viewMode}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save current scene layout */}
            <form onSubmit={handleSaveScene} style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={newSceneName}
                onChange={e => setNewSceneName(e.target.value)}
                placeholder="Name current scene layout..."
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  fontSize: '11px',
                  background: 'rgba(244,234,213,0.05)',
                  border: '1px solid rgba(244,234,213,0.12)',
                  borderRadius: '5px',
                  color: '#F4EAD5',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'var(--terracotta)',
                  border: 'none',
                  color: '#F4EAD5',
                  borderRadius: '5px',
                  padding: '5px 8px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Plus size={12} />
              </button>
            </form>
          </section>

          <div className="sb-divider" />

          {/* Diagram sub-type */}
          {viewMode === 'diagram' && (
            <section>
              <p className="sb-section-title">Active Diagram</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button className={`sb-btn ${diagramType === 'circle' ? 'active-blue' : ''}`} onClick={() => setDiagramType('circle')}>
                  <Circle size={13} /> 8 Core Values
                </button>
                <button className={`sb-btn ${diagramType === 'flowchart' ? 'active-blue' : ''}`} onClick={() => setDiagramType('flowchart')}>
                  <Grid3x3 size={13} /> Flowchart / Node Editor
                </button>
              </div>
            </section>
          )}

          {/* Theme */}
          <section>
            <p className="sb-section-title">Canvas Theme</p>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              <button className={`sb-btn ${theme === 'light' ? 'active' : ''}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setTheme('light')}>
                <Sun size={13} /> Light
              </button>
              <button className={`sb-btn ${theme === 'dark' ? 'active' : ''}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setTheme('dark')}>
                <Moon size={13} /> Dark
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(244,234,213,0.4)' }}>Background Gradient</span>
              <select value={backgroundMode} onChange={e => setBackgroundMode(e.target.value)} style={selectStyle}>
                {gradientsList.map(g => (
                  <option key={g.value} value={g.value} style={{ background: '#2C1F15', color: '#F4EAD5' }}>{g.name}</option>
                ))}
              </select>
            </div>
          </section>

          <div className="sb-divider" />

          {/* Webcam */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <p className="sb-section-title" style={{ marginBottom: 0 }}>Webcam Slot</p>
              <button onClick={() => setWebcamVisible(!webcamVisible)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: webcamVisible ? 'var(--terracotta)' : 'rgba(244,234,213,0.3)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontFamily: 'Inter' }}>
                {webcamVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                {webcamVisible ? 'Visible' : 'Hidden'}
              </button>
            </div>
            {webcamVisible && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'rgba(244,234,213,0.7)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Position</span>
                  <select value={webcamPosition} onChange={e => setWebcamPosition(e.target.value as WebcamPosition)} style={inlineSelectStyle}>
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="fullscreen">Fullscreen Camera</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Style</span>
                  <select value={webcamStyle} onChange={e => setWebcamStyle(e.target.value as WebcamStyle)} style={inlineSelectStyle}>
                    <option value="placeholder">Boundary Glow</option>
                    <option value="chroma-green">Chroma Green</option>
                    <option value="chroma-magenta">Chroma Magenta</option>
                  </select>
                </div>
                {webcamPosition !== 'fullscreen' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Size</span>
                      <span style={{ opacity: 0.6 }}>{webcamWidth}×{Math.round(webcamWidth * 9 / 16)}px</span>
                    </div>
                    <input type="range" min="160" max="640" step="20" value={webcamWidth}
                      onChange={e => { const w = parseInt(e.target.value); setWebcamWidth(w); setWebcamHeight(Math.round(w * 9 / 16)); }}
                      style={{ accentColor: 'var(--terracotta)', cursor: 'pointer', width: '100%' }} />
                  </div>
                )}
              </div>
            )}
          </section>

          <div className="sb-divider" />

          {/* Floating Widgets */}
          <section>
            <p className="sb-section-title">Floating Widgets</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button className={`sb-btn ${widgetsVisible.timer ? 'active' : ''}`} onClick={() => toggleWidget('timer')}>
                <Timer size={13} style={{ color: 'var(--warm-gold)' }} /> Timer / Stopwatch
              </button>
              <button className={`sb-btn ${widgetsVisible.checklist ? 'active' : ''}`} onClick={() => toggleWidget('checklist')}>
                <CheckSquare size={13} style={{ color: 'var(--sage)' }} /> Agenda Checklist
              </button>
              <button className={`sb-btn ${widgetsVisible.scratchpad ? 'active' : ''}`} onClick={() => toggleWidget('scratchpad')}>
                <FileText size={13} style={{ color: 'var(--slate-blue)' }} /> Monologue Notes
              </button>
              <button className={`sb-btn ${widgetsVisible.question ? 'active' : ''}`} onClick={() => toggleWidget('question')}>
                <ScrollText size={13} style={{ color: 'var(--terracotta)' }} /> Question Prompt
              </button>
            </div>
          </section>

        </div>
      )}

      {/* ---- Recording Dashboard Tab ---- */}
      {!isCollapsed && activeTab === 'record' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '18px', fontFamily: 'Inter, sans-serif' }}>
          
          {/* Recording Title Input */}
          <section>
            <p className="sb-section-title">Video Metadata</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(244,234,213,0.45)' }}>Video Title / Filename</span>
              <input
                type="text"
                value={recordingName}
                onChange={e => setRecordingName(e.target.value)}
                placeholder="Enter monologue title..."
                disabled={recordingStatus !== 'idle'}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'rgba(244,234,213,0.06)',
                  border: '1px solid rgba(244,234,213,0.12)',
                  color: '#F4EAD5',
                  outline: 'none',
                  fontSize: '13px',
                }}
              />
            </div>
          </section>

          {/* Device Setup selectors */}
          <section>
            <p className="sb-section-title">Hardware Inputs</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              
              {/* Mic list select */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: 'rgba(244,234,213,0.45)' }}>Microphone Input</span>
                <select
                  value={selectedMicId}
                  onChange={e => setSelectedMicId(e.target.value)}
                  disabled={recordingStatus !== 'idle'}
                  style={selectStyle}
                >
                  {micsList.map(m => (
                    <option key={m.deviceId} value={m.deviceId} style={{ background: '#2C1F15', color: '#F4EAD5' }}>
                      {m.label || `Microphone ${m.deviceId.slice(0, 5)}...`}
                    </option>
                  ))}
                  {micsList.length === 0 && <option value="">No Microphones Found</option>}
                </select>
              </div>

              {/* Camera list select */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: 'rgba(244,234,213,0.45)' }}>Camera Input (Webcam)</span>
                <select
                  value={selectedCameraId}
                  onChange={e => setSelectedCameraId(e.target.value)}
                  disabled={recordingStatus !== 'idle'}
                  style={selectStyle}
                >
                  {camsList.map(c => (
                    <option key={c.deviceId} value={c.deviceId} style={{ background: '#2C1F15', color: '#F4EAD5' }}>
                      {c.label || `Camera ${c.deviceId.slice(0, 5)}...`}
                    </option>
                  ))}
                  {camsList.length === 0 && <option value="">No Cameras Found</option>}
                </select>
              </div>

            </div>
          </section>

          <div className="sb-divider" />

          {/* Recording actions controls */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            <p className="sb-section-title" style={{ alignSelf: 'flex-start' }}>Studio Recorder</p>
            
            {/* Display active duration */}
            <div style={{
              fontSize: '32px',
              fontFamily: 'Lora, serif',
              fontWeight: 500,
              color: recordingStatus === 'recording' ? 'var(--terracotta)' : '#F4EAD5',
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              {recordingStatus === 'recording' && <span className="rec-dot" style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--terracotta)', display: 'inline-block' }} />}
              {formatDuration(recordingTime)}
            </div>

            {/* Controller buttons */}
            <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center' }}>
              {recordingStatus === 'idle' ? (
                <button
                  onClick={onStartRecording}
                  style={{
                    flex: 1, padding: '10px 14px', background: 'var(--terracotta)', color: '#F4EAD5',
                    border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center'
                  }}
                >
                  <Play size={13} /> Start Recording
                </button>
              ) : (
                <>
                  {recordingStatus === 'recording' ? (
                    <button
                      onClick={onPauseRecording}
                      style={{
                        flex: 1, padding: '10px 12px', background: 'rgba(244,234,213,0.1)', color: '#F4EAD5',
                        border: '1px solid rgba(244,234,213,0.2)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center'
                      }}
                    >
                      <Pause size={13} /> Pause
                    </button>
                  ) : (
                    <button
                      onClick={onResumeRecording}
                      style={{
                        flex: 1, padding: '10px 12px', background: 'var(--terracotta)', color: '#F4EAD5',
                        border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center'
                      }}
                    >
                      <Play size={13} /> Resume
                    </button>
                  )}
                  <button
                    onClick={onStopRecording}
                    style={{
                      flex: 1, padding: '10px 12px', background: 'rgba(232,176,154,0.15)', color: '#E8B09A',
                      border: '1px solid rgba(232,176,154,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center'
                    }}
                  >
                    <Square size={13} /> Stop & Save
                  </button>
                </>
              )}
            </div>

            {/* Help indicator */}
            <span style={{ fontSize: '10.5px', color: 'rgba(244,234,213,0.35)', textAlign: 'center', lineHeight: '1.4' }}>
              Note: Capture constraints will prompt you to share the current browser tab. Prefer sharing the tab for optimal tab-audio recording.
            </span>
          </section>

          {/* Crash recovery block */}
          {hasRecoverableVideo && (
            <section style={{
              background: 'rgba(184,103,74,0.12)',
              border: '1px solid rgba(184,103,74,0.3)',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginTop: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#E8B09A' }}>
                <AlertTriangle size={14} />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Unsaved Recording Found</span>
              </div>
              <p style={{ fontSize: '11px', color: 'rgba(244,234,213,0.7)', lineHeight: '1.4' }}>
                It looks like the browser closed unexpectedly during your last recording. You can recover your video now.
              </p>
              <button
                onClick={onRecoverVideo}
                style={{
                  background: 'var(--terracotta)',
                  border: 'none',
                  borderRadius: '5px',
                  color: '#F4EAD5',
                  padding: '6px 10px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Recover Video File
              </button>
            </section>
          )}

        </div>
      )}

      {/* Collapsed icon strip */}
      {isCollapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px', padding: '20px 0' }}>
          <Settings size={15} style={{ color: 'var(--terracotta)', opacity: 0.6 }} />
          <Palette size={14} style={{ color: 'var(--warm-gold)', opacity: 0.5 }} />
          <Camera size={13} style={{ color: 'var(--sage)', opacity: 0.5 }} />
          <ScrollText size={13} style={{ color: 'var(--slate-blue)', opacity: 0.5 }} />
        </div>
      )}

      {/* Footer */}
      {!isCollapsed && (
        <div style={{
          padding: '10px 14px',
          borderTop: '1px solid rgba(244,234,213,0.08)',
          fontSize: '10px', color: 'rgba(244,234,213,0.2)',
          textAlign: 'center', flexShrink: 0,
          fontFamily: 'Inter', letterSpacing: '0.5px',
        }}>
          OUTSIDE OBS CAPTURE · v0.4
        </div>
      )}
    </div>
  );
};
