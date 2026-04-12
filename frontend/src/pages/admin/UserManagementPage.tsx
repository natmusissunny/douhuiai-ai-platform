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
  Tabs,
  Upload,
  message,
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
  InboxOutlined,
  DownloadOutlined,
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
  const [generateForm] = Form.useForm();

  // 批量创建 Tab 状态
  const [batchTab, setBatchTab] = useState<string>('manual');
  const [csvUsers, setCsvUsers] = useState<BatchUserCreateItem[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);

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
    batchCreateForm.setFieldsValue({ users: [{}] });
    generateForm.resetFields();
    generateForm.setFieldsValue({ count: 10, prefix: 'user', password: 'Douhuai@2026', emailSuffix: '@douhuiai.com', quota_balance: 0 });
    setCsvUsers([]);
    setCsvErrors([]);
    setBatchTab('manual');
    setBatchCreateModalVisible(true);
  };

  const handleBatchCreate = async () => {
    let users: BatchUserCreateItem[] = [];

    try {
      if (batchTab === 'manual') {
        // 手动填写模式
        const values = await batchCreateForm.validateFields();
        users = values.users.map((u: any) => ({
          ...u,
          quota_balance: u.quota_balance ?? 0,
          status: 'active',
        }));
      } else if (batchTab === 'csv') {
        // CSV 导入模式
        if (csvUsers.length === 0) {
          message.warning('请先上传并解析 CSV 文件');
          return;
        }
        if (csvErrors.length > 0) {
          message.warning('CSV 数据存在错误，请修正后重新上传');
          return;
        }
        users = csvUsers;
      } else if (batchTab === 'generate') {
        // 一键生成模式
        const values = await generateForm.validateFields();
        const { count, prefix, password, role_id, emailSuffix, quota_balance } = values;
        for (let i = 1; i <= count; i++) {
          const username = `${prefix}${String(i).padStart(3, '0')}`;
          users.push({
            username,
            email: `${username}${emailSuffix}`,
            password,
            role_id,
            quota_balance: quota_balance ?? 0,
          });
        }
      }

      if (users.length === 0) {
        message.warning('没有要创建的用户');
        return;
      }

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

  // CSV 模板下载
  const downloadCSVTemplate = () => {
    const header = '用户名,邮箱,密码,角色名,手机号,初始配额';
    const example = 'user001,user001@example.com,Password123,user,,0';
    const content = `\uFEFF${header}\n${example}\n`;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '批量创建用户模板.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // CSV 文件解析
  const parseCSV = (text: string) => {
    // 移除 BOM
    const cleaned = text.replace(/^\uFEFF/, '');
    const lines = cleaned.split(/\r?\n/).filter(line => line.trim());

    if (lines.length < 2) {
      setCsvErrors(['CSV 文件为空或仅包含表头']);
      setCsvUsers([]);
      return;
    }

    // 构建角色名 → id 映射
    const roleMap: Record<string, number> = {};
    (roles || []).forEach(r => { roleMap[r.name] = r.id; });

    const errors: string[] = [];
    const parsed: BatchUserCreateItem[] = [];

    // 跳过表头，逐行解析
    const dataLines = lines.slice(1);
    if (dataLines.length > 50) {
      errors.push(`数据行数 ${dataLines.length} 超过上限 50，仅导入前 50 行`);
    }

    dataLines.slice(0, 50).forEach((line, idx) => {
      const row = idx + 2; // 实际行号（含表头）
      // 简单 CSV 拆分（支持引号包裹）
      const cols = line.match(/(".*?"|[^,]*),?/g)?.map(c => c.replace(/,?$/, '').replace(/^"|"$/g, '').trim()) || [];
      const [username, email, password, roleName, phone, quotaStr] = cols;

      if (!username) { errors.push(`第 ${row} 行：用户名不能为空`); return; }
      if (!email) { errors.push(`第 ${row} 行：邮箱不能为空`); return; }
      if (!password || password.length < 6) { errors.push(`第 ${row} 行：密码至少 6 位`); return; }

      const role_id = roleMap[roleName || ''];
      if (!role_id) {
        const available = Object.keys(roleMap).join(', ');
        errors.push(`第 ${row} 行：角色名"${roleName || ''}"无效，可用角色：${available}`);
        return;
      }

      parsed.push({
        username,
        email,
        password,
        role_id,
        phone: phone || undefined,
        quota_balance: parseFloat(quotaStr) || 0,
      });
    });

    setCsvErrors(errors);
    setCsvUsers(parsed);
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

        <Tabs activeKey={batchTab} onChange={setBatchTab} items={[
          {
            key: 'manual',
            label: '手动填写',
            children: (
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
            ),
          },
          {
            key: 'csv',
            label: 'CSV 导入',
            children: (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <Button icon={<DownloadOutlined />} onClick={downloadCSVTemplate}>
                    下载 CSV 模板
                  </Button>
                  <span style={{ marginLeft: 12, color: '#999', fontSize: 12 }}>
                    格式：用户名,邮箱,密码,角色名,手机号,初始配额
                  </span>
                </div>
                <Upload.Dragger
                  accept=".csv"
                  maxCount={1}
                  beforeUpload={(file) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      const text = e.target?.result as string;
                      if (text) parseCSV(text);
                    };
                    reader.readAsText(file, 'utf-8');
                    return false; // 阻止自动上传
                  }}
                  onRemove={() => { setCsvUsers([]); setCsvErrors([]); }}
                >
                  <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                  <p className="ant-upload-text">点击或拖拽 CSV 文件到此区域</p>
                  <p className="ant-upload-hint">仅支持 .csv 格式，单次最多 50 条数据</p>
                </Upload.Dragger>

                {csvErrors.length > 0 && (
                  <Alert
                    type="error"
                    style={{ marginTop: 12 }}
                    message={`解析发现 ${csvErrors.length} 个错误`}
                    description={
                      <ul style={{ margin: 0, paddingLeft: 16, maxHeight: 150, overflow: 'auto', fontSize: 12 }}>
                        {csvErrors.map((err, i) => <li key={i}>{err}</li>)}
                      </ul>
                    }
                  />
                )}

                {csvUsers.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <Alert
                      type="success"
                      message={`成功解析 ${csvUsers.length} 条用户数据，可以点击"批量创建"提交`}
                      style={{ marginBottom: 8 }}
                    />
                    <Table
                      size="small"
                      dataSource={csvUsers}
                      rowKey={(_, i) => String(i)}
                      pagination={false}
                      scroll={{ y: 200 }}
                      columns={[
                        { title: '用户名', dataIndex: 'username', width: 120 },
                        { title: '邮箱', dataIndex: 'email', width: 180 },
                        { title: '角色', dataIndex: 'role_id', width: 80, render: (id: number) => (roles || []).find(r => r.id === id)?.name || id },
                        { title: '配额', dataIndex: 'quota_balance', width: 80 },
                      ]}
                    />
                  </div>
                )}
              </div>
            ),
          },
          {
            key: 'generate',
            label: '一键生成',
            children: (
              <Form form={generateForm} layout="vertical">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  <Form.Item
                    label="生成数量"
                    name="count"
                    rules={[{ required: true, message: '请输入数量' }]}
                  >
                    <InputNumber style={{ width: '100%' }} min={1} max={50} precision={0} placeholder="1-50" />
                  </Form.Item>
                  <Form.Item
                    label="用户名前缀"
                    name="prefix"
                    rules={[{ required: true, message: '请输入前缀' }]}
                    extra="生成格式：user001, user002..."
                  >
                    <Input placeholder="user" />
                  </Form.Item>
                  <Form.Item
                    label="统一密码"
                    name="password"
                    rules={[{ required: true, min: 6, message: '密码至少6位' }]}
                  >
                    <Input.Password placeholder="所有用户统一密码" />
                  </Form.Item>
                  <Form.Item
                    label="统一角色"
                    name="role_id"
                    rules={[{ required: true, message: '请选择角色' }]}
                  >
                    <Select
                      placeholder="选择角色"
                      options={(roles || []).map((r) => ({ value: r.id, label: r.name }))}
                    />
                  </Form.Item>
                  <Form.Item
                    label="邮箱后缀"
                    name="emailSuffix"
                    rules={[{ required: true, message: '请输入邮箱后缀' }]}
                    extra="生成格式：user001@douhuiai.com"
                  >
                    <Input placeholder="@douhuiai.com" />
                  </Form.Item>
                  <Form.Item label="统一初始配额" name="quota_balance">
                    <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="默认0" />
                  </Form.Item>
                </div>
              </Form>
            ),
          },
        ]} />
      </Modal>
    </div>
  );
};
