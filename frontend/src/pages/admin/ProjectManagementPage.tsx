/**
 * 管理后台 - 任务管理页面
 * 从后端 API 获取所有用户的 AI 生成任务记录
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Tag,
  Input,
  Select,
  Typography,
  Image,
  message,
} from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getAdminProjects, type AdminProjectItem } from '../../api/admin';

const { Title } = Typography;

export const ProjectManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<AdminProjectItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>();
  const [statusFilter, setStatusFilter] = useState<string>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  /** 从后端加载任务数据 */
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminProjects({
        skip: (page - 1) * pageSize,
        limit: pageSize,
        type: typeFilter,
        status: statusFilter,
        search: search || undefined,
      });
      setProjects(res.items || []);
      setTotal(res.total || 0);
    } catch {
      message.error('获取任务列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, typeFilter, statusFilter, search]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  /** 类型显示映射 */
  const typeMap: Record<string, { label: string; color: string }> = {
    text2img: { label: '文生图', color: 'blue' },
    img2img: { label: '图生图', color: 'green' },
    edit: { label: '图像编辑', color: 'orange' },
    '3d_render': { label: '3D渲染', color: 'purple' },
    portrait: { label: '人像写真', color: 'magenta' },
    ecommerce: { label: '产品电商', color: 'gold' },
    video: { label: '视频创作', color: 'cyan' },
    architecture: { label: '建筑室内', color: 'geekblue' },
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: '描述',
      dataIndex: 'prompt',
      key: 'prompt',
      width: 200,
      ellipsis: true,
      render: (prompt: string) => prompt || <span style={{ color: '#9ca3af' }}>无描述</span>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type: string, record: AdminProjectItem) => {
        const config = typeMap[type] || { label: type, color: 'default' };
        return (
          <span>
            <Tag color={config.color}>{config.label}</Tag>
            {record.subtype && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{record.subtype}</div>}
          </span>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string, record: AdminProjectItem) => {
        const statusMap: Record<string, { label: string; color: string }> = {
          pending: { label: '等待中', color: 'default' },
          processing: { label: '处理中', color: 'processing' },
          completed: { label: '已完成', color: 'success' },
          failed: { label: '失败', color: 'error' },
        };
        const config = statusMap[status] || { label: status, color: 'default' };
        return (
          <span>
            <Tag color={config.color}>{config.label}</Tag>
            {status === 'processing' && <div style={{ fontSize: 11, color: '#1890ff' }}>{record.progress}%</div>}
          </span>
        );
      },
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '消耗豆点',
      dataIndex: 'quota_cost',
      key: 'quota_cost',
      width: 100,
      render: (cost: number) => <span style={{ color: '#cf1322' }}>{cost.toFixed(1)}</span>,
    },
    {
      title: '预览',
      key: 'preview',
      width: 80,
      render: (_: any, record: AdminProjectItem) => {
        const url = record.result_url || (record.result_urls && record.result_urls[0]);
        return url ? (
          <Image src={url} width={50} height={50} style={{ objectFit: 'cover', borderRadius: 4 }} />
        ) : (
          <span style={{ color: '#d1d5db' }}>-</span>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (time: string) => time ? new Date(time).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right' as const,
      render: (_: any, record: AdminProjectItem) => (
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
      <Title level={2}>任务管理</Title>

      {/* 筛选栏 */}
      <div className="mb-4 flex flex-wrap gap-4">
        <Input
          placeholder="搜索用户名"
          prefix={<SearchOutlined />}
          style={{ width: 250 }}
          allowClear
          onPressEnter={(e) => { setSearch(e.currentTarget.value); setPage(1); }}
          onChange={(e) => { if (!e.target.value) { setSearch(''); setPage(1); } }}
        />
        <Select
          placeholder="筛选类型"
          style={{ width: 150 }}
          allowClear
          onChange={(v) => { setTypeFilter(v || undefined); setPage(1); }}
          options={Object.entries(typeMap).map(([value, { label }]) => ({ value, label }))}
        />
        <Select
          placeholder="筛选状态"
          style={{ width: 150 }}
          allowClear
          onChange={(v) => { setStatusFilter(v || undefined); setPage(1); }}
          options={[
            { value: 'pending', label: '等待中' },
            { value: 'processing', label: '处理中' },
            { value: 'completed', label: '已完成' },
            { value: 'failed', label: '失败' },
          ]}
        />
        <Button icon={<ReloadOutlined />} onClick={fetchProjects}>
          刷新
        </Button>
      </div>

      {/* 任务列表 */}
      <Table
        columns={columns}
        dataSource={projects}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条任务`,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />
    </div>
  );
};
