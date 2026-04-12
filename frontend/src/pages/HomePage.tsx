/**
 * 首页 - 豆绘AI风格
 * 左侧导航：图标+文字横排，36px高度，悬停弹出二级菜单
 */
import { useState } from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

// 左侧导航数据（精简版：编辑应用 + 产品电商 + 图片库 + 我的作品）
const navItems = [
  {
    label: '编辑应用',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
    path: '/create/edit',
    sub: [
      { label: '图片精修', path: '/create/edit' },
      { label: 'PS场景融合', path: '/create/edit' },
      { label: '批量抠图', path: '/create/edit' },
    ],
  },
  {
    label: '产品电商',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
    ),
    path: '/create/ecommerce',
    sub: [
      { label: '一键白底图', path: '/create/ecommerce' },
      { label: '一键场景图', path: '/create/ecommerce' },
      { label: '一键卖点图', path: '/create/ecommerce' },
      { label: 'AI试穿试戴', path: '/create/ecommerce' },
      { label: '商品图编辑', path: '/create/ecommerce' },
      { label: '电商换背景', path: '/create/ecommerce' },
      { label: '模特试衣', path: '/create/ecommerce' },
      { label: 'AI换模特', path: '/create/ecommerce' },
      { label: '场景加模特', path: '/create/ecommerce' },
      { label: 'AI产品设计', path: '/create/ecommerce' },
    ],
  },
  {
    label: '图片库',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
    path: '/projects',
    sub: [],
  },
  {
    label: '我的作品',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    path: '/projects',
    sub: [],
  },
];

const features = [
  {
    icon: '✏️', title: '编辑应用', path: '/create/edit',
    desc: '图片精修、场景融合、批量抠图',
    tags: ['图片精修', 'PS场景融合', '批量抠图'],
    bg: '#F0FFF4', iconBg: '#10B981',
  },
  {
    icon: '🛍️', title: '产品电商', path: '/create/ecommerce',
    desc: '一键生成商品图，提升转化率',
    tags: ['商品展示', '场景合成', '模特换装', '批量生成'],
    bg: '#FFF7ED', iconBg: '#F59E0B',
  },
];

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState('编辑应用');

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 88px)', background: '#f5f5f5' }}>

      {/* 左侧导航 - 对齐官网：图标+文字横排，36px高，悬停弹出二级 */}
      <aside style={{
        width: 140,
        background: '#fff',
        borderRight: '1px solid #f0f0f0',
        flexShrink: 0,
        paddingTop: 4,
        position: 'relative',
        zIndex: 100,
      }}>
        {navItems.map((item) => (
          <div
            key={item.label}
            style={{ position: 'relative' }}
            onMouseEnter={() => setHoveredNav(item.label)}
            onMouseLeave={() => setHoveredNav(null)}
          >
            {/* 菜单项 */}
            <button
              onClick={() => { setActiveNav(item.label); navigate(item.path); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                height: 36,
                padding: '0 12px',
                border: 'none',
                background: activeNav === item.label ? '#f0fdf4' : hoveredNav === item.label ? '#f5f5f5' : 'none',
                cursor: 'pointer',
                color: activeNav === item.label ? '#16a34a' : 'rgb(37, 38, 40)',
                fontSize: 13,
                fontWeight: activeNav === item.label ? 500 : 400,
                textAlign: 'left',
                transition: 'all 0.15s',
                borderRight: activeNav === item.label ? '2px solid #16a34a' : '2px solid transparent',
              }}
            >
              <span style={{
                display: 'flex', alignItems: 'center', flexShrink: 0,
                color: activeNav === item.label ? '#16a34a' : '#606266',
              }}>
                {item.icon}
              </span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.label}
              </span>
              {item.sub.length > 0 && (
                <span style={{ fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>›</span>
              )}
            </button>

            {/* 悬停弹出二级菜单 */}
            {item.sub.length > 0 && hoveredNav === item.label && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: '100%',
                background: '#fff',
                borderRadius: 8,
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                border: '1px solid #f0f0f0',
                minWidth: 140,
                zIndex: 200,
                paddingTop: 4,
                paddingBottom: 4,
              }}>
                {item.sub.map((sub) => (
                  <button
                    key={sub.label}
                    onClick={() => { setHoveredNav(null); navigate(sub.path); }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '0 16px',
                      height: 36,
                      border: 'none',
                      background: 'none',
                      color: 'rgb(37, 38, 40)',
                      fontSize: 13,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = '#f0fdf4';
                      (e.currentTarget as HTMLButtonElement).style.color = '#16a34a';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'none';
                      (e.currentTarget as HTMLButtonElement).style.color = 'rgb(37, 38, 40)';
                    }}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </aside>

      {/* 右侧主内容 */}
      <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #fefce8 100%)',
          borderRadius: 16,
          padding: '48px 32px',
          marginBottom: 24,
          border: '1px solid #dcfce7',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>
            豆绘AI，<span style={{ color: '#16a34a' }}>智能图片编辑</span>
          </h1>
          <p style={{ color: '#6b7280', fontSize: 16, marginBottom: 28 }}>
            图片精修、场景融合、批量抠图、产品电商，一站式图片处理工具
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Button
              type="primary"
              size="large"
              style={{ background: '#16a34a', borderColor: '#16a34a', borderRadius: 8, fontWeight: 500 }}
              onClick={() => navigate(isAuthenticated ? '/create/edit' : '/auth/login')}
            >开始编辑图片</Button>
            <Button
              size="large"
              style={{ borderRadius: 8 }}
              onClick={() => navigate(isAuthenticated ? '/create/ecommerce' : '/auth/login')}
            >产品电商</Button>
          </div>
        </div>

        {/* 副标题 */}
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 16 }}>核心功能</h2>

        {/* 功能卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {features.map((f) => (
            <div
              key={f.title}
              onClick={() => navigate(isAuthenticated ? f.path : '/auth/login')}
              style={{
                background: f.bg, borderRadius: 16, padding: '20px',
                cursor: 'pointer', border: '1px solid rgba(255,255,255,0.8)',
                transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1f2937', marginBottom: 4 }}>{f.title}</h3>
                  <p style={{ fontSize: 12, color: '#6b7280' }}>{f.desc}</p>
                </div>
                <span style={{
                  fontSize: 24, width: 40, height: 40, background: f.iconBg,
                  borderRadius: 10, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0,
                }}>{f.icon}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {f.tags.map((tag) => (
                  <span key={tag} style={{
                    fontSize: 12, background: '#fff', color: '#4b5563',
                    padding: '3px 10px', borderRadius: 20, border: '1px solid #e5e7eb',
                  }}>{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 未登录 CTA */}
        {!isAuthenticated && (
          <div style={{
            marginTop: 32, textAlign: 'center', padding: '40px 20px',
            background: 'linear-gradient(135deg, #16a34a, #0d9488)',
            borderRadius: 16, color: '#fff',
          }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>立即开始创作</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 20 }}>注册即送100豆点，体验全部AI功能</p>
            <Button
              size="large"
              style={{ background: '#fff', color: '#16a34a', border: 'none', fontWeight: 600, borderRadius: 8 }}
              onClick={() => navigate('/auth/login')}
            >免费注册</Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;
