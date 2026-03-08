import { Filter } from 'lucide-react';
import type { CSSProperties } from 'react';

export interface Category {
  key: string;
  label: string;
}

interface CategoryFilterProps {
  categories: Category[];
  activeKey: string;
  onChange: (key: string) => void;
  style?: CSSProperties;
  className?: string;
}

// 更完善的行业分类，涵盖申万一级行业
const DEFAULT_CATEGORIES: Category[] = [
  { key: 'all', label: '全部行业' },
  // 金融
  { key: '银行', label: '银行' },
  { key: '非银金融', label: '非银金融' },
  // 科技
  { key: '电子', label: '电子' },
  { key: '计算机', label: '计算机' },
  { key: '通信', label: '通信' },
  { key: '传媒', label: '传媒' },
  // 消费
  { key: '食品饮料', label: '食品饮料' },
  { key: '家用电器', label: '家用电器' },
  { key: '纺织服饰', label: '纺织服饰' },
  { key: '轻工制造', label: '轻工制造' },
  { key: '商贸零售', label: '商贸零售' },
  { key: '社会服务', label: '社会服务' },
  // 医药
  { key: '医药生物', label: '医药生物' },
  // 制造业
  { key: '汽车', label: '汽车' },
  { key: '机械设备', label: '机械设备' },
  { key: '电力设备', label: '电力设备' },
  { key: '国防军工', label: '国防军工' },
  { key: '有色金属', label: '有色金属' },
  { key: '钢铁', label: '钢铁' },
  { key: '化工', label: '化工' },
  { key: '建筑材料', label: '建筑材料' },
  { key: '建筑装饰', label: '建筑装饰' },
  // 能源与公用
  { key: '石油石化', label: '石油石化' },
  { key: '煤炭', label: '煤炭' },
  { key: '公用事业', label: '公用事业' },
  { key: '环保', label: '环保' },
  // 交通运输
  { key: '交通运输', label: '交通运输' },
  // 房地产
  { key: '房地产', label: '房地产' },
  // 新兴产业
  { key: '人工智能', label: '人工智能' },
  { key: '新能源', label: '新能源' },
  { key: '半导体', label: '半导体' },
];

export function CategoryFilter({
  categories = DEFAULT_CATEGORIES,
  activeKey,
  onChange,
  style,
  className = '',
}: CategoryFilterProps) {
  return (
    <div
      className={`category-filter ${className}`}
      style={{
        display: 'flex',
        gap: '8px',
        padding: '0 16px 16px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        ...style,
      }}
    >
      {categories.map((category) => (
        <button
          key={category.key}
          onClick={() => onChange(category.key)}
          className={`category-filter-item ${activeKey === category.key ? 'active' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '8px',
            border: activeKey === category.key
              ? '1px solid rgba(245, 158, 11, 0.3)'
              : '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            background:
              activeKey === category.key
                ? 'rgba(245, 158, 11, 0.12)'
                : 'rgba(255, 255, 255, 0.02)',
            color: activeKey === category.key ? '#fbbf24' : 'rgba(255, 255, 255, 0.4)',
            transition: 'all 0.2s',
          }}
        >
          {category.key === 'all' && <Filter size={12} />}
          <span>{category.label}</span>
        </button>
      ))}
    </div>
  );
}

export { DEFAULT_CATEGORIES };
