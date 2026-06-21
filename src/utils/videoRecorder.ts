import { AMBIENT_SOUNDS, TRANSITION_SOUNDS, initAudio } from './audioRegistry';

// IndexedDB Helper functions for crash-safe progressive recording
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('InteractiveVideoRecorderDB', 2);
    request.onupgradeneeded = (e: any) => {
      const db = request.result;
      if (!db.objectStoreNames.contains('chunks')) {
        db.createObjectStore('chunks', { autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('webcam_chunks')) {
        db.createObjectStore('webcam_chunks', { autoIncrement: true });
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

export const clearWebcamChunks = async (): Promise<void> => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['webcam_chunks'], 'readwrite');
    tx.objectStore('webcam_chunks').clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const saveRecordingChunk = async (segmentId: string, sequence: number, chunk: Blob): Promise<void> => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('chunks', 'readwrite');
    tx.objectStore('chunks').add({ segmentId, sequence, blob: chunk });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const saveWebcamChunk = async (segmentId: string, sequence: number, chunk: Blob): Promise<void> => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('webcam_chunks', 'readwrite');
    tx.objectStore('webcam_chunks').add({ segmentId, sequence, blob: chunk });
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

export const saveRecordingManifest = async (manifest: any[]): Promise<void> => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('metadata', 'readwrite');
    tx.objectStore('metadata').put(manifest, 'recordingManifest');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getRecordingManifest = async (): Promise<any[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('metadata', 'readonly');
    const store = tx.objectStore('metadata');
    const req = store.get('recordingManifest');
    req.onsuccess = (e: any) => {
      resolve(e.target.result || []);
    };
    req.onerror = () => reject(tx.error);
  });
};


export const getRecordingChunks = async (): Promise<{ name: string; chunks: Blob[] }> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['chunks', 'metadata'], 'readonly');
    const chunksStore = tx.objectStore('chunks');
    const metaStore = tx.objectStore('metadata');
    
    let name = 'recovered_video';
    const records: { sequence: number; blob: Blob }[] = [];
    
    metaStore.get('videoName').onsuccess = (e: any) => {
      if (e.target.result) name = e.target.result;
    };
    
    chunksStore.openCursor().onsuccess = (e: any) => {
      const cursor = e.target.result;
      if (cursor) {
        const val = cursor.value;
        if (val instanceof Blob) {
          records.push({ sequence: 0, blob: val });
        } else if (val && val.blob) {
          records.push({
            sequence: typeof val.sequence === 'number' ? val.sequence : 0,
            blob: val.blob
          });
        }
        cursor.continue();
      } else {
        records.sort((a, b) => a.sequence - b.sequence);
        resolve({ name, chunks: records.map(r => r.blob) });
      }
    };
    
    tx.onerror = () => reject(tx.error);
  });
};

export const getWebcamChunks = async (): Promise<{ name: string; chunks: Blob[] }> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['webcam_chunks', 'metadata'], 'readonly');
    const webcamStore = tx.objectStore('webcam_chunks');
    const metaStore = tx.objectStore('metadata');
    
    let name = 'recovered_video';
    const records: { sequence: number; blob: Blob }[] = [];
    
    metaStore.get('videoName').onsuccess = (e: any) => {
      if (e.target.result) name = e.target.result;
    };
    
    webcamStore.openCursor().onsuccess = (e: any) => {
      const cursor = e.target.result;
      if (cursor) {
        const val = cursor.value;
        if (val instanceof Blob) {
          records.push({ sequence: 0, blob: val });
        } else if (val && val.blob) {
          records.push({
            sequence: typeof val.sequence === 'number' ? val.sequence : 0,
            blob: val.blob
          });
        }
        cursor.continue();
      } else {
        records.sort((a, b) => a.sequence - b.sequence);
        resolve({ name, chunks: records.map(r => r.blob) });
      }
    };
    
    tx.onerror = () => reject(tx.error);
  });
};

