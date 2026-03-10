/**
 * 管理后台状态管理
 */

import { create } from 'zustand';
import {
  getUserList,
  getUserDetail,
  updateUserStatus,
  rechargeUserQuota,
  createUser,
  updateUser,
  deleteUser,
  adjustUserQuota,
  getQuotaTransactions,
  getApiBalance,
  getRoleList,
  createRole,
  updateRole,
  deleteRole,
  getSystemStats,
  getProjectStats,
  getQuotaStats,
} from '../api/admin';
import type {
  UserListItem,
  UserDetail,
  UserCreateData,
  UserUpdateData,
  QuotaAdjustData,
  TransactionItem,
  ApiBalance,
  RoleItem,
  SystemStats,
  ProjectStats,
  QuotaStats,
} from '../api/admin';
import { message } from 'antd';

interface AdminState {
  // 用户管理
  users: UserListItem[];
  userTotal: number;
  currentUser: UserDetail | null;
  userLoading: boolean;

  // 流水记录
  transactions: TransactionItem[];
  transactionTotal: number;
  transactionLoading: boolean;

  // API余额
  apiBalance: ApiBalance | null;
  apiBalanceLoading: boolean;

  // 角色管理
  roles: RoleItem[];
  roleLoading: boolean;

  // 统计数据
  systemStats: SystemStats | null;
  projectStats: ProjectStats | null;
  quotaStats: QuotaStats | null;
  statsLoading: boolean;

  // Actions
  fetchUsers: (params: {
    page?: number;
    per_page?: number;
    status?: string;
    search?: string;
  }) => Promise<void>;
  fetchUserDetail: (userId: number) => Promise<void>;
  updateUserStatus: (userId: number, status: string) => Promise<void>;
  rechargeQuota: (
    userId: number,
    amount: number,
    description: string
  ) => Promise<void>;
  createUser: (data: UserCreateData) => Promise<void>;
  updateUser: (userId: number, data: UserUpdateData) => Promise<void>;
  deleteUser: (userId: number) => Promise<void>;
  adjustQuota: (userId: number, data: QuotaAdjustData) => Promise<void>;
  fetchTransactions: (params?: {
    page?: number;
    per_page?: number;
    user_id?: number;
    type?: string;
    start_date?: string;
    end_date?: string;
  }) => Promise<void>;
  fetchApiBalance: () => Promise<void>;

  fetchRoles: () => Promise<void>;
  createRole: (data: {
    name: string;
    display_name: string;
    description?: string;
    permissions: string[];
  }) => Promise<void>;
  updateRole: (
    roleId: number,
    data: {
      display_name?: string;
      description?: string;
      permissions?: string[];
    }
  ) => Promise<void>;
  deleteRole: (roleId: number) => Promise<void>;

  fetchSystemStats: () => Promise<void>;
  fetchProjectStats: (params?: {
    start_date?: string;
    end_date?: string;
  }) => Promise<void>;
  fetchQuotaStats: (params?: {
    start_date?: string;
    end_date?: string;
  }) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
  // 初始状态
  users: [],
  userTotal: 0,
  currentUser: null,
  userLoading: false,

  transactions: [],
  transactionTotal: 0,
  transactionLoading: false,

  apiBalance: null,
  apiBalanceLoading: false,

  roles: [],
  roleLoading: false,

  systemStats: null,
  projectStats: null,
  quotaStats: null,
  statsLoading: false,

  // 用户管理Actions
  fetchUsers: async (params) => {
    set({ userLoading: true });
    try {
      const response = await getUserList(params);
      set({
        users: (response as any).items ?? [],
        userTotal: (response as any).total ?? 0,
        userLoading: false,
      });
    } catch (error: any) {
      message.error(error.response?.data?.detail || '获取用户列表失败');
      set({ userLoading: false });
    }
  },

  fetchUserDetail: async (userId) => {
    set({ userLoading: true });
    try {
      const response = await getUserDetail(userId);
      set({
        currentUser: response as any,
        userLoading: false,
      });
    } catch (error: any) {
      message.error(error.response?.data?.detail || '获取用户详情失败');
      set({ userLoading: false });
    }
  },

  updateUserStatus: async (userId, status) => {
    try {
      await updateUserStatus(userId, status);
      message.success('用户状态更新成功');
      // 重新加载用户列表
      const state = useAdminStore.getState();
      state.fetchUsers({});
    } catch (error: any) {
      message.error(error.response?.data?.detail || '更新用户状态失败');
      throw error;
    }
  },

