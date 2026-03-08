import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Trash2, Plus, Folder, Edit2 } from 'lucide-react';
import { watchlistService } from '../services/watchlistService';
import { useAuth } from '../hooks/useAuth';
import { getStockPrices, searchStocks } from '../services/api';
import { StockDetailModalEnhanced } from '../components/StockDetailModalEnhanced';
import type { WatchlistItem } from '../types';
import type { Stock } from '../types';

interface PriceData {
  price: number;
  changePct: number;
}

// 预设分组
const PRESET_GROUPS = [
  { id: 'core', name: '核心关注', icon: '⭐', color: '#f59e0b' },
  { id: 'swing', name: '波段操作', icon: '📈', color: '#8b5cf6' },
  { id: 'longterm', name: '长期持有', icon: '💎', color: '#22c55e' },
  { id: 'watch', name: '观察列表', icon: '👀', color: '#6b7280' },
];

interface WatchlistGroup {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

const STORAGE_KEY = 'watchlist_groups';

export function WatchlistPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'addedAt' | 'code'>('addedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [searchResults, setSearchResults] = useState<Array<{code: string, name: string, market: string}>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // 分组相关状态
  const [groups, setGroups] = useState<WatchlistGroup[]>([...PRESET_GROUPS]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [showGroupSelector, setShowGroupSelector] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');

  // 加载分组
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const savedGroups = JSON.parse(saved);
      // 合并预设分组和自定义分组
      const combined = [...PRESET_GROUPS];
      savedGroups.forEach((g: WatchlistGroup) => {
        if (!PRESET_GROUPS.find(pg => pg.id === g.id)) {
          combined.push({
            ...g,
            icon: g.icon || '📁',
            color: g.color || '#6b7280',
          });
        }
      });
      setGroups(combined);
    }
  }, []);

  // 保存分组
  const saveGroups = (newGroups: WatchlistGroup[]) => {
    const customGroups = newGroups.filter(g => !PRESET_GROUPS.find(pg => pg.id === g.id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customGroups));
    setGroups(newGroups as typeof groups);
  };

  // 加载自选股
  const loadWatchlist = useCallback(() => {
    const items = watchlistService.getItems();
    setWatchlist(items);
  }, []);

  // 加载实时价格
  const loadPrices = useCallback(async () => {
    const items = watchlistService.getItems();
    if (items.length === 0) return;

    const codes = items.map(item => item.code);
    try {
      const priceData = await getStockPrices(codes);
      setPrices(priceData);
    } catch (error) {
      console.error('Failed to load prices:', error);
    }
  }, []);

  useEffect(() => {
    loadWatchlist();
    loadPrices();
  }, [loadWatchlist, loadPrices]);

  // 定时刷新价格（每30秒）
  useEffect(() => {
    const interval = setInterval(() => {
      loadPrices();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadPrices]);

  // 移除自选
  const handleRemove = (code: string) => {
    watchlistService.removeItem(code);
    loadWatchlist();
  };

  // 查看股票详情
  const handleStockClick = (item: WatchlistItem) => {
    const { price, changePct } = getStockPrice(item.code);
    setSelectedStock({
      code: item.code,
      name: item.name,
      market: item.market,
      price,
      changePct,
      change: price * (changePct / 100),
      sector: '-',
      industry: '-',
      volume: '-',
      turnover: '-',
      pe: 0,
      roe: 0,
      rsi: 50,
      macd: 'neutral',
      cap: '-',
      why: '点击查看更多分析',
      score: 65,
      timing: 'wait',
      timingText: '等待机会',
    } as Stock);
  };

  // 添加自定义分组
  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    const newGroup: WatchlistGroup = {
      id: `custom_${Date.now()}`,
      name: newGroupName.trim(),
    };
    saveGroups([...groups, newGroup]);
    setNewGroupName('');
  };

  // 删除自定义分组
  const handleDeleteGroup = (groupId: string) => {
    if (PRESET_GROUPS.find(g => g.id === groupId)) return; // 不允许删除预设分组
    saveGroups(groups.filter(g => g.id !== groupId));
    // 清除该分组下股票的分组标记
    const updatedWatchlist = watchlist.map(item => ({
      ...item,
      groupId: item.groupId === groupId ? undefined : item.groupId,
    }));
    updatedWatchlist.forEach(item => {
      watchlistService.updateItem(item.code, item);
    });
    loadWatchlist();
  };

  // 设置股票分组
  const handleSetStockGroup = (stockCode: string, groupId: string) => {
    const item = watchlist.find(i => i.code === stockCode);
    if (item) {
      watchlistService.updateItem(stockCode, { ...item, groupId });
      loadWatchlist();
    }
    setShowGroupSelector(null);
  };

  // 搜索和排序
  const filteredAndSorted = [...watchlist]
    .filter((item) => {
      // 搜索过滤
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase());

      // 分组过滤
      const matchesGroup = selectedGroup === 'all' || item.groupId === selectedGroup;

      return matchesSearch && matchesGroup;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'addedAt') {
        comparison = a.addedAt - b.addedAt;
      } else {
        comparison = a.code.localeCompare(b.code);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // 获取股票实时价格
  const getStockPrice = (code: string): { price: number; changePct: number } => {
    return prices[code] || { price: 0, changePct: 0 };
  };

  // 全市场股票搜索
  useEffect(() => {
    const searchAllStocks = async () => {
      if (searchQuery.trim().length >= 1) {
        setIsSearching(true);
        try {
          const results = await searchStocks(searchQuery);
          const watchlistCodes = new Set(watchlist.map(item => item.code));
          const filteredResults = results.filter(r => !watchlistCodes.has(r.code));
          setSearchResults(filteredResults.slice(0, 10));
          setShowSearchResults(true);
        } catch (error) {
          console.error('Search failed:', error);
          setSearchResults([]);
        }
        setIsSearching(false);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    };

    const timer = setTimeout(searchAllStocks, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, watchlist]);

  // 添加股票到自选
  const handleAddStock = async (stock: {code: string, name: string, market: string}) => {
    watchlistService.addItem({
      code: stock.code,
      name: stock.name,
      market: stock.market as 'SH' | 'SZ' | 'HK' | 'US' | 'FUND',
    });
    loadWatchlist();
    setSearchQuery('');
    setShowSearchResults(false);
  };

  // 按分组统计
  const getGroupStats = () => {
    const stats: Record<string, number> = { all: watchlist.length };
    groups.forEach(g => {
      stats[g.id] = watchlist.filter(item => item.groupId === g.id).length;
    });
    return stats;
  };

  const groupStats = getGroupStats();

  if (!isAuthenticated) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: 20,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 20 }}>⭐</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#fff' }}>
          登录后查看自选股
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24, textAlign: 'center' }}>
          添加你关注的股票，支持分组管理
        </p>
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '14px 32px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          立即登录
        </button>
      </div>
    );
  }

  return (
    <div onClick={() => setShowSearchResults(false)}>
      {/* 搜索栏 */}
      <div style={{ padding: '0 16px 16px', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '12px 16px',
          }}
        >
          <Search size={18} style={{ color: 'rgba(255, 255, 255, 0.3)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="搜索股票名称或代码"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSearchResults(searchQuery.length > 0)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: 14,
            }}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSearchResults(false);
              }}
              style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer' }}
            >
              <X size={16} style={{ color: 'rgba(255, 255, 255, 0.3)' }} />
            </button>
          )}
        </div>

        {/* 全市场搜索结果下拉 */}
        {showSearchResults && searchQuery && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '16px',
              right: '16px',
              marginTop: '8px',
              borderRadius: '12px',
              background: '#1e1f2a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
              zIndex: 100,
              maxHeight: '320px',
              overflow: 'auto',
            }}
          >
            {isSearching ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                搜索中...
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((stock) => (
                <div
                  key={stock.code}
                  onClick={() => handleAddStock(stock)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                      {stock.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                      {stock.code} · {stock.market === 'SH' || stock.market === 'SZ' ? 'A股' : stock.market === 'HK' ? '港股' : stock.market === 'US' ? '美股' : '基金'}
                    </div>
                  </div>
                  <Plus size={16} style={{ color: '#fbbf24' }} />
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                未找到匹配的股票
              </div>
            )}
          </div>
        )}
      </div>

      {/* 分组筛选栏 */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
            <button
              onClick={() => setSelectedGroup('all')}
              style={{
                padding: '8px 14px',
                borderRadius: 20,
                border: selectedGroup === 'all' ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                background: selectedGroup === 'all' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.03)',
                color: selectedGroup === 'all' ? '#f59e0b' : 'rgba(255,255,255,0.6)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              全部 ({groupStats.all})
            </button>
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 20,
                  border: selectedGroup === group.id ? `1px solid ${group.color || 'rgba(255,255,255,0.2)'}` : '1px solid rgba(255,255,255,0.1)',
                  background: selectedGroup === group.id ? `${group.color || 'rgba(255,255,255,0.1)'}20` : 'rgba(255,255,255,0.03)',
                  color: selectedGroup === group.id ? (group.color || '#fff') : 'rgba(255,255,255,0.6)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {group.icon && <span>{group.icon}</span>}
                {group.name} ({groupStats[group.id] || 0})
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowGroupManager(!showGroupManager)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: showGroupManager ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
              color: 'rgba(255,255,255,0.6)',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            <Edit2 size={14} />
          </button>
        </div>

        {/* 分组管理面板 */}
        {showGroupManager && (
          <div style={{
            padding: 16,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            marginTop: 12,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'rgba(255,255,255,0.7)' }}>
              管理分组
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {groups.map((group) => (
                <div
                  key={group.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{group.icon || '📁'}</span>
                    <span style={{ fontSize: 13, color: '#fff' }}>{group.name}</span>
                  </div>
                  {!PRESET_GROUPS.find(pg => pg.id === group.id) && (
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      style={{
                        padding: '4px',
                        borderRadius: 4,
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="新分组名称"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#fff',
                    fontSize: 12,
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleAddGroup}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#f59e0b',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 排序 */}
      {watchlist.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', padding: '0 16px 16px', overflowX: 'auto' }}>
          <button
            onClick={() => {
              if (sortBy === 'addedAt') {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy('addedAt');
                setSortOrder('desc');
              }
            }}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: sortBy === 'addedAt' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.03)',
              color: sortBy === 'addedAt' ? '#fbbf24' : 'rgba(255, 255, 255, 0.5)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            按添加时间 {sortBy === 'addedAt' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => {
              if (sortBy === 'code') {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy('code');
                setSortOrder('asc');
              }
            }}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: sortBy === 'code' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.03)',
              color: sortBy === 'code' ? '#fbbf24' : 'rgba(255, 255, 255, 0.5)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            按代码 {sortBy === 'code' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      )}

      {/* 自选股列表 */}
      {filteredAndSorted.length === 0 && !showSearchResults ? (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: 'rgba(255, 255, 255, 0.25)',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>
            {searchQuery ? '🔍' : '⭐'}
          </div>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
            {searchQuery ? '分组中无匹配股票' : '暂无自选股'}
          </div>
          <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 8 }}>
            {searchQuery ? '尝试选择其他分组或清空搜索' : '在上方搜索框输入股票名称或代码添加'}
          </div>
        </div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          {filteredAndSorted.map((item) => {
            const { price, changePct } = getStockPrice(item.code);
            const isUp = changePct >= 0;
            const itemGroup = groups.find(g => g.id === item.groupId);

            return (
              <div
                key={item.code}
                onClick={() => handleStockClick(item)}
                style={{
                  margin: '0 0 14px',
                  padding: '16px 18px',
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.015))',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>
                        {item.name}
                      </div>
                      {itemGroup && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 10,
                          fontSize: 10,
                          background: `${itemGroup.color || 'rgba(255,255,255,0.1)'}30`,
                          color: itemGroup.color || 'rgba(255,255,255,0.6)',
                        }}>
                          {itemGroup.icon} {itemGroup.name}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'rgba(255, 255, 255, 0.3)',
                        fontFamily: 'monospace',
                        marginBottom: 8,
                      }}
                    >
                      {item.code} · {item.market === 'SH' || item.market === 'SZ' ? '沪深' : item.market === 'HK' ? '港股' : item.market === 'US' ? '美股' : '基金'}
                    </div>
                  </div>

                  {/* 价格和涨跌幅 */}
                  <div style={{ textAlign: 'right', marginRight: 16 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'monospace' }}>
                      {price.toFixed(2)}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        color: isUp ? '#ef4444' : '#22c55e',
                      }}
                    >
                      {isUp ? '+' : ''}
                      {changePct.toFixed(2)}%
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowGroupSelector(showGroupSelector === item.code ? null : item.code);
                      }}
                      style={{
                        padding: '6px',
                        borderRadius: 6,
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        background: showGroupSelector === item.code ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)',
                        color: '#f59e0b',
                        cursor: 'pointer',
                      }}
                    >
                      <Folder size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(item.code);
                      }}
                      style={{
                        padding: '6px',
                        borderRadius: 6,
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* 分组选择器 */}
                {showGroupSelector === item.code && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: 8,
                      borderRadius: 8,
                      background: '#1e1f2a',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                      zIndex: 50,
                      minWidth: 140,
                    }}
                  >
                    <div
                      onClick={() => handleSetStockGroup(item.code, 'all')}
                      style={{
                        padding: '10px 14px',
                        fontSize: 12,
                        color: '#fff',
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      📁 移除分组
                    </div>
                    {groups.map((group) => (
                      <div
                        key={group.id}
                        onClick={() => handleSetStockGroup(item.code, group.id)}
                        style={{
                          padding: '10px 14px',
                          fontSize: 12,
                          color: group.color || '#fff',
                          cursor: 'pointer',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                        }}
                      >
                        {group.icon} {group.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 股票详情弹窗 */}
      {selectedStock && (
        <StockDetailModalEnhanced
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
          onAddWatchlist={() => {}}
          isInWatchlist={true}
        />
      )}
    </div>
  );
}
