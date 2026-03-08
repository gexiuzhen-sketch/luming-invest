import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { login as apiLogin } from '../services/api';
import { pullSync, pushSync, applySyncPayload, getSyncPayload } from '../services/syncService';

interface AuthContextValue {
  user: User | null;
  username: string | null;   // 用于同步的用户名
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password?: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 从LocalStorage加载用户信息
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userStr = localStorage.getItem('lm_user');
        const savedUsername = localStorage.getItem('lm_username');
        if (userStr) {
          setUser(JSON.parse(userStr));
        }
        if (savedUsername) {
          setUsername(savedUsername);
          // 应用启动时拉取同步数据
          const remote = await pullSync(savedUsername);
          if (remote) {
            applySyncPayload(remote);
          }
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (username: string, password = '123456') => {
    try {
      // 调用API登录（password参数可选，默认使用测试密码）
      const response = await apiLogin(username, password);

      // 使用API返回的用户信息
      const userData: User = {
        id: response.user.id,
        phone: response.user.phone,
        membershipLevel: response.user.membershipLevel as 'free' | 'premium',
        createdAt: new Date().toISOString(),
      };

      setUser(userData);
      setUsername(username);
      localStorage.setItem('lm_user', JSON.stringify(userData));
      localStorage.setItem('lm_username', username);

      // 登录后同步：若服务端有数据则拉取（保留本地数据优先），否则推送本地数据上去
      const remote = await pullSync(username);
      if (remote && remote.syncedAt) {
        // 服务端有数据：若比本地新则应用（保护已有本地数据）
        applySyncPayload(remote);
      } else {
        // 服务端无数据：将本地数据初始化上传（保留 luming 等已有账号数据）
        const local = getSyncPayload();
        const hasLocalData =
          local.watchlist.length > 0 ||
          local.holdings.length > 0 ||
          local.tradingDiary.length > 0 ||
          local.simTrading !== null;
        if (hasLocalData) {
          await pushSync(username, local);
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setUsername(null);
    localStorage.removeItem('lm_user');
    localStorage.removeItem('lm_username');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('lm_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        username,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
