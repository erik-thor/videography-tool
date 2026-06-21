import { useEffect, useState } from 'react';

export const useAudioLevel = (stream: MediaStream | null) => {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) {
      setLevel(0);
      return;
    }

    let audioContext: AudioContext | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let analyser: AnalyserNode | null = null;
    let animationFrameId: number;
    let active = true;

    const initAnalyzer = async () => {
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.4;
        
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateLevel = () => {
          if (!active) return;
          if (!analyser) return;

          analyser.getByteFrequencyData(dataArray);
          
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          
          // Map average (0-255) to a clean 0-100 level
          // Speak levels usually average around 10-100, scale it nicely
          const scaled = Math.min(100, Math.round((average / 90) * 100));
          setLevel(scaled);
          
          animationFrameId = requestAnimationFrame(updateLevel);
        };

        if (audioContext.state === 'suspended') {
          audioContext.resume().then(() => {
            if (active) updateLevel();
          });
        } else {
          updateLevel();
        }
      } catch (e) {
        console.warn("Failed to initialize audio analyzer", e);
      }
    };

    initAnalyzer();

    return () => {
      active = false;
      cancelAnimationFrame(animationFrameId);
      if (source) {
        try { source.disconnect(); } catch (err) {}
      }
      if (analyser) {
        try { analyser.disconnect(); } catch (err) {}
      }
      if (audioContext && audioContext.state !== 'closed') {
        try { audioContext.close(); } catch (err) {}
      }
    };
  }, [stream]);

  return level;
};