export const getSegmentBlob = async (segmentId: string): Promise<Blob | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chunks', 'readonly');
    const store = tx.objectStore('chunks');
    const records: { sequence: number; blob: Blob }[] = [];
    
    store.openCursor().onsuccess = (e: any) => {
      const cursor = e.target.result;
      if (cursor) {
        const val = cursor.value;
        if (val && typeof val === 'object' && val.segmentId === segmentId) {
          records.push({
            sequence: typeof val.sequence === 'number' ? val.sequence : 0,
            blob: val.blob
          });
        }
        cursor.continue();
      } else {
        if (records.length > 0) {
          records.sort((a, b) => a.sequence - b.sequence);
          console.log(`[getSegmentBlob] segmentId=${segmentId} sorted sequences:`, JSON.stringify(records.map(r => r.sequence)));
          const blobs = records.map(r => r.blob);
          resolve(new Blob(blobs, { type: blobs[0].type }));
        } else {
          console.log(`[getSegmentBlob] segmentId=${segmentId} no records found.`);
          resolve(null);
        }
      }
    };
    tx.onerror = () => reject(tx.error);
  });
};

export const getWebcamSegmentBlob = async (segmentId: string): Promise<Blob | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('webcam_chunks', 'readonly');
    const store = tx.objectStore('webcam_chunks');
    const records: { sequence: number; blob: Blob }[] = [];
    
    store.openCursor().onsuccess = (e: any) => {
      const cursor = e.target.result;
      if (cursor) {
        const val = cursor.value;
        if (val && typeof val === 'object' && val.segmentId === segmentId) {
          records.push({
            sequence: typeof val.sequence === 'number' ? val.sequence : 0,
            blob: val.blob
          });
        }
        cursor.continue();
      } else {
        if (records.length > 0) {
          records.sort((a, b) => a.sequence - b.sequence);
          console.log(`[getWebcamSegmentBlob] segmentId=${segmentId} sorted sequences:`, JSON.stringify(records.map(r => r.sequence)));
          const blobs = records.map(r => r.blob);
          resolve(new Blob(blobs, { type: blobs[0].type }));
        } else {
          console.log(`[getWebcamSegmentBlob] segmentId=${segmentId} no records found.`);
          resolve(null);
        }
      }
    };
    tx.onerror = () => reject(tx.error);
  });
};

export const deleteSegment = async (segmentId: string): Promise<void> => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('chunks', 'readwrite');
    const store = tx.objectStore('chunks');
    store.openCursor().onsuccess = (e: any) => {
      const cursor = e.target.result;
      if (cursor) {
        const val = cursor.value;
        if (val && typeof val === 'object' && val.segmentId === segmentId) {
          cursor.delete();
        }
        cursor.continue();
      } else {
        resolve();
      }
    };
    tx.onerror = () => reject(tx.error);
  });
};

export const deleteWebcamSegment = async (segmentId: string): Promise<void> => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('webcam_chunks', 'readwrite');
    const store = tx.objectStore('webcam_chunks');
    store.openCursor().onsuccess = (e: any) => {
      const cursor = e.target.result;
      if (cursor) {
        const val = cursor.value;
        if (val && typeof val === 'object' && val.segmentId === segmentId) {
          cursor.delete();
        }
        cursor.continue();
      } else {
        resolve();
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

  return {
    audioCtx: audioCtx as AudioContext,
    soundboardGain: soundboardGain as GainNode,
    dest: dest as MediaStreamAudioDestinationNode
  };
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

export const cleanUnusedSegments = async (validSegmentIds: string[]): Promise<void> => {
  const db = await openDB();
  const validSet = new Set(validSegmentIds);
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['chunks', 'webcam_chunks'], 'readwrite');
    const cleanStore = (name: 'chunks' | 'webcam_chunks') => {
      const store = tx.objectStore(name);
      store.openCursor().onsuccess = (e: any) => {
        const cursor = e.target.result;
        if (cursor) {
          const val = cursor.value;
          if (val && typeof val === 'object' && val.segmentId && !validSet.has(val.segmentId)) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
    };
    cleanStore('chunks');
    cleanStore('webcam_chunks');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const saveMetadataValue = async (key: string, value: any): Promise<void> => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('metadata', 'readwrite');
    tx.objectStore('metadata').put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getMetadataValue = async (key: string): Promise<any> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('metadata', 'readonly');
    const store = tx.objectStore('metadata');
    const req = store.get(key);
    req.onsuccess = (e: any) => {
      resolve(e.target.result);
    };
    req.onerror = () => reject(tx.error);
  });
};

