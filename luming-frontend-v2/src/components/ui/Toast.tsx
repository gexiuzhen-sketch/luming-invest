import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { CSSProperties } from 'react';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose?: () => void;
}

export function Toast({ message, variant = 'info', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const variantStyles: Record<ToastVariant, CSSProperties> = {
    success: {
      background: 'rgba(34, 197, 94, 0.95)',
      border: '1px solid rgba(34, 197, 94, 0.3)',
    },
    error: {
      background: 'rgba(239, 68, 68, 0.95)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
    },
    warning: {
      background: 'rgba(251, 191, 36, 0.95)',
      border: '1px solid rgba(251, 191, 36, 0.3)',
    },
    info: {
      background: 'rgba(59, 130, 246, 0.95)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
    },
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        minWidth: '300px',
        maxWidth: '90%',
        padding: '14px 18px',
        borderRadius: '12px',
        color: '#fff',
        fontSize: '14px',
        fontWeight: 500,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease',
        ...variantStyles[variant],
      }}
    >
      <span>{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose?.(), 300);
        }}
        style={{
          background: 'none',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

// Toast容器和管理器
let toastListeners: Array<(toast: ToastProps) => void> = [];

// eslint-disable-next-line react-refresh/only-export-components
export const toast = {
  show: (message: string, variant: ToastVariant = 'info') => {
    toastListeners.forEach((listener) => listener({ message, variant }));
  },
  success: (message: string) => toast.show(message, 'success'),
  error: (message: string) => toast.show(message, 'error'),
  warning: (message: string) => toast.show(message, 'warning'),
  info: (message: string) => toast.show(message, 'info'),
  subscribe: (listener: (toast: ToastProps) => void) => {
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  },
};
