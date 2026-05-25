import React, { useState } from 'react';
import { Calendar, Dot } from 'lucide-react';

interface BulletJournalViewProps {
  theme: 'light' | 'dark';
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Generates the SVG dot-grid pattern as a data URI
const DOT_PATTERN_LIGHT = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Ccircle cx='14' cy='14' r='1.5' fill='rgba(44,31,21,0.2)'/%3E%3C/svg%3E")`;
const DOT_PATTERN_DARK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Ccircle cx='14' cy='14' r='1.5' fill='rgba(244,234,213,0.18)'/%3E%3C/svg%3E")`;

export const BulletJournalView: React.FC<BulletJournalViewProps> = ({ theme }) => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [title, setTitle] = useState('Video Journal');
  const [editingTitle, setEditingTitle] = useState(false);

  const isDark = theme === 'dark';
  const bg = isDark ? '#1A1209' : '#FDFAF4';
  const ink = isDark ? '#F4EAD5' : '#2C1F15';
  const inkDim = isDark ? 'rgba(244,234,213,0.5)' : 'rgba(44,31,21,0.4)';
  const accent = '#B8674A';
  const dotPattern = isDark ? DOT_PATTERN_DARK : DOT_PATTERN_LIGHT;

  // Page corner fold
  const cornerFold = isDark ? '#2C1F15' : '#E8DFC8';
  const cornerFoldInner = isDark ? '#1A1209' : '#FDFAF4';

  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        backgroundColor: bg,
        backgroundImage: dotPattern,
        backgroundSize: '28px 28px',
        fontFamily: 'Inter, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Page corner fold — top-left decoration */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: 0, height: 0,
        borderStyle: 'solid',
        borderWidth: '48px 48px 0 0',
        borderColor: `${cornerFold} transparent transparent transparent`,
        zIndex: 5,
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: 0, height: 0,
        borderStyle: 'solid',
        borderWidth: '44px 44px 0 0',
        borderColor: `${cornerFoldInner} transparent transparent transparent`,
        zIndex: 6,
      }} />

      {/* Red margin line — left side (classic journal) */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0,
        left: '88px',
        width: '2px',
        backgroundColor: isDark ? 'rgba(184,103,74,0.3)' : 'rgba(184,103,74,0.4)',
        zIndex: 2,
      }} />

      {/* Main content area */}
      <div style={{ position: 'absolute', top: '64px', left: '128px', right: '80px', bottom: '60px', zIndex: 3 }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px' }}>
          {/* Editable title */}
          <div>
            {editingTitle ? (
              <input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={e => e.key === 'Enter' && setEditingTitle(false)}
                style={{
                  fontSize: '52px', fontFamily: 'Lora, serif',
                  fontWeight: 500, color: ink,
                  background: 'transparent', border: 'none',
                  outline: 'none', borderBottom: `2px solid ${accent}`,
                  width: '600px',
                }}
              />
            ) : (
              <h1
                onClick={() => setEditingTitle(true)}
                style={{ fontSize: '52px', fontFamily: 'Lora, serif', fontWeight: 500, color: ink, cursor: 'text', margin: 0 }}
              >
                {title}
              </h1>
            )}
            {/* Decorative rule under title */}
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '42px', height: '3px', backgroundColor: accent, borderRadius: '2px' }} />
              <div style={{ width: '18px', height: '3px', backgroundColor: accent, borderRadius: '2px', opacity: 0.5 }} />
              <div style={{ width: '8px', height: '3px', backgroundColor: accent, borderRadius: '2px', opacity: 0.25 }} />
            </div>
          </div>

          {/* Date navigation */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: inkDim, lineHeight: 1 }}>‹</button>
              <span style={{ fontFamily: 'Lora, serif', fontSize: '22px', color: ink, fontWeight: 500, minWidth: '130px', textAlign: 'center' }}>
                {MONTHS[month]}
              </span>
              <button
                onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: inkDim, lineHeight: 1 }}>›</button>
            </div>
            <span style={{ fontSize: '16px', color: inkDim, fontFamily: 'Inter, sans-serif', letterSpacing: '2px' }}>{year}</span>
          </div>
        </div>

        {/* Key / Legend area */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: inkDim, marginBottom: '10px', fontFamily: 'Inter, sans-serif' }}>
            Key
          </div>
          <div style={{ display: 'flex', gap: '28px', fontSize: '14px', color: ink }}>
            {[
              { symbol: '•', label: 'Task', color: ink },
              { symbol: '○', label: 'Event', color: accent },
              { symbol: '—', label: 'Note', color: ink },
              { symbol: '✕', label: 'Irrelevant', color: inkDim },
              { symbol: '>', label: 'Migrated', color: '#7B91B8' },
            ].map(k => (
              <div key={k.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontFamily: 'Lora, serif', fontSize: '16px', color: k.color, fontWeight: 500, width: '16px', textAlign: 'center' }}>{k.symbol}</span>
                <span style={{ fontSize: '12px', color: inkDim, fontFamily: 'Inter, sans-serif' }}>{k.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Horizontal divider */}
        <div style={{ width: '100%', height: '1px', backgroundColor: isDark ? 'rgba(244,234,213,0.1)' : 'rgba(44,31,21,0.1)', marginBottom: '28px' }} />

        {/* Drawing area hint */}
        <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
          {/* Column 1 — Sample layout */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: inkDim, marginBottom: '14px', fontFamily: 'Inter, sans-serif' }}>
              Daily Log
            </div>
            {[
              { symbol: '•', text: 'Discuss the 8 core values', done: true },
              { symbol: '•', text: 'Map cognitive appraisal process' },
              { symbol: '○', text: 'Record intro segment' },
              { symbol: '—', text: 'Emotion = appraisal × intensity' },
              { symbol: '•', text: 'End with integration exercise' },
              { symbol: '>', text: 'Review chapter on courage' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '14px', opacity: item.done ? 0.45 : 1 }}>
                <span style={{ fontFamily: 'Lora, serif', fontSize: '17px', color: accent, flexShrink: 0, lineHeight: '1.4', width: '16px', textAlign: 'center' }}>{item.symbol}</span>
                <span style={{ fontSize: '16px', color: ink, lineHeight: '1.5', textDecoration: item.done ? 'line-through' : 'none', fontFamily: 'Lora, serif' }}>{item.text}</span>
              </div>
            ))}
          </div>

          {/* Column 2 — Blank lined area for the whiteboard to write on */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: inkDim, marginBottom: '14px', fontFamily: 'Inter, sans-serif' }}>
              Notes
            </div>
            {/* Subtle lines for writing */}
            {Array.from({ length: 14 }, (_, i) => (
              <div key={i} style={{ height: '36px', borderBottom: `1px solid ${isDark ? 'rgba(244,234,213,0.07)' : 'rgba(44,31,21,0.08)'}` }} />
            ))}
          </div>
        </div>
      </div>

      {/* Page number bottom center */}
      <div style={{ position: 'absolute', bottom: '24px', left: 0, right: 0, textAlign: 'center', fontFamily: 'Lora, serif', fontSize: '14px', color: inkDim, zIndex: 3 }}>
        — draw & annotate with the whiteboard tool —
      </div>
    </div>
  );
};
