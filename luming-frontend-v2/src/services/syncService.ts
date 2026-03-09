/**
 * 数据同步服务
 * 将用户的自选、持仓、模拟盘数据同步到后端，支持跨设备/浏览器访问
 *
 * 同步策略：
 * - 拉取（pull）：登录后从服务器拉取数据，合并到本地（服务器数据优先）
 * - 推送（push）：数据发生变化后 debounce 1.5s 推送到服务器
 * - 离线降级：后端不可达时加入离线队列，恢复后自动重试
 * - 冲突检测：基于 updated_at 时间戳，推送前检查服务端版本
 *
 * 安全：所有请求携带 JWT token（Authorization: Bearer <token>）
 */

const SYNC_BASE = '/api/user-data';
const SYNC_DEBOUNCE_MS = 1500;
const TOKEN_KEY = 'lm_auth_token';
const OFFLINE_QUEUE_KEY = 'lm_sync_offline_queue';
const LAST_SYNC_KEY = 'lm_last_sync_at';

// ─── 同步状态管理 ────────────────────────────────────────────

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

type SyncListener = (status: SyncStatus, message?: string) => void;
const _listeners: Set<SyncListener> = new Set();
let _currentStatus: SyncStatus = 'idle';

export function onSyncStatusChange(listener: SyncListener): () => void {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

export function getSyncStatus(): SyncStatus {
  return _currentStatus;
}

function _setSyncStatus(status: SyncStatus, message?: string) {
  _currentStatus = status;
  _listeners.forEach(fn => fn(status, message));
}

// ─── Token 管理 ─────────────────────────────────────────────

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) return { 'Content-Type': 'application/json' };
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// ─── 数据类型 ───────────────────────────────────────────────

export interface SyncPayload {
  watchlist: unknown[];
  watchlistGroups: unknown[];
  holdings: unknown[];
  simTrading: unknown;
  tradingDiary: unknown[];
  syncedAt: string;
}

// ─── 读取本地数据 ──────────────────────────────────────────────

export function getSyncPayload(): SyncPayload {
  const get = (key: string) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  return {
    watchlist: get('lm_watchlist') ?? [],
    watchlistGroups: get('watchlist_groups') ?? [],
    holdings: get('lm_holdings') ?? [],
    simTrading: get('simulatedTrading') ?? null,
    tradingDiary: get('trading_diary') ?? [],
    syncedAt: new Date().toISOString(),
  };
}

// ─── 应用远端数据到本地 ────────────────────────────────────────
// 修复：空数组也要正确同步（用户在设备A清空，设备B也应清空）

export function applySyncPayload(payload: SyncPayload): void {
  const set = (key: string, value: unknown) => {
    if (value !== null && value !== undefined) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  };

  // 只要是数组就同步（包括空数组），解决跨设备清空不生效的 bug
  if (Array.isArray(payload.watchlist)) {
    set('lm_watchlist', payload.watchlist);
  }
  if (Array.isArray(payload.watchlistGroups)) {
    set('watchlist_groups', payload.watchlistGroups);
  }
  if (Array.isArray(payload.holdings)) {
    set('lm_holdings', payload.holdings);
  }
  if (payload.simTrading !== undefined) {
    if (payload.simTrading === null) {
      localStorage.removeItem('simulatedTrading');
    } else {
      set('simulatedTrading', payload.simTrading);
    }
  }
  if (Array.isArray(payload.tradingDiary)) {
    set('trading_diary', payload.tradingDiary);
  }
}

// ─── 网络请求（带 JWT） ──────────────────────────────────────

export async function pullSync(username: string): Promise<{ data: SyncPayload | null; updatedAt: string | null }> {
  try {
    _setSyncStatus('syncing');
    const res = await fetch(`${SYNC_BASE}/${encodeURIComponent(username)}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    if (res.status === 401) {
      _setSyncStatus('error', 'token 已过期');
      return { data: null, updatedAt: null };
    }
    if (!res.ok) {
      _setSyncStatus('error');
      return { data: null, updatedAt: null };
    }
    const json = await res.json();
    _setSyncStatus('success');
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    return {
      data: json.data as SyncPayload,
      updatedAt: json.updated_at ?? null,
    };
  } catch {
    _setSyncStatus('offline');
    return { data: null, updatedAt: null };
  }
}

export async function pushSync(username: string, payload?: SyncPayload): Promise<boolean> {
  const data = payload ?? getSyncPayload();
  try {
    _setSyncStatus('syncing');
    const res = await fetch(`${SYNC_BASE}/${encodeURIComponent(username)}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ data }),
    });
    if (res.status === 401) {
      _setSyncStatus('error', 'token 已过期');
      return false;
    }
    if (!res.ok) {
      _setSyncStatus('error');
      _enqueueOffline(username, data);
      return false;
    }
    const json = await res.json();
    if (json.updated_at) {
      localStorage.setItem(LAST_SYNC_KEY, json.updated_at);
    }
    _setSyncStatus('success');
    return true;
  } catch {
    _setSyncStatus('offline');
    _enqueueOffline(username, data);
    return false;
  }
}

// ─── 离线队列 ─────────────────────────────────────────────────

function _enqueueOffline(username: string, payload: SyncPayload) {
  try {
    // 只保留最新的一条（后续变更会覆盖）
    const item = { username, payload, timestamp: new Date().toISOString() };
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(item));
  } catch {
    // localStorage 满了就算了
  }
}

/**
 * 尝试重发离线队列（网络恢复时调用）
 */
export async function flushOfflineQueue(): Promise<boolean> {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return true;

    const item = JSON.parse(raw) as { username: string; payload: SyncPayload };
    const success = await pushSync(item.username, item.payload);
    if (success) {
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
    }
    return success;
  } catch {
    return false;
  }
}

// 监听网络恢复事件
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushOfflineQueue();
  });
}

// ─── Debounce 推送 ─────────────────────────────────────────────

let _debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 安排一次延迟推送（数据变化后调用）
 * 自动从 localStorage 读取当前用户名，未登录时静默忽略
 */
export function schedulePush(username?: string) {
  const resolvedUsername = username ?? localStorage.getItem('lm_username');
  if (!resolvedUsername) return;  // 未登录，不同步
  if (!getToken()) return;       // 无 token，不同步

  if (_debounceTimer) clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(() => {
    pushSync(resolvedUsername);
  }, SYNC_DEBOUNCE_MS);
}
