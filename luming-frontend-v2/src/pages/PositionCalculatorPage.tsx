/**
 * 智能仓位计算器页面
 * 根据用户输入的资金总额，智能推荐仓位配置
 */
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PieChart } from '../components/charts/PieChart';
import { Target, Sparkles, RefreshCw, ArrowLeft } from 'lucide-react';

interface RiskProfile {
  name: string;
  description: string;
  stockRatio: number;  // 股票占比
  etfRatio: number;    // ETF占比
  cashRatio: number;   // 现金占比
}

interface AllocationPlan {
  category: string;
  items: {
    name: string;
    code: string;
    ratio: number;
    suggestedAmount: number;
  }[];
}

const RISK_PROFILES: Record<string, RiskProfile> = {
  conservative: {
    name: '保守型',
    description: '追求稳健收益，可承受小幅波动',
    stockRatio: 0.30,
    etfRatio: 0.50,
    cashRatio: 0.20,
  },
  balanced: {
    name: '平衡型',
    description: '平衡收益与风险，可承受中等波动',
    stockRatio: 0.50,
    etfRatio: 0.35,
    cashRatio: 0.15,
  },
  aggressive: {
    name: '进取型',
    description: '追求较高收益，可承受较大波动',
    stockRatio: 0.70,
    etfRatio: 0.20,
    cashRatio: 0.10,
  },
};

