import { AMBIENT_SOUNDS, TRANSITION_SOUNDS, initAudio } from './audioRegistry';

// IndexedDB Helper functions for crash-safe progressive recording
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('InteractiveVideoRecorderDB', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('chunks')) {
        db.createObjectStore('chunks', { autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const clearRecordingChunks = async (): Promise<void> => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['chunks', 'metadata'], 'readwrite');
    tx.objectStore('chunks').clear();
    tx.objectStore('metadata').clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const saveRecordingChunk = async (chunk: Blob): Promise<void> => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('chunks', 'readwrite');
    tx.objectStore('chunks').add(chunk);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const saveRecordingMetadata = async (name: string): Promise<void> => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('metadata', 'readwrite');
    tx.objectStore('metadata').put(name, 'videoName');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getRecordingChunks = async (): Promise<{ name: string; chunks: Blob[] }> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['chunks', 'metadata'], 'readonly');
    const chunksStore = tx.objectStore('chunks');
    const metaStore = tx.objectStore('metadata');
    
    let name = 'recovered_video';
    const chunks: Blob[] = [];
    
    metaStore.get('videoName').onsuccess = (e: any) => {
      if (e.target.result) name = e.target.result;
    };
    
    chunksStore.openCursor().onsuccess = (e: any) => {
      const cursor = e.target.result;
      if (cursor) {
        chunks.push(cursor.value);
        cursor.continue();
      } else {
        resolve({ name, chunks });
      }
    };
    
    tx.onerror = () => reject(tx.error);
  });
};

// Global AudioContext Mixer variables
let audioCtx: AudioContext | null = null;
let soundboardGain: GainNode | null = null;
let dest: MediaStreamAudioDestinationNode | null = null;

// MediaElementAudioSourceNode storage to prevent duplicate source node binding on HTMLAudioElements
const connectedSources = new Map<HTMLAudioElement, MediaElementAudioSourceNode>();
const loopGains = new Map<string, GainNode>();

export const setSoundboardVolume = (soundId: string, volume: number) => {
  const gainNode = loopGains.get(soundId);
  if (gainNode) {
    gainNode.gain.setValueAtTime(volume, audioCtx?.currentTime ?? 0);
  }
};

export const getAudioMixer = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    dest = audioCtx.createMediaStreamDestination();
    soundboardGain = audioCtx.createGain();
    soundboardGain.connect(dest);
    soundboardGain.connect(audioCtx.destination);
  }

  // Wire up ambient loops
  AMBIENT_SOUNDS.forEach(sound => {
    const audioEl = initAudio(sound, true);
    if (!connectedSources.has(audioEl)) {
      try {
        const sourceNode = audioCtx!.createMediaElementSource(audioEl);
        const gainNode = audioCtx!.createGain();
        gainNode.gain.setValueAtTime(sound.volume, audioCtx!.currentTime);
        sourceNode.connect(gainNode);
        gainNode.connect(soundboardGain!);
        connectedSources.set(audioEl, sourceNode);
        loopGains.set(sound.id, gainNode);
      } catch (e) {
        console.warn(`Could not connect source for ${sound.id}`, e);
      }
    }
  });

  // Wire up page flip
  const flipAudioEl = initAudio(TRANSITION_SOUNDS.pageFlip, false);
  if (!connectedSources.has(flipAudioEl)) {
    try {
      const flipSourceNode = audioCtx!.createMediaElementSource(flipAudioEl);
      const flipGainNode = audioCtx!.createGain();
      flipGainNode.gain.setValueAtTime(0.8, audioCtx!.currentTime);
      flipSourceNode.connect(flipGainNode);
      flipGainNode.connect(soundboardGain!);
      connectedSources.set(flipAudioEl, flipSourceNode);
      loopGains.set('page-flip', flipGainNode);
    } catch (e) {
      console.warn("Could not connect source for page-flip", e);
    }
  }

  return { audioCtx, soundboardGain, dest };
};

// Checks if there are any recovered chunks on boot
export const checkRecoverableChunks = async (): Promise<boolean> => {
  try {
    const { chunks } = await getRecordingChunks();
    return chunks.length > 0;
  } catch {
    return false;
  }
};
