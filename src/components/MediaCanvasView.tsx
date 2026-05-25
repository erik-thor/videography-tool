import React, { useState } from 'react';
import { Globe, Image as ImageIcon, Upload, Youtube, X } from 'lucide-react';

interface MediaCanvasViewProps {
  theme: 'light' | 'dark';
}

// Extract youtube video ID from a URL
const getYoutubeId = (url: string): string | null => {
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

export const MediaCanvasView: React.FC<MediaCanvasViewProps> = ({ theme }) => {
  const [activeTab, setActiveTab] = useState<'image' | 'web'>('image');
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [webUrlInput, setWebUrlInput] = useState<string>('');
  const [loadedWebUrl, setLoadedWebUrl] = useState<string>('');
  const [youtubeId, setYoutubeId] = useState<string | null>(null);

  const isDark = theme === 'dark';
  const bg = isDark ? '#2C1F15' : '#F4EAD5';
  const text = isDark ? '#F4EAD5' : '#2C1F15';
  const dim = isDark ? 'rgba(244,234,213,0.4)' : 'rgba(44,31,21,0.4)';
  const border = isDark ? 'rgba(244,234,213,0.15)' : 'rgba(44,31,21,0.15)';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
    }
  };

  const handleLoadImageUrl = () => {
    if (imageUrlInput.trim()) setImageSrc(imageUrlInput.trim());
  };

  const handleLoadWebUrl = () => {
    let url = webUrlInput.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      if (/^(localhost|127\.0\.0\.1)(:\d+)?/i.test(url)) {
        url = 'http://' + url;
      } else {
        url = 'https://' + url;
      }
    }
    setLoadedWebUrl(url);
    setYoutubeId(getYoutubeId(url));
  };

  const handleClearMedia = () => {
    setImageSrc('');
    setLoadedWebUrl('');
    setYoutubeId(null);
    setWebUrlInput('');
    setImageUrlInput('');
  };

  // Shared input + button row styles
  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '10px 14px',
    fontSize: '14px',
    border: `1.5px solid ${border}`,
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: 'transparent',
    color: text,
    fontFamily: 'Inter, sans-serif',
  };

  const btnStyle: React.CSSProperties = {
    padding: '10px 20px',
    background: 'var(--terracotta)',
    border: 'none',
    borderRadius: '8px',
    color: '#F4EAD5',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  };

  const tabBtnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    fontFamily: 'Inter, sans-serif',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: active ? 'var(--terracotta)' : 'transparent',
    color: active ? '#F4EAD5' : dim,
    transition: 'all 0.15s ease',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* ---- Content is showing: full-frame display ---- */}
      {(imageSrc || loadedWebUrl) ? (
        <div style={{ position: 'absolute', inset: 0 }}>
          {imageSrc ? (
            <img
              src={imageSrc}
              alt="Media overlay"
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            />
          ) : youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            />
          ) : (
            <iframe
              src={loadedWebUrl}
              title="Web Browser"
              style={{ width: '100%', height: '100%', border: 'none', display: 'block', backgroundColor: '#fff' }}
            />
          )}

          {/* Floating clear button (top-right) */}
          <button
            onClick={handleClearMedia}
            title="Clear media"
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.55)',
              border: '1.5px solid rgba(255,255,255,0.3)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              backdropFilter: 'blur(6px)',
            }}
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        /* ---- Empty state: input panel ---- */
        <div
          style={{
            width: '680px',
            display: 'flex',
            flexDirection: 'column',
            gap: '28px',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '28px', fontFamily: 'Lora, serif', color: text, marginBottom: '8px' }}>
              Media Canvas
            </h2>
            <p style={{ fontSize: '14px', color: dim }}>
              Display an image, screenshot, website, or YouTube video full-screen.
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', background: isDark ? 'rgba(244,234,213,0.05)' : 'rgba(44,31,21,0.05)', borderRadius: '10px', padding: '4px' }}>
            <button style={tabBtnStyle(activeTab === 'image')} onClick={() => setActiveTab('image')}>
              <ImageIcon size={16} />
              Image / Screenshot
            </button>
            <button style={tabBtnStyle(activeTab === 'web')} onClick={() => setActiveTab('web')}>
              <Globe size={16} />
              Website / YouTube
            </button>
          </div>

          {/* Tab: Image */}
          {activeTab === 'image' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* File drop zone */}
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  border: `2px dashed ${border}`,
                  borderRadius: '12px',
                  padding: '36px 24px',
                  cursor: 'pointer',
                  color: dim,
                  transition: 'border-color 0.15s ease',
                }}
              >
                <Upload size={28} style={{ color: 'var(--terracotta)', opacity: 0.8 }} />
                <span style={{ fontSize: '15px' }}>Click to upload image or screenshot</span>
                <span style={{ fontSize: '12px', opacity: 0.7 }}>PNG, JPG, GIF, WEBP supported</span>
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: dim, fontSize: '13px' }}>
                <div style={{ flex: 1, height: '1px', background: border }} />
                <span>or paste image URL</span>
                <div style={{ flex: 1, height: '1px', background: border }} />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLoadImageUrl()}
                  placeholder="https://example.com/image.jpg"
                  style={inputStyle}
                />
                <button onClick={handleLoadImageUrl} style={btnStyle}>
                  Load
                </button>
              </div>
            </div>
          )}

          {/* Tab: Web */}
          {activeTab === 'web' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  border: `2px dashed ${border}`,
                  borderRadius: '12px',
                  padding: '32px 24px',
                  color: dim,
                }}
              >
                <Youtube size={32} style={{ color: 'var(--terracotta)', opacity: 0.8 }} />
                <Globe size={28} style={{ opacity: 0.5 }} />
                <div>
                  <p style={{ fontSize: '15px', marginBottom: '4px' }}>Paste a YouTube or website URL</p>
                  <p style={{ fontSize: '12px', opacity: 0.7 }}>YouTube videos will embed natively. Note: some sites block iframe embedding.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={webUrlInput}
                  onChange={(e) => setWebUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLoadWebUrl()}
                  placeholder="https://youtube.com/watch?v=... or blog URL"
                  style={inputStyle}
                />
                <button onClick={handleLoadWebUrl} style={{ ...btnStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Globe size={14} />
                  Embed
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
