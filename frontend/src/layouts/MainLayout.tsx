/**
 * 主布局组件 - 豆绘AI风格
 */
import { Dropdown, Avatar, Button, Badge } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import { UserOutlined, LogoutOutlined, BellOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { logout } from '../api/auth';

const MainLayout = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      navigate('/auth/login');
    }
  };

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '个人中心',
        onClick: () => navigate('/profile'),
      },
      { type: 'divider' as const },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  };

  const navLinks = [
    { label: '首页', path: '/' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* 顶部导航 */}
      <header style={{
        height: 64,
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 24,
        position: 'sticky',
        top: 0,
        zIndex: 20,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        {/* Logo */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}
          onClick={() => navigate('/')}
        >
          <div style={{
            width: 32, height: 32, background: '#16a34a', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 14,
          }}>豆</div>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1f2937' }}>豆绘AI</span>
        </div>

        {/* 导航链接 — 首页为绿色胶囊按钮（对齐官网） */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => navigate(link.path)}
              style={{
                padding: '4px 16px',
                fontSize: 13,
                borderRadius: 20,
                border: '1.5px solid #16a34a',
                background: '#fff',
                cursor: 'pointer',
                color: '#16a34a',
                fontWeight: 500,
                lineHeight: '24px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#f0fdf4';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#fff';
              }}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* 右侧操作区 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {isAuthenticated ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#4b5563' }}>
                <ThunderboltOutlined style={{ color: '#f59e0b' }} />
                <span>豆点 {Math.floor(Number(user?.quota_balance || 0))}</span>
              </div>
              <Badge count={0}>
                <BellOutlined style={{ color: '#6b7280', fontSize: 18, cursor: 'pointer' }} />
              </Badge>
              <Dropdown menu={userMenu} placement="bottomRight">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <Avatar size="small" icon={<UserOutlined />} style={{ background: '#16a34a' }} />
                  <span style={{ fontSize: 13, color: '#4b5563' }}>{user?.username}</span>
                </div>
              </Dropdown>
            </>
          ) : (
            <>
              <Button onClick={() => navigate('/auth/login')} style={{ color: '#4b5563' }}>登录</Button>
            </>
          )}
        </div>
      </header>

      {/* 主内容 */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
