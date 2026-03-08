import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { MembershipLevel } from '../types';

interface MembershipContextValue {
  membershipLevel: MembershipLevel;
  dailyRemainingViews: number;
  dailyLimit: number;
  isTrial: boolean;
  trialDaysRemaining: number;
  trialExpired: boolean;
  features: {
    unlimitedViews: boolean;
    aiPortfolioAnalysis: boolean;
    simulatedTrading: boolean;
  };
  checkAccess: (feature: keyof MembershipContextValue['features']) => boolean;
  decrementUsage: () => void;
  resetDailyUsage: () => void;
  upgrade: () => Promise<void>;
  setMembershipLevel: (level: MembershipLevel) => void;
  setUnlimitedViews: () => void;
  startTrial: () => void;
}

// 免费用户每日可查看10次
const DAILY_LIMIT = 10;
const STORAGE_KEY = 'lm_daily_views';
const STORAGE_DATE_KEY = 'lm_daily_date';
const MEMBERSHIP_LEVEL_KEY = 'lm_membership_level';
const TRIAL_START_KEY = 'lm_trial_start';
const TRIAL_DURATION_DAYS = 7; // 7天免费试用

// 测试用户手机号（用于测试）
// eslint-disable-next-line react-refresh/only-export-components
export const TEST_USERS = ['13800138000', '18888888888'];

const MembershipContext = createContext<MembershipContextValue | undefined>(undefined);

export function MembershipProvider({ children }: { children: ReactNode }) {
  const [membershipLevel, setMembershipLevelState] = useState<MembershipLevel>(() => {
    // 从localStorage加载会员等级
    const stored = localStorage.getItem(MEMBERSHIP_LEVEL_KEY);
    return (stored === 'premium' ? 'premium' : 'free') as MembershipLevel;
  });
  const [dailyRemainingViews, setDailyRemainingViews] = useState(DAILY_LIMIT);

  // 试用状态计算
  const [isTrial, setIsTrial] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(TRIAL_DURATION_DAYS);

  useEffect(() => {
    // 检查是否需要重置每日次数
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem(STORAGE_DATE_KEY);

    if (storedDate !== today) {
      // 新的一天，重置次数
      localStorage.setItem(STORAGE_DATE_KEY, today);
      localStorage.setItem(STORAGE_KEY, String(DAILY_LIMIT));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDailyRemainingViews(DAILY_LIMIT);
    } else {
      // 加载今天的剩余次数
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        let remaining = parseInt(stored, 10);
        // 如果存储的次数异常（如0或负数），重置为限制数
        if (remaining < 0 || remaining > DAILY_LIMIT) {
          remaining = DAILY_LIMIT;
          localStorage.setItem(STORAGE_KEY, String(DAILY_LIMIT));
        }
        setDailyRemainingViews(remaining);
      }
    }

    // 检查试用状态
    const trialStart = localStorage.getItem(TRIAL_START_KEY);
    if (trialStart) {
      const startDate = new Date(trialStart);
      const todayDate = new Date();
      const daysDiff = Math.floor((todayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const remaining = Math.max(0, TRIAL_DURATION_DAYS - daysDiff);

      setTrialDaysRemaining(remaining);
      setIsTrial(remaining > 0);

      // 如果试用过期且不是付费会员，降级为免费用户
      if (remaining === 0 && membershipLevel === 'premium') {
        // 检查是否是试用用户（通过判断是否有试用开始记录）
        const wasTrial = localStorage.getItem('lm_was_trial');
        if (wasTrial) {
          setMembershipLevelState('free');
          localStorage.setItem(MEMBERSHIP_LEVEL_KEY, 'free');
        }
      }
    }
  }, [membershipLevel]);

  const trialExpired = isTrial === false && localStorage.getItem(TRIAL_START_KEY) !== null;

  // 试用期间享受会员权益
  const isPremiumEffective = membershipLevel === 'premium' || isTrial;

  const features = {
    unlimitedViews: isPremiumEffective,
    aiPortfolioAnalysis: isPremiumEffective,
    simulatedTrading: isPremiumEffective,
  };

  const checkAccess = (feature: keyof MembershipContextValue['features']): boolean => {
    if (isPremiumEffective) return true;

    if (feature === 'unlimitedViews') {
      return dailyRemainingViews > 0;
    }

    // 其他功能仅对付费/试用用户开放
    return false;
  };

  const decrementUsage = () => {
    if (membershipLevel === 'premium') return;

    const newCount = Math.max(0, dailyRemainingViews - 1);
    setDailyRemainingViews(newCount);
    localStorage.setItem(STORAGE_KEY, String(newCount));
  };

  const resetDailyUsage = () => {
    setDailyRemainingViews(DAILY_LIMIT);
    localStorage.setItem(STORAGE_KEY, String(DAILY_LIMIT));
  };

  const setMembershipLevel = (level: MembershipLevel) => {
    setMembershipLevelState(level);
    localStorage.setItem(MEMBERSHIP_LEVEL_KEY, level);
    // 如果升级为会员，重置查看次数为无限（通过设置一个大数值）
    if (level === 'premium') {
      localStorage.setItem(STORAGE_KEY, String(999999));
    }
  };

  const setUnlimitedViews = () => {
    // 设置为会员并给予无限次查看
    setMembershipLevel('premium');
    localStorage.setItem(STORAGE_KEY, String(999999));
  };

  const startTrial = () => {
    // 开始7天试用
    const trialStart = localStorage.getItem(TRIAL_START_KEY);
    if (!trialStart) {
      const now = new Date().toISOString();
      localStorage.setItem(TRIAL_START_KEY, now);
      localStorage.setItem('lm_was_trial', 'true');
      setIsTrial(true);
      setTrialDaysRemaining(TRIAL_DURATION_DAYS);
      // 试用期间给予会员权益
      localStorage.setItem(STORAGE_KEY, String(999999));
    }
  };

  const upgrade = async () => {
    // TODO: 调用支付API
    // 临时：模拟升级成功
    setMembershipLevel('premium');
    // 清除试用标记（正式付费后不再是试用用户）
    localStorage.removeItem('lm_was_trial');
  };

  return (
    <MembershipContext.Provider
      value={{
        membershipLevel,
        dailyRemainingViews,
        dailyLimit: DAILY_LIMIT,
        isTrial,
        trialDaysRemaining,
        trialExpired,
        features,
        checkAccess,
        decrementUsage,
        resetDailyUsage,
        upgrade,
        setMembershipLevel,
        setUnlimitedViews,
        startTrial,
      }}
    >
      {children}
    </MembershipContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMembership() {
  const context = useContext(MembershipContext);
  if (!context) {
    throw new Error('useMembership must be used within MembershipProvider');
  }
  return context;
}

/**
 * 检查是否为测试用户
 */
// eslint-disable-next-line react-refresh/only-export-components
export function isTestUser(phone: string): boolean {
  return TEST_USERS.includes(phone);
}
