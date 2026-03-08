import { useState, useEffect, useCallback } from 'react';
import { StockCard } from '../components/StockCard';
import { StockDetailModalEnhanced } from '../components/StockDetailModalEnhanced';
import { MarketTabs } from '../components/business/MarketTabs';
import { CategoryFilter, DEFAULT_CATEGORIES } from '../components/business/CategoryFilter';
import { BacktestShowcase } from '../components/BacktestShowcase';
import { useMembership } from '../hooks/useMembership';
import { useAuth } from '../hooks/useAuth';
import { watchlistService } from '../services/watchlistService';
import { getStockRecommendations } from '../services/api';
import type { Stock } from '../types';
import { Crown, BarChart3, Hourglass, Coins } from 'lucide-react';

export function DiscoverPage() {
  const { isAuthenticated } = useAuth();
  const { checkAccess, decrementUsage } = useMembership();
  const [market, setMarket] = useState('A');
  const [sector, setSector] = useState('all');
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // 加载股票数据
  const loadStocks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStockRecommendations(market);
      setStocks(data || []);
    } catch (error) {
      console.error('Failed to load stocks:', error);
      setStocks([]);
    } finally {
      setLoading(false);
    }
  }, [market]);

  useEffect(() => {
    loadStocks();
  }, [loadStocks]);

  // 筛选 - 确保精确匹配
  const filteredStocks = stocks.filter((stock) => {
    if (sector === 'all') return true;

    // 优先使用industry字段（如果存在），否则使用sector字段
    const stockSector = (stock.industry || stock.sector || '').trim();

    // 精确匹配筛选值
    return stockSector === sector;
  });

  // 处理股票点击
  const handleStockClick = (stock: Stock) => {
    // 检查访问权限
    if (!checkAccess('unlimitedViews')) {
      setShowUpgradeModal(true);
      return;
    }
    decrementUsage();
    setSelectedStock(stock);
  };

  // 处理登录/升级
  const handleLoginOrUpgrade = () => {
    setShowUpgradeModal(false);
    // 未登录用户引导登录，已登录用户引导升级
    if (!isAuthenticated) {
      window.location.href = '/login';
    } else {
      window.location.href = '/member';
    }
  };

  // 添加自选
  const handleAddWatchlist = () => {
    if (!isAuthenticated) {
      // 跳转到登录页
      window.location.href = '/login';
      return;
    }

    if (selectedStock) {
      watchlistService.addItem({
        code: selectedStock.code,
        name: selectedStock.name,
        market: selectedStock.market,
      });
      setSelectedStock(null);
      // 显示成功提示
      showNotification(`✅ ${selectedStock.name} 已添加到自选`);
    }
  };

  // 显示通知
  const showNotification = (message: string) => {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(34, 197, 94, 0.95);
      color: white;
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // 3秒后移除
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in forwards';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  };

  return (
    <div>
      {/* 30天免费活动弹窗（首次登录显示 - 浮动弹窗样式） */}
      {!localStorage.getItem('lm_free_activity_shown') && (
        <>
          {/* 背景遮罩 */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(8px)',
              zIndex: 9998,
            }}
            onClick={() => {
              localStorage.setItem('lm_free_activity_shown', 'true');
              window.location.reload();
            }}
          />
          {/* 浮动弹窗 */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: 400,
              padding: '28px 24px',
              borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(59, 130, 246, 0.15))',
              border: '2px solid rgba(34, 197, 94, 0.5)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              zIndex: 9999,
              animation: 'modalFadeIn 0.4s ease-out',
            }}
          >
            <button
              onClick={() => {
                localStorage.setItem('lm_free_activity_shown', 'true');
                window.location.reload();
              }}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                fontSize: 20,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ×
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #22c55e, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                boxShadow: '0 4px 16px rgba(34, 197, 94, 0.4)',
              }}>
                🎉
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#22c55e', marginBottom: 4 }}>
                  限时福利：30天完全免费
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                  即日起至2026年4月3日
                </div>
              </div>
            </div>

            <div style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.8)',
              marginBottom: 20,
              lineHeight: 1.8,
              padding: '16px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.05)',
            }}>
              ✅ <strong>AI智能选股</strong> - 全市场覆盖<br/>
              ✅ <strong>模拟交易</strong> - 完整功能<br/>
              ✅ <strong>数据分析</strong> - 实时更新<br/>
              ✅ <strong>持仓诊断</strong> - 深度分析
            </div>

            <div style={{
              fontSize: 14,
              color: '#22c55e',
              textAlign: 'center',
              padding: '12px',
              borderRadius: 10,
              background: 'rgba(34, 197, 94, 0.15)',
              fontWeight: 600,
            }}>
              🎁 所有功能完全免费使用30天！
            </div>

            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 12 }}>
              点击任意处或 × 关闭
            </div>
          </div>

          <style>{`
            @keyframes modalFadeIn {
              from {
                opacity: 0;
                transform: translate(-50%, -45%);
              }
              to {
                opacity: 1;
                transform: translate(-50%, -50%);
              }
            }
          `}</style>
        </>
      )}

      {/* 市场切换 */}
      <MarketTabs
        markets={[
          { key: 'A', label: '沪深A股', flag: '🇨🇳' },
          { key: 'HK', label: '港股', flag: '🇭🇰' },
          { key: 'US', label: '美股', flag: '🇺🇸' },
          { key: 'FUND', label: '基金', icon: <Coins size={16} /> },
        ]}
        activeKey={market}
        onChange={setMarket}
      />

      {/* 行业筛选 */}
      <CategoryFilter
        categories={DEFAULT_CATEGORIES}
        activeKey={sector}
        onChange={setSector}
      />

      {/* 回测业绩展示 - 仅在A股市场显示 */}
      {market === 'A' && <BacktestShowcase />}

      {/* 股票列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>
          <Hourglass size={32} style={{ marginBottom: 16, opacity: 0.5 }} />
          <div>加载中...</div>
        </div>
      ) : filteredStocks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>
          <BarChart3 size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
          <div style={{ fontSize: 16, fontWeight: 500 }}>暂无数据</div>
          <div style={{ fontSize: 12, marginTop: 8, opacity: 0.6 }}>
            尝试切换其他市场
          </div>
        </div>
      ) : (
        filteredStocks.map((stock, index) => (
          <StockCard
            key={stock.code}
            stock={stock}
            index={index}
            onClick={() => handleStockClick(stock)}
          />
        ))
      )}

      {/* 升级提示 */}
      {showUpgradeModal && (
        <div
          onClick={() => setShowUpgradeModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1a1b26',
              borderRadius: 20,
              padding: 32,
              maxWidth: 340,
              width: '100%',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              textAlign: 'center',
            }}
          >
            <Crown size={48} style={{ marginBottom: 16, color: '#fbbf24' }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#fff' }}>
              {isAuthenticated ? '今日查看次数已用完' : '登录后查看更多'}
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 20, lineHeight: 1.6 }}>
              {isAuthenticated
                ? '免费用户每天可查看10次股票详情\n升级会员即可无限次查看'
                : '登录后每天可查看10次股票详情\n会员用户可无限次查看'}
            </p>
            <button
              onClick={handleLoginOrUpgrade}
              style={{
                padding: '14px 24px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #fbbf24, #f97316)',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              {isAuthenticated ? '立即升级会员' : '立即登录'}
            </button>
            <button
              onClick={() => setShowUpgradeModal(false)}
              style={{
                marginTop: 12,
                padding: '12px',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.4)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              明天再看
            </button>
          </div>
        </div>
      )}

      {/* 股票详情弹窗 */}
      {selectedStock && (
        <StockDetailModalEnhanced
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
          onAddWatchlist={handleAddWatchlist}
        />
      )}
    </div>
  );
}
