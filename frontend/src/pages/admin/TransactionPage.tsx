/**
 * 管理后台 - 配额流水记录页面
 */

import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Tag,
  Select,
  DatePicker,
  Typography,
  InputNumber,
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useAdminStore } from '../../stores/adminStore';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const TYPE_OPTIONS = [
  { value: 'charge', label: '充值' },
  { value: 'consume', label: '消费' },
  { value: 'refund', label: '退款' },
  { value: 'gift', label: '赠送' },
  { value: 'admin_set', label: '管理设置' },
  { value: 'admin_add', label: '管理增加' },
  { value: 'admin_subtract', label: '管理扣除' },
  { value: 'recharge', label: '充值(旧)' },
];

export const TransactionPage: React.FC = () => {
  const {
    transactions,
    transactionTotal,
    transactionLoading,
    fetchTransactions,
  } = useAdminStore();

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [userId, setUserId] = useState<number | undefined>();
  const [typeFilter, setTypeFilter] = useState<string>();
  const [dateRange, setDateRange] = useState<[string, string] | undefined>();

  useEffect(() => {
    fetchTransactions({
      page,
      per_page: perPage,
      user_id: userId,
      type: typeFilter,
      start_date: dateRange?.[0],
      end_date: dateRange?.[1],
    });
  }, [page, perPage, userId, typeFilter, dateRange, fetchTransactions]);

  const handleRefresh = () => {
    fetchTransactions({
      page,
      per_page: perPage,
      user_id: userId,
      type: typeFilter,
      start_date: dateRange?.[0],
      end_date: dateRange?.[1],
    });
  };

  const handleDateChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([
        dates[0].format('YYYY-MM-DD'),
        dates[1].format('YYYY-MM-DD'),
      ]);
    } else {
      setDateRange(undefined);
    }
    setPage(1);
  };

  // 类型颜色和文本映射
  const typeConfig: Record<string, { color: string; label: string }> = {
    charge: { color: 'green', label: '充值' },
    consume: { color: 'red', label: '消费' },
    refund: { color: 'blue', label: '退款' },
    gift: { color: 'purple', label: '赠送' },
    admin_set: { color: 'orange', label: '管理设置' },
    admin_add: { color: 'cyan', label: '管理增加' },
    admin_subtract: { color: 'volcano', label: '管理扣除' },
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      width: 130,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type: string) => {
        const cfg = typeConfig[type] || { color: 'default', label: type };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 110,
      render: (amount: number) => {
        const num = Number(amount);
        return (
          <span style={{ color: num > 0 ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}>
            {num > 0 ? '+' : ''}{num.toFixed(2)}
          </span>
        );
      },
    },
    {
      title: '变动后余额',
      dataIndex: 'balance_after',
      key: 'balance_after',
      width: 120,
      render: (v: number) => Number(v).toFixed(2),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 180,
      render: (v?: string) => v || '-',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 180,
      render: (v?: string) => v || '-',
    },
    {
      title: '操作员',
      dataIndex: 'operator_username',
      key: 'operator_username',
      width: 120,
      render: (v?: string) => v || '-',
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (time: string) => new Date(time).toLocaleString('zh-CN'),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>配额流水</Title>
      </div>

      {/* 筛选栏 */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <InputNumber
          placeholder="按用户ID筛选"
          style={{ width: 160 }}
          min={1}
          value={userId}
          onChange={(v) => { setUserId(v ?? undefined); setPage(1); }}
        />
        <Select
          placeholder="流水类型"
          style={{ width: 150 }}
          allowClear
          onChange={(v) => { setTypeFilter(v || undefined); setPage(1); }}
          options={TYPE_OPTIONS}
        />
        <RangePicker
          onChange={handleDateChange}
          placeholder={['开始日期', '结束日期']}
        />
        <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
          刷新
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={transactions}
        rowKey="id"
        loading={transactionLoading}
        scroll={{ x: 1300 }}
        pagination={{
          current: page,
          pageSize: perPage,
          total: transactionTotal,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
          onChange: (newPage, newPerPage) => {
            setPage(newPage);
            setPerPage(newPerPage || 20);
          },
        }}
      />
    </div>
  );
};
