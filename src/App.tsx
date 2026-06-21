import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SidebarControls } from './components/SidebarControls';
import { WebcamSlot } from './components/WebcamSlot';
import type { WebcamPosition, WebcamStyle, WebcamShape } from './components/WebcamSlot';
import { WhiteboardCanvas } from './components/WhiteboardCanvas';
import { BottomToolbar } from './components/BottomToolbar';
import { MediaCanvasView } from './components/MediaCanvasView';
import { CorkboardView } from './components/CorkboardView';
import { BulletJournalView } from './components/BulletJournalView';
import { HeroJourneyView } from './components/HeroJourneyView';
import { WordCloudView } from './components/WordCloudView';
import { DraggableWidget, TimerWidget, ChecklistWidget, ScratchpadWidget } from './components/Widgets';
import { QuestionPromptWidget } from './components/QuestionPromptWidget';
import { initAudio, TRANSITION_SOUNDS } from './utils/audioRegistry';
import { useAudioLevel } from './utils/useAudioLevel';
import { IntroSceneView, AboutMeSceneView, PlanSceneView, OutroSceneView } from './components/CustomSceneViews';
import {
  saveRecordingChunk,
  saveRecordingMetadata,
  getRecordingChunks,
  clearRecordingChunks,
  getAudioMixer,
  checkRecoverableChunks,
  setSoundboardVolume,
  saveWebcamChunk,
  getWebcamChunks,
  clearWebcamChunks,
  getSegmentBlob,
  getWebcamSegmentBlob,
  deleteSegment,
  deleteWebcamSegment,
  cleanUnusedSegments,
  saveRecordingManifest,
  getRecordingManifest,
  saveMetadataValue,
  getMetadataValue
} from './utils/videoRecorder';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';


export type ViewMode = 'whiteboard' | 'media' | 'corkboard' | 'bullet-journal' | 'hero-journey' | 'fullscreen-camera' | 'word-cloud';

export interface VideoSegment {
  segmentId: string;
  startTime: number; // Position on the final timeline
  duration: number;  // Cut-off point where user rolled back
}

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
  // Sub-view custom states
  whiteboardTemplate?: 'blank' | 'bullet';
  aiDrawings?: any[];
  introData?: { title: string; subtitle: string; author: string };
  aboutMeData?: { name: string; role: string; description: string; liked?: boolean; commented?: boolean; subscribed?: boolean };
  planData?: { title: string; steps: { id: number; text: string; active: boolean }[] };
  outroData?: { title: string; subtitle: string; callToAction: string };
  mediaData?: { activeTab: 'image' | 'web'; imageSrc: string; imageUrlInput: string; webUrlInput: string; loadedWebUrl: string; youtubeId: string | null };
  corkboardData?: { photos: any[] };
  bulletJournalData?: { title: string; month: number; year: number };
  heroJourneyData?: { nodes: any[]; paths: any[] };
  // Widget custom states
  checklistItems?: { id: number; text: string; done: boolean }[];
  scratchpadText?: string;
  questionText?: string;
}

export interface Project {
  id: string;
  name: string;
  scenes: Scene[];
  activeSceneId: string;
  scriptText: string;
}

export const defaultIntroData = {
  title: 'The Physics of Self-Expression',
  subtitle: 'An Editorial Guide to Finding Your Authentic Voice',
  author: 'Presented by Erik Thor'
};

export const defaultAboutMeData = {
  name: 'Erik Thor',
  role: 'Videographer & Personality Researcher',
  description: 'Exploring the intersections of analytical psychology, videography, and creative flow. I build interactive visual systems that help creators organize thoughts and narrate their monologues.',
  liked: false,
  commented: false,
  subscribed: false
};

export const defaultPlanData = {
  title: 'Today’s Roadmap',
  steps: [
    { id: 1, text: 'The Core Conflict: Safety vs. Growth', active: true },
    { id: 2, text: 'Mapping the 8 Virtues of Self', active: false },
    { id: 3, text: 'Cognitive Appraisals & Reframing', active: false },
    { id: 4, text: 'Self Inquiry & Integration Monologue', active: false },
  ]
};

export const defaultOutroData = {
  title: 'Thank You for Watching',
  subtitle: 'Share your self-reflection answers in the comments below.',
  callToAction: 'Like & subscribe to support creative monologues.'
};

export const defaultMediaData = {
  activeTab: 'web' as const,
  imageSrc: '',
  imageUrlInput: '',
  webUrlInput: '',
  loadedWebUrl: '',
  youtubeId: null
};

export const defaultChecklistItems = [
  { id: 1, text: 'Introduce the Core Conflict', done: true },
  { id: 2, text: 'Map the 8 Virtues of Self', done: false },
  { id: 3, text: 'Examine Cognitive Appraisals', done: false },
  { id: 4, text: 'Self Inquiry & Integration', done: false },
];

export const defaultQuestionText = "Personal Reflection: [Reflection Question: What's standing in the way of your authentic self-expression today?]";

export const defaultScratchpadText = "JOURNAL OUTLINE\n----------------\n- Virtue is the capability of psychological regulation.\n- Adventure challenges safety to force evolution.\n- Compassion holds the tension of self/other.\n\nDouble click values in the circle graph to expand.";

export const defaultCorkboardData = { photos: [] };

export const defaultBulletJournalData = {
  title: 'Video Journal',
  month: new Date().getMonth(),
  year: new Date().getFullYear()
};

export const defaultHeroJourneyData = {
  nodes: [
    { id: 'n1', x: 250, y: 540, label: 'Ordinary World', sublabel: 'Where you begin', shape: 'circle', color: '#4A7C59' },
    { id: 'n2', x: 650, y: 300, label: 'Call to Adventure', sublabel: 'The challenge arrives', shape: 'circle', color: '#4A7C59' },
    { id: 'n3', x: 1150, y: 300, label: 'The Ordeal', sublabel: 'The darkest moment', shape: 'rect', color: '#B8674A' },
    { id: 'n4', x: 1550, y: 540, label: 'Return with Elixir', sublabel: 'Sharing the gift', shape: 'circle', color: '#4A7C59' }
  ],
  paths: [
    { id: 'p1', fromId: 'n1', toId: 'n2' },
    { id: 'p2', fromId: 'n2', toId: 'n3' },
    { id: 'p3', fromId: 'n3', toId: 'n4' }
  ]
};



