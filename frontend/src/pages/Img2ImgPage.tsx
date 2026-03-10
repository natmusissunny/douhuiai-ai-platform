/**
 * 图生图 / 图片重绘页面 - 豆绘AI风格
 * 对应后端 POST /api/v1/projects/img2img
 */
import { useState, useRef } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { createImg2Img } from '../api/project';
import { useAuthStore } from '../stores/authStore';

const sideMenus = [
  {
    label: 'AI智能出图',
    items: [
      { label: '文生图', path: '/create/text2img' },
      { label: '图片重绘', path: '/create/img2img', active: true },
      { label: '免费创作', path: '/create/text2img' },
      { label: '图转3D模型', path: '/create/3d' },
    ],
  },
  {
    label: '大模型创作',
    items: [
      { label: 'N-banana Pro', path: '/create/text2img' },
      { label: 'Midjourney', path: '/create/text2img' },
      { label: 'Kontext创作', path: '/create/text2img' },
      { label: 'Flux创作', path: '/create/text2img' },
      { label: 'SDXL创作', path: '/create/text2img' },
      { label: '中文海报', path: '/create/text2img' },
    ],
  },
];

const strengthPresets = [
  { label: '轻微重绘', value: 0.3, desc: '保留原图 70%' },
  { label: '适中重绘', value: 0.6, desc: '保留原图 40%' },
  { label: '深度重绘', value: 0.8, desc: '保留原图 20%' },
  { label: '完全重绘', value: 1.0, desc: '完全按提示词' },
];

const exampleTags = ['写实风格', '动漫风格', '油画质感', '水彩效果', '赛博朋克'];

