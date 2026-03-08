/**
 * 止盈止损提醒页面
 * 设置价格提醒，达到目标价格时推送通知
 * 改进：使用真实API数据而非模拟
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Plus, Trash2, Edit, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { getStockPrices } from '../services/api';

interface PriceAlert {
  id: string;
  stock: {
    code: string;
    name: string;
    market: string;
  };
  type: 'stop_loss' | 'take_profit' | 'custom';
  targetPrice: number;
  currentPrice: number;
  enabled: boolean;
  triggered: boolean;
  triggeredAt?: string;
  createdAt: string;
  notifyCount: number;
}

const STORAGE_KEY = 'price_alerts';
const CHECK_INTERVAL = 30000; // 30秒检查一次

export function PriceAlertsPage() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingAlert, setEditingAlert] = useState<PriceAlert | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    stockCode: '',
    stockName: '',
    market: 'SH' as 'SH' | 'SZ' | 'HK' | 'US',
    type: 'take_profit' as 'stop_loss' | 'take_profit' | 'custom',
    targetPrice: '',
    currentPrice: '',
  });

  // 加载提醒
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setAlerts(JSON.parse(saved));
    }
  }, []);

  // 保存提醒
  const saveAlerts = (newAlerts: PriceAlert[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAlerts));
    setAlerts(newAlerts);
  };

  // 价格监控（使用真实API数据）
  useEffect(() => {
    const checkPrices = async () => {
      if (alerts.length === 0) return;

      const enabledAlerts = alerts.filter(a => a.enabled && !a.triggered);
      if (enabledAlerts.length === 0) return;

      // 收集所有需要查询的股票代码
      const stockCodes = enabledAlerts.map(a => a.stock.code);
      const uniqueCodes = [...new Set(stockCodes)];

      try {
        // 调用真实API获取价格
        const priceData = await getStockPrices(uniqueCodes);

        let updated = false;
        const newAlerts = [...alerts];

        for (const alert of enabledAlerts) {
          const stockPrice = priceData[alert.stock.code];

          if (!stockPrice) {
            console.warn(`未获取到股票 ${alert.stock.code} 的价格数据`);
            continue;
          }

          const newPrice = stockPrice.price;

          // 检查是否触发条件
          let triggered = false;
          if (alert.type === 'take_profit' && newPrice >= alert.targetPrice) {
            triggered = true;
          } else if (alert.type === 'stop_loss' && newPrice <= alert.targetPrice) {
            triggered = true;
          } else if (alert.type === 'custom' && Math.abs(newPrice - alert.targetPrice) < alert.targetPrice * 0.005) {
            triggered = true;
          }

          if (triggered) {
            const alertIndex = newAlerts.findIndex(a => a.id === alert.id);
            if (alertIndex !== -1) {
              newAlerts[alertIndex] = {
                ...newAlerts[alertIndex],
                triggered: true,
                triggeredAt: new Date().toISOString(),
                currentPrice: newPrice,
                notifyCount: newAlerts[alertIndex].notifyCount + 1,
              };
              updated = true;

              // 发送浏览器通知
              // eslint-disable-next-line react-hooks/immutability
              sendNotification(alert, newPrice);
            }
          } else {
            // 更新当前价格
            const alertIndex = newAlerts.findIndex(a => a.id === alert.id);
            if (alertIndex !== -1) {
              newAlerts[alertIndex].currentPrice = newPrice;
              updated = true;
            }
          }
        }

        if (updated) {
          saveAlerts(newAlerts);
        }

        setLastCheckTime(new Date());
      } catch (error) {
        console.error('获取价格数据失败:', error);
      }
    };

    // 立即检查一次
    checkPrices();

    // 定时检查
    const timer = setInterval(checkPrices, CHECK_INTERVAL);
    return () => clearInterval(timer);
  }, [alerts]);

  // 发送浏览器通知
  const sendNotification = (alert: PriceAlert, currentPrice: number) => {
    if ('Notification' in window) {
      // 如果没有权限，请求权限
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            sendNotification(alert, currentPrice);
          }
        });
        return;
      }

      if (Notification.permission === 'granted') {
        const typeText = alert.type === 'take_profit' ? '止盈' : alert.type === 'stop_loss' ? '止损' : '价格提醒';
        const changeText = alert.type === 'take_profit' ? '已达到止盈目标' :
                         alert.type === 'stop_loss' ? '已触及止损位' : '价格已触及目标';

        new Notification(`${typeText}提醒：${alert.stock.name}`, {
          body: `${changeText}\n当前价: ¥${currentPrice.toFixed(2)}\n目标价: ¥${alert.targetPrice.toFixed(2)}`,
          icon: '/logo.png',
          tag: alert.id,
          requireInteraction: true,  // 需要用户交互才能关闭
        });
      }
    }
  };

  // 请求通知权限
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // 打开编辑器
  const openEditor = (alert?: PriceAlert) => {
    if (alert) {
      setEditingAlert(alert);
      setFormData({
        stockCode: alert.stock.code,
        stockName: alert.stock.name,
        market: alert.stock.market as 'SH' | 'SZ' | 'HK' | 'US',
        type: alert.type,
        targetPrice: alert.targetPrice.toString(),
        currentPrice: alert.currentPrice.toString(),
      });
    } else {
      setEditingAlert(null);
      setFormData({
        stockCode: '',
        stockName: '',
        market: 'SH',
        type: 'take_profit',
        targetPrice: '',
        currentPrice: '',
      });
    }
    setShowEditor(true);
  };

  // 保存提醒
  const saveAlert = () => {
    const currentPrice = parseFloat(formData.currentPrice) || parseFloat(formData.targetPrice) || 0;
    const newAlert: PriceAlert = {
      id: editingAlert?.id || `${Date.now()}`,
      stock: {
        code: formData.stockCode.toUpperCase(),
        name: formData.stockName,
        market: formData.market,
      },
      type: formData.type,
      targetPrice: parseFloat(formData.targetPrice) || 0,
      currentPrice,
      enabled: true,
      triggered: false,
      createdAt: editingAlert?.createdAt || new Date().toISOString(),
      notifyCount: editingAlert?.notifyCount || 0,
    };

    if (editingAlert) {
      saveAlerts(alerts.map(a => a.id === editingAlert.id ? newAlert : a));
    } else {
      saveAlerts([...alerts, newAlert]);
    }

    setShowEditor(false);
    setEditingAlert(null);
  };

  // 删除提醒
  const deleteAlert = (id: string) => {
    if (confirm('确定要删除这个提醒吗？')) {
      saveAlerts(alerts.filter(a => a.id !== id));
    }
  };

  // 切换启用状态
  const toggleEnabled = (id: string) => {
    saveAlerts(alerts.map(a =>
      a.id === id ? { ...a, enabled: !a.enabled } : a
    ));
  };

  // 重新启用已触发的提醒
  const resetTriggered = (id: string) => {
    saveAlerts(alerts.map(a =>
      a.id === id ? { ...a, triggered: false, triggeredAt: undefined } : a
    ));
  };

  // 统计数据
  const stats = {
    total: alerts.length,
    active: alerts.filter(a => a.enabled && !a.triggered).length,
    triggered: alerts.filter(a => a.triggered).length,
    stopLoss: alerts.filter(a => a.type === 'stop_loss' && a.enabled).length,
    takeProfit: alerts.filter(a => a.type === 'take_profit' && a.enabled).length,
  };

  // 计算距离目标的百分比
  const getDistance = (alert: PriceAlert) => {
    const diff = alert.targetPrice - alert.currentPrice;
    const pct = (diff / alert.currentPrice) * 100;
    const isAbove = diff > 0;
    return { pct: Math.abs(pct), isAbove };
  };

  return (
    <div style={{ padding: '16px', color: '#fff' }}>
      {/* 返回按钮 */}
      <Link
        to="/simulate"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          borderRadius: '8px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.7)',
          fontSize: 13,
          textDecoration: 'none',
          marginBottom: 16,
          cursor: 'pointer',
        }}
      >
        <ArrowLeft size={16} />
        返回模拟持仓
      </Link>

      {/* 标题 */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={26} color="#f59e0b" />
          止盈止损提醒
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
          设置价格提醒，智能监控并及时通知
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
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>总提醒</div>
        </div>
        <div style={{
          padding: '14px',
          borderRadius: 12,
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#22c55e' }}>{stats.active}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>监控中</div>
        </div>
        <div style={{
          padding: '14px',
          borderRadius: 12,
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>{stats.triggered}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>已触发</div>
        </div>
        <div style={{
          padding: '14px',
          borderRadius: 12,
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>
            {stats.stopLoss}/{stats.takeProfit}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>止损/止盈</div>
        </div>
      </div>

      {/* 通知权限提示 */}
      {('Notification' in window) && Notification.permission === 'default' && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 10,
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <AlertCircle size={18} color="#f59e0b" />
          <div style={{ flex: 1, fontSize: 12 }}>
            请允许浏览器通知，以便在价格到达时及时提醒您
          </div>
          <button
            onClick={requestNotificationPermission}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: '#f59e0b',
              border: 'none',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            允许通知
          </button>
        </div>
      )}

      {/* 最后检查时间 */}
      {lastCheckTime && (
        <div style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.3)',
          textAlign: 'center',
          marginBottom: 16,
        }}>
          最后检查: {lastCheckTime.toLocaleTimeString('zh-CN')}
        </div>
      )}

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
        新建价格提醒
      </button>

      {/* 快捷添加 */}
      <div style={{
        padding: 16,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>快捷操作</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link
            to="/portfolio"
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: 12,
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            从持仓添加
          </Link>
          <Link
            to="/watchlist"
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: 12,
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            从自选添加
          </Link>
        </div>
      </div>

      {/* 提醒列表 */}
      {alerts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'rgba(255,255,255,0.3)',
        }}>
          <Bell size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>暂无价格提醒</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>点击上方按钮开始设置</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {alerts.map((alert) => {
            const distance = getDistance(alert);
            return (
              <div
                key={alert.id}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 14,
                  padding: 16,
                  border: alert.triggered
                    ? '1px solid rgba(34, 197, 94, 0.3)'
                    : '1px solid rgba(255,255,255,0.06)',
                  opacity: alert.enabled ? 1 : 0.5,
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
                      {alert.type === 'take_profit' && (
                        <TrendingUp size={16} color="#22c55e" />
                      )}
                      {alert.type === 'stop_loss' && (
                        <TrendingDown size={16} color="#ef4444" />
                      )}
                      {alert.triggered && (
                        <CheckCircle2 size={16} color="#22c55e" />
                      )}
                      <span style={{ fontSize: 16, fontWeight: 600 }}>
                        {alert.stock.name}
                      </span>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 500,
                        background: alert.type === 'take_profit'
                          ? 'rgba(34, 197, 94, 0.2)'
                          : 'rgba(239, 68, 68, 0.2)',
                        color: alert.type === 'take_profit' ? '#22c55e' : '#ef4444',
                      }}>
                        {alert.type === 'take_profit' ? '止盈' : '止损'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                      {alert.stock.code} · {alert.stock.market}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => toggleEnabled(alert.id)}
                      style={{
                        padding: '6px',
                        borderRadius: 6,
                        background: alert.enabled
                          ? 'rgba(34, 197, 94, 0.1)'
                          : 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: alert.enabled ? '#22c55e' : 'rgba(255,255,255,0.4)',
                        cursor: 'pointer',
                      }}
                    >
                      {alert.enabled ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    </button>
                    <button
                      onClick={() => openEditor(alert)}
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
                      onClick={() => deleteAlert(alert.id)}
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

                {/* 价格信息 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>当前价格</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>
                      ¥{alert.currentPrice.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                      {alert.type === 'take_profit' ? '止盈目标' : '止损目标'}
                    </div>
                    <div style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: alert.type === 'take_profit' ? '#22c55e' : '#ef4444',
                    }}>
                      ¥{alert.targetPrice.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* 距离进度条 */}
                {!alert.triggered && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.4)',
                      marginBottom: 4,
                    }}>
                      <span>距离目标</span>
                      <span style={{ color: distance.isAbove ? '#22c55e' : '#ef4444' }}>
                        {distance.isAbove ? '还差' : '已超'} {distance.pct.toFixed(2)}%
                      </span>
                    </div>
                    <div style={{
                      height: 6,
                      borderRadius: 3,
                      background: 'rgba(255,255,255,0.1)',
                      overflow: 'hidden',
                    }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(100, Math.max(0, 100 - distance.pct * 5))}%`,
                          background: alert.type === 'take_profit'
                            ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                            : 'linear-gradient(90deg, #ef4444, #f87171)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* 触发信息 */}
                {alert.triggered && (
                  <div style={{
                    padding: '10px',
                    borderRadius: 8,
                    background: 'rgba(34, 197, 94, 0.1)',
                    marginBottom: 8,
                  }}>
                    <div style={{ fontSize: 11, color: '#22c55e', marginBottom: 2 }}>
                      ✓ 已于 {alert.triggeredAt && new Date(alert.triggeredAt).toLocaleString('zh-CN')} 触发
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                      当前价 ¥{alert.currentPrice.toFixed(2)} 已达到目标价
                    </div>
                  </div>
                )}

                {/* 重新启用按钮 */}
                {alert.triggered && (
                  <button
                    onClick={() => resetTriggered(alert.id)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: 8,
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      color: '#22c55e',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    重新启用监控
                  </button>
                )}
              </div>
            );
          })}
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
              setEditingAlert(null);
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
                {editingAlert ? '编辑提醒' : '新建价格提醒'}
              </h2>
              <button
                onClick={() => {
                  setShowEditor(false);
                  setEditingAlert(null);
                }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 24, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {/* 表单 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* 提醒类型 */}
              <div>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                  提醒类型
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setFormData({ ...formData, type: 'take_profit' })}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: 8,
                      background: formData.type === 'take_profit' ? '#22c55e' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    <TrendingUp size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    止盈
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, type: 'stop_loss' })}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: 8,
                      background: formData.type === 'stop_loss' ? '#ef4444' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    <TrendingDown size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    止损
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

              {/* 当前价格 */}
              <div>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                  当前价格
                </label>
                <input
                  type="number"
                  value={formData.currentPrice}
                  onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
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

              {/* 目标价格 */}
              <div>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                  {formData.type === 'take_profit' ? '止盈目标价格' : '止损目标价格'}
                </label>
                <input
                  type="number"
                  value={formData.targetPrice}
                  onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                  placeholder={formData.type === 'take_profit' ? '1600.00' : '1300.00'}
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

              {/* 价格提示 */}
              {formData.currentPrice && formData.targetPrice && (() => {
                const target = parseFloat(formData.targetPrice);
                const current = parseFloat(formData.currentPrice);
                const isValid = formData.type === 'take_profit'
                  ? target > current
                  : target < current;
                const bgColor = isValid ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
                const borderColor = isValid ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';
                const pct = formData.type === 'take_profit'
                  ? ((target / current - 1) * 100).toFixed(2)
                  : ((1 - target / current) * 100).toFixed(2);
                return (
                  <div style={{
                    padding: '10px',
                    borderRadius: 8,
                    background: bgColor,
                    border: `1px solid ${borderColor}`,
                  }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                      {isValid
                        ? `✓ 目标价格${formData.type === 'take_profit' ? '高于' : '低于'}当前价格 ${pct}%`
                        : `⚠ 目标价格设置${formData.type === 'take_profit' ? '过低' : '过高'}，请调整`}
                    </div>
                  </div>
                );
              })()}

              {/* 保存按钮 */}
              <button
                onClick={saveAlert}
                disabled={!formData.stockCode || !formData.stockName || !formData.targetPrice}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 10,
                  background: (!formData.stockCode || !formData.stockName || !formData.targetPrice)
                    ? 'rgba(255,255,255,0.1)'
                    : 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  border: 'none',
                  color: (!formData.stockCode || !formData.stockName || !formData.targetPrice)
                    ? 'rgba(255,255,255,0.3)'
                    : '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: (!formData.stockCode || !formData.stockName || !formData.targetPrice)
                    ? 'not-allowed'
                    : 'pointer',
                }}
              >
                保存提醒
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