function App() {
  // Theme & Background State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [backgroundMode, setBackgroundMode] = useState<string>('theme-solid');

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('media');
  const [diagramType, setDiagramType] = useState<'circle' | 'flowchart'>('circle');

  // Mobile Phone Mode State
  const [isMobileMode, setIsMobileMode] = useState<boolean>(() => {
    const mobileUA = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const isPortrait = window.innerWidth < window.innerHeight;
    return mobileUA || isPortrait;
  });

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
  const [webcamStyle, setWebcamStyle] = useState<WebcamStyle>('none');
  const [webcamShape, setWebcamShape] = useState<WebcamShape>('rectangle');
  const [webcamAutoFraming, setWebcamAutoFraming] = useState<boolean>(true);
  const [webcamWidth, setWebcamWidth] = useState<number>(320);
  const [webcamHeight, setWebcamHeight] = useState<number>(180);
  const [webcamX, setWebcamX] = useState<number | null>(null);
  const [webcamY, setWebcamY] = useState<number | null>(null);

  // Dynamically compute webcam height based on shape, width, and screen aspect ratio
  useEffect(() => {
    if (webcamShape === 'rectangle') {
      setWebcamHeight(Math.round(isMobileMode ? (webcamWidth * 16 / 9) : (webcamWidth * 9 / 16)));
    } else {
      setWebcamHeight(webcamWidth);
    }
  }, [webcamWidth, isMobileMode, webcamShape]);

  // Hardware selections
  const [selectedMicId, setSelectedMicId] = useState<string>('');
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  // Recording State
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'paused'>('idle');
  const [recordingName, setRecordingName] = useState<string>('Monologue');
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [hasRecoverableVideo, setHasRecoverableVideo] = useState<boolean>(false);
  
  const [exportSeparately, setExportSeparately] = useState<boolean>(() => {
    return localStorage.getItem('video_journal_export_separately') === 'true';
  });
  const [transcriptWords, setTranscriptWords] = useState<{ text: string; time: number }[]>([]);
  
  // Manifest state for WebM segment concatenation
  const [recordingManifest, setRecordingManifest] = useState<VideoSegment[]>([]);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string>('');

  // Paused preview / manual rollback timeline states
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const [selectedRollbackTime, setSelectedRollbackTime] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem('video_journal_export_separately', String(exportSeparately));
  }, [exportSeparately]);

  const recordingTimeValueRef = useRef<number>(0);
  useEffect(() => {
    recordingTimeValueRef.current = recordingTime;
  }, [recordingTime]);

  // AI Copilot State
  const [isAiEnabled, setIsAiEnabled] = useState<boolean>(() => localStorage.getItem('ai_enabled') === 'true');
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => localStorage.getItem('ai_gemini_key') || '');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [transcript, setTranscript] = useState<string>('');
  const speechTranscriptRef = useRef<string>('');
  const speechRecognitionRef = useRef<any>(null);
  const aiQuestionsThrottleRef = useRef<number | null>(null);
  const aiDrawThrottleRef = useRef<number | null>(null);
  const drawingTextBufferRef = useRef<string>('');
  const viewModeRef = useRef<ViewMode>(viewMode);
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);

  // Persist AI settings
  useEffect(() => { localStorage.setItem('ai_enabled', String(isAiEnabled)); }, [isAiEnabled]);
  useEffect(() => { localStorage.setItem('ai_gemini_key', geminiApiKey); }, [geminiApiKey]);





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
      canvasStates: {},
      introData: { ...defaultIntroData }
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
      canvasStates: {},
      aboutMeData: { ...defaultAboutMeData }
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
      canvasStates: {},
      mediaData: { ...defaultMediaData },
      checklistItems: [...defaultChecklistItems]
    },
    {
      id: 'scene-part1',
      name: 'Part 1: Core Values',
      viewMode: 'whiteboard',
      diagramType: 'circle',
      whiteboardActive: true,
      whiteboardOnTop: false,
      flashlightActive: false,
      widgetsVisible: { timer: false, checklist: false, scratchpad: false, question: true },
      canvasStates: {},
      questionText: defaultQuestionText
    },
    {
      id: 'scene-part2',
      name: 'Part 2: Process Flow',
      viewMode: 'hero-journey',
      diagramType: 'flowchart',
      whiteboardActive: false,
      whiteboardOnTop: false,
      flashlightActive: false,
      widgetsVisible: { timer: false, checklist: false, scratchpad: true, question: false },
      canvasStates: {},
      scratchpadText: defaultScratchpadText
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
      canvasStates: {},
      outroData: { ...defaultOutroData }
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
  const activeScene = scenes.find(s => s.id === activeSceneId) || scenes[0];
  const [isPageTurning, setIsPageTurning] = useState<boolean>(false);

  const [hasManuallyEditedRecordingName, setHasManuallyEditedRecordingName] = useState<boolean>(false);

  useEffect(() => {
    setHasManuallyEditedRecordingName(false);
  }, [currentProjectId]);

  useEffect(() => {
    const activeProject = projects.find(p => p.id === currentProjectId);
    if (activeProject && !hasManuallyEditedRecordingName) {
      setRecordingName(activeProject.name);
    }
  }, [currentProjectId, projects, hasManuallyEditedRecordingName]);

  const handleRecordingNameChange = (name: string) => {
    setRecordingName(name);
    if (name.trim() === '') {
      setHasManuallyEditedRecordingName(false);
    } else {
      setHasManuallyEditedRecordingName(true);
    }
  };

  // Query Gemini for AI suggestions (Questions/Prompts)
  const queryGeminiQuestions = useCallback(async (transcript: string) => {
    if (!geminiApiKey || !transcript.trim()) return;
    try {
      const prompt = `You are an AI co-pilot helping a video monologue creator who is currently recording. Based on the spoken transcript, return a JSON object with:
1. "questions": array of 2-3 concise, insightful follow-up questions (under 20 words each) to inspire deeper thinking for the speaker.

Transcript: "${transcript.slice(-800)}"

Return ONLY valid JSON in the format: {"questions":["..."]}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      let parsed: { questions?: string[] } = {};
      try { parsed = JSON.parse(cleaned); } catch (_) {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) { try { parsed = JSON.parse(match[0]); } catch (_2) {} }
      }
      if (parsed.questions?.length) {
        setAiSuggestions(prev => [...(parsed.questions as string[]), ...prev].slice(0, 10));
      }
    } catch (e) {
      console.warn('Gemini Questions query failed:', e);
    }
  }, [geminiApiKey]);

  // Query Gemini for whiteboard drawing commands based on the latest spoken segment
  const queryGeminiDraw = useCallback(async (recentText: string) => {
    if (!geminiApiKey || !recentText.trim()) return;
    try {
      const activeDrawings = activeScene?.aiDrawings || [];
      const drawingsContext = activeDrawings.length > 0
        ? `Existing elements currently drawn on the whiteboard:\n${JSON.stringify(activeDrawings.map(d => {
            if (d.type === 'text') return { type: d.type, x: d.x, y: d.y, text: d.text };
            if (d.type === 'circle') return { type: d.type, x: d.x, y: d.y, radius: d.radius };
            if (d.type === 'rect') return { type: d.type, x: d.x, y: d.y, width: d.width, height: d.height };
            if (d.type === 'line') return { type: d.type, x: d.x, y: d.y, x2: d.x2, y2: d.y2 };
            return d;
          }))}\n`
        : `Whiteboard is currently empty.\n`;

      const prompt = `You are drawing concept maps on a whiteboard in real-time while a speaker is recording a monologue video.
    
CONTEXT:
- Whiteboard Frame Size: 1920x1080 coordinates (x: 0 to 1920, y: 0 to 1080).
- Current Active Scene: "${activeScene?.name || 'Untitled Scene'}"
- Active Scene Topic/Question: "${activeScene?.questionText || 'None'}"
- Monologue Script Context:
"""
${scriptText.slice(0, 1500)}
"""

${drawingsContext}
The speaker just said: "${recentText.trim()}"

Identify the single most important concept, key term, or relationship mentioned in that spoken sentence. Use the monologue script and active scene topic to guide your understanding and choose relevant terminology.

Provide a JSON object containing a "drawings" array of 1-4 commands.
A valid command MUST be one of these types:
1. {"type":"text", "x":number, "y":number, "text":"Short Key Term (1-3 words)", "color":"#hex"}
2. {"type":"circle", "x":number, "y":number, "radius":number, "color":"#hex"} (placed around or near a text label)
3. {"type":"rect", "x":number, "y":number, "width":number, "height":number, "color":"#hex"} (placed around or near a text label)
4. {"type":"line", "x":number, "y":number, "x2":number, "y2":number, "color":"#hex", "lineWidth":number} (to connect two concepts or point to a label)

CRITICAL RULES:
- ALWAYS include at least one "text" command with the concept/phrase. Never draw shapes (circles, rects, lines) without a corresponding text label that explains them.
- Position the text inside or right next to its corresponding circle or rect. Note that "text" coordinates (x,y) specify the top-left of the text, while "circle" and "rect" (x,y) specify the center. Adjust coordinates so they line up neatly.
- Place drawing elements in a specific area on the canvas (e.g. x: 100-1800, y: 100-980).
- PREVENT OVERLAPPING: You must place the new elements in a region that is empty. Do NOT place any new element (especially text and shapes) within 150 pixels of any existing elements listed in the "Existing elements currently drawn on the whiteboard" section. Choose new (x, y) coordinates that are separated by at least 150 pixels from any coordinate (x, y) of the existing elements.
- Keep the design clean, minimalist, and whiteboard-like.
- Choose colors from this palette: #B8674A (terracotta), #C9A563 (gold), #8AA68E (sage), #7B91B8 (slate).

Return ONLY valid JSON in the format: {"drawings":[...]}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      let parsed: { drawings?: any[] } = {};
      try { parsed = JSON.parse(cleaned); } catch (_) {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) { try { parsed = JSON.parse(match[0]); } catch (_2) {} }
      }
      if (parsed.drawings?.length) {
        window.dispatchEvent(new CustomEvent('ai-draw', { detail: parsed.drawings }));
        const currentDrawings = activeScene?.aiDrawings || [];
        updateSceneCustomData(activeSceneId, 'aiDrawings', [...currentDrawings, ...parsed.drawings]);
      }
    } catch (e) {
      console.warn('Gemini Draw query failed:', e);
    }
  }, [geminiApiKey, activeScene?.name, activeScene?.questionText, activeScene?.aiDrawings, activeSceneId, scriptText]);

  // Stable refs for speech recognition callback stability
  const queryGeminiQuestionsRef = useRef(queryGeminiQuestions);
  const queryGeminiDrawRef = useRef(queryGeminiDraw);
  useEffect(() => {
    queryGeminiQuestionsRef.current = queryGeminiQuestions;
  }, [queryGeminiQuestions]);
  useEffect(() => {
    queryGeminiDrawRef.current = queryGeminiDraw;
  }, [queryGeminiDraw]);

  // Speech Recognition loop
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition || !isAiEnabled || recordingStatus !== 'recording') {
      // Stop and cleanup if not needed
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch (_) {}
        speechRecognitionRef.current = null;
      }
      return;
    }

    // Start fresh recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    speechRecognitionRef.current = recognition;

    recognition.onresult = (e: any) => {
      let finalText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalText += e.results[i][0].transcript + ' ';
        }
      }
      if (finalText.trim()) {
        const words = finalText.trim().split(/\s+/);
        const currentTime = recordingTimeValueRef.current;
        const newWords = words.map(word => ({ text: word, time: currentTime }));
        const updatedWords = [...transcriptWordsRef.current, ...newWords];
        setTranscriptWords(updatedWords);
        transcriptWordsRef.current = updatedWords;
        saveMetadataValue('transcriptWords', updatedWords).catch(err => console.error("Error saving progressive transcriptWords", err));

        speechTranscriptRef.current += finalText;
        setTranscript(prev => {
          const nextText = prev + finalText;
          saveMetadataValue('transcript', nextText).catch(err => console.error("Error saving progressive transcript", err));
          return nextText;
        });
        drawingTextBufferRef.current += finalText;

        // 1. Questions Track (slow): 15-second throttle using accumulated transcript
        if (!aiQuestionsThrottleRef.current) {
          aiQuestionsThrottleRef.current = window.setTimeout(() => {
            queryGeminiQuestionsRef.current(speechTranscriptRef.current);
            aiQuestionsThrottleRef.current = null;
          }, 15000);
        }

        // 2. Whiteboard Drawing Track (fast): 2.5-second buffer/throttle using sentence segments
        if (viewModeRef.current === 'whiteboard') {
          if (!aiDrawThrottleRef.current) {
            aiDrawThrottleRef.current = window.setTimeout(() => {
              queryGeminiDrawRef.current(drawingTextBufferRef.current);
              drawingTextBufferRef.current = '';
              aiDrawThrottleRef.current = null;
            }, 2500);
          }
        }
      }
    };

    // Auto-restart on silence/timeout — keeps listening without clearing transcript
    recognition.onend = () => {
      if (isAiEnabled && recordingStatus === 'recording' && speechRecognitionRef.current === recognition) {
        try { recognition.start(); } catch (_) {}
      }
    };

    recognition.onerror = (e: any) => {
      // 'no-speech' is normal, ignore it and let onend restart
      if (e.error !== 'no-speech') {
        console.warn('SpeechRecognition error:', e.error);
      }
    };

    try { recognition.start(); } catch (_) {}

    return () => {
      speechRecognitionRef.current = null;
      try { recognition.stop(); } catch (_) {}
    };
  }, [isAiEnabled, recordingStatus]);

  // Clear AI transcript and suggestions when recording stops
  useEffect(() => {
    if (recordingStatus === 'idle') {
      speechTranscriptRef.current = '';
      setTranscript('');
      setAiSuggestions([]);
      drawingTextBufferRef.current = '';
      if (aiQuestionsThrottleRef.current) {
        clearTimeout(aiQuestionsThrottleRef.current);
        aiQuestionsThrottleRef.current = null;
      }
      if (aiDrawThrottleRef.current) {
        clearTimeout(aiDrawThrottleRef.current);
        aiDrawThrottleRef.current = null;
      }
    }
  }, [recordingStatus]);

  // Sync state variables with active project on change
  useEffect(() => {
    if (currentProject) {
      const normalizedScenes = currentProject.scenes.map(s => {
        if (s.viewMode === 'bullet-journal') {
          return {
            ...s,
            viewMode: 'whiteboard' as ViewMode,
            whiteboardTemplate: 'bullet' as const,
            canvasStates: {
              ...s.canvasStates,
              whiteboard: s.canvasStates?.whiteboard || s.canvasStates?.['bullet-journal'] || ''
            }
          };
        }
        return s;
      });
      setScenes(normalizedScenes);
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
    const views: ViewMode[] = ['whiteboard', 'media', 'corkboard', 'bullet-journal', 'hero-journey', 'word-cloud'];
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
  const handleSetFlashlightActive = (val: boolean) => {
    setFlashlightActive(val);
    const updatedScenes = scenes.map(s => {
      if (s.id === activeSceneId) {
        return { ...s, flashlightActive: val };
      }
      return s;
    });
    setScenes(updatedScenes);
    saveCurrentProjectState(updatedScenes, activeSceneId, scriptText);
  };

  const [flashlightPos, setFlashlightPos] = useState({ x: 960, y: 540 });

  // Floating Widgets
  const [widgetsVisible, setWidgetsVisible] = useState({
    timer: false,
    checklist: true,
    scratchpad: false,
    question: false,
  });

  const [activeTab, setActiveTab] = useState<'canvas' | 'script' | 'record'>('canvas');
  const [previewMicStream, setPreviewMicStream] = useState<MediaStream | null>(null);
  const [activeMicStream, setActiveMicStream] = useState<MediaStream | null>(null);
  const [activeScreenStream, setActiveScreenStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (activeTab === 'record' && recordingStatus === 'idle' && selectedMicId) {
      let active = true;
      navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: selectedMicId } }
      }).then(stream => {
        if (active) {
          setPreviewMicStream(stream);
        } else {
          stream.getTracks().forEach(t => t.stop());
        }
      }).catch(err => {
        console.warn("Failed to open preview mic stream", err);
      });

      return () => {
        active = false;
        setPreviewMicStream(prev => {
          if (prev) {
            prev.getTracks().forEach(t => t.stop());
          }
          return null;
        });
      };
    } else {
      setPreviewMicStream(prev => {
        if (prev) {
          prev.getTracks().forEach(t => t.stop());
        }
        return null;
      });
    }
  }, [activeTab, selectedMicId, recordingStatus]);

  const currentMicStream = recordingStatus === 'recording' ? activeMicStream : previewMicStream;
  const micLevel = useAudioLevel(currentMicStream);
  const screenLevel = useAudioLevel(activeScreenStream);

  // Sidebar collapse state — declared before calculateScale so it can be read inside it
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => window.innerWidth < 768);

  // Aspect ratio scaling
  const [scale, setScale] = useState<number>(1);

  const calculateScale = (collapsed?: boolean) => {
    const sidebarW = (collapsed ?? isSidebarCollapsed) ? 52 : 280;
    const bottomH = 72;
    const availW = window.innerWidth - sidebarW;
    const availH = window.innerHeight - bottomH;
    const targetW = isMobileMode ? 1080 : 1920;
    const targetH = isMobileMode ? 1920 : 1080;
    setScale(Math.min(availW / targetW, availH / targetH));
  };

  useEffect(() => {
    calculateScale();
    const onResize = () => calculateScale();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isSidebarCollapsed, isMobileMode]);

  // Sync webcam slot height to correct aspect ratio on layout switch
  useEffect(() => {
    setWebcamHeight(Math.round(isMobileMode ? (webcamWidth * 16 / 9) : (webcamWidth * 9 / 16)));
  }, [isMobileMode, webcamWidth]);

  const toggleWidget = (widget: 'timer' | 'checklist' | 'scratchpad' | 'question') => {
    setWidgetsVisible(prev => {
      const next = { ...prev, [widget]: !prev[widget] };
      const updatedScenes = scenes.map(s => {
        if (s.id === activeSceneId) {
          return { ...s, widgetsVisible: next };
        }
        return s;
      });
      setScenes(updatedScenes);
      saveCurrentProjectState(updatedScenes, activeSceneId, scriptText);
      return next;
    });
  };

  const handleClearWhiteboard = () => {
    setClearTrigger(prev => prev + 1);
    updateSceneCustomData(activeSceneId, 'aiDrawings', []);
  };
  const handleUndoWhiteboard = () => setUndoTrigger(prev => prev + 1);

  // Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const webcamRecorderRef = useRef<MediaRecorder | null>(null);
  const isRollbackStoppingRef = useRef<boolean>(false);
  const currentSegmentIdRef = useRef<string>('');
  const previewPlayerRef = useRef<HTMLVideoElement | null>(null);
  const chunkSequenceRef = useRef<number>(0);
  const webcamChunkSequenceRef = useRef<number>(0);
  const manifestRef = useRef<VideoSegment[]>([]);
  const transcriptWordsRef = useRef<{ text: string; time: number }[]>([]);

  // Check for crash recovery on boot
  useEffect(() => {
    checkRecoverableChunks().then(hasAny => {
      setHasRecoverableVideo(hasAny);
    });
  }, []);

  // Prevent accidental tab closures/reloads during recording
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (recordingStatus === 'recording' || recordingStatus === 'paused') {
        e.preventDefault();
        e.returnValue = 'You have an active recording session. If you leave, you can resume or recover the session later, but it is recommended to stop and export first.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [recordingStatus]);

  const startRecordingTimer = () => {
    setRecordingStatus('recording');
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    recordingTimerRef.current = window.setInterval(() => {
      setRecordingTime(t => {
        const nextTime = t + 1;
        
        // Progressively update active segment duration in the manifest and save it
        const currentManifest = [...manifestRef.current];
        if (currentManifest.length > 0) {
          const activeSegment = currentManifest[currentManifest.length - 1];
          activeSegment.duration = nextTime - activeSegment.startTime;
          setRecordingManifest(currentManifest);
          manifestRef.current = currentManifest;
          saveRecordingManifest(currentManifest).catch(err => console.error("Error saving progressive manifest", err));
        }

        // Save current time to IndexedDB progressively
        saveMetadataValue('recordingTime', nextTime).catch(err => console.error("Error saving progressive time", err));
        
        return nextTime;
      });
    }, 1000);
  };

  const compileVideoFiles = async (manifest: VideoSegment[], isWebcam: boolean) => {
    const ffmpeg = new FFmpeg();
    ffmpeg.on('log', ({ message }) => {
      console.log(`FFmpeg Log (${isWebcam ? 'webcam' : 'slides'}):`, message);
      setExportProgress(`FFmpeg: ${message}`);
    });

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    let concatScript = '';
    const loadedFiles: string[] = [];
    const trimmedFiles: string[] = [];

    try {
      for (const [index, segment] of manifest.entries()) {
        const segmentBlob = isWebcam
          ? await getWebcamSegmentBlob(segment.segmentId)
          : await getSegmentBlob(segment.segmentId);

        if (!segmentBlob) {
          console.warn(`No blob found for segment ${segment.segmentId}`);
          continue;
        }

        console.log(`[compileVideoFiles] Segment ${index} (${segment.segmentId}) blob size: ${segmentBlob.size} bytes, type: ${segmentBlob.type}`);

        const inputName = `input_${index}.webm`;
        const trimmedName = `trimmed_${index}.webm`;

        try {
          await ffmpeg.writeFile(inputName, await fetchFile(segmentBlob));
          loadedFiles.push(inputName);

          setExportProgress(`Trimming segment ${index + 1}/${manifest.length} to ${segment.duration.toFixed(1)}s...`);
          await ffmpeg.exec([
            '-y',
            '-fflags', '+genpts+discardcorrupt',
            '-i', inputName,
            '-t', `${segment.duration}`,
            '-c', 'copy',
            trimmedName
          ]);
          trimmedFiles.push(trimmedName);
          concatScript += `file '${trimmedName}'\n`;
        } catch (segmentErr) {
          console.error(`[compileVideoFiles] Failed to process segment index ${index} (${segment.segmentId}):`, segmentErr);
        }
      }

      if (concatScript === '') {
        throw new Error("No segments were compiled successfully.");
      }

      await ffmpeg.writeFile('concat_list.txt', concatScript);
      
      setExportProgress("Concatenating all trimmed segments...");
      await ffmpeg.exec([
        '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', 'concat_list.txt',
        '-c', 'copy',
        'output.webm'
      ]);

      const data = await ffmpeg.readFile('output.webm');
      let dataPart: BlobPart;
      if (typeof data === 'string') {
        dataPart = data;
      } else {
        const bufferCopy = new ArrayBuffer(data.byteLength);
        const view = new Uint8Array(bufferCopy);
        view.set(data);
        dataPart = view;
      }
      return new Blob([dataPart], { type: 'video/webm' });

    } finally {
      try {
        for (const file of loadedFiles) {
          await ffmpeg.deleteFile(file).catch(() => {});
        }
        for (const file of trimmedFiles) {
          await ffmpeg.deleteFile(file).catch(() => {});
        }
        await ffmpeg.deleteFile('concat_list.txt').catch(() => {});
        await ffmpeg.deleteFile('output.webm').catch(() => {});
      } catch (err) {
        console.warn("Cleanup virtual FS error", err);
      }
    }
  };

  const handleNormalStopRecording = async () => {
    if (displayStreamRef.current) displayStreamRef.current.getTracks().forEach(t => t.stop());
    if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => t.stop());
    setActiveMicStream(null);
    setActiveScreenStream(null);
    
    setIsExporting(true);
    setExportProgress("Preparing video segments...");

    try {
      const name = recordingName || 'Monologue';
      
      const currentManifest = [...manifestRef.current];
      if (currentManifest.length > 0) {
        const activeSegment = currentManifest[currentManifest.length - 1];
        activeSegment.duration = recordingTimeValueRef.current - activeSegment.startTime;
      }
      setRecordingManifest(currentManifest);
      manifestRef.current = currentManifest;

      await saveRecordingManifest(currentManifest);

      const validManifest = currentManifest.filter(seg => seg.duration > 0);

      if (validManifest.length > 0) {
        setExportProgress("Compiling main slides using FFmpeg...");
        const mainBlob = await compileVideoFiles(validManifest, false);
        const url = URL.createObjectURL(mainBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = exportSeparately ? `${name}_slides.webm` : `${name}.webm`;
        a.click();
        URL.revokeObjectURL(url);

        if (exportSeparately) {
          setExportProgress("Compiling webcam feed using FFmpeg...");
          const camBlob = await compileVideoFiles(validManifest, true);
          const urlCam = URL.createObjectURL(camBlob);
          const aCam = document.createElement('a');
          aCam.href = urlCam;
          aCam.download = `${name}_webcam.webm`;
          aCam.click();
          URL.revokeObjectURL(urlCam);
        }
      } else {
        setExportProgress("No segments found. Exporting raw chunks...");
        const { chunks } = await getRecordingChunks();
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: chunks[0].type });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = exportSeparately ? `${name}_slides.webm` : `${name}.webm`;
          a.click();
          URL.revokeObjectURL(url);
        }
        if (exportSeparately) {
          const { chunks: camChunks } = await getWebcamChunks();
          if (camChunks.length > 0) {
            const blob = new Blob(camChunks, { type: camChunks[0].type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${name}_webcam.webm`;
            a.click();
            URL.revokeObjectURL(url);
          }
        }
      }
    } catch (err) {
      console.error("Failed to compile recording", err);
      alert("Failed to stitch video files using FFmpeg.wasm. Saving raw chunks fallback.");
      try {
        const { chunks } = await getRecordingChunks();
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: chunks[0].type });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${recordingName || 'Monologue'}_slides_raw.webm`;
          a.click();
          URL.revokeObjectURL(url);
        }
      } catch (e) {
        console.error("Raw chunks download failed", e);
      }
    } finally {
      cleanupPausePreview();
      await clearRecordingChunks();
      await clearWebcamChunks();
      setHasRecoverableVideo(false);
      setRecordingStatus('idle');
      setRecordingTime(0);
      setTranscriptWords([]);
      transcriptWordsRef.current = [];
      setRecordingManifest([]);
      manifestRef.current = [];
      setIsExporting(false);
      setExportProgress('');
    }
  };

  const handleStartRecording = async () => {
    if (hasRecoverableVideo) {
      setActiveTab('record');
      alert("You have an unsaved recording from a previous session. Please choose to 'Resume Recording', 'Stitch & Download', or 'Discard' in the Recording panel (Sidebar) before starting a new recording.");
      return;
    }
    if (!navigator.mediaDevices.getDisplayMedia) {
      alert(
        "Notice: Mobile browser restrictions prevent direct screen capture.\n\n" +
        "To record both slides and webcam, please toggle Fullscreen and use your phone's native screen recorder (from iOS Control Center or Android Quick Settings).\n\n" +
        "We will start fallback camera-only recording in the background."
      );
    }
    try {
      let initialManifest: VideoSegment[] = [];
      if (recordingTime === 0) {
        chunkSequenceRef.current = 0;
        webcamChunkSequenceRef.current = 0;
        await clearRecordingChunks();
        await clearWebcamChunks();
        setTranscriptWords([]);
        transcriptWordsRef.current = [];
        
        const startSegId = 'seg-' + Date.now();
        currentSegmentIdRef.current = startSegId;
        initialManifest = [{ segmentId: startSegId, startTime: 0, duration: 0 }];
        setRecordingManifest(initialManifest);
        manifestRef.current = initialManifest;
        await saveRecordingManifest(initialManifest);
      } else {
        const newSegId = 'seg-' + Date.now();
        currentSegmentIdRef.current = newSegId;
        const updatedManifest = [
          ...manifestRef.current,
          { segmentId: newSegId, startTime: recordingTime, duration: 0 }
        ];
        setRecordingManifest(updatedManifest);
        manifestRef.current = updatedManifest;
        await saveRecordingManifest(updatedManifest);
      }
      await saveRecordingMetadata(recordingName || 'Monologue');

      const { audioCtx, dest } = getAudioMixer() as { audioCtx: AudioContext; soundboardGain: any; dest: MediaStreamAudioDestinationNode };
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      // Capture Microphone
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : true
      });
      micStreamRef.current = micStream;
      setActiveMicStream(micStream);
      const micSource = audioCtx.createMediaStreamSource(micStream);
      micSource.connect(dest);

      // Capture Screen (or Camera fallback on devices without getDisplayMedia like mobile phones)
      let displayStream: MediaStream;
      let videoTrack: MediaStreamTrack;

      if (!navigator.mediaDevices.getDisplayMedia) {
        displayStream = await navigator.mediaDevices.getUserMedia({
          video: selectedCameraId ? {
            deviceId: { exact: selectedCameraId },
            width: isMobileMode ? { ideal: 1080 } : { ideal: 1920 },
            height: isMobileMode ? { ideal: 1920 } : { ideal: 1080 },
            aspectRatio: isMobileMode ? { ideal: 9/16 } : { ideal: 16/9 }
          } : {
            width: isMobileMode ? { ideal: 1080 } : { ideal: 1920 },
            height: isMobileMode ? { ideal: 1920 } : { ideal: 1080 },
            aspectRatio: isMobileMode ? { ideal: 9/16 } : { ideal: 16/9 },
            facingMode: 'user'
          }
        });
        displayStreamRef.current = displayStream;
        setActiveScreenStream(displayStream);
        videoTrack = displayStream.getVideoTracks()[0];
      } else {
        displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: isMobileMode ? 1080 : 1920,
            height: isMobileMode ? 1920 : 1080,
            displaySurface: "browser",
            cursor: "never"
          } as any,
          audio: true,
          preferCurrentTab: true,
          selfBrowserSurface: "include"
        } as any);
        displayStreamRef.current = displayStream;
        setActiveScreenStream(displayStream);

        if (displayStream.getAudioTracks().length > 0) {
          const screenAudioSource = audioCtx.createMediaStreamSource(displayStream);
          screenAudioSource.connect(dest);
        }

        // Apply Region Capture (crop to the 1920x1080 or 1080x1920 recording canvas) if supported
        videoTrack = displayStream.getVideoTracks()[0];
        const CropTarget = (window as any).CropTarget;
        const recordingCanvasEl = document.querySelector('.recording-canvas');

        if (CropTarget && typeof CropTarget.fromElement === 'function' && typeof (videoTrack as any).cropTo === 'function' && recordingCanvasEl) {
          try {
            const cropTarget = await CropTarget.fromElement(recordingCanvasEl);
            await (videoTrack as any).cropTo(cropTarget);
            console.log("Region Capture crop applied successfully to the recording canvas.");
          } catch (cropErr) {
            console.warn("Region Capture crop failed, proceeding with full tab capture:", cropErr);
          }
        } else {
          console.warn("Region Capture (cropTo) is not supported in this browser, recording full tab.");
        }
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

      const activeSegId = currentSegmentIdRef.current;
      const recorder = new MediaRecorder(mixedStream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = async (e) => {
        if (e.data && e.data.size > 0) {
          const seq = chunkSequenceRef.current++;
          await saveRecordingChunk(activeSegId, seq, e.data);
        }
      };

      recorder.onstop = async () => {
        if (isRollbackStoppingRef.current) {
          return;
        }
        await handleNormalStopRecording();
      };

      // Set up secondary webcam recording if exportSeparately is ON and webcamStreamRef is active
      if (exportSeparately && webcamStreamRef.current && webcamStreamRef.current.active) {
        const webcamTrack = webcamStreamRef.current.getVideoTracks()[0];
        const webcamMixedStream = new MediaStream([
          webcamTrack,
          dest.stream.getAudioTracks()[0]
        ]);
        const camRecorder = new MediaRecorder(webcamMixedStream, { mimeType });
        webcamRecorderRef.current = camRecorder;

        camRecorder.ondataavailable = async (e) => {
          if (e.data && e.data.size > 0) {
            const seq = webcamChunkSequenceRef.current++;
            await saveWebcamChunk(activeSegId, seq, e.data);
          }
        };

        camRecorder.onstop = async () => {
          if (isRollbackStoppingRef.current) return;
        };

        camRecorder.start(2000);
      }

      isRollbackStoppingRef.current = false;
      recorder.start(2000); // 2 second slices
      setRecordingStatus('recording');
      
      if (recordingTime === 0) {
        setRecordingTime(0);
      }

      startRecordingTimer();

      displayStream.getVideoTracks()[0].onended = () => {
        handleStopRecording();
      };

    } catch (err) {
      console.error("Failed to start recording", err);
      alert("Failed to start recording. Please ensure you shared a browser tab and allowed mic access.");
      setRecordingStatus('idle');
    }
  };

  const loadPausePreview = async () => {
    try {
      const { chunks } = await getRecordingChunks();
      if (chunks.length > 0) {
        const blob = new Blob(chunks, { type: chunks[0].type });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setPlaybackTime(0);
        setSelectedRollbackTime(null);
        setIsPlayingPreview(false);
      }
    } catch (err) {
      console.warn("Failed to load preview for pause state", err);
    }
  };

  const cleanupPausePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setPlaybackTime(0);
    setSelectedRollbackTime(null);
    setIsPlayingPreview(false);
  };

  const handleTogglePreview = () => {
    if (!previewPlayerRef.current) return;
    if (isPlayingPreview) {
      previewPlayerRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewPlayerRef.current.play().catch(e => console.warn("Failed to play preview", e));
      setIsPlayingPreview(true);
    }
  };

  const handlePreviewSeek = (time: number) => {
    if (!previewPlayerRef.current) return;
    previewPlayerRef.current.currentTime = time;
    setSelectedRollbackTime(time);
    setPlaybackTime(time);
  };

  const handlePreviewTimeUpdate = () => {
    if (!previewPlayerRef.current) return;
    setPlaybackTime(previewPlayerRef.current.currentTime);
  };

  const handleConfirmRollback = async () => {
    const rollbackTime = selectedRollbackTime !== null ? selectedRollbackTime : playbackTime;
    if (confirm(`Are you sure you want to rollback to ${rollbackTime.toFixed(1)}s? This will permanently discard all recorded video after this time.`)) {
      await handleRollback(rollbackTime);
      cleanupPausePreview();
    }
  };

  const handlePauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      if (webcamRecorderRef.current && webcamRecorderRef.current.state === 'recording') {
        webcamRecorderRef.current.pause();
      }
      setRecordingStatus('paused');
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      loadPausePreview();
    }
  };

  const handleResumeRecording = async () => {
    cleanupPausePreview();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      if (webcamRecorderRef.current && webcamRecorderRef.current.state === 'paused') {
        webcamRecorderRef.current.resume();
      }
      startRecordingTimer();
      return;
    }

    if (displayStreamRef.current && displayStreamRef.current.active) {
      try {
        const newSegId = 'seg-' + Date.now();
        currentSegmentIdRef.current = newSegId;
        const updatedManifest = [
          ...manifestRef.current,
          { segmentId: newSegId, startTime: recordingTime, duration: 0 }
        ];
        setRecordingManifest(updatedManifest);
        manifestRef.current = updatedManifest;
        await saveRecordingManifest(updatedManifest);

        const { audioCtx, dest } = getAudioMixer() as { audioCtx: AudioContext; soundboardGain: any; dest: MediaStreamAudioDestinationNode };
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }

        const videoTrack = displayStreamRef.current.getVideoTracks()[0];
        const mixedStream = new MediaStream([
          videoTrack,
          dest.stream.getAudioTracks()[0]
        ]);

        let mimeType = 'video/webm;codecs=vp9,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=h264,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';

        const activeSegId = currentSegmentIdRef.current;
        const recorder = new MediaRecorder(mixedStream, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = async (e) => {
          if (e.data && e.data.size > 0) {
            const seq = chunkSequenceRef.current++;
            await saveRecordingChunk(activeSegId, seq, e.data);
          }
        };

        recorder.onstop = async () => {
          if (isRollbackStoppingRef.current) return;
          await handleNormalStopRecording();
        };

        if (exportSeparately && webcamStreamRef.current && webcamStreamRef.current.active) {
          const webcamTrack = webcamStreamRef.current.getVideoTracks()[0];
          const webcamMixedStream = new MediaStream([
            webcamTrack,
            dest.stream.getAudioTracks()[0]
          ]);
          const camRecorder = new MediaRecorder(webcamMixedStream, { mimeType });
          webcamRecorderRef.current = camRecorder;

          camRecorder.ondataavailable = async (e) => {
            if (e.data && e.data.size > 0) {
              const seq = webcamChunkSequenceRef.current++;
              await saveWebcamChunk(activeSegId, seq, e.data);
            }
          };

          camRecorder.onstop = async () => {
            if (isRollbackStoppingRef.current) return;
          };

          camRecorder.start(2000);
        }

        isRollbackStoppingRef.current = false;
        recorder.start(2000);
        startRecordingTimer();

      } catch (err) {
        console.error("Failed to resume recording from rollback", err);
        handleStartRecording();
      }
    } else {
      handleStartRecording();
    }
  };

  const handleStopRecording = () => {
    isRollbackStoppingRef.current = false;
    
    const hasActiveRecorder = (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') ||
                              (webcamRecorderRef.current && webcamRecorderRef.current.state !== 'inactive');
                              
    if (hasActiveRecorder) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (webcamRecorderRef.current && webcamRecorderRef.current.state !== 'inactive') {
        webcamRecorderRef.current.stop();
      }
    } else {
      handleNormalStopRecording();
    }
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const handleRollback = async (time: number) => {
    isRollbackStoppingRef.current = true;
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (webcamRecorderRef.current && webcamRecorderRef.current.state !== 'inactive') {
      webcamRecorderRef.current.stop();
    }
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    const updatedManifest = manifestRef.current.filter(seg => seg.startTime < time);
    if (updatedManifest.length > 0) {
      const activeSegment = updatedManifest[updatedManifest.length - 1];
      activeSegment.duration = time - activeSegment.startTime;
    }
    
    setRecordingManifest(updatedManifest);
    manifestRef.current = updatedManifest;

    const validIds = updatedManifest.map(seg => seg.segmentId);
    await cleanUnusedSegments(validIds);
    await saveRecordingManifest(updatedManifest);
    
    const filtered = transcriptWordsRef.current.filter(w => w.time <= time);
    setTranscriptWords(filtered);
    transcriptWordsRef.current = filtered;
    const reconstructedText = filtered.map(w => w.text).join(' ') + (filtered.length > 0 ? ' ' : '');
    setTranscript(reconstructedText);
    speechTranscriptRef.current = reconstructedText;
    
    setRecordingTime(time);
    setRecordingStatus('paused');
  };

  const handleRecoverVideo = async () => {
    const name = recordingName || 'recovered_video';
    setIsExporting(true);
    setExportProgress("Checking database for saved segments...");
    let success = false;
    try {
      const manifest = await getRecordingManifest();
      const validManifest = manifest.filter(seg => seg.duration > 0);

      if (validManifest.length > 0) {
        setExportProgress("Compiling main slides using FFmpeg...");
        const mainBlob = await compileVideoFiles(validManifest, false);
        const url = URL.createObjectURL(mainBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = exportSeparately ? `${name}_slides.webm` : `${name}.webm`;
        a.click();
        URL.revokeObjectURL(url);

        if (exportSeparately) {
          setExportProgress("Compiling webcam feed using FFmpeg...");
          const camBlob = await compileVideoFiles(validManifest, true);
          const urlCam = URL.createObjectURL(camBlob);
          const aCam = document.createElement('a');
          aCam.href = urlCam;
          aCam.download = `${name}_webcam.webm`;
          aCam.click();
          URL.revokeObjectURL(urlCam);
        }
        success = true;
      } else {
        setExportProgress("No segment manifest found. Exporting raw chunks fallback...");
        const { chunks } = await getRecordingChunks();
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: chunks[0].type });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = exportSeparately ? `${name}_slides.webm` : `${name}.webm`;
          a.click();
          URL.revokeObjectURL(url);
          success = true;
        }
        if (exportSeparately) {
          const { chunks: camChunks } = await getWebcamChunks();
          if (camChunks.length > 0) {
            const blob = new Blob(camChunks, { type: camChunks[0].type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${name}_webcam.webm`;
            a.click();
            URL.revokeObjectURL(url);
          }
        }
      }
    } catch (err) {
      console.error("Failed to recover recording", err);
      alert("Failed to compile or recover recording using FFmpeg.wasm. Your recording data remains intact in the browser.");
    } finally {
      cleanupPausePreview();
      if (success) {
        await clearRecordingChunks();
        await clearWebcamChunks();
        setHasRecoverableVideo(false);
      }
      setIsExporting(false);
      setExportProgress('');
    }
  };

  const handleResumeRecoveredSession = async () => {
    try {
      const manifest = await getRecordingManifest();
      const metadataName = await getMetadataValue('videoName') || 'recovered_video';
      const savedTime = await getMetadataValue('recordingTime') || 0;
      const savedTranscriptWords = await getMetadataValue('transcriptWords') || [];
      const savedTranscript = await getMetadataValue('transcript') || '';

      // Populate states
      setRecordingTime(savedTime);
      setRecordingName(metadataName);
      setRecordingManifest(manifest);
      manifestRef.current = manifest;

      setTranscriptWords(savedTranscriptWords);
      transcriptWordsRef.current = savedTranscriptWords;

      setTranscript(savedTranscript);
      speechTranscriptRef.current = savedTranscript;

      setRecordingStatus('paused'); // Switch to paused state
      setHasRecoverableVideo(false); // No longer in unrecovered state

      alert("Unsaved recording session successfully loaded! Share your screen/microphone again when you're ready to resume recording.");
    } catch (err) {
      console.error("Failed to restore session", err);
      alert("Failed to restore recording session.");
    }
  };

  const handleDiscardRecoveredSession = async () => {
    if (confirm("Are you sure you want to permanently discard the unsaved recording? This cannot be undone.")) {
      await clearRecordingChunks();
      await clearWebcamChunks();
      setHasRecoverableVideo(false);
      setRecordingTime(0);
      setTranscriptWords([]);
      transcriptWordsRef.current = [];
      setRecordingManifest([]);
      manifestRef.current = [];
      setTranscript('');
      speechTranscriptRef.current = '';
    }
  };

  // Scene manager loading & saving handlers
  const handleSelectScene = (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;
    
    if (isPageTurning) return;

    // Synchronously capture active drawings of the scene we are leaving
    const currentCanvasStates: { [key: string]: string } = {};
    const views: ViewMode[] = ['whiteboard', 'media', 'corkboard', 'bullet-journal', 'hero-journey', 'word-cloud'];
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

  const handleDeleteScene = (sceneId: string) => {
    if (scenes.length <= 1) {
      alert("You must have at least one scene layout.");
      return;
    }
    const updated = scenes.filter(s => s.id !== sceneId);
    setScenes(updated);
    
    let nextActiveId = activeSceneId;
    if (activeSceneId === sceneId) {
      nextActiveId = updated[0].id;
      setActiveSceneId(nextActiveId);
      const scene = updated[0];
      setViewMode(scene.viewMode);
      setDiagramType(scene.diagramType);
      setWhiteboardActive(scene.whiteboardActive);
      setWhiteboardOnTop(scene.whiteboardOnTop);
      setFlashlightActive(scene.flashlightActive);
      setWidgetsVisible(scene.widgetsVisible);
    }
    
    saveCurrentProjectState(updated, nextActiveId, scriptText);
  };

  const handleSaveCurrentScene = (name: string) => {
    const canvasStates: { [key: string]: string } = {};
    const views: ViewMode[] = ['whiteboard', 'media', 'corkboard', 'bullet-journal', 'hero-journey', 'word-cloud'];
    
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
    let nextWhiteboardActive = false;
    let nextWhiteboardOnTop = false;
    if (mode === 'whiteboard') {
      nextWhiteboardActive = true;
    }
    setWhiteboardActive(nextWhiteboardActive);
    setWhiteboardOnTop(nextWhiteboardOnTop);
    setFlashlightActive(false);

    const updatedScenes = scenes.map(s => {
      if (s.id === activeSceneId) {
        return {
          ...s,
          viewMode: mode,
          whiteboardActive: nextWhiteboardActive,
          whiteboardOnTop: nextWhiteboardOnTop,
          flashlightActive: false
        };
      }
      return s;
    });
    setScenes(updatedScenes);
    saveCurrentProjectState(updatedScenes, activeSceneId, scriptText);
  };

  const handleToggleDrawOnDiagram = () => {
    const next = !whiteboardActive;
    setWhiteboardActive(next);
    setWhiteboardOnTop(next);
    const updatedScenes = scenes.map(s => {
      if (s.id === activeSceneId) {
        return { ...s, whiteboardActive: next, whiteboardOnTop: next };
      }
      return s;
    });
    setScenes(updatedScenes);
    saveCurrentProjectState(updatedScenes, activeSceneId, scriptText);
  };

  const handleScriptTextChange = (text: string) => {
    setScriptText(text);
    saveCurrentProjectState(scenes, activeSceneId, text);
  };

  const updateSceneCustomData = (sceneId: string, key: string, value: any) => {
    const updated = scenes.map(s => {
      if (s.id === sceneId) {
        return { ...s, [key]: value };
      }
      return s;
    });
    setScenes(updated);
    saveCurrentProjectState(updated, activeSceneId, scriptText);
  };

  // ── Export current project as JSON file ───────────────────────────────
  const importFileRef = useRef<HTMLInputElement | null>(null);

  const handleExportProject = () => {
    const project = projects.find(p => p.id === currentProjectId);
    if (!project) return;
    const json = JSON.stringify({ ...project, scriptText }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportProjectFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported: Project = JSON.parse(ev.target?.result as string);
        if (!imported.id || !imported.name || !Array.isArray(imported.scenes)) {
          alert('Invalid project file — missing id, name, or scenes.');
          return;
        }
        const fresh: Project = { ...imported, id: `project-${Date.now()}` };
        setProjects(prev => {
          const updated = [...prev, fresh];
          localStorage.setItem('video_journal_projects', JSON.stringify(updated));
          return updated;
        });
        setCurrentProjectId(fresh.id);
        setScenes(fresh.scenes);
        setActiveSceneId(fresh.activeSceneId || fresh.scenes[0]?.id || '');
        setScriptText(fresh.scriptText || '');
        localStorage.setItem('video_journal_current_project_id', fresh.id);
      } catch {
        alert('Could not parse project file. Make sure it is valid JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleImportProject = () => {
    importFileRef.current?.click();
  };

  // ── Drag & Drop project import on the whole app window ─────────────────
  const [isDragOver, setIsDragOver] = useState(false);


  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file || !file.name.endsWith('.json')) return;
    handleImportProjectFile(file);
  };

  return (
    <div
      className="app-shell"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(138,166,142,0.18)',
          border: '3px dashed rgba(138,166,142,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
          backdropFilter: 'blur(2px)',
        }}>
          <div style={{
            background: 'rgba(44,31,21,0.92)',
            border: '1px solid rgba(138,166,142,0.5)',
            borderRadius: '14px',
            padding: '24px 36px',
            color: '#8AA68E',
            fontFamily: 'Inter, sans-serif',
            fontSize: '18px',
            fontWeight: 600,
            letterSpacing: '0.5px',
          }}>
            📂 Drop project JSON to import
          </div>
        </div>
      )}
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
        whiteboardActive={whiteboardActive}
        whiteboardOnTop={whiteboardOnTop}
        onToggleDrawOnDiagram={handleToggleDrawOnDiagram}
        triggerClearWhiteboard={handleClearWhiteboard}
        flashlightActive={flashlightActive}
        setFlashlightActive={handleSetFlashlightActive}
        webcamVisible={webcamVisible}
        setWebcamVisible={setWebcamVisible}
        webcamPosition={webcamPosition}
        setWebcamPosition={(pos) => {
          setWebcamPosition(pos);
          if (pos !== 'custom') {
            setWebcamX(null);
            setWebcamY(null);
          }
        }}
        webcamStyle={webcamStyle}
        setWebcamStyle={setWebcamStyle}
        webcamShape={webcamShape}
        setWebcamShape={setWebcamShape}
        webcamAutoFraming={webcamAutoFraming}
        setWebcamAutoFraming={setWebcamAutoFraming}
        webcamWidth={webcamWidth}
        setWebcamWidth={setWebcamWidth}
        webcamHeight={webcamHeight}
        setWebcamHeight={setWebcamHeight}
        widgetsVisible={widgetsVisible}
        toggleWidget={toggleWidget}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        micLevel={micLevel}
        screenLevel={screenLevel}
        onDeleteScene={handleDeleteScene}
        scriptText={scriptText}
        setScriptText={handleScriptTextChange}
        isAiEnabled={isAiEnabled}
        setIsAiEnabled={setIsAiEnabled}
        geminiApiKey={geminiApiKey}
        setGeminiApiKey={setGeminiApiKey}
        aiSuggestions={aiSuggestions}
        projects={projects}
        currentProjectId={currentProjectId}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
        onExportProject={handleExportProject}
        onImportProject={handleImportProject}
        scenes={scenes}
        activeSceneId={activeSceneId}
        onSelectScene={handleSelectScene}
        onSaveCurrentScene={handleSaveCurrentScene}
        onRenameScene={handleRenameScene}
        onUpdateSceneCustomData={updateSceneCustomData}
        recordingStatus={recordingStatus}
        recordingName={recordingName}
        setRecordingName={handleRecordingNameChange}
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
        onResumeSession={handleResumeRecoveredSession}
        onDiscardSession={handleDiscardRecoveredSession}
        isMobileMode={isMobileMode}
        setIsMobileMode={setIsMobileMode}
        exportSeparately={exportSeparately}
        setExportSeparately={setExportSeparately}
        transcriptWords={transcriptWords}
        onRollback={handleRollback}
      />

      {/* Hidden file input for import button */}
      <input
        ref={importFileRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) handleImportProjectFile(f);
          e.target.value = '';
        }}
      />

      {/* ======================================================
          RIGHT COLUMN — recording canvas + bottom toolbar
      ====================================================== */}
      <div className="right-column">
        <div className="canvas-area">
          <div
            className="scale-wrapper"
            style={{
              transform: `scale(${scale})`,
              width: isMobileMode ? '1080px' : '1920px',
              height: isMobileMode ? '1920px' : '1080px',
            }}
          >
            {/* ---- THE RECORDING CANVAS (1920x1080 or 1080x1920) ---- */}
            <div
              className={`recording-canvas theme-${theme}`}
              style={isImmersiveMode ? {} : getCanvasBgStyle()}
              onMouseMove={handleCanvasMouseMove}
            >
              {/* MEDIA VIEW */}
              <div data-view="media" style={{ display: viewMode === 'media' ? 'block' : 'none', width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
                {activeSceneId === 'scene-intro' ? (
                  <IntroSceneView
                    theme={theme}
                    data={activeScene?.introData || defaultIntroData}
                    onChange={(newData) => updateSceneCustomData(activeSceneId, 'introData', newData)}
                  />
                ) : activeSceneId === 'scene-about-me' ? (
                  <AboutMeSceneView
                    theme={theme}
                    data={activeScene?.aboutMeData || defaultAboutMeData}
                    onChange={(newData) => updateSceneCustomData(activeSceneId, 'aboutMeData', newData)}
                  />
                ) : activeSceneId === 'scene-plan' ? (
                  <PlanSceneView
                    theme={theme}
                    data={activeScene?.planData || defaultPlanData}
                    onChange={(newData) => updateSceneCustomData(activeSceneId, 'planData', newData)}
                  />
                ) : activeSceneId === 'scene-outro' ? (
                  <OutroSceneView
                    theme={theme}
                    data={activeScene?.outroData || defaultOutroData}
                    onChange={(newData) => updateSceneCustomData(activeSceneId, 'outroData', newData)}
                  />
                ) : (
                  <MediaCanvasView
                    theme={theme}
                    data={activeScene?.mediaData || defaultMediaData}
                    onChange={(newData) => updateSceneCustomData(activeSceneId, 'mediaData', newData)}
                  />
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
              <div data-view="corkboard" style={{ display: viewMode === 'corkboard' ? 'block' : 'none', width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
                <CorkboardView
                  data={activeScene?.corkboardData || defaultCorkboardData}
                  onChange={(newData) => updateSceneCustomData(activeSceneId, 'corkboardData', newData)}
                />
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

              {/* HERO'S JOURNEY VIEW */}
              <div data-view="hero-journey" style={{ display: viewMode === 'hero-journey' ? 'block' : 'none', width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
                <HeroJourneyView
                  data={activeScene?.heroJourneyData || defaultHeroJourneyData}
                  onChange={(newData) => updateSceneCustomData(activeSceneId, 'heroJourneyData', newData)}
                />
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

              {/* WHITEBOARD VIEW (solid whiteboard or bullet journal template) */}
              <div data-view="whiteboard" style={{ display: viewMode === 'whiteboard' ? 'block' : 'none', width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
                <WhiteboardCanvas
                  isActive={viewMode === 'whiteboard'}
                  drawOnTop={activeScene?.whiteboardTemplate === 'bullet'}
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
                  template={activeScene?.whiteboardTemplate || 'blank'}
                  bulletJournalData={activeScene?.bulletJournalData || defaultBulletJournalData}
                  onBulletJournalDataChange={(newData) => updateSceneCustomData(activeSceneId, 'bulletJournalData', newData)}
                />
              </div>

              {/* WORD CLOUD VIEW */}
              <div data-view="word-cloud" style={{ display: viewMode === 'word-cloud' ? 'block' : 'none', width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
                <WordCloudView
                  transcript={transcript}
                  theme={theme}
                />
                <WhiteboardCanvas
                  isActive={viewMode === 'word-cloud' && whiteboardActive}
                  drawOnTop={true}
                  theme={theme}
                  strokeColor={strokeColor}
                  setStrokeColor={setStrokeColor}
                  brushType={brushType}
                  setBrushType={setBrushType}
                  brushSize={brushSize}
                  setBrushSize={setBrushSize}
                  clearTrigger={viewMode === 'word-cloud' ? clearTrigger : 0}
                  undoTrigger={viewMode === 'word-cloud' ? undoTrigger : 0}
                  showToolbar={false}
                  restoreDataUrl={scenes.find(s => s.id === activeSceneId)?.canvasStates?.['word-cloud']}
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
                  shape={webcamShape}
                  width={webcamWidth}
                  height={webcamHeight}
                  theme={theme}
                  selectedCameraId={selectedCameraId}
                  isMobileMode={isMobileMode}
                  x={webcamX}
                  y={webcamY}
                  scale={scale}
                  onPositionChange={(newX, newY) => {
                    setWebcamX(newX);
                    setWebcamY(newY);
                    setWebcamPosition('custom');
                  }}
                  onSizeChange={(newWidth) => {
                    setWebcamWidth(newWidth);
                  }}
                  autoFraming={webcamAutoFraming}
                  onStreamCreated={(s) => {
                    webcamStreamRef.current = s;
                  }}
                />
              )}

              {/* Draggable Widgets */}
              {widgetsVisible.timer && (
                <DraggableWidget title="timer" defaultX={isMobileMode ? 40 : 1480} defaultY={isMobileMode ? 40 : 80} scale={scale} theme={theme} onClose={() => toggleWidget('timer')}>
                  <TimerWidget theme={theme} />
                </DraggableWidget>
              )}
              {widgetsVisible.checklist && (
                <DraggableWidget title="agenda outline" defaultX={isMobileMode ? 40 : 1200} defaultY={isMobileMode ? 450 : 280} scale={scale} theme={theme} width={isMobileMode ? 1000 : 800} onClose={() => toggleWidget('checklist')}>
                  <ChecklistWidget
                    items={activeScene?.checklistItems !== undefined ? activeScene.checklistItems : defaultChecklistItems}
                    onChange={(newItems) => updateSceneCustomData(activeSceneId, 'checklistItems', newItems)}
                  />
                </DraggableWidget>
              )}
              {widgetsVisible.scratchpad && (
                <DraggableWidget title="monologue scratches" defaultX={isMobileMode ? 40 : 1480} defaultY={isMobileMode ? 1150 : 530} scale={scale} theme={theme} width={isMobileMode ? 1000 : 400} onClose={() => toggleWidget('scratchpad')}>
                  <ScratchpadWidget
                    text={activeScene?.scratchpadText !== undefined ? activeScene.scratchpadText : defaultScratchpadText}
                    onChange={(newText) => updateSceneCustomData(activeSceneId, 'scratchpadText', newText)}
                  />
                </DraggableWidget>
              )}
              {widgetsVisible.question && (
                <DraggableWidget title="reflection prompt" defaultX={isMobileMode ? 40 : 80} defaultY={isMobileMode ? 160 : 80} scale={scale} theme={theme} width={isMobileMode ? 1000 : 1000} onClose={() => toggleWidget('question')}>
                  <QuestionPromptWidget
                    question={activeScene?.questionText !== undefined ? activeScene.questionText : defaultQuestionText}
                    onChange={(newText) => updateSceneCustomData(activeSceneId, 'questionText', newText)}
                  />
                </DraggableWidget>
              )}

              {/* Page-Turn Transition Overlay */}
              <div className={`page-turn-overlay ${isPageTurning ? 'active' : ''}`}>
                <div className="page-turn-sheet" />
              </div>
            </div>
          </div>
        </div>

        {/* Playback Seeker / Rollback Timeline Overlay */}
        {recordingStatus === 'paused' && previewUrl && (
          <div style={{
            position: 'fixed',
            bottom: '76px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '1000px',
            backgroundColor: 'rgba(30, 21, 16, 0.94)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(244, 234, 213, 0.15)',
            borderRadius: '16px',
            padding: '16px 20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            zIndex: 850,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            fontFamily: 'Inter, sans-serif',
            color: '#F4EAD5',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={handleTogglePreview}
                  style={{
                    background: isPlayingPreview ? 'rgba(232, 176, 154, 0.2)' : 'var(--terracotta)',
                    border: 'none',
                    color: '#F4EAD5',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isPlayingPreview ? '⏸ Pause Preview' : '▶ Play Preview'}
                </button>
                
                <span style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--warm-gold)' }}>
                  {(() => {
                    const format = (t: number) => {
                      const mins = Math.floor(t / 60);
                      const secs = Math.floor(t % 60);
                      const ms = Math.floor((t % 1) * 10);
                      return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
                    };
                    const cur = selectedRollbackTime !== null ? selectedRollbackTime : playbackTime;
                    return `${format(cur)} / ${format(recordingTime)}`;
                  })()}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleConfirmRollback}
                  style={{
                    background: 'var(--terracotta)',
                    border: 'none',
                    color: '#F4EAD5',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(184, 103, 74, 0.3)'
                  }}
                >
                  ↩ Rollback & Overwrite From Here
                </button>
                <button
                  onClick={cleanupPausePreview}
                  style={{
                    background: 'rgba(244, 234, 213, 0.1)',
                    border: '1px solid rgba(244, 234, 213, 0.2)',
                    color: '#F4EAD5',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel Seeker
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '10px' }}>
              <input
                type="range"
                min={0}
                max={recordingTime}
                step={0.1}
                value={selectedRollbackTime !== null ? selectedRollbackTime : playbackTime}
                onChange={(e) => handlePreviewSeek(parseFloat(e.target.value))}
                style={{
                  flex: 1,
                  accentColor: 'var(--terracotta)',
                  background: 'rgba(244, 234, 213, 0.1)',
                  height: '6px',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              />
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              background: '#0c0705', 
              borderRadius: '8px', 
              padding: '6px',
              border: '1px solid rgba(244,234,213,0.06)'
            }}>
              <video
                ref={previewPlayerRef}
                src={previewUrl}
                onTimeUpdate={handlePreviewTimeUpdate}
                onEnded={() => setIsPlayingPreview(false)}
                style={{
                  height: '140px',
                  borderRadius: '6px',
                  aspectRatio: isMobileMode ? '9/16' : '16/9',
                  backgroundColor: '#000',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                }}
              />
            </div>
          </div>
        )}

        <BottomToolbar
          viewMode={viewMode}
          setViewMode={handleSetViewMode}
          whiteboardActive={whiteboardActive}
          whiteboardOnTop={whiteboardOnTop}
          onToggleDrawOnDiagram={handleToggleDrawOnDiagram}
          flashlightActive={flashlightActive}
          setFlashlightActive={handleSetFlashlightActive}
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
          isMobileMode={isMobileMode}
          setIsMobileMode={setIsMobileMode}
        />
      </div>

      {/* Floating Mobile Record Bar */}
      {isMobileMode && (
        <div style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 900,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(30, 21, 16, 0.95)',
          border: '1px solid rgba(244, 234, 213, 0.15)',
          padding: '6px 12px',
          borderRadius: '20px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
          fontFamily: 'Inter, sans-serif',
          backdropFilter: 'blur(10px)',
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: recordingStatus === 'recording' ? 'var(--terracotta)' : recordingStatus === 'paused' ? 'var(--warm-gold)' : 'rgba(244,234,213,0.2)',
            animation: recordingStatus === 'recording' ? 'pulse 1.5s infinite' : 'none'
          }} />
          <span style={{ color: '#F4EAD5', fontSize: '12px', fontFamily: 'Lora, serif', marginRight: '6px' }}>
            {(() => {
              const mins = Math.floor(recordingTime / 60);
              const secs = recordingTime % 60;
              return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            })()}
          </span>
          {recordingStatus === 'idle' ? (
            <button
              onClick={handleStartRecording}
              style={{
                background: 'var(--terracotta)',
                border: 'none',
                color: '#F4EAD5',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Rec
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '4px' }}>
              {recordingStatus === 'recording' ? (
                <button onClick={handlePauseRecording} style={{ background: 'rgba(244,234,213,0.1)', border: '1px solid rgba(244,234,213,0.2)', color: '#F4EAD5', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                  Pause
                </button>
              ) : (
                <button onClick={handleResumeRecording} style={{ background: 'var(--terracotta)', border: 'none', color: '#F4EAD5', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                  Resume
                </button>
              )}
              <button onClick={handleStopRecording} style={{ background: 'rgba(232,176,154,0.15)', border: '1px solid rgba(232,176,154,0.3)', color: '#E8B09A', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                Stop
              </button>
            </div>
          )}
        </div>
      )}

      {isExporting && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(9, 9, 11, 0.9)',
          backdropFilter: 'blur(12px)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#f4ead5',
          fontFamily: 'Inter, sans-serif',
          padding: '24px',
          textAlign: 'center'
        }}>
          <style>{`
            @keyframes compile-spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(232, 176, 154, 0.2)',
            borderTopColor: 'var(--terracotta)',
            borderRadius: '50%',
            animation: 'compile-spin 1s linear infinite',
            marginBottom: '24px'
          }} />
          <h2 style={{
            fontSize: '24px',
            fontWeight: 700,
            fontFamily: 'Lora, serif',
            color: '#F4EAD5',
            margin: '0 0 8px 0',
            letterSpacing: '-0.02em'
          }}>
            Compiling Video
          </h2>
          <p style={{
            color: 'rgba(244, 234, 213, 0.7)',
            fontSize: '14px',
            maxWidth: '400px',
            margin: '0 0 24px 0',
            lineHeight: 1.5
          }}>
            Stitching and remuxing segments using client-side FFmpeg.wasm. This process runs entirely in your browser and ensures zero frame corruption.
          </p>
          <div style={{
            padding: '12px 20px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(244, 234, 213, 0.1)',
            borderRadius: '12px',
            fontSize: '12px',
            fontFamily: 'monospace',
            color: 'var(--warm-gold)',
            maxWidth: '500px',
            width: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {exportProgress || "Initializing WebAssembly compiler..."}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