const Img2ImgPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeMenu, setActiveMenu] = useState('图片重绘');
  const [prompt, setPrompt] = useState('');
  const [strength, setStrength] = useState(0.6);
  const [imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [focusPrompt, setFocusPrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quotaBalance = Math.floor(Number(user?.quota_balance || 0));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    const reader = new FileReader();
    reader.onload = (ev) => setImageUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!imageUrl) { message.warning('请先上传参考图'); return; }
    if (!prompt.trim()) { message.warning('请输入创作描述'); return; }
    setLoading(true);
    try {
      const project = await createImg2Img({
        image_url: imageUrl,
        prompt,
        strength,
        num_images: 1,
      } as any);
      message.success('任务创建成功，正在生成中...');
      navigate('/projects', { state: { newProjectId: project.id } });
    } catch (error: any) {
      message.error(error.response?.data?.detail || '创建任务失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 88px)', background: '#f5f5f5' }}>
      {/* 左侧菜单 */}
      <aside style={{
        width: 160, background: '#fff', borderRight: '1px solid #f0f0f0',
        flexShrink: 0, overflowY: 'auto', paddingTop: 8,
      }}>
        {sideMenus.map((group) => (
          <div key={group.label}>
            <div style={{ padding: '8px 16px 4px', fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>
              {group.label}
            </div>
            {group.items.map((item) => (
              <button
                key={item.label}
                onClick={() => { setActiveMenu(item.label); navigate(item.path); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '8px 16px', border: 'none',
                  background: activeMenu === item.label ? '#f0fdf4' : 'none',
                  color: activeMenu === item.label ? '#16a34a' : '#374151',
                  fontSize: 13, cursor: 'pointer',
                  fontWeight: activeMenu === item.label ? 500 : 400,
                  borderRight: activeMenu === item.label ? '2px solid #16a34a' : '2px solid transparent',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* 中间表单 */}
      <main style={{ flex: 1, display: 'flex', overflowY: 'auto' }}>
        <div style={{ flex: 1, padding: '24px 24px 100px', maxWidth: 640 }}>
          {/* Tab */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {['图像创作', '视频创作', '文案创作'].map((tab, i) => (
              <button key={tab} style={{
                padding: '8px 24px',
                border: i === 0 ? '1.5px solid #16a34a' : '1.5px solid #e5e7eb',
                borderRadius: 8, background: '#fff',
                color: i === 0 ? '#16a34a' : '#6b7280',
                fontSize: 14, cursor: 'pointer', fontWeight: i === 0 ? 500 : 400,
              }}>{tab}</button>
            ))}
          </div>

          {/* 上传参考图 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
                * 上传参考图 <span style={{ color: '#ef4444', fontSize: 12 }}>（必选）</span>
              </span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}>↻</button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            {previewUrl ? (
              <div onClick={() => fileInputRef.current?.click()} style={{
                border: '1.5px dashed #d1d5db', borderRadius: 10, padding: 12,
                cursor: 'pointer', background: '#fafafa', maxWidth: 320,
              }}>
                <img src={previewUrl} style={{ width: '100%', borderRadius: 8, display: 'block' }} />
                <div style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 6 }}>点击替换图片</div>
              </div>
            ) : (
              <div onClick={() => fileInputRef.current?.click()} style={{
                border: '1.5px dashed #d1d5db', borderRadius: 10, padding: '40px 24px',
                textAlign: 'center', cursor: 'pointer', background: '#fafafa', maxWidth: 320,
              }}>
                <div style={{ fontSize: 28, color: '#9ca3af', marginBottom: 8 }}>↑</div>
                <div style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>本地上传</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>（支持复制粘贴）</div>
                <button style={{
                  marginTop: 12, padding: '6px 20px', border: '1px solid #16a34a',
                  borderRadius: 6, color: '#16a34a', background: '#fff', cursor: 'pointer', fontSize: 13,
                }}>图片库上传</button>
              </div>
            )}
          </div>

          {/* 创作描述 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
                创作需求 <span style={{ color: '#ef4444' }}>*</span>
              </span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}>↻</button>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例如：将这张图转换成油画风格，保持人物特征，色彩鲜艳。"
              style={{
                width: '100%', minHeight: 90, padding: '12px 16px',
                border: `1.5px solid ${focusPrompt ? '#16a34a' : '#e5e7eb'}`,
                borderRadius: 8, fontSize: 14, color: '#374151',
                resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                boxSizing: 'border-box', background: '#fff', lineHeight: '1.6',
              }}
              onFocus={() => setFocusPrompt(true)}
              onBlur={() => setFocusPrompt(false)}
            />
          </div>

          {/* 试试这些 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>试试这些</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {exampleTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setPrompt(tag + '风格，保持原图构图和人物特征')}
                  style={{
                    padding: '5px 14px', border: '1px solid #e5e7eb',
                    borderRadius: 6, background: '#fff', fontSize: 13,
                    color: '#374151', cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#16a34a';
                    (e.currentTarget as HTMLButtonElement).style.color = '#16a34a';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb';
                    (e.currentTarget as HTMLButtonElement).style.color = '#374151';
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 重绘强度 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 10 }}>重绘强度</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {strengthPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setStrength(preset.value)}
                  style={{
                    padding: '8px 16px',
                    border: `1.5px solid ${strength === preset.value ? '#16a34a' : '#e5e7eb'}`,
                    borderRadius: 8, background: strength === preset.value ? '#f0fdf4' : '#fff',
                    color: strength === preset.value ? '#16a34a' : '#374151',
                    fontSize: 13, cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{ fontWeight: strength === preset.value ? 600 : 400 }}>{preset.label}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{preset.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧预览 */}
        <div style={{
          width: 300, borderLeft: '1px solid #f0f0f0', background: '#f9fafb',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: 24 }}>
            {previewUrl ? (
              <img src={previewUrl} style={{ maxWidth: '100%', borderRadius: 8 }} />
            ) : (
              <>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🖼️</div>
                <div>生成结果将在此显示</div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* 底部操作栏 */}
      <div style={{
        position: 'fixed', bottom: 0, left: 232, right: 0,
        background: '#fff', borderTop: '1px solid #f0f0f0',
        padding: '12px 24px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280' }}>
          <span>我的豆点: <strong style={{ color: '#1f2937' }}>{quotaBalance}</strong></span>
          <div style={{ width: 28, height: 15, borderRadius: 8, background: quotaBalance > 0 ? '#16a34a' : '#d1d5db', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 2, right: 2, width: 11, height: 11, borderRadius: '50%', background: '#fff' }} />
          </div>
          <button style={{ padding: '4px 12px', border: '1px solid #16a34a', borderRadius: 16, color: '#16a34a', fontSize: 12, background: '#fff', cursor: 'pointer' }}>领取豆点</button>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || !imageUrl}
          style={{
            padding: '12px 48px',
            background: loading || !imageUrl ? '#9ca3af' : 'linear-gradient(90deg, #16a34a, #0d9488)',
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 15, fontWeight: 600,
            cursor: loading || !imageUrl ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '生成中...' : '✦ 开始智能分析'}
        </button>
        <div style={{ width: 40 }} />
      </div>
    </div>
  );
};

export default Img2ImgPage;
