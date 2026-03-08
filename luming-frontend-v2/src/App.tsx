import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { MembershipProvider } from './context/MembershipContext';
import { OnboardingProvider } from './context/OnboardingContext';
import { MainLayout } from './layouts/MainLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { OnboardingPage } from './components/onboarding/OnboardingPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { MembershipPage } from './pages/MembershipPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { SimulatedTradingPage } from './pages/SimulatedTradingPage';
import { PositionCalculatorPage } from './pages/PositionCalculatorPage';
import { TradingDiaryPage } from './pages/TradingDiaryPage';
import { PriceAlertsPage } from './pages/PriceAlertsPage';
import { StatsDashboardPage } from './pages/StatsDashboardPage';
import { useOnboarding } from './hooks/useOnboarding';
import { trackPageView } from './services/statsService';

/** 路由变化时自动记录 PV */
function PageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);
  return null;
}

// 交易日记路由包装器，从 URL 参数中获取类型
function TradingDiaryWrapper() {
  const { type = 'real' } = useParams();
  const portfolioType = type === 'simulation' ? 'simulation' : 'real';
  return <TradingDiaryPage portfolioType={portfolioType} />;
}

function AppRoutes() {
  const { isCompleted } = useOnboarding();

  // 如果引导未完成，显示引导页
  if (!isCompleted) {
    return (
      <Routes>
        <Route path="/*" element={<OnboardingPage />} />
      </Routes>
    );
  }

  // 引导完成后，显示主应用
  return (
    <>
      <PageViewTracker />
      <Routes>
      {/* 默认重定向到发现好股 */}
      <Route path="/" element={<Navigate to="/discover" replace />} />

      {/* 主布局页面 */}
      <Route path="/discover" element={<MainLayout><DiscoverPage /></MainLayout>} />
      <Route path="/watchlist" element={<MainLayout><WatchlistPage /></MainLayout>} />
      <Route path="/portfolio" element={<MainLayout><PortfolioPage /></MainLayout>} />
      <Route path="/member" element={<MainLayout><MembershipPage /></MainLayout>} />
      <Route path="/profile" element={<MainLayout><ProfilePage /></MainLayout>} />
      <Route path="/simulate" element={<MainLayout><SimulatedTradingPage /></MainLayout>} />
      <Route path="/calculator" element={<MainLayout><PositionCalculatorPage /></MainLayout>} />
      <Route path="/diary" element={<MainLayout><TradingDiaryPage portfolioType="real" /></MainLayout>} />
      <Route path="/diary/:type" element={<MainLayout><TradingDiaryWrapper /></MainLayout>} />
      <Route path="/alerts" element={<MainLayout><PriceAlertsPage /></MainLayout>} />

      {/* 公共布局页面 */}
      <Route path="/login" element={<PublicLayout><LoginPage /></PublicLayout>} />

      {/* 数据统计看板（无需登录可访问） */}
      <Route path="/stats" element={<PublicLayout><StatsDashboardPage /></PublicLayout>} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/discover" replace />} />
    </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <OnboardingProvider>
        <AuthProvider>
          <MembershipProvider>
            <AppRoutes />
          </MembershipProvider>
        </AuthProvider>
      </OnboardingProvider>
    </BrowserRouter>
  );
}

export default App;
