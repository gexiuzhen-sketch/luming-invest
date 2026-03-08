import type { Stock } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { BarChart3 } from 'lucide-react';

interface StockDetailModalProps {
  stock: Stock | null;
  onClose: () => void;
  onAddWatchlist: () => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({ stock, onClose, onAddWatchlist }) => {
  if (!stock) return null;

  const change = stock.changePct ?? 0;
  const isUp = change >= 0;

  return (
    <Modal isOpen={!!stock} onClose={onClose} size="large">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{stock.name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
            {stock.code} · {stock.market === 'SH' || stock.market === 'SZ' ? '沪深' : stock.market === 'HK' ? '港股' : stock.market === 'US' ? '美股' : stock.market === 'FUND' ? '基金' : '其他'}
          </div>
        </div>
        <div onClick={onClose} style={{ cursor: 'pointer', fontSize: 16, color: 'rgba(255,255,255,0.3)' }}>
          ✕
        </div>
      </div>

      {/* Price */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 32, fontWeight: 800, fontFamily: 'monospace' }}>
          {(stock.price ?? 0).toFixed(2)}
        </span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: isUp ? '#ef4444' : '#22c55e',
            background: isUp ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            padding: '3px 10px',
            borderRadius: 7,
          }}
        >
          {isUp ? '+' : ''}
          {change.toFixed(2)}%
        </span>
      </div>

      {/* Score */}
      {stock.score !== undefined && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', borderRadius: 12, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <svg width={56} height={56} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="28" cy="28" r={24} fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="3.5" />
                <circle
                  cx="28"
                  cy="28"
                  r={24}
                  fill="none"
                  stroke={(stock.score >= 85 ? '#ef4444' : stock.score >= 70 ? '#f59e0b' : '#22c55e')}
                  strokeWidth="3.5"
                  strokeDasharray={2 * Math.PI * 24}
                  strokeDashoffset={2 * Math.PI * 24 * (1 - stock.score / 100)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s' }}
                />
                <text
                  x="28"
                  y="28"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={(stock.score >= 85 ? '#ef4444' : stock.score >= 70 ? '#f59e0b' : '#22c55e')}
                  fontSize="17"
                  fontWeight="800"
                  style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
                >
                  {stock.score}
                </text>
              </svg>
              <div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>综合评分</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: (stock.score >= 85 ? '#ef4444' : stock.score >= 70 ? '#f59e0b' : '#22c55e') }}>
                  {stock.score >= 85 ? '强烈推荐' : stock.score >= 70 ? '推荐买入' : stock.score >= 55 ? '持有' : stock.score >= 40 ? '谨慎持有' : '建议规避'}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>建议操作</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>
                {stock.timing === 'buy_now' ? '建议买入' : '等待机会'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 7,
          marginBottom: 14,
        }}
      >
        <MetricBox label="PE" value={stock.pe ? String(stock.pe) : '-'} />
        <MetricBox label="ROE" value={stock.roe ? `${stock.roe}%` : '-'} />
        <MetricBox label="RSI" value={stock.rsi ? String(stock.rsi) : '-'} />
        <MetricBox label="MACD" value={stock.macd === 'golden_cross' ? '金叉' : stock.macd === 'death_cross' ? '死叉' : '-'} />
        <MetricBox label="行业" value={stock.sector || stock.industry || '-'} />
        <MetricBox label="市值" value={stock.cap || '-'} />
      </div>

      {/* Why */}
      {stock.why && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 12,
            background: 'rgba(245, 158, 11, 0.04)',
            border: '1px solid rgba(245, 158, 11, 0.08)',
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, color: '#fbbf24' }}>🤖 量化分析</div>
          <div style={{ fontSize: 12, lineHeight: 1.8, color: 'rgba(255,255,255,0.5)' }}>
            {stock.why}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <Button onClick={onAddWatchlist} variant="ghost" style={{ flex: 1 }}>
          ⭐ 加自选
        </Button>
        <Button
          onClick={() => {
            window.location.href = `/signals.html?code=${stock.code}`;
          }}
          variant="gold"
          style={{ flex: 1 }}
        >
          <BarChart3 size={16} style={{ marginRight: 4 }} />
          买卖建议
        </Button>
      </div>
    </Modal>
  );
};

interface MetricBoxProps {
  label: string;
  value: string;
}

const MetricBox: React.FC<MetricBoxProps> = ({ label, value }) => (
  <div
    style={{
      padding: '8px 10px',
      borderRadius: 9,
      background: 'rgba(255, 255, 255, 0.025)',
      border: '1px solid rgba(255, 255, 255, 0.04)',
    }}
  >
    <div style={{ fontSize: 9, marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
  </div>
);
