/**
 * 视频创作页面
 * 对齐官方视频创作模块，包含文生视频、图生视频、首尾帧、Sora2、数字人、文生音频等
 */
import { useState, useRef } from 'react';
import { message, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { createVideo } from '../api/project';
import { useAuthStore } from '../stores/authStore';

// 视频功能列表
const videoFunctions = [
  { label: '文生视频', type: 'text2video', needsImage: false, desc: '从文字描述生成视频' },
  { label: '图生视频', type: 'image2video', needsImage: true, desc: '从图片生成动态视频' },
  { label: '首尾帧', type: 'frames2video', needsImage: true, desc: '设定首尾帧生成过渡视频' },
  { label: 'Sora2视频', type: 'sora2video', needsImage: false, desc: 'Sora2模型生成高质量视频' },
  { label: '数字人口播', type: 'presenter', needsImage: true, desc: '数字人播报视频内容' },
  { label: '文生视频(音频版)', type: 'text2videoaudio', needsImage: false, desc: '文字生成带音频的视频' },
  { label: '图生视频(音频版)', type: 'image2videoaudio', needsImage: true, desc: '图片生成带音频的视频' },
  { label: '文生音频', type: 'text2voice', needsImage: false, desc: '从文字生成语音音频' },
];

// 时长选项
const durationOptions = [
  { value: '5', label: '5秒' },
  { value: '10', label: '10秒' },
  { value: '15', label: '15秒' },
];

// 分辨率选项
const resolutionOptions = [
  { value: '480p', label: '标清 480p' },
  { value: '720p', label: '高清 720p' },
  { value: '1080p', label: '超清 1080p' },
];

// 模式选项
const modeOptions = [
  { value: 'pro', label: '专业版' },
  { value: 'ultimate', label: '旗舰版' },
];

const VideoPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState('text2video');
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [duration, setDuration] = useState('5');
  const [resolution, setResolution] = useState('480p');
  const [mode, setMode] = useState('pro');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quotaBalance = Math.floor(Number(user?.quota_balance || 0));
  const activeFunc = videoFunctions.find(f => f.type === activeType)!;
  const isAudioOnly = activeType === 'text2voice';

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
    if (!prompt.trim()) {
      message.warning(isAudioOnly ? '请输入语音内容' : '请输入视频描述');
      return;
    }
    if (activeFunc.needsImage && !imageUrl) {
      message.warning('该功能需要上传图片');
      return;
    }
    // 视频：文生音频1豆点，普通5豆点，高级8豆点
    const cost = activeType === 'text2voice' ? 1 : ['sora2video', 'presenter'].includes(activeType) ? 8 : 5;
    if (quotaBalance < cost) {
      Modal.error({
        title: '豆点不足',
        icon: <ExclamationCircleOutlined />,
        content: `当前豆点 ${quotaBalance}，本操作需要 ${cost} 豆点，请充值后再试。`,
      });
      return;
    }

    setLoading(true);
    try {
      const data: any = {
        video_type: activeType,
        prompt,
        params: {},
      };
      if (activeFunc.needsImage && imageUrl) {
        data.image_url = imageUrl;
      }
      if (!isAudioOnly) {
        data.params.dhDuration = duration;
        data.params.dhResolution = resolution;
        data.params.dhMode = mode;
      }

      const project = await createVideo(data);
      message.success('任务创建成功，视频生成需要较长时间，请耐心等待...');
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
        <div style={{ padding: '8px 16px 4px', fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>
          视频创作
        </div>
        {videoFunctions.map((func) => (
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
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1f2937', margin: '0 0 6px' }}>
            {activeFunc.label}
          </h2>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{activeFunc.desc}</p>
        </div>

        {/* 图片上传（需要时） */}
        {activeFunc.needsImage && (
          <div style={{ marginBottom: 20, maxWidth: 520 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 10 }}>
              上传图片 <span style={{ color: '#ef4444' }}>*</span>
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
                <span>上传图片</span>
              </button>
            )}
          </div>
        )}

        {/* 描述输入 */}
        <div style={{ marginBottom: 20, maxWidth: 520 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 10 }}>
            {isAudioOnly ? '语音内容' : '视频描述'} <span style={{ color: '#ef4444' }}>*</span>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={isAudioOnly
              ? '输入要转为语音的文字内容（最多300字）'
              : '描述你想要生成的视频内容，如：一个小男孩在夕阳下奔跑'}
            maxLength={isAudioOnly ? 300 : 2000}
            style={{
              width: '100%', minHeight: 100, padding: '12px 16px',
              border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14,
              color: '#374151', resize: 'vertical', outline: 'none',
              fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff',
            }}
            onFocus={(e) => { (e.target).style.borderColor = '#16a34a'; }}
            onBlur={(e) => { (e.target).style.borderColor = '#e5e7eb'; }}
          />
          <div style={{ textAlign: 'right', fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
            {prompt.length}/{isAudioOnly ? 300 : 2000}
          </div>
        </div>

        {/* 视频参数（非音频时显示） */}
        {!isAudioOnly && (
          <>
            {/* 时长 */}
            <div style={{ marginBottom: 20, maxWidth: 520 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 10 }}>视频时长</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {durationOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDuration(opt.value)}
                    style={{
                      padding: '6px 14px',
                      border: duration === opt.value ? '1.5px solid #16a34a' : '1px solid #e5e7eb',
                      borderRadius: 8, background: duration === opt.value ? '#f0fdf4' : '#fff',
                      fontSize: 13, color: duration === opt.value ? '#16a34a' : '#374151',
                      cursor: 'pointer', fontWeight: duration === opt.value ? 500 : 400,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 分辨率 */}
            <div style={{ marginBottom: 20, maxWidth: 520 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 10 }}>分辨率</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {resolutionOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setResolution(opt.value)}
                    style={{
                      padding: '6px 14px',
                      border: resolution === opt.value ? '1.5px solid #16a34a' : '1px solid #e5e7eb',
                      borderRadius: 8, background: resolution === opt.value ? '#f0fdf4' : '#fff',
                      fontSize: 13, color: resolution === opt.value ? '#16a34a' : '#374151',
                      cursor: 'pointer', fontWeight: resolution === opt.value ? 500 : 400,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 模式 */}
            <div style={{ marginBottom: 20, maxWidth: 520 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 10 }}>视频版本</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {modeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMode(opt.value)}
                    style={{
                      padding: '6px 14px',
                      border: mode === opt.value ? '1.5px solid #16a34a' : '1px solid #e5e7eb',
                      borderRadius: 8, background: mode === opt.value ? '#f0fdf4' : '#fff',
                      fontSize: 13, color: mode === opt.value ? '#16a34a' : '#374151',
                      cursor: 'pointer', fontWeight: mode === opt.value ? 500 : 400,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </>
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
          {loading ? '处理中...' : isAudioOnly ? '生成音频' : '生成视频'}
        </button>
      </div>
    </div>
  );
};

export default VideoPage;
