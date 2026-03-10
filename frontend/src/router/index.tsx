/**
 * 路由配置
 */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { AdminRoute, ProtectedRoute } from '../components/ProtectedRoute';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import ProjectListPage from '../pages/ProjectListPage';
import UserProfilePage from '../pages/UserProfilePage';
import Text2ImgPage from '../pages/Text2ImgPage';
import Img2ImgPage from '../pages/Img2ImgPage';
import EditPage from '../pages/EditPage';
import Render3DPage from '../pages/Render3DPage';
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
      { path: 'dashboard', element: <ProtectedRoute><DashboardPage /></ProtectedRoute> },
      { path: 'projects', element: <ProtectedRoute><ProjectListPage /></ProtectedRoute> },
      { path: 'projects/:id', element: <ProtectedRoute><ProjectDetailPage /></ProtectedRoute> },
      // AI创作（文生图）
      { path: 'create/text2img', element: <ProtectedRoute><Text2ImgPage /></ProtectedRoute> },
      // 图片重绘（图生图）
      { path: 'create/img2img', element: <ProtectedRoute><Img2ImgPage /></ProtectedRoute> },
      // 编辑应用
      { path: 'create/edit', element: <ProtectedRoute><EditPage /></ProtectedRoute> },
      // 视频创作 / 3D渲染
      { path: 'create/3d', element: <ProtectedRoute><Render3DPage /></ProtectedRoute> },
      // 以下功能暂时重定向到文生图页面
      { path: 'create/video', element: <Navigate to="/create/3d" replace /> },
      { path: 'create/batch', element: <Navigate to="/create/text2img" replace /> },
      { path: 'profile', element: <ProtectedRoute><UserProfilePage /></ProtectedRoute> },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
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
