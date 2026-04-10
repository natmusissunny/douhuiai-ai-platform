/**
 * 管理后台布局
 */

import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Space,
  Badge,
  Typography,
} from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  ProjectOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  FundOutlined,
  AccountBookOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  // 菜单项
  const menuItems = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: '数据概览',
    },
    {
      key: '/admin/users',
      icon: <UserOutlined />,
      label: '用户管理',
    },
    {
      key: '/admin/roles',
      icon: <TeamOutlined />,
      label: '角色权限',
    },
    {
      key: '/admin/projects',
      icon: <ProjectOutlined />,
      label: '项目管理',
    },
    {
      key: '/admin/statistics',
      icon: <BarChartOutlined />,
      label: '数据统计',
    },
    {
      key: '/admin/quota-monitor',
      icon: <FundOutlined />,
      label: '余额监控',
    },
    {
      key: '/admin/transactions',
      icon: <AccountBookOutlined />,
      label: '配额流水',
    },
    {
      key: '/admin/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ];

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      label: '个人中心',
      icon: <UserOutlined />,
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      label: '账号设置',
      icon: <SettingOutlined />,
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: () => {
        clearAuth();
        navigate('/auth/login');
      },
    },
  ];

  return (
    <Layout className="min-h-screen">
      {/* 侧边栏 */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={220}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center text-white text-xl font-bold">
          {collapsed ? '豆绘' : '豆绘AI 管理后台'}
        </div>

        {/* 菜单 */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      {/* 主体内容 */}
      <Layout>
        {/* 顶部导航栏 */}
        <Header className="bg-white px-6 flex items-center justify-between shadow-sm">
          {/* 面包屑或标题 */}
          <div className="text-lg font-medium text-gray-800">
            {menuItems.find((item) => item.key === location.pathname)?.label ||
              '管理后台'}
          </div>

          {/* 右侧工具栏 */}
          <Space size="large">
            {/* 通知 */}
            <Badge count={0} showZero>
              <BellOutlined className="text-xl cursor-pointer hover:text-blue-500" />
            </Badge>

            {/* 用户信息 */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space className="cursor-pointer hover:bg-gray-50 px-3 py-1 rounded">
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  src={undefined}
                />
                <Text>{user?.username || '管理员'}</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* 内容区域 */}
        <Content className="m-6 p-6 bg-white rounded-lg shadow-sm">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
