import React, { useState } from 'react';

export const QuestionPromptWidget: React.FC = () => {
  const [question, setQuestion] = useState(
    "Personal Reflection: [Reflection Question: What's standing in the way of your authentic self-expression today?]"
  );

  return (
    <div
      style={{
        borderLeft: '6px solid var(--terracotta)',
        paddingLeft: '22px',
        paddingTop: '6px',
        paddingBottom: '6px',
        fontFamily: 'Lora, Georgia, serif',
        color: 'var(--warm-ink)',
        width: '100%',
      }}
    >
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={4}
        spellCheck={false}
        data-enable-grammarly="false"
        style={{
          width: '100%',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: 'inherit',
          fontFamily: 'inherit',
          fontSize: '24px',
          lineHeight: '1.6',
          fontWeight: 500,
          resize: 'none',
          padding: 0,
        }}
      />
    </div>
  );
};
