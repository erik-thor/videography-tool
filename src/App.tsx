import React, { useState, useEffect, useRef } from 'react';
import { SidebarControls } from './components/SidebarControls';
import { WebcamSlot } from './components/WebcamSlot';
import type { WebcamPosition, WebcamStyle } from './components/WebcamSlot';
import { WhiteboardCanvas } from './components/WhiteboardCanvas';
import { ValuesCircleDiagram } from './components/ValuesCircleDiagram';
import { NodeDiagramEditor } from './components/NodeDiagramEditor';
import { BottomToolbar } from './components/BottomToolbar';
import { MediaCanvasView } from './components/MediaCanvasView';
import { CorkboardView } from './components/CorkboardView';
import { BulletJournalView } from './components/BulletJournalView';
import { HeroJourneyView } from './components/HeroJourneyView';
import { DraggableWidget, TimerWidget, ChecklistWidget, ScratchpadWidget } from './components/Widgets';
import { QuestionPromptWidget } from './components/QuestionPromptWidget';
import { initAudio, TRANSITION_SOUNDS } from './utils/audioRegistry';
import { IntroSceneView, AboutMeSceneView, PlanSceneView, OutroSceneView } from './components/CustomSceneViews';
import {
  saveRecordingChunk,
  saveRecordingMetadata,
  getRecordingChunks,
  clearRecordingChunks,
  getAudioMixer,
  checkRecoverableChunks,
  setSoundboardVolume
} from './utils/videoRecorder';

export type ViewMode = 'diagram' | 'whiteboard' | 'media' | 'corkboard' | 'bullet-journal' | 'hero-journey' | 'fullscreen-camera';

export interface Scene {
  id: string;
  name: string;
  viewMode: ViewMode;
  diagramType: 'circle' | 'flowchart';
  whiteboardActive: boolean;
  whiteboardOnTop: boolean;
  flashlightActive: boolean;
  widgetsVisible: { timer: boolean; checklist: boolean; scratchpad: boolean; question: boolean };
  canvasStates?: { [key: string]: string };
}

export interface Project {
  id: string;
  name: string;
  scenes: Scene[];
  activeSceneId: string;
  scriptText: string;
}

