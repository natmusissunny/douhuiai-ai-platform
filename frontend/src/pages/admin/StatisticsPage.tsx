/**
 * 管理后台 - 数据统计页面
 *
 * 作用：展示平台运营核心指标
 * - 项目统计：按类型/状态分布、成功率、平均处理时间
 * - 配额统计：充值/消耗/退款总量、当日/当月交易量
 */

import React, { useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  DatePicker,
  Space,
  Spin,
  Empty,
} from 'antd';
import { useAdminStore } from '../../stores/adminStore';
import dayjs from 'dayjs';
import { useState } from 'react';

const { Title } = Typography;
const { RangePicker } = DatePicker;

/** 安全转数字，处理字符串/Decimal/undefined */
const toNum = (v: any): number => {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

/** 类型名称映射 */
const typeLabels: Record<string, string> = {
  text2img: '文生图',
  img2img: '图生图',
  edit: '图像编辑',
  '3d_render': '3D渲染',
  portrait: '人像写真',
  ecommerce: '产品电商',
  video: '视频创作',
  architecture: '建筑室内',
};

/** 状态名称映射 */
const statusLabels: Record<string, string> = {
  pending: '等待中',
  processing: '处理中',
  completed: '已完成',
  failed: '失败',
};

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

  // 安全读取项目统计（对齐后端实际返回字段）
  const byType = projectStats?.by_type || {};
  const byStatus = projectStats?.by_status || {};
  const successRate = toNum(projectStats?.success_rate);
  // 后端返回 avg_processing_time，前端之前写的是 avg_completion_time
  const avgTime = toNum(
    (projectStats as any)?.avg_processing_time ?? (projectStats as any)?.avg_completion_time
  );

  // 安全读取配额统计（后端 Decimal 序列化为字符串，需要 Number() 转换）
  const totalRecharged = toNum(quotaStats?.total_recharged);
  const totalConsumed = toNum(quotaStats?.total_consumed);
  const totalRefunded = toNum((quotaStats as any)?.total_refunded);
  const quotaBalance = toNum((quotaStats as any)?.balance);
  const txToday = toNum((quotaStats as any)?.transactions_today);
  const txMonth = toNum((quotaStats as any)?.transactions_this_month);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Title level={2}>数据统计</Title>
        <RangePicker
          value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
          onChange={handleDateChange}
          presets={[
            { label: '最近7天', value: [dayjs().subtract(7, 'days'), dayjs()] },
            { label: '最近30天', value: [dayjs().subtract(30, 'days'), dayjs()] },
            { label: '最近90天', value: [dayjs().subtract(90, 'days'), dayjs()] },
          ]}
        />
      </div>

      {/* 项目统计 */}
      <Title level={4} className="mb-4">项目统计</Title>
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} md={12}>
          <Card title="按类型统计">
            {Object.keys(byType).length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                {Object.entries(byType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium">{typeLabels[type] || type}</span>
                    <span className="text-lg font-bold text-blue-600">{count}</span>
                  </div>
                ))}
              </Space>
            ) : (
              <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="按状态统计">
            {Object.keys(byStatus).length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                {Object.entries(byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium">{statusLabels[status] || status}</span>
                    <span className="text-lg font-bold text-green-600">{count}</span>
                  </div>
                ))}
              </Space>
            ) : (
              <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <div className="text-center">
              <div className="text-gray-500 mb-2">成功率</div>
              <div className="text-3xl font-bold text-green-600">
                {successRate.toFixed(1)}%
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <div className="text-center">
              <div className="text-gray-500 mb-2">平均处理时间</div>
              <div className="text-3xl font-bold text-blue-600">
                {avgTime.toFixed(1)}s
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <div className="text-center">
              <div className="text-gray-500 mb-2">任务总数</div>
              <div className="text-3xl font-bold text-purple-600">
                {Object.values(byStatus).reduce((a: number, b: any) => a + toNum(b), 0)}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 配额统计 */}
      <Title level={4} className="mb-4">配额统计</Title>
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} md={6}>
          <Card>
            <div className="text-center">
              <div className="text-gray-500 mb-2">总充值</div>
              <div className="text-2xl font-bold text-green-600">
                {totalRecharged.toFixed(2)}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <div className="text-center">
              <div className="text-gray-500 mb-2">总消耗</div>
              <div className="text-2xl font-bold text-red-600">
                {totalConsumed.toFixed(2)}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <div className="text-center">
              <div className="text-gray-500 mb-2">总退款</div>
              <div className="text-2xl font-bold text-orange-500">
                {totalRefunded.toFixed(2)}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <div className="text-center">
              <div className="text-gray-500 mb-2">配额余额</div>
              <div className="text-2xl font-bold text-blue-600">
                {quotaBalance.toFixed(2)}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card>
            <div className="text-center">
              <div className="text-gray-500 mb-2">今日交易笔数</div>
              <div className="text-2xl font-bold text-gray-800">{txToday}</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card>
            <div className="text-center">
              <div className="text-gray-500 mb-2">本月交易笔数</div>
              <div className="text-2xl font-bold text-gray-800">{txMonth}</div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
