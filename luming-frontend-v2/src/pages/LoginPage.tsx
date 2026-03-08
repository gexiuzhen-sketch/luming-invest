import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { registerLocal } from '../services/api';

type Mode = 'login' | 'register';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 12,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#fff',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const handleSubmit = async () => {
    setError('');

    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    if (username.length < 2) {
      setError('用户名至少 2 个字符');
      return;
    }

    if (password.length < 6) {
      setError('密码至少 6 位');
      return;
    }

    if (mode === 'register') {
      if (!confirmPassword) {
        setError('请再次输入密码进行确认');
        return;
      }
      // 密码确认区分大小写
      if (password !== confirmPassword) {
        setError('两次输入的密码不一致');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        // 注册（服务端 + 本地双写，区分大小写）
        await registerLocal(username, password);
        // 注册成功后自动登录
        await login(username, password);
        navigate('/discover');
      } else {
        // 登录（用户名和密码均区分大小写）
        await login(username, password);
        navigate('/discover');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : mode === 'login' ? '登录失败，请检查用户名和密码' : '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'linear-gradient(135deg, #0a0b0f 0%, #1a1b26 100%)',
      }}
    >
      <div style={{ maxWidth: 360, width: '100%' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Sparkles size={40} style={{ color: '#6366f1', marginBottom: 16 }} />
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 8,
            }}
          >
            鹿鸣智投
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
            AI驱动的量化投资助手
          </p>
        </div>

        {/* 表单卡片 */}
        <div
          style={{
            padding: '32px',
            borderRadius: 20,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* 模式切换 Tab */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 12,
              padding: 4,
              marginBottom: 28,
            }}
          >
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 9,
                  border: 'none',
                  background: mode === m ? 'rgba(245, 158, 11, 0.9)' : 'transparent',
                  color: mode === m ? '#fff' : 'rgba(255,255,255,0.5)',
                  fontSize: 14,
                  fontWeight: mode === m ? 700 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                }}
              >
                {m === 'login' ? <LogIn size={15} /> : <UserPlus size={15} />}
                {m === 'login' ? '登录' : '注册'}
              </button>
            ))}
          </div>

          {/* 用户名 */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, display: 'block' }}>
              用户名（区分大小写）
            </label>
            <input
              type="text"
              placeholder="请输入用户名"
              value={username}
              autoComplete="username"
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* 密码 */}
          <div style={{ marginBottom: mode === 'register' ? 16 : 24 }}>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, display: 'block' }}>
              密码（区分大小写，至少6位）
            </label>
            <input
              type="password"
              placeholder="请输入密码"
              value={password}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* 确认密码（仅注册模式） */}
          {mode === 'register' && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, display: 'block' }}>
                确认密码
              </label>
              <input
                type="password"
                placeholder="请再次输入密码"
                value={confirmPassword}
                autoComplete="new-password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  ...inputStyle,
                  border: confirmPassword && confirmPassword !== password
                    ? '1px solid rgba(239, 68, 68, 0.6)'
                    : confirmPassword && confirmPassword === password
                      ? '1px solid rgba(34, 197, 94, 0.6)'
                      : inputStyle.border,
                }}
              />
              {confirmPassword && confirmPassword !== password && (
                <p style={{ fontSize: 11, color: '#ef4444', marginTop: 6 }}>
                  两次密码不一致
                </p>
              )}
              {confirmPassword && confirmPassword === password && (
                <p style={{ fontSize: 11, color: '#22c55e', marginTop: 6 }}>
                  ✓ 密码一致
                </p>
              )}
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          {/* 提交按钮 */}
          <button
            onClick={handleSubmit}
            disabled={loading || !username || !password || (mode === 'register' && !confirmPassword)}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 12,
              border: 'none',
              background: (loading || !username || !password)
                ? 'rgba(245, 158, 11, 0.4)'
                : 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              cursor: (loading || !username || !password) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {loading ? (mode === 'login' ? '登录中...' : '注册中...') : (mode === 'login' ? '登录' : '注册账号')}
            {!loading && <ArrowRight size={18} />}
          </button>

          <p
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.4)',
              textAlign: 'center',
              marginTop: 16,
            }}
          >
            {mode === 'register'
              ? '注册即表示同意《用户协议》和《隐私政策》'
              : '用户名和密码均区分大小写'}
          </p>
        </div>

        {/* 跳过登录 */}
        <button
          onClick={() => navigate('/discover')}
          style={{
            marginTop: 24,
            padding: '12px 24px',
            borderRadius: 10,
            border: 'none',
            background: 'transparent',
            color: 'rgba(255,255,255,0.5)',
            fontSize: 14,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          暂不登录，先看看
        </button>
      </div>
    </div>
  );
}
