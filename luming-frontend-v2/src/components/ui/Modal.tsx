import type { CSSProperties, ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: 'small' | 'medium' | 'large';
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = 'medium',
}: ModalProps) {
  if (!isOpen) return null;

  const sizeStyles: Record<string, CSSProperties> = {
    small: { maxWidth: '320px' },
    medium: { maxWidth: '400px' },
    large: { maxWidth: '480px' },
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(10px)',
        zIndex: 250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#14151b',
          borderRadius: '24px',
          width: '100%',
          ...sizeStyles[size],
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {title && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800 }}>{title}</div>
            <div
              onClick={onClose}
              style={{
                cursor: 'pointer',
                fontSize: 16,
                color: 'rgba(255, 255, 255, 0.3)',
              }}
            >
              ✕
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
