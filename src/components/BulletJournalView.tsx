import React, { useState, useEffect } from 'react';
import { Calendar, Dot } from 'lucide-react';

interface BulletJournalViewProps {
  theme: 'light' | 'dark';
  data?: { title: string; month: number; year: number };
  onChange?: (data: { title: string; month: number; year: number }) => void;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Generates the SVG dot-grid pattern as a data URI
const DOT_PATTERN_LIGHT = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Ccircle cx='14' cy='14' r='1.5' fill='rgba(44,31,21,0.2)'/%3E%3C/svg%3E")`;
const DOT_PATTERN_DARK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Ccircle cx='14' cy='14' r='1.5' fill='rgba(244,234,213,0.18)'/%3E%3C/svg%3E")`;

export const BulletJournalView: React.FC<BulletJournalViewProps> = ({
  theme,
  data = { title: 'Video Journal', month: new Date().getMonth(), year: new Date().getFullYear() },
  onChange
}) => {
  const [month, setMonth] = useState(data.month);
  const [year, setYear] = useState(data.year);
  const [title, setTitle] = useState(data.title);
  const [editingTitle, setEditingTitle] = useState(false);

  useEffect(() => {
    setTitle(data.title);
    setMonth(data.month);
    setYear(data.year);
  }, [data.title, data.month, data.year]);

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
                onChange={e => {
                  const val = e.target.value;
                  setTitle(val);
                  if (onChange) onChange({ title: val, month, year });
                }}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={e => e.key === 'Enter' && setEditingTitle(false)}
                spellCheck={false}
                data-enable-grammarly="false"
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
                onClick={() => {
                  let newMonth = month;
                  let newYear = year;
                  if (month === 0) {
                    newMonth = 11;
                    newYear = year - 1;
                  } else {
                    newMonth = month - 1;
                  }
                  setMonth(newMonth);
                  setYear(newYear);
                  if (onChange) onChange({ title, month: newMonth, year: newYear });
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: inkDim, lineHeight: 1 }}>‹</button>
              <span style={{ fontFamily: 'Lora, serif', fontSize: '22px', color: ink, fontWeight: 500, minWidth: '130px', textAlign: 'center' }}>
                {MONTHS[month]}
              </span>
              <button
                onClick={() => {
                  let newMonth = month;
                  let newYear = year;
                  if (month === 11) {
                    newMonth = 0;
                    newYear = year + 1;
                  } else {
                    newMonth = month + 1;
                  }
                  setMonth(newMonth);
                  setYear(newYear);
                  if (onChange) onChange({ title, month: newMonth, year: newYear });
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: inkDim, lineHeight: 1 }}>›</button>
            </div>
            <span style={{ fontSize: '16px', color: inkDim, fontFamily: 'Inter, sans-serif', letterSpacing: '2px' }}>{year}</span>
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
