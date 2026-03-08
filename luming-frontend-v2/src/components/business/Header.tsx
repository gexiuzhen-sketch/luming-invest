import { Link } from 'react-router-dom';
import { User, Crown, LogOut, MessageSquare } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';
import { FeedbackModal } from '../FeedbackModal';
import type { FeedbackData } from '../FeedbackModal';

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const [showFeedback, setShowFeedback] = useState(false);

  const handleSubmitFeedback = (feedback: FeedbackData) => {
    console.log('Header反馈:', feedback);
    const feedbacks = JSON.parse(localStorage.getItem('lm_feedbacks') || '[]');
    feedbacks.push({
      ...feedback,
      timestamp: new Date().toISOString(),
      source: 'header',
    });
    localStorage.setItem('lm_feedbacks', JSON.stringify(feedbacks));
  };

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout();
      window.location.href = '/discover';
    }
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '14px 16px',
        background: 'linear-gradient(to bottom, rgba(10, 11, 15, 0.95), rgba(10, 11, 15, 0.7))',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '480px',
          margin: '0 auto',
        }}
      >
        <Link
          to="/discover"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
          }}
        >
          <img
            src="/logo.png"
            alt="鹿鸣智投"
            style={{
              width: '32px',
              height: '32px',
              objectFit: 'contain',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span
              style={{
                fontSize: 20,
                fontWeight: 800,
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1,
              }}
            >
              鹿鸣智投
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1,
              }}
            >
              AI驱动量化投资
            </span>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isAuthenticated ? (
            <>
              <button
                onClick={() => setShowFeedback(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  borderRadius: '50%',
                  background: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.2)',
                  cursor: 'pointer',
                  color: '#fbbf24',
                }}
                title="意见反馈"
              >
                <MessageSquare size={16} />
              </button>
              <Link
                to="/member"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  background: user?.membershipLevel === 'premium'
                    ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 146, 60, 0.1))'
                    : 'rgba(255, 255, 255, 0.06)',
                  border: user?.membershipLevel === 'premium'
                    ? '1px solid rgba(251, 191, 36, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  textDecoration: 'none',
                  color: user?.membershipLevel === 'premium' ? '#fbbf24' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                {user?.membershipLevel === 'premium' ? (
                  <Crown size={16} style={{ color: '#fbbf24' }} />
                ) : (
                  <User size={16} />
                )}
                <span>
                  {user?.membershipLevel === 'premium' ? '专业版' : '免费'}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  cursor: 'pointer',
                  color: 'rgba(239, 68, 68, 0.8)',
                }}
                title="退出登录"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              登录
            </Link>
          )}
        </div>
      </div>

      {/* 意见反馈弹窗 */}
      {showFeedback && (
        <FeedbackModal
          onClose={() => setShowFeedback(false)}
          onSubmit={handleSubmitFeedback}
        />
      )}
    </header>
  );
}
