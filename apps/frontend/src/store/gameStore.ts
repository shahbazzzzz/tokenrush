import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GameStats {
  gamesPlayed: number;
  totalWins: number;
  totalLosses: number;
  biggestWin: number;
  currentStreak: number;
  bestStreak: number;
}

interface User {
  id: string;
  telegramId?: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  balance: number;
  lifetimeEarned: number;
  referralCode?: string;
}

interface GameStore {
  // User data
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Balance
  balance: number;
  updateBalance: (amount: number) => void;
  addTokens: (amount: number) => void;
  deductTokens: (amount: number) => boolean;
  
  // Game stats
  stats: GameStats;
  updateStats: (update: Partial<GameStats>) => void;
  recordWin: (amount: number) => void;
  recordLoss: (amount: number) => void;
  
  // Daily rewards
  lastDailyBonus: string | null;
  dailyStreak: number;
  claimDailyBonus: () => number;
  
  // Sound settings
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  toggleSound: () => void;
  toggleVibration: () => void;
  
  // Achievements
  unlockedAchievements: string[];
  unlockAchievement: (id: string) => void;
  
  // Reset
  reset: () => void;
}

const initialStats: GameStats = {
  gamesPlayed: 0,
  totalWins: 0,
  totalLosses: 0,
  biggestWin: 0,
  currentStreak: 0,
  bestStreak: 0,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // User
      user: null,
      setUser: (user) => set({ user, balance: user?.balance || 1000 }),
      
      // Balance
      balance: 1000, // Start with 1000 tokens
      updateBalance: (amount) => set((state) => ({ balance: state.balance + amount })),
      
      addTokens: (amount) => {
        const newBalance = get().balance + amount;
        set({ balance: newBalance });
        
        // Update lifetime earned if positive
        if (amount > 0 && get().user) {
          set((state) => ({
            user: state.user ? {
              ...state.user,
              lifetimeEarned: state.user.lifetimeEarned + amount,
            } : null,
          }));
        }
      },
      
      deductTokens: (amount) => {
        const currentBalance = get().balance;
        if (currentBalance >= amount) {
          set({ balance: currentBalance - amount });
          return true;
        }
        return false;
      },
      
      // Stats
      stats: initialStats,
      updateStats: (update) => set((state) => ({
        stats: { ...state.stats, ...update },
      })),
      
      recordWin: (amount) => {
        const stats = get().stats;
        set({
          stats: {
            ...stats,
            gamesPlayed: stats.gamesPlayed + 1,
            totalWins: stats.totalWins + 1,
            currentStreak: stats.currentStreak + 1,
            bestStreak: Math.max(stats.bestStreak, stats.currentStreak + 1),
            biggestWin: Math.max(stats.biggestWin, amount),
          },
        });
        get().addTokens(amount);
      },
      
      recordLoss: (amount) => {
        const stats = get().stats;
        set({
          stats: {
            ...stats,
            gamesPlayed: stats.gamesPlayed + 1,
            totalLosses: stats.totalLosses + 1,
            currentStreak: 0,
          },
        });
        get().deductTokens(amount);
      },
      
      // Daily rewards
      lastDailyBonus: null,
      dailyStreak: 0,
      
      claimDailyBonus: () => {
        const now = new Date().toDateString();
        const lastClaim = get().lastDailyBonus;
        
        if (lastClaim === now) {
          return 0; // Already claimed today
        }
        
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const streak = lastClaim === yesterday ? get().dailyStreak + 1 : 1;
        
        // Calculate bonus based on streak (100 base + 50 per streak day, max 500)
        const bonus = Math.min(100 + (streak - 1) * 50, 500);
        
        set({
          lastDailyBonus: now,
          dailyStreak: streak,
        });
        
        get().addTokens(bonus);
        return bonus;
      },
      
      // Settings
      soundEnabled: true,
      vibrationEnabled: true,
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleVibration: () => set((state) => ({ vibrationEnabled: !state.vibrationEnabled })),
      
      // Achievements
      unlockedAchievements: [],
      unlockAchievement: (id) => set((state) => ({
        unlockedAchievements: state.unlockedAchievements.includes(id)
          ? state.unlockedAchievements
          : [...state.unlockedAchievements, id],
      })),
      
      // Reset
      reset: () => set({
        user: null,
        balance: 1000,
        stats: initialStats,
        lastDailyBonus: null,
        dailyStreak: 0,
        unlockedAchievements: [],
      }),
    }),
    {
      name: 'tokenrush-storage',
      partialize: (state) => ({
        balance: state.balance,
        stats: state.stats,
        lastDailyBonus: state.lastDailyBonus,
        dailyStreak: state.dailyStreak,
        soundEnabled: state.soundEnabled,
        vibrationEnabled: state.vibrationEnabled,
        unlockedAchievements: state.unlockedAchievements,
      }),
    }
  )
);
