/**
 * 基金数据服务 - 每日更新的静态数据
 *
 * 基金净值每日更新一次，不需要实时性
 * 数据来源: 可以通过后端API每日更新，或手动维护
 */

// 基金静态数据（每日更新一次）
export const FUNDS_STATIC_DATA: Record<string, FundData> = {
  // ETF基金
  '510300': {
    code: '510300',
    name: '华泰柏瑞沪深300ETF',
    market: 'FUND',
    sector: '指数型',
    price: 4.485,
    changePct: -2.07,
    volume: '1.15亿',
    turnover: '5.2亿',
    nav: 4.485,
    totalAssets: '1180亿',
    fundManager: '柳军',
    establishmentDate: '2012-05-04',
    trackingIndex: '沪深300',
    expenseRatio: 0.50,
    lastUpdate: new Date().toDateString(),
  },
  '159915': {
    code: '159915',
    name: '华夏恒生ETF',
    market: 'FUND',
    sector: '指数型',
    price: 1.235,
    changePct: -1.28,
    volume: '8500万',
    turnover: '10.5亿',
    nav: 1.235,
    totalAssets: '280亿',
    fundManager: '徐猛',
    establishmentDate: '2012-08-09',
    trackingIndex: '恒生指数',
    expenseRatio: 0.60,
    lastUpdate: new Date().toDateString(),
  },
  '510500': {
    code: '510500',
    name: '南方中证500ETF',
    market: 'FUND',
    sector: '指数型',
    price: 6.825,
    changePct: -1.85,
    volume: '9800万',
    turnover: '6.7亿',
    nav: 6.825,
    totalAssets: '890亿',
    fundManager: '罗文杰',
    establishmentDate: '2013-03-25',
    trackingIndex: '中证500',
    expenseRatio: 0.45,
    lastUpdate: new Date().toDateString(),
  },
  '512690': {
    code: '512690',
    name: '华夏酒ETF',
    market: 'FUND',
    sector: '行业ETF',
    price: 0.825,
    changePct: -2.15,
    volume: '1.2亿',
    turnover: '9900万',
    nav: 0.825,
    totalAssets: '125亿',
    fundManager: '李俊',
    establishmentDate: '2019-09-10',
    trackingIndex: '中证白酒',
    expenseRatio: 0.55,
    lastUpdate: new Date().toDateString(),
  },
  '515790': {
    code: '515790',
    name: '光伏ETF',
    market: 'FUND',
    sector: '行业ETF',
    price: 0.925,
    changePct: -3.20,
    volume: '6500万',
    turnover: '6000万',
    nav: 0.925,
    totalAssets: '85亿',
    fundManager: '赵宗庭',
    establishmentDate: '2021-02-09',
    trackingIndex: '中证光伏产业',
    expenseRatio: 0.50,
    lastUpdate: new Date().toDateString(),
  },
  '159995': {
    code: '159995',
    name: '芯片ETF',
    market: 'FUND',
    sector: '行业ETF',
    price: 1.125,
    changePct: -1.80,
    volume: '1.8亿',
    turnover: '2.0亿',
    nav: 1.125,
    totalAssets: '180亿',
    fundManager: '赵宗庭',
    establishmentDate: '2020-04-15',
    trackingIndex: '国证芯片',
    expenseRatio: 0.65,
    lastUpdate: new Date().toDateString(),
  },

  // 开放式基金
  '110011': {
    code: '110011',
    name: '易方达优质精选',
    market: 'FUND',
    sector: '混合型',
    price: 2.785,
    changePct: -2.28,
    volume: '5200万',
    turnover: '1.45亿',
    nav: 2.785,
    totalAssets: '145亿',
    fundManager: '张坤',
    establishmentDate: '2005-08-25',
    expenseRatio: 1.50,
    lastUpdate: new Date().toDateString(),
  },
  '163406': {
    code: '163406',
    name: '兴全合润',
    market: 'FUND',
    sector: '混合型',
    price: 3.185,
    changePct: -2.00,
    volume: '2800万',
    turnover: '0.9亿',
    nav: 3.185,
    totalAssets: '195亿',
    fundManager: '谢治宇',
    establishmentDate: '2010-04-22',
    expenseRatio: 1.50,
    lastUpdate: new Date().toDateString(),
  },
  '000961': {
    code: '000961',
    name: '天弘沪深300ETF',
    market: 'FUND',
    sector: '指数型',
    price: 1.828,
    changePct: -1.19,
    volume: '8200万',
    turnover: '1.5亿',
    nav: 1.828,
    totalAssets: '495亿',
    fundManager: '杨超',
    establishmentDate: '2012-05-09',
    trackingIndex: '沪深300',
    expenseRatio: 0.50,
    lastUpdate: new Date().toDateString(),
  },
  '161725': {
    code: '161725',
    name: '招商中证白酒',
    market: 'FUND',
    sector: '指数型',
    price: 0.6854,
    changePct: -2.15,
    volume: '6500万',
    turnover: '4500万',
    nav: 0.6854,
    totalAssets: '185亿',
    fundManager: '侯昊',
    establishmentDate: '2015-05-27',
    trackingIndex: '中证白酒',
    expenseRatio: 1.00,
    lastUpdate: new Date().toDateString(),
  },
};

