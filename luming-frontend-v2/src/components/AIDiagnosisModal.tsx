import { Sparkles, TrendingUp, AlertTriangle, CheckCircle, Target, Shield } from 'lucide-react';
import type { HoldingAnalysis } from '../types';

interface AIDiagnosisModalProps {
  holdings: HoldingAnalysis[];
  totalStats: {
    totalValue: number;
    totalProfit: number;
    totalProfitPct: number;
  };
  onClose: () => void;
}

export const AIDiagnosisModal: React.FC<AIDiagnosisModalProps> = ({ holdings, totalStats, onClose }) => {
  // 计算诊断结果
  const generateDiagnosis = () => {
    const totalValue = totalStats.totalValue;
    const profitPct = totalStats.totalProfitPct;

    // 计算持仓集中度
    const maxPosition = Math.max(...holdings.map(h => h.currentValue || 0));
    const concentration = maxPosition / totalValue;

    // 计算盈利/亏损持仓数
    const profitCount = holdings.filter(h => (h.profitPct || 0) > 0).length;
    const lossCount = holdings.filter(h => (h.profitPct || 0) < 0).length;

    // 计算平均持仓时间
    const avgHoldingDays = holdings.reduce((sum, h) => {
      const days = Math.floor((Date.now() - new Date(h.purchaseDate).getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0) / holdings.length;

    // 综合评分
    let healthScore = 70; // 基础分

    // 收益率评分
    if (profitPct > 20) healthScore += 15;
    else if (profitPct > 10) healthScore += 10;
    else if (profitPct > 0) healthScore += 5;
    else if (profitPct < -10) healthScore -= 15;
    else if (profitPct < -5) healthScore -= 10;

    // 集中度评分
    if (concentration > 0.5) healthScore -= 15; // 过于集中
    else if (concentration < 0.2) healthScore += 5; // 分散良好

    // 持仓数量评分
    if (holdings.length < 3) healthScore -= 10;
    else if (holdings.length >= 5 && holdings.length <= 10) healthScore += 5;

    healthScore = Math.max(0, Math.min(100, healthScore));

    // 生成建议
    const suggestions: string[] = [];

    if (concentration > 0.5) {
      suggestions.push('单一持仓占比过高，建议适当分散降低风险');
    }
    if (lossCount > profitCount) {
      suggestions.push('亏损持仓较多，建议审视持仓逻辑，考虑止损');
    }
    if (profitPct < 0 && avgHoldingDays > 180) {
      suggestions.push('长期亏损建议评估基本面变化，及时调整');
    }
    if (profitPct > 15 && avgHoldingDays < 30) {
      suggestions.push('短期涨幅较大，可适当止盈锁定收益');
    }
    if (holdings.length < 3) {
      suggestions.push('持仓数量较少，建议适当分散配置');
    }
    if (suggestions.length === 0) {
      suggestions.push('当前持仓整体健康，继续保持稳健投资策略');
    }

    return {
      healthScore,
      concentration,
      profitCount,
      lossCount,
      avgHoldingDays,
      suggestions,
    };
  };

  const diagnosis = generateDiagnosis();

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 420,
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          padding: '24px',
          borderRadius: 20,
          background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.98), rgba(20, 20, 30, 0.98))',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={24} style={{ color: '#fbbf24' }} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>AI智能诊断</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>基于量化模型的多维度分析</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: 8,
              border: 'none',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'rgba(255, 255, 255, 0.4)',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* 健康度评分 */}
        <div style={{ marginBottom: 20, padding: '16px', borderRadius: 14, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>持仓健康度</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: diagnosis.healthScore >= 70 ? '#ef4444' : diagnosis.healthScore >= 50 ? '#f59e0b' : '#22c55e' }}>
                {diagnosis.healthScore}
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>/100</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>综合评级</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: diagnosis.healthScore >= 70 ? '#ef4444' : diagnosis.healthScore >= 50 ? '#f59e0b' : '#22c55e' }}>
                {diagnosis.healthScore >= 80 ? '优秀' : diagnosis.healthScore >= 60 ? '良好' : diagnosis.healthScore >= 40 ? '一般' : '需关注'}
              </div>
            </div>
          </div>
        </div>

        {/* 诊断指标 */}
        <div style={{ marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ padding: '12px', borderRadius: 12, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Target size={14} style={{ color: '#818cf8' }} />
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>最大持仓占比</div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{(diagnosis.concentration * 100).toFixed(1)}%</div>
          </div>
          <div style={{ padding: '12px', borderRadius: 12, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Shield size={14} style={{ color: '#818cf8' }} />
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>平均持仓天数</div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{Math.round(diagnosis.avgHoldingDays)}天</div>
          </div>
          <div style={{ padding: '12px', borderRadius: 12, background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <TrendingUp size={14} style={{ color: '#22c55e' }} />
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>盈利持仓</div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>{diagnosis.profitCount}只</div>
          </div>
          <div style={{ padding: '12px', borderRadius: 12, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <AlertTriangle size={14} style={{ color: '#ef4444' }} />
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>亏损持仓</div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>{diagnosis.lossCount}只</div>
          </div>
        </div>

        {/* 操作建议 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <CheckCircle size={16} style={{ color: '#fbbf24' }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>AI操作建议</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {diagnosis.suggestions.map((suggestion, index) => (
              <div
                key={index}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  lineHeight: 1.6,
                  color: 'rgba(255,255,255,0.7)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  gap: 8,
                }}
              >
                <span style={{ color: '#fbbf24', fontWeight: 600 }}>{index + 1}.</span>
                <span>{suggestion}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 风险提示 */}
        <div style={{ padding: '12px', borderRadius: 10, background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.15)' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>⚠️ 免责声明</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
            AI诊断仅供参考，不构成投资建议。投资有风险，决策需谨慎。
          </div>
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: 16,
            padding: '14px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
          }}
        >
          知道了
        </button>
      </div>
    </div>
  );
};
