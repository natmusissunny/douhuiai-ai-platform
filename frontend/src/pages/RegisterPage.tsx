/**
 * 注册页面 - 豆绘AI风格
 */
import { useState } from 'react';
import { message } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/auth';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [focusField, setFocusField] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: '',
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim()) { message.warning('请输入用户名'); return; }
    if (form.username.length < 3) { message.warning('用户名至少3个字符'); return; }
    if (!form.email.trim()) { message.warning('请输入邮箱'); return; }
    if (!form.password.trim()) { message.warning('请输入密码'); return; }
    if (form.password.length < 6) { message.warning('密码至少6个字符'); return; }
    if (form.password !== form.confirm_password) { message.warning('两次密码不一致'); return; }

    setLoading(true);
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });
      message.success('注册成功！即将跳转登录');
      navigate('/auth/login');
    } catch (error: any) {
      message.error(error.response?.data?.detail || '注册失败，请稍后重试');
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

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    color: '#374151',
    marginBottom: 6,
    fontWeight: 500,
  };

  const fieldStyle: React.CSSProperties = { marginBottom: 16 };

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: '36px 32px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1f2937', textAlign: 'center', marginBottom: 28 }}>
        免费注册
      </h2>

      {/* 赠送提示 */}
      <div style={{
        background: '#f0fdf4', border: '1px solid #dcfce7',
        borderRadius: 8, padding: '10px 14px', marginBottom: 24,
        fontSize: 13, color: '#15803d', textAlign: 'center',
      }}>
        🎁 注册即送 <strong>100 豆点</strong>，免费体验 AI 创作
      </div>

      <form onSubmit={onSubmit}>
        <div style={fieldStyle}>
          <label style={labelStyle}>用户名</label>
          <input
            type="text" value={form.username} onChange={handleChange('username')}
            placeholder="至少3个字符" style={inputStyle('username')}
            onFocus={() => setFocusField('username')} onBlur={() => setFocusField(null)}
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>邮箱</label>
          <input
            type="email" value={form.email} onChange={handleChange('email')}
            placeholder="请输入邮箱地址" style={inputStyle('email')}
            onFocus={() => setFocusField('email')} onBlur={() => setFocusField(null)}
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>手机号 <span style={{ color: '#9ca3af', fontWeight: 400 }}>（可选）</span></label>
          <input
            type="tel" value={form.phone} onChange={handleChange('phone')}
            placeholder="请输入手机号" style={inputStyle('phone')}
            onFocus={() => setFocusField('phone')} onBlur={() => setFocusField(null)}
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>密码</label>
          <input
            type="password" value={form.password} onChange={handleChange('password')}
            placeholder="至少6个字符" style={inputStyle('password')}
            onFocus={() => setFocusField('password')} onBlur={() => setFocusField(null)}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>确认密码</label>
          <input
            type="password" value={form.confirm_password} onChange={handleChange('confirm_password')}
            placeholder="再次输入密码" style={inputStyle('confirm_password')}
            onFocus={() => setFocusField('confirm_password')} onBlur={() => setFocusField(null)}
          />
        </div>

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
          }}
        >
          {loading ? '注册中...' : '免费注册'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
          已有账号？{' '}
          <Link to="/auth/login" style={{ color: '#16a34a', fontWeight: 500, textDecoration: 'none' }}>
            立即登录
          </Link>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;