  rechargeQuota: async (userId, amount, description) => {
    try {
      await rechargeUserQuota(userId, amount, description);
      message.success('配额充值成功');
      const state = useAdminStore.getState();
      if (state.currentUser?.id === userId) {
        state.fetchUserDetail(userId);
      }
    } catch (error: any) {
      message.error(error.response?.data?.detail || '配额充值失败');
      throw error;
    }
  },

  createUser: async (data) => {
    try {
      await createUser(data);
      message.success('用户创建成功');
      const state = useAdminStore.getState();
      state.fetchUsers({});
    } catch (error: any) {
      message.error(error.response?.data?.detail || '创建用户失败');
      throw error;
    }
  },

  updateUser: async (userId, data) => {
    try {
      await updateUser(userId, data);
      message.success('用户信息更新成功');
      const state = useAdminStore.getState();
      state.fetchUsers({});
    } catch (error: any) {
      message.error(error.response?.data?.detail || '更新用户失败');
      throw error;
    }
  },

  deleteUser: async (userId) => {
    try {
      await deleteUser(userId);
      message.success('用户已删除');
      const state = useAdminStore.getState();
      state.fetchUsers({});
    } catch (error: any) {
      message.error(error.response?.data?.detail || '删除用户失败');
      throw error;
    }
  },

  adjustQuota: async (userId, data) => {
    try {
      await adjustUserQuota(userId, data);
      message.success('配额调整成功');
      const state = useAdminStore.getState();
      state.fetchUsers({});
    } catch (error: any) {
      message.error(error.response?.data?.detail || '配额调整失败');
      throw error;
    }
  },

  fetchTransactions: async (params) => {
    set({ transactionLoading: true });
    try {
      const response = await getQuotaTransactions(params);
      set({
        transactions: (response as any).items ?? [],
        transactionTotal: (response as any).total ?? 0,
        transactionLoading: false,
      });
    } catch (error: any) {
      message.error(error.response?.data?.detail || '获取流水记录失败');
      set({ transactionLoading: false });
    }
  },

  fetchApiBalance: async () => {
    set({ apiBalanceLoading: true });
    try {
      const response = await getApiBalance();
      set({
        apiBalance: response as any,
        apiBalanceLoading: false,
      });
    } catch (error: any) {
      message.error(error.response?.data?.detail || '获取API余额失败');
      set({ apiBalanceLoading: false });
    }
  },

  // 角色管理Actions
  fetchRoles: async () => {
    set({ roleLoading: true });
    try {
      const response = await getRoleList();
      set({
        roles: Array.isArray(response) ? response : (response as any) ?? [],
        roleLoading: false,
      });
    } catch (error: any) {
      message.error(error.response?.data?.detail || '获取角色列表失败');
      set({ roleLoading: false });
    }
  },

  createRole: async (data) => {
    try {
      await createRole(data);
      message.success('角色创建成功');
      // 重新加载角色列表
      const state = useAdminStore.getState();
      state.fetchRoles();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '创建角色失败');
      throw error;
    }
  },

  updateRole: async (roleId, data) => {
    try {
      await updateRole(roleId, data);
      message.success('角色更新成功');
      // 重新加载角色列表
      const state = useAdminStore.getState();
      state.fetchRoles();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '更新角色失败');
      throw error;
    }
  },

  deleteRole: async (roleId) => {
    try {
      await deleteRole(roleId);
      message.success('角色删除成功');
      // 重新加载角色列表
      const state = useAdminStore.getState();
      state.fetchRoles();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '删除角色失败');
      throw error;
    }
  },

  // 统计数据Actions
  fetchSystemStats: async () => {
    set({ statsLoading: true });
    try {
      const response = await getSystemStats();
      set({
        systemStats: response as any,
        statsLoading: false,
      });
    } catch (error: any) {
      message.error(error.response?.data?.detail || '获取系统统计失败');
      set({ statsLoading: false });
    }
  },

  fetchProjectStats: async (params) => {
    set({ statsLoading: true });
    try {
      const response = await getProjectStats(params);
      set({
        projectStats: response as any,
        statsLoading: false,
      });
    } catch (error: any) {
      message.error(error.response?.data?.detail || '获取项目统计失败');
      set({ statsLoading: false });
    }
  },

  fetchQuotaStats: async (params) => {
    set({ statsLoading: true });
    try {
      const response = await getQuotaStats(params);
      set({
        quotaStats: response as any,
        statsLoading: false,
      });
    } catch (error: any) {
      message.error(error.response?.data?.detail || '获取配额统计失败');
      set({ statsLoading: false });
    }
  },
}));
