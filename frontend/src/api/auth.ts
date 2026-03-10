/**
 * 认证相关 API
 */
import request from './request';

// 登录请求
export interface LoginRequest {
  username: string;
  password: string;
}

// 登录响应
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// 注册请求
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  phone?: string;
}

// 用户信息
export interface UserInfo {
  id: number;
  username: string;
  email: string;
  phone?: string;
  quota_balance: number;
  role: {
    id: number;
    name: string;
    permissions: string[];
  };
  status: string;
  created_at: string;
}

/**
 * 用户登录
 */
export const login = (data: LoginRequest): Promise<LoginResponse> => {
  return request.post('/api/v1/auth/login', data);
};

/**
 * 用户注册
 */
export const register = (data: RegisterRequest): Promise<UserInfo> => {
  return request.post('/api/v1/auth/register', data);
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = (): Promise<UserInfo> => {
  return request.get('/api/v1/users/profile');
};

/**
 * 刷新 Token
 */
export const refreshToken = (refresh_token: string): Promise<LoginResponse> => {
  return request.post('/api/v1/auth/refresh', { refresh_token });
};

/**
 * 用户登出
 */
export const logout = (): Promise<void> => {
  return request.post('/api/v1/auth/logout');
};

/**
 * 修改密码
 */
export const changePassword = (old_password: string, new_password: string): Promise<void> => {
  return request.post('/api/v1/auth/change-password', { old_password, new_password });
};
