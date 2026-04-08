/**
 * 管理后台 - 用户管理页面
 */

import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  Typography,
  Popconfirm,
  Radio,
  Alert,
  Spin,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  DollarOutlined,
  StopOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UsergroupAddOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import { useAdminStore } from '../../stores/adminStore';
import type { UserListItem, UserCreateData, UserUpdateData, QuotaAdjustData, BatchUserCreateItem } from '../../api/admin';

const { Title } = Typography;

// antd 6 已移除 Select.Option 子组件写法，改用 options prop
const STATUS_OPTIONS = [
  { value: 'active', label: '正常' },
  { value: 'disabled', label: '禁用' },
  { value: 'banned', label: '封禁' },
];

export const UserManagementPage: React.FC = () => {
  const {
    users,
    userTotal,
    userLoading,
    roles,
    apiBalance,
    apiBalanceLoading,
    fetchUsers,
    fetchRoles,
    fetchApiBalance,
    updateUserStatus,
    createUser,
    updateUser,
    deleteUser,
    adjustQuota,
    batchCreateUsers,
    batchDeleteUsers,
  } = useAdminStore();

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>();

  // 弹窗状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [quotaModalVisible, setQuotaModalVisible] = useState(false);
  const [batchCreateModalVisible, setBatchCreateModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchCreateLoading, setBatchCreateLoading] = useState(false);
  const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [quotaForm] = Form.useForm();
  const [batchCreateForm] = Form.useForm();

  // 加载用户列表和角色列表
  useEffect(() => {
    fetchUsers({ page, per_page: perPage, status: statusFilter, search });
  }, [page, perPage, statusFilter, search, fetchUsers]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value || undefined);
    setPage(1);
  };

  const handleRefresh = () => {
    fetchUsers({ page, per_page: perPage, status: statusFilter, search });
  };

  const handleUpdateStatus = async (userId: number, status: string) => {
    try {
      await updateUserStatus(userId, status);
    } catch {
      // 错误已在store中处理
    }
  };

  // 创建用户
  const handleOpenCreate = () => {
    createForm.resetFields();
    setCreateModalVisible(true);
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      const data: UserCreateData = {
        ...values,
        quota_balance: values.quota_balance ?? 0,
      };
      await createUser(data);
      setCreateModalVisible(false);
    } catch {
      // 错误已在store或表单验证中处理
    }
  };

  // 编辑用户
  const handleOpenEdit = (user: UserListItem) => {
    setSelectedUser(user);
    editForm.setFieldsValue({
      email: user.email,
      phone: user.phone,
      role_id: user.role?.id,
      quota_limit: user.quota_limit,
      monthly_quota: user.monthly_quota,
      status: user.status,
    });
    setEditModalVisible(true);
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    try {
      const values = await editForm.validateFields();
      const data: UserUpdateData = values;
      await updateUser(selectedUser.id, data);
      setEditModalVisible(false);
    } catch {
      // 错误已在store或表单验证中处理
    }
  };

  // 删除用户
  const handleDelete = async (userId: number) => {
    try {
      await deleteUser(userId);
    } catch {
      // 错误已在store中处理
    }
  };

  // 配额调整
  const handleOpenQuota = (user: UserListItem) => {
    setSelectedUser(user);
    quotaForm.resetFields();
    quotaForm.setFieldsValue({ op: 'add' });
    fetchApiBalance();
    setQuotaModalVisible(true);
  };

  const handleAdjustQuota = async () => {
    if (!selectedUser) return;
    try {
      const values = await quotaForm.validateFields();
      const data: QuotaAdjustData = {
        op: values.op,
        amount: values.amount,
        remark: values.remark,
      };
      await adjustQuota(selectedUser.id, data);
      setQuotaModalVisible(false);
    } catch {
      // 错误已在store或表单验证中处理
    }
  };

  // 批量创建用户
  const handleOpenBatchCreate = () => {
    batchCreateForm.resetFields();
    // 默认给一条空记录
    batchCreateForm.setFieldsValue({ users: [{}] });
    setBatchCreateModalVisible(true);
  };

  const handleBatchCreate = async () => {
    try {
      const values = await batchCreateForm.validateFields();
      const users: BatchUserCreateItem[] = values.users.map((u: any) => ({
        ...u,
        quota_balance: u.quota_balance ?? 0,
        status: u.status ?? 'active',
      }));
      setBatchCreateLoading(true);
      const result = await batchCreateUsers(users);
      setBatchCreateLoading(false);

      // 显示详细结果
      if (result.fail_count > 0) {
        const failDetails = result.results
          .filter((r: any) => !r.success)
          .map((r: any) => `${r.username}: ${r.error}`)
          .join('\n');
        Modal.info({
          title: `创建完成（成功 ${result.success_count}，失败 ${result.fail_count}）`,
          content: <pre style={{ maxHeight: 300, overflow: 'auto', fontSize: 12 }}>{failDetails}</pre>,
        });
      }
      setBatchCreateModalVisible(false);
    } catch {
      setBatchCreateLoading(false);
    }
  };

  // 批量删除用户
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    setBatchDeleteLoading(true);
    try {
      const result = await batchDeleteUsers(selectedRowKeys as number[]);
      if (result.fail_count > 0) {
        const failDetails = result.results
          .filter((r: any) => !r.success)
          .map((r: any) => `用户 ${r.user_id}: ${r.error}`)
          .join('\n');
        Modal.info({
          title: `删除完成（成功 ${result.success_count}，失败 ${result.fail_count}）`,
          content: <pre style={{ maxHeight: 300, overflow: 'auto', fontSize: 12 }}>{failDetails}</pre>,
        });
      }
      setSelectedRowKeys([]);
    } catch {
      // 错误已在store中处理
    } finally {
      setBatchDeleteLoading(false);
    }
  };

  // 表格行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 140,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '手机',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
      render: (phone?: string) => phone || '-',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: { id: number; name: string }) => (
        <Tag color="blue">{role?.name || '-'}</Tag>
      ),
    },
    {
      title: '配额余额',
      dataIndex: 'quota_balance',
      key: 'quota_balance',
      width: 110,
      render: (balance: number) => (
        <span style={{ color: balance < 10 ? '#ff4d4f' : undefined }}>
          {Number(balance).toFixed(2)}
        </span>
      ),
    },
    {
      title: '上限',
      dataIndex: 'quota_limit',
      key: 'quota_limit',
      width: 90,
      render: (v?: number) => (v != null ? Number(v).toFixed(2) : '不限'),
    },
    {
      title: '月额度',
      dataIndex: 'monthly_quota',
      key: 'monthly_quota',
      width: 90,
      render: (v?: number) => (v != null ? Number(v).toFixed(2) : '不限'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          active: 'green',
          disabled: 'orange',
          banned: 'red',
        };
        const textMap: Record<string, string> = {
          active: '正常',
          disabled: '禁用',
          banned: '封禁',
        };
        return <Tag color={colorMap[status] || 'default'}>{textMap[status] || status}</Tag>;
      },
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (time: string) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right' as const,
      render: (_: any, record: UserListItem) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<DollarOutlined />}
            onClick={() => handleOpenQuota(record)}
          >
            配额
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenEdit(record)}
          >
            编辑
          </Button>
          {record.status === 'active' ? (
            <Popconfirm
              title="确认封禁该用户?"
              onConfirm={() => handleUpdateStatus(record.id, 'banned')}
              okText="确认"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<StopOutlined />}>
                封禁
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="确认解封该用户?"
              onConfirm={() => handleUpdateStatus(record.id, 'active')}
              okText="确认"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<CheckCircleOutlined />}>
                解封
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="确认删除该用户?此操作不可恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            okButtonProps={{ danger: true }}
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>用户管理</Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
            新建用户
          </Button>
          <Button icon={<UsergroupAddOutlined />} onClick={handleOpenBatchCreate}>
            批量创建
          </Button>
          <Popconfirm
            title={`确认删除选中的 ${selectedRowKeys.length} 个用户？此操作不可恢复`}
            onConfirm={handleBatchDelete}
            okText="删除"
            okButtonProps={{ danger: true }}
            cancelText="取消"
            disabled={selectedRowKeys.length === 0}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={selectedRowKeys.length === 0}
              loading={batchDeleteLoading}
            >
              批量删除{selectedRowKeys.length > 0 ? ` (${selectedRowKeys.length})` : ''}
            </Button>
          </Popconfirm>
        </Space>
      </div>

      {/* 筛选和操作栏 */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Input
          placeholder="搜索用户名或邮箱"
          prefix={<SearchOutlined />}
          style={{ width: 280 }}
          allowClear
          onPressEnter={(e) => handleSearch(e.currentTarget.value)}
          onChange={(e) => !e.target.value && handleSearch('')}
        />
        <Select
          placeholder="筛选状态"
          style={{ width: 140 }}
          allowClear
          onChange={handleStatusFilter}
          options={STATUS_OPTIONS}
        />
        <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
          刷新
        </Button>
      </div>

      {/* 用户列表表格 */}
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={userLoading}
        rowSelection={rowSelection}
        scroll={{ x: 1400 }}
        pagination={{
          current: page,
          pageSize: perPage,
          total: userTotal,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 个用户`,
          onChange: (newPage, newPerPage) => {
            setPage(newPage);
            setPerPage(newPerPage || 20);
          },
        }}
      />

      {/* 新建用户弹窗 */}
      <Modal
        title="新建用户"
        open={createModalVisible}
        onOk={handleCreate}
        onCancel={() => setCreateModalVisible(false)}
        okText="创建"
        cancelText="取消"
        width={520}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="3-50个字符" />
          </Form.Item>
          <Form.Item label="邮箱" name="email" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}>
            <Input placeholder="example@domain.com" />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, min: 6, message: '密码至少6位' }]}>
            <Input.Password placeholder="至少6位" />
          </Form.Item>
          <Form.Item label="手机号" name="phone">
            <Input placeholder="可选" />
          </Form.Item>
          <Form.Item label="昵称" name="nickname">
            <Input placeholder="可选" />
          </Form.Item>
          <Form.Item label="角色" name="role_id" rules={[{ required: true, message: '请选择角色' }]}>
            <Select
              placeholder="选择角色"
              options={(roles || []).map((r) => ({ value: r.id, label: r.name }))}
            />
          </Form.Item>
          <Form.Item label="初始配额余额" name="quota_balance">
            <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="默认0" />
          </Form.Item>
          <Form.Item label="配额上限" name="quota_limit">
            <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="不填则不限制" />
          </Form.Item>
          <Form.Item label="月度配额" name="monthly_quota">
            <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="不填则不限制" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑用户弹窗 */}
      <Modal
        title={`编辑用户 - ${selectedUser?.username}`}
        open={editModalVisible}
        onOk={handleEdit}
        onCancel={() => setEditModalVisible(false)}
        okText="保存"
        cancelText="取消"
        width={520}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="邮箱" name="email" rules={[{ type: 'email', message: '请输入有效邮箱' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="手机号" name="phone">
            <Input />
          </Form.Item>
          <Form.Item label="昵称" name="nickname">
            <Input />
          </Form.Item>
          <Form.Item label="角色" name="role_id">
            <Select
              placeholder="选择角色"
              options={(roles || []).map((r) => ({ value: r.id, label: r.name }))}
            />
          </Form.Item>
          <Form.Item label="配额上限" name="quota_limit">
            <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="不填则不限制" />
          </Form.Item>
          <Form.Item label="月度配额" name="monthly_quota">
            <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="不填则不限制" />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 配额调整弹窗 */}
      <Modal
        title={`调整配额 - ${selectedUser?.username}`}
        open={quotaModalVisible}
        onOk={handleAdjustQuota}
        onCancel={() => setQuotaModalVisible(false)}
        okText="确认调整"
        cancelText="取消"
        width={500}
      >
        {/* API余额提示 */}
        <Spin spinning={apiBalanceLoading}>
          {apiBalance && (
            <Alert
              type={apiBalance.warning ? 'warning' : 'info'}
              message={`豆绘API账户余额: ${apiBalance.balance.toFixed(2)} 元${apiBalance.warning ? '（余额不足，请及时充值）' : ''}`}
              style={{ marginBottom: 16 }}
            />
          )}
        </Spin>

        <div style={{ marginBottom: 12, color: '#666', fontSize: 13 }}>
          当前余额：<strong>{Number(selectedUser?.quota_balance ?? 0).toFixed(2)}</strong>
        </div>

        <Form form={quotaForm} layout="vertical">
          <Form.Item label="操作类型" name="op" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="set">直接设置</Radio>
              <Radio value="add">增加</Radio>
              <Radio value="subtract">扣除</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            label="金额"
            name="amount"
            rules={[
              { required: true, message: '请输入金额' },
              { type: 'number', min: 0.01, message: '金额必须大于0' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0.01}
              precision={2}
              placeholder="请输入金额"
            />
          </Form.Item>
          <Form.Item
            label="操作备注"
            name="remark"
            rules={[{ required: true, message: '备注为必填项，请说明操作原因' }]}
          >
            <Input.TextArea rows={3} placeholder="必填：请说明调整原因（如：测试充值、活动赠送等）" maxLength={200} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量创建用户弹窗 */}
      <Modal
        title="批量创建用户"
        open={batchCreateModalVisible}
        onOk={handleBatchCreate}
        onCancel={() => setBatchCreateModalVisible(false)}
        okText="批量创建"
        cancelText="取消"
        confirmLoading={batchCreateLoading}
        width={720}
      >
        <Alert
          type="info"
          message="单次最多创建 50 个用户。所有用户将默认为已验证状态。"
          style={{ marginBottom: 16 }}
        />
        <Form form={batchCreateForm} layout="vertical">
          <Form.List name="users">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <div key={key}>
                    {index > 0 && <Divider style={{ margin: '8px 0 16px' }} />}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                          <Form.Item
                            {...restField}
                            label="用户名"
                            name={[name, 'username']}
                            rules={[{ required: true, message: '请输入用户名' }]}
                          >
                            <Input placeholder="用户名" />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            label="邮箱"
                            name={[name, 'email']}
                            rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}
                          >
                            <Input placeholder="邮箱" />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            label="密码"
                            name={[name, 'password']}
                            rules={[{ required: true, min: 6, message: '密码至少6位' }]}
                          >
                            <Input.Password placeholder="密码（至少6位）" />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            label="角色"
                            name={[name, 'role_id']}
                            rules={[{ required: true, message: '请选择角色' }]}
                          >
                            <Select
                              placeholder="选择角色"
                              options={(roles || []).map((r) => ({ value: r.id, label: r.name }))}
                            />
                          </Form.Item>
                          <Form.Item {...restField} label="手机号" name={[name, 'phone']}>
                            <Input placeholder="可选" />
                          </Form.Item>
                          <Form.Item {...restField} label="初始配额" name={[name, 'quota_balance']}>
                            <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="默认0" />
                          </Form.Item>
                        </div>
                      </div>
                      {fields.length > 1 && (
                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                          style={{ marginTop: 30 }}
                        />
                      )}
                    </div>
                  </div>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                    disabled={fields.length >= 50}
                  >
                    添加用户 ({fields.length}/50)
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
};
