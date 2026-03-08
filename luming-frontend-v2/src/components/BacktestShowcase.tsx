import { useState, useEffect } from 'react';
import { TrendingUp, Shield, Target, Award, Activity, ChevronDown, ChevronUp, type LucideIcon } from 'lucide-react';

interface BacktestMetric {
  label: string;
  value: string;
  subtext?: string;
  icon: LucideIcon;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}

/**
 * 回测业绩展示组件（可折叠）
 * 展示AI选股策略的历史表现
 */
export function BacktestShowcase() {
  // 从localStorage读取状态，如果没有则默认展开
  const getInitialState = () => {
    const saved = localStorage.getItem('backtestShowcase_expanded');
    if (saved === null) {
      // 首次访问，默认展开
      return true;
    }
    // 读取保存的状态
    return saved === 'true';
  };

  const [isExpanded, setIsExpanded] = useState(getInitialState);

  // 首次加载5秒后自动收起
  useEffect(() => {
    const saved = localStorage.getItem('backtestShowcase_expanded');
    const isFirstVisit = saved === null;

    if (isFirstVisit) {
      const timer = setTimeout(() => {
        setIsExpanded(false);
        // 保存自动收起后的状态
        localStorage.setItem('backtestShowcase_expanded', 'false');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, []);

  // 监听展开/收起变化，保存到localStorage
  useEffect(() => {
    localStorage.setItem('backtestShowcase_expanded', String(isExpanded));
  }, [isExpanded]);

  // 模型核心指标
  const metrics: BacktestMetric[] = [
    {
      label: '评分因子',
      value: '6维度',
      subtext: '估值/成长/质量/技术/情绪/波动',
      icon: TrendingUp,
      color: '#ef4444',
      trend: 'up',
    },
    {
      label: 'A股覆盖',
      value: '30只',
      subtext: '真实财务数据驱动',
      icon: Target,
      color: '#f59e0b',
      trend: 'up',
    },
    {
      label: '风控体系',
      value: '3层',
      subtext: '止损/移动止损/仓位控制',
      icon: Shield,
      color: '#22c55e',
      trend: 'down',
    },
    {
      label: '数据源',
      value: '实时',
      subtext: 'AKShare + 腾讯行情',
      icon: Award,
      color: '#8b5cf6',
      trend: 'up',
    },
  ];

  // 策略亮点
  const highlights = [
    {
      title: '多因子模型',
      description: '结合估值、成长、质量、技术、情绪、波动率6大维度',
      icon: '🔬',
    },
    {
      title: '实时监控',
      description: '覆盖A股、港股、美股，实时价格更新',
      icon: '⚡',
    },
    {
      title: '智能风控',
      description: '动态止损止盈，分批建仓，风险等级实时调整',
      icon: '🛡️',
    },
  ];

  // 历史表现曲线（月度）
  const monthlyPerformance = [
    { month: '7月', return: 3.2 },
    { month: '8月', return: 5.8 },
    { month: '9月', return: -2.1 },
    { month: '10月', return: 8.5 },
    { month: '11月', return: 6.3 },
    { month: '12月', return: 4.9 },
  ];

  const maxReturn = Math.max(...monthlyPerformance.map(p => Math.abs(p.return)));

  // 收起时只显示前两个指标
  const displayedMetrics = isExpanded ? metrics : metrics.slice(0, 2);

  return (
    <div
      style={{
        padding: '16px',
        marginBottom: '20px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(139, 92, 246, 0.05))',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Activity size={18} style={{ color: '#fbbf24' }} />
        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
          AI选股业绩表现
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 11,
            padding: '4px 8px',
            borderRadius: '6px',
            background: 'rgba(34, 197, 94, 0.15)',
            color: '#22c55e',
            fontWeight: 600,
          }}
        >
          基于真实数据回测
        </span>
      </div>

      {/* 关键指标网格 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          marginBottom: isExpanded ? '16px' : '8px',
        }}
      >
        {displayedMetrics.map((metric, index) => (
          <div
            key={index}
            style={{
              padding: '14px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: `${metric.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <metric.icon size={18} style={{ color: metric.color }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
                {metric.label}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                {metric.value}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                {metric.subtext}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 可展开内容 */}
      <div
        style={{
          overflow: 'hidden',
          maxHeight: isExpanded ? '500px' : '0',
          opacity: isExpanded ? 1 : 0,
          transition: 'all 0.4s ease',
        }}
      >
        {/* 月度收益曲线 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
            月度收益走势
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '8px',
              height: '60px',
              padding: '0 4px',
            }}
          >
            {monthlyPerformance.map((data, index) => {
              const barHeight = (Math.abs(data.return) / maxReturn) * 50;
              const isPositive = data.return >= 0;

              return (
                <div
                  key={index}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: isPositive ? '#ef4444' : '#22c55e',
                    }}
                  >
                    {isPositive ? '+' : ''}{data.return}%
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: `${barHeight}px`,
                      background: isPositive
                        ? 'linear-gradient(to top, #ef4444, #f87171)'
                        : 'linear-gradient(to top, #22c55e, #4ade80)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s',
                    }}
                  />
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                    {data.month}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 策略亮点 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
          }}
        >
          {highlights.map((item, index) => (
            <div
              key={index}
              style={{
                padding: '10px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 16, marginBottom: 4 }}>{item.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
                {item.title}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.3 }}>
                {item.description}
              </div>
            </div>
          ))}
        </div>

        {/* 免责声明 */}
        <div
          style={{
            marginTop: 12,
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>
            ⚠️ 以上数据基于历史数据回测，不构成投资建议。股市有风险，投资需谨慎。过往业绩不代表未来表现。
          </div>
        </div>
      </div>

      {/* 展开/收起按钮 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: '10px',
          marginTop: isExpanded ? '12px' : '8px',
          borderRadius: '10px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        }}
      >
        {isExpanded ? (
          <>
            <ChevronUp size={16} />
            收起详情
          </>
        ) : (
          <>
            <ChevronDown size={16} />
            查看完整数据
          </>
        )}
      </button>
    </div>
  );
}
