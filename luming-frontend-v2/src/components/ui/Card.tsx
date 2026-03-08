import type { CSSProperties, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
  className?: string;
  index?: number;
}

export function Card({
  children,
  onClick,
  style,
  className = '',
  index = 0,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        margin: '0 16px 14px',
        padding: '18px',
        borderRadius: 18,
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.015))',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
        animation: `fadeUp 0.4s ease ${index * 60}ms both`,
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  );
}
