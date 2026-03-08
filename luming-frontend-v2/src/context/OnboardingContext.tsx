import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { ExperienceLevel, RiskTolerance } from '../types';

interface UserProfile {
  experience: ExperienceLevel;
  riskTolerance: RiskTolerance;
}

interface OnboardingContextValue {
  isCompleted: boolean;
  userProfile: UserProfile | null;
  completeOnboarding: (profile: UserProfile) => void;
  skipOnboarding: () => void;
}

const STORAGE_KEY = 'lm_onboarding_completed';
const PROFILE_KEY = 'lm_user_profile';

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    // 从LocalStorage加载引导状态
    const completed = localStorage.getItem(STORAGE_KEY);
    const profile = localStorage.getItem(PROFILE_KEY);

    setIsCompleted(completed === 'true');
    if (profile) {
      setUserProfile(JSON.parse(profile));
    }
  }, []);

  const completeOnboarding = (profile: UserProfile) => {
    localStorage.setItem(STORAGE_KEY, 'true');
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    setIsCompleted(true);
    setUserProfile(profile);
  };

  const skipOnboarding = () => {
    // 使用默认配置完成引导
    const defaultProfile: UserProfile = {
      experience: 'beginner',
      riskTolerance: 'moderate',
    };
    completeOnboarding(defaultProfile);
  };

  return (
    <OnboardingContext.Provider
      value={{
        isCompleted,
        userProfile,
        completeOnboarding,
        skipOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
