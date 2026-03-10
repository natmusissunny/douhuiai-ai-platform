/**
 * 图转3D / 3D渲染页面 - 豆绘AI风格
 * 对应后端 POST /api/v1/projects/3d_render
 */
import { useState, useRef } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { create3DRender } from '../api/project';
import { useAuthStore } from '../stores/authStore';

const sideMenus = [
  {
    label: 'AI智能出图',
    items: [
      { label: '文生图', path: '/create/text2img' },
      { label: '图片重绘', path: '/create/img2img' },
      { label: '图转3D模型', path: '/create/3d', active: true },
    ],
  },
  {
    label: '3D渲染',
    items: [
      { label: '效果图后期', modelType: 'render_post' },
      { label: '效果图增强', modelType: 'render_enhance' },
      { label: 'AI概念图', modelType: 'concept' },
      { label: '软硬装替换', modelType: 'furniture' },
      { label: '风格转换', modelType: 'style_3d' },
      { label: '彩平图', modelType: 'floor_plan' },
    ],
  },
];

const modelTypes = [
  { label: '通用3D', value: 'general_3d' },
  { label: '建筑模型', value: 'architecture' },
  { label: '产品模型', value: 'product' },
  { label: '人物模型', value: 'character' },
];

const renderQualities = [
  { label: '标准版', value: 'low' },
  { label: '专业版', value: 'medium' },
  { label: '旗舰版', value: 'high', badge: '推荐' },
];

const Render3DPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeMenu, setActiveMenu] = useState('图转3D模型');
  const [modelType, setModelType] = useState('general_3d');
  const [quality, setQuality] = useState('medium');
  const [prompt, setPrompt] = useState('');
  const [_imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
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
    if (!prompt.trim()) { message.warning('请输入视频描述'); return; }
    setLoading(true);
    try {
      const project = await create3DRender({
        model_type: modelType,
        prompt,
        render_quality: quality,
      });
      message.success('任务创建成功，正在渲染中...');
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
                onClick={() => {
                  setActiveMenu(item.label);
                  if ((item as any).path) navigate((item as any).path);
                  if ((item as any).modelType) setModelType((item as any).modelType);
                }}
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
          {/* 上传参考图 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
                * 上传产品图 <span style={{ color: '#ef4444', fontSize: 12 }}>（必选）</span>
              </span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}>↻</button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            {previewUrl ? (
              <div onClick={() => fileInputRef.current?.click()} style={{ border: '1.5px dashed #d1d5db', borderRadius: 10, padding: 12, cursor: 'pointer', background: '#fafafa', maxWidth: 320 }}>
                <img src={previewUrl} alt="preview" style={{ width: '100%', borderRadius: 8, display: 'block' }} />
                <div style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 6 }}>点击替换</div>
              </div>
            ) : (
              <div onClick={() => fileInputRef.current?.click()} style={{ border: '1.5px dashed #d1d5db', borderRadius: 10, padding: '40px 24px', textAlign: 'center', cursor: 'pointer', background: '#fafafa', maxWidth: 320 }}>
                <div style={{ fontSize: 28, color: '#9ca3af', marginBottom: 8 }}>↑</div>
                <div style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>本地上传</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>（支持复制粘贴）</div>
                <button style={{ marginTop: 12, padding: '6px 20px', border: '1px solid #16a34a', borderRadius: 6, color: '#16a34a', background: '#fff', cursor: 'pointer', fontSize: 13 }}>图片库上传</button>
              </div>
            )}
          </div>

          {/* 模式选择 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 12 }}>模式选择</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {modelTypes.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setModelType(m.value)}
                  style={{
                    padding: '10px 24px', border: `1.5px solid ${modelType === m.value ? '#16a34a' : '#e5e7eb'}`,
                    borderRadius: 8, background: modelType === m.value ? '#f0fdf4' : '#fff',
                    color: modelType === m.value ? '#16a34a' : '#374151',
                    fontSize: 13, cursor: 'pointer', fontWeight: modelType === m.value ? 600 : 400,
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* 运镜模板（可选预览图） */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, color: '#374151', marginBottom: 10 }}>
              运镜模板 <span style={{ fontSize: 12, color: '#9ca3af' }}>（可选）</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['环绕', '推进', '拉远'].map((t) => (
                <div key={t} style={{
                  width: 80, height: 60, borderRadius: 8, background: '#e5e7eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, color: '#9ca3af', cursor: 'pointer', border: '1.5px solid #e5e7eb',
                }}>{t}</div>
              ))}
              <div style={{
                width: 80, height: 60, borderRadius: 8, border: '1.5px dashed #d1d5db',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: '#9ca3af', cursor: 'pointer',
              }}>+ 全部模板</div>
            </div>
          </div>

          {/* 视频描述 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
                * 视频描述 <span style={{ color: '#ef4444', fontSize: 12 }}>（必填）</span>
              </span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="请描述你想生成的视频，或者直接填写关键词，点击「AI优化视频描述」按钮，AI将为您生成优化后的视频描述。也可以使用提示词工具帮助您进行提示词生成。"
              style={{
                width: '100%', minHeight: 100, padding: '12px 16px',
                border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14,
                color: '#374151', resize: 'vertical', outline: 'none',
                fontFamily: 'inherit', boxSizing: 'border-box',
                background: '#fff', lineHeight: '1.6',
              }}
              onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = '#16a34a'; }}
              onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = '#e5e7eb'; }}
            />
            <div style={{ textAlign: 'right', fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{prompt.length} / 2000</div>
            <button style={{
              marginTop: 8, padding: '8px 20px', background: '#16a34a',
              color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13,
            }}>🤖 AI优化视频描述</button>
          </div>

          {/* 渲染质量 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 12 }}>视频版本</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {renderQualities.map((q) => (
                <button
                  key={q.value}
                  onClick={() => setQuality(q.value)}
                  style={{
                    position: 'relative', padding: '10px 28px',
                    border: `1.5px solid ${quality === q.value ? '#16a34a' : '#e5e7eb'}`,
                    borderRadius: 8, background: quality === q.value ? 'linear-gradient(135deg, #16a34a, #0d9488)' : '#fff',
                    color: quality === q.value ? '#fff' : '#374151',
                    fontSize: 13, cursor: 'pointer', fontWeight: quality === q.value ? 600 : 400,
                  }}
                >
                  {q.badge && (
                    <span style={{
                      position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                      background: '#f59e0b', color: '#fff', fontSize: 10, padding: '1px 6px', borderRadius: 4,
                    }}>{q.badge}</span>
                  )}
                  {q.label}
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
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
            <div>渲染结果将在此显示</div>
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
          disabled={loading}
          style={{
            padding: '12px 48px',
            background: loading ? '#9ca3af' : 'linear-gradient(90deg, #16a34a, #0d9488)',
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 15, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '渲染中...' : '✦ 创建视频'}
        </button>
        <div style={{ width: 40 }} />
      </div>
    </div>
  );
};

export default Render3DPage;
