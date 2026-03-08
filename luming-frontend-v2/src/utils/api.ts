// API utility functions
import type { Stock, TradingSignals, PortfolioAnalysis, User } from '../types';

// 统一使用相对路径，让 Vite proxy 或 Nginx 处理
const API_BASE = '/api';

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('API fetch error:', error);
    return null;
  }
}

export const api = {
  // Health check
  health: () => apiFetch<{ status: string }>('/health'),

  // Stock recommendations
  recs: (market: string) =>
    apiFetch<{ data: Stock[] }>(`/recs?market=${market}`),

  // Trading signals
  signals: (code: string, market: string) =>
    apiFetch<{ data: TradingSignals }>(`/signals?code=${code}&market=${market}`),

  // Portfolio analysis
  portfolioAnalyze: (userId: string) =>
    apiFetch<{ data: PortfolioAnalysis[] }>(`/portfolio/analyze?user_id=${userId}`, {
      method: 'POST',
    }),

  // Auth
  authSendSms: (phone: string) =>
    apiFetch(`/auth/sms/send?phone=${phone}`, { method: 'POST' }),

  authVerifySms: (phone: string, code: string) =>
    apiFetch<{ user: User }>('/auth/sms/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    }),
};
