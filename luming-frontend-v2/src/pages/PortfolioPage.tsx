import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, TrendingUp, TrendingDown, Sparkles, X, Edit2, Crown, BookOpen, Target, ChevronLeft, ChevronDown, ChevronUp, ArrowRightLeft } from 'lucide-react';
import { portfolioService } from '../services/portfolioService';
import { profitHistoryService } from '../services/profitHistoryService';
import { useAuth } from '../hooks/useAuth';
import { useMembership } from '../hooks/useMembership';
import { getStockPrices, searchStocks, getStockRecommendations } from '../services/api';
import { AIDiagnosisModal } from '../components/AIDiagnosisModal';
import { PortfolioCharts } from '../components/PortfolioCharts';
import { SimulatedTradingPage } from './SimulatedTradingPage';
import type { Holding, HoldingAnalysis } from '../types';
import type { Stock } from '../types/stock';

export function PortfolioPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { features } = useMembership();

  // 选项卡状态
  type TabType = 'real' | 'simulated';
  const [activeTab, setActiveTab] = useState<TabType>('real');

  const [, setHoldings] = useState<Holding[]>([]);
  const [analyzedHoldings, setAnalyzedHoldings] = useState<HoldingAnalysis[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAIDiagnosis, setShowAIDiagnosis] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [totalStats, setTotalStats] = useState({
    totalValue: 0,
    totalCost: 0,
    totalProfit: 0,
    totalProfitPct: 0,
    dailyProfit: 0,
    dailyProfitPct: 0,
  });

  // 止盈止损相关状态
  type StopLimit = { stopProfit: number | null; stopLoss: number | null };
  const STOP_LIMITS_KEY = 'lm_stop_limits';
  const [stopLimits, setStopLimits] = useState<Record<string, StopLimit>>(() => {
    try { return JSON.parse(localStorage.getItem(STOP_LIMITS_KEY) || '{}'); } catch { return {}; }
  });
  const [stopLimitHolding, setStopLimitHolding] = useState<HoldingAnalysis | null>(null);
  const [stopProfitInput, setStopProfitInput] = useState('');
  const [stopLossInput, setStopLossInput] = useState('');

  // 股票搜索相关状态
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{code: string, name: string, market: string}>>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedStock, setSelectedStock] = useState<{code: string, name: string, market: string} | null>(null);

  // 交易日记相关状态
  const [createDiary, setCreateDiary] = useState(false);
  const [diaryReason, setDiaryReason] = useState('');

  // 编辑模式状态
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null);
  const [editSearchQuery, setEditSearchQuery] = useState('');
  const [editSearchResults, setEditSearchResults] = useState<Array<{code: string, name: string, market: string}>>([]);
  const [editShowDropdown, setEditShowDropdown] = useState(false);
  const [editSelectedStock, setEditSelectedStock] = useState<{code: string, name: string, market: string} | null>(null);

  // AI评分状态
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiLoading, setAILoading] = useState(false);
  const [aiStocks, setAIStocks] = useState<Stock[]>([]);

  // AI评分数据加载
  const loadAIScores = useCallback(async () => {
    if (aiStocks.length > 0) {
      setShowAIPanel(prev => !prev);
      return;
    }
    setShowAIPanel(true);
    setAILoading(true);
    try {
      const [a, hk, us] = await Promise.all([
        getStockRecommendations('A'),
        getStockRecommendations('HK'),
        getStockRecommendations('US'),
      ]);
      setAIStocks([...a, ...hk, ...us].sort((a, b) => (b.score || 0) - (a.score || 0)));
    } catch (err) {
      console.error('AI scores load failed:', err);
    }
    setAILoading(false);
  }, [aiStocks.length]);

  // AI调仓建议数据
  const aiAdvisorData = useMemo(() => {
    if (aiStocks.length === 0 || analyzedHoldings.length === 0) return null;

    const holdingScores = analyzedHoldings.map(h => {
      const idx = aiStocks.findIndex(s => s.code === h.code);
      return {
        code: h.code,
        name: h.name,
        market: h.market,
        aiScore: idx >= 0 ? (aiStocks[idx].score || 0) : 0,
        rank: idx >= 0 ? idx + 1 : 999,
        timing: idx >= 0 ? aiStocks[idx].timingText : undefined,
      };
    }).sort((a, b) => a.rank - b.rank);

    const avgScore = holdingScores.length > 0
      ? Math.round(holdingScores.reduce((s, h) => s + h.aiScore, 0) / holdingScores.length)
      : 0;

    const weakHoldings = holdingScores.filter(h => h.rank > 10);
    const holdingCodes = new Set(analyzedHoldings.map(h => h.code));
    const topRecommendations = aiStocks
      .filter(s => !holdingCodes.has(s.code) && (s.score || 0) > avgScore)
      .slice(0, 5);
    const topAvgScore = topRecommendations.length > 0
      ? Math.round(topRecommendations.reduce((s, h) => s + (h.score || 0), 0) / topRecommendations.length)
      : 0;

    return { holdingScores, avgScore, weakHoldings, topRecommendations, topAvgScore, totalStocks: aiStocks.length };
  }, [aiStocks, analyzedHoldings]);

  // 加载持仓
  const loadHoldings = useCallback(async () => {
    const items = portfolioService.getHoldings();
    setHoldings(items);
    // eslint-disable-next-line react-hooks/immutability
    await calculateStats(items);
  }, []);

  useEffect(() => {
    loadHoldings();
  }, [loadHoldings]);

  // 股票搜索
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query || query.length < 1) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const results = await searchStocks(query);
    setSearchResults(results);
    setShowDropdown(results.length > 0);
  };

  // 选择搜索结果
  const handleSelectStock = (stock: {code: string, name: string, market: string}) => {
    setSelectedStock(stock);
    setSearchQuery(`${stock.code} - ${stock.name}`);
    setShowDropdown(false);
    setSearchResults([]);
  };

  // 清空选择
  const handleClearSelection = () => {
    setSelectedStock(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  // 编辑模式搜索
  const handleEditSearch = async (query: string) => {
    setEditSearchQuery(query);

    if (!query || query.length < 1) {
      setEditSearchResults([]);
      setEditShowDropdown(false);
      return;
    }

    const results = await searchStocks(query);
    setEditSearchResults(results);
    setEditShowDropdown(results.length > 0);
  };

  // 选择编辑模式股票
  const handleEditSelectStock = (stock: {code: string, name: string, market: string}) => {
    setEditSelectedStock(stock);
    setEditSearchQuery(`${stock.code} - ${stock.name}`);
    setEditShowDropdown(false);
    setEditSearchResults([]);
  };

  // 开始编辑
  const handleStartEdit = (holding: Holding) => {
    setEditingHolding(holding);
    setEditSelectedStock({ code: holding.code, name: holding.name, market: holding.market });
    setEditSearchQuery(`${holding.code} - ${holding.name}`);
    setShowAddForm(false);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingHolding(null);
    setEditSelectedStock(null);
    setEditSearchQuery('');
    setEditSearchResults([]);
    setEditShowDropdown(false);
  };

  // 保存编辑
  const handleSaveEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editingHolding || !editSelectedStock) {
      return;
    }

    const formData = new FormData(e.currentTarget);

    portfolioService.updateHolding(editingHolding.id, {
      code: editSelectedStock.code,
      name: editSelectedStock.name,
      market: editSelectedStock.market as any,
      costPrice: Number(formData.get('costPrice')),
      quantity: Number(formData.get('quantity')),
      purchaseDate: formData.get('purchaseDate') as string,
    });

    // 重置编辑状态
    setEditingHolding(null);
    setEditSelectedStock(null);
    setEditSearchQuery('');
    setEditSearchResults([]);
    setEditShowDropdown(false);
    loadHoldings();
  };

  // 计算统计
  const calculateStats = async (items: Holding[]) => {
    if (items.length === 0) {
      setAnalyzedHoldings([]);
      setTotalStats({
        totalValue: 0,
        totalCost: 0,
        totalProfit: 0,
        totalProfitPct: 0,
        dailyProfit: 0,
        dailyProfitPct: 0,
      });
      return;
    }

    let totalValue = 0;
    let totalCost = 0;
    let totalDailyProfit = 0;

    // 获取实时价格
    const codes = items.map(item => item.code);
    let priceData: Record<string, { price: number; changePct: number }> = {};

    try {
      priceData = await getStockPrices(codes);
    } catch (error) {
      console.error('Failed to load prices:', error);
    }

    const analyzed: HoldingAnalysis[] = items.map((holding) => {
      // 使用API返回的价格，如果没有则使用成本价
      const stockPrice = priceData[holding.code];
      const apiPrice = stockPrice?.price;
      const changePct = stockPrice?.changePct ?? 0;

      // 确保价格是有效数字
      let currentPrice = holding.costPrice;
      if (apiPrice != null && !isNaN(apiPrice) && apiPrice > 0) {
        currentPrice = apiPrice;
      }

      // 昨收价：由 changePct 反推（changePct = (current - prev) / prev * 100）
      const prevClose = (changePct !== 0 && currentPrice > 0)
        ? currentPrice / (1 + changePct / 100)
        : currentPrice;

      const costValue = (holding.costPrice || 0) * (holding.quantity || 0);
      const quantity = holding.quantity || 0;
      const currentValue = currentPrice * quantity;
      const profit = currentValue - costValue;
      const profitPct = costValue > 0 ? (profit / costValue) * 100 : 0;
      const dailyProfit = (currentPrice - prevClose) * quantity;
      const dailyProfitPct = prevClose > 0 ? ((currentPrice - prevClose) / prevClose) * 100 : 0;

      totalValue += currentValue;
      totalCost += costValue;
      totalDailyProfit += dailyProfit;

      return {
        ...holding,
        currentPrice,
        currentValue,
        costValue,
        profit,
        profitPct,
        prevClose,
        dailyProfit,
        dailyProfitPct,
      };
    });

    setAnalyzedHoldings(analyzed);
    const totalDailyPrevValue = totalValue - totalDailyProfit;
    const newStats = {
      totalValue,
      totalCost,
      totalProfit: totalValue - totalCost,
      totalProfitPct: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
      dailyProfit: totalDailyProfit,
      dailyProfitPct: totalDailyPrevValue > 0 ? (totalDailyProfit / totalDailyPrevValue) * 100 : 0,
    };
    setTotalStats(newStats);

    // 记录投资组合快照（用于收益曲线图）
    if (items.length > 0) {
      profitHistoryService.recordPortfolioState({
        ...newStats,
        holdingsCount: items.length,
      });
    }
  };

  // 添加持仓
  const handleAddHolding = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 检查是否选择了股票
    if (!selectedStock) {
      alert('请先搜索并选择股票');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const costPrice = Number(formData.get('costPrice'));
    const quantity = Number(formData.get('quantity'));
    const purchaseDate = formData.get('purchaseDate') as string || new Date().toISOString().split('T')[0];

    portfolioService.addHolding({
      code: selectedStock.code,
      name: selectedStock.name,
      market: selectedStock.market as any,
      costPrice,
      quantity,
      purchaseDate,
    });

    // 如果勾选了创建交易日记，则保存日记
    if (createDiary && diaryReason.trim()) {
      const STORAGE_KEY = 'trading_diary';
      const saved = localStorage.getItem(STORAGE_KEY);
      const entries = saved ? JSON.parse(saved) : [];

      const newEntry = {
        id: `${Date.now()}`,
        date: new Date().toISOString(),
        type: 'buy',
        stock: {
          code: selectedStock.code,
          name: selectedStock.name,
          market: selectedStock.market,
        },
        price: costPrice,
        quantity,
        amount: costPrice * quantity,
        reason: diaryReason.trim(),
        analysis: '',
        expectation: '',
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify([newEntry, ...entries]));
    }

    // 重置表单和状态
    setShowAddForm(false);
    setSelectedStock(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    setCreateDiary(false);
    setDiaryReason('');
    loadHoldings();
    e.currentTarget.reset();
  };

  // 删除持仓
  const handleRemoveHolding = (id: string) => {
    portfolioService.removeHolding(id);
    loadHoldings();
  };

  // AI智能诊断
  const handleAIDiagnosis = () => {
    // 检查是否为会员
    if (!features.aiPortfolioAnalysis) {
      setShowUpgradeModal(true);
      return;
    }
    setShowAIDiagnosis(true);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>💼</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#fff' }}>登录后查看持仓</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24, textAlign: 'center' }}>
          记录你的投资组合，AI智能诊断
        </p>
        <button onClick={() => navigate('/login')} style={{ padding: '14px 32px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>立即登录</button>
      </div>
    );
  }

  // 真实持仓模式和模拟交易模式
  return (
    <div>
      {/* 选项卡切换 - 始终显示 */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{
          display: 'flex',
          padding: '4px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <button
            onClick={() => setActiveTab('real' as TabType)}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              background: (activeTab as string) === 'real'
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : 'transparent',
              color: (activeTab as string) === 'real' ? '#fff' : 'rgba(255,255,255,0.5)',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
          >
            💼 真实持仓
          </button>
          <button
            onClick={() => setActiveTab('simulated' as TabType)}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              background: (activeTab as string) === 'simulated'
                ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                : 'transparent',
              color: (activeTab as string) === 'simulated' ? '#fff' : 'rgba(255,255,255,0.5)',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
          >
            🎮 模拟交易
          </button>
        </div>
      </div>

      {/* 根据activeTab显示不同内容 */}
      {(activeTab as string) === 'simulated' ? (
        <SimulatedTradingPage />
      ) : (
        <>
      {/* 以下是真实持仓模式的内容 */}

      {/* 总览卡片 */}
      <div style={{ padding: '0 16px 20px' }}>
        <div style={{ padding: '20px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(139, 92, 246, 0.05))', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <div style={{ fontSize: 13, color: '#a5b4fc', marginBottom: 12 }}>我的持仓总览</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>总市值</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>¥{totalStats.totalValue.toFixed(2)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>总收益</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: totalStats.totalProfit >= 0 ? '#ef4444' : '#22c55e' }}>
                {totalStats.totalProfit >= 0 ? '+' : ''}¥{totalStats.totalProfit.toFixed(2)}
              </div>
              <div style={{ fontSize: 12, color: totalStats.totalProfitPct >= 0 ? '#ef4444' : '#22c55e' }}>
                ({totalStats.totalProfitPct >= 0 ? '+' : ''}{totalStats.totalProfitPct.toFixed(2)}%)
              </div>
            </div>
          </div>
          {/* 今日盈亏 */}
          <div style={{ paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>今日持仓盈亏</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: totalStats.dailyProfit >= 0 ? '#ef4444' : '#22c55e' }}>
                {totalStats.dailyProfit >= 0 ? '+' : ''}¥{totalStats.dailyProfit.toFixed(2)}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: totalStats.dailyProfit >= 0 ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)', color: totalStats.dailyProfit >= 0 ? '#ef4444' : '#22c55e' }}>
                {totalStats.dailyProfit >= 0 ? '+' : ''}{totalStats.dailyProfitPct.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI智能诊断按钮 */}
      {analyzedHoldings.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <button
            onClick={handleAIDiagnosis}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 12,
              border: '1px solid rgba(245, 158, 11, 0.3)',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(139, 92, 246, 0.08))',
              color: '#a5b4fc',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(139, 92, 246, 0.15))';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(139, 92, 246, 0.08))';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Sparkles size={20} />
            AI智能诊断
          </button>
        </div>
      )}

      {/* AI智能调仓建议 */}
      {analyzedHoldings.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <button
            onClick={loadAIScores}
            disabled={aiLoading}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              background: showAIPanel
                ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.15))'
                : 'rgba(139, 92, 246, 0.08)',
              border: `1px solid ${showAIPanel ? 'rgba(139, 92, 246, 0.4)' : 'rgba(139, 92, 246, 0.2)'}`,
              color: '#a78bfa',
              fontSize: 14,
              fontWeight: 600,
              cursor: aiLoading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ArrowRightLeft size={16} />
              {aiLoading ? 'AI评分加载中...' : 'AI智能调仓建议'}
            </span>
            {!aiLoading && (showAIPanel ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
          </button>

          {showAIPanel && aiAdvisorData && (
            <div style={{
              marginTop: 12,
              padding: '16px',
              borderRadius: '14px',
              background: 'rgba(139, 92, 246, 0.05)',
              border: '1px solid rgba(139, 92, 246, 0.15)',
            }}>
              {/* 持仓健康度 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                padding: '12px',
                borderRadius: '10px',
                background: 'rgba(139, 92, 246, 0.1)',
              }}>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>持仓平均评分</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: aiAdvisorData.avgScore >= 70 ? '#a78bfa' : '#f59e0b' }}>
                    {aiAdvisorData.avgScore}
                    <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>/ 100</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>推荐组合均分</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#22c55e' }}>
                    {aiAdvisorData.topAvgScore}
                    <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>/ 100</span>
                  </div>
                </div>
              </div>

              {/* 当前持仓评分 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
                  当前持仓评分排名
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {aiAdvisorData.holdingScores.map(h => {
                    const isWeak = h.rank > 10;
                    const scoreColor = h.aiScore >= 75 ? '#a78bfa' : h.aiScore >= 65 ? '#f59e0b' : '#ef4444';
                    return (
                      <div key={h.code} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: isWeak ? 'rgba(239, 68, 68, 0.06)' : 'rgba(34, 197, 94, 0.06)',
                        border: `1px solid ${isWeak ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)'}`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: `conic-gradient(${scoreColor} ${h.aiScore * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%', background: '#1a1b1e',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 700, color: scoreColor,
                            }}>
                              {h.aiScore}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{h.name}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                              {h.code} · 排名 #{h.rank}/{aiAdvisorData.totalStocks}
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 500, color: isWeak ? '#f87171' : '#4ade80' }}>
                          {isWeak ? '建议换仓' : '继续持有'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 推荐 */}
              {aiAdvisorData.topRecommendations.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={12} />
                    高分股推荐（未持有）
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {aiAdvisorData.topRecommendations.map(stock => {
                      const globalRank = aiStocks.findIndex(s => s.code === stock.code) + 1;
                      const scoreColor = (stock.score || 0) >= 75 ? '#a78bfa' : '#f59e0b';
                      const ml = stock.market === 'HK' ? '港' : stock.market === 'US' ? '美' : 'A';
                      return (
                        <div key={stock.code} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: 'rgba(139, 92, 246, 0.06)',
                          border: '1px solid rgba(139, 92, 246, 0.12)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 24, height: 24, borderRadius: '6px',
                              background: 'rgba(139, 92, 246, 0.3)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 700, color: '#c4b5fd',
                            }}>
                              {globalRank}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
                                {stock.name}
                                <span style={{
                                  fontSize: 9, padding: '1px 4px', borderRadius: 4,
                                  background: ml === '美' ? 'rgba(59,130,246,0.2)' : ml === '港' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                                  color: ml === '美' ? '#60a5fa' : ml === '港' ? '#f87171' : '#fbbf24',
                                }}>
                                  {ml}
                                </span>
                              </div>
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                                {stock.code} · ¥{stock.price.toFixed(2)}
                              </div>
                            </div>
                          </div>
                          <span style={{ fontSize: 16, fontWeight: 700, color: scoreColor }}>
                            {stock.score}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 1.6 }}>
                基于AI多因子评分引擎（估值·成长·质量·技术·情绪·波动）
              </div>
            </div>
          )}
        </div>
      )}

      {/* 数据分析图表 - 仅在有持仓时显示 */}
      {analyzedHoldings.length > 0 && (
        <PortfolioCharts holdings={analyzedHoldings} />
      )}

      {/* 添加持仓按钮 */}
      {!showAddForm && (
        <div style={{ padding: '0 16px 16px', display: 'flex', gap: 12 }}>
          <button onClick={() => setShowAddForm(true)} style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1px dashed rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.05)', color: '#a5b4fc', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Plus size={18} /> 添加持仓
          </button>
          <button
            onClick={() => navigate('/diary/real')}
            style={{
              padding: '14px',
              borderRadius: 12,
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              color: '#f59e0b',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <BookOpen size={18} />
            交易日记
          </button>
        </div>
      )}

      {/* 添加持仓表单 */}
      {showAddForm && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ padding: 16, borderRadius: 12, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#fff' }}>添加持仓</h3>
            <form onSubmit={handleAddHolding}>
              {/* 股票搜索 */}
              <div style={{ marginBottom: 12, position: 'relative' }}>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>搜索股票（代码或名称）</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="输入代码或名称搜索，如: 600519 或 贵州茅台"
                    autoComplete="off"
                    style={{
                      width: '100%',
                      padding: selectedStock ? '10px 36px 10px 12px' : '10px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: selectedStock ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255,255,255,0.04)',
                      color: '#fff',
                      fontSize: 14,
                      paddingRight: selectedStock ? '36px' : '12px',
                    }}
                  />
                  {selectedStock && (
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        padding: 4,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <X size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
                    </button>
                  )}
                </div>

                {/* 搜索下拉结果 */}
                {showDropdown && searchResults.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: 4,
                      borderRadius: 8,
                      background: 'rgba(20, 20, 30, 0.98)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                      zIndex: 1000,
                      maxHeight: '240px',
                      overflowY: 'auto',
                    }}
                  >
                    {searchResults.map((stock, index) => (
                      <div
                        key={index}
                        onClick={() => handleSelectStock(stock)}
                        style={{
                          padding: '12px 16px',
                          borderBottom: index < searchResults.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
                            {stock.name}
                          </div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                            {stock.code}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            padding: '4px 8px',
                            borderRadius: 4,
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#fbbf24',
                            fontWeight: 500,
                          }}
                        >
                          {stock.market === 'SH' || stock.market === 'SZ' ? '沪深' : stock.market === 'HK' ? '港股' : stock.market === 'US' ? '美股' : '基金'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 已选股票信息 */}
              {selectedStock && (
                <div style={{ marginBottom: 12, padding: '12px', borderRadius: 8, background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>已选择</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{selectedStock.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', marginTop: 2 }}>
                    {selectedStock.code} · {selectedStock.market === 'SH' || selectedStock.market === 'SZ' ? '沪深' : selectedStock.market === 'HK' ? '港股' : selectedStock.market === 'US' ? '美股' : '基金'}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>成本价</label>
                  <input name="costPrice" type="number" step="0.01" required placeholder="0.00" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>持有数量</label>
                  <input name="quantity" type="number" required placeholder="100" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14 }} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>买入日期</label>
                <input name="purchaseDate" type="date" required style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14 }} />
              </div>

              {/* 交易日记选项 */}
              <div style={{ marginBottom: 16, padding: '12px', borderRadius: 8, background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={createDiary}
                    onChange={(e) => {
                      setCreateDiary(e.target.checked);
                      if (!e.target.checked) {
                        setDiaryReason('');
                      }
                    }}
                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                  />
                  <BookOpen size={16} style={{ color: '#f59e0b' }} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                    同时创建交易日记
                  </span>
                </label>
                {createDiary && (
                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>
                      📝 交易理由（必填）
                    </label>
                    <textarea
                      value={diaryReason}
                      onChange={(e) => setDiaryReason(e.target.value)}
                      placeholder="记录为什么买入这只股票，看好什么因素..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.04)',
                        color: '#fff',
                        fontSize: 13,
                        resize: 'vertical',
                        outline: 'none',
                      }}
                    />
                    <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                        方便日后复盘交易决策
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate('/diary/real')}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 6,
                          background: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          color: '#f59e0b',
                          fontSize: 11,
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        查看我的日记
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>确认添加</button>
                <button type="button" onClick={() => { setShowAddForm(false); setSelectedStock(null); setSearchQuery(''); setSearchResults([]); setShowDropdown(false); setCreateDiary(false); setDiaryReason(''); }} style={{ flex: 1, padding: '12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>取消</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 持仓列表 */}
      {analyzedHoldings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(255, 255, 255, 0.25)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💼</div>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>暂无持仓</div>
          <div style={{ fontSize: 13, opacity: 0.6 }}>添加你的第一笔投资</div>
        </div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          {analyzedHoldings.map((holding) => {
            // 确保所有数值都是安全的
            const safeCurrentValue = holding.currentValue ?? 0;
            const safeProfit = holding.profit ?? 0;
            const safeProfitPct = holding.profitPct ?? 0;
            const safeDailyProfit = holding.dailyProfit ?? 0;
            const safeDailyPct = holding.dailyProfitPct ?? 0;
            const isUp = safeProfitPct >= 0;
            const isDailyUp = safeDailyProfit >= 0;
            const currentPrice = holding.currentPrice ?? 0;
            const sl = stopLimits[holding.id];
            const hitStopProfit = sl?.stopProfit != null && currentPrice >= sl.stopProfit;
            const hitStopLoss = sl?.stopLoss != null && currentPrice <= sl.stopLoss;

            return (
              <div key={holding.id} style={{ marginBottom: 16, padding: '18px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.015))', border: `1px solid ${hitStopProfit ? 'rgba(239,68,68,0.4)' : hitStopLoss ? 'rgba(34,197,94,0.4)' : 'rgba(255, 255, 255, 0.06)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{holding.name}</div>
                      {(() => {
                        const scored = aiStocks.find(s => s.code === holding.code);
                        if (!scored) return null;
                        const sc = scored.score || 0;
                        const cl = sc >= 75 ? '#a78bfa' : sc >= 65 ? '#f59e0b' : '#ef4444';
                        return (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: `${cl}22`, color: cl }}>
                            {sc}分
                          </span>
                        );
                      })()}
                      {hitStopProfit && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                          ⚡止盈触发
                        </span>
                      )}
                      {hitStopLoss && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
                          ⚡止损触发
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', marginBottom: 8 }}>{holding.code} · {holding.market}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                      {holding.quantity}股 × ¥{(holding.costPrice || 0).toFixed(2)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => {
                        setStopLimitHolding(holding);
                        const existing = stopLimits[holding.id];
                        setStopProfitInput(existing?.stopProfit != null ? String(existing.stopProfit) : '');
                        setStopLossInput(existing?.stopLoss != null ? String(existing.stopLoss) : '');
                      }}
                      title="止盈止损"
                      style={{ padding: '6px', borderRadius: 6, border: '1px solid rgba(168, 85, 247, 0.3)', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', cursor: 'pointer' }}
                    >
                      <Target size={14} />
                    </button>
                    <button onClick={() => handleStartEdit(holding)} style={{ padding: '6px', borderRadius: 6, border: '1px solid rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', cursor: 'pointer' }}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleRemoveHolding(holding.id)} style={{ padding: '6px', borderRadius: 6, border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* 止盈止损价格提示 */}
                {(sl?.stopProfit != null || sl?.stopLoss != null) && (
                  <div style={{ display: 'flex', gap: 12, marginBottom: 10, padding: '6px 10px', borderRadius: 8, background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.12)' }}>
                    {sl?.stopProfit != null && (
                      <div style={{ fontSize: 11, color: '#ef4444' }}>
                        止盈 <span style={{ fontWeight: 700 }}>¥{sl.stopProfit}</span>
                      </div>
                    )}
                    {sl?.stopLoss != null && (
                      <div style={{ fontSize: 11, color: '#22c55e' }}>
                        止损 <span style={{ fontWeight: 700 }}>¥{sl.stopLoss}</span>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>当前市值</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>¥{safeCurrentValue.toFixed(2)}</div>
                    <div style={{ fontSize: 11, color: isDailyUp ? '#ef4444' : '#22c55e', marginTop: 2 }}>
                      今日 {isDailyUp ? '+' : ''}¥{safeDailyProfit.toFixed(2)} ({isDailyUp ? '+' : ''}{safeDailyPct.toFixed(2)}%)
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>持仓收益</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: isUp ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      {safeProfit >= 0 ? '+' : ''}¥{safeProfit.toFixed(2)}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: isUp ? '#22c55e' : '#ef4444' }}>
                      ({isUp ? '+' : ''}{safeProfitPct.toFixed(2)}%)
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI诊断弹窗 */}
      {showAIDiagnosis && (
        <AIDiagnosisModal
          holdings={analyzedHoldings}
          totalStats={totalStats}
          onClose={() => setShowAIDiagnosis(false)}
        />
      )}

      {/* 止盈止损弹窗 */}
      {stopLimitHolding && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: 20,
          }}
        >
          <div
            style={{
              maxWidth: 380, width: '100%', padding: '24px',
              borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.98), rgba(20, 20, 30, 0.98))',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
              <button
                onClick={() => setStopLimitHolding(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px 4px 0', color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}
              >
                <ChevronLeft size={16} /> 返回真实持仓
              </button>
              <div style={{ flex: 1 }} />
              <Target size={18} style={{ color: '#a855f7' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{stopLimitHolding.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                当前价 ¥{(stopLimitHolding.currentPrice ?? 0).toFixed(2)} · 成本价 ¥{stopLimitHolding.costPrice.toFixed(2)}
              </div>
            </div>
            <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 8, background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.12)', fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
              设置目标价位，触及时持仓卡片将显示提醒标记
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#ef4444', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                止盈价（高于此价触发）
              </label>
              <input
                type="number" step="0.01" value={stopProfitInput}
                onChange={(e) => setStopProfitInput(e.target.value)}
                placeholder="不设置请留空"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.04)', color: '#fff', fontSize: 14 }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, color: '#22c55e', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                止损价（低于此价触发）
              </label>
              <input
                type="number" step="0.01" value={stopLossInput}
                onChange={(e) => setStopLossInput(e.target.value)}
                placeholder="不设置请留空"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.04)', color: '#fff', fontSize: 14 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => {
                  const updated = {
                    ...stopLimits,
                    [stopLimitHolding.id]: {
                      stopProfit: stopProfitInput !== '' ? Number(stopProfitInput) : null,
                      stopLoss: stopLossInput !== '' ? Number(stopLossInput) : null,
                    },
                  };
                  setStopLimits(updated);
                  localStorage.setItem(STOP_LIMITS_KEY, JSON.stringify(updated));
                  setStopLimitHolding(null);
                }}
                style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #a855f7, #7c3aed)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                保存设置
              </button>
              {(stopLimits[stopLimitHolding.id]?.stopProfit != null || stopLimits[stopLimitHolding.id]?.stopLoss != null) && (
                <button
                  onClick={() => {
                    const updated = { ...stopLimits };
                    delete updated[stopLimitHolding.id];
                    setStopLimits(updated);
                    localStorage.setItem(STOP_LIMITS_KEY, JSON.stringify(updated));
                    setStopLimitHolding(null);
                  }}
                  style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer' }}
                >
                  清除
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 升级专业版弹窗 */}
      {showUpgradeModal && (
        <div
          onClick={() => setShowUpgradeModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 360,
              width: '100%',
              padding: '28px 24px',
              borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.98), rgba(20, 20, 30, 0.98))',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Crown size={40} style={{ marginBottom: 16, color: '#fbbf24' }} />
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: '#fff' }}>专业版专属功能</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                AI智能诊断是专业版专属功能，升级专业版即可获得专业投资建议
              </p>
            </div>

            <div style={{ marginBottom: 24, padding: '16px', borderRadius: 12, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
              <div style={{ fontSize: 12, color: '#a5b4fc', marginBottom: 12, fontWeight: 600 }}>专业版特权</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['AI智能诊断持仓', '无限次查看股票详情', '模拟交易功能', '实时数据推送'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                    <span style={{ color: '#ef4444', fontSize: 14 }}>✓</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  window.location.href = '/member';
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
                }}
              >
                立即升级
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                再看看
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑持仓模态框 */}
      {editingHolding && (
        <div
          onClick={() => handleCancelEdit()}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
            overflowY: 'auto',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 420,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.98), rgba(20, 20, 30, 0.98))',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#fff', textAlign: 'center' }}>编辑持仓</h3>

            <form onSubmit={handleSaveEdit}>
              {/* 股票搜索 */}
              <div style={{ marginBottom: 16, position: 'relative' }}>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>搜索股票（代码或名称）</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={editSearchQuery}
                    onChange={(e) => handleEditSearch(e.target.value)}
                    placeholder="输入代码或名称搜索"
                    autoComplete="off"
                    style={{
                      width: '100%',
                      padding: editSelectedStock ? '10px 36px 10px 12px' : '10px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: editSelectedStock ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255,255,255,0.04)',
                      color: '#fff',
                      fontSize: 14,
                    }}
                  />
                  {editSelectedStock && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditSelectedStock(null);
                        setEditSearchQuery('');
                        setEditSearchResults([]);
                        setEditShowDropdown(false);
                      }}
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        padding: 4,
                        cursor: 'pointer',
                      }}
                    >
                      <X size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
                    </button>
                  )}
                </div>

                {/* 搜索下拉结果 */}
                {editShowDropdown && editSearchResults.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: 4,
                      borderRadius: 8,
                      background: 'rgba(20, 20, 30, 0.98)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                      zIndex: 1000,
                      maxHeight: '200px',
                      overflowY: 'auto',
                    }}
                  >
                    {editSearchResults.map((stock, index) => (
                      <div
                        key={index}
                        onClick={() => handleEditSelectStock(stock)}
                        style={{
                          padding: '12px 16px',
                          borderBottom: index < editSearchResults.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
                            {stock.name}
                          </div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                            {stock.code}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            padding: '4px 8px',
                            borderRadius: 4,
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#fbbf24',
                            fontWeight: 500,
                          }}
                        >
                          {stock.market === 'SH' || stock.market === 'SZ' ? '沪深' : stock.market === 'HK' ? '港股' : stock.market === 'US' ? '美股' : '基金'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>成本价</label>
                  <input
                    name="costPrice"
                    type="number"
                    step="0.01"
                    required
                    defaultValue={editingHolding.costPrice}
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.04)',
                      color: '#fff',
                      fontSize: 14,
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>持有数量</label>
                  <input
                    name="quantity"
                    type="number"
                    required
                    defaultValue={editingHolding.quantity}
                    placeholder="100"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.04)',
                      color: '#fff',
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>买入日期</label>
                <input
                  name="purchaseDate"
                  type="date"
                  required
                  defaultValue={editingHolding.purchaseDate}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#fff',
                    fontSize: 14,
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  保存修改
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
