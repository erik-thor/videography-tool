import React, { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';

export type WebcamPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'fullscreen';
export type WebcamStyle = 'chroma-green' | 'chroma-magenta' | 'placeholder' | 'hidden';

interface WebcamSlotProps {
  position: WebcamPosition;
  styleMode: WebcamStyle;
  width: number;
  height: number;
  theme: 'light' | 'dark';
  selectedCameraId?: string;
}

export const WebcamSlot: React.FC<WebcamSlotProps> = ({
  position,
  styleMode,
  width,
  height,
  theme,
  selectedCameraId,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (styleMode === 'hidden' || styleMode === 'chroma-green' || styleMode === 'chroma-magenta') {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        setStream(null);
      }
      return;
    }

    let active = true;
    const constraints: MediaStreamConstraints = {
      video: selectedCameraId ? { deviceId: { exact: selectedCameraId } } : true
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then(s => {
        if (active) {
          setStream(s);
        }
      })
      .catch(err => {
        console.warn("Could not capture camera stream:", err);
      });

    return () => {
      active = false;
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [styleMode, selectedCameraId]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (styleMode === 'hidden') return null;

  // Determine positioning classes/styles
  const positionStyles: React.CSSProperties = {
    position: 'absolute',
    zIndex: 40,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  if (position === 'fullscreen') {
    positionStyles.top = '0';
    positionStyles.left = '0';
    positionStyles.width = '100%';
    positionStyles.height = '100%';
  } else {
    positionStyles.width = `${width}px`;
    positionStyles.height = `${height}px`;
    switch (position) {
      case 'top-left':
        positionStyles.top = '24px';
        positionStyles.left = '24px';
        break;
      case 'top-right':
        positionStyles.top = '24px';
        positionStyles.right = '24px';
        break;
      case 'bottom-left':
        positionStyles.bottom = '24px';
        positionStyles.left = '24px';
        break;
      case 'bottom-right':
        positionStyles.bottom = '24px';
        positionStyles.right = '24px';
        break;
    }
  }

  let styleClasses = '';
  const inlineStyles: React.CSSProperties = { ...positionStyles };

  if (styleMode === 'chroma-green') {
    inlineStyles.backgroundColor = '#00FF00';
    inlineStyles.border = 'none';
  } else if (styleMode === 'chroma-magenta') {
    inlineStyles.backgroundColor = '#FF00FF';
    inlineStyles.border = 'none';
  } else {
    // Placeholder Mode
    inlineStyles.backgroundColor = theme === 'dark' ? 'rgba(44, 31, 21, 0.3)' : 'rgba(244, 234, 213, 0.3)';
    inlineStyles.border = `2px dashed ${theme === 'dark' ? 'var(--blush-rose)' : 'var(--terracotta)'}`;
    styleClasses = 'webcam-placeholder';
  }

  return (
    <div
      style={inlineStyles}
      className={`webcam-slot ${styleClasses} rounded-lg overflow-hidden flex flex-col items-center justify-center`}
    >
      {styleMode === 'placeholder' && !stream && (
        <div
          style={{
            color: theme === 'dark' ? 'var(--blush-rose)' : 'var(--terracotta)',
            fontFamily: 'Lora, serif',
            fontSize: '14px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Camera size={24} />
          <span>Webcam Overlay Area</span>
          <span style={{ fontSize: '11px', opacity: 0.7 }}>
            {width}x{height}
          </span>
        </div>
      )}
      {styleMode === 'placeholder' && stream && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </div>
  );
};
