import { useMemo } from 'react';

interface PieData {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieData[];
  size?: number;
}

/**
 * 饼图组件
 * 使用SVG实现，用于展示资产配置
 */
export function PieChart({ data, size = 140 }: PieChartProps) {
  const chartData = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    let currentAngle = -90; // 从顶部开始

    return data.map((item) => {
      const percentage = (item.value / total) * 100;
      const angle = (item.value / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      // 计算扇形路径
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = 50 + 40 * Math.cos(startRad);
      const y1 = 50 + 40 * Math.sin(startRad);
      const x2 = 50 + 40 * Math.cos(endRad);
      const y2 = 50 + 40 * Math.sin(endRad);

      const largeArcFlag = angle > 180 ? 1 : 0;

      const pathData = [
        `M 50 50`,
        `L ${x1} ${y1}`,
        `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z',
      ].join(' ');

      // eslint-disable-next-line react-hooks/immutability
      currentAngle = endAngle;

      return {
        ...item,
        percentage,
        pathData,
      };
    });
  }, [data]);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.3)',
          fontSize: 12,
        }}
      >
        暂无资产
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      {/* 饼图 */}
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        style={{ flexShrink: 0 }}
      >
        {chartData.map((item, index) => (
          <path
            key={index}
            d={item.pathData}
            fill={item.color}
            stroke="#0a0b0f"
            strokeWidth="1"
            style={{
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          />
        ))}

        {/* 中心圆（创建环形效果） */}
        <circle
          cx="50"
          cy="50"
          r="25"
          fill="#0a0b0f"
        />
      </svg>

      {/* 图例 */}
      <div style={{ flex: 1 }}>
        {chartData.map((item, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
              fontSize: 12,
            }}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                background: item.color,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 500 }}>
                {item.label}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                {item.value.toLocaleString()} ({item.percentage.toFixed(1)}%)
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
