/**
 * 产品电商页面
 * 对齐官方产品电商模块，包含一键生成、商品图编辑、AI设计等功能
 */
import { useState, useRef } from 'react';
import { message, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { createEcommerce } from '../api/project';
import { useAuthStore } from '../stores/authStore';

// 功能分组
const functionGroups = [
  {
    label: '快捷工具',
    items: [
      { label: '一键白底图', type: 'white_bg', desc: '自动去背景生成白底商品图' },
      { label: '一键场景图', type: 'scene_bg', desc: '为商品自动生成场景背景' },
      { label: '一键卖点图', type: 'selling_point', desc: '突出产品卖点的营销图' },
      { label: '一键细节特写', type: 'detail_enhance', desc: '生成商品细节特写图' },
      { label: 'AI试穿试戴', type: 'virtual_tryon', desc: '虚拟试穿服饰/配饰' },
    ],
  },
  {
    label: '商品图编辑',
    items: [
      { label: '抠图换背景', type: 'product_rmbg', desc: '精准抠出商品并更换背景' },
      { label: '变清晰', type: 'product_clear', desc: '提升商品图清晰度' },
      { label: '产品精修', type: 'product_refine', desc: '智能优化产品细节' },
      { label: '高清放大', type: 'product_upscale', desc: '无损放大商品图片' },
      { label: 'AI换背景', type: 'product_changebg', desc: '智能替换商品背景' },
      { label: '电商白底图', type: 'product_whitebg', desc: '生成标准电商白底图' },
      { label: '一键高级感', type: 'product_premium', desc: '提升商品图质感' },
      { label: '换色换材质', type: 'product_recolor', desc: '更换商品颜色和材质' },
      { label: '图片翻译', type: 'product_translate', desc: '翻译图片中的文字' },
    ],
  },
  {
    label: 'AI设计',
    items: [
      { label: 'AI产品设计', type: 'product_design', desc: '从文字描述生成产品设计图' },
    ],
  },
];

// 生成模式选项
const designModes = [
  { value: 'strict', label: '模式一（严格）' },
  { value: 'consistent', label: '模式二（一致）' },
  { value: 'pro', label: 'Pro模式' },
];

const EcommercePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState('white_bg');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [prompt, setPrompt] = useState('');
  const [designMode, setDesignMode] = useState('strict');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quotaBalance = Math.floor(Number(user?.quota_balance || 0));

  // 获取当前功能信息
  const allFunctions = functionGroups.flatMap(g => g.items);
  const activeFunc = allFunctions.find(f => f.type === activeType)!;

  // 是否为一键生成类（显示模式选择）
  const isOneKeyType = functionGroups[0].items.some(f => f.type === activeType);

  /** 文件转base64 */
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    setImageUrl(b64);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!imageUrl && activeType !== 'product_design') {
      message.warning('请先上传商品图');
      return;
    }
    if (activeType === 'product_design' && !prompt) {
      message.warning('请输入产品设计描述');
      return;
    }
    if (quotaBalance < 20) {
      Modal.error({
        title: '豆点不足',
        icon: <ExclamationCircleOutlined />,
        content: `当前豆点 ${quotaBalance}，请充值后再试。`,
      });
      return;
    }

    setLoading(true);
    try {
      const data: any = {
        image_url: imageUrl,
        ecommerce_type: activeType,
      };
      if (prompt) data.prompt = prompt;
      if (isOneKeyType) {
        data.params = { dhDesignMode: designMode };
      }

      const project = await createEcommerce(data);
      message.success('任务创建成功，正在处理中...');
      navigate('/projects', { state: { newProjectId: project.id } });
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || '创建任务失败';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchType = (type: string) => {
    setActiveType(type);
    setImageUrl('');
    setImagePreview('');
    setPrompt('');
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 88px)', background: '#f5f5f5' }}>
      {/* 左侧功能菜单 */}
      <aside style={{
        width: 160, background: '#fff', borderRight: '1px solid #f0f0f0',
        flexShrink: 0, overflowY: 'auto', paddingTop: 8,
      }}>
        {functionGroups.map((group) => (
          <div key={group.label}>
            <div style={{
              padding: '8px 16px 4px', fontSize: 11, color: '#9ca3af', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span style={{ flex: 1 }}>{group.label}</span>
              <span style={{ fontSize: 10 }}>-</span>
            </div>
            {group.items.map((item) => (
              <button
                key={item.type}
                onClick={() => handleSwitchType(item.type)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '8px 16px', border: 'none',
                  background: activeType === item.type ? '#f0fdf4' : 'none',
                  color: activeType === item.type ? '#16a34a' : '#374151',
                  fontSize: 13, cursor: 'pointer',
                  fontWeight: activeType === item.type ? 500 : 400,
                  borderRight: activeType === item.type ? '2px solid #16a34a' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (activeType !== item.type) (e.currentTarget).style.background = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  if (activeType !== item.type) (e.currentTarget).style.background = 'none';
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* 中间内容区 */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 100px' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1f2937', margin: '0 0 6px' }}>
            {activeFunc.label}
          </h2>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{activeFunc.desc}</p>
        </div>

        {/* 商品图上传 */}
        <div style={{ marginBottom: 20, maxWidth: 520 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 10 }}>
            上传商品图 {activeType !== 'product_design' && <span style={{ color: '#ef4444' }}>*</span>}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
          {imagePreview ? (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img src={imagePreview} style={{ maxWidth: 300, maxHeight: 300, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <button
                onClick={() => { setImageUrl(''); setImagePreview(''); }}
                style={{
                  position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)',
                  color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24,
                  cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >x</button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 200, height: 200, border: '1.5px dashed #d1d5db', borderRadius: 12,
                background: '#fafafa', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 8, color: '#9ca3af', fontSize: 14,
              }}
            >
              <span style={{ fontSize: 28 }}>+</span>
              <span>上传商品图</span>
            </button>
          )}
        </div>

        {/* 自定义描述（可选） */}
        <div style={{ marginBottom: 20, maxWidth: 520 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 10 }}>
            自定义描述 {activeType === 'product_design' ? <span style={{ color: '#ef4444' }}>*</span> : '（可选）'}
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={activeType === 'product_design'
              ? '描述你想要设计的产品，如：极简风格的蓝牙耳机，白色磨砂质感'
              : '如：拍摄角度：正面视角，产品状态：细节特写'}
            style={{
              width: '100%', minHeight: 80, padding: '12px 16px',
              border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14,
              color: '#374151', resize: 'vertical', outline: 'none',
              fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff',
            }}
            onFocus={(e) => { (e.target).style.borderColor = '#16a34a'; }}
            onBlur={(e) => { (e.target).style.borderColor = '#e5e7eb'; }}
          />
        </div>

        {/* 一键生成类的模式选择 */}
        {isOneKeyType && (
          <div style={{ marginBottom: 20, maxWidth: 520 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 10 }}>
              生成模式
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {designModes.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setDesignMode(mode.value)}
                  style={{
                    padding: '6px 14px',
                    border: designMode === mode.value ? '1.5px solid #16a34a' : '1px solid #e5e7eb',
                    borderRadius: 8,
                    background: designMode === mode.value ? '#f0fdf4' : '#fff',
                    fontSize: 13,
                    color: designMode === mode.value ? '#16a34a' : '#374151',
                    cursor: 'pointer', fontWeight: designMode === mode.value ? 500 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 底部操作栏 */}
      <div style={{
        position: 'fixed', bottom: 0, left: 232, right: 0,
        background: '#fff', borderTop: '1px solid #f0f0f0',
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280' }}>
          <span>我的豆点: <strong style={{ color: '#1f2937' }}>{quotaBalance}</strong></span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            padding: '12px 48px',
            background: loading ? '#9ca3af' : 'linear-gradient(90deg, #16a34a, #0d9488)',
            color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '处理中...' : '开始生成'}
        </button>
      </div>
    </div>
  );
};

export default EcommercePage;
