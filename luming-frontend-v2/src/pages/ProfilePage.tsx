import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Bell, Shield, Settings, LogOut, ChevronRight, Eye, EyeOff, Moon, Sun, Trash2, BarChart2 } from 'lucide-react';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showGeneralSettingsModal, setShowGeneralSettingsModal] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // 修改密码表单状态
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout();
      window.location.href = '/login';
    }
  };

  const handlePasswordChange = () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert('请填写所有密码字段');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('两次输入的新密码不一致');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert('新密码长度不能少于6位');
      return;
    }

    // TODO: 调用API修改密码
    alert('密码修改成功');
    setShowPasswordForm(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleClearCache = () => {
    if (confirm('确定要清除所有缓存数据吗？这将删除所有本地存储的数据。')) {
      localStorage.clear();
      alert('缓存已清除');
      window.location.reload();
    }
  };

  return (
    <div style={{ padding: '16px', paddingBottom: '100px' }}>
      {/* 用户信息卡片 */}
      <div
        style={{
          padding: '24px',
          borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.08))',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
            }}
          >
            👤
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
              欢迎回来
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              {user?.phone || '用户'}
            </div>
            <div
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: 12,
                background: 'rgba(34, 197, 94, 0.2)',
                color: '#22c55e',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              30天免费体验中
            </div>
          </div>
        </div>
      </div>

      {/* 功能设置区域 */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 12, paddingLeft: 4 }}>
          设置
        </h3>

        {/* 通知设置 */}
        <div
          style={{
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Bell size={20} style={{ color: '#6366f1' }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
                  消息通知
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                  接收交易提醒和系统通知
                </div>
              </div>
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              style={{
                width: 48,
                height: 28,
                borderRadius: 14,
                background: notificationsEnabled
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.3s',
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#fff',
                  position: 'absolute',
                  top: 3,
                  left: notificationsEnabled ? 23 : 3,
                  transition: 'all 0.3s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
            </button>
          </div>
        </div>

        {/* 账户安全 */}
        <div
          onClick={() => setShowSecurityModal(true)}
          style={{
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Shield size={20} style={{ color: '#22c55e' }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
                  账户安全
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                  修改密码和安全设置
                </div>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: 'rgba(255,255,255,0.3)' }} />
          </div>
        </div>

        {/* 通用设置 */}
        <div
          onClick={() => setShowGeneralSettingsModal(true)}
          style={{
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Settings size={20} style={{ color: '#f59e0b' }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
                  通用设置
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                  主题、语言等偏好设置
                </div>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: 'rgba(255,255,255,0.3)' }} />
          </div>
        </div>

        {/* 数据统计 */}
        <div
          onClick={() => navigate('/stats')}
          style={{
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
            marginTop: 12,
          }}
        >
          <div
            style={{
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <BarChart2 size={20} style={{ color: '#6366f1' }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
                  数据统计看板
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                  浏览、注册数据分析
                </div>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: 'rgba(255,255,255,0.3)' }} />
          </div>
        </div>
      </div>

      {/* 退出登录按钮 */}
      <button
        onClick={handleLogout}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: 12,
          border: '1px solid rgba(239, 68, 68, 0.3)',
          background: 'rgba(239, 68, 68, 0.08)',
          color: '#ef4444',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
        }}
      >
        <LogOut size={18} />
        退出登录
      </button>

      {/* 版本信息 */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          鹿鸣智投 v1.2.12
        </div>
      </div>

      {/* 账户安全弹窗 */}
      {showSecurityModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSecurityModal(false);
              setShowPasswordForm(false);
            }
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              margin: '0 auto',
              background: '#1a1b1e',
              borderRadius: '20px 20px 0 0',
              padding: '20px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>
                账户安全
              </h2>
              <button
                onClick={() => {
                  setShowSecurityModal(false);
                  setShowPasswordForm(false);
                }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 24, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {!showPasswordForm ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* 账户信息 */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>账户信息</div>
                  <div style={{ fontSize: 14, color: '#fff', marginBottom: 4 }}>
                    用户名: {user?.phone || '未设置'}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                    注册时间: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '未知'}
                  </div>
                </div>

                {/* 修改密码 */}
                <button
                  onClick={() => setShowPasswordForm(true)}
                  style={{
                    padding: '16px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <Shield size={20} style={{ color: '#6366f1' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 2 }}>修改密码</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>定期更换密码保护账户安全</div>
                  </div>
                  <ChevronRight size={18} style={{ color: 'rgba(255,255,255,0.3)' }} />
                </button>

                {/* 登录设备 */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>当前设备</div>
                  <div style={{ fontSize: 14, color: '#22c55e', marginBottom: 4 }}>✓ 本机 (当前使用)</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                    {navigator.userAgent.split(' ').slice(-2)[0] || '未知设备'}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <button
                  onClick={() => setShowPasswordForm(false)}
                  style={{
                    padding: '8px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.05)',
                    border: 'none',
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: 13,
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                    marginBottom: 8,
                  }}
                >
                  ← 返回
                </button>

                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', margin: 0 }}>修改密码</h3>

                {/* 当前密码 */}
                <div>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, display: 'block' }}>
                    当前密码
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="请输入当前密码"
                      style={{
                        width: '100%',
                        padding: '12px 40px 12px 12px',
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        fontSize: 14,
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {showPassword.current ? <EyeOff size={18} color="rgba(255,255,255,0.4)" /> : <Eye size={18} color="rgba(255,255,255,0.4)" />}
                    </button>
                  </div>
                </div>

                {/* 新密码 */}
                <div>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, display: 'block' }}>
                    新密码
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="请输入新密码（至少6位）"
                      style={{
                        width: '100%',
                        padding: '12px 40px 12px 12px',
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        fontSize: 14,
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {showPassword.new ? <EyeOff size={18} color="rgba(255,255,255,0.4)" /> : <Eye size={18} color="rgba(255,255,255,0.4)" />}
                    </button>
                  </div>
                </div>

                {/* 确认新密码 */}
                <div>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, display: 'block' }}>
                    确认新密码
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="请再次输入新密码"
                      style={{
                        width: '100%',
                        padding: '12px 40px 12px 12px',
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        fontSize: 14,
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {showPassword.confirm ? <EyeOff size={18} color="rgba(255,255,255,0.4)" /> : <Eye size={18} color="rgba(255,255,255,0.4)" />}
                    </button>
                  </div>
                </div>

                {/* 确认按钮 */}
                <button
                  onClick={handlePasswordChange}
                  disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  style={{
                    padding: '14px',
                    borderRadius: 10,
                    background: (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword)
                      ? 'rgba(255,255,255,0.1)'
                      : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none',
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword)
                      ? 'not-allowed'
                      : 'pointer',
                  }}
                >
                  确认修改
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 通用设置弹窗 */}
      {showGeneralSettingsModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowGeneralSettingsModal(false);
            }
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              margin: '0 auto',
              background: '#1a1b1e',
              borderRadius: '20px 20px 0 0',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>
                通用设置
              </h2>
              <button
                onClick={() => setShowGeneralSettingsModal(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 24, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* 主题设置 */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {isDarkMode ? <Moon size={20} style={{ color: '#8b5cf6' }} /> : <Sun size={20} style={{ color: '#f59e0b' }} />}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
                      主题模式
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                      {isDarkMode ? '深色模式' : '浅色模式'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  disabled
                  style={{
                    width: 48,
                    height: 28,
                    borderRadius: 14,
                    background: isDarkMode
                      ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                      : 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    cursor: 'not-allowed',
                    position: 'relative',
                    opacity: 0.5,
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#fff',
                      position: 'absolute',
                      top: 3,
                      left: isDarkMode ? 23 : 3,
                      transition: 'all 0.3s',
                    }}
                  />
                </button>
              </div>

              {/* 语言设置 */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
                    语言设置
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    简体中文
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: 'rgba(255,255,255,0.3)' }} />
              </div>

              {/* 清除缓存 */}
              <button
                onClick={handleClearCache}
                style={{
                  padding: '16px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <Trash2 size={20} style={{ color: '#ef4444' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: 2 }}>清除缓存</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>删除所有本地存储的数据</div>
                </div>
                <ChevronRight size={18} style={{ color: 'rgba(255,255,255,0.3)' }} />
              </button>

              {/* 关于我们 */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 8 }}>关于鹿鸣智投</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                  鹿鸣智投是一款AI驱动的智能投资助手，帮助用户做出更明智的投资决策。
                  <br /><br />
                  版本: v1.2.12
                </div>
              </div>

              {/* 用户协议 */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>
                  用户协议与隐私政策
                </div>
                <ChevronRight size={18} style={{ color: 'rgba(255,255,255,0.3)' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
