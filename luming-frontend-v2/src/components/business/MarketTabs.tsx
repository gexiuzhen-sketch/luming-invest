import type { CSSProperties, ReactNode } from 'react';

export interface Market {
  key: string;
  label: string;
  flag?: string;  // 国旗emoji
  icon?: ReactNode;  // Lucide icon component
}

interface MarketTabsProps {
  markets: Market[];
  activeKey: string;
  onChange: (key: string) => void;
  style?: CSSProperties;
  className?: string;
}

const DEFAULT_MARKETS: Market[] = [
  { key: 'A', label: '沪深A股', flag: '🇨🇳' },
  { key: 'HK', label: '港股', flag: '🇭🇰' },
  { key: 'US', label: '美股', flag: '🇺🇸' },
  { key: 'FUND', label: '基金', flag: '💰' },
];

export function MarketTabs({
  markets = DEFAULT_MARKETS,
  activeKey,
  onChange,
  style,
  className = '',
}: MarketTabsProps) {
  return (
    <div
      className={`market-tabs ${className}`}
      style={{
        display: 'flex',
        gap: '8px',
        padding: '0 16px 16px',
        overflowX: 'auto',
        ...style,
      }}
    >
      {markets.map((market) => (
        <button
          key={market.key}
          onClick={() => onChange(market.key)}
          className={`market-tab ${activeKey === market.key ? 'active' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            background:
              activeKey === market.key
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : 'rgba(255, 255, 255, 0.04)',
            color: activeKey === market.key ? '#fff' : 'rgba(255, 255, 255, 0.5)',
            transition: 'all 0.2s',
          }}
        >
          {market.flag && <span>{market.flag}</span>}
          {market.icon && <span style={{ display: 'flex' }}>{market.icon}</span>}
          <span>{market.label}</span>
        </button>
      ))}
    </div>
  );
}

export { DEFAULT_MARKETS };
