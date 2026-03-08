// 用户类型
export interface User {
  id: string;
  phone: string;
  nickname?: string;
  avatar?: string;
  membershipLevel: MembershipLevel;
  experienceLevel?: ExperienceLevel;
  riskTolerance?: RiskTolerance;
  createdAt: string;
}

// 会员等级
export type MembershipLevel = 'free' | 'premium';

// 投资经验水平
export type ExperienceLevel = 'beginner' | 'intermediate' | 'expert';

// 风险偏好
export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';

// 用户登录请求
export interface LoginRequest {
  phone: string;
  code: string;
}

// 用户登录响应
export interface LoginResponse {
  user: User;
  token?: string;
}

// 发送验证码请求
export interface SendSmsRequest {
  phone: string;
}
