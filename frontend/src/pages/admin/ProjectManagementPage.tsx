/**
 * 管理后台 - 项目管理页面
 */

import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Tag,
  Input,
  Select,
  Typography,
  Image,
} from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

// Mock数据 - 实际应该从API获取
const mockProjects = [
  {
    id: 1,
    title: '梦幻森林',
    type: 'text2img',
    status: 'completed',
    username: 'user123',
    result_url: 'https://via.placeholder.com/150',
    created_at: '2026-02-14T10:00:00',
  },
  {
    id: 2,
    title: '赛博朋克城市',
    type: 'img2img',
    status: 'processing',
    username: 'user456',
    result_url: null,
    created_at: '2026-02-14T11:00:00',
  },
  {
    id: 3,
    title: '未来科技',
    type: 'text2img',
    status: 'failed',
    username: 'user789',
    result_url: null,
    created_at: '2026-02-14T12:00:00',
  },
];

export const ProjectManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects] = useState(mockProjects);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>();
  const [statusFilter, setStatusFilter] = useState<string>();

  // Mock加载数据
  useEffect(() => {
    // 实际应该调用API
    setLoading(false);
  }, [search, typeFilter, statusFilter]);

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const handleTypeFilter = (value: string) => {
    setTypeFilter(value || undefined);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value || undefined);
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '项目名称',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const typeMap: Record<string, { label: string; color: string }> = {
          text2img: { label: '文生图', color: 'blue' },
          img2img: { label: '图生图', color: 'green' },
          edit: { label: '图像编辑', color: 'orange' },
          '3d': { label: '3D渲染', color: 'purple' },
        };
        const config = typeMap[type] || { label: type, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const statusMap: Record<string, { label: string; color: string }> = {
          pending: { label: '等待中', color: 'default' },
          processing: { label: '处理中', color: 'processing' },
          completed: { label: '已完成', color: 'success' },
          failed: { label: '失败', color: 'error' },
        };
        const config = statusMap[status] || { label: status, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      width: 150,
    },
    {
      title: '预览',
      dataIndex: 'result_url',
      key: 'result_url',
      width: 100,
      render: (url: string | null) =>
        url ? (
          <Image
            src={url}
            width={50}
            height={50}
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/projects/${record.id}`)}
        >
          查看
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>项目管理</Title>

      {/* 筛选和操作栏 */}
      <div className="mb-4 flex flex-wrap gap-4">
        <Input
          placeholder="搜索项目名称或用户"
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
          allowClear
          onPressEnter={(e) => handleSearch(e.currentTarget.value)}
          onChange={(e) => !e.target.value && handleSearch('')}
        />
        <Select
          placeholder="筛选类型"
          style={{ width: 150 }}
          allowClear
          onChange={handleTypeFilter}
          options={[
            { value: 'text2img', label: '文生图' },
            { value: 'img2img', label: '图生图' },
            { value: 'edit', label: '图像编辑' },
            { value: '3d', label: '3D渲染' },
          ]}
        />
        <Select
          placeholder="筛选状态"
          style={{ width: 150 }}
          allowClear
          onChange={handleStatusFilter}
          options={[
            { value: 'pending', label: '等待中' },
            { value: 'processing', label: '处理中' },
            { value: 'completed', label: '已完成' },
            { value: 'failed', label: '失败' },
          ]}
        />
        <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
          刷新
        </Button>
      </div>

      {/* 项目列表表格 */}
      <Table
        columns={columns}
        dataSource={projects}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 个项目`,
        }}
      />
    </div>
  );
};
