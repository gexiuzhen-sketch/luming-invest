import { useState, useEffect } from 'react';
import { Bell, TrendingUp, Target, Shield, Clock } from 'lucide-react';

// 推送设置类型
interface NotificationSettings {
  enabled: boolean;
  priceAlert: {
    enabled: boolean;
    riseThreshold: number;  // 涨幅阈值 (%)
    fallThreshold: number;  // 跌幅阈值 (%)
  };
  targetPrice: {
    enabled: boolean;
    alerts: Array<{
      stockCode: string;
      stockName: string;
      targetPrice: number;
      type: 'above' | 'below';
    }>;
  };
  portfolioAlert: {
    enabled: boolean;
    dailySummary: boolean;  // 每日持仓汇总
    profitLossAlert: boolean;  // 盈亏提醒
    profitThreshold: number;  // 盈亏阈值 (%)
  };
  marketEvents: {
    enabled: boolean;
    majorNews: boolean;  // 重大新闻
    indexChange: boolean;  // 指数变动
    sectorHot: boolean;  // 行业热点
  };
  quietHours: {
    enabled: boolean;
    startTime: string;  // HH:mm
    endTime: string;    // HH:mm
  };
}

// 推送记录类型
interface NotificationRecord {
  id: string;
  type: 'price' | 'target' | 'portfolio' | 'market';
  title: string;
  message: string;
  stockCode?: string;
  stockName?: string;
  timestamp: string;
  isRead: boolean;
}

/**
 * 消息推送设置页面
 */
