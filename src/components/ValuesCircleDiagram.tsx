import React, { useState } from 'react';
import { Compass, BookOpen, X } from 'lucide-react';

interface ValueDefinition {
  name: string;
  tagline: string;
  definition: string;
  reflection: string;
  color: string;
  tagClass: string;
}

const VALUES_DATA: ValueDefinition[] = [
  {
    name: 'adventure',
    tagline: 'Seeking truth in the unmapped spaces',
    definition: 'The willingness to step into the unknown. Seeking growth through new experiences, risking certainty to explore the boundaries of who we might become.',
    reflection: 'Where in your life does security prevent you from encountering the novel, and how might you invite a small risk of discovery?',
    color: 'var(--blush-rose)',
    tagClass: 'tag-blush',
  },
  {
    name: 'connection',
    tagline: 'The bridge of shared vulnerability',
    definition: 'The subtle thread that binds us to others. Embracing mutual vulnerability, deep active listening, and the realization that we exist only in relationship.',
    reflection: 'Are you listening to respond, or are you listening to understand and be touched by another’s interior world?',
    color: 'var(--slate-blue)',
    tagClass: 'tag-slate',
  },
  {
    name: 'authenticity',
    tagline: 'Standing naked in one’s own truth',
    definition: 'Living in alignment with internal truth. Stripping away performance, compliance, and social scripts to stand transparently in your actual experience.',
    reflection: 'What mask do you wear most frequently, and what would happen if you laid it down for just a single hour?',
    color: 'var(--terracotta)',
    tagClass: 'tag-blush', // customized ramp
  },
  {
    name: 'creativity',
    tagline: 'Sublimation of chaos into form',
    definition: 'The generative impulse. Transforming internal chaos, questions, and beauty into expressions that communicate across the boundaries of time and space.',
    reflection: 'When was the last time you created something not for utility or praise, but simply to translate an internal feeling?',
    color: 'var(--warm-gold)',
    tagClass: 'tag-slate', // customized ramp
  },
  {
    name: 'play',
    tagline: 'Spontaneous existence without instrument',
    definition: 'Unstructured presence. Releasing the burden of productivity, efficiency, and instrumental utility to delight in spontaneous, non-functional activity.',
    reflection: 'How can you protect a space today that is entirely free from goals, metrics, and the demand for self-improvement?',
    color: 'var(--sage)',
    tagClass: 'tag-sage',
  },
  {
    name: 'courage',
    tagline: 'Steadfastness where the heart trembles',
    definition: 'Action despite fear. The choice to act, speak, and choose truthfully even when the body registers dread and the mind counsels safe compliance.',
    reflection: 'What silent truth are you holding back, and what is the cost of your silence to your psychological integrity?',
    color: 'var(--terracotta)',
    tagClass: 'tag-blush',
  },
  {
    name: 'wisdom',
    tagline: 'The quiet integration of lived experience',
    definition: 'Lived knowledge integrated with patience. Seeing beneath the surface of events to understand the interconnected flows of life, welcoming complexity.',
    reflection: 'If your current struggle were a teacher, what long-term truth is it trying to integrate into your character?',
    color: 'var(--warm-gold)',
    tagClass: 'tag-sage',
  },
  {
    name: 'compassion',
    tagline: 'Holding the suffering of the self and other',
    definition: 'The capacity to suffer alongside another. Actively witnessing suffering (both in others and in ourselves) and moving to soothe it without condemnation.',
    reflection: 'How would you treat yourself right now if you spoke to yourself with the same tenderness you extend to a hurting child?',
    color: 'var(--blush-rose)',
    tagClass: 'tag-blush',
  },
];

