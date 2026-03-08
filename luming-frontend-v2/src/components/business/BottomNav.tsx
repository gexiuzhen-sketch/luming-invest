import { NavLink } from 'react-router-dom';
import { Sparkles, Star, Briefcase, User } from 'lucide-react';

const navItems = [
  { path: '/discover', icon: Sparkles, label: '发现好股' },
  { path: '/watchlist', icon: Star, label: '自选' },
  { path: '/portfolio', icon: Briefcase, label: '持仓' },
  { path: '/profile', icon: User, label: '我的' },
  // { path: '/member', icon: Crown, label: '会员' },  // 30天免费活动期间隐藏会员入口
];

export function BottomNav() {
  return (
    <nav
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
        <NavLink
          key={item.path}
          to={item.path}
          style={() => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            textDecoration: 'none',
            padding: '4px 24px',
            cursor: 'pointer',
          })}
        >
          {({ isActive }) => (
            <>
              <item.icon
                size={22}
                style={{
                  opacity: isActive ? 1 : 0.35,
                  color: isActive ? '#f59e0b' : 'inherit',
                }}
              />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: isActive ? '#f59e0b' : 'rgba(255, 255, 255, 0.6)',
                }}
              >
                {item.label}
              </span>
              <div
                style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '2px',
                  background: isActive ? '#f59e0b' : 'transparent',
                }}
              />
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
