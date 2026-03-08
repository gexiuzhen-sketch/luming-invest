import type { CSSProperties, ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  style?: CSSProperties;
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  style,
  className = '',
}: BadgeProps) {
  const variantStyles: Record<string, CSSProperties> = {
    default: {
      background: 'rgba(255, 255, 255, 0.08)',
      color: 'rgba(255, 255, 255, 0.7)',
    },
    success: {
      background: 'rgba(34, 197, 94, 0.15)',
      color: '#22c55e',
      border: '1px solid rgba(34, 197, 94, 0.3)',
    },
    warning: {
      background: 'rgba(251, 191, 36, 0.15)',
      color: '#fbbf24',
      border: '1px solid rgba(251, 191, 36, 0.3)',
    },
    danger: {
      background: 'rgba(239, 68, 68, 0.15)',
      color: '#ef4444',
      border: '1px solid rgba(239, 68, 68, 0.3)',
    },
    info: {
      background: 'rgba(59, 130, 246, 0.15)',
      color: '#3b82f6',
      border: '1px solid rgba(59, 130, 246, 0.3)',
    },
  };

  const sizeStyles: Record<string, CSSProperties> = {
    sm: {
      fontSize: '10px',
      padding: '2px 6px',
      borderRadius: '4px',
    },
    md: {
      fontSize: '12px',
      padding: '4px 10px',
      borderRadius: '6px',
    },
    lg: {
      fontSize: '14px',
      padding: '6px 12px',
      borderRadius: '8px',
    },
  };

  return (
    <span
      className={`badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
    >
      {children}
    </span>
  );
}
