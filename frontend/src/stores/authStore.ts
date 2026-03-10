/**
 * 认证状态管理 Store
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserInfo } from '../api/auth';

interface AuthState {
  // 状态
  user: UserInfo | null;
  token: string | null;
  isAuthenticated: boolean;

  // 操作
  setUser: (user: UserInfo | null) => void;
  setToken: (token: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // 初始状态
      user: null,
      token: null,
      isAuthenticated: false,

      // 设置用户信息
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      // 设置 Token
      setToken: (token) =>
        set({
          token,
        }),

      // 清除认证信息
      clearAuth: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage', // localStorage key
    }
  )
);
