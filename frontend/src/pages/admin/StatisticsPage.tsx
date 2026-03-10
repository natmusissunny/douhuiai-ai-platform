/**
 * 管理后台 - 数据统计页面
 */

import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  DatePicker,
  Space,
  Table,
  Spin,
} from 'antd';
import { useAdminStore } from '../../stores/adminStore';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

export const StatisticsPage: React.FC = () => {
  const {
    projectStats,
    quotaStats,
    statsLoading,
    fetchProjectStats,
    fetchQuotaStats,
  } = useAdminStore();

  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ]);

  useEffect(() => {
    fetchProjectStats({
      start_date: dateRange[0],
      end_date: dateRange[1],
    });
    fetchQuotaStats({
      start_date: dateRange[0],
      end_date: dateRange[1],
    });
  }, [dateRange, fetchProjectStats, fetchQuotaStats]);

  const handleDateChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([
        dates[0].format('YYYY-MM-DD'),
        dates[1].format('YYYY-MM-DD'),
      ]);
    }
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Title level={2}>数据统计</Title>
        <RangePicker
          value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
          onChange={handleDateChange}
          presets={[
            { label: '最近7天', value: [dayjs().subtract(7, 'days'), dayjs()] },
            {
              label: '最近30天',
              value: [dayjs().subtract(30, 'days'), dayjs()],
            },
            {
              label: '最近90天',
              value: [dayjs().subtract(90, 'days'), dayjs()],
            },
          ]}
        />
      </div>

      {/* 项目统计 */}
      <Title level={4} className="mb-4">
        项目统计
      </Title>
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} md={12}>
          <Card title="按类型统计" loading={!projectStats}>
            {projectStats && (
              <Space direction="vertical" style={{ width: '100%' }}>
                {Object.entries(projectStats.by_type).map(([type, count]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span className="font-medium">{type}</span>
                    <span className="text-lg font-bold text-blue-600">
                      {count}
                    </span>
                  </div>
                ))}
              </Space>
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="按状态统计" loading={!projectStats}>
            {projectStats && (
              <Space direction="vertical" style={{ width: '100%' }}>
                {Object.entries(projectStats.by_status).map(([status, count]) => (
                  <div
                    key={status}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span className="font-medium">{status}</span>
                    <span className="text-lg font-bold text-green-600">
                      {count}
                    </span>
                  </div>
                ))}
              </Space>
            )}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card loading={!projectStats}>
            <div className="text-center">
              <div className="text-gray-500 mb-2">成功率</div>
              <div className="text-3xl font-bold text-green-600">
                {projectStats?.success_rate.toFixed(1)}%
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card loading={!projectStats}>
            <div className="text-center">
              <div className="text-gray-500 mb-2">平均完成时间</div>
              <div className="text-3xl font-bold text-blue-600">
                {projectStats?.avg_completion_time.toFixed(1)}s
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card loading={!projectStats}>
            <div className="text-center">
              <div className="text-gray-500 mb-2">热门功能数</div>
              <div className="text-3xl font-bold text-purple-600">
                {projectStats?.popular_features.length || 0}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 配额统计 */}
      <Title level={4} className="mb-4">
        配额统计
      </Title>
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} md={8}>
          <Card loading={!quotaStats}>
            <div className="text-center">
              <div className="text-gray-500 mb-2">总充值</div>
              <div className="text-3xl font-bold text-green-600">
                ¥{quotaStats?.total_recharged.toFixed(2)}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card loading={!quotaStats}>
            <div className="text-center">
              <div className="text-gray-500 mb-2">总消耗</div>
              <div className="text-3xl font-bold text-red-600">
                ¥{quotaStats?.total_consumed.toFixed(2)}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card loading={!quotaStats}>
            <div className="text-center">
              <div className="text-gray-500 mb-2">平均充值</div>
              <div className="text-3xl font-bold text-blue-600">
                ¥{quotaStats?.avg_recharge.toFixed(2)}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 配额消耗排行榜 */}
      <Title level={4} className="mb-4">
        配额消耗排行榜
      </Title>
      <Card>
        <Table
          dataSource={quotaStats?.top_consumers || []}
          loading={!quotaStats}
          pagination={false}
          columns={[
            {
              title: '排名',
              key: 'rank',
              width: 80,
              render: (_: any, __: any, index: number) => index + 1,
            },
            {
              title: '用户ID',
              dataIndex: 'user_id',
              key: 'user_id',
              width: 100,
            },
            {
              title: '用户名',
              dataIndex: 'username',
              key: 'username',
            },
            {
              title: '消耗金额',
              dataIndex: 'consumed',
              key: 'consumed',
              render: (consumed: number) => (
                <span className="font-semibold text-red-600">
                  ¥{consumed.toFixed(2)}
                </span>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};
