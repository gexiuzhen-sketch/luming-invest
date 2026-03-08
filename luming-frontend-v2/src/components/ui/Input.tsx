import type { CSSProperties } from 'react';

interface InputProps {
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'tel' | 'date';
  suffix?: string;
  style?: CSSProperties;
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  suffix,
  style,
}: InputProps) {
  return (
    <div style={{ marginBottom: 16, ...style }}>
      {label && (
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: 6,
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1.5px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1,
            padding: '12px 14px',
            background: 'transparent',
            border: 'none',
            color: '#e8e8ec',
            fontSize: 14,
            outline: 'none',
          }}
        />
        {suffix && (
          <span
            style={{
              padding: '0 14px',
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.3)',
              flexShrink: 0,
            }}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
