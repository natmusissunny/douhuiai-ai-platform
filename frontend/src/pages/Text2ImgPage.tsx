/**
 * AI创作页面 - 豆绘AI风格
 * 对齐官方 /create/text2img 页面布局
 */
import { useState, useRef, useEffect } from 'react';
import { message, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { createText2Img, createModelTask } from '../api/project';
import { useAuthStore } from '../stores/authStore';
import { useCommonStore } from '../stores/commonStore';

// 左侧菜单项与大模型API模型名的映射
const menuModelMap: Record<string, string> = {
  'N-banana Pro': 'nanoimg',
  'Midjourney': 'midjourney',
  'Kontext创作': 'kontext',
  'Flux创作': 'flux',
  'SDXL创作': 'sdxl',
  '中文海报': 'kontext',
};

// 左侧分类菜单数据（对齐官网导航结构）
const sideMenus = [
  {
    label: 'AI智能出图',
    items: [
      { label: '文生图', path: '/create/text2img' },
      { label: '图片重绘', path: '/create/img2img' },
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

// 试试这些标签
const exampleTags = ['电商套图', '多模特试穿', '多风格渲染', '系列写真'];

// 智能体选项
const agents = [
  {
    id: 'general',
    name: '通用创作Agent',
    desc: '任意创作需求自动解析为可执行的出图任务，支持单...',
    icon: '🤖',
    color: '#16a34a',
  },
];

const Text2ImgPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { models, styles, fetchModels, fetchStyles } = useCommonStore();
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [activeMenu, setActiveMenu] = useState('文生图');
  const [deepThink, setDeepThink] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quotaBalance = Math.floor(Number(user?.quota_balance || 0));

  // 页面加载时从API获取模型和画风列表
  useEffect(() => {
    fetchModels();
    fetchStyles();
  }, [fetchModels, fetchStyles]);

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      message.warning('请输入创作需求');
      return;
    }

    // 文生图配额消耗：1-2豆点
    if (quotaBalance < 1) {
      Modal.error({
        title: '豆点不足',
        icon: <ExclamationCircleOutlined />,
        content: `当前豆点 ${quotaBalance}，请充值后再试。`,
      });
      return;
    }

    setLoading(true);
    try {
      // 如果当前选中的是大模型创作菜单，走 model_create API
      const modelKey = menuModelMap[activeMenu];
      let project;
      if (modelKey) {
        project = await createModelTask({
          model: modelKey,
          prompt,
          params: {
            ...(selectedModel ? { dhModelId: String(selectedModel) } : {}),
            ...(selectedStyle ? { dhPaintStyle: String(selectedStyle) } : {}),
          },
        });
      } else {
        project = await createText2Img({ prompt, num_images: 1 });
      }
      message.success('任务创建成功，正在生成中...');
      navigate('/projects', { state: { newProjectId: project.id } });
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || '创建任务失败';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 88px)', background: '#f5f5f5' }}>
      {/* 左侧分类菜单 */}
      <aside style={{
        width: 160,
        background: '#fff',
        borderRight: '1px solid #f0f0f0',
        flexShrink: 0,
        overflowY: 'auto',
        paddingTop: 8,
      }}>
        {sideMenus.map((group) => (
          <div key={group.label}>
            {/* 分组标题 */}
            <div style={{
              padding: '8px 16px 4px',
              fontSize: 11,
              color: '#9ca3af',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <span style={{ flex: 1 }}>{group.label}</span>
              <span style={{ fontSize: 10 }}>─</span>
            </div>
            {/* 子菜单 */}
            {group.items.map((item) => (
              <button
                key={item.label}
                onClick={() => setActiveMenu(item.label)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 16px',
                  border: 'none',
                  background: activeMenu === item.label ? '#f0fdf4' : 'none',
                  color: activeMenu === item.label ? '#16a34a' : '#374151',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontWeight: activeMenu === item.label ? 500 : 400,
                  borderRight: activeMenu === item.label ? '2px solid #16a34a' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (activeMenu !== item.label) {
                    (e.currentTarget as HTMLButtonElement).style.background = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeMenu !== item.label) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'none';
                  }
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* 中间表单区域 */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 100px' }}>
        {/* Tab 切换 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['图像创作', '视频创作', '文案创作'].map((tab, i) => (
            <button
              key={tab}
              style={{
                padding: '8px 24px',
                border: i === 0 ? '1.5px solid #16a34a' : '1.5px solid #e5e7eb',
                borderRadius: 8,
                background: i === 0 ? '#fff' : '#fff',
                color: i === 0 ? '#16a34a' : '#6b7280',
                fontSize: 14,
                cursor: 'pointer',
                fontWeight: i === 0 ? 500 : 400,
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 智能体选择 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 10 }}>
            智能体选择 (AGENT) <span style={{ color: '#ef4444' }}>*</span>
          </div>
          {agents.map((agent) => (
            <div
              key={agent.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                border: '1.5px solid #16a34a',
                borderRadius: 10,
                background: '#f0fdf4',
                cursor: 'pointer',
                maxWidth: 520,
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: '#16a34a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
              }}>
                {agent.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>{agent.name}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{agent.desc}</div>
              </div>
              <span style={{ color: '#9ca3af', fontSize: 16 }}>›</span>
            </div>
          ))}
        </div>

        {/* 创作需求 */}
        <div style={{ marginBottom: 20, maxWidth: 520 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
              创作需求 <span style={{ color: '#ef4444' }}>*</span>
            </span>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}>↻</button>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例如：生成 3 张运动风格的美女写真，氛围阳光自然。"
            style={{
              width: '100%',
              minHeight: 100,
              padding: '12px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              fontSize: 14,
              color: '#374151',
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              background: '#fff',
              lineHeight: '1.6',
            }}
            onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = '#16a34a'; }}
            onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = '#e5e7eb'; }}
          />
        </div>

        {/* 试试这些 */}
        <div style={{ marginBottom: 20, maxWidth: 520 }}>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>试试这些</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {exampleTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setPrompt(tag)}
                style={{
                  padding: '5px 14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  background: '#fff',
                  fontSize: 13,
                  color: '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
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

        {/* 参考图上传 */}
        <div style={{ marginBottom: 20, maxWidth: 520 }}>
          <div style={{ fontSize: 14, color: '#374151', marginBottom: 10 }}>
            参考图（可选，最多 9 张）
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              const urls = files.map((f) => URL.createObjectURL(f));
              setUploadedImages((prev) => [...prev, ...urls].slice(0, 9));
            }}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {uploadedImages.map((url, i) => (
              <div key={i} style={{
                width: 80, height: 80, borderRadius: 8,
                overflow: 'hidden', border: '1px solid #e5e7eb', position: 'relative',
              }}>
                <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  onClick={() => setUploadedImages((prev) => prev.filter((_, j) => j !== i))}
                  style={{
                    position: 'absolute', top: 2, right: 2,
                    background: 'rgba(0,0,0,0.5)', color: '#fff',
                    border: 'none', borderRadius: '50%', width: 18, height: 18,
                    cursor: 'pointer', fontSize: 11, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >✕</button>
              </div>
            ))}
            {uploadedImages.length < 9 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 80, height: 80, border: '1.5px dashed #d1d5db',
                  borderRadius: 8, background: '#fafafa', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: 4, color: '#9ca3af', fontSize: 12,
                }}
              >
                <span style={{ fontSize: 20 }}>↑</span>
                <span>上传</span>
              </button>
            )}
          </div>
        </div>

        {/* 模型选择（从API动态加载） */}
        {models.length > 0 && (
          <div style={{ marginBottom: 20, maxWidth: 520 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 10 }}>
              模型选择
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(selectedModel === model.id ? null : model.id)}
                  style={{
                    padding: '6px 14px',
                    border: selectedModel === model.id ? '1.5px solid #16a34a' : '1px solid #e5e7eb',
                    borderRadius: 8,
                    background: selectedModel === model.id ? '#f0fdf4' : '#fff',
                    fontSize: 13,
                    color: selectedModel === model.id ? '#16a34a' : '#374151',
                    cursor: 'pointer',
                    fontWeight: selectedModel === model.id ? 500 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {model.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 画风选择（从API动态加载） */}
        {styles.length > 0 && (
          <div style={{ marginBottom: 20, maxWidth: 520 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 10 }}>
              画风选择
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {styles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(selectedStyle === style.id ? null : style.id)}
                  style={{
                    padding: '6px 14px',
                    border: selectedStyle === style.id ? '1.5px solid #16a34a' : '1px solid #e5e7eb',
                    borderRadius: 8,
                    background: selectedStyle === style.id ? '#f0fdf4' : '#fff',
                    fontSize: 13,
                    color: selectedStyle === style.id ? '#16a34a' : '#374151',
                    cursor: 'pointer',
                    fontWeight: selectedStyle === style.id ? 500 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI 深度思考 */}
        <div style={{ marginBottom: 24, maxWidth: 520 }}>
          <div style={{ fontSize: 14, color: '#374151', marginBottom: 6 }}>
            AI 深度思考（推理拆解）
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>
            开启后 AI 将对创作需求进行深度推理分析，适合复杂场景
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, cursor: 'pointer' }}>
            <div
              onClick={() => setDeepThink(!deepThink)}
              style={{
                width: 40, height: 22, borderRadius: 11,
                background: deepThink ? '#16a34a' : '#e5e7eb',
                position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
              }}
            >
              <div style={{
                position: 'absolute', top: 3, left: deepThink ? 21 : 3,
                width: 16, height: 16, borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
            <span style={{ fontSize: 13, color: deepThink ? '#16a34a' : '#6b7280' }}>
              {deepThink ? '已开启' : '未开启'}
            </span>
          </label>
        </div>
      </main>

      {/* 底部操作栏（固定） */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 232,  /* 72(icon nav) + 160(side menu) */
        right: 0,
        background: '#fff',
        borderTop: '1px solid #f0f0f0',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280' }}>
          <span>我的豆点: <strong style={{ color: '#1f2937' }}>{quotaBalance}</strong></span>
          <div style={{
            width: 28, height: 15, borderRadius: 8,
            background: quotaBalance > 0 ? '#16a34a' : '#d1d5db',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: 2, right: 2,
              width: 11, height: 11, borderRadius: '50%', background: '#fff',
            }} />
          </div>
          <button style={{
            padding: '4px 12px', border: '1px solid #16a34a',
            borderRadius: 16, color: '#16a34a', fontSize: 12,
            background: '#fff', cursor: 'pointer',
          }}>领取豆点</button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            padding: '12px 48px',
            background: loading ? '#9ca3af' : 'linear-gradient(90deg, #16a34a, #0d9488)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {loading ? '生成中...' : '✦ 开始智能分析'}
        </button>

        <button style={{
          width: 40, height: 40, border: '1px solid #e5e7eb',
          borderRadius: 8, background: '#fff', cursor: 'pointer',
          fontSize: 20, color: '#6b7280',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>+</button>
      </div>
    </div>
  );
};

export default Text2ImgPage;
