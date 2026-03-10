/**
 * 项目列表页面
 */
import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Select, message, Modal } from 'antd';
import { EyeOutlined, DeleteOutlined, RedoOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  getProjectList,
  deleteProject,
  retryProject,
  type ProjectResponse,
} from '../api/project';

const ProjectListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [filters, setFilters] = useState<{
    type?: string;
    status?: string;
  }>({});

  const statusColorMap: Record<string, string> = {
    pending: 'blue',
    processing: 'orange',
    completed: 'green',
    failed: 'red',
  };

  const statusTextMap: Record<string, string> = {
    pending: '等待中',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
  };

  const typeTextMap: Record<string, string> = {
    text2img: '文生图',
    img2img: '图生图',
    edit: '图片编辑',
    '3d_render': '3D渲染',
  };

  useEffect(() => {
    fetchProjects();
  }, [pagination.current, pagination.pageSize, filters]);

  useEffect(() => {
    // 如果从创建页面跳转过来,滚动到顶部
    if (location.state?.newProjectId) {
      window.scrollTo(0, 0);
      message.success('任务已提交,正在处理中...');
    }
  }, [location]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await getProjectList({
        skip: (pagination.current - 1) * pagination.pageSize,
        limit: pagination.pageSize,
        ...filters,
      });
      setProjects(data.items);
      setTotal(data.total);
    } catch (error) {
      message.error('获取项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (projectId: number) => {
    navigate(`/projects/${projectId}`);
  };

  const handleDelete = (project: ProjectResponse) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除项目 #${project.id} 吗?`,
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteProject(project.id);
          message.success('删除成功');
          fetchProjects();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleRetry = async (project: ProjectResponse) => {
    try {
      await retryProject(project.id);
      message.success('任务已重新提交');
      fetchProjects();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || '重试失败';
      message.error(errorMsg);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color="blue">{typeTextMap[type] || type}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColorMap[status] || 'default'}>
          {statusTextMap[status] || status}
        </Tag>
      ),
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 100,
      render: (progress: number) => `${progress}%`,
    },
    {
      title: '配额消耗',
      dataIndex: 'quota_cost',
      key: 'quota_cost',
      width: 120,
      render: (cost: number) => `${cost} 点`,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time: string) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: ProjectResponse) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record.id)}
          >
            查看
          </Button>
          {record.status === 'failed' && (
            <Button
              type="link"
              size="small"
              icon={<RedoOutlined />}
              onClick={() => handleRetry(record)}
            >
              重试
            </Button>
          )}
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">我的项目</h1>
        <Button type="primary" onClick={() => navigate('/dashboard')}>
          创建新项目
        </Button>
      </div>

      <Card>
        <div className="mb-4 flex gap-4">
          <Select
            placeholder="选择类型"
            allowClear
            style={{ width: 150 }}
            onChange={(value) => setFilters({ ...filters, type: value })}
            options={[
              { value: 'text2img', label: '文生图' },
              { value: 'img2img', label: '图生图' },
              { value: 'edit', label: '图片编辑' },
              { value: '3d_render', label: '3D渲染' },
            ]}
          />
          <Select
            placeholder="选择状态"
            allowClear
            style={{ width: 150 }}
            onChange={(value) => setFilters({ ...filters, status: value })}
            options={[
              { value: 'pending', label: '等待中' },
              { value: 'processing', label: '处理中' },
              { value: 'completed', label: '已完成' },
              { value: 'failed', label: '失败' },
            ]}
          />
        </div>

        <Table
          columns={columns}
          dataSource={projects}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination({ current: page, pageSize });
            },
          }}
          locale={{
            emptyText: '暂无项目数据',
          }}
        />
      </Card>
    </div>
  );
};

export default ProjectListPage;
