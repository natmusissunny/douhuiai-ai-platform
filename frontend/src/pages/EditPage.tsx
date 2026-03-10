/**
 * 编辑应用页面 - 豆绘AI风格
 * 对应后端 POST /api/v1/projects/edit
 */
import { useState, useRef } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { createImageEdit } from '../api/project';
import { useAuthStore } from '../stores/authStore';

// 换风格可选 Lora 模板
const loraOptions = [
  { label: '动漫风', value: 'anime' },
  { label: '写实照片', value: 'realistic' },
  { label: '油画风', value: 'oil_painting' },
  { label: '水彩画', value: 'watercolor' },
  { label: '赛博朋克', value: 'cyberpunk' },
  { label: '素描风', value: 'sketch' },
];

// 左侧菜单
const sideMenus = [
  {
    label: '图片编辑器',
    items: [
      { label: '万能改图', editType: 'universal_edit' },
      { label: '图片修复', editType: 'repair' },
      { label: '编辑应用', editType: 'edit_app' },
      { label: '多图融合', editType: 'multi_merge' },
      { label: '相似图生成', editType: 'similar_gen' },
      { label: '描述词反推', editType: 'reverse_prompt' },
      { label: 'PS场景融合', editType: 'ps_merge' },
    ],
  },
  {
    label: '编辑工具',
    items: [
      { label: '图片视角调整', editType: 'perspective' },
      { label: '批量抠图', editType: 'batch_cutout' },
      { label: '3d模型渲染', editType: '3d_model' },
      { label: '线稿渲染', editType: 'line_render' },
      { label: '风格材质更换', editType: 'style_change' },
      { label: 'PNG素材生成', editType: 'png_gen' },
      { label: '人物多姿势', editType: 'multi_pose' },
    ],
  },
];

