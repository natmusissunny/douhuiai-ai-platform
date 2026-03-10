/**
 * 路由保护组件
 * 用于保护需要特定权限才能访问的路由
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { Result, Button } from 'antd';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  /** 子组件 */
  children: React.ReactNode;
  /** 需要的权限(可选) */
  requiredPermission?: string;
  /** 是否需要管理员权限 */
  requireAdmin?: boolean;
}

/**
 * 通用路由保护组件
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requireAdmin = false,
}) => {
  const { user, isAuthenticated } = useAuthStore();

  // 未登录,跳转到登录页
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  // 检查管理员权限
  if (requireAdmin) {
    const hasAdminPermission = user.role?.permissions?.includes('user.manage') ||
                               user.role?.permissions?.includes('role.manage') ||
                               user.role?.permissions?.includes('stats.view') ||
                               user.role?.permissions?.includes('*');

    if (!hasAdminPermission) {
      return (
        <Result
          status="403"
          title="403"
          subTitle="抱歉,您没有权限访问此页面。"
          extra={
            <Button type="primary" onClick={() => window.history.back()}>
              返回
            </Button>
          }
        />
      );
    }
  }

  // 检查特定权限
  if (requiredPermission) {
    const hasPermission = user.role?.permissions?.includes(requiredPermission) ||
                         user.role?.permissions?.includes('*');

    if (!hasPermission) {
      return (
        <Result
          status="403"
          title="403"
          subTitle={`您缺少 "${requiredPermission}" 权限,无法访问此页面。`}
          extra={
            <Button type="primary" onClick={() => window.history.back()}>
              返回
            </Button>
          }
        />
      );
    }
  }

  return <>{children}</>;
};

/**
 * 管理员路由保护(简写)
 */
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute requireAdmin={true}>
      {children}
    </ProtectedRoute>
  );
};

/**
 * 权限检查Hook
 */
export const usePermission = () => {
  const { user } = useAuthStore();

  const hasPermission = (permission: string): boolean => {
    if (!user?.role?.permissions) return false;
    return user.role.permissions.includes(permission) ||
           user.role.permissions.includes('*');
  };

  const isAdmin = (): boolean => {
    if (!user?.role?.permissions) return false;
    return user.role.permissions.includes('user.manage') ||
           user.role.permissions.includes('role.manage') ||
           user.role.permissions.includes('stats.view') ||
           user.role.permissions.includes('*');
  };

  return {
    hasPermission,
    isAdmin,
  };
};