export function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    priceAlert: {
      enabled: true,
      riseThreshold: 5,
      fallThreshold: 5,
    },
    targetPrice: {
      enabled: false,
      alerts: [],
    },
    portfolioAlert: {
      enabled: true,
      dailySummary: true,
      profitLossAlert: true,
      profitThreshold: 10,
    },
    marketEvents: {
      enabled: true,
      majorNews: true,
      indexChange: true,
      sectorHot: true,
    },
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
    },
  });

  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [showTargetPriceModal, setShowTargetPriceModal] = useState(false);
  const [newTargetAlert, setNewTargetAlert] = useState({
    stockCode: '',
    stockName: '',
    targetPrice: '',
    type: 'above' as 'above' | 'below',
  });

  // 从 localStorage 加载设置
  useEffect(() => {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse notification settings:', e);
      }
    }

    // 加载推送记录
    const savedNotifications = localStorage.getItem('notificationRecords');
    if (savedNotifications) {
      try {
        const records = JSON.parse(savedNotifications);
        // 只保留最近30天的记录
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const filtered = records.filter((r: NotificationRecord) =>
          new Date(r.timestamp) > thirtyDaysAgo
        );
        setNotifications(filtered.reverse());
      } catch (e) {
        console.error('Failed to parse notification records:', e);
      }
    }
  }, []);

  // 保存设置到 localStorage
  useEffect(() => {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  }, [settings]);

  // 更新设置
  const updateSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // 添加目标价提醒
  const addTargetPriceAlert = () => {
    if (!newTargetAlert.stockCode || !newTargetAlert.targetPrice) {
      window.alert('请填写完整信息');
      return;
    }

    const targetAlert = {
      stockCode: newTargetAlert.stockCode,
      stockName: newTargetAlert.stockName || newTargetAlert.stockCode,
      targetPrice: parseFloat(newTargetAlert.targetPrice),
      type: newTargetAlert.type,
    };

    setSettings(prev => ({
      ...prev,
      targetPrice: {
        ...prev.targetPrice,
        alerts: [...prev.targetPrice.alerts, targetAlert],
      },
    }));

    // 关闭弹窗并重置
    setShowTargetPriceModal(false);
    setNewTargetAlert({
      stockCode: '',
      stockName: '',
      targetPrice: '',
      type: 'above',
    });
  };

  // 删除目标价提醒
  const removeTargetPriceAlert = (index: number) => {
    setSettings(prev => ({
      ...prev,
      targetPrice: {
        ...prev.targetPrice,
        alerts: prev.targetPrice.alerts.filter((_, i) => i !== index),
      },
    }));
  };

  // 清空所有已读记录
  const clearReadNotifications = () => {
    const unread = notifications.filter(n => !n.isRead);
    setNotifications(unread);
    localStorage.setItem('notificationRecords', JSON.stringify(unread));
  };

  // 标记为已读
  const markAsRead = (id: string) => {
    const updated = notifications.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    );
    setNotifications(updated);
    localStorage.setItem('notificationRecords', JSON.stringify(updated.reverse()));
  };

  // 生成模拟推送记录
  const generateMockNotifications = () => {
    const mockRecords: NotificationRecord[] = [
      {
        id: '1',
        type: 'price',
        title: '贵州茅台 涨幅提醒',
        message: '贵州茅台(600519) 当前涨幅 +5.2%，超过您设置的 5% 阈值',
        stockCode: '600519',
        stockName: '贵州茅台',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        isRead: false,
      },
      {
        id: '2',
        type: 'target',
        title: '宁德时代 目标价提醒',
        message: '宁德时代(300750) 当前价格 198.50 元，已突破您设置的目标价 195.00 元',
        stockCode: '300750',
        stockName: '宁德时代',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        isRead: false,
      },
      {
        id: '3',
        type: 'portfolio',
        title: '每日持仓汇总',
        message: '今日持仓总收益 +2.3%，盈利股票 8 只，亏损股票 2 只',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        isRead: true,
      },
    ];
    setNotifications(mockRecords);
    localStorage.setItem('notificationRecords', JSON.stringify(mockRecords));
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 20, padding: '0 16px' }}>
        <Bell size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
        消息推送设置
      </h2>

      {/* 全局开关 */}
      <div style={{ padding: '0 16px 20px' }}>
        <div
          style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
              启用消息推送
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              开启后将接收实时价格提醒和市场动态
            </div>
          </div>
          <button
            onClick={() => updateSetting('enabled', !settings.enabled)}
            style={{
              width: '52px',
              height: '28px',
              borderRadius: '14px',
              background: settings.enabled ? '#22c55e' : 'rgba(255,255,255,0.2)',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.3s',
            }}
          >
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '11px',
                background: '#fff',
                position: 'absolute',
                top: '3px',
                left: settings.enabled ? '27px' : '3px',
                transition: 'left 0.3s',
              }}
            />
          </button>
        </div>
      </div>

      {settings.enabled && (
        <>
          {/* 价格提醒 */}
          <div style={{ padding: '0 16px 20px' }}>
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={18} style={{ color: '#ef4444' }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>价格变动提醒</span>
                </div>
                <button
                  onClick={() => updateSetting('priceAlert', { ...settings.priceAlert, enabled: !settings.priceAlert.enabled })}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    background: settings.priceAlert.enabled ? '#22c55e' : 'rgba(255,255,255,0.2)',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '9px',
                      background: '#fff',
                      position: 'absolute',
                      top: '3px',
                      left: settings.priceAlert.enabled ? '23px' : '3px',
                      transition: 'left 0.3s',
                    }}
                  />
                </button>
              </div>

              {settings.priceAlert.enabled && (
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                      涨幅提醒阈值
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="range"
                        min="1"
                        max="15"
                        step="1"
                        value={settings.priceAlert.riseThreshold}
                        onChange={(e) => updateSetting('priceAlert', {
                          ...settings.priceAlert,
                          riseThreshold: parseInt(e.target.value),
                        })}
                        style={{ flex: 1 }}
                      />
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#ef4444',
                        fontSize: 14,
                        fontWeight: 600,
                        minWidth: '50px',
                        textAlign: 'center',
                      }}>
                        +{settings.priceAlert.riseThreshold}%
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                      跌幅提醒阈值
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="range"
                        min="1"
                        max="15"
                        step="1"
                        value={settings.priceAlert.fallThreshold}
                        onChange={(e) => updateSetting('priceAlert', {
                          ...settings.priceAlert,
                          fallThreshold: parseInt(e.target.value),
                        })}
                        style={{ flex: 1 }}
                      />
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: 'rgba(34, 197, 94, 0.15)',
                        color: '#22c55e',
                        fontSize: 14,
                        fontWeight: 600,
                        minWidth: '50px',
                        textAlign: 'center',
                      }}>
                        -{settings.priceAlert.fallThreshold}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 目标价提醒 */}
          <div style={{ padding: '0 16px 20px' }}>
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Target size={18} style={{ color: '#f59e0b' }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>目标价提醒</span>
                </div>
                <button
                  onClick={() => updateSetting('targetPrice', { ...settings.targetPrice, enabled: !settings.targetPrice.enabled })}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    background: settings.targetPrice.enabled ? '#22c55e' : 'rgba(255,255,255,0.2)',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '9px',
                      background: '#fff',
                      position: 'absolute',
                      top: '3px',
                      left: settings.targetPrice.enabled ? '23px' : '3px',
                      transition: 'left 0.3s',
                    }}
                  />
                </button>
              </div>

              {settings.targetPrice.enabled && (
                <div>
                  {settings.targetPrice.alerts.length === 0 ? (
                    <div
                      style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: 'rgba(255,255,255,0.3)',
                        fontSize: 13,
                      }}
                    >
                      暂无目标价提醒，点击下方按钮添加
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {settings.targetPrice.alerts.map((alert, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.04)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                              {alert.stockName}
                            </div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                              {alert.stockCode}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: alert.type === 'above' ? '#ef4444' : '#22c55e',
                              }}
                            >
                              {alert.type === 'above' ? '>' : '<'} ¥{alert.targetPrice.toFixed(2)}
                            </div>
                            <button
                              onClick={() => removeTargetPriceAlert(index)}
                              style={{
                                fontSize: 11,
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#ef4444',
                                cursor: 'pointer',
                                marginTop: 4,
                              }}
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setShowTargetPriceModal(true)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      marginTop: 12,
                      borderRadius: '8px',
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px dashed rgba(245, 158, 11, 0.4)',
                      color: '#f59e0b',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    + 添加目标价提醒
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 持仓变动提醒 */}
          <div style={{ padding: '0 16px 20px' }}>
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={18} style={{ color: '#8b5cf6' }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>持仓变动提醒</span>
                </div>
                <button
                  onClick={() => updateSetting('portfolioAlert', { ...settings.portfolioAlert, enabled: !settings.portfolioAlert.enabled })}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    background: settings.portfolioAlert.enabled ? '#22c55e' : 'rgba(255,255,255,0.2)',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '9px',
                      background: '#fff',
                      position: 'absolute',
                      top: '3px',
                      left: settings.portfolioAlert.enabled ? '23px' : '3px',
                      transition: 'left 0.3s',
                    }}
                  />
                </button>
              </div>

              {settings.portfolioAlert.enabled && (
                <div>
                  <div style={{ padding: '8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>每日持仓汇总</span>
                    <button
                      onClick={() => updateSetting('portfolioAlert', { ...settings.portfolioAlert, dailySummary: !settings.portfolioAlert.dailySummary })}
                      style={{
                        width: '40px',
                        height: '22px',
                        borderRadius: '11px',
                        background: settings.portfolioAlert.dailySummary ? '#22c55e' : 'rgba(255,255,255,0.2)',
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '8px',
                          background: '#fff',
                          position: 'absolute',
                          top: '3px',
                          left: settings.portfolioAlert.dailySummary ? '20px' : '3px',
                          transition: 'left 0.3s',
                        }}
                      />
                    </button>
                  </div>

                  <div style={{ padding: '8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>盈亏提醒</span>
                    <button
                      onClick={() => updateSetting('portfolioAlert', { ...settings.portfolioAlert, profitLossAlert: !settings.portfolioAlert.profitLossAlert })}
                      style={{
                        width: '40px',
                        height: '22px',
                        borderRadius: '11px',
                        background: settings.portfolioAlert.profitLossAlert ? '#22c55e' : 'rgba(255,255,255,0.2)',
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '8px',
                          background: '#fff',
                          position: 'absolute',
                          top: '3px',
                          left: settings.portfolioAlert.profitLossAlert ? '20px' : '3px',
                          transition: 'left 0.3s',
                        }}
                      />
                    </button>
                  </div>

                  {settings.portfolioAlert.profitLossAlert && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                        盈亏提醒阈值
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="20"
                        step="1"
                        value={settings.portfolioAlert.profitThreshold}
                        onChange={(e) => updateSetting('portfolioAlert', {
                          ...settings.portfolioAlert,
                          profitThreshold: parseInt(e.target.value),
                        })}
                        style={{ width: '100%' }}
                      />
                      <div style={{ textAlign: 'center', fontSize: 13, color: '#f59e0b', marginTop: 8 }}>
                        ±{settings.portfolioAlert.profitThreshold}%
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 免打扰时段 */}
          <div style={{ padding: '0 16px 20px' }}>
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={18} style={{ color: '#06b6d4' }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>免打扰时段</span>
                </div>
                <button
                  onClick={() => updateSetting('quietHours', { ...settings.quietHours, enabled: !settings.quietHours.enabled })}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    background: settings.quietHours.enabled ? '#22c55e' : 'rgba(255,255,255,0.2)',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '9px',
                      background: '#fff',
                      position: 'absolute',
                      top: '3px',
                      left: settings.quietHours.enabled ? '23px' : '3px',
                      transition: 'left 0.3s',
                    }}
                  />
                </button>
              </div>

              {settings.quietHours.enabled && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input
                    type="time"
                    value={settings.quietHours.startTime}
                    onChange={(e) => updateSetting('quietHours', { ...settings.quietHours, startTime: e.target.value })}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: 13,
                    }}
                  />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>至</span>
                  <input
                    type="time"
                    value={settings.quietHours.endTime}
                    onChange={(e) => updateSetting('quietHours', { ...settings.quietHours, endTime: e.target.value })}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: 13,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* 推送记录 */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
            推送记录 ({notifications.length})
          </h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={generateMockNotifications}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#f59e0b',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              生成测试数据
            </button>
            {notifications.some(n => !n.isRead) && (
              <button
                onClick={clearReadNotifications}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                清空已读
              </button>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.3)',
            }}
          >
            <Bell size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div style={{ fontSize: 13 }}>暂无推送记录</div>
            <div style={{ fontSize: 11, marginTop: 4, opacity: 0.6 }}>
              开启推送后将在此显示通知
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notifications.map((record) => (
              <div
                key={record.id}
                onClick={() => markAsRead(record.id)}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: record.isRead ? 'rgba(255,255,255,0.02)' : 'rgba(245, 158, 11, 0.05)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  cursor: 'pointer',
                  opacity: record.isRead ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      {record.type === 'price' && <TrendingUp size={14} style={{ color: '#ef4444' }} />}
                      {record.type === 'target' && <Target size={14} style={{ color: '#f59e0b' }} />}
                      {record.type === 'portfolio' && <Shield size={14} style={{ color: '#8b5cf6' }} />}
                      {record.type === 'market' && <Bell size={14} style={{ color: '#06b6d4' }} />}
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                        {record.title}
                      </span>
                      {!record.isRead && (
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#ef4444',
                        }} />
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
                      {record.message}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
                      {new Date(record.timestamp).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 目标价提醒弹窗 */}
      {showTargetPriceModal && (
        <div
          onClick={() => setShowTargetPriceModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 360,
              padding: '24px',
              borderRadius: 16,
              background: '#1a1b1e',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 16 }}>
              添加目标价提醒
            </h3>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>
                股票代码
              </label>
              <input
                type="text"
                value={newTargetAlert.stockCode}
                onChange={(e) => setNewTargetAlert({ ...newTargetAlert, stockCode: e.target.value, stockName: e.target.value })}
                placeholder="如: 600519"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>
                目标价格（元）
              </label>
              <input
                type="number"
                value={newTargetAlert.targetPrice}
                onChange={(e) => setNewTargetAlert({ ...newTargetAlert, targetPrice: e.target.value })}
                placeholder="如: 1500"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>
                提醒类型
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setNewTargetAlert({ ...newTargetAlert, type: 'above' })}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: newTargetAlert.type === 'above'
                      ? 'rgba(239, 68, 68, 0.2)'
                      : 'rgba(255,255,255,0.05)',
                    border: newTargetAlert.type === 'above'
                      ? '1px solid #ef4444'
                      : '1px solid rgba(255,255,255,0.1)',
                    color: newTargetAlert.type === 'above' ? '#ef4444' : 'rgba(255,255,255,0.6)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  高于目标价
                </button>
                <button
                  onClick={() => setNewTargetAlert({ ...newTargetAlert, type: 'below' })}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: newTargetAlert.type === 'below'
                      ? 'rgba(34, 197, 94, 0.2)'
                      : 'rgba(255,255,255,0.05)',
                    border: newTargetAlert.type === 'below'
                      ? '1px solid #22c55e'
                      : '1px solid rgba(255,255,255,0.1)',
                    color: newTargetAlert.type === 'below' ? '#22c55e' : 'rgba(255,255,255,0.6)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  低于目标价
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowTargetPriceModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
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
              <button
                onClick={addTargetPriceAlert}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff',
                  fontSize: 14,
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

      {/* 说明文字 */}
      <div style={{ padding: '0 16px 16px' }}>
        <div
          style={{
            padding: '12px',
            borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.1)',
          }}
        >
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
            💡 <strong style={{ color: '#f59e0b' }}>提示：</strong>消息推送功能需要服务端支持。当前为前端演示版本，实际推送需要后端实现 WebSocket 或集成第三方推送服务（如极光推送、个推等）。
          </div>
        </div>
      </div>
    </div>
  );
}