// 编辑功能列表（主区域 grid）
const editFunctions = [
  { label: '高清放大', editType: 'upscale', active: true },
  { label: '高清重绘', editType: 'hd_repaint' },
  { label: 'AI扩图', editType: 'outpaint' },
  { label: 'AI抠图', editType: 'remove_bg' },
  { label: '换背景', editType: 'change_bg' },
  { label: '图片裁剪', editType: 'crop' },
  { label: '比例调整', editType: 'ratio' },
  { label: '万物消除', editType: 'inpaint' },
  { label: '局部修改', editType: 'local_edit' },
  { label: '局部修复', editType: 'local_repair' },
  { label: '万物替换', editType: 'replace' },
  { label: '换风格', editType: 'style_transfer' },
  { label: '一键美化', editType: 'beautify' },
  { label: '变清晰', editType: 'sharpen' },
  { label: '图片转线稿', editType: 'to_sketch' },
  { label: '精准提取线稿', editType: 'extract_line' },
  { label: '图片去色', editType: 'decolor' },
  { label: '去Logo/文字', editType: 'remove_text' },
  { label: '万能改图', editType: 'universal_edit' },
];

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
  // 换背景：背景描述
  const [bgPrompt, setBgPrompt] = useState('');
  // 换风格：Lora 模板
  const [loraType, setLoraType] = useState('anime');
  // 万物替换：蒙版图片（标记要替换的区域）
  const [maskUrl, setMaskUrl] = useState('');
  const [maskPreviewUrl, setMaskPreviewUrl] = useState('');
  // 万物替换：替换描述
  const [replacePrompt, setReplacePrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maskInputRef = useRef<HTMLInputElement>(null);
  const quotaBalance = Math.floor(Number(user?.quota_balance || 0));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onload = (ev) => setImageUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleMaskFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMaskPreviewUrl(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onload = (ev) => setMaskUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!imageUrl) { message.warning('请先上传图片'); return; }
    // 各功能的额外参数校验
    if (activeEdit === 'change_bg' && !bgPrompt.trim()) {
      message.warning('请输入背景描述'); return;
    }
    if (activeEdit === 'replace' && !maskUrl) {
      message.warning('请上传蒙版图片（标记要替换的区域）'); return;
    }

    // 构建额外参数
    const extraParams: Record<string, any> = { mode: activeMode };
    if (activeEdit === 'change_bg') extraParams.dhPrompt = bgPrompt;
    if (activeEdit === 'style_transfer') extraParams.dhLoraType = loraType;
    if (activeEdit === 'replace') {
      extraParams.dhMaskImg = maskUrl;
      extraParams.dhPrompt = replacePrompt;
    }

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
        {sideMenus.map((group) => (
          <div key={group.label}>
            <div style={{ padding: '8px 16px 4px', fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>
              {group.label}
            </div>
            {group.items.map((item) => (
              <button
                key={item.label}
                onClick={() => { setActiveMenu(item.label); setActiveEdit(item.editType); }}
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

          {/* 换背景：背景描述输入（必填） */}
          {activeEdit === 'change_bg' && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                * 背景描述 <span style={{ color: '#ef4444', fontSize: 12 }}>（必填）</span>
              </div>
              <textarea
                value={bgPrompt}
                onChange={(e) => setBgPrompt(e.target.value)}
                placeholder="描述你想要的新背景，例如：海边沙滩、城市夜景、简约白色背景..."
                style={{
                  width: '100%', minHeight: 80, padding: '10px 14px',
                  border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13,
                  color: '#374151', resize: 'vertical', outline: 'none',
                  fontFamily: 'inherit', boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#16a34a'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; }}
              />
            </div>
          )}

          {/* 换风格：Lora 模板选择（必选） */}
          {activeEdit === 'style_transfer' && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 12 }}>
                * 选择风格模板 <span style={{ color: '#ef4444', fontSize: 12 }}>（必选）</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {loraOptions.map((lora) => (
                  <button
                    key={lora.value}
                    onClick={() => setLoraType(lora.value)}
                    style={{
                      padding: '8px 20px', border: `1.5px solid ${loraType === lora.value ? '#16a34a' : '#e5e7eb'}`,
                      borderRadius: 8, background: loraType === lora.value ? '#f0fdf4' : '#fff',
                      color: loraType === lora.value ? '#16a34a' : '#374151',
                      fontSize: 13, cursor: 'pointer', fontWeight: loraType === lora.value ? 500 : 400,
                    }}
                  >
                    {lora.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 万物替换：蒙版上传 + 替换描述 */}
          {activeEdit === 'replace' && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                * 蒙版图片 <span style={{ color: '#ef4444', fontSize: 12 }}>（必选，标记要替换的区域）</span>
              </div>
              <input ref={maskInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleMaskFileChange} />
              {maskPreviewUrl ? (
                <div onClick={() => maskInputRef.current?.click()} style={{ border: '1.5px dashed #d1d5db', borderRadius: 8, padding: 8, cursor: 'pointer', maxWidth: 200 }}>
                  <img src={maskPreviewUrl} alt="mask" style={{ width: '100%', borderRadius: 6, display: 'block' }} />
                  <div style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 4 }}>点击替换</div>
                </div>
              ) : (
                <div onClick={() => maskInputRef.current?.click()} style={{ border: '1.5px dashed #d1d5db', borderRadius: 8, padding: '20px 16px', textAlign: 'center', cursor: 'pointer', maxWidth: 200 }}>
                  <div style={{ fontSize: 22, color: '#9ca3af', marginBottom: 4 }}>↑</div>
                  <div style={{ fontSize: 13, color: '#374151' }}>上传蒙版图片</div>
                </div>
              )}
              <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8, marginTop: 16 }}>
                替换描述 <span style={{ fontSize: 12, color: '#9ca3af' }}>（可选）</span>
              </div>
              <input
                value={replacePrompt}
                onChange={(e) => setReplacePrompt(e.target.value)}
                placeholder="描述替换成什么，例如：一只猫、红色跑车..."
                style={{
                  width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb',
                  borderRadius: 8, fontSize: 13, color: '#374151', outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#16a34a'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; }}
              />
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
