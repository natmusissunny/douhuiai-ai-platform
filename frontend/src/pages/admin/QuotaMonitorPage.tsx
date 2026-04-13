/**
 * 管理后台 - 配额监控页面
 * 展示系统配额概览 + 每个用户的配额分配/使用/余额
 */

import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Typography,
  Statistic,
  Row,
  Col,
  Tag,
  Progress,
  Spin,
} from 'antd';
import {
  ReloadOutlined,
  WalletOutlined,
  ShoppingCartOutlined,
  BankOutlined,
  CloudOutlined,
} from '@ant-design/icons';
import { getQuotaStats, getUserQuotaUsage } from '../../api/admin';
import { getAccountBalance } from '../../api/common';
import type { UserQuotaUsageItem } from '../../api/admin';

const { Title } = Typography;

export const QuotaMonitorPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [quotaStats, setQuotaStats] = useState<{
    total_recharged: number;
    total_consumed: number;
    balance: number;
    transactions_today: number;
    transactions_this_month: number;
  } | null>(null);
  const [userUsage, setUserUsage] = useState<UserQuotaUsageItem[]>([]);
  const [apiBalance, setApiBalance] = useState<number | null>(null);

  /** 加载全部数据 */
  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, usageRes, balanceRes] = await Promise.all([
        getQuotaStats(),
        getUserQuotaUsage(),
        getAccountBalance().catch(() => null),
      ]);
      setQuotaStats(statsRes as any);
      setUserUsage((usageRes as any).items ?? []);
      setApiBalance((balanceRes as any)?.data?.balance ?? null);
    } catch {
      // 静默处理，不阻塞页面
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /** 用户配额表格列定义 */
  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 130,
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
      render: (role: string) => <Tag color="blue">{role}</Tag>,
    },
    {
      title: '总充值(豆点)',
      dataIndex: 'total_recharged',
      key: 'total_recharged',
      width: 130,
      render: (v: number) => (
        <span style={{ color: '#52c41a', fontWeight: 600 }}>
          +{Number(v).toFixed(2)}
        </span>
      ),
    },
    {
      title: '总消耗(豆点)',
      dataIndex: 'total_consumed',
      key: 'total_consumed',
      width: 130,
      render: (v: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
          -{Number(v).toFixed(2)}
        </span>
      ),
    },
    {
      title: '当前余额(豆点)',
      dataIndex: 'quota_balance',
      key: 'quota_balance',
      width: 140,
      render: (v: number) => (
        <span style={{
          color: v < 10 ? '#ff4d4f' : v < 50 ? '#fa8c16' : '#52c41a',
          fontWeight: 600,
        }}>
          {Number(v).toFixed(2)}
        </span>
      ),
    },
    {
      title: '使用率',
      key: 'usage_rate',
      width: 160,
      render: (_: any, record: UserQuotaUsageItem) => {
        const total = record.total_recharged;
        if (total === 0) return <span style={{ color: '#999' }}>未充值</span>;
        const rate = Math.round((record.total_consumed / total) * 100);
        return (
          <Progress
            percent={rate}
            size="small"
            strokeColor={rate > 90 ? '#ff4d4f' : rate > 70 ? '#fa8c16' : '#52c41a'}
          />
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
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
        <Title level={2} style={{ margin: 0 }}>配额监控</Title>
        <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
          刷新
        </Button>
      </div>

      {/* 系统配额概览 */}
      <Spin spinning={loading}>
        {/* 第一行：豆绘API上游余额 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="豆绘API剩余豆点（上游账户）"
                value={apiBalance ?? 0}
                prefix={<CloudOutlined />}
                valueStyle={{ color: apiBalance !== null && apiBalance < 1000 ? '#ff4d4f' : '#3f8600', fontSize: 28 }}
              />
              {apiBalance !== null && apiBalance < 1000 && (
                <div style={{ marginTop: 8, color: '#ff4d4f', fontSize: 12 }}>
                  上游余额不足，请尽快充值豆绘API账户
                </div>
              )}
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="系统用户总分配豆点"
                value={quotaStats?.total_recharged ?? 0}
                precision={2}
                prefix={<WalletOutlined />}
                valueStyle={{ color: '#52c41a', fontSize: 28 }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="系统用户总消耗豆点"
                value={quotaStats?.total_consumed ?? 0}
                precision={2}
                prefix={<ShoppingCartOutlined />}
                valueStyle={{ color: '#ff4d4f', fontSize: 28 }}
              />
            </Card>
          </Col>
        </Row>
        {/* 第二行：余额与交易统计 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <Card>
              <Statistic
                title="用户剩余豆点合计"
                value={quotaStats?.balance ?? 0}
                precision={2}
                prefix={<BankOutlined />}
                valueStyle={{ fontSize: 28 }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <Statistic
                title="今日交易笔数"
                value={quotaStats?.transactions_today ?? 0}
                suffix="笔"
                valueStyle={{ fontSize: 28 }}
              />
              <div style={{ marginTop: 4, color: '#999', fontSize: 12 }}>
                本月共 {quotaStats?.transactions_this_month ?? 0} 笔
              </div>
            </Card>
          </Col>
        </Row>
      </Spin>

      {/* 用户配额使用详情 */}
      <Card
        title="用户配额使用详情"
        extra={<span style={{ color: '#999', fontSize: 12 }}>按余额降序排列</span>}
      >
        <Table
          columns={columns}
          dataSource={userUsage}
          rowKey="user_id"
          loading={loading}
          scroll={{ x: 1100 }}
          size="small"
          pagination={userUsage.length > 20 ? { pageSize: 20, showTotal: (t) => `共 ${t} 位用户` } : false}
        />
      </Card>
    </div>
  );
};
