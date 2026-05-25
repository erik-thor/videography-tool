import React, { useState } from 'react';

export const QuestionPromptWidget: React.FC = () => {
  const [question, setQuestion] = useState(
    "Personal Reflection: [Reflection Question: What's standing in the way of your authentic self-expression today?]"
  );

  return (
    <div
      style={{
        borderLeft: '5px solid var(--terracotta)',
        paddingLeft: '14px',
        paddingTop: '4px',
        paddingBottom: '4px',
        fontFamily: 'Lora, Georgia, serif',
        color: 'var(--warm-ink)',
        width: '100%',
      }}
    >
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={3}
        style={{
          width: '100%',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: 'inherit',
          fontFamily: 'inherit',
          fontSize: '17px',
          lineHeight: '1.6',
          fontWeight: 500,
          resize: 'none',
          padding: 0,
        }}
      />
    </div>
  );
};
