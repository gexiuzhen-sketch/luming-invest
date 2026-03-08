import type { Stock } from '../types';
import { Card } from './ui/Card';
import { Circle, Hourglass } from 'lucide-react';

interface StockCardProps {
  stock: Stock;
  index: number;
  onClick: () => void;
}

export const StockCard: React.FC<StockCardProps> = ({ stock, index, onClick }) => {
  const change = stock.changePct ?? 0;
  const isUp = change >= 0;
  // 确保 score 是有效数字，避免 NaN
  const score = typeof stock.score === 'number' && !isNaN(stock.score) ? Math.min(100, Math.max(0, stock.score)) : 0;

  // 计算评分颜色
  const getScoreColor = (score: number) => {
    if (score >= 70) return '#ef4444';
    if (score >= 55) return '#f59e0b';
    return '#22c55e';
  };

  const scoreColor = getScoreColor(score);

  // 计算圆环进度 - 确保值有效
  const circumference = 2 * Math.PI * 19;
  const strokeDashoffset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100);

  // 获取显示的行业标签
  const displayIndustry = stock.industry || stock.sector;

  return (
    <Card index={index} onClick={onClick}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{stock.name}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
              {stock.code}
            </span>
            {displayIndustry && (
              <span
                style={{
                  fontSize: 9,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'rgba(245, 158, 11, 0.06)',
                  color: '#fbbf24',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {displayIndustry}
              </span>
            )}
          </div>
          {/* Tags */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(stock.tags || []).slice(0, 3).map((tag, i) => (
              <span
                key={i}
                style={{
                  fontSize: 10,
                  padding: '3px 8px',
                  borderRadius: 6,
                  fontWeight: 500,
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: 'rgba(255, 255, 255, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Price & Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            {stock.market === 'FUND' ? (
              <>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>净值</div>
                <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'monospace' }}>
                  {(stock.price ?? 0).toFixed(4)}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'monospace' }}>
                {(stock.price ?? 0).toFixed(2)}
              </div>
            )}
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'monospace',
                color: isUp ? '#ef4444' : '#22c55e',
              }}
            >
              {isUp ? '+' : ''}
              {change.toFixed(2)}%
            </div>
          </div>

          {/* Score Ring - 修复移动端显示问题 */}
          <div style={{ position: 'relative', width: 44, height: 44 }}>
            <svg width={44} height={44} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
              <circle
                cx="22"
                cy="22"
                r={19}
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="3"
              />
              <circle
                cx="22"
                cy="22"
                r={19}
                fill="none"
                stroke={scoreColor}
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s' }}
              />
            </svg>
            {/* 使用div替代SVG text以获得更好的移动端兼容性 */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '13px',
                fontWeight: 700,
                color: scoreColor,
                pointerEvents: 'none',
              }}
            >
              {score}
            </div>
          </div>
        </div>
      </div>

      {/* Timing Badge - 使用Lucide图标 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {(() => {
          // 根据timing和timingText显示推荐信息
          const timingConfig = {
            buy_now: {
              icon: <Circle size={12} fill="#ef4444" color="#ef4444" />,
              label: stock.timingText || '强烈推荐',
              bg: 'rgba(239, 68, 68, 0.12)',
              border: 'rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
            },
            buy_soon: {
              icon: <Circle size={12} fill="#f97316" color="#f97316" />,
              label: stock.timingText || '建议买入',
              bg: 'rgba(249, 115, 22, 0.12)',
              border: 'rgba(249, 115, 22, 0.3)',
              color: '#f97316',
            },
            hold: {
              icon: <Circle size={12} fill="#fbbf24" color="#fbbf24" />,
              label: stock.timingText || '持有观望',
              bg: 'rgba(251, 191, 36, 0.12)',
              border: 'rgba(251, 191, 36, 0.3)',
              color: '#fbbf24',
            },
            wait: {
              icon: <Hourglass size={12} color="#fbbf24" />,
              label: stock.timingText || '等待机会',
              bg: 'rgba(251, 191, 36, 0.12)',
              border: 'rgba(251, 191, 36, 0.3)',
              color: '#fbbf24',
            },
            avoid: {
              icon: <Circle size={12} fill="#22c55e" color="#22c55e" />,
              label: stock.timingText || '建议规避',
              bg: 'rgba(34, 197, 94, 0.12)',
              border: 'rgba(34, 197, 94, 0.3)',
              color: '#22c55e',
            },
          };

          const config = timingConfig[stock.timing as keyof typeof timingConfig];

          if (!config) {
            // 如果没有timing信息，根据评分显示默认提示
            if (score >= 70) {
              return (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 12px',
                    borderRadius: 8,
                    background: timingConfig.buy_now.bg,
                    border: `1px solid ${timingConfig.buy_now.border}`,
                    fontSize: 12,
                    fontWeight: 700,
                    color: timingConfig.buy_now.color,
                  }}
                >
                  {timingConfig.buy_now.icon}
                  建议关注
                </div>
              );
            } else if (score >= 55) {
              return (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 12px',
                    borderRadius: 8,
                    background: timingConfig.hold.bg,
                    border: `1px solid ${timingConfig.hold.border}`,
                    fontSize: 12,
                    fontWeight: 700,
                    color: timingConfig.hold.color,
                  }}
                >
                  {timingConfig.hold.icon}
                  持有观望
                </div>
              );
            }
            return null;
          }

          return (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 12px',
                borderRadius: 8,
                background: config.bg,
                border: `1px solid ${config.border}`,
                fontSize: 12,
                fontWeight: 700,
                color: config.color,
              }}
            >
              {config.icon}
              {config.label}
            </div>
          );
        })()}
      </div>
    </Card>
  );
};
