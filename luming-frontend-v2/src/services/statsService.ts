/**
 * 网站数据统计服务
 * 使用 localStorage 记录浏览和注册事件，支持按日期聚合
 */

const PV_KEY = 'lm_stats_pv';       // 页面浏览记录
const REG_KEY = 'lm_stats_reg';     // 注册事件记录
const MAX_EVENTS = 10000;           // 最多保留事件数

interface PVEvent {
  ts: number;   // Unix timestamp ms
  path: string;
}

interface RegEvent {
  ts: number;
  username: string;
}

export interface DayStat {
  date: string;       // YYYY-MM-DD
  pv: number;
  uv: number;         // unique sessions (按 sessionStorage key 近似)
  reg: number;
}

export interface StatsSummary {
  pv: number;
  uv: number;
  reg: number;
  conversionRate: number;   // reg / uv * 100
}

export interface StatsComparison {
  current: StatsSummary;
  previous: StatsSummary;
  pvChange: number;    // 百分比环比变化
  uvChange: number;
  regChange: number;
}

// ─────────────────────────── 读写工具 ─────────────────────────────

function getPVEvents(): PVEvent[] {
  try {
    const raw = localStorage.getItem(PV_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function getRegEvents(): RegEvent[] {
  try {
    const raw = localStorage.getItem(REG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function savePVEvents(events: PVEvent[]) {
  // 只保留最新的 MAX_EVENTS 条
  const trimmed = events.slice(-MAX_EVENTS);
  localStorage.setItem(PV_KEY, JSON.stringify(trimmed));
}

function saveRegEvents(events: RegEvent[]) {
  const trimmed = events.slice(-MAX_EVENTS);
  localStorage.setItem(REG_KEY, JSON.stringify(trimmed));
}

// ─────────────────────────── 写入事件 ─────────────────────────────

/** 记录一次页面浏览 */
export function trackPageView(path: string) {
  const events = getPVEvents();
  events.push({ ts: Date.now(), path });
  savePVEvents(events);
}

/** 记录一次注册 */
export function trackRegistration(username: string) {
  const events = getRegEvents();
  events.push({ ts: Date.now(), username });
  saveRegEvents(events);
}

// ─────────────────────────── 时间范围 ─────────────────────────────

export type DateRange = 'today' | '7d' | '30d';

function getRangeMs(range: DateRange): { start: number; end: number } {
  const now = Date.now();
  const end = now;
  const DAY = 86400000;
  switch (range) {
    case 'today': {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      return { start: todayStart.getTime(), end };
    }
    case '7d':  return { start: now - 7 * DAY, end };
    case '30d': return { start: now - 30 * DAY, end };
  }
}

/** 获取上一个同等长度时段（用于环比） */
function getPreviousRangeMs(range: DateRange): { start: number; end: number } {
  const DAY = 86400000;
  const now = Date.now();
  switch (range) {
    case 'today': {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      return {
        start: todayStart.getTime() - DAY,
        end: todayStart.getTime() - 1,
      };
    }
    case '7d':  return { start: now - 14 * DAY, end: now - 7 * DAY };
    case '30d': return { start: now - 60 * DAY, end: now - 30 * DAY };
  }
}

// ─────────────────────────── 聚合计算 ─────────────────────────────

function toDateStr(ts: number): string {
  return new Date(ts).toISOString().split('T')[0];
}

function computeSummary(pvEvents: PVEvent[], regEvents: RegEvent[], start: number, end: number): StatsSummary {
  const pv = pvEvents.filter(e => e.ts >= start && e.ts <= end).length;

  // UV：按天+路径唯一会话近似（每天同一 path 第一次访问算 1 UV）
  const uvSet = new Set<string>();
  pvEvents.filter(e => e.ts >= start && e.ts <= end).forEach(e => {
    uvSet.add(toDateStr(e.ts)); // 简化：每天算 1 个独立用户
  });
  const uv = uvSet.size;

  const reg = regEvents.filter(e => e.ts >= start && e.ts <= end).length;
  const conversionRate = uv > 0 ? (reg / uv) * 100 : 0;

  return { pv, uv, reg, conversionRate };
}

/** 获取汇总统计 */
export function getSummary(range: DateRange): StatsSummary {
  const { start, end } = getRangeMs(range);
  return computeSummary(getPVEvents(), getRegEvents(), start, end);
}

/** 获取环比对比 */
export function getComparison(range: DateRange): StatsComparison {
  const pvEvents = getPVEvents();
  const regEvents = getRegEvents();

  const curr = getRangeMs(range);
  const prev = getPreviousRangeMs(range);

  const current = computeSummary(pvEvents, regEvents, curr.start, curr.end);
  const previous = computeSummary(pvEvents, regEvents, prev.start, prev.end);

  const pctChange = (curr: number, prev: number) =>
    prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

  return {
    current,
    previous,
    pvChange: pctChange(current.pv, previous.pv),
    uvChange: pctChange(current.uv, previous.uv),
    regChange: pctChange(current.reg, previous.reg),
  };
}

/** 获取按天分解数据（用于折线图） */
export function getDailyBreakdown(range: DateRange): DayStat[] {
  const pvEvents = getPVEvents();
  const regEvents = getRegEvents();

  const days = range === 'today' ? 1 : range === '7d' ? 7 : 30;
  const result: DayStat[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const dayStart = d.getTime();
    const dayEnd = dayStart + 86399999;
    const date = toDateStr(dayStart);

    const dayPV = pvEvents.filter(e => e.ts >= dayStart && e.ts <= dayEnd);
    const pv = dayPV.length;
    const uvSet = new Set(dayPV.map(e => e.path));
    const uv = Math.min(uvSet.size, pv); // 不超过 pv
    const reg = regEvents.filter(e => e.ts >= dayStart && e.ts <= dayEnd).length;

    result.push({ date, pv, uv, reg });
  }

  return result;
}

/** 生成演示数据（开发/演示用，可一键填充） */
export function seedDemoData() {
  const pvPaths = ['/discover', '/watchlist', '/portfolio', '/simulate', '/member', '/alerts'];
  const pvEvents: PVEvent[] = [];
  const regEvents: RegEvent[] = [];

  const now = Date.now();
  const DAY = 86400000;

  // 生成 60 天的数据
  for (let i = 59; i >= 0; i--) {
    const dayStart = now - i * DAY;
    // PV：每天随机 5-30 次，近期更多
    const pvCount = Math.floor(Math.random() * 25 + 5) + (i < 7 ? 10 : 0);
    for (let j = 0; j < pvCount; j++) {
      pvEvents.push({
        ts: dayStart + Math.random() * DAY,
        path: pvPaths[Math.floor(Math.random() * pvPaths.length)],
      });
    }
    // 注册：每天 0-2 次
    const regCount = Math.floor(Math.random() * 3);
    for (let j = 0; j < regCount; j++) {
      regEvents.push({
        ts: dayStart + Math.random() * DAY,
        username: `user_demo_${i}_${j}`,
      });
    }
  }

  savePVEvents(pvEvents);
  saveRegEvents(regEvents);
}

/** 清除所有统计数据 */
export function clearStats() {
  localStorage.removeItem(PV_KEY);
  localStorage.removeItem(REG_KEY);
}
