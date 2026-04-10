/**
 * Axios HTTP 请求封装
 */
import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';

// API 基础URL（生产环境留空，走 nginx 代理；开发环境通过 .env 设置）
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// 创建 axios 实例
const request: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  async (error) => {
    const { response } = error;

    if (response) {
      const { status, data } = response;

      switch (status) {
        case 401:
          // Token 过期或无效，清除登录态并跳转登录页
          message.error('登录已过期，请重新登录');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/auth/login';
          break;
        case 403:
          // 权限不足（不清除 token，用户仍是登录状态）
          message.error(data?.detail || '权限不足');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器错误，请稍后重试');
          break;
        default:
          message.error(data?.detail || data?.message || '请求失败');
      }
    } else {
      message.error('网络错误，请检查网络连接');
    }

    return Promise.reject(error);
  }
);

export default request;
