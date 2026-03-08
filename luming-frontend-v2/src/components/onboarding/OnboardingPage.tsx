import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Shield, Zap, ChevronRight, Rocket } from 'lucide-react';
import { useOnboarding } from '../../hooks/useOnboarding';
import type { ExperienceLevel, RiskTolerance } from '../../types';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { completeOnboarding } = useOnboarding();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<{
    experience?: ExperienceLevel;
    riskTolerance?: RiskTolerance;
  }>({});

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    completeOnboarding({
      experience: profile.experience || 'beginner',
      riskTolerance: profile.riskTolerance || 'moderate',
    });
    navigate('/discover');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'linear-gradient(135deg, #0a0b0f 0%, #1a1b26 100%)',
      }}
    >
      <div
        style={{
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '40px',
          }}
        >
          <img
            src="/logo.png"
            alt="鹿鸣智投"
            style={{ width: '40px', height: '40px', objectFit: 'contain' }}
          />
          <span
            style={{
              fontSize: 28,
              fontWeight: 800,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            鹿鸣智投
          </span>
        </div>

        {/* Progress */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            marginBottom: '32px',
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: '32px',
                height: '4px',
                borderRadius: '2px',
                background: i <= step ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)',
              }}
            />
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: '20px' }}>🎯</div>
            <h2
              style={{
                fontSize: 26,
                fontWeight: 800,
                marginBottom: '16px',
                color: '#fff',
              }}
            >
              AI智能选股，让投资更简单
            </h2>
            <p
              style={{
                fontSize: 15,
                color: 'rgba(255, 255, 255, 0.6)',
                lineHeight: 1.6,
                marginBottom: '32px',
              }}
            >
              实时监控A股、港股、美股市场
              <br />
              AI多因子模型帮你发现最佳投资机会
            </p>

            <div
              style={{
                display: 'grid',
                gap: '16px',
                textAlign: 'left',
                marginBottom: '32px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                <TrendingUp size={20} style={{ color: '#ef4444' }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                    AI多因子评分
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.4)' }}>
                    5大维度综合分析，精准识别优质标的
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                }}
              >
                <Shield size={20} style={{ color: '#f59e0b' }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                    实时价格监控
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.4)' }}>
                    直连交易所数据，毫秒级价格更新
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
              >
                <Zap size={20} style={{ color: '#8b5cf6' }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                    买卖时机提醒
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.4)' }}>
                    技术指标智能解读，把握最佳入场点
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Experience */}
        {step === 2 && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                marginBottom: '8px',
                color: '#fff',
              }}
            >
              你的投资经验是？
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: '20px' }}>
              选择最符合你的情况，我们将为你推荐合适的投资策略
            </p>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <button
                onClick={() => setProfile({ ...profile, experience: 'beginner' })}
                style={{
                  padding: '18px',
                  borderRadius: '14px',
                  border: `2px solid ${profile.experience === 'beginner' ? '#f59e0b' : 'rgba(255, 255, 255, 0.08)'}`,
                  background: profile.experience === 'beginner'
                    ? 'rgba(245, 158, 11, 0.1)'
                    : 'rgba(255, 255, 255, 0.03)',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>🌱 投资新手</span>
                  <span style={{ fontSize: 12, opacity: 0.6 }}>投资经验 &lt; 1年</span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: '6px', fontWeight: 400 }}>
                  建议从稳健型股票开始，年化收益目标 8-15%
                </div>
              </button>
              <button
                onClick={() => setProfile({ ...profile, experience: 'intermediate' })}
                style={{
                  padding: '18px',
                  borderRadius: '14px',
                  border: `2px solid ${profile.experience === 'intermediate' ? '#f59e0b' : 'rgba(255, 255, 255, 0.08)'}`,
                  background: profile.experience === 'intermediate'
                    ? 'rgba(245, 158, 11, 0.1)'
                    : 'rgba(255, 255, 255, 0.03)',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>📈 有一定经验</span>
                  <span style={{ fontSize: 12, opacity: 0.6 }}>投资经验 1-3年</span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: '6px', fontWeight: 400 }}>
                  可尝试成长股，年化收益目标 15-25%
                </div>
              </button>
              <button
                onClick={() => setProfile({ ...profile, experience: 'expert' })}
                style={{
                  padding: '18px',
                  borderRadius: '14px',
                  border: `2px solid ${profile.experience === 'expert' ? '#f59e0b' : 'rgba(255, 255, 255, 0.08)'}`,
                  background: profile.experience === 'expert'
                    ? 'rgba(245, 158, 11, 0.1)'
                    : 'rgba(255, 255, 255, 0.03)',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>💼 投资专家</span>
                  <span style={{ fontSize: 12, opacity: 0.6 }}>投资经验 &gt; 3年</span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: '6px', fontWeight: 400 }}>
                  深度分析+灵活配置，年化收益目标 25%+
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Risk */}
        {step === 3 && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                marginBottom: '8px',
                color: '#fff',
              }}
            >
              你的风险偏好是？
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: '20px' }}>
              根据你的风险承受能力选择合适的投资风格
            </p>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <button
                onClick={() => setProfile({ ...profile, riskTolerance: 'conservative' })}
                style={{
                  padding: '18px',
                  borderRadius: '14px',
                  border: `2px solid ${profile.riskTolerance === 'conservative' ? '#f59e0b' : 'rgba(255, 255, 255, 0.08)'}`,
                  background: profile.riskTolerance === 'conservative'
                    ? 'rgba(245, 158, 11, 0.1)'
                    : 'rgba(255, 255, 255, 0.03)',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>🛡️ 保守型</span>
                  <span style={{ fontSize: 12, opacity: 0.6 }}>最大回撤 &lt; 5%</span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: '6px', fontWeight: 400 }}>
                  优先选择大盘蓝筹股，追求稳定收益
                </div>
              </button>
              <button
                onClick={() => setProfile({ ...profile, riskTolerance: 'moderate' })}
                style={{
                  padding: '18px',
                  borderRadius: '14px',
                  border: `2px solid ${profile.riskTolerance === 'moderate' ? '#f59e0b' : 'rgba(255, 255, 255, 0.08)'}`,
                  background: profile.riskTolerance === 'moderate'
                    ? 'rgba(245, 158, 11, 0.1)'
                    : 'rgba(255, 255, 255, 0.03)',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>⚖️ 稳健型</span>
                  <span style={{ fontSize: 12, opacity: 0.6 }}>最大回撤 5-10%</span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: '6px', fontWeight: 400 }}>
                  平衡配置蓝筹+成长股，攻守兼备
                </div>
              </button>
              <button
                onClick={() => setProfile({ ...profile, riskTolerance: 'aggressive' })}
                style={{
                  padding: '18px',
                  borderRadius: '14px',
                  border: `2px solid ${profile.riskTolerance === 'aggressive' ? '#f59e0b' : 'rgba(255, 255, 255, 0.08)'}`,
                  background: profile.riskTolerance === 'aggressive'
                    ? 'rgba(245, 158, 11, 0.1)'
                    : 'rgba(255, 255, 255, 0.03)',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Rocket size={14} /> 激进型</span>
                  <span style={{ fontSize: 12, opacity: 0.6 }}>最大回撤 10-20%</span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: '6px', fontWeight: 400 }}>
                  重点关注高成长潜力股，追求更高收益
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Next Button */}
        <button
          onClick={handleNext}
          style={{
            width: '100%',
            padding: '16px',
            marginTop: '32px',
            borderRadius: '14px',
            border: 'none',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {step === 3 ? '开始使用' : '下一步'}
          <ChevronRight size={18} />
        </button>

        {/* Skip */}
        {step < 3 && (
          <button
            onClick={handleComplete}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: 14,
              marginTop: '16px',
              cursor: 'pointer',
            }}
          >
            跳过
          </button>
        )}
      </div>
    </div>
  );
}
