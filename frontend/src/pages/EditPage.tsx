/**
 * 编辑应用页面 - 豆绘AI精简版
 * 对应后端 POST /api/v1/projects/edit
 */
import { useState, useRef } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { createImageEdit } from '../api/project';
import { useAuthStore } from '../stores/authStore';

// 左侧菜单（精简版只保留4个入口）
const sideMenuItems = [
  { label: '图片编辑器', editType: 'upscale' },
  { label: '图片精修', editType: 'hd_repaint' },
  { label: 'PS场景融合', editType: 'outpaint' },
  { label: '长图拼图', editType: 'long_image' },
];

// 编辑功能列表（主区域 grid，只保留3个）
const editFunctions = [
  { label: '高清放大', editType: 'upscale' },
  { label: '高清重绘', editType: 'hd_repaint' },
  { label: 'AI扩图', editType: 'outpaint' },
];

// 高清放大模式
const upscaleModes = ['通用模式', '超清增强', '真实照片', '动漫图片', '细节增强'];

const EditPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeMenu, setActiveMenu] = useState('图片编辑器');
  const [activeEdit, setActiveEdit] = useState('upscale');
  const [activeMode, setActiveMode] = useState('通用模式');
  const [imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quotaBalance = Math.floor(Number(user?.quota_balance || 0));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onload = (ev) => setImageUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!imageUrl) { message.warning('请先上传图片'); return; }

    // 构建额外参数
    const extraParams: Record<string, any> = { mode: activeMode };

    setLoading(true);
    try {
      const project = await createImageEdit({
        image_url: imageUrl,
        edit_type: activeEdit,
        params: extraParams,
      });
      message.success('任务创建成功，正在处理中...');
      navigate('/projects', { state: { newProjectId: project.id } });
    } catch (error: any) {
      message.error(error.response?.data?.detail || '创建任务失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 88px)', background: '#f5f5f5' }}>
      {/* 左侧分类菜单 */}
      <aside style={{
        width: 160, background: '#fff', borderRight: '1px solid #f0f0f0',
        flexShrink: 0, overflowY: 'auto', paddingTop: 8,
      }}>
        {sideMenuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => { setActiveMenu(item.label); setActiveEdit(item.editType); }}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '10px 16px', border: 'none',
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
      </aside>

      {/* 中间内容 */}
      <main style={{ flex: 1, display: 'flex', overflowY: 'auto' }}>
        {/* 左侧表单 */}
        <div style={{ flex: 1, padding: '24px 24px 100px', maxWidth: 640 }}>
          {/* 上传图片 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
                * 上传图片 <span style={{ color: '#ef4444', fontSize: 12 }}>（必选）</span>
              </span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}>↻</button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            {previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '1.5px dashed #d1d5db', borderRadius: 10, padding: 12,
                  cursor: 'pointer', background: '#fafafa', maxWidth: 320,
                }}
              >
                <img src={previewUrl} alt="preview" style={{ width: '100%', borderRadius: 8, display: 'block' }} />
                <div style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 6 }}>点击替换图片</div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '1.5px dashed #d1d5db', borderRadius: 10, padding: '40px 24px',
                  textAlign: 'center', cursor: 'pointer', background: '#fafafa', maxWidth: 320,
                }}
              >
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

          {/* 编辑功能选择 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 12 }}>编辑功能选择</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {editFunctions.map((fn) => (
                <button
                  key={fn.editType}
                  onClick={() => setActiveEdit(fn.editType)}
                  style={{
                    padding: '10px 8px', border: `1.5px solid ${activeEdit === fn.editType ? '#16a34a' : '#e5e7eb'}`,
                    borderRadius: 8, background: activeEdit === fn.editType ? '#f0fdf4' : '#fff',
                    color: activeEdit === fn.editType ? '#16a34a' : '#374151',
                    fontSize: 13, cursor: 'pointer', fontWeight: activeEdit === fn.editType ? 500 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {fn.label}
                </button>
              ))}
            </div>
          </div>

          {/* 放大模式（仅高清放大时显示） */}
          {activeEdit === 'upscale' && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 12 }}>放大模式</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {upscaleModes.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setActiveMode(mode)}
                    style={{
                      padding: '8px 20px', border: `1.5px solid ${activeMode === mode ? '#16a34a' : '#e5e7eb'}`,
                      borderRadius: 8, background: activeMode === mode ? '#f0fdf4' : '#fff',
                      color: activeMode === mode ? '#16a34a' : '#374151',
                      fontSize: 13, cursor: 'pointer', fontWeight: activeMode === mode ? 500 : 400,
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* 右侧预览区 */}
        <div style={{
          width: 300, borderLeft: '1px solid #f0f0f0', background: '#f9fafb',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: 24, flexShrink: 0,
        }}>
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
            {previewUrl ? (
              <img src={previewUrl} alt="preview" style={{ maxWidth: '100%', borderRadius: 8 }} />
            ) : (
              <div style={{ padding: '60px 20px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🖼️</div>
                <div>处理结果将在此显示</div>
              </div>
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
          {loading ? '处理中...' : '✦ 开始创作'}
        </button>
        <div style={{ width: 40 }} />
      </div>
    </div>
  );
};

export default EditPage;
