/**
 * 建筑室内页面
 * 对齐官方建筑&室内&家居模块
 */
import { useState, useRef } from 'react';
import { message, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { createArchitecture } from '../api/project';
import { useAuthStore } from '../stores/authStore';

// 功能分组（三级菜单结构）
const functionGroups = [
  {
    label: '场景加模特',
    items: [
      { label: '智能加模特', type: 'add_model_smart', needsImage: true, desc: '在效果图中智能添加人物' },
      { label: '涂抹区域增加', type: 'add_model_paint', needsImage: true, desc: '在指定区域添加人物' },
      { label: '模特优化修复', type: 'add_model_repair', needsImage: true, desc: '优化已有人物效果' },
    ],
  },
  {
    label: '软硬装替换',
    items: [
      { label: '智能替换', type: 'furnish_smart', needsImage: true, desc: '智能替换家具和装饰' },
      { label: '涂抹区域替换', type: 'furnish_paint', needsImage: true, desc: '在指定区域替换软硬装' },
    ],
  },
  {
    label: '效果图后期',
    items: [
      { label: '高清放大', type: 'arch_upscale', needsImage: true, desc: '效果图高清放大' },
      { label: 'AI洗图', type: 'arch_wash', needsImage: true, desc: 'AI优化效果图质感' },
      { label: '高清重绘', type: 'arch_hd_repaint', needsImage: true, desc: '高清重新渲染' },
      { label: '变清晰', type: 'arch_clear', needsImage: true, desc: '提升效果图清晰度' },
      { label: '日夜气候切换', type: 'arch_daynight', needsImage: true, desc: '切换白昼/夜景/天气效果' },
      { label: '风格迁移', type: 'arch_style', needsImage: true, desc: '迁移不同装修风格' },
      { label: '涂抹消除', type: 'arch_erase', needsImage: true, desc: '消除指定区域物体' },
      { label: '局部修复', type: 'arch_local_repair', needsImage: true, desc: '修复局部瑕疵' },
      { label: '局部修改', type: 'arch_local_edit', needsImage: true, desc: '修改局部细节' },
      { label: '局部替换', type: 'arch_replace', needsImage: true, desc: '替换局部元素' },
      { label: '线稿提取', type: 'arch_sketch', needsImage: true, desc: '从效果图提取线稿' },
      { label: 'AI智能改图', type: 'arch_smart_edit', needsImage: true, desc: '智能编辑效果图' },
    ],
  },
  {
    label: '其他工具',
    items: [
      { label: 'AI概念图', type: 'concept', needsImage: false, desc: '从描述生成建筑概念图' },
      { label: '3D渲染', type: 'arch_3d', needsImage: true, desc: '将平面图渲染为3D效果' },
      { label: '线稿渲染', type: 'line_render', needsImage: true, desc: '线稿渲染为效果图' },
      { label: '彩平图', type: 'color_cad', needsImage: true, desc: '生成彩色平面图' },
      { label: '风格转换', type: 'arch_transform', needsImage: true, desc: '转换装修风格' },
      { label: '毛坯房精装', type: 'rough_to_fine', needsImage: true, desc: '将毛坯房渲染为精装效果' },
    ],
  },
];

const ArchitecturePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState('add_model_smart');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [prompt, setPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quotaBalance = Math.floor(Number(user?.quota_balance || 0));
  const allFunctions = functionGroups.flatMap(g => g.items);
  const activeFunc = allFunctions.find(f => f.type === activeType)!;

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
    if (activeFunc.needsImage && !imageUrl) {
      message.warning('请先上传图片');
      return;
    }
    if (!activeFunc.needsImage && !prompt.trim()) {
      message.warning('请输入描述');
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
        arch_type: activeType,
      };
      if (imageUrl) data.image_url = imageUrl;
      if (prompt) data.prompt = prompt;

      const project = await createArchitecture(data);
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
        width: 170, background: '#fff', borderRight: '1px solid #f0f0f0',
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
                  padding: '7px 16px', border: 'none',
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

        {/* 图片上传 */}
        {activeFunc.needsImage && (
          <div style={{ marginBottom: 20, maxWidth: 520 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 10 }}>
              上传效果图 <span style={{ color: '#ef4444' }}>*</span>
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
                <span>上传效果图</span>
              </button>
            )}
          </div>
        )}

        {/* 描述输入 */}
        <div style={{ marginBottom: 20, maxWidth: 520 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 10 }}>
            {activeFunc.needsImage ? '描述/指令（可选）' : '描述'} {!activeFunc.needsImage && <span style={{ color: '#ef4444' }}>*</span>}
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              activeType.startsWith('add_model') ? '如：在沙发旁添加一个欧美女性，穿白色连衣裙'
                : activeType.startsWith('furnish') ? '如：将沙发替换为北欧风格灰色布艺沙发'
                : activeType === 'concept' ? '描述你想要的建筑概念图，如：现代别墅，落地窗，山景'
                : '输入描述或编辑指令'
            }
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
      </main>

      {/* 底部操作栏 */}
      <div style={{
        position: 'fixed', bottom: 0, left: 242, right: 0,
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
          {loading ? '处理中...' : '开始处理'}
        </button>
      </div>
    </div>
  );
};

export default ArchitecturePage;
