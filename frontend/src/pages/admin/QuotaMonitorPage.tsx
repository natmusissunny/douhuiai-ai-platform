/**
 * 管理后台 - 余额监控页面
 * 显示豆绘API账户余额 + 用户配额消耗排行
 */

import React, { useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Typography,
  Alert,
  Statistic,
  Row,
  Col,
  Spin,
  Tag,
} from 'antd';
import {
  ReloadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useAdminStore } from '../../stores/adminStore';

const { Title } = Typography;

export const QuotaMonitorPage: React.FC = () => {
  const {
    apiBalance,
    apiBalanceLoading,
    fetchApiBalance,
    users,
    userTotal,
    userLoading,
    fetchUsers,
  } = useAdminStore();

  useEffect(() => {
    fetchApiBalance();
    fetchUsers({ per_page: 50 });
  }, [fetchApiBalance, fetchUsers]);

  // 按余额排序，取前20
  const topConsumers = [...users]
    .sort((a, b) => Number(b.quota_balance) - Number(a.quota_balance))
    .slice(0, 20);

  const lowBalanceUsers = users.filter((u) => Number(u.quota_balance) < 10);

  const columns = [
    {
      title: '排名',
      key: 'rank',
      width: 70,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 150,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: { name: string }) => <Tag color="blue">{role?.name || '-'}</Tag>,
    },
    {
      title: '配额余额',
      dataIndex: 'quota_balance',
      key: 'quota_balance',
      width: 120,
      render: (v: number) => (
        <span style={{ color: v < 10 ? '#ff4d4f' : v < 50 ? '#fa8c16' : '#52c41a', fontWeight: 600 }}>
          {Number(v).toFixed(2)}
        </span>
      ),
    },
    {
      title: '配额上限',
      dataIndex: 'quota_limit',
      key: 'quota_limit',
      width: 100,
      render: (v?: number) => (v != null ? Number(v).toFixed(2) : '不限'),
    },
    {
      title: '月度配额',
      dataIndex: 'monthly_quota',
      key: 'monthly_quota',
      width: 100,
      render: (v?: number) => (v != null ? Number(v).toFixed(2) : '不限'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => {
        const map: Record<string, [string, string]> = {
          active: ['green', '正常'],
          disabled: ['orange', '禁用'],
          banned: ['red', '封禁'],
        };
        const [color, label] = map[status] || ['default', status];
        return <Tag color={color}>{label}</Tag>;
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>余额监控</Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            fetchApiBalance();
            fetchUsers({ per_page: 50 });
          }}
        >
          刷新
        </Button>
      </div>

      {/* API账户余额卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Spin spinning={apiBalanceLoading}>
              <Statistic
                title="豆绘API账户余额"
                value={apiBalance?.balance ?? 0}
                precision={2}
                prefix={<DollarOutlined />}
                suffix="元"
                valueStyle={{ color: apiBalance?.warning ? '#ff4d4f' : '#52c41a', fontSize: 28 }}
              />
              {apiBalance?.warning && (
                <Alert
                  type="warning"
                  icon={<WarningOutlined />}
                  message={`余额低于 ${apiBalance.warning_threshold} 元，请及时充值`}
                  style={{ marginTop: 12 }}
                  showIcon
                />
              )}
              {apiBalance && !apiBalance.warning && (
                <div style={{ marginTop: 8, color: '#52c41a', fontSize: 12 }}>
                  <CheckCircleOutlined /> 余额充足
                </div>
              )}
              {apiBalance && (
                <div style={{ marginTop: 4, color: '#999', fontSize: 12 }}>
                  AppID: {apiBalance.app_id}
                </div>
              )}
            </Spin>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="系统用户总数"
              value={userTotal}
              suffix="人"
              valueStyle={{ fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="低余额用户（< 10元）"
              value={lowBalanceUsers.length}
              suffix="人"
              valueStyle={{ color: lowBalanceUsers.length > 0 ? '#fa8c16' : '#52c41a', fontSize: 28 }}
            />
            {lowBalanceUsers.length > 0 && (
              <div style={{ marginTop: 8, color: '#fa8c16', fontSize: 12 }}>
                {lowBalanceUsers.slice(0, 3).map((u) => u.username).join('、')}
                {lowBalanceUsers.length > 3 && ` 等 ${lowBalanceUsers.length} 人`}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 用户余额排行 */}
      <Card title="用户配额余额排行（前50名）" extra={<span style={{ color: '#999', fontSize: 12 }}>按余额降序</span>}>
        <Table
          columns={columns}
          dataSource={topConsumers}
          rowKey="id"
          loading={userLoading}
          pagination={false}
          scroll={{ x: 900 }}
          size="small"
        />
      </Card>
    </div>
  );
};
