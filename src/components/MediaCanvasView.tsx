import React, { useState, useEffect } from 'react';
import { Globe, Image as ImageIcon, Upload, Youtube, X } from 'lucide-react';

interface MediaCanvasViewProps {
  theme: 'light' | 'dark';
  data?: { activeTab: 'image' | 'web'; imageSrc: string; imageUrlInput: string; webUrlInput: string; loadedWebUrl: string; youtubeId: string | null };
  onChange?: (newData: { activeTab: 'image' | 'web'; imageSrc: string; imageUrlInput: string; webUrlInput: string; loadedWebUrl: string; youtubeId: string | null }) => void;
}

// Extract youtube video ID from a URL
const getYoutubeId = (url: string): string | null => {
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

export const MediaCanvasView: React.FC<MediaCanvasViewProps> = ({
  theme,
  data = { activeTab: 'web', imageSrc: '', imageUrlInput: '', webUrlInput: '', loadedWebUrl: '', youtubeId: null },
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'web'>(data.activeTab);
  const [imageSrc, setImageSrc] = useState<string>(data.imageSrc);
  const [imageUrlInput, setImageUrlInput] = useState<string>(data.imageUrlInput);
  const [webUrlInput, setWebUrlInput] = useState<string>(data.webUrlInput);
  const [loadedWebUrl, setLoadedWebUrl] = useState<string>(data.loadedWebUrl);
  const [youtubeId, setYoutubeId] = useState<string | null>(data.youtubeId);
  const [inputWarning, setInputWarning] = useState<string>('');
  const [imageError, setImageError] = useState<boolean>(false);

  useEffect(() => {
    setActiveTab(data.activeTab);
    setImageSrc(data.imageSrc);
    setImageUrlInput(data.imageUrlInput);
    setWebUrlInput(data.webUrlInput);
    setLoadedWebUrl(data.loadedWebUrl);
    setYoutubeId(data.youtubeId);
  }, [data]);

  const handleUpdate = (updatedFields: Partial<NonNullable<typeof data>>) => {
    if (onChange) {
      onChange({
        activeTab: updatedFields.activeTab !== undefined ? updatedFields.activeTab : activeTab,
        imageSrc: updatedFields.imageSrc !== undefined ? updatedFields.imageSrc : imageSrc,
        imageUrlInput: updatedFields.imageUrlInput !== undefined ? updatedFields.imageUrlInput : imageUrlInput,
        webUrlInput: updatedFields.webUrlInput !== undefined ? updatedFields.webUrlInput : webUrlInput,
        loadedWebUrl: updatedFields.loadedWebUrl !== undefined ? updatedFields.loadedWebUrl : loadedWebUrl,
        youtubeId: updatedFields.youtubeId !== undefined ? updatedFields.youtubeId : youtubeId,
      });
    }
  };

  const isDark = theme === 'dark';
  const bg = isDark ? '#2C1F15' : '#F4EAD5';
  const text = isDark ? '#F4EAD5' : '#2C1F15';
  const dim = isDark ? 'rgba(244,234,213,0.4)' : 'rgba(44,31,21,0.4)';
  const border = isDark ? 'rgba(244,234,213,0.15)' : 'rgba(44,31,21,0.15)';

  const checkLocalPathWarning = (val: string): boolean => {
    const isLocalPath = /^[a-zA-Z]:[/\\]/i.test(val) || val.includes('\\') || val.startsWith('file:///');
    if (isLocalPath) {
      setInputWarning("Local file paths (e.g., C:/...) cannot be loaded directly due to browser security restrictions. Please use the file upload box above to load local files.");
      return true;
    }
    setInputWarning('');
    return false;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      setImageError(false);
      setInputWarning('');
      handleUpdate({ imageSrc: url });
    }
  };

  const handleLoadImageUrl = () => {
    const val = imageUrlInput.trim();
    if (!val) return;
    setImageError(false);
    setInputWarning('');
    
    if (checkLocalPathWarning(val)) return;

    // Check if it looks like a website URL or localhost/server rather than an image
    const looksLikeWeb = /^(https?:\/\/)?(localhost|127\.0\.0\.1|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})(:\d+)?/i.test(val) && !/\.(jpeg|jpg|gif|png|webp|svg|bmp|ico)(?:\?.*)?$/i.test(val);
    if (looksLikeWeb) {
      setInputWarning("This looks like a website or server URL. If you want to embed a website or YouTube video, please use the 'Website / YouTube' tab.");
      return;
    }

    let finalUrl = val;
    if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/i.test(val) && !/^https?:\/\//i.test(val)) {
      finalUrl = 'https://' + val;
    }
    setImageSrc(finalUrl);
    handleUpdate({ imageSrc: finalUrl });
  };

  const handleLoadWebUrl = () => {
    let url = webUrlInput.trim();
    if (!url) return;
    setImageError(false);
    setInputWarning('');

    if (checkLocalPathWarning(url)) return;

    if (!/^https?:\/\//i.test(url)) {
      if (/^(localhost|127\.0\.0\.1)(:\d+)?/i.test(url)) {
        url = 'http://' + url;
      } else {
        url = 'https://' + url;
      }
    }
    setLoadedWebUrl(url);
    const ytId = getYoutubeId(url);
    setYoutubeId(ytId);
    handleUpdate({ loadedWebUrl: url, youtubeId: ytId });
  };

  const handleClearMedia = () => {
    setImageSrc('');
    setLoadedWebUrl('');
    setYoutubeId(null);
    setWebUrlInput('');
    setImageUrlInput('');
    setInputWarning('');
    setImageError(false);
    handleUpdate({ imageSrc: '', loadedWebUrl: '', youtubeId: null, imageUrlInput: '', webUrlInput: '' });
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
            imageError ? (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', backgroundColor: bg, color: text
              }}>
                <div style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                  <span style={{ fontSize: '48px' }}>⚠️</span>
                  <h3 style={{ fontSize: '20px', fontFamily: 'Lora, serif' }}>Failed to Load Image</h3>
                  <p style={{ fontSize: '14px', color: dim, lineHeight: '1.6' }}>
                    The browser refused to load the image URL you provided.
                    If this is a local path (e.g. <code>C:/...</code>), browsers block it due to web security policies. Please use the <strong>Click to upload image or screenshot</strong> box above to load local files.
                  </p>
                  <button onClick={handleClearMedia} style={btnStyle}>Go Back</button>
                </div>
              </div>
            ) : (
              <img
                src={imageSrc}
                alt="Media overlay"
                onError={() => setImageError(true)}
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
            )
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
          {/* Warning Banner */}
          {inputWarning && (
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(184, 103, 74, 0.12)',
                border: '1px solid rgba(184, 103, 74, 0.3)',
                borderRadius: '8px',
                color: 'var(--terracotta)',
                fontSize: '13px',
                lineHeight: '1.5',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              ⚠️ {inputWarning}
            </div>
          )}
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
            <button style={tabBtnStyle(activeTab === 'image')} onClick={() => { setActiveTab('image'); handleUpdate({ activeTab: 'image' }); }}>
              <ImageIcon size={16} />
              Image / Screenshot
            </button>
            <button style={tabBtnStyle(activeTab === 'web')} onClick={() => { setActiveTab('web'); handleUpdate({ activeTab: 'web' }); }}>
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
                  onChange={(e) => {
                    const val = e.target.value;
                    setImageUrlInput(val);
                    handleUpdate({ imageUrlInput: val });
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLoadImageUrl()}
                  placeholder="https://example.com/image.jpg"
                  spellCheck={false}
                  data-enable-grammarly="false"
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
                  onChange={(e) => {
                    const val = e.target.value;
                    setWebUrlInput(val);
                    handleUpdate({ webUrlInput: val });
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLoadWebUrl()}
                  placeholder="https://youtube.com/watch?v=... or blog URL"
                  spellCheck={false}
                  data-enable-grammarly="false"
                  style={inputStyle}
                />
                <button onClick={handleLoadWebUrl} style={{ ...btnStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Globe size={14} />
                  Embed
                </button>
              </div>

              <div style={{
                fontSize: '12px',
                color: dim,
                lineHeight: '1.6',
                fontFamily: 'Inter, sans-serif',
                marginTop: '4px',
                padding: '10px 14px',
                backgroundColor: isDark ? 'rgba(244, 234, 213, 0.03)' : 'rgba(44, 31, 21, 0.03)',
                borderRadius: '8px',
                border: `1px solid ${border}`
              }}>
                ℹ️ <strong>Note on Embedding:</strong> Many websites (e.g. Google, GitHub, and major blogs) block iframe embedding for security (via <code>X-Frame-Options</code> or <code>Content-Security-Policy</code> headers). Local servers (e.g. <code>http://localhost:3000</code>) will embed correctly if they are running and allow framing.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
