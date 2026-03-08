import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { TrendingUp, TrendingDown, DollarSign, History, Plus, Minus, RefreshCw, Target, Bell, BookOpen, Sparkles, ArrowRightLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { searchStocks, getStockDetailRealtime, getStockPrices, getStockRecommendations } from '../services/api';
import { calculateTradingCost, checkTradingRules } from '../services/tradingCosts';
import { schedulePush } from '../services/syncService';
import type { Stock } from '../types/stock';

// 简化的股票搜索结果类型
interface SimpleStock {
  code: string;
  name: string;
  market: string;
}

// 模拟交易持仓类型
interface SimPosition {
  id: string;
  code: string;
  name: string;
  market: string;  // 使用更灵活的类型
  shares: number;
  costPrice: number;
  currentPrice: number;
  previousPrice: number; // 前一日收盘价，用于计算当日盈亏
  profit: number;
  profitPct: number;
  buyDate: string;
}

// 模拟交易记录类型
interface SimTrade {
  id: string;
  code: string;
  name: string;
  type: 'buy' | 'sell';
  shares: number;
  price: number;
  amount: number;
  date: string;
}

// 初始虚拟资金 - 10万元
const INITIAL_CAPITAL = 100000;

/**
 * 模拟交易页面
 * 支持虚拟买卖股票，练习投资技巧
 */
export function SimulatedTradingPage() {
  // 账户状态
  const [cash, setCash] = useState(INITIAL_CAPITAL);
  const [positions, setPositions] = useState<SimPosition[]>([]);
  const [trades, setTrades] = useState<SimTrade[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // 买入弹窗状态
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SimpleStock[]>([]);
  const [selectedStock, setSelectedStock] = useState<SimpleStock | null>(null);
  const [buyShares, setBuyShares] = useState('');
  const [buyPrice, setBuyPrice] = useState('');

  // 交易日记状态
  const [createDiary, setCreateDiary] = useState(false);
  const [diaryReason, setDiaryReason] = useState('');
  const [diaries, setDiaries] = useState<Array<{
    id: string;
    date: string;
    reason: string;
    tradeId?: string;
    stockCode?: string;
  }>>([]);

  // 卖出弹窗状态
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellPosition, setSellPosition] = useState<SimPosition | null>(null);
  const [sellShares, setSellShares] = useState('');

  // AI智能调仓建议状态
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiLoading, setAILoading] = useState(false);
  const [aiStocks, setAIStocks] = useState<Stock[]>([]);

  // 从 localStorage 加载数据
  useEffect(() => {
    const savedData = localStorage.getItem('simulatedTrading');
    if (savedData) {
      const data = JSON.parse(savedData);
      setCash(data.cash || INITIAL_CAPITAL);
      setPositions(data.positions || []);
      setTrades(data.trades || []);
    }
  }, []);

  // 加载模拟交易日记
  useEffect(() => {
    const STORAGE_KEY = 'trading_diary';
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const allDiaries = JSON.parse(saved);
      // 只加载模拟交易的日记
      const simDiaries = allDiaries.filter((d: any) => d.portfolioType === 'simulation');
      setDiaries(simDiaries);
    }
  }, []);

  // 定时更新持仓现价
  useEffect(() => {
    if (positions.length === 0) return;

    const updatePrices = async () => {
      const stockCodes = positions.map(p => p.code);
      const uniqueCodes = [...new Set(stockCodes)];

      try {
        const priceData = await getStockPrices(uniqueCodes);

        setPositions(prevPositions =>
          prevPositions.map(position => {
            const stockPrice = priceData[position.code];
            if (!stockPrice) return position;

            const newPrice = stockPrice.price;
            const oldPrice = position.currentPrice;

            // 如果是首次更新，保存前一日价格
            const previousPrice = position.previousPrice || oldPrice;

            return {
              ...position,
              currentPrice: newPrice,
              previousPrice: previousPrice || oldPrice,
              profit: (newPrice - position.costPrice) * position.shares,
              profitPct: ((newPrice - position.costPrice) / position.costPrice) * 100,
            };
          })
        );

        setLastUpdate(new Date());
      } catch (error) {
        console.error('更新股价失败:', error);
      }
    };

    // 立即执行一次
    updatePrices();

    // 每30秒更新一次
    const timer = setInterval(updatePrices, 30000);

    return () => clearInterval(timer);
  }, [positions.length]);

  // 保存到 localStorage 并触发同步
  useEffect(() => {
    const data = { cash, positions, trades };
    localStorage.setItem('simulatedTrading', JSON.stringify(data));
    schedulePush();
  }, [cash, positions, trades]);

  // 搜索股票
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 1) {
        const results = await searchStocks(searchQuery);
        setSearchResults(results.slice(0, 10));
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 计算统计数据
  const stats = useMemo(() => {
    const totalValue = positions.reduce((sum, p) => sum + p.currentPrice * p.shares, 0);
    const totalCost = positions.reduce((sum, p) => sum + p.costPrice * p.shares, 0);
    const totalProfit = positions.reduce((sum, p) => sum + p.profit, 0);
    const totalProfitPct = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    // 计算当日盈亏：sum((当前价 - 前一日收盘价) * 持股数量)
    const dailyProfit = positions.reduce((sum, p) => {
      const prevPrice = p.previousPrice || p.costPrice; // 如果没有前一日价格，使用成本价
      return sum + (p.currentPrice - prevPrice) * p.shares;
    }, 0);
    const dailyProfitPct = totalValue > 0 ? (dailyProfit / totalValue) * 100 : 0;

    const assetValue = cash + totalValue;

    return {
      cash,
      totalValue,
      totalCost,
      totalProfit,
      totalProfitPct,
      dailyProfit,
      dailyProfitPct,
      assetValue,
      totalReturn: ((assetValue - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 100,
    };
  }, [cash, positions]);

  // AI评分数据加载
  const loadAIScores = useCallback(async () => {
    if (aiStocks.length > 0) {
      setShowAIPanel(prev => !prev);
      return;
    }
    setShowAIPanel(true);
    setAILoading(true);
    try {
      const [aStocks, hkStocks, usStocks] = await Promise.all([
        getStockRecommendations('A'),
        getStockRecommendations('HK'),
        getStockRecommendations('US'),
      ]);
      const all = [...aStocks, ...hkStocks, ...usStocks]
        .sort((a, b) => (b.score || 0) - (a.score || 0));
      setAIStocks(all);
    } catch (err) {
      console.error('AI评分加载失败:', err);
    }
    setAILoading(false);
  }, [aiStocks.length]);

  // AI调仓建议数据
  const aiAdvisorData = useMemo(() => {
    if (aiStocks.length === 0) return null;

    const holdingScores = positions.map(p => {
      const idx = aiStocks.findIndex(s => s.code === p.code);
      const scored = idx >= 0 ? aiStocks[idx] : null;
      return {
        ...p,
        aiScore: scored?.score || 0,
        rank: idx >= 0 ? idx + 1 : 999,
        timing: scored?.timing,
        timingText: scored?.timingText,
      };
    }).sort((a, b) => a.rank - b.rank);

    const avgScore = holdingScores.length > 0
      ? Math.round(holdingScores.reduce((sum, h) => sum + h.aiScore, 0) / holdingScores.length)
      : 0;

    const weakHoldings = holdingScores.filter(h => h.rank > 10);
    const strongHoldings = holdingScores.filter(h => h.rank <= 10);

    const holdingCodes = new Set(positions.map(p => p.code));
    const topRecommendations = aiStocks
      .filter(s => !holdingCodes.has(s.code) && (s.score || 0) > avgScore)
      .slice(0, 6);

    const topAvgScore = topRecommendations.length > 0
      ? Math.round(topRecommendations.reduce((s, h) => s + (h.score || 0), 0) / topRecommendations.length)
      : 0;

    return { holdingScores, avgScore, weakHoldings, strongHoldings, topRecommendations, topAvgScore, totalStocks: aiStocks.length };
  }, [aiStocks, positions]);

  // 快速买入（预填买入弹窗）
  const handleQuickBuy = (stock: Stock) => {
    setSelectedStock({ code: stock.code, name: stock.name, market: stock.market });
    setBuyPrice(stock.price.toFixed(2));
    setShowBuyModal(true);
  };

  // 买入股票
  const handleBuy = () => {
    if (!selectedStock || !buyShares || !buyPrice) return;

    const shares = parseFloat(buyShares);
    const price = parseFloat(buyPrice);
    const amount = shares * price;

    // 检查交易规则
    const rules = checkTradingRules(selectedStock.code, shares, price);
    if (!rules.canTrade) {
      alert(rules.reason);
      return;
    }

    // 计算交易成本（根据市场自动匹配费率）
    const cost = calculateTradingCost(amount, true, selectedStock.market);
    const totalAmount = amount + cost.totalCost;

    if (totalAmount > cash) {
      alert(`资金不足！交易金额 ¥${amount.toFixed(2)} + 费用 ¥${cost.totalCost.toFixed(2)} = ¥${totalAmount.toFixed(2)}`);
      return;
    }

    const now = new Date().toISOString();

    // 检查是否已持有该股票
    const existingIndex = positions.findIndex(p => p.code === selectedStock.code);

    if (existingIndex >= 0) {
      // 加仓
      const existing = positions[existingIndex];
      const newShares = existing.shares + shares;
      const newCostPrice = ((existing.costPrice * existing.shares) + amount) / newShares;

      setPositions(prev => prev.map((p, i) =>
        i === existingIndex
          ? {
              ...p,
              shares: newShares,
              costPrice: newCostPrice,
              currentPrice: price,
              profit: (price - newCostPrice) * newShares,
              profitPct: ((price - newCostPrice) / newCostPrice) * 100,
            }
          : p
      ));
    } else {
      // 新建持仓
      const newPosition: SimPosition = {
        id: Date.now().toString(),
        code: selectedStock.code,
        name: selectedStock.name,
        market: selectedStock.market,
        shares,
        costPrice: price,
        currentPrice: price,
        previousPrice: price, // 设置初始前一日价格为买入价
        profit: 0,
        profitPct: 0,
        buyDate: now,
      };
      setPositions(prev => [...prev, newPosition]);
    }

    // 扣除资金（含交易成本）
    setCash(prev => prev - totalAmount);

    // 记录交易
    const tradeId = Date.now().toString();
    const newTrade: SimTrade = {
      id: tradeId,
      code: selectedStock.code,
      name: selectedStock.name,
      type: 'buy',
      shares,
      price,
      amount,
      date: now,
    };
    setTrades(prev => [newTrade, ...prev]);

    // 如果勾选了创建交易日记，则保存日记（标记为模拟交易）
    if (createDiary && diaryReason.trim()) {
      const STORAGE_KEY = 'trading_diary';
      const saved = localStorage.getItem(STORAGE_KEY);
      const entries = saved ? JSON.parse(saved) : [];

      const newEntry = {
        id: `sim_${Date.now()}`,
        date: now,
        type: 'buy',
        stock: {
          code: selectedStock.code,
          name: selectedStock.name,
          market: selectedStock.market,
        },
        price,
        quantity: shares,
        amount,
        reason: diaryReason.trim(),
        analysis: '',
        expectation: '',
        createdAt: now,
        portfolioType: 'simulation',  // 标记为模拟交易
        tradeId,  // 关联到交易ID
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify([newEntry, ...entries]));
      // 更新日记列表状态
      setDiaries(prev => [newEntry, ...prev]);
    }

    // 重置日记状态
    setCreateDiary(false);
    setDiaryReason('');

    // 关闭弹窗
    setShowBuyModal(false);
    setSelectedStock(null);
    setBuyShares('');
    setBuyPrice('');
    setSearchQuery('');
  };

  // 卖出股票
  const handleSell = () => {
    if (!sellPosition || !sellShares) return;

    const shares = parseFloat(sellShares);
    if (shares > sellPosition.shares) {
      alert('持有数量不足！');
      return;
    }

    const amount = shares * sellPosition.currentPrice;

    // 计算卖出交易成本
    const cost = calculateTradingCost(amount, false, sellPosition.market);
    const netAmount = amount - cost.totalCost;

    // 全部卖出
    if (shares === sellPosition.shares) {
      setPositions(prev => prev.filter(p => p.id !== sellPosition.id));
    } else {
      // 部分卖出
      setPositions(prev => prev.map(p =>
        p.id === sellPosition.id
          ? { ...p, shares: p.shares - shares }
          : p
      ));
    }

    // 增加资金（扣除卖出成本）
    setCash(prev => prev + netAmount);

    // 记录交易
    const newTrade: SimTrade = {
      id: Date.now().toString(),
      code: sellPosition.code,
      name: sellPosition.name,
      type: 'sell',
      shares,
      price: sellPosition.currentPrice,
      amount,
      date: new Date().toISOString(),
    };
    setTrades(prev => [newTrade, ...prev]);

    // 关闭弹窗
    setShowSellModal(false);
    setSellPosition(null);
    setSellShares('');
  };

  // 重置账户
  const handleReset = () => {
    if (confirm('确定要重置模拟账户吗？所有持仓和交易记录将被清空。')) {
      setCash(INITIAL_CAPITAL);
      setPositions([]);
      setTrades([]);
      localStorage.removeItem('simulatedTrading');
    }
  };

  return (
    <div>
      {/* 账户总览卡片 */}
      <div
        style={{
          padding: '20px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(239, 68, 68, 0.08))',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
              模拟账户总资产
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#fff' }}>
              ¥{stats.assetValue.toFixed(2)}
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: stats.totalReturn >= 0 ? '#ef4444' : '#22c55e',
                marginTop: 4,
              }}
            >
              {stats.totalReturn >= 0 ? '+' : ''}{stats.totalReturn.toFixed(2)}%
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 400, marginLeft: 4 }}>
                vs 初始资金
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link
              to="/calculator"
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#f59e0b',
                fontSize: 12,
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontWeight: 500,
              }}
            >
              <Target size={14} />
              仓位计算器
            </Link>
            <Link
              to="/alerts"
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#22c55e',
                fontSize: 12,
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontWeight: 500,
              }}
            >
              <Bell size={14} />
              止盈止损
            </Link>
            <button
              onClick={handleReset}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.6)',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <RefreshCw size={14} />
              重置
            </button>
          </div>
        </div>

        {/* 资金分布 */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>
              <DollarSign size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />
              可用资金
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
              ¥{stats.cash.toFixed(2)}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>
              <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: 2 }}>
                <BriefcaseIcon size={12} />
              </span>
              持仓市值
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
              ¥{stats.totalValue.toFixed(2)}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>
              {stats.totalProfit >= 0 ? (
                <TrendingUp size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />
              ) : (
                <TrendingDown size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />
              )}
              持仓盈亏
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: stats.totalProfit >= 0 ? '#ef4444' : '#22c55e' }}>
              {stats.totalProfit >= 0 ? '+' : ''}¥{stats.totalProfit.toFixed(2)}
            </div>
          </div>
        </div>

        {/* 当日盈亏 */}
        <div style={{
          padding: '12px',
          borderRadius: '10px',
          background: stats.dailyProfit >= 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
          border: `1px solid ${stats.dailyProfit >= 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {stats.dailyProfit >= 0 ? (
              <TrendingUp size={16} style={{ color: '#ef4444' }} />
            ) : (
              <TrendingDown size={16} style={{ color: '#22c55e' }} />
            )}
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>当日持仓盈亏</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: 18,
              fontWeight: 700,
              color: stats.dailyProfit >= 0 ? '#ef4444' : '#22c55e',
            }}>
              {stats.dailyProfit >= 0 ? '+' : ''}¥{stats.dailyProfit.toFixed(2)}
            </div>
            <div style={{
              fontSize: 11,
              color: stats.dailyProfit >= 0 ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 197, 94, 0.5)',
            }}>
              {stats.dailyProfitPct >= 0 ? '+' : ''}{stats.dailyProfitPct.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* 最后更新时间 */}
        {lastUpdate && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 8 }}>
            数据更新于: {lastUpdate.toLocaleTimeString('zh-CN')}
          </div>
        )}
      </div>

      {/* 买入按钮 */}
      <button
        onClick={() => setShowBuyModal(true)}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
          border: 'none',
          color: '#fff',
          fontSize: 15,
          fontWeight: 700,
          cursor: 'pointer',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Plus size={18} />
        买入股票
      </button>

      {/* AI智能调仓建议 */}
      <div style={{ marginBottom: 20 }}>
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
            <Sparkles size={16} />
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
            {aiAdvisorData.holdingScores.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ArrowRightLeft size={12} />
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
                        <div style={{ textAlign: 'right' }}>
                          {isWeak ? (
                            <span style={{ fontSize: 11, color: '#f87171', fontWeight: 500 }}>
                              建议换仓
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 500 }}>
                              继续持有
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Top推荐股票 */}
            {aiAdvisorData.topRecommendations.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={12} />
                  高分股推荐（未持有）
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {aiAdvisorData.topRecommendations.map((stock, idx) => {
                    const globalRank = aiStocks.findIndex(s => s.code === stock.code) + 1;
                    const scoreColor = (stock.score || 0) >= 75 ? '#a78bfa' : '#f59e0b';
                    const marketLabel = stock.market === 'HK' ? '港' : stock.market === 'US' ? '美' : 'A';
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
                            background: idx < 3 ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, color: idx < 3 ? '#c4b5fd' : 'rgba(255,255,255,0.5)',
                          }}>
                            {globalRank}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
                              {stock.name}
                              <span style={{
                                fontSize: 9, padding: '1px 4px', borderRadius: 4,
                                background: marketLabel === '美' ? 'rgba(59,130,246,0.2)' : marketLabel === '港' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                                color: marketLabel === '美' ? '#60a5fa' : marketLabel === '港' ? '#f87171' : '#fbbf24',
                              }}>
                                {marketLabel}
                              </span>
                            </div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                              {stock.code} · ¥{stock.price.toFixed(2)} · {stock.changePct >= 0 ? '+' : ''}{stock.changePct.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: scoreColor }}>
                            {stock.score}
                          </span>
                          <button
                            onClick={() => handleQuickBuy(stock)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              background: 'rgba(139, 92, 246, 0.2)',
                              border: '1px solid rgba(139, 92, 246, 0.3)',
                              color: '#c4b5fd',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            买入
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 提示 */}
            <div style={{
              marginTop: 12,
              fontSize: 11,
              color: 'rgba(255,255,255,0.3)',
              textAlign: 'center',
              lineHeight: 1.6,
            }}>
              基于AI多因子评分引擎（估值·成长·质量·技术·情绪·波动）
              <br />
              评分每日随行情动态更新，仅供参考
            </div>
          </div>
        )}
      </div>

      {/* 持仓列表 */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
          持仓 ({positions.length})
        </h3>

        {positions.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'rgba(255,255,255,0.3)',
            }}
          >
            <div style={{ opacity: 0.3, marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
              <BriefcaseIcon size={40} />
            </div>
            <div style={{ fontSize: 14 }}>暂无持仓</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>点击上方按钮开始交易</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {positions.map((position) => (
              <div
                key={position.id}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {position.name}
                      {(() => {
                        const scored = aiStocks.find(s => s.code === position.code);
                        if (!scored) return null;
                        const sc = scored.score || 0;
                        const color = sc >= 75 ? '#a78bfa' : sc >= 65 ? '#f59e0b' : '#ef4444';
                        return (
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '1px 5px',
                            borderRadius: 4, background: `${color}22`, color,
                          }}>
                            {sc}分
                          </span>
                        );
                      })()}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                      {position.code} · {position.shares}股
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                      ¥{(position.currentPrice * position.shares).toFixed(2)}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: position.profit >= 0 ? '#ef4444' : '#22c55e',
                      }}
                    >
                      {position.profit >= 0 ? '+' : ''}¥{position.profit.toFixed(2)}
                      <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 4 }}>
                        ({position.profitPct >= 0 ? '+' : ''}{position.profitPct.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>成本价</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>¥{position.costPrice.toFixed(2)}</div>
                  </div>
                  <div style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>现价</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>¥{position.currentPrice.toFixed(2)}</div>
                  </div>
                  <button
                    onClick={() => {
                      setSellPosition(position);
                      setSellShares(position.shares.toString());
                      setShowSellModal(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      background: 'rgba(34, 197, 94, 0.15)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      color: '#22c55e',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    <Minus size={14} />
                    卖出
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 交易历史 */}
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
          <History size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
          交易记录 ({trades.length})
        </h3>

        {trades.length === 0 ? (
          <div
            style={{
              padding: '30px',
              textAlign: 'center',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              color: 'rgba(255,255,255,0.3)',
            }}
          >
            暂无交易记录
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {trades.slice(0, 20).map((trade) => {
              // 查找对应的交易日记
              const tradeDiary = diaries.find(d => d.tradeId === trade.id);
              return (
                <div
                  key={trade.id}
                  style={{
                    padding: tradeDiary ? '12px' : '12px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'grid',
                    gridTemplateColumns: tradeDiary ? '1fr auto' : '1fr',
                    gap: '12px',
                  }}
                >
                  {/* 左侧：交易信息 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: trade.type === 'buy' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {trade.type === 'buy' ? (
                          <TrendingDown size={16} style={{ color: '#ef4444' }} />
                        ) : (
                          <TrendingUp size={16} style={{ color: '#22c55e' }} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                          {trade.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                          {trade.code}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: trade.type === 'buy' ? '#ef4444' : '#22c55e',
                        }}
                      >
                        {trade.type === 'buy' ? '买入' : '卖出'}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                        {trade.shares}股 · ¥{trade.price.toFixed(2)}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                        ¥{trade.amount.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* 右侧：交易日记（如果有） */}
                  {tradeDiary && (
                    <div
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        background: 'rgba(245, 158, 11, 0.08)',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        minWidth: '160px',
                        maxWidth: '240px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                        <BookOpen size={12} style={{ color: '#f59e0b' }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b' }}>交易日记</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                        {tradeDiary.reason}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
                        {new Date(tradeDiary.date).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 买入弹窗 */}
      {showBuyModal && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-end',
            zIndex: 9999,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowBuyModal(false);
              setCreateDiary(false);
              setDiaryReason('');
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>买入股票</h3>
              <button
                onClick={() => {
                  setShowBuyModal(false);
                  setCreateDiary(false);
                  setDiaryReason('');
                }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 24, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {/* 搜索股票 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>搜索股票</div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="输入股票代码或名称"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                }}
              />

              {/* 搜索结果 */}
              {searchResults.length > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {searchResults.map((stock) => (
                    <div
                      key={stock.code}
                      onClick={async () => {
                        setSelectedStock(stock);
                        setSearchQuery('');
                        setSearchResults([]);
                        // 自动获取实时价格（跳过Mock数据）
                        const detail = await getStockDetailRealtime(stock.code);
                        if (detail && detail.price) {
                          setBuyPrice(detail.price.toFixed(2));
                        } else {
                          setBuyPrice('');
                        }
                      }}
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{stock.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{stock.code}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* 已选股票 */}
              {selectedStock && (
                <div
                  style={{
                    marginTop: 8,
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{selectedStock.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{selectedStock.code}</div>
                  <button
                    onClick={() => setSelectedStock(null)}
                    style={{
                      marginTop: 8,
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    重新选择
                  </button>
                </div>
              )}
            </div>

            {/* 买入数量 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>买入数量（股）</div>
              <input
                type="number"
                value={buyShares}
                onChange={(e) => setBuyShares(e.target.value)}
                placeholder="请输入数量"
                min="1"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>

            {/* 买入价格 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>买入价格（元）</div>
              <input
                type="number"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="请输入价格"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>

            {/* 预计金额 */}
            {buyShares && buyPrice && (
              <div style={{ marginBottom: 16, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>预计金额</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>
                  ¥{(parseFloat(buyShares) * parseFloat(buyPrice)).toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                  可用资金: ¥{cash.toFixed(2)}
                </div>
              </div>
            )}

            {/* 交易日记选项 */}
            <div style={{ marginBottom: 16, padding: '12px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
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
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.04)',
                      color: '#fff',
                      fontSize: 13,
                      resize: 'vertical',
                      outline: 'none',
                    }}
                  />
                </div>
              )}
            </div>

            {/* 买入按钮 */}
            <button
              onClick={handleBuy}
              disabled={!selectedStock || !buyShares || !buyPrice}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                background: (!selectedStock || !buyShares || !buyPrice)
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'linear-gradient(135deg, #f59e0b, #ef4444)',
                border: 'none',
                color: (!selectedStock || !buyShares || !buyPrice) ? 'rgba(255,255,255,0.3)' : '#fff',
                fontSize: 15,
                fontWeight: 700,
                cursor: (!selectedStock || !buyShares || !buyPrice) ? 'not-allowed' : 'pointer',
              }}
            >
              确认买入
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* 卖出弹窗 */}
      {showSellModal && sellPosition && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-end',
            zIndex: 9999,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSellModal(false);
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>卖出股票</h3>
              <button
                onClick={() => setShowSellModal(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 24, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: 16, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{sellPosition.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{sellPosition.code}</div>
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>持有</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{sellPosition.shares}股</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>成本价</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>¥{sellPosition.costPrice.toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>现价</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>¥{sellPosition.currentPrice.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>卖出数量（股）</div>
              <input
                type="number"
                value={sellShares}
                onChange={(e) => setSellShares(e.target.value)}
                placeholder="请输入数量"
                min="1"
                max={sellPosition.shares}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>

            {/* 预计金额 */}
            {sellShares && (
              <div style={{ marginBottom: 16, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>预计金额</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#22c55e' }}>
                  ¥{(parseFloat(sellShares) * sellPosition.currentPrice).toFixed(2)}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  setSellShares(sellPosition.shares.toString());
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                全部
              </button>
              <button
                onClick={() => {
                  setSellShares(Math.floor(sellPosition.shares / 2).toString());
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                一半
              </button>
            </div>

            {/* 卖出按钮 */}
            <button
              onClick={handleSell}
              disabled={!sellShares || parseFloat(sellShares) <= 0}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                background: (!sellShares || parseFloat(sellShares) <= 0)
                  ? 'rgba(255, 255, 255, 0.1)'
                  : '#22c55e',
                border: 'none',
                color: (!sellShares || parseFloat(sellShares) <= 0) ? 'rgba(255,255,255,0.3)' : '#fff',
                fontSize: 15,
                fontWeight: 700,
                cursor: (!sellShares || parseFloat(sellShares) <= 0) ? 'not-allowed' : 'pointer',
                marginTop: 16,
              }}
            >
              确认卖出
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// 简单的公文包图标组件
function BriefcaseIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
