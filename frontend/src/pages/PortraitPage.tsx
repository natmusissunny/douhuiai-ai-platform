/**
 * 人像写真页面
 * 对齐官方人像写真模块，包含8个子功能
 */
import { useState, useRef } from 'react';
import { message, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { createPortrait } from '../api/project';
import { useAuthStore } from '../stores/authStore';

// 人像写真功能列表
const portraitFunctions = [
  { label: '人像换脸', type: 'face_swap', needsFace: true, desc: '将一张照片的脸替换为另一张' },
  { label: '老照片修复', type: 'old_photo_repair', needsFace: false, desc: '修复模糊、破损的老照片' },
  { label: '人像变清晰', type: 'portrait_hd', needsFace: false, desc: '提升人像照片清晰度' },
  { label: '照片上色', type: 'colorize', needsFace: false, desc: '为黑白照片智能上色' },
  { label: 'AI证件照', type: 'id_photo', needsFace: true, desc: '生成标准证件照' },
  { label: 'AI写真', type: 'ai_portrait', needsFace: true, desc: '生成AI风格写真照' },
  { label: 'AI换发型', type: 'hair_change', needsFace: false, desc: '智能更换发型' },
  { label: '真人转漫画', type: 'people2cartoon', needsFace: false, desc: '将真人照片转为漫画风格' },
];

// 老照片破损程度选项
const blurLevels = [
  { value: '0', label: '轻微模糊' },
  { value: '1', label: '模糊' },
  { value: '2', label: '轻微破损' },
  { value: '3', label: '明显破损' },
  { value: '4', label: '严重破损' },
];

const PortraitPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState('face_swap');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [faceUrl, setFaceUrl] = useState('');
  const [facePreview, setFacePreview] = useState('');
  const [blurLevel, setBlurLevel] = useState('1');
  const mainInputRef = useRef<HTMLInputElement>(null);
  const faceInputRef = useRef<HTMLInputElement>(null);

  const quotaBalance = Math.floor(Number(user?.quota_balance || 0));
  const activeFunc = portraitFunctions.find(f => f.type === activeType)!;

  /** 文件转base64 */
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /** 上传主图 */
  const handleMainUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    setImageUrl(b64);
    setImagePreview(URL.createObjectURL(file));
  };

  /** 上传人脸图 */
  const handleFaceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    setFaceUrl(b64);
    setFacePreview(URL.createObjectURL(file));
  };

  /** 提交任务 */
  const handleSubmit = async () => {
    if (!imageUrl) {
      message.warning('请先上传图片');
      return;
    }
    if (activeFunc.needsFace && !faceUrl) {
      message.warning('该功能需要上传人脸参考图');
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
        portrait_type: activeType,
      };
      if (activeFunc.needsFace) {
        data.face_url = faceUrl;
      }
      if (activeType === 'old_photo_repair') {
        data.params = { blurLevel };
      }

      const project = await createPortrait(data);
      message.success('任务创建成功，正在处理中...');
      navigate('/projects', { state: { newProjectId: project.id } });
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || '创建任务失败';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /** 切换功能时清空状态 */
  const handleSwitchType = (type: string) => {
    setActiveType(type);
    setImageUrl('');
    setImagePreview('');
    setFaceUrl('');
    setFacePreview('');
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 88px)', background: '#f5f5f5' }}>
      {/* 左侧功能菜单 */}
      <aside style={{
        width: 160, background: '#fff', borderRight: '1px solid #f0f0f0',
        flexShrink: 0, overflowY: 'auto', paddingTop: 8,
      }}>
        <div style={{
          padding: '8px 16px 4px', fontSize: 11, color: '#9ca3af', fontWeight: 500,
        }}>
          人像写真
        </div>
        {portraitFunctions.map((func) => (
          <button
            key={func.type}
            onClick={() => handleSwitchType(func.type)}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '8px 16px', border: 'none',
              background: activeType === func.type ? '#f0fdf4' : 'none',
              color: activeType === func.type ? '#16a34a' : '#374151',
              fontSize: 13, cursor: 'pointer',
              fontWeight: activeType === func.type ? 500 : 400,
              borderRight: activeType === func.type ? '2px solid #16a34a' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (activeType !== func.type) (e.currentTarget).style.background = '#f9fafb';
            }}
            onMouseLeave={(e) => {
              if (activeType !== func.type) (e.currentTarget).style.background = 'none';
            }}
          >
            {func.label}
          </button>
        ))}
      </aside>

      {/* 中间内容区 */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 100px' }}>
        {/* 功能说明 */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1f2937', margin: '0 0 6px' }}>
            {activeFunc.label}
          </h2>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{activeFunc.desc}</p>
        </div>

        {/* 主图上传 */}
        <div style={{ marginBottom: 20, maxWidth: 520 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 10 }}>
            {activeFunc.needsFace ? '底图' : '上传图片'} <span style={{ color: '#ef4444' }}>*</span>
          </div>
          <input ref={mainInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleMainUpload} />
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
              onClick={() => mainInputRef.current?.click()}
              style={{
                width: 200, height: 200, border: '1.5px dashed #d1d5db', borderRadius: 12,
                background: '#fafafa', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 8, color: '#9ca3af', fontSize: 14,
              }}
            >
              <span style={{ fontSize: 28 }}>+</span>
              <span>点击上传图片</span>
            </button>
          )}
        </div>

        {/* 人脸图上传（需要时显示） */}
        {activeFunc.needsFace && (
          <div style={{ marginBottom: 20, maxWidth: 520 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 10 }}>
              人脸参考图 <span style={{ color: '#ef4444' }}>*</span>
            </div>
            <input ref={faceInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFaceUpload} />
            {facePreview ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={facePreview} style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <button
                  onClick={() => { setFaceUrl(''); setFacePreview(''); }}
                  style={{
                    position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)',
                    color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24,
                    cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >x</button>
              </div>
            ) : (
              <button
                onClick={() => faceInputRef.current?.click()}
                style={{
                  width: 150, height: 150, border: '1.5px dashed #d1d5db', borderRadius: 12,
                  background: '#fafafa', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 8, color: '#9ca3af', fontSize: 13,
                }}
              >
                <span style={{ fontSize: 24 }}>+</span>
                <span>上传人脸图</span>
              </button>
            )}
          </div>
        )}

        {/* 老照片修复的破损程度选项 */}
        {activeType === 'old_photo_repair' && (
          <div style={{ marginBottom: 20, maxWidth: 520 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 10 }}>
              破损程度
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {blurLevels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setBlurLevel(level.value)}
                  style={{
                    padding: '6px 14px',
                    border: blurLevel === level.value ? '1.5px solid #16a34a' : '1px solid #e5e7eb',
                    borderRadius: 8,
                    background: blurLevel === level.value ? '#f0fdf4' : '#fff',
                    fontSize: 13,
                    color: blurLevel === level.value ? '#16a34a' : '#374151',
                    cursor: 'pointer', fontWeight: blurLevel === level.value ? 500 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {level.label}
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
          {loading ? '处理中...' : '开始处理'}
        </button>
      </div>
    </div>
  );
};

export default PortraitPage;
