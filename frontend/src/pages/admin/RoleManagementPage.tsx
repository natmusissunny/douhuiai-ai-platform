/**
 * 管理后台 - 角色权限管理页面
 */

import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Typography,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useAdminStore } from '../../stores/adminStore';
import type { RoleItem } from '../../api/admin';

const { Title } = Typography;

// 可用权限列表
const AVAILABLE_PERMISSIONS = [
  { value: '*', label: '所有权限', color: 'red' },
  { value: 'user:read', label: '查看用户', color: 'blue' },
  { value: 'user:write', label: '管理用户', color: 'cyan' },
  { value: 'role:read', label: '查看角色', color: 'green' },
  { value: 'role:write', label: '管理角色', color: 'lime' },
  { value: 'project:read', label: '查看项目', color: 'orange' },
  { value: 'project:write', label: '管理项目', color: 'gold' },
  { value: 'quota:read', label: '查看配额', color: 'purple' },
  { value: 'quota:write', label: '管理配额', color: 'magenta' },
  { value: 'statistics:read', label: '查看统计', color: 'volcano' },
];

export const RoleManagementPage: React.FC = () => {
  const { roles, roleLoading, fetchRoles, createRole, updateRole, deleteRole } =
    useAdminStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [form] = Form.useForm();

  // 加载角色列表
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // 打开新增弹窗
  const handleAdd = () => {
    setEditingRole(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 打开编辑弹窗
  const handleEdit = (role: RoleItem) => {
    setEditingRole(role);
    form.setFieldsValue({
      name: role.name,
      display_name: role.display_name,
      description: role.description,
      permissions: role.permissions,
    });
    setModalVisible(true);
  };

  // 处理删除
  const handleDelete = async (roleId: number) => {
    try {
      await deleteRole(roleId);
    } catch (error) {
      // 错误已在store中处理
    }
  };

  // 处理提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingRole) {
        // 编辑模式
        await updateRole(editingRole.id, {
          display_name: values.display_name,
          description: values.description,
          permissions: values.permissions,
        });
        message.success('角色更新成功');
      } else {
        // 新增模式
        await createRole({
          name: values.name,
          display_name: values.display_name,
          description: values.description,
          permissions: values.permissions,
        });
        message.success('角色创建成功');
      }

      setModalVisible(false);
    } catch (error) {
      // 错误已在store或表单验证中处理
    }
  };

  // 刷新列表
  const handleRefresh = () => {
    fetchRoles();
  };

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '角色标识',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (name: string) => <Tag color="blue">{name}</Tag>,
    },
    {
      title: '角色名称',
      dataIndex: 'display_name',
      key: 'display_name',
      width: 150,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc?: string) => desc || '-',
    },
    {
      title: '权限',
      dataIndex: 'permissions',
      key: 'permissions',
      width: 400,
      render: (permissions: string[]) => (
        <Space wrap>
          {permissions.map((perm) => {
            const config = AVAILABLE_PERMISSIONS.find((p) => p.value === perm);
            return (
              <Tag key={perm} color={config?.color || 'default'}>
                {config?.label || perm}
              </Tag>
            );
          })}
        </Space>
      ),
    },
    {
      title: '用户数',
      dataIndex: 'user_count',
      key: 'user_count',
      width: 100,
      render: (count: number) => <span className="font-semibold">{count}</span>,
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
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: RoleItem) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {record.name !== 'admin' && record.user_count === 0 && (
            <Popconfirm
              title="确认删除该角色?"
              description="删除后无法恢复"
              onConfirm={() => handleDelete(record.id)}
              okText="确认"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              >
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>角色权限管理</Title>

      {/* 操作栏 */}
      <div className="mb-4 flex gap-4">
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增角色
        </Button>
        <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
          刷新
        </Button>
      </div>

      {/* 角色列表表格 */}
      <Table
        columns={columns}
        dataSource={roles}
        rowKey="id"
        loading={roleLoading}
        scroll={{ x: 1200 }}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 个角色`,
        }}
      />

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingRole ? '编辑角色' : '新增角色'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确认"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="角色标识"
            name="name"
            rules={[
              { required: true, message: '请输入角色标识' },
              {
                pattern: /^[a-z_]+$/,
                message: '只能包含小写字母和下划线',
              },
            ]}
            help="唯一标识,只能包含小写字母和下划线,如: admin, editor, viewer"
          >
            <Input
              placeholder="例如: editor"
              disabled={!!editingRole}
              maxLength={50}
            />
          </Form.Item>

          <Form.Item
            label="角色名称"
            name="display_name"
            rules={[{ required: true, message: '请输入角色名称' }]}
            help="用于显示的中文名称"
          >
            <Input placeholder="例如: 编辑员" maxLength={50} />
          </Form.Item>

          <Form.Item label="角色描述" name="description">
            <Input.TextArea
              rows={3}
              placeholder="角色的详细描述"
              maxLength={200}
            />
          </Form.Item>

          <Form.Item
            label="权限"
            name="permissions"
            rules={[{ required: true, message: '请选择至少一个权限' }]}
            help="选择该角色拥有的权限"
          >
            <Select
              mode="multiple"
              placeholder="请选择权限"
              options={AVAILABLE_PERMISSIONS.map((perm) => ({
                value: perm.value,
                label: perm.label,
              }))}
              optionRender={(option) => {
                const perm = AVAILABLE_PERMISSIONS.find((p) => p.value === option.value);
                return <Tag color={perm?.color}>{option.label}</Tag>;
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
