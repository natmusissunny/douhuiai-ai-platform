/**
 * 项目详情页
 */
import { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Image,
  Progress,
  message,
  Modal,
  Row,
  Col,
  Alert,
} from 'antd';
import {
  ReloadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { getProjectDetail, retryProject, deleteProject } from '../api/project';
import type { ProjectResponse } from '../api/project';

const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // 状态颜色映射
  const statusColorMap: Record<string, string> = {
    pending: 'blue',
    processing: 'orange',
    completed: 'green',
    failed: 'red',
  };

  // 状态文本映射
  const statusTextMap: Record<string, string> = {
    pending: '等待中',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
  };

  // 类型文本映射
  const typeTextMap: Record<string, string> = {
    text2img: '文生图',
    img2img: '图生图',
    edit: '图片编辑',
    '3d_render': '3D渲染',
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const data = await getProjectDetail(parseInt(id));
      setProject(data);
    } catch (error) {
      message.error('获取项目详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!project) return;

    setRetrying(true);
    try {
      const updatedProject = await retryProject(project.id);
      setProject(updatedProject);
      message.success('任务已重新提交');
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || '重试失败';
      message.error(errorMsg);
    } finally {
      setRetrying(false);
    }
  };

  const handleDelete = () => {
    if (!project) return;

    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个项目吗?此操作不可恢复。',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteProject(project.id);
          message.success('删除成功');
          navigate('/projects');
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleDownload = (url: string, index?: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `image_${project?.id}_${index || 0}.png`;
    link.click();
  };

  if (loading || !project) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card loading={loading}>加载中...</Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/projects')}
          className="mb-4"
        >
          返回列表
        </Button>
        <h1 className="text-3xl font-bold">项目详情</h1>
      </div>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          {/* 项目状态 */}
          {project.status === 'failed' && (
            <Alert
              message="任务失败"
              description={project.error_message || '未知错误'}
              type="error"
              showIcon
              className="mb-4"
              action={
                <Button size="small" danger onClick={handleRetry} loading={retrying}>
                  重试
                </Button>
              }
            />
          )}

          {project.status === 'processing' && (
            <Card className="mb-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">任务处理中</h3>
                <Progress percent={project.progress} status="active" />
                <p className="text-gray-600 mt-2">请稍候...</p>
              </div>
            </Card>
          )}

          {/* 结果展示 */}
          {project.status === 'completed' && project.result_urls && (
            <Card title="生成结果" className="mb-4">
              <Row gutter={[16, 16]}>
                {project.result_urls.map((url, index) => (
                  <Col key={index} xs={24} sm={12} md={project.result_urls!.length > 2 ? 12 : 24}>
                    <div className="relative group">
                      <Image src={url} alt={`结果 ${index + 1}`} />
                      <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDownload(url, index)}
                      >
                        下载
                      </Button>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          )}

          {/* 输入参数 */}
          <Card title="输入参数">
            <Descriptions column={2} bordered>
              {project.type === 'text2img' && (
                <>
                  <Descriptions.Item label="提示词" span={2}>
                    {project.input_params.prompt}
                  </Descriptions.Item>
                  {project.input_params.negative_prompt && (
                    <Descriptions.Item label="负面提示词" span={2}>
                      {project.input_params.negative_prompt}
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="尺寸">
                    {project.input_params.width} x {project.input_params.height}
                  </Descriptions.Item>
                  <Descriptions.Item label="数量">
                    {project.input_params.num_images || 1}
                  </Descriptions.Item>
                  <Descriptions.Item label="步数">
                    {project.input_params.steps}
                  </Descriptions.Item>
                  <Descriptions.Item label="引导系数">
                    {project.input_params.guidance_scale}
                  </Descriptions.Item>
                  {project.input_params.style && (
                    <Descriptions.Item label="风格">
                      {project.input_params.style}
                    </Descriptions.Item>
                  )}
                  {project.input_params.seed && (
                    <Descriptions.Item label="种子">
                      {project.input_params.seed}
                    </Descriptions.Item>
                  )}
                </>
              )}
              {project.type === 'img2img' && (
                <>
                  <Descriptions.Item label="提示词" span={2}>
                    {project.input_params.prompt}
                  </Descriptions.Item>
                  <Descriptions.Item label="强度">
                    {project.input_params.strength}
                  </Descriptions.Item>
                  <Descriptions.Item label="步数">
                    {project.input_params.steps}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {/* 基本信息 */}
          <Card title="基本信息" className="mb-4">
            <Descriptions column={1}>
              <Descriptions.Item label="项目ID">
                {project.id}
              </Descriptions.Item>
              <Descriptions.Item label="任务ID">
                {project.uuid}
              </Descriptions.Item>
              <Descriptions.Item label="类型">
                <Tag color="blue">{typeTextMap[project.type] || project.type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColorMap[project.status]}>
                  {statusTextMap[project.status] || project.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="配额消耗">
                {project.quota_cost} 点
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(project.created_at).toLocaleString('zh-CN')}
              </Descriptions.Item>
              {project.completed_at && (
                <Descriptions.Item label="完成时间">
                  {new Date(project.completed_at).toLocaleString('zh-CN')}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* 操作按钮 */}
          <Card title="操作">
            <Space direction="vertical" className="w-full">
              {project.status === 'failed' && (
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={handleRetry}
                  loading={retrying}
                  block
                >
                  重试任务
                </Button>
              )}
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleDelete}
                block
              >
                删除项目
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProjectDetailPage;