/**
 * 获取基金数据（静态数据）
 */
export function getFundData(code: string): FundData | null {
  return FUNDS_STATIC_DATA[code] || null;
}

/**
 * 批量获取基金数据
 */
export function getFundBatchData(codes: string[]): Record<string, FundData> {
  const result: Record<string, FundData> = {};
  codes.forEach(code => {
    const data = getFundData(code);
    if (data) {
      result[code] = data;
    }
  });
  return result;
}

/**
 * 获取所有基金列表
 */
export function getAllFunds(): FundData[] {
  return Object.values(FUNDS_STATIC_DATA);
}

/**
 * 搜索基金
 */
export function searchFunds(query: string): FundData[] {
  const lowerQuery = query.toLowerCase();
  return getAllFunds().filter(fund =>
    fund.code.toLowerCase().includes(lowerQuery) ||
    fund.name.toLowerCase().includes(lowerQuery) ||
    fund.sector.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 检查基金数据是否需要更新（每日更新一次）
 */
export function needsUpdate(): boolean {
  const lastUpdate = localStorage.getItem('fund_data_last_update');
  if (!lastUpdate) return true;

  const lastUpdateDate = new Date(lastUpdate);
  const today = new Date();

  // 如果最后更新日期不是今天，则需要更新
  return lastUpdateDate.toDateString() !== today.toDateString();
}

/**
 * 标记基金数据已更新
 */
export function markAsUpdated(): void {
  localStorage.setItem('fund_data_last_update', new Date().toISOString());
}

/**
 * 从服务器获取更新的基金数据
 */
export async function fetchUpdatedFundData(): Promise<Record<string, FundData>> {
  try {
    const response = await fetch('/api/funds/daily');
    if (response.ok) {
      const data = await response.json();
      markAsUpdated();
      return data;
    }
  } catch (error) {
    console.warn('Failed to fetch fund updates:', error);
  }
  return FUNDS_STATIC_DATA;
}

// 类型定义
export interface FundData {
  code: string;
  name: string;
  market: string;
  sector: string;
  price: number;
  changePct: number;
  volume: string;
  turnover: string;
  nav: number;              // 单位净值
  totalAssets: string;      // 基金规模
  fundManager: string;      // 基金经理
  establishmentDate: string; // 成立日期
  trackingIndex?: string;   // 跟踪指数（ETF专用）
  expenseRatio: number;     // 管理费率
  lastUpdate: string;       // 最后更新日期
}

/**
 * 将基金数据转换为股票格式（兼容现有系统）
 */
export function fundDataToStockFormat(fund: FundData): any {
  return {
    code: fund.code,
    name: fund.name,
    market: fund.market,
    sector: fund.sector,
    price: fund.price,
    changePct: fund.changePct,
    volume: fund.volume,
    turnover: fund.turnover,
    pe: 0,    // 基金没有市盈率
    roe: 0,   // 基金没有ROE
    rsi: 50,  // 默认中性
    macd: 'neutral',
  };
}
