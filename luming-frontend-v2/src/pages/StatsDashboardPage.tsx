import { useState, useEffect } from 'react';
import { BarChart2, Users, UserPlus, TrendingUp, RefreshCw, Trash2, Database } from 'lucide-react';
import {
  getComparison,
  getDailyBreakdown,
  seedDemoData,
  clearStats,
  type DateRange,
  type DayStat,
  type StatsComparison,
} from '../services/statsService';

// ─── 迷你 SVG 折线图 ────────────────────────────────────────────────────────

function MiniLineChart({
  data,
  color,
  height = 60,
}: {
  data: { value: number; label: string }[];
  color: string;
  height?: number;
}) {
  if (data.length < 2) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.2)',
          fontSize: 11,
        }}
      >
        暂无数据
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 100;
  const H = 100;

  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - ((d.value - min) / range) * (H * 0.8) - H * 0.1,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${W} ${H} L 0 ${H} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height, display: 'block' }}
    >
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${color.replace('#', '')})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── 每日柱状图 ─────────────────────────────────────────────────────────────

function DailyBarChart({ days }: { days: DayStat[] }) {
  if (days.length === 0) {
    return (
      <div
        style={{
          height: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.3)',
          fontSize: 13,
        }}
      >
        暂无数据，点击「填充演示数据」体验图表效果
      </div>
    );
  }

  const maxPV = Math.max(...days.map((d) => d.pv), 1);
  const showEvery = days.length > 14 ? 5 : days.length > 7 ? 3 : 1;

  return (
    <div style={{ overflowX: 'auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: days.length <= 7 ? 6 : 3,
          height: 120,
          minWidth: days.length > 14 ? days.length * 18 : 'auto',
        }}
      >
        {days.map((d, i) => {
          const pvH = Math.max((d.pv / maxPV) * 100, d.pv > 0 ? 4 : 0);
          const showLabel = i % showEvery === 0 || i === days.length - 1;
          return (
            <div
              key={d.date}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
              title={`${d.date}  PV:${d.pv} UV:${d.uv} 注册:${d.reg}`}
            >
              <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                {/* PV 柱 */}
                <div
                  style={{
                    flex: 1,
                    height: `${pvH}%`,
                    background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)',
                    borderRadius: '2px 2px 0 0',
                    minHeight: pvH > 0 ? 2 : 0,
                  }}
                />
                {/* 注册 柱 */}
                {d.reg > 0 && (
                  <div
                    style={{
                      width: 3,
                      height: `${Math.max((d.reg / maxPV) * 100 * 3, 4)}%`,
                      background: '#f59e0b',
                      borderRadius: '2px 2px 0 0',
                    }}
                  />
                )}
              </div>
              {showLabel && (
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
                  {d.date.slice(5)}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {/* 图例 */}
      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, background: '#6366f1', borderRadius: 2, display: 'inline-block' }} />
          PV
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 10, background: '#f59e0b', borderRadius: 2, display: 'inline-block' }} />
          注册
        </span>
      </div>
    </div>
  );
}

// ─── 环比变化徽章 ─────────────────────────────────────────────────────────

function ChangeBadge({ pct }: { pct: number }) {
  if (pct === 0) {
    return <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>持平</span>;
  }
  const up = pct > 0;
  return (
    <span
      style={{
        fontSize: 11,
        color: up ? '#22c55e' : '#ef4444',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      {up ? '▲' : '▼'} {Math.abs(pct)}%
    </span>
  );
}

// ─── KPI 卡片 ────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  change?: number;
  color: string;
  miniData?: { value: number; label: string }[];
}

function KpiCard({ icon, label, value, change, color, miniData }: KpiCardProps) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `${color}22`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color,
            }}
          >
            {icon}
          </div>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{label}</span>
        </div>
        {change !== undefined && <ChangeBadge pct={change} />}
      </div>

      <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}</div>

      {miniData && miniData.length >= 2 && (
        <div style={{ marginTop: 4, marginLeft: -16, marginRight: -16, marginBottom: -16 }}>
          <MiniLineChart data={miniData} color={color} height={50} />
        </div>
      )}
    </div>
  );
}

// ─── 主页面 ─────────────────────────────────────────────────────────────────