function App() {
  // Theme & Background State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [backgroundMode, setBackgroundMode] = useState<string>('theme-solid');

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('diagram');
  const [diagramType, setDiagramType] = useState<'circle' | 'flowchart'>('circle');

  // Whiteboard Canvas State
  const [whiteboardActive, setWhiteboardActive] = useState<boolean>(false);
  const [whiteboardOnTop, setWhiteboardOnTop] = useState<boolean>(false);
  const [strokeColor, setStrokeColor] = useState<string>('#2C1F15');
  const [brushType, setBrushType] = useState<'pencil' | 'highlighter' | 'eraser' | 'text'>('pencil');
  const [brushSize, setBrushSize] = useState<number>(6);
  const [clearTrigger, setClearTrigger] = useState<number>(0);
  const [undoTrigger, setUndoTrigger] = useState<number>(0);

  // Webcam Slot State
  const [webcamVisible, setWebcamVisible] = useState<boolean>(true);
  const [webcamPosition, setWebcamPosition] = useState<WebcamPosition>('bottom-left');
  const [webcamStyle, setWebcamStyle] = useState<WebcamStyle>('placeholder');
  const [webcamWidth, setWebcamWidth] = useState<number>(320);
  const [webcamHeight, setWebcamHeight] = useState<number>(180);

  // Hardware selections
  const [selectedMicId, setSelectedMicId] = useState<string>('');
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  // Recording State
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'paused'>('idle');
  const [recordingName, setRecordingName] = useState<string>('Monologue');
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [hasRecoverableVideo, setHasRecoverableVideo] = useState<boolean>(false);

  // Scenes State
  const defaultScenes: Scene[] = [
    {
      id: 'scene-intro',
      name: 'Intro Title Card',
      viewMode: 'media',
      diagramType: 'circle',
      whiteboardActive: false,
      whiteboardOnTop: false,
      flashlightActive: false,
      widgetsVisible: { timer: false, checklist: false, scratchpad: false, question: false },
      canvasStates: {}
    },
    {
      id: 'scene-about-me',
      name: 'About Erik Thor',
      viewMode: 'media',
      diagramType: 'circle',
      whiteboardActive: false,
      whiteboardOnTop: false,
      flashlightActive: false,
      widgetsVisible: { timer: false, checklist: false, scratchpad: false, question: false },
      canvasStates: {}
    },
    {
      id: 'scene-plan',
      name: 'Monologue Plan',
      viewMode: 'media',
      diagramType: 'circle',
      whiteboardActive: false,
      whiteboardOnTop: false,
      flashlightActive: false,
      widgetsVisible: { timer: false, checklist: true, scratchpad: false, question: false },
      canvasStates: {}
    },
    {
      id: 'scene-part1',
      name: 'Part 1: Core Values',
      viewMode: 'diagram',
      diagramType: 'circle',
      whiteboardActive: false,
      whiteboardOnTop: false,
      flashlightActive: false,
      widgetsVisible: { timer: false, checklist: false, scratchpad: false, question: true },
      canvasStates: {}
    },
    {
      id: 'scene-part2',
      name: 'Part 2: Process Flow',
      viewMode: 'diagram',
      diagramType: 'flowchart',
      whiteboardActive: false,
      whiteboardOnTop: false,
      flashlightActive: false,
      widgetsVisible: { timer: false, checklist: false, scratchpad: true, question: false },
      canvasStates: {}
    },
    {
      id: 'scene-outro',
      name: 'Outro / Summary',
      viewMode: 'media',
      diagramType: 'circle',
      whiteboardActive: false,
      whiteboardOnTop: false,
      flashlightActive: false,
      widgetsVisible: { timer: false, checklist: false, scratchpad: false, question: false },
      canvasStates: {}
    }
  ];

  const [scriptText, setScriptText] = useState<string>('');

  // Projects State
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('video_journal_projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse projects:", e);
      }
    }
    // Initial default project
    const defaultProj = {
      id: 'default-project',
      name: 'Default Project',
      scenes: defaultScenes,
      activeSceneId: 'scene-intro',
      scriptText: `RECORDING SCRIPT\n────────────────\n\n[INTRO] — 0:00–1:00\nIntroduce the topic.\n"Today I want to talk about..."\n\n[SECTION 1] — 1:00–5:00\nMain first point.\n- Sub-point A\n- Sub-point B\n\n[SECTION 2] — 5:00–9:00\nMain second point.\n- Sub-point A\n- Sub-point B`
    };
    return [defaultProj];
  });

  const [currentProjectId, setCurrentProjectId] = useState<string>(() => {
    return localStorage.getItem('video_journal_current_project_id') || 'default-project';
  });

  const currentProject = projects.find(p => p.id === currentProjectId) || projects[0];

  const [scenes, setScenes] = useState<Scene[]>(currentProject.scenes);
  const [activeSceneId, setActiveSceneId] = useState<string>(currentProject.activeSceneId);
  const [isPageTurning, setIsPageTurning] = useState<boolean>(false);

  // Sync state variables with active project on change
  useEffect(() => {
    if (currentProject) {
      setScenes(currentProject.scenes);
      setActiveSceneId(currentProject.activeSceneId);
      setScriptText(currentProject.scriptText);
    }
  }, [currentProjectId]);

  // Save current project state whenever its content changes
  const saveCurrentProjectState = (updatedScenes: Scene[], updatedActiveSceneId: string, updatedScriptText: string) => {
    setProjects(prev => {
      const next = prev.map(p => {
        if (p.id === currentProjectId) {
          return {
            ...p,
            scenes: updatedScenes,
            activeSceneId: updatedActiveSceneId,
            scriptText: updatedScriptText
          };
        }
        return p;
      });
      localStorage.setItem('video_journal_projects', JSON.stringify(next));
      return next;
    });
  };

  const handleSelectProject = (id: string) => {
    // Save current drawings before leaving the project!
    const currentCanvasStates: { [key: string]: string } = {};
    const views: ViewMode[] = ['diagram', 'whiteboard', 'media', 'corkboard', 'bullet-journal', 'hero-journey'];
    views.forEach(v => {
      const canvasEl = document.querySelector(`[data-view="${v}"] canvas`) as HTMLCanvasElement | null;
      if (canvasEl) {
        currentCanvasStates[v] = canvasEl.toDataURL();
      }
    });
    
    const updatedScenes = scenes.map(s => {
      if (s.id === activeSceneId) {
        return { ...s, canvasStates: currentCanvasStates };
      }
      return s;
    });

    const savedProjects = projects.map(p => {
      if (p.id === currentProjectId) {
        return { ...p, scenes: updatedScenes, activeSceneId, scriptText };
      }
      return p;
    });

    setProjects(savedProjects);
    localStorage.setItem('video_journal_projects', JSON.stringify(savedProjects));
    
    // Switch project
    localStorage.setItem('video_journal_current_project_id', id);
    setCurrentProjectId(id);
  };

  const handleCreateProject = (name: string) => {
    const newId = 'project-' + Date.now();
    const newProj = {
      id: newId,
      name,
      scenes: defaultScenes,
      activeSceneId: 'scene-intro',
      scriptText: `RECORDING SCRIPT\n────────────────\n\n[INTRO] — 0:00–1:00\nIntroduce the topic.\n"Today I want to talk about..."`
    };
    
    const updatedProjects = [...projects, newProj];
    setProjects(updatedProjects);
    localStorage.setItem('video_journal_projects', JSON.stringify(updatedProjects));
    
    // Switch to new project
    localStorage.setItem('video_journal_current_project_id', newId);
    setCurrentProjectId(newId);
  };

  const handleRenameProject = (id: string, newName: string) => {
    const updated = projects.map(p => p.id === id ? { ...p, name: newName } : p);
    setProjects(updated);
    localStorage.setItem('video_journal_projects', JSON.stringify(updated));
  };

  const handleDeleteProject = (id: string) => {
    if (projects.length <= 1) return;
    const remaining = projects.filter(p => p.id !== id);
    setProjects(remaining);
    localStorage.setItem('video_journal_projects', JSON.stringify(remaining));
    
    // Switch to another project
    const fallbackId = remaining[0].id;
    localStorage.setItem('video_journal_current_project_id', fallbackId);
    setCurrentProjectId(fallbackId);
  };

  // Flashlight Spotlight State
  const [flashlightActive, setFlashlightActive] = useState<boolean>(false);
  const [flashlightPos, setFlashlightPos] = useState({ x: 960, y: 540 });

  // Floating Widgets
  const [widgetsVisible, setWidgetsVisible] = useState({
    timer: false,
    checklist: true,
    scratchpad: false,
    question: false,
  });

  // Sidebar collapse state — declared before calculateScale so it can be read inside it
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Aspect ratio scaling
  const [scale, setScale] = useState<number>(1);

  const calculateScale = (collapsed?: boolean) => {
    const sidebarW = (collapsed ?? isSidebarCollapsed) ? 52 : 280;
    const bottomH = 72;
    const availW = window.innerWidth - sidebarW;
    const availH = window.innerHeight - bottomH;
    setScale(Math.min(availW / 1920, availH / 1080));
  };

  useEffect(() => {
    calculateScale();
    const onResize = () => calculateScale();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isSidebarCollapsed]);

  const toggleWidget = (widget: 'timer' | 'checklist' | 'scratchpad' | 'question') => {
    setWidgetsVisible(prev => ({ ...prev, [widget]: !prev[widget] }));
  };

  const handleClearWhiteboard = () => setClearTrigger(prev => prev + 1);
  const handleUndoWhiteboard = () => setUndoTrigger(prev => prev + 1);

  // Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Check for crash recovery on boot
  useEffect(() => {
    checkRecoverableChunks().then(hasAny => {
      setHasRecoverableVideo(hasAny);
    });
  }, []);

  const handleStartRecording = async () => {
    try {
      await clearRecordingChunks();
      await saveRecordingMetadata(recordingName || 'Monologue');

      const { audioCtx, dest } = getAudioMixer();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      // Capture Microphone
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : true
      });
      micStreamRef.current = micStream;
      const micSource = audioCtx.createMediaStreamSource(micStream);
      micSource.connect(dest);

      // Capture Screen (hints browser to prefer tab capture, pre-selects current tab, and hides mouse cursor)
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: 1920,
          height: 1080,
          displaySurface: "browser",
          cursor: "never"
        } as any,
        audio: true,
        preferCurrentTab: true,
        selfBrowserSurface: "include"
      } as any);
      displayStreamRef.current = displayStream;

      if (displayStream.getAudioTracks().length > 0) {
        const screenAudioSource = audioCtx.createMediaStreamSource(displayStream);
        screenAudioSource.connect(dest);
      }

      // Apply Region Capture (crop to the 1920x1080 recording canvas) if supported
      const videoTrack = displayStream.getVideoTracks()[0];
      const CropTarget = (window as any).CropTarget;
      const recordingCanvasEl = document.querySelector('.recording-canvas');

      if (CropTarget && typeof CropTarget.fromElement === 'function' && typeof videoTrack.cropTo === 'function' && recordingCanvasEl) {
        try {
          const cropTarget = await CropTarget.fromElement(recordingCanvasEl);
          await videoTrack.cropTo(cropTarget);
          console.log("Region Capture crop applied successfully to the recording canvas.");
        } catch (cropErr) {
          console.warn("Region Capture crop failed, proceeding with full tab capture:", cropErr);
        }
      } else {
        console.warn("Region Capture (cropTo) is not supported in this browser, recording full tab.");
      }

      // Mix video and audio tracks
      const mixedStream = new MediaStream([
        videoTrack,
        dest.stream.getAudioTracks()[0]
      ]);

      // Set mimetype formats
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=h264,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';

      const recorder = new MediaRecorder(mixedStream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = async (e) => {
        if (e.data && e.data.size > 0) {
          await saveRecordingChunk(e.data);
        }
      };

      recorder.onstop = async () => {
        if (displayStreamRef.current) displayStreamRef.current.getTracks().forEach(t => t.stop());
        if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => t.stop());
        
        const { name, chunks } = await getRecordingChunks();
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: chunks[0].type });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${name || 'recorded_video'}.webm`;
          a.click();
          URL.revokeObjectURL(url);
        }
        await clearRecordingChunks();
        setHasRecoverableVideo(false);
        setRecordingStatus('idle');
        setRecordingTime(0);
      };

      recorder.start(2000); // 2 second slices
      setRecordingStatus('recording');
      setRecordingTime(0);

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);

      displayStream.getVideoTracks()[0].onended = () => {
        handleStopRecording();
      };

    } catch (err) {
      console.error("Failed to start recording", err);
      alert("Failed to start recording. Please ensure you shared a browser tab and allowed mic access.");
      setRecordingStatus('idle');
    }
  };

  const handlePauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingStatus('paused');
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const handleResumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingStatus('recording');
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const handleRecoverVideo = async () => {
    const { name, chunks } = await getRecordingChunks();
    if (chunks.length > 0) {
      const blob = new Blob(chunks, { type: chunks[0].type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name || 'recovered_video'}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    }
    await clearRecordingChunks();
    setHasRecoverableVideo(false);
  };

  // Scene manager loading & saving handlers
  const handleSelectScene = (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;
    
    if (isPageTurning) return;

    // Synchronously capture active drawings of the scene we are leaving
    const currentCanvasStates: { [key: string]: string } = {};
    const views: ViewMode[] = ['diagram', 'whiteboard', 'media', 'corkboard', 'bullet-journal', 'hero-journey'];
    views.forEach(v => {
      const canvasEl = document.querySelector(`[data-view="${v}"] canvas`) as HTMLCanvasElement | null;
      if (canvasEl) {
        currentCanvasStates[v] = canvasEl.toDataURL();
      }
    });

    // 1. Play page flip transition sound
    try {
      const { audioCtx } = getAudioMixer();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    } catch (e) {
      console.warn("Could not resume AudioContext on page flip:", e);
    }
    const sound = TRANSITION_SOUNDS.pageFlip;
    const audio = initAudio(sound, false);
    audio.currentTime = 0;
    audio.volume = 0.8;
    setSoundboardVolume('page-flip', 0.8);
    audio.play().catch(err => {
      console.warn('Could not play page flip sound:', err);
    });

    // 2. Trigger visual transition
    setIsPageTurning(true);

    // 3. Swap scene state halfway through sweep (350ms)
    setTimeout(() => {
      // Auto-save captured drawings of the left scene to the scenes list
      const updatedScenes = scenes.map(s => {
        if (s.id === activeSceneId) {
          return { ...s, canvasStates: currentCanvasStates };
        }
        return s;
      });

      setScenes(updatedScenes);
      setActiveSceneId(sceneId);
      setViewMode(scene.viewMode);
      setDiagramType(scene.diagramType);
      setWhiteboardActive(scene.whiteboardActive);
      setWhiteboardOnTop(scene.whiteboardOnTop);
      setFlashlightActive(scene.flashlightActive);
      setWidgetsVisible(scene.widgetsVisible);

      if (scene.viewMode === 'fullscreen-camera') {
        setWebcamPosition('fullscreen');
        setWebcamVisible(true);
      } else {
        if (webcamPosition === 'fullscreen') {
          setWebcamPosition('bottom-left');
        }
      }

      // Save updated project state (including old scene's drawings and new activeSceneId)
      saveCurrentProjectState(updatedScenes, sceneId, scriptText);
    }, 350);

    // 4. Reset page turning state after sweep completes (800ms)
    setTimeout(() => {
      setIsPageTurning(false);
    }, 800);
  };

  const handleRenameScene = (id: string, newName: string) => {
    const updated = scenes.map(s => s.id === id ? { ...s, name: newName } : s);
    setScenes(updated);
    saveCurrentProjectState(updated, activeSceneId, scriptText);
  };

  const handleSaveCurrentScene = (name: string) => {
    const canvasStates: { [key: string]: string } = {};
    const views: ViewMode[] = ['diagram', 'whiteboard', 'media', 'corkboard', 'bullet-journal', 'hero-journey'];
    
    views.forEach(v => {
      const canvasEl = document.querySelector(`[data-view="${v}"] canvas`) as HTMLCanvasElement | null;
      if (canvasEl) {
        canvasStates[v] = canvasEl.toDataURL();
      }
    });

    const newScene: Scene = {
      id: Date.now().toString(),
      name,
      viewMode,
      diagramType,
      whiteboardActive,
      whiteboardOnTop,
      flashlightActive,
      widgetsVisible: { ...widgetsVisible },
      canvasStates,
    };

    const updated = [...scenes, newScene];
    setScenes(updated);
    setActiveSceneId(newScene.id);
    saveCurrentProjectState(updated, newScene.id, scriptText);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!flashlightActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setFlashlightPos({
      x: Math.round((e.clientX - rect.left) * (1920 / rect.width)),
      y: Math.round((e.clientY - rect.top) * (1080 / rect.height)),
    });
  };

  const getCanvasBgStyle = (): React.CSSProperties => {
    if (backgroundMode === 'theme-solid') return {};
    return { background: backgroundMode };
  };

  useEffect(() => {
    setStrokeColor(theme === 'dark' ? '#F4EAD5' : '#2C1F15');
  }, [theme]);

  // Modes that have their own background (ignore theme background)
  const isImmersiveMode = viewMode === 'corkboard' || viewMode === 'hero-journey';

  const handleSetViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'whiteboard') {
      setWhiteboardActive(true);
      setWhiteboardOnTop(false);
    } else if (mode === 'bullet-journal') {
      // Bullet journal works great with draw-on-top
      setWhiteboardActive(false);
      setWhiteboardOnTop(false);
    } else {
      setWhiteboardActive(false);
      setWhiteboardOnTop(false);
    }
    if (mode !== 'diagram') setFlashlightActive(false);
  };

  const handleToggleDrawOnDiagram = () => {
    const next = !whiteboardActive;
    setWhiteboardActive(next);
    setWhiteboardOnTop(next);
  };

  const handleScriptTextChange = (text: string) => {
    setScriptText(text);
    saveCurrentProjectState(scenes, activeSceneId, text);
  };

  return (
    <div className="app-shell">
      {/* ======================================================
          LEFT SIDEBAR — always outside the 1920×1080 canvas
      ====================================================== */}
      <SidebarControls
        theme={theme}
        setTheme={setTheme}
        backgroundMode={backgroundMode}
        setBackgroundMode={setBackgroundMode}
        viewMode={viewMode}
        setViewMode={handleSetViewMode}
        diagramType={diagramType}
        setDiagramType={setDiagramType}
        whiteboardActive={whiteboardActive}
        whiteboardOnTop={whiteboardOnTop}
        onToggleDrawOnDiagram={handleToggleDrawOnDiagram}
        triggerClearWhiteboard={handleClearWhiteboard}
        flashlightActive={flashlightActive}
        setFlashlightActive={setFlashlightActive}
        webcamVisible={webcamVisible}
        setWebcamVisible={setWebcamVisible}
        webcamPosition={webcamPosition}
        setWebcamPosition={setWebcamPosition}
        webcamStyle={webcamStyle}
        setWebcamStyle={setWebcamStyle}
        webcamWidth={webcamWidth}
        setWebcamWidth={setWebcamWidth}
        webcamHeight={webcamHeight}
        setWebcamHeight={setWebcamHeight}
        widgetsVisible={widgetsVisible}
        toggleWidget={toggleWidget}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        scriptText={scriptText}
        setScriptText={handleScriptTextChange}
        projects={projects}
        currentProjectId={currentProjectId}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
        scenes={scenes}
        activeSceneId={activeSceneId}
        onSelectScene={handleSelectScene}
        onSaveCurrentScene={handleSaveCurrentScene}
        onRenameScene={handleRenameScene}
        recordingStatus={recordingStatus}
        recordingName={recordingName}
        setRecordingName={setRecordingName}
        selectedMicId={selectedMicId}
        setSelectedMicId={setSelectedMicId}
        selectedCameraId={selectedCameraId}
        setSelectedCameraId={setSelectedCameraId}
        onStartRecording={handleStartRecording}
        onPauseRecording={handlePauseRecording}
        onResumeRecording={handleResumeRecording}
        onStopRecording={handleStopRecording}
        recordingTime={recordingTime}
        hasRecoverableVideo={hasRecoverableVideo}
        onRecoverVideo={handleRecoverVideo}
      />

      {/* ======================================================
          RIGHT COLUMN — recording canvas + bottom toolbar
      ====================================================== */}
      <div className="right-column">
        <div className="canvas-area">
          <div
            className="scale-wrapper"
            style={{ transform: `scale(${scale})` }}
          >
            {/* ---- THE 1920×1080 RECORDING CANVAS ---- */}
            <div
              className={`recording-canvas theme-${theme}`}
              style={isImmersiveMode ? {} : getCanvasBgStyle()}
              onMouseMove={handleCanvasMouseMove}
            >
              {/* DIAGRAM VIEW */}
              <div style={{ display: viewMode === 'diagram' ? 'block' : 'none', width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
                <div style={{ display: diagramType === 'circle' ? 'block' : 'none', width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
                  <ValuesCircleDiagram />
                </div>
                <div style={{ display: diagramType === 'flowchart' ? 'block' : 'none', width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
                  <NodeDiagramEditor />
                </div>
                <WhiteboardCanvas
                  isActive={viewMode === 'diagram' && whiteboardActive}
                  drawOnTop={true}
                  theme={theme}
                  strokeColor={strokeColor}
                  setStrokeColor={setStrokeColor}
                  brushType={brushType}
                  setBrushType={setBrushType}
                  brushSize={brushSize}
                  setBrushSize={setBrushSize}
                  clearTrigger={viewMode === 'diagram' ? clearTrigger : 0}
                  undoTrigger={viewMode === 'diagram' ? undoTrigger : 0}
                  showToolbar={false}
                  restoreDataUrl={scenes.find(s => s.id === activeSceneId)?.canvasStates?.['diagram']}
                />
              </div>

              {/* MEDIA VIEW */}
              <div style={{ display: viewMode === 'media' ? 'block' : 'none', width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
                {activeSceneId === 'scene-intro' ? (
                  <IntroSceneView theme={theme} />
                ) : activeSceneId === 'scene-about-me' ? (
                  <AboutMeSceneView theme={theme} />
                ) : activeSceneId === 'scene-plan' ? (
                  <PlanSceneView theme={theme} />
                ) : activeSceneId === 'scene-outro' ? (
                  <OutroSceneView theme={theme} />
                ) : (
                  <MediaCanvasView theme={theme} />
                )}
                <WhiteboardCanvas
                  isActive={viewMode === 'media' && whiteboardActive}
                  drawOnTop={true}
                  theme={theme}
                  strokeColor={strokeColor}
                  setStrokeColor={setStrokeColor}
                  brushType={brushType}
                  setBrushType={setBrushType}
                  brushSize={brushSize}
                  setBrushSize={setBrushSize}
                  clearTrigger={viewMode === 'media' ? clearTrigger : 0}
                  undoTrigger={viewMode === 'media' ? undoTrigger : 0}
                  showToolbar={false}
                  restoreDataUrl={scenes.find(s => s.id === activeSceneId)?.canvasStates?.['media']}
                />
              </div>

              {/* CORKBOARD VIEW */}
              <div style={{ display: viewMode === 'corkboard' ? 'block' : 'none', width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
                <CorkboardView />
                <WhiteboardCanvas
                  isActive={viewMode === 'corkboard' && whiteboardActive}
                  drawOnTop={true}
                  theme={theme}
                  strokeColor={strokeColor}
                  setStrokeColor={setStrokeColor}
                  brushType={brushType}
                  setBrushType={setBrushType}
                  brushSize={brushSize}
                  setBrushSize={setBrushSize}
                  clearTrigger={viewMode === 'corkboard' ? clearTrigger : 0}
                  undoTrigger={viewMode === 'corkboard' ? undoTrigger : 0}
                  showToolbar={false}
                  restoreDataUrl={scenes.find(s => s.id === activeSceneId)?.canvasStates?.['corkboard']}
                />
              </div>

              {/* BULLET JOURNAL VIEW */}
              <div style={{ display: viewMode === 'bullet-journal' ? 'block' : 'none', width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
                <BulletJournalView theme={theme} />
                <WhiteboardCanvas
                  isActive={viewMode === 'bullet-journal' && whiteboardActive}
                  drawOnTop={true}
                  theme={theme}
                  strokeColor={strokeColor}
                  setStrokeColor={setStrokeColor}
                  brushType={brushType}
                  setBrushType={setBrushType}
                  brushSize={brushSize}
                  setBrushSize={setBrushSize}
                  clearTrigger={viewMode === 'bullet-journal' ? clearTrigger : 0}
                  undoTrigger={viewMode === 'bullet-journal' ? undoTrigger : 0}
                  showToolbar={false}
                  restoreDataUrl={scenes.find(s => s.id === activeSceneId)?.canvasStates?.['bullet-journal']}
                />
              </div>

              {/* HERO'S JOURNEY VIEW */}
              <div style={{ display: viewMode === 'hero-journey' ? 'block' : 'none', width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
                <HeroJourneyView />
                <WhiteboardCanvas
                  isActive={viewMode === 'hero-journey' && whiteboardActive}
                  drawOnTop={true}
                  theme={theme}
                  strokeColor={strokeColor}
                  setStrokeColor={setStrokeColor}
                  brushType={brushType}
                  setBrushType={setBrushType}
                  brushSize={brushSize}
                  setBrushSize={setBrushSize}
                  clearTrigger={viewMode === 'hero-journey' ? clearTrigger : 0}
                  undoTrigger={viewMode === 'hero-journey' ? undoTrigger : 0}
                  showToolbar={false}
                  restoreDataUrl={scenes.find(s => s.id === activeSceneId)?.canvasStates?.['hero-journey']}
                />
              </div>

              {/* WHITEBOARD VIEW (solid whiteboard) */}
              <div style={{ display: viewMode === 'whiteboard' ? 'block' : 'none', width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
                <WhiteboardCanvas
                  isActive={viewMode === 'whiteboard'}
                  drawOnTop={false}
                  theme={theme}
                  strokeColor={strokeColor}
                  setStrokeColor={setStrokeColor}
                  brushType={brushType}
                  setBrushType={setBrushType}
                  brushSize={brushSize}
                  setBrushSize={setBrushSize}
                  clearTrigger={viewMode === 'whiteboard' ? clearTrigger : 0}
                  undoTrigger={viewMode === 'whiteboard' ? undoTrigger : 0}
                  showToolbar={false}
                  restoreDataUrl={scenes.find(s => s.id === activeSceneId)?.canvasStates?.['whiteboard']}
                />
              </div>

              {/* Spotlight overlay */}
              {flashlightActive && (
                <div
                  style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    zIndex: 35, pointerEvents: 'none',
                    background: `radial-gradient(circle 180px at ${flashlightPos.x}px ${flashlightPos.y}px, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 75%, ${theme === 'dark' ? 'rgba(15,11,8,0.92)' : 'rgba(22,17,13,0.82)'} 100%)`,
                  }}
                />
              )}

              {/* Webcam Slot */}
              {webcamVisible && (
                <WebcamSlot
                  position={webcamPosition}
                  styleMode={webcamStyle}
                  width={webcamWidth}
                  height={webcamHeight}
                  theme={theme}
                  selectedCameraId={selectedCameraId}
                />
              )}

              {/* Draggable Widgets */}
              {widgetsVisible.timer && (
                <DraggableWidget title="timer" defaultX={1480} defaultY={80} scale={scale} theme={theme} onClose={() => toggleWidget('timer')}>
                  <TimerWidget theme={theme} />
                </DraggableWidget>
              )}
              {widgetsVisible.checklist && (
                <DraggableWidget title="agenda outline" defaultX={1200} defaultY={280} scale={scale} theme={theme} width={680} onClose={() => toggleWidget('checklist')}>
                  <ChecklistWidget />
                </DraggableWidget>
              )}
              {widgetsVisible.scratchpad && (
                <DraggableWidget title="monologue scratches" defaultX={1480} defaultY={530} scale={scale} theme={theme} onClose={() => toggleWidget('scratchpad')}>
                  <ScratchpadWidget />
                </DraggableWidget>
              )}
              {widgetsVisible.question && (
                <DraggableWidget title="reflection prompt" defaultX={80} defaultY={80} scale={scale} theme={theme} width={800} onClose={() => toggleWidget('question')}>
                  <QuestionPromptWidget />
                </DraggableWidget>
              )}

              {/* Page-Turn Transition Overlay */}
              <div className={`page-turn-overlay ${isPageTurning ? 'active' : ''}`}>
                <div className="page-turn-sheet" />
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================
            BOTTOM TOOLBAR — outside recording canvas
        ====================================================== */}
        <BottomToolbar
          viewMode={viewMode}
          setViewMode={handleSetViewMode}
          whiteboardActive={whiteboardActive}
          whiteboardOnTop={whiteboardOnTop}
          onToggleDrawOnDiagram={handleToggleDrawOnDiagram}
          flashlightActive={flashlightActive}
          setFlashlightActive={setFlashlightActive}
          strokeColor={strokeColor}
          setStrokeColor={setStrokeColor}
          brushType={brushType}
          setBrushType={setBrushType}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          onClear={handleClearWhiteboard}
          onUndo={handleUndoWhiteboard}
          theme={theme}
          recordingStatus={recordingStatus}
          recordingTime={recordingTime}
          onStartRecording={handleStartRecording}
          onPauseRecording={handlePauseRecording}
          onResumeRecording={handleResumeRecording}
          onStopRecording={handleStopRecording}
        />
      </div>
    </div>
  );
}

export default App;
