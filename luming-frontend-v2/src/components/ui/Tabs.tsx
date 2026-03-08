import type { CSSProperties, ReactNode } from 'react';

interface Tab {
  key: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeKey: string;
  onChange: (key: string) => void;
  variant?: 'line' | 'pills';
  style?: CSSProperties;
  className?: string;
}

export function Tabs({
  tabs,
  activeKey,
  onChange,
  variant = 'line',
  style,
  className = '',
}: TabsProps) {
  return (
    <div
      className={`tabs tabs-${variant} ${className}`}
      style={{
        display: 'flex',
        gap: variant === 'line' ? '0' : '8px',
        ...style,
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => !tab.disabled && onChange(tab.key)}
          disabled={tab.disabled}
          className={`tab ${activeKey === tab.key ? 'active' : ''}`}
          style={{
            ...getTabStyle(variant, activeKey === tab.key, tab.disabled),
          }}
        >
          {tab.icon && <span className="tab-icon">{tab.icon}</span>}
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

function getTabStyle(
  variant: 'line' | 'pills',
  isActive: boolean,
  disabled?: boolean
): CSSProperties {
  const baseStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: variant === 'line' ? '10px 16px' : '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    border: 'none',
    background: 'transparent',
    color: 'rgba(255, 255, 255, 0.5)',
    opacity: disabled ? 0.4 : 1,
  };

  if (variant === 'line') {
    return {
      ...baseStyle,
      borderBottom: isActive ? '2px solid #6366f1' : '2px solid transparent',
      color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.5)',
    };
  } else {
    return {
      ...baseStyle,
      borderRadius: '8px',
      background: isActive ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255, 255, 255, 0.04)',
      color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.5)',
    };
  }
}
