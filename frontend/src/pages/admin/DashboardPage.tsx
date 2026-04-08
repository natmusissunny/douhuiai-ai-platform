/**
 * 管理后台 - 数据概览页面
 */

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Alert } from 'antd';
import {
  UserOutlined,
  ProjectOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  CloudOutlined,
} from '@ant-design/icons';
import { useAdminStore } from '../../stores/adminStore';
import { getAccountBalance } from '../../api/common';

const { Title } = Typography;

export const DashboardPage: React.FC = () => {
  const { systemStats, statsLoading, fetchSystemStats } = useAdminStore();
  const [apiBalance, setApiBalance] = useState<number | null>(null);
  const [apiBalanceLoading, setApiBalanceLoading] = useState(false);

  useEffect(() => {
    fetchSystemStats();
    // 获取豆绘API上游账户余额
    setApiBalanceLoading(true);
    getAccountBalance()
      .then((res) => setApiBalance(res?.data?.balance ?? null))
      .catch(() => setApiBalance(null))
      .finally(() => setApiBalanceLoading(false));
  }, [fetchSystemStats]);

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!systemStats) {
    return null;
  }

  // 安全取数值，undefined/null 默认为 0
  const recharged = Number(systemStats.total_quota_recharged) || 0;
  const consumed = Number(systemStats.total_quota_consumed) || 0;

  return (
    <div>
      <Title level={2}>数据概览</Title>

      {/* 豆绘API上游账户余额 */}
      <Title level={4} className="mt-2 mb-4">
        API账户（上游豆绘AI）
      </Title>
      <Row gutter={[16, 16]} className="mb-2">
        <Col xs={24} sm={12} lg={8}>
          <Card loading={apiBalanceLoading}>
            <Statistic
              title="豆绘API剩余豆点"
              value={apiBalance ?? 0}
              prefix={<CloudOutlined />}
              valueStyle={{ color: apiBalance !== null && apiBalance < 1000 ? '#ff4d4f' : '#3f8600' }}
            />
            {apiBalance !== null && apiBalance < 1000 && (
              <Alert
                message="API余额不足，请尽快充值"
                type="warning"
                showIcon
                style={{ marginTop: 8 }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="已分配给用户（总余额）"
              value={recharged - consumed}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="可分配额度"
              value={Math.max((apiBalance ?? 0) - (recharged - consumed), 0)}
              prefix={<DollarOutlined />}
              precision={0}
              valueStyle={{ color: '#722ed1' }}
              suffix="豆点"
            />
          </Card>
        </Col>
      </Row>

      {/* 用户统计 */}
      <Title level={4} className="mt-6 mb-4">
        用户统计
      </Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={systemStats.total_users}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={systemStats.active_users}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日新增"
              value={systemStats.new_users_today}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="本周新增"
              value={systemStats.new_users_this_week}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 项目统计 */}
      <Title level={4} className="mt-6 mb-4">
        项目统计
      </Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总项目数"
              value={systemStats.total_projects}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="进行中"
              value={systemStats.pending_projects}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日完成"
              value={systemStats.completed_projects_today}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日失败"
              value={systemStats.failed_projects_today}
              prefix={<FallOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 配额统计 */}
      <Title level={4} className="mt-6 mb-4">
        配额统计
      </Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="总充值配额"
              value={recharged}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="总消耗配额"
              value={consumed}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="用户配额余额"
              value={recharged - consumed}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 收入统计 */}
      <Title level={4} className="mt-6 mb-4">
        收入统计
      </Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="今日收入"
              value={systemStats.revenue_today}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="本月收入"
              value={systemStats.revenue_this_month}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              suffix="元"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
