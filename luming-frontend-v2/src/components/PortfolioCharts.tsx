import { useMemo, useState, useEffect } from 'react';
import { LineChart } from './charts/LineChart';
import { PieChart } from './charts/PieChart';
import { BarChart3, Coins, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import type { HoldingAnalysis } from '../types';
import { profitHistoryService } from '../services/profitHistoryService';

interface PortfolioChartsProps {
  holdings: HoldingAnalysis[];
  days?: number;  // 显示天数，默认7天
}

/**
 * 持仓数据分析图表组件
 * 包含收益曲线和资产配置饼图
 */
export function PortfolioCharts({ holdings, days = 7 }: PortfolioChartsProps) {
  const [historyDays, setHistoryDays] = useState<number>(days);
  const [chartData, setChartData] = useState<Array<{ date: string; value: number }>>([]);

  // 从服务加载真实历史数据
  useEffect(() => {
    const loadData = () => {
      const data = profitHistoryService.getChartData(historyDays);

      // 如果没有历史数据但有持仓，使用当前值创建初始点
      if (data.length === 0 && holdings.length > 0) {
        const totalValue = holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
        setChartData([{
          date: '今天',
          value: totalValue,
        }]);
      } else {
        setChartData(data);
      }
    };

    loadData();
  }, [holdings, historyDays]);

  // 当前总价值（用于显示最新状态）
  const currentTotalValue = useMemo(() => {
    return holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
  }, [holdings]);

  // 资产配置数据
  const allocationData = useMemo(() => {
    const allocation = new Map<string, number>();

    holdings.forEach((h) => {
      const market =
        h.market === 'SH' || h.market === 'SZ'
          ? 'A股'
          : h.market === 'HK'
          ? '港股'
          : h.market === 'US'
          ? '美股'
          : '基金';

      allocation.set(
        market,
        (allocation.get(market) || 0) + (h.currentValue || 0)
      );
    });

    const colors = {
      A股: '#f59e0b',
      港股: '#8b5cf6',
      美股: '#ec4899',
      基金: '#22c55e',
    };

    return Array.from(allocation.entries()).map(([label, value]) => ({
      label,
      value,
      color: colors[label as keyof typeof colors] || '#6366f1',
    }));
  }, [holdings]);

  // 统计数据
  const stats = useMemo(() => {
    const totalValue = holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
    const totalCost = holdings.reduce((sum, h) => sum + (h.costValue || 0), 0);
    const totalProfit = totalValue - totalCost;
    const totalProfitPct = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    const profitableCount = holdings.filter((h) => (h.profit || 0) >= 0).length;
    const winRate = holdings.length > 0 ? (profitableCount / holdings.length) * 100 : 0;

    const bestStock = holdings.reduce((best, h) =>
      (h.profit || 0) > (best?.profit || 0) ? h : best || null
    );

    const worstStock = holdings.reduce((worst, h) =>
      (h.profit || 0) < (worst?.profit || 0) ? h : worst || null
    );

    return {
      totalValue,
      totalCost,
      totalProfit,
      totalProfitPct,
      winRate,
      bestStock,
      worstStock,
    };
  }, [holdings]);

  // 计算收益率
  const profitMetrics = useMemo(() => {
    if (chartData.length < 2) {
      const currentValue = holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
      const costValue = holdings.reduce((sum, h) => sum + (h.costValue || 0), 0);
      const profit = currentValue - costValue;
      const profitPct = costValue > 0 ? (profit / costValue) * 100 : 0;
      return { profit, profitPct, startValue: costValue, endValue: currentValue };
    }

    const startValue = chartData[0].value;
    const endValue = chartData[chartData.length - 1].value;
    const profit = endValue - startValue;
    const profitPct = startValue > 0 ? (profit / startValue) * 100 : 0;

    return { profit, profitPct, startValue, endValue };
  }, [chartData, holdings]);

  if (holdings.length === 0) {
    return null;
  }

  const isPositive = profitMetrics.profitPct >= 0;

  return (
    <div
      style={{
        padding: '16px',
        marginBottom: '20px',
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <h3
        style={{
          fontSize: 16,
          fontWeight: 700,
          marginBottom: 16,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <BarChart3 size={18} style={{ marginRight: 8 }} />
          投资组合分析
        </div>

        {/* 时间周期选择 */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setHistoryDays(d)}
              style={{
                padding: '4px 10px',
                fontSize: 11,
                borderRadius: '6px',
                background: historyDays === d
                  ? 'rgba(245, 158, 11, 0.2)'
                  : 'rgba(255, 255, 255, 0.05)',
                color: historyDays === d
                  ? '#f59e0b'
                  : 'rgba(255, 255, 255, 0.5)',
                border: historyDays === d
                  ? '1px solid rgba(245, 158, 11, 0.3)'
                  : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {d}天
            </button>
          ))}
        </div>
      </h3>

      {/* 收益曲线 */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#fff',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Coins size={16} style={{ marginRight: 6 }} />
            收益走势
          </div>

          {/* 期间收益率 */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {isPositive ? (
              <TrendingUp size={14} color="#ef4444" style={{ marginRight: 4 }} />
            ) : (
              <TrendingDown size={14} color="#22c55e" style={{ marginRight: 4 }} />
            )}
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: isPositive ? '#ef4444' : '#22c55e',
              }}
            >
              {isPositive ? '+' : ''}{profitMetrics.profitPct.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* 数据点数量提示 */}
        {chartData.length > 0 && (
          <div style={{ marginBottom: 8, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
            <Calendar size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            {chartData.length} 个数据点
            {chartData.length < 3 && ' · 数据积累中，持续记录持仓变化后将显示完整曲线'}
          </div>
        )}

        <LineChart
          data={chartData.length > 0 ? chartData : [{ date: '今天', value: currentTotalValue }]}
          color={isPositive ? '#ef4444' : '#22c55e'}
        />
      </div>

      {/* 资产配置 */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#fff',
            marginBottom: 12,
          }}
        >
          🌐 资产配置
        </div>
        <PieChart data={allocationData} size={120} />
      </div>

      {/* 关键指标 */}
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#fff',
            marginBottom: 12,
          }}
        >
          📈 关键指标
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
          }}
        >
          <div
            style={{
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
              盈利股票
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
              {stats.winRate.toFixed(0)}%
            </div>
          </div>

          <div
            style={{
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
              最大盈利
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#ef4444',
                wordBreak: 'break-all',
              }}
            >
              {stats.bestStock?.name || '-'}
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>
                +¥{(stats.bestStock?.profit || 0).toFixed(2)}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
              最大亏损
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#22c55e',
                wordBreak: 'break-all',
              }}
            >
              {stats.worstStock?.name || '-'}
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>
                ¥{(stats.worstStock?.profit || 0).toFixed(2)}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
              总资产
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fbbf24' }}>
              ¥{stats.totalValue.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* 风险提示 */}
      <div
        style={{
          marginTop: 12,
          padding: '8px 12px',
          borderRadius: '6px',
          background: 'rgba(245, 158, 11, 0.05)',
          border: '1px solid rgba(245, 158, 11, 0.1)',
        }}
      >
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>
          💡 以上数据仅供参考，实际收益可能因市场波动而有所不同。建议定期调整仓位，分散投资风险。
        </div>
      </div>
    </div>
  );
}