const RANGES: { label: string; value: DateRange }[] = [
  { label: '今日', value: 'today' },
  { label: '近7天', value: '7d' },
  { label: '近30天', value: '30d' },
];

export function StatsDashboardPage() {
  const [range, setRange] = useState<DateRange>('7d');
  const [comparison, setComparison] = useState<StatsComparison | null>(null);
  const [days, setDays] = useState<DayStat[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setComparison(getComparison(range));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDays(getDailyBreakdown(range));
  }, [range, refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  const handleSeedDemo = () => {
    seedDemoData();
    refresh();
  };

  const handleClear = () => {
    if (window.confirm('确认清除所有统计数据？')) {
      clearStats();
      refresh();
    }
  };

  const curr = comparison?.current;

  // 把每日数据转为迷你折线图数据
  const pvMini = days.map((d) => ({ value: d.pv, label: d.date }));
  const uvMini = days.map((d) => ({ value: d.uv, label: d.date }));
  const regMini = days.map((d) => ({ value: d.reg, label: d.date }));

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0b0f 0%, #1a1b26 100%)',
        padding: '24px 16px 80px',
        maxWidth: 480,
        margin: '0 auto',
      }}
    >
      {/* 标题栏 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>
            数据统计看板
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>
            基于本设备浏览数据
          </p>
        </div>
        <button
          onClick={refresh}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: 'none',
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="刷新数据"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* 日期范围筛选 */}
      <div
        style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 12,
          padding: 4,
          marginBottom: 20,
        }}
      >
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            style={{
              flex: 1,
              padding: '9px',
              borderRadius: 9,
              border: 'none',
              background: range === r.value ? 'rgba(99, 102, 241, 0.85)' : 'transparent',
              color: range === r.value ? '#fff' : 'rgba(255,255,255,0.5)',
              fontSize: 13,
              fontWeight: range === r.value ? 700 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* KPI 卡片网格 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <KpiCard
          icon={<BarChart2 size={16} />}
          label="页面浏览 PV"
          value={curr?.pv ?? 0}
          change={comparison?.pvChange}
          color="#6366f1"
          miniData={pvMini}
        />
        <KpiCard
          icon={<Users size={16} />}
          label="独立访客 UV"
          value={curr?.uv ?? 0}
          change={comparison?.uvChange}
          color="#3b82f6"
          miniData={uvMini}
        />
        <KpiCard
          icon={<UserPlus size={16} />}
          label="新增注册"
          value={curr?.reg ?? 0}
          change={comparison?.regChange}
          color="#f59e0b"
          miniData={regMini}
        />
        <KpiCard
          icon={<TrendingUp size={16} />}
          label="注册转化率"
          value={`${(curr?.conversionRate ?? 0).toFixed(1)}%`}
          color="#22c55e"
        />
      </div>

      {/* 环比说明 */}
      {comparison && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 20,
            fontSize: 12,
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          环比对比期间：PV {comparison.previous.pv} / UV {comparison.previous.uv} / 注册 {comparison.previous.reg}
        </div>
      )}

      {/* 每日柱状图 */}
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', margin: '0 0 16px' }}>
          每日流量
        </h3>
        <DailyBarChart days={days} />
      </div>

      {/* 热门页面 */}
      {days.length > 0 && (
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', margin: '0 0 12px' }}>
            近期数据明细
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {days
              .slice()
              .reverse()
              .slice(0, 7)
              .map((d) => (
                <div
                  key={d.date}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{d.date}</span>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <span style={{ fontSize: 12, color: '#6366f1' }}>PV {d.pv}</span>
                    <span style={{ fontSize: 12, color: '#3b82f6' }}>UV {d.uv}</span>
                    <span style={{ fontSize: 12, color: '#f59e0b' }}>注册 {d.reg}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 工具按钮 */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handleSeedDemo}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: 12,
            border: '1px solid rgba(99, 102, 241, 0.4)',
            background: 'rgba(99, 102, 241, 0.1)',
            color: '#6366f1',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Database size={14} />
          填充演示数据
        </button>
        <button
          onClick={handleClear}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: 12,
            border: '1px solid rgba(239, 68, 68, 0.3)',
            background: 'rgba(239, 68, 68, 0.08)',
            color: '#ef4444',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Trash2 size={14} />
          清除数据
        </button>
      </div>
    </div>
  );
}
