import React, { useMemo, useState, useEffect, useRef } from 'react';

interface WordCloudViewProps {
  theme: 'light' | 'dark';
  transcript: string;
}

interface WordBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface PlacedWord {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  rotation: number;
  box: WordBox;
}

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further',
  'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'him', 'himself', 'his', 'how',
  'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'let', 'me', 'more', 'most', 'my', 'myself',
  'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves',
  'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their',
  'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who',
  'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves',
  // Common filler words / speech disfluencies
  'um', 'uh', 'like', 'just', 'so', 'then', 'really', 'actually', 'basically', 'mean', 'right', 'well',
  'get', 'got', 'go', 'going', 'think', 'know', 'say', 'said', 'see', 'want', 'make', 'take', 'look', 'come',
  'give', 'use', 'us', 'thing', 'things', 'good', 'many', 'much', 'very', 'also', 'okay', 'yeah', 'oh',
  'youre', 'im', 'ive', 'dont', 'cant', 'didnt', 'wasnt', 'wouldnt', 'shouldnt', 'couldnt', 'isnt', 'arent',
  'havent', 'hasnt', 'hadnt', 'werent', 'theres', 'lets', 'theyre', 'weve', 'theyve', 'youve', 'hed', 'shell',
  'hes', 'shes', 'wed', 'theyll', 'youll', 'well'
]);

function checkOverlap(b1: WordBox, b2: WordBox): boolean {
  return !(b1.right < b2.left || b1.left > b2.right || b1.bottom < b2.top || b1.top > b2.bottom);
}

