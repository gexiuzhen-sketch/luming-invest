import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Crown, Bell } from 'lucide-react';
import { NotificationSettingsPage } from './NotificationSettingsPage';

export function MembershipPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'membership' | 'notification'>('membership');

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f17',
      padding: '20px 16px 80px',
    }}>
      {/* 选项卡切换 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: 'flex',
          padding: '4px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <button
            onClick={() => setActiveTab('membership')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'membership'
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : 'transparent',
              color: activeTab === 'membership' ? '#fff' : 'rgba(255,255,255,0.5)',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Sparkles size={16} />
            会员计划
          </button>
          <button
            onClick={() => setActiveTab('notification')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'notification'
                ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                : 'transparent',
              color: activeTab === 'notification' ? '#fff' : 'rgba(255,255,255,0.5)',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Bell size={16} />
            推送设置
          </button>
        </div>
      </div>

      {/* 推送设置页面 */}
      {activeTab === 'notification' && <NotificationSettingsPage />}

      {/* 会员计划页面 */}
      {activeTab === 'membership' && (
        <>
      {/* 头部 */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          borderRadius: 20,
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(139, 92, 246, 0.1))',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          marginBottom: 16,
        }}>
          <Sparkles size={16} style={{ color: '#fbbf24' }} />
          <span style={{ fontSize: 13, color: '#fbbf24', fontWeight: 600 }}>
            会员计划
          </span>
        </div>
        <h1 style={{
          fontSize: 28,
          fontWeight: 800,
          color: '#fff',
          marginBottom: 12,
        }}>
          选择适合您的投资方案
        </h1>
        <p style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.5)',
          maxWidth: 500,
          margin: '0 auto',
        }}>
          免费用户即可体验核心功能，专业版解锁更多高级功能
        </p>
      </div>

      {/* 价格对比卡片 */}
      <div style={{
        maxWidth: 700,
        margin: '0 auto 40px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
      }}>
        {/* 免费版 */}
        <div
          onClick={() => navigate('/discover')}
          style={{
            padding: '28px 24px',
            borderRadius: 20,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{
              fontSize: 40,
              fontWeight: 800,
              color: '#fff',
              marginBottom: 8,
            }}>
              ¥0
            </div>
            <div style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.7)',
            }}>
              免费版
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              永久免费
            </div>
          </div>
        </div>

        {/* 专业版 */}
        <div
          onClick={() => alert('跳转到支付页面...\n（实际应用中接入微信/支付宝支付）')}
          style={{
            padding: '28px 24px',
            borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(139, 92, 246, 0.05))',
            border: '2px solid rgba(245, 158, 11, 0.5)',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(245, 158, 11, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* 推荐标签 */}
          <div style={{
            position: 'absolute',
            top: -1,
            right: 20,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            padding: '4px 12px',
            borderRadius: '0 0 8px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <Crown size={12} fill="currentColor" />
            推荐
          </div>

          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{
              fontSize: 40,
              fontWeight: 800,
              color: '#6366f1',
              marginBottom: 8,
            }}>
              ¥98
            </div>
            <div style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#fbbf24',
            }}>
              专业版
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              每月订阅
            </div>
          </div>
        </div>
      </div>

      {/* 功能对比表 */}
      <div style={{
        maxWidth: 700,
        margin: '0 auto 40px',
        padding: '24px',
        borderRadius: 20,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <h3 style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#fff',
          marginBottom: 24,
          textAlign: 'center',
        }}>
          功能对比
        </h3>

        {/* 表头 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr 1fr',
          gap: 12,
          padding: '12px 8px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          marginBottom: 8,
        }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>功能</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', textAlign: 'center' }}>免费版</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24', textAlign: 'center' }}>专业版</div>
        </div>

        {/* 表格内容 */}
        {[
          { feature: '股票详情查看', free: '每日10次', premium: '无限次', highlight: true },
          { feature: 'AI分析深度', free: '基础分析', premium: '多因子模型', highlight: true },
          { feature: '股票推荐', free: '每日10只', premium: '无限制', highlight: true },
          { feature: '实时数据延迟', free: '15分钟', premium: '<3秒', highlight: true },
          { feature: '价格提醒', free: '每日3条', premium: '无限制', highlight: true },
          { feature: '目标价提醒', free: '❌', premium: '✅', highlight: true },
          { feature: '持仓日报', free: '❌', premium: '✅', highlight: true },
          { feature: '市场重大事件', free: '❌', premium: '✅', highlight: true },
          { feature: '板块热点提醒', free: '❌', premium: '✅', highlight: true },
          { feature: '推送渠道', free: '仅App', premium: 'App+短信+邮件', highlight: true },
          { feature: '数据导出', free: '❌', premium: '✅' },
          { feature: '交易信号', free: '基础', premium: '实时推送', highlight: true },
          { feature: '自选股', free: '✅', premium: '✅' },
          { feature: '模拟交易', free: '✅', premium: '✅' },
          { feature: '投资组合分析', free: '✅', premium: '✅' },
          { feature: '客户支持', free: '社区', premium: '优先' },
        ].map((row, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr 1fr',
              gap: 12,
              padding: row.highlight ? '14px 8px' : '12px 8px',
              borderRadius: row.highlight ? '8px' : '0',
              background: row.highlight ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
              marginBottom: row.highlight ? '6px' : '0',
              borderBottom: index < 15 ? '1px solid rgba(255,255,255,0.03)' : 'none',
            }}
          >
            <div style={{
              fontSize: 13,
              color: row.highlight ? '#fbbf24' : 'rgba(255,255,255,0.6)',
              fontWeight: row.highlight ? 600 : 'normal',
            }}>
              {row.feature}
            </div>
            <div style={{
              fontSize: 13,
              color: row.free === '❌' ? 'rgba(255,255,255,0.25)' : '#fff',
              textAlign: 'center',
            }}>
              {row.free}
            </div>
            <div style={{
              fontSize: 13,
              color: row.premium === '❌' ? 'rgba(255,255,255,0.25)' : '#6366f1',
              fontWeight: row.highlight ? 700 : 600,
              textAlign: 'center',
            }}>
              {row.premium}
            </div>
          </div>
        ))}
      </div>

      {/* 常见问题 */}
      <div style={{
        maxWidth: 700,
        margin: '0 auto',
        padding: '24px',
        borderRadius: 20,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <h3 style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#fff',
          marginBottom: 20,
          textAlign: 'center',
        }}>
          常见问题
        </h3>

        {[
          {
            q: '免费用户可以使用哪些功能？',
            a: '免费用户每天可查看10次股票详情，使用基础AI分析、模拟交易、自选股等功能，足以体验产品的核心价值。',
          },
          {
            q: '如何升级专业版？',
            a: '点击上方专业版卡片或表格中的专业版选项即可升级，支持微信/支付宝支付，升级后立即生效，可随时取消订阅。',
          },
          {
            q: '专业版和免费版有什么区别？',
            a: '专业版用户享受无限次查看、深度AI分析（多因子模型）、实时数据推送、数据导出等专业功能，适合活跃投资者使用。',
          },
        ].map((item, index) => (
          <div
            key={index}
            style={{
              marginBottom: index < 2 ? 20 : 0,
            }}
          >
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              marginBottom: 8,
            }}>
              {item.q}
            </div>
            <div style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.6,
            }}>
              {item.a}
            </div>
          </div>
        ))}
      </div>

      {/* 底部CTA */}
      <div style={{
        maxWidth: 700,
        margin: '40px auto 0',
        textAlign: 'center',
      }}>
        <button
          onClick={() => alert('跳转到支付页面...\n（实际应用中接入微信/支付宝支付）')}
          style={{
            padding: '16px 48px',
            borderRadius: 14,
            border: 'none',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)',
          }}
        >
          立即升级专业版
          <ArrowRight size={18} />
        </button>
        <p style={{
          fontSize: 12,
          color: 'rgba(255,255,255,0.4)',
          marginTop: 16,
        }}>
          可随时取消 · 支持微信/支付宝
        </p>
      </div>
        </>
      )}
    </div>
  );
}
