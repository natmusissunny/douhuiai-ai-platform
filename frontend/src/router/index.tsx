/**
 * 路由配置（精简版 — 只保留编辑相关功能）
 */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { AdminRoute, ProtectedRoute } from '../components/ProtectedRoute';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';

import ProjectListPage from '../pages/ProjectListPage';
import UserProfilePage from '../pages/UserProfilePage';
import EditPage from '../pages/EditPage';
import ProjectDetailPage from '../pages/ProjectDetailPage';

import { DashboardPage as AdminDashboardPage } from '../pages/admin/DashboardPage';
import { UserManagementPage } from '../pages/admin/UserManagementPage';
import { RoleManagementPage } from '../pages/admin/RoleManagementPage';
import { ProjectManagementPage } from '../pages/admin/ProjectManagementPage';
import { StatisticsPage } from '../pages/admin/StatisticsPage';
import { SettingsPage } from '../pages/admin/SettingsPage';
import { QuotaMonitorPage } from '../pages/admin/QuotaMonitorPage';
import { TransactionPage } from '../pages/admin/TransactionPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'projects', element: <ProtectedRoute><ProjectListPage /></ProtectedRoute> },
      { path: 'projects/:id', element: <ProtectedRoute><ProjectDetailPage /></ProtectedRoute> },
      // 编辑应用（精简版唯一功能入口）
      { path: 'create/edit', element: <ProtectedRoute><EditPage /></ProtectedRoute> },
      { path: 'profile', element: <ProtectedRoute><UserProfilePage /></ProtectedRoute> },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },

    ],
  },
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { path: 'dashboard', element: <AdminDashboardPage /> },
      { path: 'users', element: <UserManagementPage /> },
      { path: 'roles', element: <RoleManagementPage /> },
      { path: 'projects', element: <ProjectManagementPage /> },
      { path: 'statistics', element: <StatisticsPage /> },
      { path: 'quota-monitor', element: <QuotaMonitorPage /> },
      { path: 'transactions', element: <TransactionPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default router;
