import type { CSSProperties, ReactNode } from 'react';
import { Hourglass } from 'lucide-react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'gold' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: CSSProperties;
  className?: string;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  className = '',
}: ButtonProps) {
  const baseStyle: CSSProperties = {
    padding: '13px 20px',
    borderRadius: '13px',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  const variantStyles: Record<string, CSSProperties> = {
    primary: {
      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
      color: '#fff',
    },
    gold: {
      background: 'linear-gradient(135deg, #f59e0b, #f97316)',
      color: '#fff',
    },
    ghost: {
      background: 'rgba(255, 255, 255, 0.04)',
      color: 'rgba(255, 255, 255, 0.6)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
    },
  };

  return (
    <div
      onClick={disabled || loading ? undefined : onClick}
      style={{ ...baseStyle, ...variantStyles[variant], ...style }}
      className={className}
    >
      {loading ? (
        <>
          <Hourglass size={16} />
          加载中...
        </>
      ) : (
        children
      )}
    </div>
  );
}
