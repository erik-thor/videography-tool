export interface AmbientSound {
  id: string;
  name: string;
  file: string;
  audio: HTMLAudioElement | null;
  volume: number;
}

export const AMBIENT_SOUNDS: AmbientSound[] = [
  { id: 'birds', name: 'Bird Sounds', file: '/sounds/birds.mp3', audio: null, volume: 0.5 },
  { id: 'insects', name: 'Insects & Crickets', file: '/sounds/insects.mp3', audio: null, volume: 0.5 },
  { id: 'zen', name: 'Zen Meditation', file: '/sounds/zen.mp3', audio: null, volume: 0.5 },
  { id: 'rain', name: 'Rainfall', file: '/sounds/rain.mp3', audio: null, volume: 0.5 },
  { id: 'wind', name: 'Gentle Wind', file: '/sounds/wind.mp3', audio: null, volume: 0.5 },
  { id: 'waterfall', name: 'Waterfall', file: '/sounds/waterfall.mp3', audio: null, volume: 0.5 },
  { id: 'beach', name: 'Gentle Beach', file: '/sounds/beach.mp3', audio: null, volume: 0.5 },
];

export const TRANSITION_SOUNDS = {
  pageFlip: { id: 'page-flip', name: 'Page Flip', file: '/sounds/page-flip.mp3', audio: null as HTMLAudioElement | null }
};

export const initAudio = (sound: { file: string; audio: HTMLAudioElement | null }, loop = true): HTMLAudioElement => {
  if (sound.audio) return sound.audio;
  const audio = new Audio(sound.file);
  audio.loop = loop;
  audio.crossOrigin = 'anonymous'; // Crucial for AudioContext nodes to work without cross-origin silencing
  sound.audio = audio;
  return audio;
};
