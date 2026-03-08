import { useState } from 'react';
import { useMembership } from '../hooks/useMembership';
import { Crown, CheckCircle, Zap, Shield, TrendingUp, Brain, RotateCcw, Gift, MessageSquare } from 'lucide-react';
import { FeedbackModal } from '../components/FeedbackModal';
import type { FeedbackData } from '../components/FeedbackModal';

export function MemberPage() {
  const { membershipLevel, dailyRemainingViews, dailyLimit, isTrial, trialDaysRemaining, trialExpired, startTrial } = useMembership();
  const [showFeedback, setShowFeedback] = useState(false);

  const isPremium = membershipLevel === 'premium';
  const hasPremiumAccess = isPremium || isTrial;

  // 30天免费活动（仅在注册后第一次显示，之后不再显示）
  const showFreeActivity = !localStorage.getItem('lm_free_activity_shown');

  // 关闭活动提示后标记已显示
  const handleCloseActivity = () => {
    localStorage.setItem('lm_free_activity_shown', 'true');
    window.location.reload();
  };

  const handleResetDailyViews = () => {
    if (confirm('确定要重置今日查看次数吗？（测试功能）')) {
      localStorage.removeItem('lm_daily_views');
      localStorage.removeItem('lm_daily_date');
      window.location.reload();
    }
  };

  const handleStartTrial = () => {
    startTrial();
    window.location.reload();
  };

  const handleSubmitFeedback = (feedback: FeedbackData) => {
    // TODO: 发送反馈到后端
    console.log('用户反馈:', feedback);
    // 临时存储到localStorage
    const feedbacks = JSON.parse(localStorage.getItem('lm_feedbacks') || '[]');
    feedbacks.push({
      ...feedback,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('lm_feedbacks', JSON.stringify(feedbacks));
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* 30天免费活动横幅（仅显示一次） */}
      {showFreeActivity && (
        <div
          style={{
            padding: '20px',
            borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(59, 130, 246, 0.15))',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            marginBottom: 20,
            position: 'relative',
          }}
        >
          <button
            onClick={handleCloseActivity}
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              fontSize: 20,
            }}
          >
            ×
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #22c55e, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}>
              🎉
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>
                限时福利：30天完全免费
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                即日起至2026年4月3日
              </div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 16, lineHeight: 1.6 }}>
            ✅ AI智能选股 - 全市场覆盖<br/>
            ✅ 模拟交易 - 完整功能<br/>
            ✅ 数据分析 - 实时更新<br/>
            ✅ 持仓诊断 - 深度分析<br/>
            <br/>
            🎁 <strong>现在注册，所有功能完全免费使用30天！</strong><br/>
            💡 30天后：免费版基础功能继续可用
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
            点击右上角×关闭此提示
          </div>
        </div>
      )}

      {/* 7天试用横幅（已隐藏，统一用30天免费活动） */}
      {!isPremium && !isTrial && !trialExpired && (
        <div
          style={{
            padding: '20px',
            borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 146, 60, 0.08))',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            marginBottom: 20,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.1 }}>
            <Gift size={100} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <Gift size={32} style={{ color: '#fbbf24' }} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fbbf24' }}>
                首批用户福利
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                7天专业版免费体验
              </div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 16, lineHeight: 1.6 }}>
            ✅ 无限次查看股票详情<br/>
            ✅ AI持仓智能诊断<br/>
            ✅ 实时买卖时机提醒<br/>
            ✅ 模拟交易功能
          </div>
          <button
            onClick={handleStartTrial}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #fbbf24, #f97316)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Gift size={18} />
            立即开启7天试用
          </button>
        </div>
      )}

      {/* 试用中状态 */}
      {isTrial && (
        <div
          style={{
            padding: '16px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.08))',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Gift size={24} style={{ color: '#22c55e' }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#22c55e' }}>
                  试用中
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                  享受专业版全部功能
                </div>
              </div>
            </div>
            <div style={{
              padding: '6px 12px',
              borderRadius: 20,
              background: 'rgba(34, 197, 94, 0.2)',
              color: '#22c55e',
              fontSize: 13,
              fontWeight: 600,
            }}>
              还剩 {trialDaysRemaining} 天
            </div>
          </div>
        </div>
      )}

      {/* 意见反馈入口 */}
      <button
        onClick={() => setShowFeedback(true)}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 12,
          border: '1px dashed rgba(251, 191, 36, 0.4)',
          background: 'rgba(251, 191, 36, 0.08)',
          color: '#fbbf24',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 20,
        }}
      >
        <MessageSquare size={18} />
        告诉我们您的想法和建议
      </button>

      {/* 30天免费活动状态 */}
      <div
        style={{
          padding: '24px',
          borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(59, 130, 246, 0.15))',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #22c55e, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
          }}>
            🎁
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
              当前活动状态
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#22c55e' }}>
              30天免费体验中
            </div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
          所有功能完全开放，无需升级会员<br/>
          活动结束后，免费版基础功能继续可用
        </div>
      </div>

      {/* 原会员状态卡片已隐藏 */}
      <div
        style={{
          padding: '24px',
          borderRadius: 16,
          background: hasPremiumAccess
            ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 146, 60, 0.08))'
            : 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.05))',
          border: hasPremiumAccess
            ? '1px solid rgba(251, 191, 36, 0.3)'
            : '1px solid rgba(99, 102, 241, 0.2)',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          {hasPremiumAccess ? (
            <Crown size={32} style={{ color: '#fbbf24' }} />
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              👤
            </div>
          )}
          <div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
              当前会员
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: hasPremiumAccess ? '#fbbf24' : '#fff' }}>
              {isTrial ? '试用用户' : isPremium ? '黄金会员' : '免费用户'}
            </div>
          </div>
        </div>
        {!isPremium && (
          <div
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.5)',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '8px 12px',
              borderRadius: 8,
              display: 'inline-block',
            }}
          >
            今日剩余查看次数: {dailyRemainingViews}/{dailyLimit}
          </div>
        )}
      </div>

      {/* 测试功能卡片（已隐藏30天） */}
      {/* eslint-disable-next-line no-constant-binary-expression */}
      {false && (
        <div
          style={{
            padding: '16px',
            borderRadius: 12,
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.15)',
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 12, color: '#a5b4fc', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={14} />
            测试功能
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={handleResetDailyViews}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid rgba(99, 102, 241, 0.3)',
                background: 'rgba(99, 102, 241, 0.1)',
                color: '#a5b4fc',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={14} />
              重置今日查看次数
            </button>
          </div>
        </div>
      )}

      {/* 当前可用功能（所有功能免费） */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#fff' }}>当前可用功能</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { feature: '查看股票推荐', desc: '无限次查看，A股/港股/美股全覆盖', icon: Zap },
            { feature: '交易信号', desc: '实时买卖时机提醒', icon: TrendingUp },
            { feature: 'AI持仓诊断', desc: '深度分析持仓组合', icon: Brain },
            { feature: '模拟交易', desc: '完整的模拟盘功能', icon: Shield },
          ].map((item, index) => (
            <div
              key={index}
              style={{
                padding: '14px 16px',
                borderRadius: 10,
                background: 'rgba(34, 197, 94, 0.05)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <item.icon size={20} style={{ color: '#22c55e', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
                  {item.feature}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                  {item.desc}
                </div>
              </div>
              <CheckCircle size={20} style={{ color: '#22c55e' }} />
            </div>
          ))}
        </div>
      </div>

      {/* 活动说明 */}
      <div
        style={{
          padding: '24px',
          borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.05))',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          textAlign: 'center',
        }}
      >
        <Gift size={40} style={{ color: '#3b82f6', marginBottom: 12 }} />
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#fff' }}>
          30天免费体验
        </h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
          所有功能完全开放，无需升级会员<br/>
          体验期结束后，基础功能继续免费使用
        </p>
      </div>

      {/* 意见反馈弹窗 */}
      {showFeedback && (
        <FeedbackModal
          onClose={() => setShowFeedback(false)}
          onSubmit={handleSubmitFeedback}
        />
      )}
    </div>
  );
}
