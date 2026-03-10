/**
 * 认证页面布局 - 豆绘AI风格
 */
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #fefce8 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56,
            background: '#16a34a',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
            fontSize: 24, color: '#fff', fontWeight: 700,
            boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
          }}>豆</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1f2937', margin: 0 }}>豆绘AI</h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>AI创意生成平台</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
