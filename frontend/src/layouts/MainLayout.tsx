/**
 * 主布局组件 - 豆绘AI风格
 */
import { Dropdown, Avatar, Button, Badge } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { UserOutlined, LogoutOutlined, BellOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { logout } from '../api/auth';

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
    { label: 'AI创作', path: '/create/text2img', hasArrow: true },
    { label: '豆绘全景合成', path: '/create/img2img', hasArrow: true },
    { label: 'DeepSeek', path: '/create/text2img' },
    { label: 'API合作', path: '/' },
    { label: 'SeeAny', path: '/', badge: '电商专题' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* 顶部公告栏 */}
      <div style={{
        background: 'linear-gradient(to right, #f0fdf4, #fefce8)',
        borderBottom: '1px solid #dcfce7',
        textAlign: 'center',
        padding: '6px 16px',
        fontSize: 13,
        color: '#4b5563',
      }}>
        🌸🌿 春日焕新季，充值享特惠！最高可领{' '}
        <span style={{ color: '#ef4444', fontWeight: 600 }}>10000 豆点</span>
        ，MJ/Banana 模型{' '}
        <span style={{ color: '#16a34a', cursor: 'pointer' }}>免费畅玩</span>
        <span style={{
          marginLeft: 8, background: '#16a34a', color: '#fff',
          fontSize: 12, padding: '2px 8px', borderRadius: 4, cursor: 'pointer',
        }}>立即前往</span>
        <button style={{
          marginLeft: 16, color: '#9ca3af', background: 'none',
          border: 'none', cursor: 'pointer', fontSize: 14,
        }}>✕</button>
      </div>

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

        {/* 导航链接 */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => navigate(link.path)}
              style={{
                padding: '6px 12px',
                fontSize: 14,
                borderRadius: 8,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: location.pathname === link.path ? '#16a34a' : '#4b5563',
                fontWeight: location.pathname === link.path ? 500 : 400,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (location.pathname !== link.path) {
                  (e.currentTarget as HTMLButtonElement).style.color = '#1f2937';
                  (e.currentTarget as HTMLButtonElement).style.background = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (location.pathname !== link.path) {
                  (e.currentTarget as HTMLButtonElement).style.color = '#4b5563';
                  (e.currentTarget as HTMLButtonElement).style.background = 'none';
                }
              }}
            >
              {link.label}
              {link.hasArrow && <span style={{ color: '#9ca3af', fontSize: 11 }}>▾</span>}
              {link.badge && (
                <span style={{
                  background: '#ef4444', color: '#fff',
                  fontSize: 11, padding: '1px 4px', borderRadius: 3, marginLeft: 2,
                }}>{link.badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* 右侧操作区 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {isAuthenticated ? (
            <>
              <button style={{
                fontSize: 13, color: '#6b7280', background: 'none',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <UserOutlined /> 邀请好友送豆点
              </button>
              <button style={{
                fontSize: 13, color: '#6b7280', background: 'none',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <ThunderboltOutlined /> 每日领豆点
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#4b5563' }}>
                <ThunderboltOutlined style={{ color: '#f59e0b' }} />
                <span>豆点 {Math.floor(Number(user?.quota_balance || 0))}</span>
              </div>
              <Button
                type="primary"
                size="small"
                style={{ background: '#16a34a', borderColor: '#16a34a' }}
                onClick={() => navigate('/profile')}
              >
                充值
              </Button>
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
              <Button
                type="primary"
                onClick={() => navigate('/auth/register')}
                style={{ background: '#16a34a', borderColor: '#16a34a' }}
              >
                注册
              </Button>
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
