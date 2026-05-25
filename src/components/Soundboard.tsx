import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, Music } from 'lucide-react';
import { AMBIENT_SOUNDS, TRANSITION_SOUNDS, initAudio } from '../utils/audioRegistry';
import { getAudioMixer, setSoundboardVolume } from '../utils/videoRecorder';

export const Soundboard: React.FC = () => {
  const [playingStates, setPlayingStates] = useState<{ [key: string]: boolean }>({});
  const [volumes, setVolumes] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    // Sync initial states
    const initialPlaying: { [key: string]: boolean } = {};
    const initialVolumes: { [key: string]: number } = {};
    
    AMBIENT_SOUNDS.forEach(s => {
      if (s.audio) {
        initialPlaying[s.id] = !s.audio.paused;
        initialVolumes[s.id] = s.audio.volume;
      } else {
        initialPlaying[s.id] = false;
        initialVolumes[s.id] = s.volume;
      }
    });
    setPlayingStates(initialPlaying);
    setVolumes(initialVolumes);
  }, []);

  const handleTogglePlay = (id: string) => {
    // Initialize mixer and resume context on click (user gesture) to make sure audio context works
    try {
      const { audioCtx } = getAudioMixer();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    } catch (e) {
      console.warn("Could not initialize AudioContext mixer on click:", e);
    }

    const sound = AMBIENT_SOUNDS.find(s => s.id === id);
    if (!sound) return;
    const audio = initAudio(sound, true);

    if (playingStates[id]) {
      audio.pause();
      setPlayingStates(prev => ({ ...prev, [id]: false }));
    } else {
      // Set volume before playing
      const vol = volumes[id] ?? sound.volume;
      audio.volume = vol;
      setSoundboardVolume(id, vol);
      audio.play().catch(err => {
        console.warn(`Could not play loop ${id}: audio file might be missing in /public/sounds/`, err);
      });
      setPlayingStates(prev => ({ ...prev, [id]: true }));
    }
  };

  const handleVolumeChange = (id: string, value: number) => {
    setVolumes(prev => ({ ...prev, [id]: value }));
    const sound = AMBIENT_SOUNDS.find(s => s.id === id);
    if (!sound) return;
    if (sound.audio) {
      sound.audio.volume = value;
    }
    sound.volume = value;
    setSoundboardVolume(id, value);
  };

  const handlePageFlip = () => {
    try {
      const { audioCtx } = getAudioMixer();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    } catch (e) {
      console.warn("Could not initialize AudioContext mixer on page flip:", e);
    }

    const sound = TRANSITION_SOUNDS.pageFlip;
    const audio = initAudio(sound, false);
    audio.currentTime = 0;
    audio.volume = 0.8;
    setSoundboardVolume('page-flip', 0.8);
    audio.play().catch(err => {
      console.warn('Could not play page flip sound: file might be missing in /public/sounds/', err);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.2px', color: 'rgba(244,234,213,0.4)' }}>
          Atmospheric Loops
        </span>
        <button
          onClick={handlePageFlip}
          style={{
            background: 'rgba(184,103,74,0.15)',
            border: '1px solid rgba(184,103,74,0.3)',
            borderRadius: '5px',
            color: '#E8B09A',
            padding: '3px 8px',
            fontSize: '11px',
            cursor: 'pointer',
            fontFamily: 'Inter',
            fontWeight: 500,
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(184,103,74,0.25)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(184,103,74,0.15)')}
        >
          📖 Page Flip SFX
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
        {AMBIENT_SOUNDS.map(sound => {
          const isPlaying = playingStates[sound.id] || false;
          const vol = volumes[sound.id] ?? sound.volume;

          return (
            <div
              key={sound.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                borderRadius: '6px',
                background: isPlaying ? 'rgba(244,234,213,0.06)' : 'rgba(244,234,213,0.02)',
                border: '1px solid rgba(244,234,213,0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => handleTogglePlay(sound.id)}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    border: 'none',
                    background: isPlaying ? 'var(--terracotta)' : 'rgba(244,234,213,0.1)',
                    color: isPlaying ? '#F4EAD5' : 'rgba(244,234,213,0.7)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                </button>
                <span style={{ fontSize: '13px', color: 'rgba(244,234,213,0.85)', fontWeight: 500 }}>
                  {sound.name}
                </span>
              </div>

              {/* Volume Slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Volume2 size={12} style={{ color: 'rgba(244,234,213,0.3)' }} />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={vol}
                  onChange={e => handleVolumeChange(sound.id, parseFloat(e.target.value))}
                  style={{
                    width: '60px',
                    accentColor: 'var(--terracotta)',
                    cursor: 'pointer',
                    height: '3px',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