export const WordCloudView: React.FC<WordCloudViewProps> = ({ theme, transcript }) => {
  const [placedWords, setPlacedWords] = useState<PlacedWord[]>([]);
  const positionsCacheRef = useRef<Map<string, { x: number; y: number; rotation: number; color: string }>>(new Map());

  const isDark = theme === 'dark';
  const bg = isDark ? '#120B06' : '#FDFAF4';
  const gridColor = isDark ? 'rgba(244, 234, 213, 0.03)' : 'rgba(44, 31, 21, 0.03)';

  // Process the transcript into a list of word frequencies
  const wordFrequencies = useMemo(() => {
    if (!transcript) return [];
    
    // Normalize string: lowercase, strip punctuation (keeping apostrophes within words)
    const cleaned = transcript.toLowerCase().replace(/[^\w\s']/g, ' ');
    const tokens = cleaned.split(/\s+/);
    const counts = new Map<string, number>();

    tokens.forEach(token => {
      const trimmed = token.replace(/^'+|'+$/g, ''); // strip leading/trailing single quotes
      if (trimmed.length > 2 && !STOP_WORDS.has(trimmed)) {
        counts.set(trimmed, (counts.get(trimmed) || 0) + 1);
      }
    });

    // Sort by count descending
    return Array.from(counts.entries())
      .map(([text, count]) => ({ text, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 45); // Keep top 45 words
  }, [transcript]);

  // Compute Word Cloud layout
  useEffect(() => {
    if (wordFrequencies.length === 0) {
      setPlacedWords([]);
      positionsCacheRef.current.clear();
      return;
    }

    const maxCount = wordFrequencies[0].count;
    const minSize = 22; // Minimum font size in px
    const maxSize = 80; // Maximum font size in px

    const newPlaced: PlacedWord[] = [];
    const cache = positionsCacheRef.current;

    // We will separate the top words into "already placed" and "new".
    // First, layout the already placed words to reserve their bounds,
    // so new words don't step on them.
    const toPlaceNew: typeof wordFrequencies = [];

    // Color choices based on rank
    const getThemeColor = (index: number) => {
      // Curated warm, elegant colors matching the app's palette
      if (isDark) {
        if (index < 5) return '#E8B09A'; // Blush
        if (index < 12) return '#C9A563'; // Gold
        if (index < 22) return '#8AA68E'; // Sage
        return '#7B91B8'; // Slate
      } else {
        if (index < 5) return '#B8674A'; // Terracotta
        if (index < 12) return '#C9A563'; // Gold
        if (index < 22) return '#4A5B4E'; // Deep Olive Sage
        return '#2C1F15'; // Ink
      }
    };

    // 1. Process previously cached words first so they stay completely anchored
    wordFrequencies.forEach((item, index) => {
      const cached = cache.get(item.text);
      if (cached) {
        // Calculate font size dynamically based on current count
        const fontSize = maxCount === 1 
          ? minSize 
          : minSize + ((item.count - 1) / (maxCount - 1)) * (maxSize - minSize);

        // Estimate bounding box centered around the cached x, y
        const w = item.text.length * fontSize * 0.6 + 20; // 0.6 average char aspect ratio + margin
        const h = fontSize * 1.2 + 10;
        
        const box = {
          left: cached.x - w / 2,
          right: cached.x + w / 2,
          top: cached.y - h / 2,
          bottom: cached.y + h / 2
        };

        newPlaced.push({
          text: item.text,
          x: cached.x,
          y: cached.y,
          fontSize,
          color: getThemeColor(index), // Color can change depending on current weight/index
          rotation: cached.rotation,
          box
        });
      } else {
        toPlaceNew.push(item);
      }
    });

    // 2. Find empty spots for the new words using an Archimedean spiral
    const cx = 960;
    const cy = 540;

    toPlaceNew.forEach((item) => {
      const index = wordFrequencies.findIndex(w => w.text === item.text);
      const fontSize = maxCount === 1 
        ? minSize 
        : minSize + ((item.count - 1) / (maxCount - 1)) * (maxSize - minSize);

      const w = item.text.length * fontSize * 0.6 + 20;
      const h = fontSize * 1.2 + 10;

      // Select random rotation: mostly horizontal, some vertical
      const rotations = [0, 0, 0, 90, -10, 10];
      const rotation = rotations[Math.floor(Math.random() * rotations.length)];

      let r = 0;
      let theta = 0;
      const rStep = 8;
      const thetaStep = 0.12;

      let found = false;
      let attempts = 0;
      let x = cx;
      let y = cy;
      let box = { left: 0, right: 0, top: 0, bottom: 0 };

      while (!found && attempts < 1500) {
        attempts++;
        x = cx + r * Math.cos(theta);
        y = cy + r * Math.sin(theta);

        box = {
          left: x - w / 2,
          right: x + w / 2,
          top: y - h / 2,
          bottom: y + h / 2
        };

        // Keep inside 1920x1080 canvas boundaries with padding
        if (box.left < 80 || box.right > 1840 || box.top < 80 || box.bottom > 1000) {
          theta += thetaStep;
          r += rStep * (thetaStep / (2 * Math.PI));
          continue;
        }

        // Check if overlaps with any placed words (both cached and newly placed)
        let overlaps = false;
        for (const pw of newPlaced) {
          if (checkOverlap(box, pw.box)) {
            overlaps = true;
            break;
          }
        }

        if (!overlaps) {
          found = true;
        } else {
          theta += thetaStep;
          r += rStep * (thetaStep / (2 * Math.PI));
        }
      }

      // If we couldn't find a spot, just place it on the outer bounds
      if (!found) {
        // Fallback to random spot near bounds
        x = 100 + Math.random() * 1720;
        y = 100 + Math.random() * 880;
        box = {
          left: x - w / 2,
          right: x + w / 2,
          top: y - h / 2,
          bottom: y + h / 2
        };
      }

      const color = getThemeColor(index);
      
      // Save in cache
      cache.set(item.text, { x, y, rotation, color });

      newPlaced.push({
        text: item.text,
        x,
        y,
        fontSize,
        color,
        rotation,
        box
      });
    });

    // 3. Clean up cache of items that dropped out of top lists
    const activeTexts = new Set(wordFrequencies.map(w => w.text));
    for (const cachedText of Array.from(cache.keys())) {
      if (!activeTexts.has(cachedText)) {
        cache.delete(cachedText);
      }
    }

    setPlacedWords(newPlaced);
  }, [wordFrequencies, isDark]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: bg,
        backgroundImage: `
          linear-gradient(to right, ${gridColor} 1px, transparent 1px),
          linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.8s ease'
      }}
    >
      {/* Decorative center glowing orb */}
      <div
        style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(184, 103, 74, 0.05) 0%, rgba(201, 165, 99, 0.02) 50%, rgba(0,0,0,0) 70%)'
            : 'radial-gradient(circle, rgba(184, 103, 74, 0.04) 0%, rgba(201, 165, 99, 0.01) 50%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* Render the Words */}
      {placedWords.length === 0 ? (
        <div
          style={{
            zIndex: 2,
            textAlign: 'center',
            color: isDark ? 'rgba(244,234,213,0.3)' : 'rgba(44,31,21,0.3)',
            fontSize: '24px',
            fontFamily: 'Lora, Georgia, serif',
            fontStyle: 'italic',
            letterSpacing: '0.5px'
          }}
        >
          Start speaking to generate the word cloud...
        </div>
      ) : (
        placedWords.map((word) => (
          <div
            key={word.text}
            style={{
              position: 'absolute',
              left: `${word.x}px`,
              top: `${word.y}px`,
              transform: `translate(-50%, -50%) rotate(${word.rotation}deg)`,
              fontSize: `${word.fontSize}px`,
              fontWeight: 700,
              color: word.color,
              lineHeight: 1,
              whiteSpace: 'nowrap',
              fontFamily: word.fontSize > 50 ? 'Lora, Georgia, serif' : 'Inter, system-ui, sans-serif',
              textShadow: isDark 
                ? '0 2px 4px rgba(0,0,0,0.4)' 
                : '0 1px 2px rgba(0,0,0,0.06)',
              opacity: 0.95,
              zIndex: Math.round(word.fontSize),
              cursor: 'default',
              transition: 'left 0.8s ease, top 0.8s ease, fontSize 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.8s ease, color 0.8s ease',
            }}
            className="word-cloud-term"
          >
            {word.text}
          </div>
        ))
      )}
    </div>
  );
};
