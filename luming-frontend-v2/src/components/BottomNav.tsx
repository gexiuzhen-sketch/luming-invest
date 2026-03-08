interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { key: 'discover', icon: '✨', label: '发现好股' },
  { key: 'watchlist', icon: '⭐', label: '自选' },
  { key: 'signals', icon: '📊', label: '买卖建议', external: true },
  { key: 'profile', icon: '👤', label: '我的' },
  // { key: 'membership', icon: '👑', label: '会员' },  // 30天免费活动期间隐藏会员入口
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        padding: '8px 0 28px',
        background: 'linear-gradient(to top, rgba(10, 11, 15, 0.98), rgba(10, 11, 15, 0.85))',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        justifyContent: 'space-around',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        zIndex: 100,
      }}
    >
      {navItems.map((item) => (
        <div
          key={item.key}
          onClick={() => {
            if (item.external) {
              window.location.href = item.key === 'signals' ? '/signals.html' : '/';
            } else {
              onTabChange(item.key);
            }
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            cursor: 'pointer',
            padding: '4px 24px',
          }}
        >
          <span style={{ fontSize: 22, opacity: activeTab === item.key ? 1 : 0.35 }}>{item.icon}</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: activeTab === item.key ? '#a5b4fc' : 'rgba(255, 255, 255, 0.25)',
            }}
          >
            {item.label}
          </span>
          <div
            style={{
              width: 4,
              height: 4,
              borderRadius: 2,
              background: activeTab === item.key ? '#6366f1' : 'transparent',
            }}
          />
        </div>
      ))}
    </div>
  );
}
