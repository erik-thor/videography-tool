import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Upload, Link } from 'lucide-react';

interface PinnedPhoto {
  id: number;
  src: string;
  x: number;
  y: number;
  rotation: number;
  pinColor: string;
  caption: string;
  width: number;
}

const PIN_COLORS = ['#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA', '#00ACC1', '#F06292', '#FFB300'];

const CORK_SVG_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cellipse cx='12' cy='8' rx='18' ry='5' fill='rgba(139,90,43,0.07)' transform='rotate(30,12,8)'/%3E%3Cellipse cx='55' cy='22' rx='22' ry='6' fill='rgba(100,60,20,0.06)' transform='rotate(-20,55,22)'/%3E%3Cellipse cx='30' cy='55' rx='16' ry='4' fill='rgba(150,100,50,0.08)' transform='rotate(50,30,55)'/%3E%3Cellipse cx='65' cy='65' rx='20' ry='5' fill='rgba(120,80,30,0.07)' transform='rotate(10,65,65)'/%3E%3Cellipse cx='10' cy='60' rx='14' ry='4' fill='rgba(160,110,60,0.06)' transform='rotate(-40,10,60)'/%3E%3C/svg%3E")`;

const PushPin: React.FC<{ color: string }> = ({ color }) => (
  <div style={{ position: 'absolute', top: '-22px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div style={{
      width: '22px', height: '22px', borderRadius: '50%',
      background: `radial-gradient(circle at 35% 35%, ${color}dd, ${color})`,
      boxShadow: `0 3px 8px rgba(0,0,0,0.45), inset 0 -1px 3px rgba(0,0,0,0.2)`,
      position: 'relative',
    }}>
      <div style={{ position: 'absolute', top: '4px', left: '5px', width: '7px', height: '5px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.5)' }} />
    </div>
    <div style={{ width: '3px', height: '14px', background: 'linear-gradient(to bottom, #aaa, #666)', borderRadius: '0 0 2px 2px', marginTop: '-1px' }} />
  </div>
);

interface DragState {
  id: number;
  startMouseX: number;
  startMouseY: number;
  startPhotoX: number;
  startPhotoY: number;
}

interface CorkboardViewProps {
  data?: { photos: PinnedPhoto[] };
  onChange?: (newData: { photos: PinnedPhoto[] }) => void;
}

