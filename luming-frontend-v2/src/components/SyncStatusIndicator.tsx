/**
 * 同步状态指示器
 * 在页面右上角显示当前数据同步状态（仅登录用户可见）
 */
import { useState, useEffect } from 'react';
import { onSyncStatusChange, getSyncStatus } from '../services/syncService';
import type { SyncStatus } from '../services/syncService';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG: Record<SyncStatus, { icon: string; label: string; color: string }> = {
  idle: { icon: '●', label: '已同步', color: '#52c41a' },
  syncing: { icon: '↻', label: '同步中...', color: '#1890ff' },
  success: { icon: '✓', label: '已同步', color: '#52c41a' },
  error: { icon: '✕', label: '同步失败', color: '#ff4d4f' },
  offline: { icon: '○', label: '离线', color: '#faad14' },
};

export default function SyncStatusIndicator() {
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus());
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = onSyncStatusChange((newStatus) => {
      setStatus(newStatus);
      // 显示指示器 2 秒后隐藏（idle/success）
      setVisible(true);
      if (newStatus === 'success' || newStatus === 'idle') {
        const timer = setTimeout(() => setVisible(false), 2000);
        return () => clearTimeout(timer);
      }
    });
    return unsubscribe;
  }, []);

  if (!isAuthenticated) return null;
  if (!visible && (status === 'idle' || status === 'success')) return null;

  const config = STATUS_CONFIG[status];

  return (
    <div
      style={{
        position: 'fixed',
        top: 60,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 12px',
        borderRadius: 16,
        background: 'rgba(0,0,0,0.7)',
        color: config.color,
        fontSize: 12,
        fontWeight: 500,
        backdropFilter: 'blur(4px)',
        transition: 'opacity 0.3s',
        opacity: visible ? 1 : 0,
        pointerEvents: 'none',
      }}
    >
      <span style={{ fontSize: 14, animation: status === 'syncing' ? 'spin 1s linear infinite' : undefined }}>
        {config.icon}
      </span>
      {config.label}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
