import React, { useEffect, useRef, useState } from 'react';
import { Camera, Move } from 'lucide-react';

export type WebcamPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'fullscreen' | 'custom';
export type WebcamStyle = 'none' | 'glow' | 'sage' | 'slate' | 'blush' | 'polaroid' | 'chroma-green' | 'chroma-magenta' | 'hidden';
export type WebcamShape = 'rectangle' | 'square' | 'circle';

interface WebcamSlotProps {
  position: WebcamPosition;
  styleMode: WebcamStyle;
  shape?: WebcamShape;
  width: number;
  height: number;
  theme: 'light' | 'dark';
  selectedCameraId?: string;
  isMobileMode?: boolean;
  x?: number | null;
  y?: number | null;
  scale?: number;
  onPositionChange?: (x: number, y: number) => void;
  onSizeChange?: (width: number) => void;
  autoFraming?: boolean;
  onStreamCreated?: (stream: MediaStream | null) => void;
}

export const WebcamSlot: React.FC<WebcamSlotProps> = ({
  position,
  styleMode,
  shape = 'rectangle',
  width,
  height,
  theme,
  selectedCameraId,
  isMobileMode = false,
  x = null,
  y = null,
  scale = 1,
  onPositionChange,
  onSizeChange,
  autoFraming = false,
  onStreamCreated,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const dragStart = useRef({ mouseX: 0, mouseY: 0, initialX: 0, initialY: 0 });
  const resizeStart = useRef({ mouseX: 0, initialWidth: 0 });

  const onStreamCreatedRef = useRef(onStreamCreated);
  useEffect(() => {
    onStreamCreatedRef.current = onStreamCreated;
  }, [onStreamCreated]);

  useEffect(() => {
    if (styleMode === 'hidden' || styleMode === 'chroma-green' || styleMode === 'chroma-magenta') {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        setStream(null);
      }
      if (onStreamCreatedRef.current) onStreamCreatedRef.current(null);
      return;
    }

    let active = true;
    const constraints: MediaStreamConstraints = {
      video: selectedCameraId
        ? {
            deviceId: { exact: selectedCameraId },
            width: isMobileMode ? { ideal: 1080 } : { ideal: 1920 },
            height: isMobileMode ? { ideal: 1920 } : { ideal: 1080 },
            aspectRatio: isMobileMode ? { ideal: 9 / 16 } : { ideal: 16 / 9 },
          }
        : {
            width: isMobileMode ? { ideal: 1080 } : { ideal: 1920 },
            height: isMobileMode ? { ideal: 1920 } : { ideal: 1080 },
            aspectRatio: isMobileMode ? { ideal: 9 / 16 } : { ideal: 16 / 9 },
          },
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then(s => {
        if (active) {
          setStream(s);
          if (onStreamCreatedRef.current) onStreamCreatedRef.current(s);
        }
      })
      .catch(err => {
        console.warn("Could not capture camera stream:", err);
        if (onStreamCreatedRef.current) onStreamCreatedRef.current(null);
      });

    return () => {
      active = false;
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      if (onStreamCreatedRef.current) onStreamCreatedRef.current(null);
    };
  }, [styleMode, selectedCameraId, isMobileMode]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const smoothX = useRef(0.5);
  const cvCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!autoFraming || !stream) {
      if (videoRef.current) {
        videoRef.current.style.transform = 'none';
      }
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 60;
    cvCanvasRef.current = canvas;
    const ctx = canvas.getContext('2d');

    let animationId: number;

    const processFrame = () => {
      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        ctx.drawImage(video, 0, 0, 80, 60);
        const imgData = ctx.getImageData(0, 0, 80, 60);
        const data = imgData.data;

        let skinCount = 0;
        let sumX = 0;

        for (let y = 0; y < 60; y++) {
          for (let x = 0; x < 80; x++) {
            const idx = (y * 80 + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            const isSkin =
              r > 95 &&
              g > 40 &&
              b > 20 &&
              r > g &&
              r > b &&
              Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
              Math.abs(r - g) > 15;

            if (isSkin) {
              skinCount++;
              sumX += x;
            }
          }
        }

        if (skinCount > 20) {
          const targetX = sumX / skinCount / 80;
          smoothX.current = smoothX.current * 0.9 + targetX * 0.1;
        } else {
          smoothX.current = smoothX.current * 0.95 + 0.5 * 0.05;
        }

        const videoScale = 1.4;
        const maxPan = (videoScale - 1) / (2 * videoScale); // 0.1428 (14.28%)
        const shiftX = -(smoothX.current - 0.5) * 2 * maxPan * 100;
        video.style.transform = `scale(${videoScale}) translate(${shiftX}%, 0)`;
        video.style.transformOrigin = 'center center';
        video.style.transition = 'transform 0.08s ease';
      }

      animationId = requestAnimationFrame(processFrame);
    };

    animationId = requestAnimationFrame(processFrame);

    return () => {
      cancelAnimationFrame(animationId);
      if (videoRef.current) {
        videoRef.current.style.transform = 'none';
      }
    };
  }, [autoFraming, stream]);

  const maxW = isMobileMode ? 1080 : 1920;
  const maxH = isMobileMode ? 1920 : 1080;

  // Compute current positions mathematically to avoid layout jump
  let currentX = 24;
  let currentY = maxH - height - 24; // default to bottom-left

  if (x !== null && x !== undefined && y !== null && y !== undefined && position === 'custom') {
    currentX = x;
    currentY = y;
  } else {
    switch (position) {
      case 'top-left':
        currentX = 24;
        currentY = 24;
        break;
      case 'top-right':
        currentX = maxW - width - 24;
        currentY = 24;
        break;
      case 'bottom-left':
        currentX = 24;
        currentY = maxH - height - 24;
        break;
      case 'bottom-right':
        currentX = maxW - width - 24;
        currentY = maxH - height - 24;
        break;
      case 'fullscreen':
        currentX = 0;
        currentY = 0;
        break;
    }
  }

  // Drag and Resize handlers
  const handleDragStart = (e: React.MouseEvent) => {
    if (position === 'fullscreen') return;
    
    // Don't drag if clicked on resize handle
    const target = e.target as HTMLElement;
    if (target.closest('.resize-handle')) return;

    setIsDragging(true);
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX: currentX,
      initialY: currentY,
    };
    e.preventDefault();
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    resizeStart.current = {
      mouseX: e.clientX,
      initialWidth: width,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && onPositionChange) {
        const dx = e.clientX - dragStart.current.mouseX;
        const dy = e.clientY - dragStart.current.mouseY;
        
        const newX = dragStart.current.initialX + dx / scale;
        const newY = dragStart.current.initialY + dy / scale;

        const boundedX = Math.max(0, Math.min(newX, maxW - width));
        const boundedY = Math.max(0, Math.min(newY, maxH - height));

        onPositionChange(Math.round(boundedX), Math.round(boundedY));
      }

      if (isResizing && onSizeChange) {
        const dx = e.clientX - resizeStart.current.mouseX;
        const newWidth = resizeStart.current.initialWidth + dx / scale;
        const boundedW = Math.max(160, Math.min(newWidth, 640));

        onSizeChange(Math.round(boundedW));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, width, height, maxW, maxH, scale, onPositionChange, onSizeChange]);

  if (styleMode === 'hidden') return null;

  // Base positioning styles
  const positionStyles: React.CSSProperties = {
    position: 'absolute',
    zIndex: 40,
    boxSizing: 'border-box',
    transition: isDragging || isResizing ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: position === 'fullscreen' ? 'default' : (isDragging ? 'grabbing' : 'grab'),
  };

  if (position === 'fullscreen') {
    positionStyles.top = '0';
    positionStyles.left = '0';
    positionStyles.width = '100%';
    positionStyles.height = '100%';
  } else {
    positionStyles.left = `${currentX}px`;
    positionStyles.top = `${currentY}px`;
    positionStyles.width = `${width}px`;
    positionStyles.height = `${height}px`;
  }

  // Set Shape styles
  const shapeStyles: React.CSSProperties = {};
  if (position !== 'fullscreen') {
    if (shape === 'circle') {
      shapeStyles.borderRadius = '50%';
    } else {
      shapeStyles.borderRadius = '12px';
    }
  }

  const inlineStyles: React.CSSProperties = {
    ...positionStyles,
    ...shapeStyles,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  // Define Frame styles
  if (styleMode === 'chroma-green') {
    inlineStyles.backgroundColor = '#00FF00';
    inlineStyles.border = 'none';
    inlineStyles.boxShadow = 'none';
  } else if (styleMode === 'chroma-magenta') {
    inlineStyles.backgroundColor = '#FF00FF';
    inlineStyles.border = 'none';
    inlineStyles.boxShadow = 'none';
  } else if (styleMode === 'none') {
    inlineStyles.backgroundColor = theme === 'dark' ? 'rgba(44, 31, 21, 0.2)' : 'rgba(244, 234, 213, 0.2)';
    inlineStyles.border = theme === 'dark' ? '1.2px solid rgba(244, 234, 213, 0.15)' : '1.2px solid rgba(44, 31, 21, 0.1)';
    inlineStyles.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
  } else if (styleMode === 'glow') {
    inlineStyles.backgroundColor = theme === 'dark' ? 'rgba(44, 31, 21, 0.2)' : 'rgba(244, 234, 213, 0.2)';
    inlineStyles.border = '2px solid var(--blush-rose)';
    inlineStyles.boxShadow = '0 0 15px var(--blush-rose), 0 0 25px rgba(232, 176, 154, 0.4)';
  } else if (styleMode === 'sage') {
    inlineStyles.backgroundColor = theme === 'dark' ? 'rgba(44, 31, 21, 0.2)' : 'rgba(244, 234, 213, 0.2)';
    inlineStyles.border = '3px solid var(--sage)';
    inlineStyles.boxShadow = '0 4px 12px rgba(138, 166, 142, 0.25)';
  } else if (styleMode === 'slate') {
    inlineStyles.backgroundColor = theme === 'dark' ? 'rgba(44, 31, 21, 0.2)' : 'rgba(244, 234, 213, 0.2)';
    inlineStyles.border = '3px solid var(--slate-blue)';
    inlineStyles.boxShadow = '0 4px 12px rgba(123, 145, 184, 0.25)';
  } else if (styleMode === 'blush') {
    inlineStyles.backgroundColor = theme === 'dark' ? 'rgba(44, 31, 21, 0.2)' : 'rgba(244, 234, 213, 0.2)';
    inlineStyles.border = '3px solid var(--blush-rose)';
    inlineStyles.boxShadow = '0 4px 12px rgba(232, 176, 154, 0.25)';
  } else if (styleMode === 'polaroid') {
    inlineStyles.backgroundColor = '#F8F5F0';
    if (position !== 'fullscreen') {
      if (shape === 'circle') {
        inlineStyles.border = '8px solid #F8F5F0';
        inlineStyles.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)';
      } else {
        inlineStyles.borderStyle = 'solid';
        inlineStyles.borderColor = '#F8F5F0';
        inlineStyles.borderWidth = '8px 8px 32px 8px';
        inlineStyles.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)';
        inlineStyles.borderRadius = '4px'; // typical square Polaroid edges
      }
    }
  }

  const renderContent = () => {
    if (styleMode === 'chroma-green' || styleMode === 'chroma-magenta') {
      return null;
    }

    if (!stream) {
      return (
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
          <span>Webcam Slot</span>
          <span style={{ fontSize: '11px', opacity: 0.7 }}>
            {width}x{height}
          </span>
        </div>
      );
    }

    return (
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: styleMode === 'polaroid' && shape === 'circle' ? '50%' : 'inherit',
        }}
      />
    );
  };

  return (
    <div
      style={inlineStyles}
      className={`webcam-slot relative`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleDragStart}
    >
      {/* Draggable Hover Grid Overlay */}
      {isHovered && position !== 'fullscreen' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            border: '1.5px dashed var(--terracotta)',
            borderRadius: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(184, 103, 74, 0.05)',
            zIndex: 45,
          }}
        >
          <Move size={20} style={{ color: 'var(--terracotta)', opacity: 0.7 }} />
        </div>
      )}

      {renderContent()}

      {/* Resizer Handle */}
      <div
        className="resize-handle"
        onMouseDown={handleResizeStart}
        style={{
          position: 'absolute',
          bottom: shape === 'circle' ? '12px' : '4px',
          right: shape === 'circle' ? '12px' : '4px',
          width: '12px',
          height: '12px',
          cursor: 'nwse-resize',
          zIndex: 50,
          display: isHovered && position !== 'fullscreen' ? 'block' : 'none',
          borderRight: '3px solid var(--terracotta)',
          borderBottom: '3px solid var(--terracotta)',
          opacity: 0.85,
        }}
        title="Drag to resize"
      />
    </div>
  );
};
