import { useMemo } from 'react';

interface DataPoint {
  date: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  showArea?: boolean;
}

/**
 * 简单的折线图组件
 * 使用SVG实现，用于展示持仓收益趋势
 */
export function LineChart({
  data,
  color = '#f59e0b',
  height = 120,
  showArea = true,
}: LineChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) return null;

    // 过滤无效数据（null、undefined、NaN）
    const validData = data.filter(d =>
      d != null &&
      typeof d.value === 'number' &&
      !isNaN(d.value) &&
      isFinite(d.value)
    );

    if (validData.length === 0) return null;

    const values = validData.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;

    // 计算Y坐标（反转，因为SVG原点在左上角）
    const points = validData.map((d, i) => {
      const x = (i / (validData.length - 1 || 1)) * 100;
      const y = 100 - ((d.value - minValue) / range) * 100;
      return { x, y, value: d.value, date: d.date };
    });

    return { points, minValue, maxValue };
  }, [data]);

  if (data.length === 0) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.3)',
          fontSize: 12,
        }}
      >
        暂无数据
      </div>
    );
  }

  if (!chartData) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.3)',
          fontSize: 12,
        }}
      >
        暂无数据
      </div>
    );
  }

  const { points, minValue, maxValue } = chartData;

  // 生成路径字符串
  const linePath = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`))
    .join('');

  // 生成区域填充路径
  const areaPath = `${linePath} L 100 100 L 0 100 Z`;

  // 计算最新收益
  const latestReturn = points.length > 0
    ? ((points[points.length - 1].value - points[0].value) / points[0].value * 100).toFixed(2)
    : '0.00';
  const isPositive = parseFloat(latestReturn) >= 0;

  return (
    <div>
      {/* 收益率标签 */}
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginRight: 4 }}>
          总收益率
        </span>
        <span
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: isPositive ? '#ef4444' : '#22c55e',
          }}
        >
          {isPositive ? '+' : ''}{latestReturn}%
        </span>
      </div>

      {/* 图表 */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          width: '100%',
          height: `${height}px`,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '8px',
        }}
      >
        {/* 网格线 */}
        {[0, 25, 50, 75, 100].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="0.3"
          />
        ))}

        {/* 区域填充 */}
        {showArea && (
          <defs>
            <linearGradient id={`area-gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
        )}
        {showArea && (
          <path
            d={areaPath}
            fill={`url(#area-gradient-${color})`}
          />
        )}

        {/* 折线 */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 数据点 */}
        {points.length <= 20 && // 数据点多时不显示点
          points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="1.5"
              fill={color}
            />
          ))}
      </svg>

      {/* 最值标签 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 8,
          fontSize: 10,
          color: 'rgba(255,255,255,0.4)',
        }}
      >
        <span>
          最低: {minValue.toFixed(2)}
          <br />
          <span style={{ fontSize: 9, opacity: 0.6 }}>
            {data.find(d => d.value === minValue)?.date || ''}
          </span>
        </span>
        <span style={{ textAlign: 'right' }}>
          最高: {maxValue.toFixed(2)}
          <br />
          <span style={{ fontSize: 9, opacity: 0.6 }}>
            {data.find(d => d.value === maxValue)?.date || ''}
          </span>
        </span>
      </div>
    </div>
  );
}
