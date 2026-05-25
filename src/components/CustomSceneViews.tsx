import React, { useState } from 'react';
import { Heart, MessageSquare, Bell, Check, Edit2 } from 'lucide-react';

interface CustomViewProps {
  theme: 'light' | 'dark';
}

// -------------------------------------------------------------
// 1. INTRO SCENE VIEW
// -------------------------------------------------------------
export const IntroSceneView: React.FC<CustomViewProps> = ({ theme }) => {
  const [title, setTitle] = useState('The Physics of Self-Expression');
  const [subtitle, setSubtitle] = useState('An Editorial Guide to Finding Your Authentic Voice');
  const [author, setAuthor] = useState('Presented by Erik Thor');
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const [isEditingAuthor, setIsEditingAuthor] = useState(false);

  const isDark = theme === 'dark';
  const textColor = isDark ? '#F4EAD5' : '#2C1F15';
  const subColor = isDark ? 'rgba(244, 234, 213, 0.6)' : 'rgba(44, 31, 21, 0.6)';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        padding: '60px',
        textAlign: 'center',
        fontFamily: 'Lora, serif',
        position: 'absolute',
        inset: 0,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: '850px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}>
        {/* Editorial Accent Line */}
        <div style={{ width: '80px', height: '4px', backgroundColor: 'var(--terracotta)', borderRadius: '2px' }} />

        {/* Customizable Title */}
        <div style={{ position: 'relative', width: '100%' }}>
          {isEditingTitle ? (
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              autoFocus
              style={{
                width: '100%',
                fontSize: '56px',
                fontFamily: 'Lora, serif',
                fontWeight: 500,
                textAlign: 'center',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: textColor,
                resize: 'none',
                borderBottom: '2px dashed var(--terracotta)',
              }}
            />
          ) : (
            <h1
              onClick={() => setIsEditingTitle(true)}
              style={{
                fontSize: '56px',
                fontWeight: 500,
                color: textColor,
                margin: 0,
                cursor: 'pointer',
                lineHeight: '1.2',
                transition: 'opacity 0.2s',
              }}
              title="Click to edit title"
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              {title}
            </h1>
          )}
        </div>

        {/* Customizable Subtitle */}
        <div style={{ position: 'relative', width: '100%' }}>
          {isEditingSubtitle ? (
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              onBlur={() => setIsEditingSubtitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingSubtitle(false)}
              autoFocus
              style={{
                width: '100%',
                fontSize: '20px',
                fontFamily: 'Inter, sans-serif',
                textAlign: 'center',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: subColor,
                borderBottom: '1px dashed var(--terracotta)',
              }}
            />
          ) : (
            <p
              onClick={() => setIsEditingSubtitle(true)}
              style={{
                fontSize: '20px',
                fontFamily: 'Inter, sans-serif',
                color: subColor,
                margin: 0,
                cursor: 'pointer',
                lineHeight: '1.6',
                maxWidth: '650px',
              }}
              title="Click to edit subtitle"
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Decorative Golden Dots */}
        <div style={{ display: 'flex', gap: '8px', margin: '15px 0' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--warm-gold)' }} />
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--blush)' }} />
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--warm-gold)' }} />
        </div>

        {/* Customizable Author */}
        <div style={{ position: 'relative' }}>
          {isEditingAuthor ? (
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              onBlur={() => setIsEditingAuthor(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingAuthor(false)}
              autoFocus
              style={{
                fontSize: '15px',
                fontFamily: 'Lora, serif',
                fontStyle: 'italic',
                textAlign: 'center',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: textColor,
                borderBottom: '1px dashed var(--terracotta)',
              }}
            />
          ) : (
            <p
              onClick={() => setIsEditingAuthor(true)}
              style={{
                fontSize: '15px',
                fontStyle: 'italic',
                color: textColor,
                margin: 0,
                cursor: 'pointer',
                opacity: 0.85,
              }}
              title="Click to edit author"
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.65')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.85')}
            >
              {author}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 2. ABOUT ME SCENE VIEW
// -------------------------------------------------------------
export const AboutMeSceneView: React.FC<CustomViewProps> = ({ theme }) => {
  const [name, setName] = useState('Erik Thor');
  const [role, setRole] = useState('Videographer & Personality Researcher');
  const [description, setDescription] = useState(
    'Exploring the intersections of analytical psychology, videography, and creative flow. I build interactive visual systems that help creators organize thoughts and narrate their monologues.'
  );

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  // Interaction callout states
  const [liked, setLiked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [commented, setCommented] = useState(false);

  const isDark = theme === 'dark';
  const textColor = isDark ? '#F4EAD5' : '#2C1F15';
  const subColor = isDark ? 'rgba(244, 234, 213, 0.6)' : 'rgba(44, 31, 21, 0.6)';
  const cardBg = isDark ? 'rgba(44, 31, 21, 0.45)' : 'rgba(244, 234, 213, 0.45)';
  const border = isDark ? '1px solid rgba(244, 234, 213, 0.12)' : '1px solid rgba(44, 31, 21, 0.12)';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        padding: '40px',
        position: 'absolute',
        inset: 0,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '680px',
          background: cardBg,
          backdropFilter: 'blur(12px)',
          border: border,
          borderRadius: '16px',
          padding: '40px 50px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          textAlign: 'center',
        }}
      >
        {/* Profile Avatar / Initials Indicator */}
        <div
          style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--terracotta), var(--warm-gold))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#F4EAD5',
            fontSize: '32px',
            fontFamily: 'Lora, Georgia, serif',
            fontWeight: 500,
            boxShadow: '0 4px 15px rgba(184, 103, 74, 0.25)',
          }}
        >
          ET
        </div>

        {/* Profile Name & Role */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
          {isEditingName ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
              autoFocus
              style={{
                width: '100%',
                fontSize: '32px',
                fontFamily: 'Lora, serif',
                fontWeight: 500,
                textAlign: 'center',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: textColor,
                borderBottom: '1.5px dashed var(--terracotta)',
              }}
            />
          ) : (
            <h2
              onClick={() => setIsEditingName(true)}
              style={{
                fontSize: '32px',
                fontFamily: 'Lora, serif',
                fontWeight: 500,
                color: textColor,
                margin: 0,
                cursor: 'pointer',
              }}
              title="Click to edit name"
            >
              {name}
            </h2>
          )}

          {isEditingRole ? (
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              onBlur={() => setIsEditingRole(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingRole(false)}
              autoFocus
              style={{
                width: '100%',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                textAlign: 'center',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--terracotta)',
                borderBottom: '1px dashed var(--terracotta)',
              }}
            />
          ) : (
            <span
              onClick={() => setIsEditingRole(true)}
              style={{
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                color: 'var(--terracotta)',
                fontWeight: 600,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
              title="Click to edit role"
            >
              {role}
            </span>
          )}
        </div>

        {/* Profile Bio */}
        <div style={{ width: '100%' }}>
          {isEditingDescription ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => setIsEditingDescription(false)}
              rows={4}
              autoFocus
              style={{
                width: '100%',
                fontSize: '15px',
                fontFamily: 'Inter, sans-serif',
                lineHeight: '1.6',
                textAlign: 'center',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: subColor,
                resize: 'none',
                borderBottom: '1.5px dashed var(--terracotta)',
              }}
            />
          ) : (
            <p
              onClick={() => setIsEditingDescription(true)}
              style={{
                fontSize: '15px',
                fontFamily: 'Inter, sans-serif',
                color: subColor,
                lineHeight: '1.6',
                margin: 0,
                cursor: 'pointer',
              }}
              title="Click to edit bio"
            >
              {description}
            </p>
          )}
        </div>

        {/* Subtle Callouts / Interactions Section */}
        <div style={{ display: 'flex', gap: '16px', width: '100%', marginTop: '10px', justifyContent: 'center' }}>
          {/* Like Button */}
          <button
            onClick={() => setLiked(!liked)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '24px',
              border: liked ? '1px solid var(--terracotta)' : border,
              backgroundColor: liked ? 'rgba(184, 103, 74, 0.12)' : 'transparent',
              color: liked ? 'var(--terracotta)' : textColor,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            <Heart size={14} fill={liked ? 'var(--terracotta)' : 'none'} style={{ transition: 'transform 0.2s ease' }} />
            Like {liked && <Check size={12} />}
          </button>

          {/* Comment Callout */}
          <button
            onClick={() => setCommented(!commented)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '24px',
              border: commented ? '1px solid var(--warm-gold)' : border,
              backgroundColor: commented ? 'rgba(201, 165, 99, 0.12)' : 'transparent',
              color: commented ? 'var(--warm-gold)' : textColor,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            <MessageSquare size={14} fill={commented ? 'var(--warm-gold)' : 'none'} />
            Comment {commented && <Check size={12} />}
          </button>

          {/* Subscribe Callout */}
          <button
            onClick={() => setSubscribed(!subscribed)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '24px',
              border: subscribed ? '1px solid var(--terracotta)' : border,
              backgroundColor: subscribed ? 'var(--terracotta)' : 'transparent',
              color: subscribed ? '#F4EAD5' : textColor,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
          >
            <Bell size={14} fill={subscribed ? '#F4EAD5' : 'none'} />
            {subscribed ? 'Subscribed!' : 'Subscribe'}
          </button>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 3. PLAN SCENE VIEW
// -------------------------------------------------------------
export const PlanSceneView: React.FC<CustomViewProps> = ({ theme }) => {
  const [title, setTitle] = useState('Today’s Roadmap');
  const [steps, setSteps] = useState([
    { id: 1, text: 'The Core Conflict: Safety vs. Growth', active: true },
    { id: 2, text: 'Mapping the 8 Virtues of Self', active: false },
    { id: 3, text: 'Cognitive Appraisals & Reframing', active: false },
    { id: 4, text: 'Self Inquiry & Integration Monologue', active: false },
  ]);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingStepId, setEditingStepId] = useState<number | null>(null);
  const [tempStepText, setTempStepText] = useState('');

  const toggleStepActive = (id: number) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const startEditingStep = (id: number, text: string) => {
    setEditingStepId(id);
    setTempStepText(text);
  };

  const saveStepEdit = (id: number) => {
    if (tempStepText.trim()) {
      setSteps(prev => prev.map(s => s.id === id ? { ...s, text: tempStepText.trim() } : s));
    }
    setEditingStepId(null);
  };

  const isDark = theme === 'dark';
  const textColor = isDark ? '#F4EAD5' : '#2C1F15';
  const subColor = isDark ? 'rgba(244, 234, 213, 0.6)' : 'rgba(44, 31, 21, 0.6)';
  const border = isDark ? 'rgba(244, 234, 213, 0.15)' : 'rgba(44, 31, 21, 0.15)';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        padding: '50px',
        position: 'absolute',
        inset: 0,
        boxSizing: 'border-box',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ width: '640px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              autoFocus
              style={{
                fontSize: '36px',
                fontFamily: 'Lora, serif',
                fontWeight: 500,
                textAlign: 'center',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: textColor,
                borderBottom: '2px dashed var(--terracotta)',
              }}
            />
          ) : (
            <h2
              onClick={() => setIsEditingTitle(true)}
              style={{
                fontSize: '36px',
                fontFamily: 'Lora, serif',
                fontWeight: 500,
                color: textColor,
                margin: 0,
                cursor: 'pointer',
              }}
              title="Click to edit title"
            >
              {title}
            </h2>
          )}
          <p style={{ fontSize: '13px', color: 'var(--terracotta)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '6px' }}>
            Click items to check off or edit
          </p>
        </div>

        {/* Timeline / Roadmap Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', position: 'relative', paddingLeft: '30px' }}>
          {/* Vertical Connecting Line */}
          <div
            style={{
              position: 'absolute',
              left: '42px',
              top: '20px',
              bottom: '20px',
              width: '2px',
              background: `linear-gradient(to bottom, var(--terracotta) 0%, ${border} 100%)`,
              zIndex: 1,
            }}
          />

          {steps.map((step, idx) => {
            const isStepEditing = editingStepId === step.id;
            
            return (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '24px',
                  padding: '16px 0',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {/* Node Indicator */}
                <div
                  onClick={() => toggleStepActive(step.id)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: step.active ? '2px solid var(--terracotta)' : `2px solid ${border}`,
                    backgroundColor: step.active ? 'var(--terracotta)' : isDark ? '#2C1F15' : '#F4EAD5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#F4EAD5',
                    transition: 'all 0.25s ease',
                    boxShadow: step.active ? '0 0 10px rgba(184, 103, 74, 0.4)' : 'none',
                    marginTop: '2px',
                  }}
                >
                  {step.active && <Check size={12} strokeWidth={3} />}
                </div>

                {/* Step Content */}
                <div style={{ flex: 1 }}>
                  {isStepEditing ? (
                    <input
                      type="text"
                      value={tempStepText}
                      onChange={(e) => setTempStepText(e.target.value)}
                      onBlur={() => saveStepEdit(step.id)}
                      onKeyDown={(e) => e.key === 'Enter' && saveStepEdit(step.id)}
                      autoFocus
                      style={{
                        width: '100%',
                        fontSize: '18px',
                        fontFamily: 'Lora, serif',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: textColor,
                        borderBottom: '1px dashed var(--terracotta)',
                        padding: '2px 0',
                      }}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        onClick={() => toggleStepActive(step.id)}
                        style={{
                          fontSize: '18px',
                          fontFamily: 'Lora, serif',
                          color: step.active ? 'var(--terracotta)' : textColor,
                          textDecoration: step.active ? 'line-through' : 'none',
                          opacity: step.active ? 0.6 : 1,
                          cursor: 'pointer',
                          fontWeight: 500,
                          transition: 'color 0.2s',
                        }}
                      >
                        {step.text}
                      </span>
                      <button
                        onClick={() => startEditingStep(step.id, step.text)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: textColor,
                          opacity: 0.3,
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.3')}
                      >
                        <Edit2 size={11} />
                      </button>
                    </div>
                  )}
                  <span style={{ fontSize: '12px', color: subColor, marginTop: '4px', display: 'block' }}>
                    Part {idx + 1} of video monologue
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 4. OUTRO SCENE VIEW
// -------------------------------------------------------------
export const OutroSceneView: React.FC<CustomViewProps> = ({ theme }) => {
  const [title, setTitle] = useState('Thank You for Watching');
  const [subtitle, setSubtitle] = useState('Share your self-reflection answers in the comments below.');
  const [callToAction, setCallToAction] = useState('Like & subscribe to support creative monologues.');

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const [isEditingCall, setIsEditingCall] = useState(false);

  const isDark = theme === 'dark';
  const textColor = isDark ? '#F4EAD5' : '#2C1F15';
  const subColor = isDark ? 'rgba(244, 234, 213, 0.6)' : 'rgba(44, 31, 21, 0.6)';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        padding: '60px',
        textAlign: 'center',
        fontFamily: 'Lora, serif',
        position: 'absolute',
        inset: 0,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: '780px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎬</div>

        {/* Customizable Title */}
        <div style={{ position: 'relative', width: '100%' }}>
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              autoFocus
              style={{
                width: '100%',
                fontSize: '44px',
                fontFamily: 'Lora, serif',
                fontWeight: 500,
                textAlign: 'center',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: textColor,
                borderBottom: '2px dashed var(--terracotta)',
              }}
            />
          ) : (
            <h1
              onClick={() => setIsEditingTitle(true)}
              style={{
                fontSize: '44px',
                fontWeight: 500,
                color: textColor,
                margin: 0,
                cursor: 'pointer',
                lineHeight: '1.2',
              }}
              title="Click to edit title"
            >
              {title}
            </h1>
          )}
        </div>

        {/* Customizable Subtitle */}
        <div style={{ position: 'relative', width: '100%' }}>
          {isEditingSubtitle ? (
            <textarea
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              onBlur={() => setIsEditingSubtitle(false)}
              autoFocus
              style={{
                width: '100%',
                fontSize: '18px',
                fontFamily: 'Inter, sans-serif',
                lineHeight: '1.6',
                textAlign: 'center',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: subColor,
                resize: 'none',
                borderBottom: '1px dashed var(--terracotta)',
              }}
            />
          ) : (
            <p
              onClick={() => setIsEditingSubtitle(true)}
              style={{
                fontSize: '18px',
                fontFamily: 'Inter, sans-serif',
                color: subColor,
                margin: 0,
                cursor: 'pointer',
                lineHeight: '1.6',
                maxWidth: '600px',
              }}
              title="Click to edit subtitle"
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Divider line */}
        <div style={{ width: '60px', height: '1px', backgroundColor: 'var(--warm-gold)', margin: '10px 0' }} />

        {/* Customizable Call To Action */}
        <div style={{ position: 'relative', width: '100%' }}>
          {isEditingCall ? (
            <input
              type="text"
              value={callToAction}
              onChange={(e) => setCallToAction(e.target.value)}
              onBlur={() => setIsEditingCall(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingCall(false)}
              autoFocus
              style={{
                width: '100%',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                textAlign: 'center',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--terracotta)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                borderBottom: '1px dashed var(--terracotta)',
              }}
            />
          ) : (
            <span
              onClick={() => setIsEditingCall(true)}
              style={{
                fontSize: '13px',
                fontFamily: 'Inter, sans-serif',
                color: 'var(--terracotta)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                cursor: 'pointer',
              }}
              title="Click to edit call to action"
            >
              {callToAction}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
