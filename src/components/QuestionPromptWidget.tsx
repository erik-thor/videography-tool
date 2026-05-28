import React, { useState, useEffect } from 'react';

interface QuestionPromptWidgetProps {
  question?: string;
  onChange?: (val: string) => void;
}

export const QuestionPromptWidget: React.FC<QuestionPromptWidgetProps> = ({
  question: propQuestion = '',
  onChange,
}) => {
  const [question, setQuestion] = useState(propQuestion);

  useEffect(() => {
    setQuestion(propQuestion);
  }, [propQuestion]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setQuestion(val);
    if (onChange) onChange(val);
  };

  return (
    <div
      style={{
        borderLeft: '8px solid var(--terracotta)',
        paddingLeft: '28px',
        paddingTop: '8px',
        paddingBottom: '8px',
        fontFamily: 'Lora, Georgia, serif',
        color: 'var(--warm-ink)',
        width: '100%',
      }}
    >
      <textarea
        value={question}
        onChange={handleChange}
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
          fontSize: '36px',
          lineHeight: '1.5',
          fontWeight: 500,
          resize: 'none',
          padding: 0,
        }}
      />
    </div>
  );
};
