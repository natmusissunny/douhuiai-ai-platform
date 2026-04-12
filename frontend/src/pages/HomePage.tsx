/**
 * 首页 - 豆绘AI风格
 * 左侧导航：图标+文字横排，36px高度，悬停弹出二级菜单
 */
import { useState } from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

// 左侧导航数据（精简版：只保留4个编辑功能入口）
const navItems = [
  {
    label: '图片编辑器',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
    path: '/create/edit',
  },
  {
    label: '图片精修',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
    path: '/create/edit',
  },
  {
    label: 'PS场景融合',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="2" width="20" height="20" rx="2"/>
        <path d="M7 2v20"/><path d="M17 2v20"/><path d="M2 12h20"/>
      </svg>
    ),
    path: '/create/edit',
  },
  {
    label: '长图拼图',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18"/><path d="M3 15h18"/>
      </svg>
    ),
    path: '/create/edit',
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
  },
];

const features = [
  {
    icon: '🖼️', title: '图片编辑器', path: '/create/edit',
    desc: '高清放大、高清重绘、AI扩图',
    tags: ['高清放大', '高清重绘', 'AI扩图'],
    bg: '#F0FFF4', iconBg: '#10B981',
  },
  {
    icon: '✨', title: '图片精修', path: '/create/edit',
    desc: '一键精修，让图片更清晰',
    tags: ['智能精修', '细节增强', '画质提升'],
    bg: '#EEF6FF', iconBg: '#3B82F6',
  },
  {
    icon: '🎬', title: 'PS场景融合', path: '/create/edit',
    desc: '智能场景融合，无缝合成',
    tags: ['场景融合', '智能合成', '背景替换'],
    bg: '#FFF7ED', iconBg: '#F59E0B',
  },
  {
    icon: '📐', title: '长图拼图', path: '/create/edit',
    desc: '多图拼接，一键生成长图',
    tags: ['长图拼接', '多图合一', '排版'],
    bg: '#FEF3F2', iconBg: '#EF4444',
  },
];

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [activeNav, setActiveNav] = useState('图片编辑器');

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 88px)', background: '#f5f5f5' }}>

      {/* 左侧导航 */}
      <aside style={{
        width: 108,
        background: '#fff',
        borderRight: '1px solid #f0f0f0',
        flexShrink: 0,
        paddingTop: 8,
      }}>
        {navItems.map((item) => {
          const isActive = activeNav === item.label;
          return (
            <button
              key={item.label}
              onClick={() => { setActiveNav(item.label); navigate(item.path); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                width: '100%',
                height: 38,
                padding: '0 10px 0 14px',
                border: 'none',
                background: isActive ? '#f0fdf4' : 'transparent',
                cursor: 'pointer',
                color: isActive ? '#16a34a' : '#252628',
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                textAlign: 'left',
                transition: 'all 0.15s',
                borderLeft: isActive ? '3px solid #16a34a' : '3px solid transparent',
              }}
            >
              <span style={{
                display: 'flex', alignItems: 'center', flexShrink: 0,
                color: isActive ? '#16a34a' : '#606266',
              }}>
                {item.icon}
              </span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </aside>

      {/* 右侧主内容 */}
      <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #fefce8 100%)',
          borderRadius: 16,
          padding: '40px 32px',
          marginBottom: 24,
          border: '1px solid #dcfce7',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>
            豆绘 · Agent，<span style={{ color: '#16a34a' }}>让想象自动落地</span>
          </h1>
          <p style={{ color: '#6b7280', fontSize: 16, marginBottom: 24 }}>
            智能解析需求，自动生成任务，自由无限拓展
          </p>

          {/* 输入框卡片 */}
          <div style={{
            background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
            padding: '16px 20px', maxWidth: 700, margin: '0 auto',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'left',
          }}>
            <div style={{ display: 'flex', gap: 20, marginBottom: 12, borderBottom: '1px solid #f0f0f0', paddingBottom: 10 }}>
              {['图像创作', '视频创作', '文案创作'].map((tab, i) => (
                <button key={tab} style={{
                  border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: 14, padding: '0 0 4px',
                  color: i === 0 ? '#16a34a' : '#9ca3af',
                  borderBottom: i === 0 ? '2px solid #16a34a' : '2px solid transparent',
                  fontWeight: i === 0 ? 600 : 400,
                }}>{tab}</button>
              ))}
            </div>
            <textarea
              style={{
                width: '100%', border: 'none', outline: 'none', resize: 'none',
                fontSize: 14, color: '#9ca3af', minHeight: 60, background: 'transparent',
                fontFamily: 'inherit',
              }}
              placeholder="例如：生成 6 张同风格延展图，保持空间结构一致，细节更..."
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <button style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 12px',
                background: '#fafafa', cursor: 'pointer', color: '#6b7280', fontSize: 12, gap: 2,
              }}>
                <span style={{ fontSize: 16 }}>↑</span><span>上传</span>
              </button>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button style={{
                  fontSize: 13, color: '#6b7280', background: '#f3f4f6',
                  border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>🤖 通用创作Ag... ▾</button>
                <Button
                  type="primary"
                  style={{ background: '#16a34a', borderColor: '#16a34a', borderRadius: 8, fontWeight: 500 }}
                  onClick={() => navigate(isAuthenticated ? '/create/edit' : '/auth/login')}
                >提交创作分析 ✦</Button>
              </div>
            </div>
          </div>
        </div>

        {/* 副标题 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>开始你的创意</h2>
          <input
            style={{
              fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 8,
              padding: '6px 12px', outline: 'none', color: '#9ca3af', width: 180,
            }}
            placeholder="请输入关键词搜索功能"
          />
        </div>
        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>
          输入一句话让AI帮你绘图，按enter发送，ctrl+enter换行。
        </p>

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
