import { useState, useEffect } from 'react';
import type { Stock } from '../types';
import { analyzeStockOptimized, type OptimizedStockAnalysis } from '../services/stockAnalyzerOptimized';
import { X, TrendingUp, Activity, Target, Plus, PieChart, Layers, type LucideIcon } from 'lucide-react';
import { portfolioService } from '../services/portfolioService';
import { translateMACDSimple } from '../utils/technicalTerms';

interface StockDetailModalProps {
  stock: Stock | null;
  onClose: () => void;
  onAddWatchlist: () => void;
  isInWatchlist?: boolean;
}

export function StockDetailModalEnhanced({ stock, onClose, onAddWatchlist, isInWatchlist = false }: StockDetailModalProps) {
  const [analysis, setAnalysis] = useState<OptimizedStockAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddHoldingModal, setShowAddHoldingModal] = useState(false);
  const [holdingForm, setHoldingForm] = useState({
    costPrice: stock?.price || 0,
    quantity: 100,
    purchaseDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (stock) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
      // 使用 analyzeStockOptimized 确保与列表页评分一致
      const result = analyzeStockOptimized(stock);
      setAnalysis(result);
      setLoading(false);
    }
  }, [stock]);

  if (!stock) return null;

  const change = stock.changePct ?? 0;
  const isUp = change >= 0;

  const handleAddHolding = () => {
    if (!stock) return;

    portfolioService.addHolding({
      code: stock.code,
      name: stock.name,
      market: stock.market,
      costPrice: holdingForm.costPrice,
      quantity: holdingForm.quantity,
      purchaseDate: holdingForm.purchaseDate,
    });

    setShowAddHoldingModal(false);
    onClose();
    alert('持仓添加成功！');
  };

  if (loading || !analysis) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}>
        <div style={{ color: '#fff', textAlign: 'center' }}>
          <Activity size={40} style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ marginTop: 16 }}>AI分析中...</div>
        </div>
      </div>
    );
  }

  // 计算动态权重显示
  const getWeightsDisplay = () => {
    const scores = analysis.scores;
    const total = Object.values(scores).reduce((sum, val) => sum + val, 0);
    return {
      value: Math.round((scores.value / total) * 100),
      growth: Math.round((scores.growth / total) * 100),
      quality: Math.round((scores.quality / total) * 100),
      technical: Math.round((scores.technical / total) * 100),
      sentiment: Math.round((scores.sentiment / total) * 100),
      volatility: Math.round((scores.volatility / total) * 100),
    };
  };

  const weightsDisplay = getWeightsDisplay();

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: 0,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            background: '#0f0f17',
            borderRadius: '24px 24px 0 0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '12px',
            background: '#1a1b26',
          }}>
            <div style={{
              width: '40px',
              height: '4px',
              borderRadius: '2px',
              background: 'rgba(255,255,255,0.2)',
            }} />
          </div>

          {/* Content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            WebkitOverflowScrolling: 'touch',
          }}>
            {/* 顶部信息 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, color: '#fff' }}>
                    {stock.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
                    {stock.code} · {stock.market === 'SH' || stock.market === 'SZ' ? 'A股' : stock.market === 'HK' ? '港股' : stock.market === 'US' ? '美股' : '基金'}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)',
                    border: 'none',
                    color: 'rgba(255,255,255,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* 价格和涨跌 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div>
                  {stock.market === 'FUND' ? (
                    <div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>
                        净值 {new Date().toLocaleDateString('zh-CN')}
                      </div>
                      <span style={{ fontSize: 38, fontWeight: 800, fontFamily: 'monospace', color: '#fff' }}>
                        {(stock.price ?? 0).toFixed(4)}
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 38, fontWeight: 800, fontFamily: 'monospace', color: '#fff' }}>
                      {(stock.price ?? 0).toFixed(2)}
                    </span>
                  )}
                </div>
                <div style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: isUp ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                  border: `1px solid ${isUp ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                }}>
                  <span style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: isUp ? '#ef4444' : '#22c55e',
                  }}>
                    {isUp ? '+' : ''}{change.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* AI综合评分 */}
              <div style={{
                padding: '16px',
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${
                  analysis.overallScore >= 70 ? 'rgba(239, 68, 68, 0.12)' :
                  analysis.overallScore >= 50 ? 'rgba(251, 191, 36, 0.12)' :
                  'rgba(34, 197, 94, 0.12)'
                })`,
                border: `1px solid ${
                  analysis.overallScore >= 70 ? 'rgba(239, 68, 68, 0.3)' :
                  analysis.overallScore >= 50 ? 'rgba(251, 191, 36, 0.3)' :
                  'rgba(34, 197, 94, 0.3)'
                }`,
                marginBottom: 16,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>AI综合评分</div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                      {analysis.overallScore}<span style={{ fontSize: 16, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>/100</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: analysis.overallScore >= 70 ? '#ef4444' : analysis.overallScore >= 50 ? '#fbbf24' : '#22c55e',
                      marginBottom: 2,
                    }}>
                      {analysis.recommendation}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                      信心度 {analysis.confidence}% · {analysis.riskLevel === 'low' ? '低风险' : analysis.riskLevel === 'medium' ? '中等风险' : '高风险'}
                    </div>
                  </div>
                </div>

                {/* 六维评分 + 权重 */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <PieChart size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>六维评分 (含权重)</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {Object.entries(analysis.scores).map(([key, value]) => {
                      const labels: Record<string, {label: string, color: string, weight: string}> = {
                        value: {label: '估值', color: '#818cf8', weight: `${weightsDisplay.value}%`},
                        growth: {label: '成长', color: '#22c55e', weight: `${weightsDisplay.growth}%`},
                        quality: {label: '质量', color: '#fbbf24', weight: `${weightsDisplay.quality}%`},
                        technical: {label: '技术', color: '#f97316', weight: `${weightsDisplay.technical}%`},
                        sentiment: {label: '情绪', color: '#ec4899', weight: `${weightsDisplay.sentiment}%`},
                        volatility: {label: '波动', color: '#06b6d4', weight: `${weightsDisplay.volatility}%`},
                      };
                      const item = labels[key];
                      return (
                        <div key={key} style={{
                          flex: '0 0 calc(33.33% - 6px)',
                          minWidth: '80px',
                          padding: '8px',
                          borderRadius: '8px',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{item.label}</span>
                            <span style={{ fontSize: 9, color: item.color, fontWeight: 600 }}>{item.weight}</span>
                          </div>
                          <div style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: value >= 70 ? '#ef4444' : value >= 50 ? '#fbbf24' : '#22c55e',
                          }}>{value}</div>
                          <div style={{
                            height: '3px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '2px',
                            marginTop: 4,
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${value}%`,
                              background: item.color,
                              borderRadius: '2px',
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 建仓建议 */}
            <Section title="🎯 建仓策略" icon={Target}>
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}>
                {/* 操作建议 */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>操作建议</div>
                  <div style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: analysis.overallScore >= 70 ? '#ef4444' : '#fbbf24',
                    marginBottom: 6,
                  }}>
                    {analysis.advice.action}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                    {analysis.advice.entryStrategy}
                  </div>
                </div>

                {/* 价格目标 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
                  <PriceBox label="目标价" value={`¥${analysis.advice.targetPrice.toFixed(2)}`} />
                  <PriceBox label="止损价" value={`¥${analysis.advice.stopLoss.toFixed(2)}`} />
                  <PriceBox label="移动止损" value={`¥${analysis.advice.trailingStop.toFixed(2)}`} />
                </div>

                {/* 分批建仓 */}
                {analysis.advice.pyramidLevels && analysis.advice.pyramidLevels.length > 0 && (
                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <Layers size={14} style={{ color: '#fbbf24' }} />
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>分批建仓位</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {analysis.advice.pyramidLevels.map((level, idx) => (
                        <div key={idx} style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '6px',
                          background: 'rgba(255,255,255,0.05)',
                          textAlign: 'center',
                        }}>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>第{idx + 1}批</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                            ¥{level.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                      建议仓位: {analysis.advice.positionSize} · 持仓周期: {analysis.advice.timeFrame}
                    </div>
                  </div>
                )}
              </div>
            </Section>

            {/* 投资逻辑 */}
            <Section title="💡 投资逻辑" icon={Activity}>
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                {/* 投资逻辑摘要 */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>核心逻辑</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
                    {analysis.thesis.summary}
                  </div>
                </div>

                {/* 催化剂 */}
                {analysis.thesis.catalysts && analysis.thesis.catalysts.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>🔥 潜在催化剂</div>
                    {analysis.thesis.catalysts.map((catalyst, idx) => (
                      <div key={idx} style={{
                        padding: '8px 12px',
                        marginBottom: 6,
                        borderRadius: '6px',
                        background: 'rgba(34, 197, 94, 0.08)',
                        border: '1px solid rgba(34, 197, 94, 0.15)',
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.7)',
                      }}>
                        {catalyst}
                      </div>
                    ))}
                  </div>
                )}

                {/* 风险因素 */}
                {analysis.thesis.risks && analysis.thesis.risks.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>⚠️ 风险因素</div>
                    {analysis.thesis.risks.map((risk, idx) => (
                      <div key={idx} style={{
                        padding: '8px 12px',
                        marginBottom: 6,
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.7)',
                      }}>
                        {risk}
                      </div>
                    ))}
                  </div>
                )}

                {/* 护城河 */}
                {analysis.thesis.moat && (
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>🏰 护城河分析</div>
                    <div style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      background: 'rgba(251, 191, 36, 0.08)',
                      border: '1px solid rgba(251, 191, 36, 0.15)',
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.7)',
                      lineHeight: 1.5,
                    }}>
                      {analysis.thesis.moat}
                    </div>
                  </div>
                )}
              </div>
            </Section>

            {/* 技术面分析 */}
            <Section title="📈 技术面" icon={TrendingUp}>
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                {stock.rsi && (
                  <TrendRow
                    label="RSI指标"
                    value={`${stock.rsi} ${stock.rsi > 70 ? '(超买)' : stock.rsi < 30 ? '(超卖)' : '(正常)'}`}
                  />
                )}
                {stock.macd && (
                  <TrendRow
                    label="MACD"
                    value={translateMACDSimple(stock.macd)}
                  />
                )}
                <TrendRow
                  label="市场趋势"
                  value={analysis.marketRegime.trend === 'bull' ? '牛市' : analysis.marketRegime.trend === 'bear' ? '熊市' : '中性'}
                />
                <TrendRow
                  label="波动率水平"
                  value={analysis.marketRegime.volatility === 'high' ? '高' : analysis.marketRegime.volatility === 'medium' ? '中' : '低'}
                />
              </div>
            </Section>

            {/* 底部留白 */}
            <div style={{ height: 80 }} />
          </div>

          {/* 底部按钮 */}
          <div style={{
            padding: '12px 16px',
            background: '#1a1b26',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            gap: 10,
          }}>
            <button
              onClick={onAddWatchlist}
              disabled={isInWatchlist}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: isInWatchlist ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                color: isInWatchlist ? 'rgba(255,255,255,0.3)' : '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: isInWatchlist ? 'not-allowed' : 'pointer',
                opacity: isInWatchlist ? 0.5 : 1,
              }}
            >
              {isInWatchlist ? '✓ 已添加' : '⭐ 加自选'}
            </button>
            <button
              onClick={() => setShowAddHoldingModal(true)}
              style={{
                flex: 2,
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Plus size={16} />
              加持仓
            </button>
          </div>
        </div>
      </div>

      {/* 加持仓弹窗 */}
      {showAddHoldingModal && (
        <div
          onClick={() => setShowAddHoldingModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '360px',
              background: '#1a1b26',
              borderRadius: '20px',
              padding: '24px',
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 20 }}>
              添加持仓
            </h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>
                股票代码
              </label>
              <input
                type="text"
                value={stock.code}
                disabled
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>
                股票名称
              </label>
              <input
                type="text"
                value={stock.name}
                disabled
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>
                成本价格
              </label>
              <input
                type="number"
                step="0.01"
                value={holdingForm.costPrice}
                onChange={(e) => setHoldingForm({ ...holdingForm, costPrice: parseFloat(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>
                持股数量
              </label>
              <input
                type="number"
                value={holdingForm.quantity}
                onChange={(e) => setHoldingForm({ ...holdingForm, quantity: parseInt(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>
                买入日期
              </label>
              <input
                type="date"
                value={holdingForm.purchaseDate}
                onChange={(e) => setHoldingForm({ ...holdingForm, purchaseDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowAddHoldingModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={handleAddHolding}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// 辅助组件
function Section({ title, icon: Icon, children }: { title: string; icon?: LucideIcon; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {Icon && <Icon size={16} style={{ color: '#fbbf24' }} />}
        <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function PriceBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      padding: '10px',
      borderRadius: '8px',
      background: 'rgba(255,255,255,0.05)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>{value}</div>
    </div>
  );
}

function TrendRow({ label, value }: { label: string; value: string }) {
  const isPositive = value.includes('上涨') || value.includes('金叉') || value.includes('看涨') || value.includes('bullish') || value.includes('牛市') || value === '正常';
  const isNegative = value.includes('下跌') || value.includes('死叉') || value.includes('看跌') || value.includes('bearish') || value.includes('熊市') || value.includes('超买') || value.includes('超卖');

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{label}</span>
      <span style={{
        fontSize: 12,
        fontWeight: 600,
        color: isPositive && !isNegative ? '#ef4444' : isNegative ? '#22c55e' : '#fff',
      }}>
        {value}
      </span>
    </div>
  );
}
