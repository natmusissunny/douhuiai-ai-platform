/**
 * 首页 - 豆绘AI风格
 * 左侧导航：图标+文字横排，36px高度，悬停弹出二级菜单
 */
import { useState } from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

// 左侧导航数据（对齐官网结构）
const navItems = [
  {
    label: 'Agent',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="7" r="3"/>
        <line x1="8" y1="11" x2="8" y2="21"/><line x1="16" y1="11" x2="16" y2="21"/>
      </svg>
    ),
    path: '/create/text2img',
    sub: [],
  },
  {
    label: 'AI创作',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
    path: '/create/text2img',
    sub: [
      { label: '文生图', path: '/create/text2img' },
      { label: '图片重绘', path: '/create/img2img' },
      { label: 'AI智能出图', path: '/create/text2img' },
      { label: '免费创作', path: '/create/text2img' },
      { label: '图转3D模型', path: '/create/3d' },
      { label: 'N-banana Pro', path: '/create/text2img' },
      { label: 'Midjourney', path: '/create/text2img' },
      { label: 'Kontext创作', path: '/create/text2img' },
      { label: 'Flux创作', path: '/create/text2img' },
      { label: 'SDXL创作', path: '/create/text2img' },
      { label: '中文海报', path: '/create/text2img' },
    ],
  },
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
      { label: '万能改图', path: '/create/edit' },
      { label: '图片精修', path: '/create/edit' },
      { label: '编辑应用', path: '/create/edit' },
      { label: '多图融合', path: '/create/edit' },
      { label: '相似图生成', path: '/create/edit' },
      { label: '描述词反推', path: '/create/edit' },
      { label: 'PS场景融合', path: '/create/edit' },
      { label: '图片视角调整', path: '/create/edit' },
      { label: '批量抠图', path: '/create/edit' },
      { label: '3d模型渲染', path: '/create/3d' },
      { label: '线稿渲染', path: '/create/edit' },
      { label: '风格材质更换', path: '/create/edit' },
      { label: 'PNG素材生成', path: '/create/edit' },
      { label: '人物多姿势', path: '/create/edit' },
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
    label: '视频创作',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
      </svg>
    ),
    path: '/create/video',
    sub: [
      { label: '文生视频', path: '/create/video' },
      { label: '图生视频', path: '/create/video' },
      { label: '首尾帧', path: '/create/video' },
      { label: 'Sora2视频', path: '/create/video' },
      { label: '数字人口播', path: '/create/video' },
      { label: '文生视频(音频版)', path: '/create/video' },
      { label: '图生视频(音频版)', path: '/create/video' },
      { label: '文生音频', path: '/create/video' },
    ],
  },
  {
    label: '建筑室内',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    path: '/create/architecture',
    sub: [
      { label: '效果图后期', path: '/create/architecture' },
      { label: '效果图增强', path: '/create/architecture' },
      { label: 'AI概念图', path: '/create/architecture' },
      { label: '软硬装替换', path: '/create/architecture' },
      { label: '风格转换', path: '/create/architecture' },
      { label: '彩平图', path: '/create/architecture' },
    ],
  },
  {
    label: '人像写真',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
    ),
    path: '/create/portrait',
    sub: [
      { label: '人像换脸', path: '/create/portrait' },
      { label: '老照片修复', path: '/create/portrait' },
      { label: '人像变清晰', path: '/create/portrait' },
      { label: '照片上色', path: '/create/portrait' },
      { label: 'AI证件照', path: '/create/portrait' },
      { label: 'AI写真/形象照', path: '/create/portrait' },
      { label: 'AI换发型', path: '/create/portrait' },
      { label: '真人转漫画', path: '/create/portrait' },
    ],
  },
  {
    label: '批量生成',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="3" width="6" height="6" rx="1"/><rect x="9" y="3" width="6" height="6" rx="1"/>
        <rect x="16" y="3" width="6" height="6" rx="1"/><rect x="2" y="12" width="6" height="6" rx="1"/>
        <rect x="9" y="12" width="6" height="6" rx="1"/><rect x="16" y="12" width="6" height="6" rx="1"/>
      </svg>
    ),
    path: '/create/text2img',
    sub: [],
  },
  {
    label: '模型训练',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
    path: '/create/text2img',
    sub: [],
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
    icon: '🎨', title: 'AI图像创作', path: '/create/text2img',
    desc: '全量模型多种模式，轻松创作',
    tags: ['AI智能出图', '图转3D模型', 'N-banana', '免费创作'],
    bg: '#EEF6FF', iconBg: '#3B82F6',
  },
  {
    icon: '🎬', title: 'AI视频创作', path: '/create/video',
    desc: '告别复杂剪辑，AI一键成片',
    tags: ['图生视频', '首尾帧', '文生视频', 'Veo视频创作'],
    bg: '#F5F0FF', iconBg: '#8B5CF6',
  },
  {
    icon: '✏️', title: '编辑应用', path: '/create/edit',
    desc: '智能抠图、背景替换、风格转换',
    tags: ['AI抠图', '换背景', '万物消除', '去水印'],
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
  const [activeNav, setActiveNav] = useState('Agent');

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
                  onClick={() => navigate(isAuthenticated ? '/create/text2img' : '/auth/login')}
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
