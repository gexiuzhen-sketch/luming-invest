import type { User, LoginResponse } from '../types';

// 统一使用相对路径
const API_BASE = '/api';

export class AuthService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE;
  }

  // 发送短信验证码
  async sendSmsCode(phone: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auth/sms/send?phone=${phone}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('发送验证码失败');
    }
  }

  // 验证短信码并登录
  async verifyAndLogin(phone: string, code: string): Promise<User> {
    const response = await fetch(`${this.baseUrl}/auth/sms/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });

    if (!response.ok) {
      throw new Error('登录失败');
    }

    const data: LoginResponse = await response.json();

    // 如果后端没有返回完整用户信息，构建默认用户
    if (!data.user || !data.user.id) {
      const defaultUser: User = {
        id: Date.now().toString(),
        phone,
        membershipLevel: 'free',
        createdAt: new Date().toISOString(),
      };
      return defaultUser;
    }

    return data.user;
  }

  // 登出
  async logout(): Promise<void> {
    // 如果需要调用后端登出接口
    // await fetch(`${this.baseUrl}/auth/logout`, { method: 'POST' });
  }
}

export const authService = new AuthService();
