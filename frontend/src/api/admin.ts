/**
 * 管理后台API客户端
 */

import request from './request';

// ==================== 类型定义 ====================

export interface UserListItem {
  id: number;
  username: string;
  email: string;
  phone?: string;
  role: { id: number; name: string };
  quota_balance: number;
  quota_limit?: number;
  monthly_quota?: number;
  status: string;
  created_at: string;
  last_login_at?: string;
}

export interface UserCreateData {
  username: string;
  email: string;
  password: string;
  phone?: string;
  nickname?: string;
  role_id: number;
  quota_balance?: number;
  quota_limit?: number;
  monthly_quota?: number;
  status?: string;
}

export interface UserUpdateData {
  email?: string;
  phone?: string;
  nickname?: string;
  role_id?: number;
  quota_limit?: number;
  monthly_quota?: number;
  status?: string;
}

export interface QuotaAdjustData {
  op: 'set' | 'add' | 'subtract';
  amount: number;
  remark: string;
}

export interface TransactionItem {
  id: number;
  user_id: number;
  username: string;
  type: string;
  amount: number;
  balance_after: number;
  remark?: string;
  description?: string;
  operator_id?: number;
  operator_username?: string;
  related_type?: string;
  related_id?: number;
  created_at: string;
}

export interface TransactionListResponse {
  total: number;
  items: TransactionItem[];
}

export interface ApiBalance {
  balance: number;
  app_id: string;
  warning: boolean;
  warning_threshold: number;
}

export interface UserListResponse {
  total: number;
  page: number;
  per_page: number;
  items: UserListItem[];
}

export interface UserDetail {
  id: number;
  username: string;
  email: string;
  phone?: string;
  nickname?: string;
  avatar_url?: string;
  role_id: number;
  role_name: string;
  quota_balance: number;
  status: string;
  is_verified: boolean;
  project_count: number;
  total_quota_used: number;
  created_at: string;
  last_login_at?: string;
}

export interface RoleItem {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  permissions: string[];
  user_count: number;
  created_at: string;
}

export interface SystemStats {
  total_users: number;
  active_users: number;
  new_users_today: number;
  new_users_this_week: number;
  total_projects: number;
  pending_projects: number;
  completed_projects_today: number;
  failed_projects_today: number;
  total_quota_recharged: number;
  total_quota_consumed: number;
  revenue_today: number;
  revenue_this_month: number;
}

export interface ProjectStats {
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  success_rate: number;
  avg_completion_time: number;
  popular_features: Array<{ name: string; count: number }>;
}

export interface QuotaStats {
  total_recharged: number;
  total_consumed: number;
  avg_recharge: number;
  top_consumers: Array<{
    user_id: number;
    username: string;
    consumed: number;
  }>;
  recharge_trend: Array<{ date: string; amount: number }>;
  consumption_trend: Array<{ date: string; amount: number }>;
}

// ==================== 用户管理 ====================

/**
 * 获取用户列表
 */
export const getUserList = (params: {
  page?: number;
  per_page?: number;
  status?: string;
  search?: string;
}) => {
  return request.get<UserListResponse>('/api/v1/admin/users', { params });
};

/**
 * 获取用户详情
 */
export const getUserDetail = (userId: number) => {
  return request.get<UserDetail>(`/api/v1/admin/users/${userId}`);
};

/**
 * 更新用户状态
 */
export const updateUserStatus = (userId: number, status: string) => {
  return request.put(`/api/v1/admin/users/${userId}/status`, { status });
};

/**
 * 给用户充值配额（旧接口，保留兼容）
 */
export const rechargeUserQuota = (
  userId: number,
  amount: number,
  description: string
) => {
  return request.post(`/api/v1/admin/users/${userId}/quota`, {
    amount,
    description,
  });
};

/**
 * 创建用户（管理员）
 */
export const createUser = (data: UserCreateData) => {
  return request.post(`/api/v1/admin/users`, data);
};

/**
 * 更新用户信息
 */
export const updateUser = (userId: number, data: UserUpdateData) => {
  return request.put(`/api/v1/admin/users/${userId}`, data);
};

/**
 * 删除用户（软删除）
 */
export const deleteUser = (userId: number) => {
  return request.delete(`/api/v1/admin/users/${userId}`);
};

/**
 * 调整用户配额（set/add/subtract + 必填备注）
 */
export const adjustUserQuota = (userId: number, data: QuotaAdjustData) => {
  return request.post(`/api/v1/admin/users/${userId}/quota/adjust`, data);
};

/**
 * 获取配额流水记录
 */
export const getQuotaTransactions = (params?: {
  page?: number;
  per_page?: number;
  user_id?: number;
  type?: string;
  start_date?: string;
  end_date?: string;
}) => {
  return request.get<TransactionListResponse>('/api/v1/admin/quota-transactions', { params });
};

/**
 * 获取豆绘AI API账户余额
 */
export const getApiBalance = () => {
  return request.get<ApiBalance>('/api/v1/admin/api-balance');
};

// ==================== 角色管理 ====================

/**
 * 获取角色列表
 */
export const getRoleList = () => {
  return request.get<RoleItem[]>('/api/v1/admin/roles');
};

/**
 * 创建角色
 */
export const createRole = (data: {
  name: string;
  display_name: string;
  description?: string;
  permissions: string[];
}) => {
  return request.post<RoleItem>('/api/v1/admin/roles', data);
};

/**
 * 更新角色
 */
export const updateRole = (
  roleId: number,
  data: {
    display_name?: string;
    description?: string;
    permissions?: string[];
  }
) => {
  return request.put<RoleItem>(`/api/v1/admin/roles/${roleId}`, data);
};

/**
 * 删除角色
 */
export const deleteRole = (roleId: number) => {
  return request.delete(`/api/v1/admin/roles/${roleId}`);
};

// ==================== 统计数据 ====================

/**
 * 获取系统统计
 */
export const getSystemStats = () => {
  return request.get<SystemStats>('/api/v1/admin/statistics/system');
};

/**
 * 获取项目统计
 */
export const getProjectStats = (params?: {
  start_date?: string;
  end_date?: string;
}) => {
  return request.get<ProjectStats>('/api/v1/admin/statistics/projects', {
    params,
  });
};

/**
 * 获取配额统计
 */
export const getQuotaStats = (params?: {
  start_date?: string;
  end_date?: string;
}) => {
  return request.get<QuotaStats>('/api/v1/admin/statistics/quota', { params });
};

// ==================== 任务管理 ====================

export interface AdminProjectItem {
  id: number;
  uuid: string;
  type: string;
  subtype?: string;
  status: string;
  progress: number;
  prompt: string;
  username: string;
  user_id: number;
  result_url?: string;
  result_urls?: string[];
  quota_cost: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface AdminProjectListResponse {
  total: number;
  items: AdminProjectItem[];
}

/** 获取所有用户的任务列表 */
export const getAdminProjects = (params?: {
  skip?: number;
  limit?: number;
  type?: string;
  status?: string;
  search?: string;
}): Promise<AdminProjectListResponse> => {
  return request.get('/api/v1/admin/projects', { params });
};
