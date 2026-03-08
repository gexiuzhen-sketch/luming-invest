/**
 * 交易日记页面
 * 记录每笔交易的决策逻辑，帮助复盘改进
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, BookOpen, ArrowLeft } from 'lucide-react';

interface DiaryEntry {
  id: string;
  date: string;
  type: 'buy' | 'sell';
  stock: {
    code: string;
    name: string;
    market: string;
  };
  price: number;
  quantity: number;
  amount: number;
  reason: string;        // 交易理由
  analysis: string;      // 市场分析
  expectation: string;   // 预期目标
  result?: string;      // 事后复盘（可选）
  createdAt: string;
  portfolioType: 'real' | 'simulation';  // 区分真实持仓和模拟交易
}

const STORAGE_KEY = 'trading_diary';

interface TradingDiaryPageProps {
  portfolioType?: 'real' | 'simulation';
}

export function TradingDiaryPage({ portfolioType = 'real' }: TradingDiaryPageProps) {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all');

  // 表单状态
  const [formData, setFormData] = useState<{
    type: 'buy' | 'sell';
    stockCode: string;
    stockName: string;
    market: 'SH' | 'SZ' | 'HK' | 'US';
    price: string;
    quantity: string;
    reason: string;
    analysis: string;
    expectation: string;
    result: string;
  }>({
    type: 'buy',
    stockCode: '',
    stockName: '',
    market: 'SH',
    price: '',
    quantity: '',
    reason: '',
    analysis: '',
    expectation: '',
    result: '',
  });

  // 加载日记
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setEntries(JSON.parse(saved));
    }
  }, []);

  // 保存日记
  const saveEntries = (newEntries: DiaryEntry[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
    setEntries(newEntries);
  };

  // 打开编辑器
  const openEditor = (entry?: DiaryEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        type: entry.type,
        stockCode: entry.stock.code,
        stockName: entry.stock.name,
        market: entry.stock.market as 'SH' | 'SZ' | 'HK' | 'US',
        price: entry.price.toString(),
        quantity: entry.quantity.toString(),
        reason: entry.reason,
        analysis: entry.analysis,
        expectation: entry.expectation,
        result: entry.result || '',
      });
    } else {
      setEditingEntry(null);
      setFormData({
        type: 'buy',
        stockCode: '',
        stockName: '',
        market: 'SH',
        price: '',
        quantity: '',
        reason: '',
        analysis: '',
        expectation: '',
        result: '',
      });
    }
    setShowEditor(true);
  };

  // 保存日记
  const saveDiary = () => {
    const newEntry: DiaryEntry = {
      id: editingEntry?.id || `${Date.now()}`,
      date: new Date().toISOString(),
      type: formData.type,
      stock: {
        code: formData.stockCode.toUpperCase(),
        name: formData.stockName,
        market: formData.market,
      },
      price: parseFloat(formData.price) || 0,
      quantity: parseInt(formData.quantity) || 0,
      amount: (parseFloat(formData.price) || 0) * (parseInt(formData.quantity) || 0),
      reason: formData.reason,
      analysis: formData.analysis,
      expectation: formData.expectation,
      result: formData.result || undefined,
      createdAt: editingEntry?.createdAt || new Date().toISOString(),
      portfolioType: editingEntry?.portfolioType || portfolioType,  // 使用当前页面的类型
    };

    if (editingEntry) {
      saveEntries(entries.map(e => e.id === editingEntry.id ? newEntry : e));
    } else {
      saveEntries([newEntry, ...entries]);
    }

    setShowEditor(false);
    setEditingEntry(null);
  };

  // 删除日记
  const deleteEntry = (id: string) => {
    if (confirm('确定要删除这条日记吗？')) {
      saveEntries(entries.filter(e => e.id !== id));
    }
  };

  // 筛选日记 - 只显示匹配 portfolioType 的日记
  const filteredEntries = entries.filter(entry => {
    // 首先过滤掉不匹配的持仓类型
    if (entry.portfolioType !== portfolioType) {
      return false;
    }

    const matchesSearch = searchQuery === '' ||
      entry.stock.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.stock.name.includes(searchQuery);

    const matchesFilter = filterType === 'all' || entry.type === filterType;

    return matchesSearch && matchesFilter;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 统计数据 - 只统计当前类型的日记
  const typeEntries = entries.filter(e => e.portfolioType === portfolioType);
  const stats = {
    total: typeEntries.length,
    buyCount: typeEntries.filter(e => e.type === 'buy').length,
    sellCount: typeEntries.filter(e => e.type === 'sell').length,
    thisMonth: typeEntries.filter(e => {
      const entryDate = new Date(e.date);
      const now = new Date();
      return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
    }).length,
  };

  return (
    <div style={{ padding: '16px', color: '#fff' }}>
      {/* 标题 + 返回按钮 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <button
            onClick={() => navigate(portfolioType === 'simulation' ? '/simulate' : '/portfolio')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
            }}
          >
            <ArrowLeft size={18} />
            {portfolioType === 'simulation' ? '返回模拟盘' : '返回持仓'}
          </button>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={26} color="#f59e0b" />
          {portfolioType === 'simulation' ? '模拟交易日记' : '交易日记'}
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
          {portfolioType === 'simulation' ? '模拟交易 · ' : ''}记录每笔交易的决策逻辑，帮助复盘改进
        </p>
      </div>

      {/* 统计卡片 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
        marginBottom: 16,
      }}>
        <div style={{
          padding: '14px',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#fbbf24' }}>{stats.total}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>总记录</div>
        </div>
        <div style={{
          padding: '14px',
          borderRadius: 12,
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>{stats.buyCount}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>买入</div>
        </div>
        <div style={{
          padding: '14px',
          borderRadius: 12,
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#22c55e' }}>{stats.sellCount}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>卖出</div>
        </div>
        <div style={{
          padding: '14px',
          borderRadius: 12,
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>{stats.thisMonth}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>本月</div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 16,
      }}>
        <div style={{
          flex: 1,
          position: 'relative',
        }}>
          <Search size={18} style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.3)',
          }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索股票代码或名称..."
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'buy', 'sell'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                background: filterType === type
                  ? type === 'all' ? '#f59e0b' : type === 'buy' ? '#ef4444' : '#22c55e'
                  : 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {type === 'all' ? '全部' : type === 'buy' ? '买入' : '卖出'}
            </button>
          ))}
        </div>
      </div>

      {/* 新建按钮 */}
      <button
        onClick={() => openEditor()}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 12,
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
          border: 'none',
          color: '#fff',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Plus size={18} />
        新建交易日记
      </button>

      {/* 日记列表 */}
      {filteredEntries.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'rgba(255,255,255,0.3)',
        }}>
          <BookOpen size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>暂无交易日记</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>点击上方按钮开始记录</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 14,
                padding: 16,
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {/* 头部 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 12,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 6,
                  }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      background: entry.type === 'buy'
                        ? 'rgba(239, 68, 68, 0.2)'
                        : 'rgba(34, 197, 94, 0.2)',
                      color: entry.type === 'buy' ? '#ef4444' : '#22c55e',
                    }}>
                      {entry.type === 'buy' ? '买入' : '卖出'}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>
                      {entry.stock.name}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                    {entry.stock.code} · {entry.stock.market}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => openEditor(entry)}
                    style={{
                      padding: '6px',
                      borderRadius: 6,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.6)',
                      cursor: 'pointer',
                    }}
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    style={{
                      padding: '6px',
                      borderRadius: 6,
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* 详情 */}
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', marginRight: 8 }}>
                    💰 价格/数量:
                  </span>
                  ¥{entry.price.toFixed(2)} / {entry.quantity}股
                  <span style={{ marginLeft: 12, color: '#fbbf24', fontWeight: 600 }}>
                    ¥{entry.amount.toFixed(2)}
                  </span>
                </div>

                {entry.reason && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>📝 交易理由</div>
                    <div style={{ lineHeight: 1.5 }}>{entry.reason}</div>
                  </div>
                )}

                {entry.analysis && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>📊 市场分析</div>
                    <div style={{ lineHeight: 1.5 }}>{entry.analysis}</div>
                  </div>
                )}

                {entry.expectation && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>🎯 预期目标</div>
                    <div style={{ lineHeight: 1.5 }}>{entry.expectation}</div>
                  </div>
                )}

                {entry.result && (
                  <div style={{
                    padding: '10px',
                    borderRadius: 8,
                    background: 'rgba(34, 197, 94, 0.1)',
                  }}>
                    <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>📈 事后复盘</div>
                    <div style={{ lineHeight: 1.5 }}>{entry.result}</div>
                  </div>
                )}

                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
                  {new Date(entry.date).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 编辑弹窗 */}
      {showEditor && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditor(false);
              setEditingEntry(null);
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
              padding: 20,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                {editingEntry ? '编辑日记' : '新建交易日记'}
              </h2>
              <button
                onClick={() => {
                  setShowEditor(false);
                  setEditingEntry(null);
                }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 24, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {/* 表单 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* 交易类型 */}
              <div>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                  交易类型
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setFormData({ ...formData, type: 'buy' })}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: 8,
                      background: formData.type === 'buy' ? '#ef4444' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    买入
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, type: 'sell' })}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: 8,
                      background: formData.type === 'sell' ? '#22c55e' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    卖出
                  </button>
                </div>
              </div>

              {/* 股票信息 */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                    股票代码
                  </label>
                  <input
                    type="text"
                    value={formData.stockCode}
                    onChange={(e) => setFormData({ ...formData, stockCode: e.target.value.toUpperCase() })}
                    placeholder="600519"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                  股票名称
                  </label>
                  <input
                    type="text"
                    value={formData.stockName}
                    onChange={(e) => setFormData({ ...formData, stockName: e.target.value })}
                    placeholder="贵州茅台"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* 价格和数量 */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                    价格
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="1455.00"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                    数量（股）
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="100"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* 交易理由 */}
              <div>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                  📝 交易理由 <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>（必填）</span>
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="为什么选择这只股票？看好什么因素？"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* 市场分析 */}
              <div>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                  📊 市场分析 <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>（可选）</span>
                </label>
                <textarea
                  value={formData.analysis}
                  onChange={(e) => setFormData({ ...formData, analysis: e.target.value })}
                  placeholder="当前市场环境如何？行业趋势？"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* 预期目标 */}
              <div>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                  🎯 预期目标 <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>（可选）</span>
                </label>
                <textarea
                  value={formData.expectation}
                  onChange={(e) => setFormData({ ...formData, expectation: e.target.value })}
                  placeholder="目标价位多少？预期持有时间？止盈止损点位？"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* 事后复盘（编辑时显示） */}
              {editingEntry && (
                <div>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                    📈 事后复盘
                  </label>
                  <textarea
                    value={formData.result || ''}
                    onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                    placeholder="这笔交易的结果如何？学到了什么经验？"
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'rgba(245, 158, 11, 0.05)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      color: '#fff',
                      fontSize: 13,
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>
              )}

              {/* 保存按钮 */}
              <button
                onClick={saveDiary}
                disabled={!formData.stockCode || !formData.price || !formData.quantity || !formData.reason}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 10,
                  background: (!formData.stockCode || !formData.price || !formData.quantity || !formData.reason)
                    ? 'rgba(255,255,255,0.1)'
                    : 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  border: 'none',
                  color: (!formData.stockCode || !formData.price || !formData.quantity || !formData.reason)
                    ? 'rgba(255,255,255,0.3)'
                    : '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: (!formData.stockCode || !formData.price || !formData.quantity || !formData.reason)
                    ? 'not-allowed'
                    : 'pointer',
                }}
              >
                保存日记
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