export const ValuesCircleDiagram: React.FC = () => {
  const [selectedValue, setSelectedValue] = useState<ValueDefinition | null>(null);

  // Circle dimensions
  const width = 800;
  const height = 800;
  const cx = width / 2;
  const cy = height / 2;
  const r = 260; // radius of circle layout

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative' }}>
      
      {/* Circle Graph Area */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* Editorial Title Overlay inside Circle */}
        <div
          style={{
            position: 'absolute',
            zIndex: 10,
            textAlign: 'center',
            width: '240px',
            pointerEvents: 'none',
          }}
        >
          <Compass size={32} style={{ color: 'var(--terracotta)', marginBottom: '12px' }} />
          <h2 style={{ fontSize: '24px', color: 'var(--warm-ink)', marginBottom: '8px' }}>
            Eight Modes of Being
          </h2>
          <p style={{ fontSize: '12px', fontFamily: 'Inter', opacity: 0.6 }}>
            A compass of psychological and humanist virtues for self-inquiry.
          </p>
        </div>

        {/* SVG Connectors & Node placements */}
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ overflow: 'visible', maxWidth: '100%', maxHeight: '100%' }}
        >
          {/* Dotted Connecting Circle */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--warm-ink)"
            strokeWidth="1.5"
            strokeDasharray="4,6"
            style={{ opacity: 0.2 }}
          />

          {/* Dotted Hub Spoke Lines */}
          {VALUES_DATA.map((_, idx) => {
            const angle = (idx * 2 * Math.PI) / VALUES_DATA.length - Math.PI / 2;
            const nx = cx + r * Math.cos(angle);
            const ny = cy + r * Math.sin(angle);
            return (
              <line
                key={`line-${idx}`}
                x1={cx}
                y1={cy}
                x2={nx}
                y2={ny}
                stroke="var(--warm-ink)"
                strokeWidth="1"
                strokeDasharray="2,4"
                style={{ opacity: 0.15 }}
              />
            );
          })}

          {/* Value Nodes */}
          {VALUES_DATA.map((val, idx) => {
            const angle = (idx * 2 * Math.PI) / VALUES_DATA.length - Math.PI / 2;
            const nx = cx + r * Math.cos(angle);
            const ny = cy + r * Math.sin(angle);
            
            const isCurrent = selectedValue?.name === val.name;

            return (
              <g
                key={val.name}
                className="interactive-node"
                onClick={() => setSelectedValue(val)}
                style={{ transformOrigin: `${nx}px ${ny}px` }}
              >
                {/* Node Ring/Halo */}
                <circle
                  cx={nx}
                  cy={ny}
                  r="62"
                  fill="var(--warm-ivory)"
                  stroke={isCurrent ? 'var(--terracotta)' : 'var(--warm-ink)'}
                  strokeWidth={isCurrent ? '2.5' : '1.2'}
                  style={{ transition: 'all 0.2s ease' }}
                />

                {/* Node Dot */}
                <circle
                  cx={nx}
                  cy={ny}
                  r="8"
                  fill={val.color || 'var(--terracotta)'}
                />

                {/* Node Label Text */}
                <text
                  x={nx}
                  y={ny + 26}
                  textAnchor="middle"
                  fontFamily="Lora, serif"
                  fontSize="15px"
                  fontWeight="500"
                  fill="var(--warm-ink)"
                >
                  {val.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Expanded Definition Drawer (editorial layout) */}
      <div
        className="editorial-panel"
        style={{
          width: '450px',
          height: 'calc(100% - 48px)',
          margin: '24px',
          marginLeft: 0,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 20,
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius)',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: selectedValue ? 'translateX(0)' : 'translateX(20px)',
          opacity: selectedValue ? 1 : 0.8,
          pointerEvents: selectedValue ? 'auto' : 'none',
        }}
      >
        {selectedValue ? (
          <div style={{ padding: '36px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div className={`tag ${selectedValue.tagClass || 'tag-sage'}`}>
                virtue
              </div>
              <button
                onClick={() => setSelectedValue(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--warm-ink)',
                  opacity: 0.6,
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Core Info */}
            <h1 style={{ fontSize: '38px', color: 'var(--warm-ink)', marginBottom: '8px', textTransform: 'capitalize' }}>
              {selectedValue.name}
            </h1>
            <p
              style={{
                fontFamily: 'Lora',
                fontStyle: 'italic',
                fontSize: '18px',
                color: 'var(--terracotta)',
                lineHeight: 1.4,
                marginBottom: '28px',
              }}
            >
              "{selectedValue.tagline}"
            </p>

            <div style={{ height: '1px', backgroundColor: 'rgba(44, 31, 21, 0.1)', marginBottom: '28px' }} />

            {/* Definition */}
            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.5, marginBottom: '8px', fontFamily: 'Inter' }}>
                Philosophical Definition
              </h4>
              <p style={{ fontSize: '16px', lineHeight: 1.7, color: 'var(--warm-ink)' }}>
                {selectedValue.definition}
              </p>
            </div>

            {/* Prompt for Inquiry / Reflection */}
            <div
              style={{
                marginTop: 'auto',
                padding: '24px',
                backgroundColor: 'rgba(232, 176, 154, 0.15)', // Light blush rose tint
                borderLeft: '3px solid var(--terracotta)',
                borderRadius: '4px',
              }}
            >
              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--terracotta)', marginBottom: '8px', fontFamily: 'Inter', fontWeight: 500 }}>
                Inquiry for Reflection
              </h4>
              <p style={{ fontSize: '15px', fontStyle: 'italic', lineHeight: 1.6, color: 'var(--warm-ink)' }}>
                {selectedValue.reflection}
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '36px', opacity: 0.4, textAlign: 'center' }}>
            <BookOpen size={48} style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Select a Value</h3>
            <p style={{ fontSize: '14px' }}>
              Click any value on the circular map to explore its definition, psychological depth, and prompts for inquiry.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