export const CorkboardView: React.FC<CorkboardViewProps> = ({
  data = { photos: [] },
  onChange,
}) => {
  const [photos, setPhotos] = useState<PinnedPhoto[]>(data.photos);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [editingCaption, setEditingCaption] = useState<number | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPhotos(data.photos);
  }, [data.photos]);

  const handleUpdate = (updatedPhotos: PinnedPhoto[]) => {
    if (onChange) {
      onChange({ photos: updatedPhotos });
    }
  };

  const addPhoto = (src: string) => {
    const board = boardRef.current;
    const bw = board?.offsetWidth ?? 1920;
    const bh = board?.offsetHeight ?? 1080;
    const w = 240;
    const nextPhotos = [...photos, {
      id: Date.now(),
      src,
      x: Math.random() * (bw - w - 100) + 60,
      y: Math.random() * (bh - 340) + 80,
      rotation: (Math.random() - 0.5) * 10,
      pinColor: PIN_COLORS[Math.floor(Math.random() * PIN_COLORS.length)],
      caption: '',
      width: w,
    }];
    setPhotos(nextPhotos);
    handleUpdate(nextPhotos);
    setShowUploadPanel(false);
    setUrlInput('');
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) addPhoto(ev.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlLoad = () => {
    if (urlInput.trim()) addPhoto(urlInput.trim());
  };

  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  // Drag handling
  const handleMouseDown = (e: React.MouseEvent, id: number) => {
    if ((e.target as HTMLElement).closest('.caption-input, .delete-btn')) return;
    e.preventDefault();
    const photo = photos.find(p => p.id === id)!;
    setDragging({ id, startMouseX: e.clientX, startMouseY: e.clientY, startPhotoX: photo.x, startPhotoY: photo.y });
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      const board = boardRef.current;
      if (!board) return;
      const rect = board.getBoundingClientRect();
      const scaleX = 1920 / rect.width;
      const scaleY = 1080 / rect.height;
      const dx = (e.clientX - dragging.startMouseX) * scaleX;
      const dy = (e.clientY - dragging.startMouseY) * scaleY;
      setPhotos(prev => prev.map(p => p.id === dragging.id ? { ...p, x: dragging.startPhotoX + dx, y: dragging.startPhotoY + dy } : p));
    };
    const handleUp = () => {
      setDragging(null);
      handleUpdate(photosRef.current);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [dragging]);

  return (
    <div
      ref={boardRef}
      style={{
        position: 'absolute', inset: 0,
        backgroundColor: '#C9A96E',
        backgroundImage: CORK_SVG_BG,
        backgroundSize: '80px 80px',
        overflow: 'hidden',
        fontFamily: 'Lora, serif',
      }}
    >
      {/* Subtle inner shadow framing */}
      <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 80px rgba(0,0,0,0.25)', pointerEvents: 'none', zIndex: 1 }} />

      {/* Photos */}
      {photos.map(photo => (
        <div
          key={photo.id}
          onMouseDown={e => handleMouseDown(e, photo.id)}
          style={{
            position: 'absolute',
            left: photo.x,
            top: photo.y,
            width: photo.width + 24,
            cursor: dragging?.id === photo.id ? 'grabbing' : 'grab',
            transform: `rotate(${photo.rotation}deg)`,
            zIndex: dragging?.id === photo.id ? 50 : 5,
            userSelect: 'none',
          }}
        >
          <PushPin color={photo.pinColor} />
          {/* White frame — Polaroid style */}
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '12px 12px 36px 12px',
            boxShadow: '4px 6px 18px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <img
              src={photo.src}
              draggable={false}
              style={{ width: photo.width, height: Math.round(photo.width * 0.75), objectFit: 'cover', display: 'block' }}
            />
            {/* Caption */}
            {editingCaption === photo.id ? (
              <input
                className="caption-input"
                autoFocus
                value={photo.caption}
                onChange={e => {
                  const val = e.target.value;
                  const updated = photos.map(p => p.id === photo.id ? { ...p, caption: val } : p);
                  setPhotos(updated);
                  handleUpdate(updated);
                }}
                onBlur={() => setEditingCaption(null)}
                onKeyDown={e => e.key === 'Enter' && setEditingCaption(null)}
                spellCheck={false}
                data-enable-grammarly="false"
                style={{ width: '100%', border: 'none', outline: 'none', textAlign: 'center', fontFamily: 'Lora, serif', fontSize: '13px', backgroundColor: 'transparent', color: '#555', marginTop: '8px' }}
              />
            ) : (
              <div
                onClick={() => setEditingCaption(photo.id)}
                style={{ textAlign: 'center', marginTop: '8px', fontSize: '13px', color: '#666', minHeight: '18px', cursor: 'text', fontStyle: photo.caption ? 'normal' : 'italic', opacity: photo.caption ? 1 : 0.4 }}
              >
                {photo.caption || 'click to caption...'}
              </div>
            )}
          </div>
          {/* Delete button */}
          <button
            className="delete-btn"
            onClick={() => {
              const updated = photos.filter(p => p.id !== photo.id);
              setPhotos(updated);
              handleUpdate(updated);
            }}
            style={{
              position: 'absolute', top: '-8px', right: '-8px',
              width: '22px', height: '22px', borderRadius: '50%',
              background: 'rgba(80,20,20,0.8)', border: 'none',
              color: '#fff', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 20,
              fontSize: '11px', opacity: 0.8,
            }}
          >
            <X size={11} />
          </button>
        </div>
      ))}

      {/* Add Photo Button */}
      <button
        onClick={() => setShowUploadPanel(!showUploadPanel)}
        style={{
          position: 'absolute', bottom: '40px', right: '60px',
          background: '#2C1F15', color: '#F4EAD5',
          border: 'none', borderRadius: '50px',
          padding: '12px 22px',
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '14px', fontFamily: 'Inter, sans-serif',
          cursor: 'pointer', zIndex: 20,
          boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
          fontWeight: 600,
        }}
      >
        <Plus size={16} />
        Pin a Photo
      </button>

      {/* Upload Panel */}
      {showUploadPanel && (
        <div style={{
          position: 'absolute', bottom: '100px', right: '60px',
          backgroundColor: '#FDFAF4',
          borderRadius: '12px', padding: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          width: '320px', zIndex: 30,
          fontFamily: 'Inter, sans-serif',
          display: 'flex', flexDirection: 'column', gap: '14px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '14px', color: '#2C1F15' }}>Pin a Photo</span>
            <button onClick={() => setShowUploadPanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><X size={16} /></button>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '1.5px dashed rgba(44,31,21,0.2)', borderRadius: '8px', padding: '14px', cursor: 'pointer', color: '#555', fontSize: '13px' }}>
            <Upload size={18} style={{ color: '#B8674A', flexShrink: 0 }} />
            <span>Upload from device</span>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          </label>

          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUrlLoad()}
              placeholder="Or paste image URL..."
              style={{ flex: 1, padding: '8px 10px', border: '1.5px solid rgba(44,31,21,0.15)', borderRadius: '6px', outline: 'none', fontSize: '12px', fontFamily: 'Inter', backgroundColor: 'transparent', color: '#2C1F15' }}
            />
            <button onClick={handleUrlLoad} style={{ padding: '8px 14px', background: '#B8674A', border: 'none', borderRadius: '6px', color: '#F4EAD5', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'Inter' }}>Pin</button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {photos.length === 0 && !showUploadPanel && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', gap: '12px', opacity: 0.5 }}>
          <div style={{ fontSize: '56px' }}>📌</div>
          <p style={{ fontSize: '20px', fontFamily: 'Lora, serif', color: '#5C3A1E' }}>Pin your story photos to the board</p>
          <p style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#5C3A1E' }}>Click "Pin a Photo" to add images</p>
        </div>
      )}
    </div>
  );
};
