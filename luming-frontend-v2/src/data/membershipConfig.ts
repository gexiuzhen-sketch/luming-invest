/**
 * 会员权限配置
 * 设计理念：免费用户获得足够价值体验，付费用户获得专业级功能
 */

export interface MembershipPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: MembershipFeatures;
  cta: string;
}

export interface MembershipFeatures {
  // 数据权限
  realtimeData: boolean;           // 实时行情数据
  dataDelay: string;               // 数据延迟说明
  marketCoverage: string[];        // 覆盖市场

  // 分析功能
  aiAnalysis: boolean;             // AI分析
  analysisDepth: string;           // 分析深度
  stockRecommendations: number;    // 每日推荐数量
  portfolioAnalysis: boolean;      // 投资组合分析

  // 交易功能
  paperTrading: boolean;           // 模拟交易
  realTrading: boolean;            // 真实交易
  tradingSignals: boolean;         // 交易信号
  alerts: boolean;                 // 价格提醒

  // 数据导出
  exportData: boolean;             // 导出数据
  reportGeneration: boolean;       // 生成报告

  // 支持
  supportLevel: string;            // 支持等级
  priorityAccess: boolean;         // 优先访问权
}

/**
 * 会员计划配置
 */
export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'free',
    name: '免费体验',
    price: '¥0',
    period: '永久免费',
    features: {
      // 数据权限 - 提升免费用户体验
      realtimeData: true,              // ✅ 提供实时数据（15分钟延迟）
      dataDelay: '15分钟延迟',         // 从"延迟"改为具体说明
      marketCoverage: ['A股'],         // ✅ 开放A股市场

      // 分析功能 - 充分体验核心价值
      aiAnalysis: true,                // ✅ 开放AI分析
      analysisDepth: '基础AI分析',     // 简化版分析
      stockRecommendations: 10,        // ✅ 每日10只推荐（从3只提升）
      portfolioAnalysis: true,         // ✅ 开放投资组合分析

      // 交易功能 - 体验模拟交易
      paperTrading: true,              // ✅ 开放模拟交易
      realTrading: false,
      tradingSignals: true,            // ✅ 基础交易信号
      alerts: true,                    // ✅ 每日3条价格提醒（从0提升）

      // 数据导出
      exportData: false,
      reportGeneration: false,

      // 支持
      supportLevel: '社区支持',
      priorityAccess: false,
    },
    cta: '免费体验',
  },
  {
    id: 'pro',
    name: '专业版',
    price: '¥98',
    period: '/月',
    features: {
      // 数据权限
      realtimeData: true,
      dataDelay: '实时数据（<3秒延迟）',
      marketCoverage: ['A股', '港股', '美股'],

      // 分析功能
      aiAnalysis: true,
      analysisDepth: '深度AI分析（多因子模型）',
      stockRecommendations: -1,       // 无限制
      portfolioAnalysis: true,

      // 交易功能
      paperTrading: true,
      realTrading: false,
      tradingSignals: true,
      alerts: true,                    // 无限制提醒

      // 数据导出
      exportData: true,
      reportGeneration: true,

      // 支持
      supportLevel: '优先支持',
      priorityAccess: true,
    },
    cta: '立即订阅',
  },
  {
    id: 'enterprise',
    name: '机构版',
    price: '¥398',
    period: '/月',
    features: {
      // 数据权限
      realtimeData: true,
      dataDelay: 'Level-1行情（<100ms）',
      marketCoverage: ['A股', '港股', '美股', '基金', '债券'],

      // 分析功能
      aiAnalysis: true,
      analysisDepth: '机构级深度分析（定制模型）',
      stockRecommendations: -1,
      portfolioAnalysis: true,

      // 交易功能
      paperTrading: true,
      realTrading: true,               // ✅ 支持真实交易
      tradingSignals: true,
      alerts: true,

      // 数据导出
      exportData: true,
      reportGeneration: true,

      // 支持
      supportLevel: '专属顾问',
      priorityAccess: true,
    },
    cta: '联系销售',
  },
];

/**
 * 获取用户当前会员计划
 */
export function getUserMembershipPlan(membershipLevel: string): MembershipPlan {
  const plan = MEMBERSHIP_PLANS.find(p => p.id === membershipLevel);
  return plan || MEMBERSHIP_PLANS[0];
}

/**
 * 检查用户是否有权限使用某个功能
 */
export function checkFeatureAccess(
  membershipLevel: string,
  feature: keyof MembershipFeatures
): boolean {
  const plan = getUserMembershipPlan(membershipLevel);
  return plan.features[feature] as boolean;
}

/**
 * 获取功能限制说明
 */
export function getFeatureLimit(membershipLevel: string, feature: string): string | number {
  const plan = getUserMembershipPlan(membershipLevel);
  const value = (plan.features as any)[feature];

  if (typeof value === 'boolean') {
    return value ? '已开通' : '需要升级';
  }

  if (typeof value === 'number') {
    return value === -1 ? '无限制' : value;
  }

  return value;
}

/**
 * 免费用户升级提示
 */
export const FREE_USER_UPGRADE_PROMPTS = {
  stockRecommendations: {
    title: '解锁无限推荐',
    message: '免费用户每日可查看10只推荐股票，升级专业版解锁无限推荐',
    action: '升级解锁',
  },
  realtimeData: {
    title: '升级实时行情',
    message: '免费用户数据有15分钟延迟，升级专业版获取<3秒实时数据',
    action: '升级体验',
  },
  hkUsStocks: {
    title: '解锁港股美股',
    message: '免费用户仅支持A股，升级专业版解锁港股、美股等全球市场',
    action: '立即升级',
  },
  alerts: {
    title: '解锁无限提醒',
    message: '免费用户每日3条价格提醒，升级专业版获取无限制智能提醒',
    action: '升级解锁',
  },
  exportData: {
    title: '解锁数据导出',
    message: '升级专业版即可导出历史数据和生成投资报告',
    action: '立即升级',
  },
};

/**
 * 价格对比表数据
 */
export const COMPARISON_TABLE = [
  {
    feature: '实时行情',
    free: '15分钟延迟',
    pro: '<3秒实时',
    enterprise: '<100ms Level-1',
    category: '数据',
  },
  {
    feature: '覆盖市场',
    free: 'A股',
    pro: 'A股+港股+美股',
    enterprise: '全市场',
    category: '数据',
  },
  {
    feature: 'AI推荐股票',
    free: '每日10只',
    pro: '无限制',
    enterprise: '无限制',
    category: '分析',
  },
  {
    feature: '模拟交易',
    free: '✅',
    pro: '✅',
    enterprise: '✅',
    category: '交易',
  },
  {
    feature: '真实交易',
    free: '❌',
    pro: '❌',
    enterprise: '✅',
    category: '交易',
  },
  {
    feature: '价格提醒',
    free: '每日3条',
    pro: '无限制',
    enterprise: '无限制',
    category: '服务',
  },
  {
    feature: '数据导出',
    free: '❌',
    pro: '✅',
    enterprise: '✅',
    category: '服务',
  },
  {
    feature: '客户支持',
    free: '社区',
    pro: '优先支持',
    enterprise: '专属顾问',
    category: '服务',
  },
];