export function PositionCalculatorPage() {
  const [totalCapital, setTotalCapital] = useState('50000');
  const [riskProfile, setRiskProfile] = useState<keyof typeof RISK_PROFILES>('balanced');
  const [showResult, setShowResult] = useState(false);

  const capital = parseFloat(totalCapital) || 0;

  // 计算配置方案
  const allocationPlan = useMemo((): AllocationPlan[] => {
    const profile = RISK_PROFILES[riskProfile];
    const plans: AllocationPlan[] = [];

    // 核心宽基ETF
    const etfAmount = capital * profile.etfRatio;
    plans.push({
      category: '🛡️ 核心宽基ETF',
      items: [
        {
          name: '沪深300ETF',
          code: '510300',
          ratio: 0.5,
          suggestedAmount: etfAmount * 0.5,
        },
        {
          name: '中证500ETF',
          code: '510500',
          ratio: 0.3,
          suggestedAmount: etfAmount * 0.3,
        },
        {
          name: '创业板ETF',
          code: '159915',
          ratio: 0.2,
          suggestedAmount: etfAmount * 0.2,
        },
      ],
    });

    // 行业ETF（根据风险偏好调整）
    const sectorEtfRatio = profile.stockRatio * 0.3;
    plans.push({
      category: '📈 行业主题ETF',
      items: [
        {
          name: '新能源车ETF',
          code: '515030',
          ratio: 0.3,
          suggestedAmount: capital * sectorEtfRatio * 0.3,
        },
        {
          name: '医疗ETF',
          code: '512760',
          ratio: 0.3,
          suggestedAmount: capital * sectorEtfRatio * 0.3,
        },
        {
          name: '芯片ETF',
          code: '159995',
          ratio: 0.2,
          suggestedAmount: capital * sectorEtfRatio * 0.2,
        },
        {
          name: '红利ETF',
          code: '515080',
          ratio: 0.2,
          suggestedAmount: capital * sectorEtfRatio * 0.2,
        },
      ],
    });

    // 个股配置
    const stockAmount = capital * profile.stockRatio * 0.7;
    plans.push({
      category: '💎 高质量个股',
      items: [
        {
          name: '贵州茅台',
          code: '600519',
          ratio: 0.2,
          suggestedAmount: stockAmount * 0.25,
        },
        {
          name: '五粮液',
          code: '000858',
          ratio: 0.15,
          suggestedAmount: stockAmount * 0.2,
        },
        {
          name: '宁德时代',
          code: '300750',
          ratio: 0.15,
          suggestedAmount: stockAmount * 0.2,
        },
        {
          name: '招商银行',
          code: '600036',
          ratio: 0.15,
          suggestedAmount: stockAmount * 0.15,
        },
        {
          name: '中国平安',
          code: '601318',
          ratio: 0.1,
          suggestedAmount: stockAmount * 0.1,
        },
      ],
    });

    // 现金储备
    plans.push({
      category: '💰 现金储备',
      items: [
        {
          name: '可用现金（观望/补仓）',
          code: 'CASH',
          ratio: profile.cashRatio,
          suggestedAmount: capital * profile.cashRatio,
        },
      ],
    });

    return plans;
  }, [capital, riskProfile]);

  // 饼图数据
  const pieData = useMemo(() => {
    const profile = RISK_PROFILES[riskProfile];
    return [
      {
        label: '宽基ETF',
        value: capital * profile.etfRatio,
        color: '#6366f1',
      },
      {
        label: '行业ETF',
        value: capital * profile.stockRatio * 0.3,
        color: '#8b5cf6',
      },
      {
        label: '个股',
        value: capital * profile.stockRatio * 0.7,
        color: '#ec4899',
      },
      {
        label: '现金',
        value: capital * profile.cashRatio,
        color: '#22c55e',
      },
    ];
  }, [capital, riskProfile]);

  const handleCalculate = () => {
    if (capital < 1000) {
      alert('资金金额不能少于1000元');
      return;
    }
    setShowResult(true);
  };

  const handleQuickSet = (amount: number) => {
    setTotalCapital(amount.toString());
    setShowResult(false);
  };

  return (
    <div style={{ padding: '16px', color: '#fff' }}>
      {/* 返回按钮 */}
      <Link
        to="/simulate"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          borderRadius: '8px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.7)',
          fontSize: 13,
          textDecoration: 'none',
          marginBottom: 16,
          cursor: 'pointer',
        }}
      >
        <ArrowLeft size={16} />
        返回模拟持仓
      </Link>

      {/* 标题 */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Target size={28} color="#f59e0b" />
          智能仓位计算器
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
          根据您的资金规模和风险偏好，为您推荐最优仓位配置
        </p>
      </div>

      {/* 资金输入 */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 12, display: 'block' }}>
          💵 输入您的投资总金额
        </label>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 18,
            fontWeight: 600,
            color: '#fbbf24',
          }}>
            ¥
          </span>
          <input
            type="number"
            value={totalCapital}
            onChange={(e) => setTotalCapital(e.target.value)}
            placeholder="50000"
            style={{
              width: '100%',
              padding: '16px 16px 16px 48px',
              fontSize: 20,
              fontWeight: 700,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.05)',
              border: '2px solid rgba(255,255,255,0.1)',
              color: '#fff',
              outline: 'none',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#f59e0b'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        {/* 快捷金额 */}
        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[10000, 30000, 50000, 100000, 200000].map((amount) => (
            <button
              key={amount}
              onClick={() => handleQuickSet(amount)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: totalCapital === amount.toString() ? '#f59e0b' : 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: totalCapital === amount.toString() ? '#fff' : 'rgba(255,255,255,0.6)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {(amount / 10000).toFixed(0)}万
            </button>
          ))}
        </div>
      </div>

      {/* 风险偏好选择 */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 12, display: 'block' }}>
          🎯 选择您的风险偏好
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(Object.entries(RISK_PROFILES) as [string, RiskProfile][]).map(([key, profile]) => (
            <button
              key={key}
              onClick={() => setRiskProfile(key as keyof typeof RISK_PROFILES)}
              style={{
                padding: '16px',
                borderRadius: 12,
                background: riskProfile === key ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.03)',
                border: riskProfile === key ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{profile.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{profile.description}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
                股票{Math.round(profile.stockRatio * 100)}% · ETF{Math.round(profile.etfRatio * 100)}% · 现金{Math.round(profile.cashRatio * 100)}%
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 计算按钮 */}
      <button
        onClick={handleCalculate}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: 12,
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
          border: 'none',
          color: '#fff',
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Sparkles size={20} />
        生成仓位配置方案
      </button>

      {/* 计算结果 */}
      {showResult && (
        <div>
          {/* 配置总览 */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(239, 68, 68, 0.1))',
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px 0' }}>
              📊 配置总览 · ¥{capital.toFixed(0)}
            </h2>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <PieChart data={pieData} size={140} />
            </div>
          </div>

          {/* 详细配置 */}
          {allocationPlan.map((plan) => (
            <div
              key={plan.category}
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px 0' }}>
                {plan.category}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {plan.items.map((item) => (
                  <div
                    key={item.code}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                        {item.code}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                        {(item.ratio * 100).toFixed(0)}%
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#fbbf24' }}>
                        ¥{item.suggestedAmount.toFixed(0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* 操作建议 */}
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            borderRadius: 12,
            padding: 16,
            border: '1px solid rgba(34, 197, 94, 0.2)',
            marginTop: 16,
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px 0', color: '#22c55e' }}>
              💡 操作建议
            </h3>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
              <li>分批建仓：首次建仓50%，剩余分2-3次入场</li>
              <li>定期检查：每月复盘一次，根据市场调整</li>
              <li>止盈止损：单只股票亏损10%考虑减仓</li>
              <li>现金管理：保留现金用于逢低加仓</li>
            </ul>
          </div>

          {/* 重新计算 */}
          <button
            onClick={() => {
              setShowResult(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <RefreshCw size={16} />
            重新计算
          </button>
        </div>
      )}
    </div>
  );
}
