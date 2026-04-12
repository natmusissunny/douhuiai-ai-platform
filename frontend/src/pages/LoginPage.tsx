/**
 * 登录页面 - 豆绘AI风格
 */
import { useState } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { login, getCurrentUser } from '../api/auth';
import { useAuthStore } from '../stores/authStore';

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [focusField, setFocusField] = useState<string | null>(null);
  const { setUser, setToken } = useAuthStore();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { message.warning('请输入用户名'); return; }
    if (!password.trim()) { message.warning('请输入密码'); return; }

    setLoading(true);
    try {
      const loginRes = await login({ username, password });
      localStorage.setItem('access_token', loginRes.access_token);
      localStorage.setItem('refresh_token', loginRes.refresh_token);
      setToken(loginRes.access_token);

      const userInfo = await getCurrentUser();
      setUser(userInfo);

      message.success('登录成功！');
      navigate('/');
    } catch (error: any) {
      message.error(error.response?.data?.detail || '用户名或密码错误');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%',
    padding: '12px 16px',
    border: `1.5px solid ${focusField === field ? '#16a34a' : '#e5e7eb'}`,
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    background: '#fff',
    color: '#1f2937',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  });

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: '36px 32px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1f2937', textAlign: 'center', marginBottom: 28 }}>
        用户登录
      </h2>

      <form onSubmit={onSubmit}>
        {/* 用户名 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#374151', marginBottom: 6, fontWeight: 500 }}>
            用户名
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入用户名"
            style={inputStyle('username')}
            onFocus={() => setFocusField('username')}
            onBlur={() => setFocusField(null)}
            autoComplete="username"
          />
        </div>

        {/* 密码 */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#374151', marginBottom: 6, fontWeight: 500 }}>
            密码
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            style={inputStyle('password')}
            onFocus={() => setFocusField('password')}
            onBlur={() => setFocusField(null)}
            autoComplete="current-password"
          />
        </div>

        {/* 登录按钮 */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '13px',
            background: loading ? '#9ca3af' : 'linear-gradient(90deg, #16a34a, #15803d)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: 20,
            transition: 'opacity 0.15s',
          }}
        >
          {loading ? '登录中...' : '登 录'}
        </button>

      </form>

    </div>
  );
};

export default LoginPage;
