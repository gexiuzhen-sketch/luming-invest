import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Shield } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 16,
        }}
      >
        <Shield size={40} style={{ color: 'rgba(255,255,255,0.2)' }} />
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>加载中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // 导航会自动跳转
  }

  return <>{children}</>;
}
